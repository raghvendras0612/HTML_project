"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  TrendingUp,
  Compass,
  PlusCircle,
  PlusSquare,
  Moon,
  Sun,
  Laptop,
  User,
  LogIn,
  Search,
  Bell,
  Shield,
  Hash,
  Settings,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/use-user";
import type { Community } from "@/types/database.types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { user, profile } = useUser();
  const [communities, setCommunities] = React.useState<Community[]>([]);

  React.useEffect(() => {
    if (open) {
      fetch("/api/communities")
        .then((res) => res.json())
        .then((data) => {
          if (data.communities) setCommunities(data.communities);
        })
        .catch(() => {});
    }
  }, [open]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search communities..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Links Group */}
        <CommandGroup heading="Quick Links">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/"))}
            className="cursor-pointer"
          >
            <Home className="mr-2 h-4 w-4 text-accent" />
            <span>Home</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/submit"))}
            className="cursor-pointer"
          >
            <PlusCircle className="mr-2 h-4 w-4 text-accent" />
            <span>Create Post</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/communities/create"))}
            className="cursor-pointer"
          >
            <PlusSquare className="mr-2 h-4 w-4 text-accent" />
            <span>Create Community</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/notifications"))}
            className="cursor-pointer"
          >
            <Bell className="mr-2 h-4 w-4 text-accent" />
            <span>Notifications</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/moderation"))}
            className="cursor-pointer"
          >
            <Shield className="mr-2 h-4 w-4 text-accent" />
            <span>Moderation</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Communities Search Group */}
        {communities.length > 0 && (
          <>
            <CommandGroup heading="Communities">
              {communities.map((comm) => (
                <CommandItem
                  key={comm.id}
                  onSelect={() => runCommand(() => router.push(`/c/${comm.name}`))}
                  className="cursor-pointer"
                >
                  <Hash className="mr-2 h-4 w-4 text-accent" />
                  <span className="font-mono font-semibold">c/{comm.name}</span>
                  {comm.title && (
                    <span className="ml-2 text-xs text-muted-foreground truncate">
                      — {comm.title}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Feeds Group */}
        <CommandGroup heading="Feeds">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/popular"))}
            className="cursor-pointer"
          >
            <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Popular Feed</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/all"))}
            className="cursor-pointer"
          >
            <Compass className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>All Posts</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Theme Settings Group */}
        <CommandGroup heading="Theme">
          <CommandItem
            onSelect={() => runCommand(() => setTheme("light"))}
            className="cursor-pointer"
          >
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Mode</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setTheme("dark"))}
            className="cursor-pointer"
          >
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Mode</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setTheme("system"))}
            className="cursor-pointer"
          >
            <Laptop className="mr-2 h-4 w-4" />
            <span>System Preference</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Account / Settings Group */}
        <CommandGroup heading="Account">
          {user && profile ? (
            <>
              <CommandItem
                onSelect={() => runCommand(() => router.push(`/u/${profile.username}`))}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4 text-accent" />
                <span>View Profile (u/{profile.username})</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push(`/u/${profile.username}`))}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4 text-accent" />
                <span>Settings</span>
              </CommandItem>
            </>
          ) : (
            <>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/login"))}
                className="cursor-pointer"
              >
                <LogIn className="mr-2 h-4 w-4 text-accent" />
                <span>Log In</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/signup"))}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4 text-accent" />
                <span>Create an Account</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
