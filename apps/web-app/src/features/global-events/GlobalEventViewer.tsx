import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowDownToLine, Pause, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { useGlobalEventLogStore } from "@/stores/globalEventLogStore";

function stringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function eventType(payload: unknown) {
  if (typeof payload === "object" && payload !== null && "type" in payload) {
    return String(payload.type);
  }
  return "unknown";
}

export function GlobalEventViewer() {
  const events = useGlobalEventLogStore((state) => state.events);
  const clearEvents = useGlobalEventLogStore((state) => state.clearEvents);
  const [filter, setFilter] = useState("");
  const [isFollowing, setIsFollowing] = useState(true);
  const [newEventCount, setNewEventCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestEventId = events[0]?.id;
  const previousLatestEventId = useRef(latestEventId);
  const hasMounted = useRef(false);

  useEffect(() => {
    const previousId = previousLatestEventId.current;
    previousLatestEventId.current = latestEventId;
    if (latestEventId === undefined) {
      setNewEventCount(0);
    } else if (hasMounted.current) {
      const addedCount =
        previousId === undefined ? 1 : Math.max(0, latestEventId - previousId);
      if (addedCount > 0) {
        if (isFollowing) setNewEventCount(0);
        else setNewEventCount((count) => count + addedCount);
      }
    }
    hasMounted.current = true;

    if (isFollowing && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isFollowing, latestEventId]);

  const followLatest = () => {
    setIsFollowing(true);
    setNewEventCount(0);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  const filteredEvents = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return events;
    return events.filter((event) =>
      `${eventType(event.payload)} ${stringify(event.payload)}`
        .toLowerCase()
        .includes(query),
    );
  }, [events, filter]);

  return (
    <section className="flex h-full min-h-0 flex-col gap-2 p-2">
      <div className="flex items-center gap-2">
        <Input
          aria-label="Filter global events"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter events..."
          className="h-8 min-w-0"
        />
        <span className="shrink-0 text-xs text-muted-foreground">
          {filteredEvents.length}/{events.length}
        </span>
        <Button
          type="button"
          variant={isFollowing ? "secondary" : "outline"}
          size="sm"
          className="h-8 shrink-0 gap-1.5 px-2"
          aria-label={
            isFollowing
              ? "Pause following new events"
              : `Follow new events${newEventCount ? `, ${newEventCount} new` : ""}`
          }
          onClick={isFollowing ? () => setIsFollowing(false) : followLatest}
        >
          {isFollowing ? (
            <Pause className="size-3.5" />
          ) : (
            <ArrowDownToLine className="size-3.5" />
          )}
          <span>{isFollowing ? "Following" : "Follow"}</span>
          {!isFollowing && newEventCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
              {newEventCount}
            </span>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Clear global events"
          title="Clear events"
          onClick={clearEvents}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {filteredEvents.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <Activity className="size-5" />
          <span>
            {events.length ? "No matching events" : "Waiting for events"}
          </span>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="flex flex-col gap-2 p-1">
            {[...filteredEvents].reverse().map((event) => (
              <details
                key={event.id}
                className="min-w-0 rounded-md border border-border"
              >
                <summary className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs">
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {eventType(event.payload)}
                  </span>
                  <time className="shrink-0 text-muted-foreground">
                    {new Date(event.receivedAt).toLocaleTimeString()}
                  </time>
                </summary>
                <pre className="max-h-72 overflow-auto border-t border-border bg-muted p-2 text-[11px] leading-relaxed whitespace-pre-wrap break-all">
                  {stringify(event.payload)}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
