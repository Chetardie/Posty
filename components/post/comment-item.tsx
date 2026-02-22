"use client";

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Pencil, Trash2, X, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type CommentType } from "./post-comments";
import { CommentInput } from "./comment-input";
import {
  getRepliesAction,
  deleteCommentAction,
  updateCommentAction,
} from "@/lib/actions/comment";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CommentItem({ comment }: { comment: CommentType }) {
  const [isLiked, setIsLiked] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replies, setReplies] = useState<CommentType[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isPending, setIsPending] = useState(false);

  const fetchReplies = useCallback(async () => {
    setIsLoadingReplies(true);
    try {
      const fetchedReplies = await getRepliesAction(comment.id);
      setReplies(fetchedReplies);
    } catch (err) {
      console.error("Failed to load replies:", err);
    } finally {
      setIsLoadingReplies(false);
    }
  }, [comment.id]);

  const handleToggleReplies = () => {
    if (!showReplies) {
      setShowReplies(true);
      fetchReplies();
    } else {
      setShowReplies(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      setIsPending(true);
      const result = await deleteCommentAction(comment.id);
      if (!result.success) {
        alert(result.error);
      }
      setIsPending(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    setIsPending(true);
    const formData = new FormData();
    formData.append("id", comment.id);
    formData.append("content", editContent);

    const result = await updateCommentAction(formData);
    if (result.success) {
      setIsEditing(false);
    } else {
      alert(result.error);
    }
    setIsPending(false);
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
            <form onSubmit={handleUpdate} className="mt-1 flex flex-col gap-2">
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
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
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
              onClick={handleToggleReplies}
              className="group flex items-center gap-1.5 transition-colors outline-none hover:text-blue-500"
            >
              <div className="-ml-1.5 rounded-full p-1.5 transition-colors group-hover:bg-blue-500/10">
                <MessageCircle className="size-4" />
              </div>
              <span>{comment.repliesCount}</span>
            </button>

            <button
              className={`group flex items-center gap-1.5 transition-colors outline-none ${isLiked ? "text-pink-600" : "hover:text-pink-600"}`}
              onClick={() => setIsLiked(!isLiked)}
            >
              <div
                className={`-ml-1.5 rounded-full p-1.5 transition-colors ${isLiked ? "" : "group-hover:bg-pink-600/10"}`}
              >
                <Heart className={`size-4 ${isLiked ? "fill-current" : ""}`} />
              </div>
              <span>{comment.likesCount + (isLiked ? 1 : 0)}</span>
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
                  onClick={() => setIsEditing(true)}
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
            onSuccess={() => {
              setShowReplyInput(false);
              setShowReplies(true);
              fetchReplies();
            }}
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
                <CommentItem key={reply.id} comment={reply} />
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
