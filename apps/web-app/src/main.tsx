import { StrictMode } from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import {
  RouterProvider,
  createHashHistory,
  createRouter,
} from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";

// Create a new router instance
const isElectron = import.meta.env.MODE === "electron";
// const router = createRouter({ routeTree, hash:  });

const buildCreateRouter = (isElectron: boolean) => {
  if (isElectron) {
    const hashHistory = createHashHistory();
    return createRouter({ routeTree, history: hashHistory });
  } else {
    return createRouter({ routeTree });
  }
};

const router = buildCreateRouter(isElectron);

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
        <RouterProvider router={router} />
        <Toaster />
      </TooltipProvider>
    </StrictMode>,
  );
}
