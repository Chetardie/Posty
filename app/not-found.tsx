import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 px-4 py-16">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground text-center text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
