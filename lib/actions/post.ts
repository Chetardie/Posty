"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createPostSchema, updatePostSchema } from "@/lib/validations/post";
import { getCurrentUser } from "./auth";
import { uploadImage } from "@/lib/supabase/storage";
import { tryCatch } from "@/lib/try-catch";

const BUCKET = "post-images";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

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
    db.post.create({
      data: {
        content: parsed.data.content,
        imageUrl,
        authorId: user?.id ?? null,
        guestId: user ? null : (guestId ?? null),
      },
    })
  );

  if (dbError) {
    console.error("Create post error:", dbError);
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

const POSTS_PAGE_SIZE = 5;

export type GetPostsResult = {
  posts: PostFeedItem[];
  nextCursor: string | null;
};

export async function getPostsAction(
  cursor?: string | null,
  limit: number = POSTS_PAGE_SIZE
): Promise<GetPostsResult> {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const posts = await db.post.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    skip: cursor ? 1 : 0,
    ...(cursor ? { cursor: { id: cursor } } : {}),
    include: {
      author: { select: { name: true } },
      comments: { where: { deletedAt: null }, select: { id: true } },
      likes: { select: { userId: true, guestId: true } },
    },
  });

  const hasMore = posts.length > limit;
  const slice = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? slice[slice.length - 1].id : null;

  return {
    posts: slice.map((post) => ({
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
      isOwner: Boolean(
        (user && post.authorId === user.id) ||
        (!user && guestId && post.guestId === guestId)
      ),
    })),
    nextCursor,
  };
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
    const { url, error } = await uploadImage(parsed.data.image, BUCKET);
    if (error || !url) {
      return { success: false, error: error ?? "Failed to upload image" };
    }
    imageUrl = url;
  }

  const { error: dbUpdateError } = await tryCatch(
    db.post.update({
      where: { id: parsed.data.id },
      data: {
        content: parsed.data.content,
        imageUrl,
      },
    })
  );

  if (dbUpdateError) {
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

  const { error: dbDeleteError } = await tryCatch(
    db.post.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })
  );

  if (dbDeleteError) {
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

  const { data: existingLike, error: findLikeError } = await tryCatch(
    db.postLike.findFirst({
      where: {
        postId,
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
      ? db.postLike.delete({ where: { id: existingLike.id } })
      : db.postLike.create({
          data: {
            postId,
            userId: userId ?? null,
            guestId: userId ? null : (guestId ?? null),
          },
        })
  );

  if (toggleError) {
    console.error("Toggle like error:", toggleError);
    return { success: false, error: "Failed to toggle like" };
  }

  revalidatePath("/");
  return { success: true };
}
