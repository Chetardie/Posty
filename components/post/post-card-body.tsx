"use client";

import Image from "next/image";
import { PostCardEditForm } from "./post-card-edit-form";

type PostCardBodyProps = {
  content: string;
  imageUrl?: string | null;
  isEditing: boolean;
  editContent: string;
  setEditContent: (value: string) => void;
  previewUrl: string | null;
  hasImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isPending: boolean;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
};

export function PostCardBody({
  content,
  imageUrl,
  isEditing,
  editContent,
  setEditContent,
  previewUrl,
  hasImage,
  fileInputRef,
  isPending,
  onImageChange,
  onRemoveImage,
}: PostCardBodyProps) {
  if (isEditing) {
    return (
      <PostCardEditForm
        editContent={editContent}
        setEditContent={setEditContent}
        previewUrl={previewUrl}
        hasImage={hasImage}
        fileInputRef={fileInputRef}
        isPending={isPending}
        onImageChange={onImageChange}
        onRemoveImage={onRemoveImage}
      />
    );
  }

  return (
    <>
      <p className="text-sm wrap-break-word whitespace-pre-wrap">{content}</p>
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
  );
}
