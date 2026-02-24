"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Pencil, Trash2, X, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { CommentType } from "./post-comments";
import { CommentInput } from "./comment-input";
import { useCommentReplies } from "./hooks/use-comment-replies";
import { useCommentEdit } from "./hooks/use-comment-edit";
import { useCommentMutations } from "./hooks/use-comment-mutations";
import { applyReplySuccessToCache } from "./utils/comment-cache";

type CommentItemProps = {
  comment: CommentType;
  parentId?: string;
  ancestorIds?: string[];
};

export function CommentItem({
  comment,
  parentId,
  ancestorIds = [],
}: CommentItemProps) {
  const queryClient = useQueryClient();
  const [showReplyInput, setShowReplyInput] = useState(false);

  const {
    showReplies,
    setShowReplies,
    replies,
    isLoadingReplies,
    fetchReplies,
    toggleReplies,
  } = useCommentReplies(comment.id);

  const {
    isEditing,
    editContent,
    setEditContent,
    startEdit,
    cancelEdit,
    buildUpdateFormData,
  } = useCommentEdit({ id: comment.id, content: comment.content });

  const { handleDelete, handleUpdate, handleLike, isPending } = useCommentMutations(
    {
      comment,
      parentId,
      ancestorIds,
      onUpdateSuccess: () => cancelEdit(),
    }
  );

  const handleSubmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = buildUpdateFormData();
    if (formData) handleUpdate(formData);
  };

  const handleReplySuccess = () => {
    setShowReplyInput(false);
    setShowReplies(true);
    fetchReplies();
    applyReplySuccessToCache({
      queryClient,
      postId: comment.postId,
      commentId: comment.id,
      parentId,
      ancestorIds,
    });
  };

  return (
    <div className="flex flex-col">
      <div className="hover:bg-muted/50 flex gap-3 p-4 transition-colors">
        <Avatar className="size-10">
          <AvatarImage src={comment.author.avatarUrl} />
          <AvatarFallback>
            {comment.author.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{comment.author.name}</span>
            <span className="text-muted-foreground">
              @{comment.author.username}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmitUpdate} className="mt-1 flex flex-col gap-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
                className="bg-muted/50 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  <Check className="size-3" /> Save
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-muted text-foreground hover:bg-muted/80 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                >
                  <X className="size-3" /> Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm wrap-break-word whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          <div className="text-muted-foreground mt-2 flex items-center gap-6 text-xs">
            <button
              onClick={toggleReplies}
              className="group flex items-center gap-1.5 transition-colors outline-none hover:text-blue-500"
            >
              <div className="-ml-1.5 rounded-full p-1.5 transition-colors group-hover:bg-blue-500/10">
                <MessageCircle className="size-4" />
              </div>
              <span>{comment.repliesCount}</span>
            </button>

            <button
              className={`group flex items-center gap-1.5 transition-colors outline-none ${comment.isLiked ? "text-pink-600" : "hover:text-pink-600"}`}
              onClick={handleLike}
              disabled={isEditing}
            >
              <div
                className={`-ml-1.5 rounded-full p-1.5 transition-colors ${comment.isLiked ? "" : "group-hover:bg-pink-600/10"}`}
              >
                <Heart
                  className={`size-4 ${comment.isLiked ? "fill-current" : ""}`}
                />
              </div>
              <span>{comment.likesCount}</span>
            </button>

            <button
              className="ml-auto transition-colors outline-none hover:text-blue-500"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              Reply
            </button>

            {comment.isOwner && (
              <div className="flex items-center gap-3">
                <button
                  onClick={startEdit}
                  className="p-1 transition-colors hover:text-blue-500"
                  title="Edit comment"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="p-1 transition-colors hover:text-red-500"
                  title="Delete comment"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReplyInput && (
        <div className="pl-14">
          <CommentInput
            postId={comment.postId}
            parentId={comment.id}
            onSuccess={handleReplySuccess}
          />
        </div>
      )}

      {showReplies && (
        <div className="ml-14 flex flex-col border-l pl-2">
          {isLoadingReplies ? (
            <div className="text-muted-foreground p-4 text-xs">
              Loading replies...
            </div>
          ) : replies.length > 0 ? (
            <div className="flex flex-col">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  parentId={comment.id}
                  ancestorIds={[comment.id, ...ancestorIds]}
                />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground p-4 text-xs">
              No replies yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
