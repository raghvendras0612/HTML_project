import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://curia.vercel.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/communities`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/guidelines`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    const admin = createAdminClient();

    // 1. Fetch communities
    const { data: communities } = await admin
      .from("communities")
      .select("name, created_at")
      .limit(50);

    const communityRoutes: MetadataRoute.Sitemap = (communities || []).map((c) => ({
      url: `${siteUrl}/c/${c.name}`,
      lastModified: c.created_at ? new Date(c.created_at) : new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    }));

    // 2. Fetch top posts
    const { data: posts } = (await admin
      .from("posts")
      .select("id, created_at, community:communities(name)")
      .eq("is_removed", false)
      .limit(100)) as unknown as {
      data: Array<{ id: string; created_at: string; community: { name: string } | null }> | null;
    };

    const postRoutes: MetadataRoute.Sitemap = (posts || [])
      .filter((p) => p.community?.name)
      .map((p) => ({
        url: `${siteUrl}/c/${p.community!.name}/post/${p.id}`,
        lastModified: p.created_at ? new Date(p.created_at) : new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      }));

    return [...staticRoutes, ...communityRoutes, ...postRoutes];
  } catch {
    return staticRoutes;
  }
}
