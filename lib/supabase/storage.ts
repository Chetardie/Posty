import { createClient } from "@/lib/supabase/server";

export async function uploadImage(
  file: File,
  bucket: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      console.error(`Upload to ${bucket} failed:`, error);
      return { url: null, error: error.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error(`Upload to ${bucket} error:`, error);
    return { url: null, error: "An unexpected error occurred during upload" };
  }
}
