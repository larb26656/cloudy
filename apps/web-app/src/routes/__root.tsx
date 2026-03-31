import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useLoadingStore } from "@/stores/loadingStore";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

function RootComponent() {
  const isLoading = useLoadingStore((state) => state.isLoading);

  return (
    <>
      <Outlet />
      {isLoading && <LoadingOverlay />}
    </>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
