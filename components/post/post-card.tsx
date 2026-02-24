"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PostComments } from "./post-comments";
import { CommentInput } from "./comment-input";
import { PostCardHeader } from "./post-card-header";
import { PostCardBody } from "./post-card-body";
import { PostCardFooter } from "./post-card-footer";
import { usePostCardMutations } from "./hooks/use-post-card-mutations";
import { usePostEdit } from "./hooks/use-post-edit";

export type PostCardProps = {
  id: string;
  content: string;
  imageUrl?: string | null;
  authorName: string;
  createdAt: string;
  commentCount: number;
  likeCount: number;
  isLiked: boolean;
  isOwner?: boolean;
};

export function PostCard({
  id,
  content,
  imageUrl,
  authorName,
  createdAt,
  commentCount,
  likeCount,
  isLiked,
  isOwner = false,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);

  const edit = usePostEdit({ id, content, imageUrl });
  const mutations = usePostCardMutations(id, {
    onUpdateSuccess: () => edit.setIsEditing(false),
  });

  const handleSave = () => {
    const formData = edit.buildUpdateFormData();
    if (formData) mutations.handleUpdate(formData);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-4">
        <PostCardHeader
          authorName={authorName}
          createdAt={createdAt}
          isOwner={isOwner}
          isEditing={edit.isEditing}
          isPending={mutations.isPending}
          onEdit={edit.handleEdit}
          onDelete={mutations.handleDelete}
          onSave={handleSave}
          onCancel={edit.handleCancelEdit}
        />
        <PostCardBody
          content={content}
          imageUrl={imageUrl}
          isEditing={edit.isEditing}
          editContent={edit.editContent}
          setEditContent={edit.setEditContent}
          previewUrl={edit.previewUrl}
          hasImage={edit.hasImage}
          fileInputRef={edit.fileInputRef}
          isPending={mutations.isPending}
          onImageChange={edit.handleImageChange}
          onRemoveImage={edit.handleRemoveImage}
        />
      </CardContent>
      <CardFooter>
        <PostCardFooter
          likeCount={likeCount}
          isLiked={isLiked}
          commentCount={commentCount}
          isEditing={edit.isEditing}
          onLike={mutations.handleLike}
          onToggleComments={() => setShowComments((s) => !s)}
          onToggleCommentInput={() => setShowCommentInput((s) => !s)}
        />
      </CardFooter>
      {!edit.isEditing && showCommentInput && (
        <CommentInput
          postId={id}
          onSuccess={() => setShowCommentInput(false)}
        />
      )}
      {!edit.isEditing && showComments && <PostComments postId={id} />}
    </Card>
  );
}
