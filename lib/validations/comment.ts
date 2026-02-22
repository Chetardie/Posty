import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment cannot exceed 1000 characters"),
  postId: z.string(),
  parentId: z.string().optional(),
  image: z.instanceof(File).optional(),
});

export type CreateCommentValues = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  id: z.string(),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment cannot exceed 1000 characters"),
  image: z.instanceof(File).optional(),
});

export type UpdateCommentValues = z.infer<typeof updateCommentSchema>;
