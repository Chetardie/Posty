"use client";

import { useQuery } from "@tanstack/react-query";

import { CommentItem } from "./comment-item";
import { getCommentsAction } from "@/lib/actions/comment";

export type CommentType = {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    username: string;
    avatarUrl?: string;
  };
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
  isOwner?: boolean;
};

export function PostComments({ postId }: { postId: string }) {
  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getCommentsAction(postId),
  });

  if (isLoading) {
    return (
      <div className="flex animate-pulse flex-col gap-4 border-t p-4 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-muted size-10 rounded-full"></div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="bg-muted h-4 w-24 rounded"></div>
            <div className="bg-muted h-4 w-full rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="text-muted-foreground border-t py-6 text-center text-sm">
        No comments yet. Be the first to share your thoughts!
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y border-t">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
