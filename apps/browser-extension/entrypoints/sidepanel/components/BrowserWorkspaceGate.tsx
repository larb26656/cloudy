import type { ReactNode } from "react";
import {
  useBrowserWorkspace,
  useInitializeBrowserWorkspace,
} from "../hooks/useBrowserWorkspace";
import { BrowserWorkspaceLanding } from "./BrowserWorkspaceLanding";

interface BrowserWorkspaceGateProps {
  children: (directory: string) => ReactNode;
}

export function BrowserWorkspaceGate({ children }: BrowserWorkspaceGateProps) {
  const browserWorkspace = useBrowserWorkspace();
  const initializeWorkspace = useInitializeBrowserWorkspace();
  const directory =
    browserWorkspace.data?.initialized === true
      ? browserWorkspace.data.workspace.directory
      : null;
  const handleInitialize = () => initializeWorkspace.mutate();
  const handleRetryStatus = () => void browserWorkspace.refetch();

  if (browserWorkspace.isLoading || browserWorkspace.isError) {
    return (
      <BrowserWorkspaceLanding
        isLoading={browserWorkspace.isLoading}
        isInitializing={false}
        error={browserWorkspace.error}
        onInitialize={() => undefined}
        onRetry={handleRetryStatus}
      />
    );
  }

  if (!directory) {
    return (
      <BrowserWorkspaceLanding
        isLoading={false}
        isInitializing={initializeWorkspace.isPending}
        error={initializeWorkspace.error}
        onInitialize={handleInitialize}
        onRetry={handleInitialize}
      />
    );
  }

  return <>{children(directory)}</>;
}
