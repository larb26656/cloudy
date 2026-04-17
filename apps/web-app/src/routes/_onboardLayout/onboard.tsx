import { createFileRoute, redirect } from "@tanstack/react-router";
import { Onboarding } from "@/features/onboarding/Onboarding";

export const Route = createFileRoute("/_onboardLayout/onboard")({
  component: OnboardPage,
});

function OnboardPage() {
  return (
    <div className="h-dvh flex items-center justify-center bg-background">
      <Onboarding
        onComplete={() => {
          throw redirect({ to: "/" });
        }}
      />
    </div>
  );
}
