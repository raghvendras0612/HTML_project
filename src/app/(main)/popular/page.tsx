import { FeedList } from "@/components/feed/feed-list";

export const metadata = {
  title: "Popular Posts | Curia",
  description: "Browse the most popular discussions across Curia.",
};

export default function PopularPage() {
  return (
    <div className="space-y-4">
      <FeedList feedType="popular" />
    </div>
  );
}
