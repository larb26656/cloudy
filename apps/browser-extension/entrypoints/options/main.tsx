import ReactDOM from "react-dom/client";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@repo/ui/components/switch";
import { useTheme } from "next-themes";
import "@repo/ui/styles/globals.css";
import "../sidepanel/styles/style.css";
import { ThemeProvider } from "../components/ThemeProvider";

function SettingsApp() {
  const { resolvedTheme, setTheme } = useTheme();

  function handleThemeChange(checked: boolean) {
    setTheme(checked ? "dark" : "light");
  }

  const isDark = resolvedTheme === "dark";

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:px-10">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Cloudy Extension
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Settings</h1>
        <section className="mt-10 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="font-medium">Appearance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use {isDark ? "dark" : "light"} mode in Cloudy.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Sun
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Switch
                checked={isDark}
                onCheckedChange={handleThemeChange}
                aria-label="Use dark mode"
              />
              <Moon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <SettingsApp />
  </ThemeProvider>,
);
