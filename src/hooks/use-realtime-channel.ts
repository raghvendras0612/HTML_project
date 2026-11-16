"use client";

import * as React from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface UseRealtimeChannelOptions<T extends Record<string, unknown>> {
  channelName: string;
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
  filter?: string;
  enabled?: boolean;
  onEvent: (payload: RealtimePostgresChangesPayload<T>) => void;
}

export function useRealtimeChannel<T extends Record<string, unknown>>({
  channelName,
  table,
  event = "*",
  schema = "public",
  filter,
  enabled = true,
  onEvent,
}: UseRealtimeChannelOptions<T>) {
  const [status, setStatus] = React.useState<string>("IDLE");
  const onEventRef = React.useRef(onEvent);
  onEventRef.current = onEvent;

  React.useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) {
      setStatus("DISABLED");
      return;
    }

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    const setupChannel = () => {
      // Create channel with unique suffix to prevent duplicate listeners
      const chan = supabase.channel(channelName);

      const filterConfig: {
        event: "INSERT" | "UPDATE" | "DELETE" | "*";
        schema: string;
        table: string;
        filter?: string;
      } = {
        event,
        schema,
        table,
      };

      if (filter) {
        filterConfig.filter = filter;
      }

      chan
        .on(
          "postgres_changes" as any,
          filterConfig,
          (payload: RealtimePostgresChangesPayload<T>) => {
            if (isMounted) {
              onEventRef.current(payload);
            }
          }
        )
        .subscribe((subscriptionStatus) => {
          if (isMounted) {
            setStatus(subscriptionStatus);
            if (subscriptionStatus === "CHANNEL_ERROR" || subscriptionStatus === "TIMED_OUT") {
              // Attempt reconnect after brief backoff
              setTimeout(() => {
                if (isMounted && chan) {
                  chan.subscribe();
                }
              }, 2000);
            }
          }
        });

      channel = chan;
    };

    setupChannel();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [channelName, table, event, schema, filter, enabled]);

  return { status };
}
