"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  createCommentSchema,
  updateCommentSchema,
} from "@/lib/validations/comment";
import { getCurrentUser } from "./auth";

const BUCKET = "comment-images";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

async function uploadCommentImage(file: File): Promise<string | null> {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

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
    const url = await uploadCommentImage(parsed.data.image);
    if (!url) {
      return { success: false, error: "Failed to upload image" };
    }
    imageUrl = url;
  }

  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  try {
    await db.comment.create({
      data: {
        content: parsed.data.content,
        postId: parsed.data.postId,
        parentId: parsed.data.parentId,
        imageUrl,
        authorId: user?.id ?? null,
        guestId: user ? null : (guestId ?? null),
      },
    });
  } catch (err) {
    console.error("Create comment error:", err);
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

  try {
    await db.comment.update({
      where: { id: parsed.data.id },
      data: {
        content: parsed.data.content,
      },
    });
  } catch {
    return { success: false, error: "Failed to update comment" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteCommentAction(id: string): Promise<ActionResult> {
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

  try {
    await db.comment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  } catch {
    return { success: false, error: "Failed to delete comment" };
  }

  revalidatePath("/");
  return { success: true };
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

  try {
    const existingLike = await db.commentLike.findFirst({
      where: {
        commentId,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(guestId ? [{ guestId }] : []),
        ],
      },
    });

    if (existingLike) {
      await db.commentLike.delete({
        where: { id: existingLike.id },
      });
    } else {
      await db.commentLike.create({
        data: {
          commentId,
          userId: userId ?? null,
          guestId: userId ? null : (guestId ?? null),
        },
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Toggle comment like error:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function getCommentsAction(postId: string) {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const comments = await db.comment.findMany({
    where: { postId, parentId: null, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      likes: { select: { userId: true, guestId: true } },
      replies: { where: { deletedAt: null }, select: { id: true } },
    },
  });

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
    isOwner:
      (user && comment.authorId === user.id) ||
      (!user && guestId && comment.guestId === guestId)
        ? true
        : false,
  }));
}

export async function getRepliesAction(parentId: string) {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const comments = await db.comment.findMany({
    where: { parentId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { name: true } },
      likes: { select: { userId: true, guestId: true } },
      replies: { where: { deletedAt: null }, select: { id: true } },
    },
  });

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
    isOwner:
      (user && comment.authorId === user.id) ||
      (!user && guestId && comment.guestId === guestId)
        ? true
        : false,
  }));
}
