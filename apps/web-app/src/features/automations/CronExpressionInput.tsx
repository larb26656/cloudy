import { useEffect, useState } from "react";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";

const cronPresets = [
  ["Daily at 09:00", "0 9 * * *"],
  ["Weekdays at 09:00", "0 9 * * 1-5"],
  ["Weekly on Monday", "0 9 * * 1"],
  ["Hourly", "0 * * * *"],
  ["Every minute", "* * * * *"],
] as const;

const fieldLimits = [59, 23, 31, 12, 7];
const fieldMinimums = [0, 0, 1, 1, 0];
const fieldNames = ["Minute", "Hour", "Day", "Month", "Weekday"];

export function isValidCron(value: string) {
  const fields = value.trim().split(/\s+/);
  return (
    fields.length === 5 &&
    fields.every((field, index) =>
      field.split(",").every((part) => {
        const [range, step, ...extra] = part.split("/");
        if (extra.length || !range) return false;
        if (step !== undefined && (!/^\d+$/.test(step) || Number(step) < 1))
          return false;
        if (range === "*") return true;
        const endpoints = range.split("-");
        return (
          endpoints.length <= 2 &&
          endpoints.every(
            (endpoint) =>
              /^\d+$/.test(endpoint) &&
              Number(endpoint) >= fieldMinimums[index]! &&
              Number(endpoint) <= fieldLimits[index]!,
          ) &&
          (endpoints.length === 1 ||
            Number(endpoints[0]) <= Number(endpoints[1]))
        );
      }),
    )
  );
}

export function describeCron(value: string) {
  const [minute, hour, day, month, weekday] = value.split(" ");
  if (value === "* * * * *") return "Every minute";
  if (minute?.startsWith("*/")) return `Every ${minute.slice(2)} minutes`;
  if (hour === "*" && minute !== "*") return `Every hour, at minute ${minute}`;
  if (day === "*" && month === "*" && weekday === "*")
    return `Every day at ${hour}:${minute?.padStart(2, "0")}`;
  if (day === "*" && month === "*" && weekday === "1-5")
    return `Every weekday at ${hour}:${minute?.padStart(2, "0")}`;
  if (day === "*" && month === "*" && weekday && /^\d$/.test(weekday)) {
    const dayName = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][Number(weekday)];
    return `Every ${dayName} at ${hour}:${minute?.padStart(2, "0")}`;
  }
  return "Runs on a custom schedule";
}

export function CronExpressionInput({
  value,
  onChange,
  id,
  label = "Cron expression",
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
}) {
  const [fields, setFields] = useState(() => value.trim().split(/\s+/));
  useEffect(() => {
    if (isValidCron(value)) setFields(value.trim().split(/\s+/));
  }, [value]);
  const selectedPreset = cronPresets.find(([, cron]) => cron === value)?.[1];
  const cronValue = fields.join(" ");
  const valid = isValidCron(cronValue);

  const updateField = (index: number, next: string) => {
    const updated = Array.from({ length: 5 }, (_, fieldIndex) =>
      fieldIndex === index ? next : (fields[fieldIndex] ?? ""),
    );
    setFields(updated);
    onChange(updated.join(" "));
  };

  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-sm">
        Schedule preset
        <Select
          items={[
            ...cronPresets.map(([label, value]) => ({ label, value })),
            { label: "Custom expression", value: "custom" },
          ]}
          value={selectedPreset ?? "custom"}
          onValueChange={(next) => {
            if (next && next !== "custom") onChange(next);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cronPresets.map(([name, cron]) => (
              <SelectItem key={cron} value={cron}>
                {name}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom expression</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <fieldset className="grid gap-1">
        <legend className="text-sm">{label}</legend>
        <div className="grid grid-cols-5 gap-2">
          {fieldNames.map((field, index) => (
            <label
              key={field}
              className="grid gap-1 text-xs text-muted-foreground"
            >
              {field}
              <Input
                id={index === 0 ? id : undefined}
                aria-label={field}
                aria-invalid={!valid || undefined}
                className="h-9 min-w-0 px-2 font-mono"
                value={fields[index] ?? ""}
                onChange={(event) => updateField(index, event.target.value)}
                placeholder={["0", "9", "*", "*", "1-5"][index]}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          ))}
        </div>
      </fieldset>
      {valid ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {describeCron(cronValue)}
        </p>
      ) : (
        <p role="alert" className="text-sm text-destructive">
          Invalid cron expression. Minute: 0–59, hour: 0–23, day: 1–31, month:
          1–12, weekday: 0–7.
        </p>
      )}
    </div>
  );
}
