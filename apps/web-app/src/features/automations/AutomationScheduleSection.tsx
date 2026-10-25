import { CalendarDays, Globe2, RefreshCw } from "lucide-react";

interface AutomationScheduleSectionProps {
  schedule?: {
    enabled: boolean;
    cron: string;
    timezone: string;
  } | null;
  occurrences: string[];
}

export function AutomationScheduleSection({
  schedule,
  occurrences,
}: AutomationScheduleSectionProps) {
  if (!schedule) {
    return (
      <section className="flex items-center gap-3 rounded-xl border p-4 text-sm text-muted-foreground">
        <CalendarDays aria-hidden="true" />
        This automation runs on demand.
      </section>
    );
  }

  return (
    <section
      className="grid gap-4 rounded-xl border p-4 md:p-5"
      aria-label="Schedule"
    >
      <h3 className="flex items-center gap-3 text-lg font-semibold">
        <CalendarDays aria-hidden="true" />
        Schedule
      </h3>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <RefreshCw className="size-4" aria-hidden="true" />
          {schedule.enabled ? schedule.cron : "Schedule paused"}
        </span>
        <span className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
          <Globe2 className="size-4" aria-hidden="true" />
          {schedule.timezone}
        </span>
      </div>
      {occurrences.length > 0 && (
        <div className="grid gap-3 border-t pt-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Next {occurrences.length} runs
          </h4>
          <ol
            aria-label="Next three occurrences"
            className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
          >
            {occurrences.map((date, index) => (
              <li
                key={date}
                className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${index === 0 ? "border-primary/50 bg-primary/5" : ""}`}
              >
                <CalendarDays
                  className={`size-5 shrink-0 ${index === 0 ? "text-primary" : "text-muted-foreground"}`}
                  aria-hidden="true"
                />
                <div className="grid min-w-0">
                  <time dateTime={date}>
                    {new Date(date).toLocaleString(undefined, {
                      timeZone: schedule.timezone,
                      dateStyle: "medium",
                    })}
                  </time>
                  <span className="text-muted-foreground">
                    {new Date(date).toLocaleString(undefined, {
                      timeZone: schedule.timezone,
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
