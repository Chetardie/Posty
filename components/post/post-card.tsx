"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export type PostCardProps = {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  commentCount: number;
};

export function PostCard({
  content,
  imageUrl,
  createdAt,
  commentCount,
}: PostCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="pt-4">
        <p className="whitespace-pre-wrap wrap-break-word text-sm">{content}</p>
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="mt-3 max-h-96 w-full rounded-lg object-cover"
          />
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-4 text-muted-foreground text-xs">
        <span>
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle className="size-3.5" />
          {commentCount}
        </span>
      </CardFooter>
    </Card>
  );
}
