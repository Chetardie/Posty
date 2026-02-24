"use client";

import { useRef, useEffect, useLayoutEffect, useState, useReducer } from "react";
import { flushSync } from "react-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { getPostsAction } from "@/lib/actions/post";
import { PostCard } from "./post-card";
import { PostCardSkeleton } from "./post-card-skeleton";

const PAGE_SIZE = 5;
const ESTIMATE_SIZE = 280;
const OVERSCAN = 3;

export function PostsFeed() {
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [, forceRender] = useReducer(() => ({}), {});
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["posts"],
      queryFn: ({ pageParam }) => getPostsAction(pageParam, PAGE_SIZE),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: null as string | null,
    });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  useLayoutEffect(() => {
    if (!listRef.current) return;
    setScrollMargin(listRef.current.offsetTop);
  }, [posts.length]);

  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => ESTIMATE_SIZE,
    overscan: OVERSCAN,
    scrollMargin,
    getItemKey: (index) => posts[index]?.id ?? index,
    onChange: (_, sync) => {
      if (!sync) {
        queueMicrotask(() => flushSync(forceRender));
      }
    },
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

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div ref={listRef} className="relative w-full">
      <div
        className="relative w-full"
        style={{ height: totalSize }}
      >
        {virtualItems.map((virtualRow) => {
          const post = posts[virtualRow.index];
          return (
            <div
              key={post.id}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              className="absolute left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
              }}
            >
              <div className="pb-4">
                <PostCard
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
              </div>
            </div>
          );
        })}
      </div>
      <div ref={sentinelRef} className="h-2" aria-hidden />
      {isFetchingNextPage && (
        <div className="space-y-4 pt-4">
          {[1, 2].map((i) => (
            <PostCardSkeleton key={`next-${i}`} />
          ))}
        </div>
      )}
    </div>
  );
}
