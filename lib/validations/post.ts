import { z } from "zod";

export const createPostFormSchema = z.object({
  content: z.string().min(1, "Content is required").max(2000, "Max 2000 characters"),
  image: z.instanceof(File).optional(),
});

export const createPostSchema = z.object({
  content: z.string().min(1, "Content is required").max(2000, "Max 2000 characters"),
  image: z.instanceof(File).optional(),
});

export type CreatePostFormValues = z.infer<typeof createPostFormSchema>;
