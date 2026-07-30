import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { ErrorState, NotFound } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useGlobalEvent } from "@/providers";

function RootComponent() {
  const { status } = useGlobalEvent();
  return (
    <div>
      <h1>Status: {status}</h1>
      <Outlet />
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
          error.message || "An unexpected error occurred. Please try again."
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
