"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  createCommentSchema,
  updateCommentSchema,
} from "@/lib/validations/comment";
import { getCurrentUser } from "./auth";
import { uploadImage } from "@/lib/supabase/storage";
import { tryCatch } from "@/lib/try-catch";
import type { ActionResult } from "./types";

const BUCKET = "comment-images";

export type DeleteCommentResult =
  | { success: true; deletedCount: number }
  | { success: false; error: string };

export async function createCommentAction(
  formData: FormData
): Promise<ActionResult> {
  const content = formData.get("content");
  const postId = formData.get("postId");
  const parentId = formData.get("parentId");
  const imageFile = formData.get("image");

  const parsed = createCommentSchema.safeParse({
    content: typeof content === "string" ? content : "",
    postId: typeof postId === "string" ? postId : "",
    parentId: typeof parentId === "string" ? parentId : undefined,
    image:
      imageFile instanceof File && imageFile.size > 0 ? imageFile : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().formErrors[0] ?? "Validation failed",
    };
  }

  let imageUrl: string | null = null;
  if (parsed.data.image instanceof File) {
    const { url, error } = await uploadImage(parsed.data.image, BUCKET);
    if (error || !url) {
      return { success: false, error: error ?? "Failed to upload image" };
    }
    imageUrl = url;
  }

  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const { error: dbError } = await tryCatch(
    db.comment.create({
      data: {
        content: parsed.data.content,
        postId: parsed.data.postId,
        parentId: parsed.data.parentId,
        imageUrl,
        authorId: user?.id ?? null,
        guestId: user ? null : (guestId ?? null),
      },
    })
  );

  if (dbError) {
    console.error("Create comment error:", dbError);
    return { success: false, error: "Failed to create comment" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function updateCommentAction(
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id");
  const content = formData.get("content");

  const parsed = updateCommentSchema.safeParse({
    id: typeof id === "string" ? id : "",
    content: typeof content === "string" ? content : "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().formErrors[0] ?? "Validation failed",
    };
  }

  const comment = await db.comment.findUnique({
    where: { id: parsed.data.id },
  });

  if (!comment) {
    return { success: false, error: "Comment not found" };
  }

  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const isOwner =
    (user && comment.authorId === user.id) ||
    (!user && guestId && comment.guestId === guestId);

  if (!isOwner) {
    return { success: false, error: "Unauthorized: You are not the author" };
  }

  const { error: dbUpdateError } = await tryCatch(
    db.comment.update({
      where: { id: parsed.data.id },
      data: {
        content: parsed.data.content,
      },
    })
  );

  if (dbUpdateError) {
    return { success: false, error: "Failed to update comment" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteCommentAction(
  id: string
): Promise<DeleteCommentResult> {
  const comment = await db.comment.findUnique({
    where: { id },
  });

  if (!comment) {
    return { success: false, error: "Comment not found" };
  }

  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const isOwner =
    (user && comment.authorId === user.id) ||
    (!user && guestId && comment.guestId === guestId);

  if (!isOwner) {
    return { success: false, error: "Unauthorized: You are not the author" };
  }

  const descendantIds: string[] = [];
  let parentIds: string[] = [id];
  while (parentIds.length > 0) {
    const replies = await db.comment.findMany({
      where: { parentId: { in: parentIds } },
      select: { id: true },
    });
    const newIds = replies.map((r) => r.id).filter((rid) => !descendantIds.includes(rid));
    descendantIds.push(...newIds);
    parentIds = newIds;
  }

  const idsToDelete = [id, ...descendantIds];
  const { error: dbDeleteError } = await tryCatch(
    db.comment.updateMany({
      where: { id: { in: idsToDelete } },
      data: { deletedAt: new Date() },
    })
  );

  if (dbDeleteError) {
    return { success: false, error: "Failed to delete comment" };
  }

  revalidatePath("/");
  return { success: true, deletedCount: idsToDelete.length };
}

export async function toggleCommentLikeAction(
  commentId: string
): Promise<ActionResult> {
  const user = await getCurrentUser();

  const cookieStore = await cookies();
  let guestId = cookieStore.get("guestId")?.value;

  if (!user && !guestId) {
    guestId = crypto.randomUUID();
    cookieStore.set("guestId", guestId, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  const userId = user?.id;

  const { data: existingLike, error: findLikeError } = await tryCatch(
    db.commentLike.findFirst({
      where: {
        commentId,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(guestId ? [{ guestId }] : []),
        ],
      },
    })
  );

  if (findLikeError) {
    return { success: false, error: "Failed to fetch like status" };
  }

  const { error: toggleError } = await tryCatch(
    existingLike
      ? db.commentLike.delete({ where: { id: existingLike.id } })
      : db.commentLike.create({
          data: {
            commentId,
            userId: userId ?? null,
            guestId: userId ? null : (guestId ?? null),
          },
        })
  );

  if (toggleError) {
    console.error("Toggle comment like error:", toggleError);
    return { success: false, error: "Failed to toggle like" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function getCommentsAction(postId: string) {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const { data: comments, error } = await tryCatch(
    db.comment.findMany({
      where: { postId, parentId: null, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true } },
        likes: { select: { userId: true, guestId: true } },
        replies: { where: { deletedAt: null }, select: { id: true } },
      },
    })
  );

  if (error || !comments) {
    console.error("Fetch comments error:", error);
    return [];
  }

  return comments.map((comment) => ({
    id: comment.id,
    postId: comment.postId,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: {
      name: comment.author?.name || "Anonymous",
      username:
        comment.author?.name?.toLowerCase().replace(/\s+/g, "_") || "anonymous",
    },
    likesCount: comment.likes.length,
    repliesCount: comment.replies.length,
    isLiked: comment.likes.some(
      (like) =>
        (user && like.userId === user.id) ||
        (guestId && like.guestId === guestId)
    ),
    isOwner: Boolean(
      (user && comment.authorId === user.id) ||
      (!user && guestId && comment.guestId === guestId)
    ),
  }));
}

export async function getRepliesAction(parentId: string) {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const { data: comments, error } = await tryCatch(
    db.comment.findMany({
      where: { parentId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { name: true } },
        likes: { select: { userId: true, guestId: true } },
        replies: { where: { deletedAt: null }, select: { id: true } },
      },
    })
  );

  if (error || !comments) {
    console.error("Fetch replies error:", error);
    return [];
  }

  return comments.map((comment) => ({
    id: comment.id,
    postId: comment.postId,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: {
      name: comment.author?.name || "Anonymous",
      username:
        comment.author?.name?.toLowerCase().replace(/\s+/g, "_") || "anonymous",
    },
    likesCount: comment.likes.length,
    repliesCount: comment.replies.length,
    isLiked: comment.likes.some(
      (like) =>
        (user && like.userId === user.id) ||
        (guestId && like.guestId === guestId)
    ),
    isOwner: Boolean(
      (user && comment.authorId === user.id) ||
      (!user && guestId && comment.guestId === guestId)
    ),
  }));
}
