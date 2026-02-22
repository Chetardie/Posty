import { CreatePostTrigger } from "@/components/post/create-post-trigger";
import { PostsFeed } from "@/components/post/posts-feed";

export default function Page() {
  return (
    <main className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <CreatePostTrigger />
      <PostsFeed />
    </main>
  );
}
