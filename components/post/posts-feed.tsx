"use client";

import { useQuery } from "@tanstack/react-query";
import { getPostsAction } from "@/lib/actions/post";
import { PostCard } from "./post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function PostsFeed() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => getPostsAction(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardContent className="pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
              </div>
              <Skeleton className="mt-3 h-[400px] w-full rounded-lg" />
            </CardContent>
            <CardFooter className="flex gap-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
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
    </div>
  );
}
