"use server";

import { db } from "@/lib/db";
import { PostFeedItem } from "./post";
import { createClient } from "@/lib/supabase/server";

export async function getUserPostsAction(
  userId: string
): Promise<PostFeedItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const posts = await db.post.findMany({
    where: {
      authorId: userId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      comments: { where: { deletedAt: null }, select: { id: true } },
      likes: { select: { userId: true } },
    },
  });

  return posts.map((post) => ({
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    authorId: post.authorId,
    createdAt: post.createdAt.toISOString(),
    commentCount: post.comments.length,
    likeCount: post.likes.length,
    isLiked: user ? post.likes.some((like) => like.userId === user.id) : false,
  }));
}

export async function getUserLikedPostsAction(
  userId: string
): Promise<PostFeedItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const likedPosts = await db.postLike.findMany({
    where: { userId },
    include: {
      post: {
        include: {
          comments: { where: { deletedAt: null }, select: { id: true } },
          likes: { select: { userId: true } },
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
    createdAt: like.post.createdAt.toISOString(),
    commentCount: like.post.comments.length,
    likeCount: like.post.likes.length,
    isLiked: user ? like.post.likes.some((l) => l.userId === user.id) : false,
  }));
}

export async function getUserCommentsAction(userId: string) {
  const comments = await db.comment.findMany({
    where: {
      authorId: userId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      post: { select: { id: true, content: true } },
      likes: { select: { userId: true } },
    },
  });

  return comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    likeCount: c.likes.length,
  }));
}
