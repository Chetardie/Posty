"use client";

import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type PostCardEditFormProps = {
  editContent: string;
  setEditContent: (value: string) => void;
  previewUrl: string | null;
  hasImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isPending: boolean;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
};

export function PostCardEditForm({
  editContent,
  setEditContent,
  previewUrl,
  hasImage,
  fileInputRef,
  isPending,
  onImageChange,
  onRemoveImage,
}: PostCardEditFormProps) {
  return (
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
          onChange={onImageChange}
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
          {hasImage ? "Change image" : "Add image"}
        </Button>
        {hasImage && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 w-fit"
            onClick={onRemoveImage}
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
  );
}
