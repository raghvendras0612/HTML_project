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
  Moon,
  Sun,
  Laptop,
  User,
  LogIn,
  Search,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/use-user";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { user, profile } = useUser();

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/"))}
            className="cursor-pointer"
          >
            <Home className="mr-2 h-4 w-4 text-accent" />
            <span>Home</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/popular"))}
            className="cursor-pointer"
          >
            <TrendingUp className="mr-2 h-4 w-4 text-accent" />
            <span>Popular Feed</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/all"))}
            className="cursor-pointer"
          >
            <Compass className="mr-2 h-4 w-4 text-accent" />
            <span>All Posts</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/submit"))}
            className="cursor-pointer"
          >
            <PlusCircle className="mr-2 h-4 w-4 text-accent" />
            <span>Create a Post</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

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

        <CommandGroup heading="Account">
          {user && profile ? (
            <CommandItem
              onSelect={() => runCommand(() => router.push(`/u/${profile.username}`))}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4 text-accent" />
              <span>View Profile (u/{profile.username})</span>
            </CommandItem>
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
