import type { QueryClient } from "@tanstack/react-query";
import type { CommentType } from "../post-comments";
import { updatePostInInfiniteCache } from "./posts-query";
import type { PostsPage } from "./posts-query";
import type { InfiniteData } from "@tanstack/react-query";

export function updateCommentLikeInList(
  list: CommentType[] | undefined,
  commentId: string,
  isLiked: boolean,
  likesCount: number
): CommentType[] | undefined {
  if (!list) return list;
  return list.map((c) =>
    c.id === commentId ? { ...c, isLiked, likesCount } : c
  );
}

export function incrementRepliesCountInList(
  list: CommentType[] | undefined,
  commentId: string
): CommentType[] | undefined {
  if (!list) return list;
  return list.map((c) =>
    c.id === commentId ? { ...c, repliesCount: c.repliesCount + 1 } : c
  );
}

export function decrementRepliesCountInList(
  list: CommentType[] | undefined,
  commentId: string
): CommentType[] | undefined {
  if (!list) return list;
  return list.map((c) =>
    c.id === commentId
      ? { ...c, repliesCount: Math.max(0, c.repliesCount - 1) }
      : c
  );
}

export function removeCommentFromList(
  list: CommentType[] | undefined,
  commentId: string
): CommentType[] | undefined {
  if (!list) return list;
  return list.filter((c) => c.id !== commentId);
}

type ReplySuccessParams = {
  queryClient: QueryClient;
  postId: string;
  commentId: string;
  parentId: string | undefined;
  ancestorIds: string[];
};

export function applyReplySuccessToCache({
  queryClient,
  postId,
  commentId,
  parentId,
  ancestorIds,
}: ReplySuccessParams): void {
  const commentsKey = ["comments", postId] as const;
  const idsToIncrement = [commentId, ...ancestorIds];
  if (!parentId) {
    queryClient.setQueryData<CommentType[]>(commentsKey, (old) =>
      idsToIncrement.reduce(
        (acc, id) => incrementRepliesCountInList(acc, id),
        old
      )
    );
  } else {
    queryClient.setQueryData<CommentType[]>(commentsKey, (old) => {
      const rootId = ancestorIds[ancestorIds.length - 1];
      return rootId != null
        ? incrementRepliesCountInList(old, rootId)
        : old;
    });
    queryClient.setQueryData<CommentType[]>(
      ["replies", parentId],
      (old) => incrementRepliesCountInList(old, commentId)
    );
    for (let i = 0; i < ancestorIds.length - 1; i++) {
      const id = ancestorIds[i];
      const parentOfId = ancestorIds[i + 1];
      queryClient.setQueryData<CommentType[]>(
        ["replies", parentOfId],
        (old) => incrementRepliesCountInList(old, id)
      );
    }
  }
  queryClient.setQueryData<InfiniteData<PostsPage>>(["posts"], (old) =>
    updatePostInInfiniteCache(old, postId, (p) => ({
      ...p,
      commentCount: p.commentCount + 1,
    }))
  );
}
