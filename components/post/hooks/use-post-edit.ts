"use client";

import { useState, useRef } from "react";

type UsePostEditParams = {
  id: string;
  content: string;
  imageUrl?: string | null;
};

export function usePostEdit({
  id,
  content,
  imageUrl,
}: UsePostEditParams) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(content);
    setEditImage(null);
    setPreviewUrl(imageUrl || null);
    setShouldRemoveImage(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(content);
    setEditImage(null);
    setPreviewUrl(imageUrl || null);
    setShouldRemoveImage(false);
  };

  const buildUpdateFormData = (): FormData | null => {
    if (!editContent.trim()) return null;
    const formData = new FormData();
    formData.append("id", id);
    formData.append("content", editContent);
    if (editImage) formData.append("image", editImage);
    if (shouldRemoveImage) formData.append("removeImage", "true");
    return formData;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      setShouldRemoveImage(false);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setEditImage(null);
    setPreviewUrl(null);
    setShouldRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasImage: boolean =
    Boolean((imageUrl || editImage) && !shouldRemoveImage);

  return {
    isEditing,
    setIsEditing,
    editContent,
    setEditContent,
    previewUrl,
    shouldRemoveImage,
    fileInputRef,
    hasImage,
    handleEdit,
    handleCancelEdit,
    buildUpdateFormData,
    handleImageChange,
    handleRemoveImage,
  };
}
