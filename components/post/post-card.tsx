"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Heart } from "lucide-react";
import { useState, useTransition, useOptimistic } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PostComments } from "./post-comments";
import { CommentInput } from "./comment-input";
import { togglePostLikeAction } from "@/lib/actions/post";
import { cn } from "@/lib/utils";

export type PostCardProps = {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  commentCount: number;
  likeCount: number;
  isLiked: boolean;
};

export function PostCard({
  id,
  content,
  imageUrl,
  createdAt,
  commentCount,
  likeCount: initialLikeCount,
  isLiked: initialIsLiked,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);

  const [isPending, startTransition] = useTransition();

  const [optimisticLike, addOptimisticLike] = useOptimistic(
    { isLiked: initialIsLiked, likeCount: initialLikeCount },
    (state, newIsLiked: boolean) => ({
      isLiked: newIsLiked,
      likeCount: state.likeCount + (newIsLiked ? 1 : -1),
    })
  );

  const handleLike = () => {
    startTransition(async () => {
      addOptimisticLike(!optimisticLike.isLiked);
      await togglePostLikeAction(id);
    });
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-4">
        <p className="text-sm wrap-break-word whitespace-pre-wrap">{content}</p>
        {imageUrl && (
          <img
            src={imageUrl}
            className="mt-3 max-h-96 w-full rounded-lg object-cover"
          />
        )}
      </CardContent>
      <CardFooter className="text-muted-foreground flex items-center gap-4 text-xs">
        <span>
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </span>
        <button
          onClick={handleLike}
          disabled={isPending}
          className={cn(
            "group flex items-center gap-1.5 transition-colors outline-none",
            optimisticLike.isLiked ? "text-red-500" : "hover:text-red-500"
          )}
        >
          <div className="-ml-1.5 rounded-full p-1.5 transition-colors group-hover:bg-red-500/10">
            <Heart
              className={cn("size-4", optimisticLike.isLiked && "fill-current")}
            />
          </div>
          {optimisticLike.likeCount}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="group flex items-center gap-1.5 transition-colors outline-none hover:text-blue-500"
        >
          <div className="-ml-1.5 rounded-full p-1.5 transition-colors group-hover:bg-blue-500/10">
            <MessageCircle className="size-4" />
          </div>
          {commentCount}
        </button>
        <button
          onClick={() => setShowCommentInput(!showCommentInput)}
          className="ml-auto transition-colors outline-none hover:text-blue-500"
        >
          Add comment
        </button>
      </CardFooter>
      {showCommentInput && (
        <CommentInput
          postId={id}
          onSuccess={() => setShowCommentInput(false)}
        />
      )}
      {showComments && <PostComments postId={id} />}
    </Card>
  );
}
