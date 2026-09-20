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

  if (browserWorkspace.isLoading || browserWorkspace.isError) {
    return (
      <BrowserWorkspaceLanding
        isLoading={browserWorkspace.isLoading}
        isInitializing={false}
        error={browserWorkspace.error}
        onInitialize={() => undefined}
        onRetry={() => void browserWorkspace.refetch()}
      />
    );
  }

  if (!directory) {
    return (
      <BrowserWorkspaceLanding
        isLoading={false}
        isInitializing={initializeWorkspace.isPending}
        error={initializeWorkspace.error}
        onInitialize={() => initializeWorkspace.mutate()}
        onRetry={() => initializeWorkspace.mutate()}
      />
    );
  }

  return <>{children(directory)}</>;
}
