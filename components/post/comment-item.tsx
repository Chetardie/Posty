"use client";

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type CommentType } from "./post-comments";
import { CommentInput } from "./comment-input";
import { getRepliesAction } from "@/lib/actions/comment";

export function CommentItem({ comment }: { comment: CommentType }) {
  const [isLiked, setIsLiked] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replies, setReplies] = useState<CommentType[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

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

          <p className="text-sm wrap-break-word whitespace-pre-wrap">
            {comment.content}
          </p>

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
