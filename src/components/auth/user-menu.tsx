"use client";

import * as React from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatScore } from "@/lib/utils";
import { Sparkles, LogOut, User as UserIcon, Shield } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { user, profile, openAuthModal, signOut } = useAuth();

  if (!user || !profile) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openAuthModal("signin")}
          className="text-xs"
        >
          Log In
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => openAuthModal("signup")}
          className="text-xs shadow-glow-sm"
        >
          Sign Up
        </Button>
      </div>
    );
  }

  const initials = (profile.display_name || profile.username || "U")
    .substring(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-1 pl-2 transition-colors hover:bg-surface-raised border border-border focus:outline-none focus:ring-2 focus:ring-accent">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="font-mono text-xs font-semibold text-foreground leading-tight">
              u/{profile.username}
            </span>
            <span className="font-mono text-[10px] text-accent flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-accent-glow" />
              {formatScore(profile.karma)} karma
            </span>
          </div>
          <Avatar className="h-8 w-8 border border-border">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.username} />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {profile.display_name || profile.username}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              u/{profile.username}
            </p>
            <div className="mt-1 flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-1 text-xs font-mono text-accent">
              <Sparkles className="h-3 w-3 text-accent-glow" />
              <span>{profile.karma} total karma</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/u/${profile.username}`} className="flex items-center gap-2 cursor-pointer">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span>Profile & Posts</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/moderation" className="flex items-center gap-2 cursor-pointer">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>Moderation Panel</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-danger focus:text-danger focus:bg-danger/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
