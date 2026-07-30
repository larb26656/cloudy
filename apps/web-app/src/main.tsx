import { StrictMode } from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";
import { QueryProvider } from "./providers/QueryProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { GlobalEventProvider } from "./providers";

export const isModeElectron = false;

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <QueryProvider>
          <TooltipProvider>
            <GlobalEventProvider>
              <RouterProvider router={router} />
              <Toaster />
            </GlobalEventProvider>
          </TooltipProvider>
        </QueryProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
