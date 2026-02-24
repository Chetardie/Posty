"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  togglePostLikeAction,
  deletePostAction,
  updatePostAction,
} from "@/lib/actions/post";
import { updatePostInInfiniteCache } from "../utils/posts-query";
import type { PostsPage } from "../utils/posts-query";
import type { InfiniteData } from "@tanstack/react-query";

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
      const previous = queryClient.getQueryData<InfiniteData<PostsPage>>(["posts"]);
      queryClient.setQueryData<InfiniteData<PostsPage>>(["posts"], (old) =>
        updatePostInInfiniteCache(old, id, (p) => ({
          ...p,
          isLiked: !p.isLiked,
          likeCount: p.likeCount + (p.isLiked ? -1 : 1),
        }))
      );
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(["posts"], context.previous);
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
