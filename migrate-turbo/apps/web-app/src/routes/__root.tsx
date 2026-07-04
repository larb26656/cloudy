import {
  createRootRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { useLoadingStore } from "@/stores/loadingStore";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useEventStream } from "@/hooks/useEventSteam";
import { ErrorState, NotFound } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

function RootComponent() {
  const isLoading = useLoadingStore((state) => state.isLoading);

  useEventStream();

  return (
    <>
      <Outlet />
      {isLoading && <LoadingOverlay />}
    </>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
});

function NotFoundPage() {
  const state = useRouterState();
  console.log(window.location.href);
  console.log(state.location.pathname);

  console.log(state.location.search);

  console.log(state.matches);
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <NotFound
        action={
          <Link to="/">
            <Button>Go home</Button>
          </Link>
        }
      />
    </div>
  );
}

function ErrorPage({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <ErrorState
        description={
          error.message || "    An unexpected error occurred. Please try again."
        }
        action={
          <Link to="/">
            <Button>Go home</Button>
          </Link>
        }
      />
    </div>
  );
}
