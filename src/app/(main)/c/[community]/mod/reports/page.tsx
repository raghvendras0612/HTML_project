"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle,
  Trash2,
  AlertTriangle,
  FileText,
  MessageSquare,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { formatTimeAgo } from "@/lib/utils";

interface ReportItem {
  id: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  post_id: string | null;
  comment_id: string | null;
  reporter?: {
    username: string;
    display_name?: string;
  };
  post?: {
    id: string;
    title: string;
    is_removed: boolean;
  };
  comment?: {
    id: string;
    body: string;
    is_removed: boolean;
  };
}

export default function ModeratorReportsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const communityName = (params.community as string) || "";

  const { data, isLoading, error } = useQuery<{ reports: ReportItem[] }>({
    queryKey: ["mod-reports", communityName],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityName}/reports`);
      if (res.status === 403) {
        throw new Error("403: Forbidden — Moderator access only");
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load reports");
      }
      return res.json();
    },
    retry: false,
  });

  const resolveMutation = useMutation({
    mutationFn: async ({
      reportId,
      action,
    }: {
      reportId: string;
      action?: "remove" | "dismiss";
    }) => {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          action,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to resolve report");
      return resData;
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.action === "remove"
          ? "Report resolved and content removed"
          : "Report resolved"
      );
      queryClient.invalidateQueries({ queryKey: ["mod-reports", communityName] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to resolve");
    },
  });

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <Card className="curia-card border-danger/40 p-6 text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-danger mx-auto" />
          <h2 className="text-lg font-bold text-danger">Access Denied</h2>
          <p className="text-xs text-muted-foreground font-mono">
            {error.message}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/c/${communityName}`}>Back to c/{communityName}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const reports = data?.reports || [];

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3">
          <Link
            href={`/c/${communityName}/mod`}
            className="p-1.5 rounded-lg border border-border hover:bg-surface-raised transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-accent" />
              <h1 className="text-base font-bold">Mod Queue: Reports</h1>
              <Badge variant="outline" className="text-[10px] font-mono">
                c/{communityName}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Review and act on user reports for this community
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="text-xs font-mono">
            <Link href={`/c/${communityName}/mod`}>
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Mod Team & Bans
            </Link>
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Reports List */}
      {!isLoading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="curia-card border-border/80 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <Badge variant="danger" className="text-[10px] uppercase font-mono">
                      {report.reason}
                    </Badge>
                    <span>•</span>
                    <span>
                      Reported by{" "}
                      <strong className="text-foreground">
                        u/{report.reporter?.username || "anonymous"}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>{formatTimeAgo(report.created_at)}</span>
                  </div>

                  {/* Target Post or Comment Preview */}
                  {report.comment && (
                    <div className="p-3 rounded-lg bg-surface-raised border border-border/70 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                        <MessageSquare className="h-3 w-3 text-accent" />
                        <span>Reported Comment</span>
                        {report.comment.is_removed && (
                          <span className="text-danger font-semibold">
                            (Currently Removed)
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-sans text-foreground">
                        &ldquo;{report.comment.body}&rdquo;
                      </p>
                    </div>
                  )}

                  {report.post && !report.comment && (
                    <div className="p-3 rounded-lg bg-surface-raised border border-border/70 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                        <FileText className="h-3 w-3 text-accent" />
                        <span>Reported Post</span>
                        {report.post.is_removed && (
                          <span className="text-danger font-semibold">
                            (Currently Removed)
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        {report.post.title}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center sm:flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => resolveMutation.mutate({ reportId: report.id })}
                    disabled={resolveMutation.isPending}
                    className="h-8 text-xs font-mono bg-accent hover:bg-accent/90 w-full"
                  >
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                    Resolve
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      resolveMutation.mutate({
                        reportId: report.id,
                        action: "remove",
                      })
                    }
                    disabled={resolveMutation.isPending}
                    className="h-8 text-xs font-mono border-danger/40 text-danger hover:bg-danger/10 w-full"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Remove Content
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && reports.length === 0 && (
        <Card className="curia-card p-12 text-center space-y-3">
          <CheckCircle className="h-10 w-10 text-success mx-auto" />
          <h3 className="text-sm font-bold font-mono">Mod Queue Clear!</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            There are currently no open reports needing moderation in c/{communityName}.
          </p>
        </Card>
      )}
    </div>
  );
}
