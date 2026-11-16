import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const alt = "Curia Discussion Post";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

interface Props {
  params: Promise<{ community: string; id: string }>;
}

export default async function Image({ params }: Props) {
  const { community: communityParam, id: postId } = await params;

  let title = "Curia Technical Discussion";
  let communityName = communityParam || "curia";
  let authorUsername = "curia_engineer";
  let postType = "text";
  let commentCount = 0;

  try {
    const admin = createAdminClient();
    const { data: post } = (await admin
      .from("posts")
      .select("title, type, comment_count, author:profiles(username), community:communities(name)")
      .eq("id", postId)
      .maybeSingle()) as unknown as {
      data: {
        title: string;
        type: string;
        comment_count: number;
        author: { username: string } | null;
        community: { name: string } | null;
      } | null;
    };

    if (post) {
      title = post.title;
      postType = post.type;
      commentCount = post.comment_count ?? 0;
      if (post.author?.username) authorUsername = post.author.username;
      if (post.community?.name) communityName = post.community.name;
    }
  } catch {
    // Fallback defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0B0D12",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #181C25 2%, transparent 0%), radial-gradient(circle at 75px 75px, #181C25 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          color: "#E6E9F0",
        }}
      >
        {/* Top Brand Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "36px", fontWeight: "900", letterSpacing: "-1.5px" }}>curia</span>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#7C5CFF",
                boxShadow: "0 0 16px #7C5CFF",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 20px",
              borderRadius: "9999px",
              backgroundColor: "#12151C",
              border: "1px solid #232834",
              color: "#22D3EE",
              fontSize: "20px",
              fontFamily: "monospace",
              fontWeight: "600",
            }}
          >
            <span>c/{communityName}</span>
          </div>
        </div>

        {/* Center Post Title Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            backgroundColor: "#12151C",
            border: "2px solid #232834",
            borderRadius: "24px",
            padding: "44px 50px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                padding: "6px 16px",
                borderRadius: "8px",
                backgroundColor: "rgba(124, 92, 255, 0.15)",
                border: "1px solid rgba(124, 92, 255, 0.3)",
                color: "#7C5CFF",
                fontSize: "16px",
                fontFamily: "monospace",
                textTransform: "uppercase",
              }}
            >
              {postType}
            </div>
            <span style={{ color: "#8B93A7", fontSize: "18px" }}>Posted by u/{authorUsername}</span>
          </div>

          <div
            style={{
              fontSize: title.length > 80 ? "34px" : "44px",
              fontWeight: "800",
              lineHeight: 1.25,
              color: "#E6E9F0",
              letterSpacing: "-1px",
              maxHeight: "170px",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom Metadata Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px", color: "#8B93A7", fontSize: "20px" }}>
            <span>{commentCount} Comments</span>
            <span>•</span>
            <span>Technical Discussions</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#7C5CFF", fontSize: "18px", fontFamily: "monospace" }}>
            <span>curia.vercel.app</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
