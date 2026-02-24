"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 font-sans antialiased">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-center text-sm text-zinc-600">
          A critical error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
