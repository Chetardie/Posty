"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { createPostAction } from "@/lib/actions/post";
import type { CreatePostFormValues } from "@/lib/validations/post";
import { createPostFormSchema } from "@/lib/validations/post";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export function CreatePostForm() {
  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      content: "",
      image: undefined,
    },
  });

  async function handleSubmit(data: CreatePostFormValues) {
    form.clearErrors("root");
    const formData = new FormData();
    formData.append("content", data.content);
    if (data.image) {
      formData.append("image", data.image);
    }
    const result = await createPostAction(formData);
    if (!result.success) {
      form.setError("root", { message: result.error });
      return;
    }
    form.reset();
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create post</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id="create-post-form"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          {form.formState.errors.root && (
            <FieldError
              errors={[form.formState.errors.root]}
              className="mb-4"
            />
          )}
          <FieldGroup>
            <Controller
              name="content"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="post-content">Content</FieldLabel>
                  <Textarea
                    {...field}
                    id="post-content"
                    rows={4}
                    placeholder="What's on your mind?"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="image"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="post-image">Image</FieldLabel>
                  <input
                    id="post-image"
                    type="file"
                    accept="image/*"
                    className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                    onChange={(e) =>
                      field.onChange(e.target.files?.[0] ?? undefined)
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="create-post-form"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Posting..." : "Post"}
        </Button>
      </CardFooter>
    </Card>
  );
}
