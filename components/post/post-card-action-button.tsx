"use client";

import { cn } from "@/lib/utils";

type PostCardActionButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  activeClassName?: string;
  inactiveHoverClassName?: string;
  hoverClassName?: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
};

export function PostCardActionButton({
  onClick,
  disabled,
  active,
  activeClassName = "text-red-500",
  inactiveHoverClassName = "hover:text-blue-500",
  hoverClassName = "group-hover:bg-red-500/10",
  icon,
  children,
}: PostCardActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex items-center gap-1.5 transition-colors outline-none",
        active && activeClassName,
        !active && inactiveHoverClassName,
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div
        className={cn(
          "-ml-1.5 rounded-full p-1.5 transition-colors",
          hoverClassName
        )}
      >
        {icon}
      </div>
      {children}
    </button>
  );
}
