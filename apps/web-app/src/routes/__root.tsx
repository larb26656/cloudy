import { useEffect } from "react";
import {
  createRootRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { ErrorState, NotFound } from "@/components/ui/route-state";
import { Button } from "@repo/ui/components/button";
import { Center } from "@/components/layout";
import { FloatingPet } from "@/components/pet/FloatingPet";
import { DesktopPetRestore } from "@/components/pet/DesktopPetRestore";
import type { SessionTabPayload } from "@/components/pet/openSessionTab";
import { isModeElectron } from "@/config/env";
import { petBridge } from "@/lib/desktop/petBridge";
import { useTabStore } from "@/stores/tabStore";
import { cn } from "@repo/ui/lib/utils";

function openSessionTabInWindow(payload: SessionTabPayload) {
  switch (payload.type) {
    case "chat":
      useTabStore.getState().openTab("chat", payload.data);
      break;
    case "bot-chat":
      useTabStore.getState().openTab("bot-chat", payload.data);
      break;
  }
}

function RootComponent() {
  const isPetRoute =
    useRouterState({ select: (state) => state.location.pathname }) === "/pet";

  useEffect(() => {
    if (!isModeElectron) return undefined;
    if (window.__CLOUDY_DESKTOP__?.windowKind === "pet") return undefined;
    return petBridge.onOpenSession(openSessionTabInWindow);
  }, []);

  return (
    <div
      className={cn(
        "flex h-dvh w-full flex-col overflow-hidden pt-safe pb-safe",
        !isPetRoute && "bg-background",
      )}
    >
      <Outlet />
      {!isPetRoute &&
        (isModeElectron ? <DesktopPetRestore /> : <FloatingPet />)}
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
});

function NotFoundPage() {
  return (
    <Center className="min-h-screen bg-muted/40 px-4">
      <NotFound
        action={
          <Link to="/">
            <Button>Go home</Button>
          </Link>
        }
      />
    </Center>
  );
}

function ErrorPage({ error }: { error: Error }) {
  return (
    <Center className="min-h-screen bg-muted/40 px-4">
      <ErrorState
        description={
          error.message || "An unexpected error occurred. Please try again."
        }
        action={
          <Link to="/">
            <Button>Go home</Button>
          </Link>
        }
      />
    </Center>
  );
}
