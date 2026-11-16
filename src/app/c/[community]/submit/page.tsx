import { redirect } from "next/navigation";

export default async function CommunitySubmitPage({
  params,
}: {
  params: Promise<{ community: string }>;
}) {
  const { community } = await params;
  redirect(`/submit?c=${encodeURIComponent(community)}`);
}
