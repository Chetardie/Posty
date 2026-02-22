"use client";

import { useRef, useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SendHorizontal } from "lucide-react";
import { createCommentAction } from "@/lib/actions/comment";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-muted-foreground shrink-0 rounded-full p-2 transition-colors hover:bg-blue-500/10 hover:text-blue-500 disabled:pointer-events-none disabled:opacity-50"
    >
      <SendHorizontal className="size-5" />
    </button>
  );
}

interface CommentInputProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
}

export function CommentInput({
  postId,
  parentId,
  onSuccess,
}: CommentInputProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(
    async (_state: unknown, formData: FormData) =>
      createCommentAction(formData),
    undefined
  );

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex items-center gap-2 border-t p-4"
    >
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <Input
        name="content"
        placeholder={parentId ? "Post your reply..." : "Post your comment..."}
        className="bg-muted/50 flex-1 rounded-full"
        required
      />
      <SubmitButton />
    </form>
  );
}
