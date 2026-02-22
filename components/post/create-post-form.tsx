"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { createPostAction } from "@/lib/actions/post";
import { ImagePlus, X } from "lucide-react";
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

interface CreatePostFormProps {
  onSuccess?: () => void;
}

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function CreatePostForm({ onSuccess }: CreatePostFormProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageField, setShowImageField] = useState(false);

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      content: "",
      image: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => createPostAction(formData),
    onSuccess: (result) => {
      if (result.success) {
        form.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setShowImageField(false);
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        onSuccess?.();
      } else {
        form.setError("root", { message: result.error });
      }
    },
  });

  async function handleSubmit(data: CreatePostFormValues) {
    const formData = new FormData();
    formData.append("content", data.content);
    if (data.image) {
      formData.append("image", data.image);
    }
    mutation.mutate(formData);
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create post</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="create-post-form" onSubmit={form.handleSubmit(handleSubmit)}>
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
              render={({ field, fieldState }) => {
                if (!showImageField) {
                  return (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => {
                        setShowImageField(true);
                        // Small delay to let the input render before clicking it
                        setTimeout(() => fileInputRef.current?.click(), 0);
                      }}
                    >
                      <ImagePlus className="h-4 w-4" />
                      Add image
                    </Button>
                  );
                }

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="post-image">Image</FieldLabel>
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        id="post-image"
                        type="file"
                        accept="image/*"
                        className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 file:bg-primary file:text-primary-foreground flex w-full rounded-lg border bg-transparent px-2.5 py-2 pr-10 text-sm file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2"
                        onChange={(e) =>
                          field.onChange(e.target.files?.[0] ?? undefined)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute top-1/2 right-1.5 -translate-y-1/2"
                        onClick={() => {
                          field.onChange(undefined);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                          setShowImageField(false);
                        }}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear image</span>
                      </Button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          type="submit"
          form="create-post-form"
          disabled={mutation.isPending}
          className="min-w-28"
        >
          {mutation.isPending ? "Posting..." : "Post"}
        </Button>
        {onSuccess && (
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
