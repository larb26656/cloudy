import { useOnboardingStore } from "@/stores/onboardingStore";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_onboardLayout")({
  component: OnboardLayout,
});

function OnboardLayout() {
  const hasCompletedOnboarding = useOnboardingStore(
    (state) => state.hasCompletedOnboarding,
  );

  if (hasCompletedOnboarding) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}
