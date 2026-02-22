import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Create Post Trigger Skeleton */}
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* Posts Feed Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardContent className="pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
              </div>
              <Skeleton className="mt-3 h-[400px] w-full rounded-lg" />
            </CardContent>
            <CardFooter className="flex gap-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
