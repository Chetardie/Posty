"use server";

import { db } from "@/lib/db";
import { PostFeedItem } from "./post";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getUserPostsAction(
  userId: string
): Promise<PostFeedItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const posts = await db.post.findMany({
    where: {
      authorId: userId,
      deletedAt: null,
    },
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
    authorId: post.authorId,
    guestId: post.guestId,
    authorName: post.author?.name || "Anonymous",
    createdAt: post.createdAt.toISOString(),
    commentCount: post.comments.length,
    likeCount: post.likes.length,
    isLiked: post.likes.some(
      (like) =>
        (user && like.userId === user.id) ||
        (guestId && like.guestId === guestId)
    ),
    isOwner: Boolean(
      (user && post.authorId === user.id) ||
      (!user && guestId && post.guestId === guestId)
    ),
  }));
}

export async function getUserLikedPostsAction(
  userId: string
): Promise<PostFeedItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const likedPosts = await db.postLike.findMany({
    where: { userId },
    include: {
      post: {
        include: {
          author: { select: { name: true } },
          comments: { where: { deletedAt: null }, select: { id: true } },
          likes: { select: { userId: true, guestId: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return likedPosts.map((like) => ({
    id: like.post.id,
    content: like.post.content,
    imageUrl: like.post.imageUrl,
    authorId: like.post.authorId,
    guestId: like.post.guestId,
    authorName: like.post.author?.name || "Anonymous",
    createdAt: like.post.createdAt.toISOString(),
    commentCount: like.post.comments.length,
    likeCount: like.post.likes.length,
    isLiked: like.post.likes.some(
      (l) =>
        (user && l.userId === user.id) || (guestId && l.guestId === guestId)
    ),
    isOwner: Boolean(
      (user && like.post.authorId === user.id) ||
      (!user && guestId && like.post.guestId === guestId)
    ),
  }));
}

export async function getUserCommentsAction(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;

  const comments = await db.comment.findMany({
    where: {
      authorId: userId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      post: { select: { id: true, content: true } },
      author: { select: { name: true } },
      likes: { select: { userId: true, guestId: true } },
      replies: { where: { deletedAt: null }, select: { id: true } },
    },
  });

  return comments.map((c) => ({
    id: c.id,
    postId: c.postId,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    post: c.post,
    author: {
      name: c.author?.name || "Anonymous",
      username:
        c.author?.name?.toLowerCase().replace(/\s+/g, "_") || "anonymous",
    },
    likesCount: c.likes.length,
    repliesCount: c.replies.length,
    isLiked: c.likes.some(
      (like) =>
        (user && like.userId === user.id) ||
        (guestId && like.guestId === guestId)
    ),
    isOwner: Boolean(
      (user && c.authorId === user.id) ||
      (!user && guestId && c.guestId === guestId)
    ),
  }));
}
