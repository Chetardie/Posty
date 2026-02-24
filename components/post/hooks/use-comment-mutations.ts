"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CommentType } from "../post-comments";
import { updatePostInInfiniteCache } from "../utils/posts-query";
import type { PostsPage } from "../utils/posts-query";
import type { InfiniteData } from "@tanstack/react-query";
import {
  deleteCommentAction,
  updateCommentAction,
  toggleCommentLikeAction,
} from "@/lib/actions/comment";
import {
  updateCommentLikeInList,
  decrementRepliesCountInList,
  removeCommentFromList,
} from "../utils/comment-cache";

type UseCommentMutationsParams = {
  comment: CommentType;
  parentId?: string;
  ancestorIds?: string[];
  onUpdateSuccess?: () => void;
};

export function useCommentMutations({
  comment,
  parentId,
  ancestorIds = [],
  onUpdateSuccess,
}: UseCommentMutationsParams) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) => updateCommentAction(formData),
    onSuccess: (result) => {
      if (result.success) {
        onUpdateSuccess?.();
        queryClient.invalidateQueries({
          queryKey: ["comments", comment.postId],
        });
        queryClient.invalidateQueries({ queryKey: ["replies", comment.id] });
      } else {
        alert(result.error);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCommentAction(comment.id),
    onSuccess: (result) => {
      if (result.success && "deletedCount" in result) {
        const deletedCount = result.deletedCount;
        queryClient.setQueryData<InfiniteData<PostsPage>>(["posts"], (old) =>
          updatePostInInfiniteCache(old, comment.postId, (p) => ({
            ...p,
            commentCount: Math.max(0, p.commentCount - deletedCount),
          }))
        );
        const commentsKey = ["comments", comment.postId] as const;
        if (!parentId) {
          queryClient.setQueryData<CommentType[]>(commentsKey, (old) =>
            removeCommentFromList(old, comment.id)
          );
        } else {
          queryClient.setQueryData<CommentType[]>(
            ["replies", parentId],
            (old) => removeCommentFromList(old, comment.id)
          );
          if (ancestorIds.length === 1) {
            queryClient.setQueryData<CommentType[]>(commentsKey, (old) =>
              decrementRepliesCountInList(old, parentId)
            );
          } else if (ancestorIds.length > 1) {
            queryClient.setQueryData<CommentType[]>(
              ["replies", ancestorIds[1]],
              (old) => decrementRepliesCountInList(old, parentId)
            );
          }
        }
        queryClient.invalidateQueries({ queryKey: ["comments", comment.postId] });
        queryClient.invalidateQueries({ queryKey: ["replies"] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      } else if (!result.success) {
        alert(result.error);
      }
    },
  });

  const likeMutation = useMutation({
    mutationFn: () => toggleCommentLikeAction(comment.id),
    onMutate: async () => {
      const commentsKey = ["comments", comment.postId] as const;
      const repliesKey = parentId ? (["replies", parentId] as const) : null;
      await queryClient.cancelQueries({ queryKey: commentsKey });
      if (repliesKey) await queryClient.cancelQueries({ queryKey: repliesKey });
      const previousComments = queryClient.getQueryData<CommentType[]>(commentsKey);
      const previousReplies = repliesKey
        ? queryClient.getQueryData<CommentType[]>(repliesKey)
        : undefined;
      const nextLiked = !comment.isLiked;
      const nextCount = comment.likesCount + (nextLiked ? 1 : -1);
      if (!parentId) {
        queryClient.setQueryData<CommentType[]>(commentsKey, (old) =>
          updateCommentLikeInList(old, comment.id, nextLiked, nextCount)
        );
      } else if (repliesKey) {
        queryClient.setQueryData<CommentType[]>(repliesKey, (old) =>
          updateCommentLikeInList(old, comment.id, nextLiked, nextCount)
        );
      }
      return { previousComments, previousReplies, repliesKey };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousComments != null) {
        queryClient.setQueryData(["comments", comment.postId], context.previousComments);
      }
      if (context?.repliesKey && context?.previousReplies != null) {
        queryClient.setQueryData(context.repliesKey, context.previousReplies);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", comment.postId] });
      queryClient.invalidateQueries({ queryKey: ["replies", comment.id] });
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteMutation.mutate();
    }
  };

  const handleUpdate = (formData: FormData) => updateMutation.mutate(formData);
  const handleLike = () => likeMutation.mutate();

  const isPending =
    updateMutation.isPending ||
    deleteMutation.isPending ||
    likeMutation.isPending;

  return {
    updateMutation,
    handleDelete,
    handleUpdate,
    handleLike,
    isPending,
  };
}
