import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Communities",
  description: "Discover and join technical communities on Curia.",
};

export default function CommunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
