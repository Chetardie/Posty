import { getPostsAction } from "@/lib/actions/post";
import { PostCard } from "./post-card";

export async function PostsFeed() {
  const posts = await getPostsAction();

  if (posts.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">No posts yet</p>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          id={post.id}
          content={post.content}
          imageUrl={post.imageUrl}
          createdAt={post.createdAt}
          commentCount={post.commentCount}
          likeCount={post.likeCount}
          isLiked={post.isLiked}
        />
      ))}
    </div>
  );
}
