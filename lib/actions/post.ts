"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { createPostSchema } from "@/lib/validations/post";

const BUCKET = "post-images";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

async function uploadPostImage(file: File): Promise<string | null> {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

export async function createPostAction(
  formData: FormData
): Promise<ActionResult> {
  const content = formData.get("content");
  const imageFile = formData.get("image");

  const parsed = createPostSchema.safeParse({
    content: typeof content === "string" ? content : "",
    image:
      imageFile instanceof File && imageFile.size > 0 ? imageFile : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.flatten().formErrors[0] ?? "Validation failed",
    };
  }

  let imageUrl: string | null = null;
  if (parsed.data.image instanceof File) {
    const url = await uploadPostImage(parsed.data.image);
    if (!url) {
      return { success: false, error: "Failed to upload image" };
    }
    imageUrl = url;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    await db.post.create({
      data: {
        content: parsed.data.content,
        imageUrl,
        authorId: user?.id ?? null,
      },
    });
  } catch {
    return { success: false, error: "Failed to create post" };
  }

  revalidatePath("/");
  return { success: true };
}
