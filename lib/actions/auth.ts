"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import { db } from "@/lib/db";

import type { ActionResult } from "./types";

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
  const name = data.get("name");
  const email = data.get("email");
  const password = data.get("password");
  const confirmPassword = data.get("confirmPassword");
  const parsed = signupSchema.safeParse({
    name,
    email,
    password,
    confirmPassword,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().formErrors[0] ?? "Validation failed",
    };
  }

  const supabase = await createClient();

  // Check if user already exists in our database
  const existingUser = await db.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return { success: false, error: "User with this email already exists" };
  }

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (signUpData.user) {
    try {
      await db.user.upsert({
        where: { id: signUpData.user.id },
        update: {
          name: parsed.data.name,
          email: parsed.data.email,
        },
        create: {
          id: signUpData.user.id,
          name: parsed.data.name,
          email: parsed.data.email,
        },
      });
    } catch (dbError) {
      console.error("Failed to create user in DB:", dbError);
      // Even if DB creation fails, the user is created in Supabase.
      // We might want to handle this better, but for now we'll return an error.
      return { success: false, error: "Failed to create user profile" };
    }
  }

  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let dbUser = await db.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser && user.email) {
    // If ID lookup fails, check if we have a user with this email
    // This handles cases where auth IDs might have changed but emails stayed the same
    dbUser = await db.user.findUnique({
      where: { email: user.email },
    });

    // If we found them by email but the ID is different, we should probably update the ID
    // or return the existing user. For safety in a dev environment, let's just use the existing one.
  }

  if (!dbUser) {
    const name =
      user.user_metadata?.name || user.email?.split("@")[0] || "User";
    try {
      return await db.user.upsert({
        where: { id: user.id },
        update: {
          name,
          email: user.email!,
        },
        create: {
          id: user.id,
          name,
          email: user.email!,
        },
      });
    } catch (dbError) {
      console.error("Failed to sync user to DB:", dbError);
      return null;
    }
  }

  return dbUser;
}
