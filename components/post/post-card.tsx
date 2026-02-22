"use client";

import { formatDistanceToNow } from "date-fns";
import {
  MessageCircle,
  Heart,
  Trash2,
  Pencil,
  X,
  Check,
  ImagePlus,
} from "lucide-react";
import { useState, useRef } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PostComments } from "./post-comments";
import { CommentInput } from "./comment-input";
import {
  togglePostLikeAction,
  deletePostAction,
  updatePostAction,
} from "@/lib/actions/post";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const likeMutation = useMutation({
    mutationFn: () => togglePostLikeAction(id),
    onSuccess: () => {
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
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      } else {
        alert(result.error);
      }
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate();
    }
  };

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

  const handleUpdate = async () => {
    if (!editContent.trim()) return;

    const formData = new FormData();
    formData.append("id", id);
    formData.append("content", editContent);
    if (editImage) {
      formData.append("image", editImage);
    }
    if (shouldRemoveImage) {
      formData.append("removeImage", "true");
    }

    updateMutation.mutate(formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      setShouldRemoveImage(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setEditImage(null);
    setPreviewUrl(null);
    setShouldRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isPending =
    likeMutation.isPending ||
    deleteMutation.isPending ||
    updateMutation.isPending;

  return (
    <Card className="w-full">
      <CardContent className="pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{authorName}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>{" "}
          </div>
          {isOwner && !isEditing && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleEdit}
                disabled={isPending}
                className="text-muted-foreground rounded-full p-1 transition-colors hover:bg-blue-500/10 hover:text-blue-500"
                title="Edit post"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-muted-foreground rounded-full p-1 transition-colors hover:bg-red-500/10 hover:text-red-500"
                title="Delete post"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
          {isEditing && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleUpdate}
                disabled={isPending}
                className="rounded-full p-1 text-emerald-500 transition-colors hover:bg-emerald-500/10"
                title="Save changes"
              >
                <Check className="size-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isPending}
                className="text-muted-foreground rounded-full p-1 transition-colors hover:bg-red-500/10 hover:text-red-500"
                title="Cancel"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] w-full resize-none"
              placeholder="What's on your mind?"
              disabled={isPending}
            />
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                {(imageUrl || editImage) && !shouldRemoveImage
                  ? "Change image"
                  : "Add image"}
              </Button>
              {(imageUrl || editImage) && !shouldRemoveImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 w-fit"
                  onClick={handleRemoveImage}
                  disabled={isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove image
                </Button>
              )}
              {previewUrl && (
                <div className="relative mt-2">
                  <div className="relative h-96 w-full overflow-hidden rounded-lg">
                    <Image
                      src={previewUrl}
                      fill
                      className="object-cover opacity-50"
                      alt="Preview"
                      unoptimized={previewUrl.startsWith("data:")}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-background/80 rounded-md px-2 py-1 text-xs font-medium">
                        Preview of new image
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm wrap-break-word whitespace-pre-wrap">
              {content}
            </p>
            {imageUrl && (
              <div className="relative mt-3 h-[400px] w-full overflow-hidden rounded-lg">
                <Image
                  src={imageUrl}
                  fill
                  className="object-cover"
                  alt="Post image"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="text-muted-foreground flex items-center gap-4 text-xs">
        <button
          onClick={handleLike}
          disabled={isPending || isEditing}
          className={cn(
            "group flex items-center gap-1.5 transition-colors outline-none",
            isLiked ? "text-red-500" : "hover:text-red-500",
            isEditing && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="-ml-1.5 rounded-full p-1.5 transition-colors group-hover:bg-red-500/10">
            <Heart className={cn("size-4", isLiked && "fill-current")} />
          </div>
          {likeCount}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          disabled={isEditing}
          className={cn(
            "group flex items-center gap-1.5 transition-colors outline-none hover:text-blue-500",
            isEditing && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="-ml-1.5 rounded-full p-1.5 transition-colors group-hover:bg-blue-500/10">
            <MessageCircle className="size-4" />
          </div>
          {commentCount}
        </button>
        <button
          onClick={() => setShowCommentInput(!showCommentInput)}
          disabled={isEditing}
          className={cn(
            "ml-auto transition-colors outline-none hover:text-blue-500",
            isEditing && "cursor-not-allowed opacity-50"
          )}
        >
          Add comment
        </button>
      </CardFooter>
      {!isEditing && showCommentInput && (
        <CommentInput
          postId={id}
          onSuccess={() => setShowCommentInput(false)}
        />
      )}
      {!isEditing && showComments && <PostComments postId={id} />}
    </Card>
  );
}
