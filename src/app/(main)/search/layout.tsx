import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search posts, communities, and users on Curia.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
