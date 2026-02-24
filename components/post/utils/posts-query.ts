import type { InfiniteData } from "@tanstack/react-query";
import type { PostFeedItem } from "@/lib/actions/post";

export type PostsPage = { posts: PostFeedItem[]; nextCursor: string | null };

export function updatePostInInfiniteCache(
  data: InfiniteData<PostsPage> | undefined,
  postId: string,
  updater: (post: PostFeedItem) => PostFeedItem
): InfiniteData<PostsPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      posts: page.posts.map((p) => (p.id === postId ? updater(p) : p)),
    })),
  };
}

export function removePostFromInfiniteCache(
  data: InfiniteData<PostsPage> | undefined,
  postId: string
): InfiniteData<PostsPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      posts: page.posts.filter((p) => p.id !== postId),
    })),
  };
}
