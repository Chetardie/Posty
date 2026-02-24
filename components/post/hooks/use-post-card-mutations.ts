"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PostFeedItem } from "@/lib/actions/post";
import {
  togglePostLikeAction,
  deletePostAction,
  updatePostAction,
} from "@/lib/actions/post";

type UsePostCardMutationsOptions = {
  onUpdateSuccess?: () => void;
};

export function usePostCardMutations(
  id: string,
  options: UsePostCardMutationsOptions = {}
) {
  const queryClient = useQueryClient();
  const { onUpdateSuccess } = options;

  const likeMutation = useMutation({
    mutationFn: () => togglePostLikeAction(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData<PostFeedItem[]>(["posts"]);
      queryClient.setQueryData<PostFeedItem[]>(["posts"], (old) =>
        old
          ? old.map((p) =>
              p.id === id
                ? {
                    ...p,
                    isLiked: !p.isLiked,
                    likeCount: p.likeCount + (p.isLiked ? -1 : 1),
                  }
                : p
            )
          : old
      );
      return { previousPosts };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPosts != null) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePostAction(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      } else {
        alert(result.error);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) => updatePostAction(formData),
    onSuccess: (result) => {
      if (result.success) {
        onUpdateSuccess?.();
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      } else {
        alert(result.error);
      }
    },
  });

  const handleLike = () => likeMutation.mutate();

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate();
    }
  };

  const handleUpdate = (formData: FormData) => updateMutation.mutate(formData);

  const isPending =
    likeMutation.isPending ||
    deleteMutation.isPending ||
    updateMutation.isPending;

  return {
    handleLike,
    handleDelete,
    handleUpdate,
    isPending,
  };
}
