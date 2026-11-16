export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ trigger?: string }>;
}

export default async function TestErrorPage({ searchParams }: Props) {
  const { trigger } = await searchParams;
  if (trigger !== "false") {
    throw new Error("Intentional test server error for error.tsx verification.");
  }
  return <div>No error triggered</div>;
}
