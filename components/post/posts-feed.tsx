"use client";

import { useRef, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getPostsAction } from "@/lib/actions/post";
import { PostCard } from "./post-card";
import { PostCardSkeleton } from "./post-card-skeleton";

const PAGE_SIZE = 5;

export function PostsFeed() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["posts"],
      queryFn: ({ pageParam }) => getPostsAction(pageParam, PAGE_SIZE),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: null as string | null,
    });

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="text-muted-foreground bg-muted/10 rounded-lg border py-8 text-center">
        No posts yet. Be the first to share something!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          id={post.id}
          content={post.content}
          imageUrl={post.imageUrl}
          authorName={post.authorName}
          createdAt={post.createdAt}
          commentCount={post.commentCount}
          likeCount={post.likeCount}
          isLiked={post.isLiked}
          isOwner={post.isOwner}
        />
      ))}
      <div ref={sentinelRef} className="h-2" aria-hidden />
      {isFetchingNextPage && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <PostCardSkeleton key={`next-${i}`} />
          ))}
        </div>
      )}
    </div>
  );
}
