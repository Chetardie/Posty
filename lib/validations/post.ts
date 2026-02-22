import { z } from "zod";

export const createPostFormSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Max 2000 characters"),
  image: z.instanceof(File).optional(),
});

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Max 2000 characters"),
  image: z.instanceof(File).optional(),
});

export type CreatePostFormValues = z.infer<typeof createPostFormSchema>;

export const updatePostSchema = z.object({
  id: z.string(),
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Max 2000 characters"),
  image: z.instanceof(File).optional(),
});

export type UpdatePostFormValues = z.infer<typeof updatePostSchema>;
