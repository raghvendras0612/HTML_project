"use client";

import * as React from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatScore } from "@/lib/utils";
import { Sparkles, LogOut, User as UserIcon, Shield, Moon, Sun, Laptop } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const router = useRouter();
  const { user, profile, signOut, openAuthModal } = useUser();
  const { theme, setTheme } = useTheme();

  if (!user || !profile) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground"
        >
          <Link href="/login">Log In</Link>
        </Button>
        <Button
          variant="default"
          size="sm"
          asChild
          className="text-xs h-8 px-3 bg-accent hover:bg-accent/90 text-white shadow-glow-sm"
        >
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-1 pl-2 transition-colors hover:bg-surface-raised border border-border focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="font-mono text-xs font-semibold text-foreground leading-tight">
              u/{profile.username}
            </span>
            <span className="font-mono text-[10px] text-accent flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-accent-glow" />
              {formatScore(profile.karma)} karma
            </span>
          </div>
          <UserAvatar
            src={profile.avatar_url}
            name={profile.display_name || profile.username}
            size="sm"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-surface border-border">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile.display_name || profile.username}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              u/{profile.username}
            </p>
            <div className="mt-1 flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-1 text-xs font-mono text-accent">
              <Sparkles className="h-3 w-3 text-accent-glow" />
              <span>{profile.karma} karma</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href={`/u/${profile.username}`}
            className="flex items-center gap-2 cursor-pointer text-sm"
          >
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span>Profile & Posts</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/moderation"
            className="flex items-center gap-2 cursor-pointer text-sm"
          >
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>Moderation Panel</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Theme Toggle Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer text-sm">
            {theme === "light" ? (
              <Sun className="h-4 w-4 text-muted-foreground" />
            ) : theme === "dark" ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Laptop className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-surface border-border">
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Dark {theme === "dark" && "✓"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <Sun className="h-3.5 w-3.5" />
              <span>Light {theme === "light" && "✓"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <Laptop className="h-3.5 w-3.5" />
              <span>System {theme === "system" && "✓"}</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            router.push("/");
            router.refresh();
          }}
          className="text-danger focus:text-danger focus:bg-danger/10 cursor-pointer text-sm"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
