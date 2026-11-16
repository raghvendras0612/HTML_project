import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Post",
  description: "Submit a new technical discussion, link, or media post.",
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
