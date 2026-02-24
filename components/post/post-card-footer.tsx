"use client";

import { MessageCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { PostCardActionButton } from "./post-card-action-button";

type PostCardFooterProps = {
  likeCount: number;
  isLiked: boolean;
  commentCount: number;
  isEditing: boolean;
  onLike: () => void;
  onToggleComments: () => void;
  onToggleCommentInput: () => void;
};

export function PostCardFooter({
  likeCount,
  isLiked,
  commentCount,
  isEditing,
  onLike,
  onToggleComments,
  onToggleCommentInput,
}: PostCardFooterProps) {
  return (
    <footer className="text-muted-foreground flex items-center gap-4 text-xs">
      <PostCardActionButton
        onClick={onLike}
        disabled={isEditing}
        active={isLiked}
        activeClassName="text-red-500"
        inactiveHoverClassName="hover:text-red-500"
        hoverClassName="group-hover:bg-red-500/10"
        icon={
          <Heart className={cn("size-4", isLiked && "fill-current")} />
        }
      >
        {likeCount}
      </PostCardActionButton>
      <PostCardActionButton
        onClick={onToggleComments}
        disabled={isEditing}
        hoverClassName="group-hover:bg-blue-500/10"
        icon={<MessageCircle className="size-4" />}
      >
        {commentCount}
      </PostCardActionButton>
      <button
        onClick={onToggleCommentInput}
        disabled={isEditing}
        className={cn(
          "ml-auto transition-colors outline-none hover:text-blue-500",
          isEditing && "cursor-not-allowed opacity-50"
        )}
      >
        Add comment
      </button>
    </footer>
  );
}
