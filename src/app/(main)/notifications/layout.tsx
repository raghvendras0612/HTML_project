import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description: "View your discussion replies, mentions, and updates.",
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
