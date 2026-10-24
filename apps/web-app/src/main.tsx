import { StrictMode } from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { Toaster } from "@repo/ui/components/sonner";
import { QueryProvider } from "./providers/QueryProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { GlobalEventProvider } from "./providers";
import { useChatPanelStore } from "./stores/chatPanelStore";
import { useTabStore } from "./stores/tabStore";
import { env } from "./config/env";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

localStorage.removeItem("workspaces");
const liveTabIds = new Set(useTabStore.getState().tabs.map((t) => t.id));
useChatPanelStore.getState().pruneExcept(liveTabIds);

async function renderApp(): Promise<void> {
  try {
    const response = await fetch(new URL("/api/health", env.getApiUrl()), {
      headers: env.getAuthHeaders(),
    });
    if (response.status === 401 && window.location.pathname !== "/pair") {
      window.location.replace("/pair");
      return;
    }
  } catch {
    return renderWithoutApi();
  }

  renderWithoutApi();
}

function renderWithoutApi(): void {
  const rootElement = document.getElementById("root")!;
  if (rootElement.innerHTML) return;
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

void renderApp();
