import { FeedList } from "@/components/feed/feed-list";

export const metadata = {
  title: "All Discussions | Curia",
  description: "Browse all posts across Curia communities.",
};

export default function AllPage() {
  return (
    <div className="space-y-4">
      <FeedList feedType="all" />
    </div>
  );
}
