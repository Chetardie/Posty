"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { createPostSchema, updatePostSchema } from "@/lib/validations/post";
import { getCurrentUser } from "./auth";

const BUCKET = "post-images";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

async function uploadPostImage(file: File): Promise<string | null> {
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

export async function createPostAction(
  formData: FormData
): Promise<ActionResult> {
  const content = formData.get("content");
  const imageFile = formData.get("image");

  const parsed = createPostSchema.safeParse({
    content: typeof content === "string" ? content : "",
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
    const url = await uploadPostImage(parsed.data.image);
    if (!url) {
      return { success: false, error: "Failed to upload image" };
    }
    imageUrl = url;
  }

  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  try {
    await db.post.create({
      data: {
        content: parsed.data.content,
        imageUrl,
        authorId: user?.id ?? null,
        guestId: user ? null : (guestId ?? null),
      },
    });
  } catch (error) {
    console.error("Create post error:", error);
    return { success: false, error: "Failed to create post" };
  }

  revalidatePath("/");
  return { success: true };
}

export type PostFeedItem = {
  id: string;
  content: string;
  imageUrl: string | null;
  authorName: string;
  createdAt: string;
  commentCount: number;
  likeCount: number;
  isLiked: boolean;
  authorId: string | null;
  guestId: string | null;
  isOwner: boolean;
};

export async function getPostsAction(): Promise<PostFeedItem[]> {
  const user = await getCurrentUser();

  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const posts = await db.post.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      comments: { where: { deletedAt: null }, select: { id: true } },
      likes: { select: { userId: true, guestId: true } },
    },
  });

  return posts.map((post) => ({
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    authorName: post.author?.name || "Anonymous",
    createdAt: post.createdAt.toISOString(),
    commentCount: post.comments.length,
    likeCount: post.likes.length,
    isLiked: post.likes.some(
      (like) =>
        (user && like.userId === user.id) ||
        (guestId && like.guestId === guestId)
    ),
    authorId: post.authorId,
    guestId: post.guestId,
    isOwner:
      (user && post.authorId === user.id) ||
      (!user && guestId && post.guestId === guestId)
        ? true
        : false,
  }));
}

export async function updatePostAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const id = formData.get("id");
  const content = formData.get("content");
  const imageFile = formData.get("image");
  const removeImage = formData.get("removeImage") === "true";

  const parsed = updatePostSchema.safeParse({
    id: typeof id === "string" ? id : "",
    content: typeof content === "string" ? content : "",
    image:
      imageFile instanceof File && imageFile.size > 0 ? imageFile : undefined,
    removeImage,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().formErrors[0] ?? "Validation failed",
    };
  }

  // Check ownership
  const post = await db.post.findUnique({
    where: { id: parsed.data.id },
  });

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  const isOwner =
    (user && post.authorId === user.id) ||
    (!user && guestId && post.guestId === guestId);

  if (!isOwner) {
    return { success: false, error: "Unauthorized: You are not the author" };
  }

  let imageUrl = post.imageUrl;

  if (parsed.data.removeImage) {
    imageUrl = null;
  }

  if (parsed.data.image instanceof File) {
    const url = await uploadPostImage(parsed.data.image);
    if (!url) {
      return { success: false, error: "Failed to upload image" };
    }
    imageUrl = url;
  }

  try {
    await db.post.update({
      where: { id: parsed.data.id },
      data: {
        content: parsed.data.content,
        imageUrl,
      },
    });
  } catch {
    return { success: false, error: "Failed to update post" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const post = await db.post.findUnique({
    where: { id },
  });

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  const isOwner =
    (user && post.authorId === user.id) ||
    (!user && guestId && post.guestId === guestId);

  if (!isOwner) {
    return { success: false, error: "Unauthorized: You are not the author" };
  }

  try {
    await db.post.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  } catch {
    return { success: false, error: "Failed to delete post" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function togglePostLikeAction(
  postId: string
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
    const existingLike = await db.postLike.findFirst({
      where: {
        postId,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(guestId ? [{ guestId }] : []),
        ],
      },
    });

    if (existingLike) {
      await db.postLike.delete({
        where: { id: existingLike.id },
      });
    } else {
      await db.postLike.create({
        data: {
          postId,
          userId: userId ?? null,
          guestId: userId ? null : (guestId ?? null),
        },
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Toggle like error:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}
