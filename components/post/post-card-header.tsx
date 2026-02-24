"use client";

import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2, Check, X } from "lucide-react";

type PostCardHeaderProps = {
  authorName: string;
  createdAt: string;
  isOwner: boolean;
  isEditing: boolean;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
};

export function PostCardHeader({
  authorName,
  createdAt,
  isOwner,
  isEditing,
  isPending,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: PostCardHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{authorName}</span>
        <span className="text-muted-foreground text-xs">·</span>
        <span className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </span>
      </div>
      {isOwner && !isEditing && (
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            disabled={isPending}
            className="text-muted-foreground rounded-full p-1 transition-colors hover:bg-blue-500/10 hover:text-blue-500"
            title="Edit post"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={onDelete}
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
            onClick={onSave}
            disabled={isPending}
            className="rounded-full p-1 text-emerald-500 transition-colors hover:bg-emerald-500/10"
            title="Save changes"
          >
            <Check className="size-4" />
          </button>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="text-muted-foreground rounded-full p-1 transition-colors hover:bg-red-500/10 hover:text-red-500"
            title="Cancel"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
