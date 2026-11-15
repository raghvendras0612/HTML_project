import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sparkles, Flame, ShieldAlert, ArrowUp, ArrowDown } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-24 bg-background">
      <div className="z-10 max-w-2xl w-full items-center justify-between font-mono text-sm">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center font-bold text-white shadow-glow">
              C
            </div>
            <span className="font-sans font-bold text-xl text-foreground">Curia</span>
          </div>
          <Badge variant="cyan">v0.1.0 Scaffolding</Badge>
        </div>

        <div className="mt-8 space-y-6">
          <Card className="curia-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <CardTitle>Design System & Token Verification</CardTitle>
              </div>
              <CardDescription>
                Next.js 15 App Router + Tailwind CSS with strict dark-first tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Accent Primary</Button>
                <Button variant="glow">Glow Violet-Cyan</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="danger">
                  <ShieldAlert className="mr-1.5 h-4 w-4" /> Danger
                </Button>
                <Button variant="success">Success</Button>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center bg-surface-raised rounded-lg border border-border p-1">
                  <Button variant="upvote" size="icon-sm">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <span className="font-mono text-xs font-semibold px-2 text-foreground">
                    +4.2k
                  </span>
                  <Button variant="downvote" size="icon-sm">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="mod">
                  <Flame className="mr-1 h-3 w-3 text-upvote" /> Hot Feed
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
