import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PetOverlay } from "@/components/pet/PetOverlay";

function PetPage() {
  useEffect(() => {
    document.documentElement.setAttribute("data-pet-window", "true");
    return () => {
      document.documentElement.removeAttribute("data-pet-window");
    };
  }, []);

  return <PetOverlay />;
}

export const Route = createFileRoute("/pet")({
  component: PetPage,
});
