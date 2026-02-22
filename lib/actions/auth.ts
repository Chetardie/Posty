"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LoginFormValues, SignupFormValues } from "@/lib/validations/auth";
import { loginSchema, signupSchema } from "@/lib/validations/auth";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(data: FormData): Promise<ActionResult> {
  const email = data.get("email");
  const password = data.get("password");
  const parsed = loginSchema.safeParse({ email, password });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().formErrors[0] ?? "Validation failed",
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { success: false, error: error.message };
  }
  redirect("/");
}

export async function signupAction(data: FormData): Promise<ActionResult> {
  const email = data.get("email");
  const password = data.get("password");
  const confirmPassword = data.get("confirmPassword");
  const parsed = signupSchema.safeParse({ email, password, confirmPassword });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().formErrors[0] ?? "Validation failed",
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
