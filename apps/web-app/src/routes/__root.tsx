import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { ErrorState, NotFound } from "@/components/ui/route-state";
import { Button } from "@/components/ui/button";
import { Center } from "@/components/layout";

function RootComponent() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background pt-safe pb-safe">
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
