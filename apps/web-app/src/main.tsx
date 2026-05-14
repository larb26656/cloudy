import { StrictMode } from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import {
  RouterProvider,
  createHashHistory,
  createRouter,
} from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";
import { ContextSyncProvider } from "./providers/ContextSyncProvider";
import { ServerSettingsSyncProvider } from "./providers/ServerSettingsSyncProvider";

// Create a new router instance
export const isModeElectron = import.meta.env.MODE === "electron";
export const isElectronProd = import.meta.env.VITE_IS_ELECTRON_PROD;
// const router = createRouter({ routeTree, hash:  });

const buildCreateRouter = (isElectronProd: boolean) => {
  if (isElectronProd) {
    const hashHistory = createHashHistory();
    return createRouter({ routeTree, history: hashHistory });
  } else {
    return createRouter({ routeTree });
  }
};

const router = buildCreateRouter(isElectronProd);

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <TooltipProvider>
        <ContextSyncProvider>
          <ServerSettingsSyncProvider>
            <RouterProvider router={router} />
          </ServerSettingsSyncProvider>
        </ContextSyncProvider>
        <Toaster />
      </TooltipProvider>
    </StrictMode>,
  );
}
