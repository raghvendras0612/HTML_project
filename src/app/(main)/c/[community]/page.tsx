import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";
import { FeedList } from "@/components/feed/feed-list";
import { CommunityHeaderJoinButton } from "@/components/community/community-join-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hash, Users, Plus, Shield, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import type { Community } from "@/types/database.types";

interface CommunityPageProps {
  params: Promise<{ community: string }>;
}

export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const { community: rawCommunityName } = await params;
  const communityName = decodeURIComponent(rawCommunityName);
  return {
    title: `c/${communityName}`,
    description: `Technical discussions, architecture debates, and engineering resources in c/${communityName} on Curia.`,
    openGraph: {
      title: `c/${communityName} — Curia Community`,
      description: `Technical discussions, architecture debates, and engineering resources in c/${communityName} on Curia.`,
    },
  };
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { community: rawCommunityName } = await params;
  const communityName = decodeURIComponent(rawCommunityName).toLowerCase();

  let community: Community | null = null;
  let isMember = false;
  let isModerator = false;

  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: dbComm } = await admin
      .from("communities")
      .select("*")
      .ilike("name", communityName)
      .maybeSingle();

    if (dbComm) {
      community = dbComm;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: memberRow } = await admin
          .from("community_members")
          .select("role")
          .eq("community_id", dbComm.id)
          .eq("user_id", user.id)
          .maybeSingle();
        isMember = Boolean(memberRow);
        isModerator = memberRow?.role === "moderator";
      }
    }
  } catch {
    // Continue to mock fallback
  }

  // Fallback to mock community
  if (!community) {
    const mockMatch = MOCK_COMMUNITIES.find(
      (c) => c.name.toLowerCase() === communityName
    );
    if (mockMatch) {
      community = mockMatch;
      isMember = true;
    }
  }

  if (!community) {
    notFound();
  }

  const memberCount =
    (community as unknown as { member_count?: number; members_count?: number }).member_count ??
    (community as unknown as { member_count?: number; members_count?: number }).members_count ??
    1;

  return (
    <div className="space-y-4">
      {/* Community Header Banner Card */}
      <div className="rounded-xl overflow-hidden border border-border bg-surface">
        {community.banner_url ? (
          <div
            className="h-28 sm:h-36 w-full bg-cover bg-center border-b border-border"
            style={{ backgroundImage: `url(${community.banner_url})` }}
          />
        ) : (
          <div className="h-24 w-full bg-gradient-to-r from-accent/30 via-surface to-accent-glow/20 border-b border-border" />
        )}

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {community.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={community.icon_url}
                alt={community.name}
                className="h-14 w-14 -mt-8 sm:-mt-10 rounded-2xl object-cover border-2 border-border shadow-glow shrink-0"
              />
            ) : (
              <div className="flex h-14 w-14 -mt-8 sm:-mt-10 shrink-0 items-center justify-center rounded-2xl bg-surface border-2 border-border shadow-glow text-accent font-bold text-xl">
                <Hash className="h-7 w-7" />
              </div>
            )}
            <div>
              <h1 className="font-sans font-bold text-lg sm:text-xl text-foreground">
                {community.title}
              </h1>
              <p className="font-mono text-xs text-accent">
                c/{community.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isModerator && (
              <Button size="sm" variant="outline" asChild className="text-xs font-mono border-accent/50 text-accent hover:bg-accent/10">
                <Link href={`/c/${community.name}/mod`}>
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  Mod Dashboard
                </Link>
              </Button>
            )}
            <CommunityHeaderJoinButton
              communityName={community.name}
              initialJoined={isMember}
            />
            <Button size="sm" asChild className="text-xs bg-accent hover:bg-accent/90 text-white shadow-glow-sm">
              <Link href={`/c/${community.name}/submit`}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create Post
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Community Description & Quick Stats */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border text-xs">
        <div className="flex items-center gap-3">
          <Badge variant="cyan" className="font-mono text-[10px]">
            <Users className="mr-1 h-3 w-3" />
            {memberCount.toLocaleString()} members
          </Badge>
          <span className="text-muted-foreground hidden sm:inline">
            {community.description || "A technical community on Curia."}
          </span>
        </div>
        <Link
          href={`/c/${community.name}/submit`}
          className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 shrink-0"
        >
          <Plus className="h-3 w-3" /> Post in c/{community.name}
        </Link>
      </div>

      {/* Community Infinite Scroll Feed */}
      <FeedList community={community.name} />
    </div>
  );
}
