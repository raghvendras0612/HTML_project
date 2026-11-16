import { redirect } from "next/navigation";

export default async function CommentsAliasPage({
  params,
}: {
  params: Promise<{ community: string; id: string }>;
}) {
  const { community, id } = await params;
  redirect(`/c/${encodeURIComponent(community)}/post/${encodeURIComponent(id)}`);
}
