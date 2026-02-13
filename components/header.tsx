"use client";

import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import { signOutAction } from "@/lib/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(email: string): string {
  const part = email.split("@")[0];
  if (part.length >= 2) {
    return (part[0] + part[1]).toUpperCase();
  }
  return part.charAt(0).toUpperCase();
}

export function Header() {
  const { user, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4">
      <Link href="/" className="font-semibold">
        Posty
      </Link>
      <nav className="flex items-center gap-2">
        {isLoading ? null : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="size-8">
                  <AvatarFallback>{getInitials(user.email ?? "")}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => signOutAction()}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
