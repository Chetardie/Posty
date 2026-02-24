"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRepliesAction } from "@/lib/actions/comment";

export function useCommentReplies(commentId: string) {
  const [showReplies, setShowReplies] = useState(false);

  const {
    data: replies = [],
    isLoading: isLoadingReplies,
    refetch: fetchReplies,
  } = useQuery({
    queryKey: ["replies", commentId],
    queryFn: () => getRepliesAction(commentId),
    enabled: showReplies,
  });

  const toggleReplies = () => setShowReplies((prev) => !prev);

  return {
    showReplies,
    setShowReplies,
    replies,
    isLoadingReplies,
    fetchReplies,
    toggleReplies,
  };
}
