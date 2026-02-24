"use client";

import { useState } from "react";

type UseCommentEditParams = {
  id: string;
  content: string;
};

export function useCommentEdit({ id, content }: UseCommentEditParams) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const startEdit = () => {
    setIsEditing(true);
    setEditContent(content);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent(content);
  };

  const buildUpdateFormData = (): FormData | null => {
    if (!editContent.trim()) return null;
    const formData = new FormData();
    formData.append("id", id);
    formData.append("content", editContent);
    return formData;
  };

  return {
    isEditing,
    setIsEditing,
    editContent,
    setEditContent,
    startEdit,
    cancelEdit,
    buildUpdateFormData,
  };
}
