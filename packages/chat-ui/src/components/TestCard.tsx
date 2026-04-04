import { Button } from "@cloudy/ui"

export function TestCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">
        Hello from @cloudy/chat-ui
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This component uses Button from @cloudy/ui
      </p>
      <div className="mt-4 flex gap-2">
        <Button>Default</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </div>
  )
}
