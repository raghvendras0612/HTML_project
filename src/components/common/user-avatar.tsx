import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ src, name, className, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-14 w-14 text-base",
  };

  const initials = React.useMemo(() => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  return (
    <Avatar className={cn(sizeClasses[size], "border border-border", className)}>
      {src && <AvatarImage src={src} alt={name || "User avatar"} className="object-cover" />}
      <AvatarFallback className="bg-surface-raised font-mono font-medium text-muted-foreground">
        {initials || <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
