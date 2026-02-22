"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreatePostForm } from "./create-post-form";

export function CreatePostTrigger() {
  const [isFormVisible, setIsFormVisible] = useState(false);

  if (!isFormVisible) {
    return (
      <Button onClick={() => setIsFormVisible(true)}>
        Add post
      </Button>
    );
  }

  return (
    <CreatePostForm onSuccess={() => setIsFormVisible(false)} />
  );
}
