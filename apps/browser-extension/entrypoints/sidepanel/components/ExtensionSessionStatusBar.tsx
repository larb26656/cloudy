interface ExtensionSessionStatusBarProps {
  directory: string;
  isGenerating: boolean;
}

export function ExtensionSessionStatusBar({
  directory,
  isGenerating,
}: ExtensionSessionStatusBarProps) {
  return (
    <footer className="session-status">
      <span className="directory" title={directory}>
        {directory}
      </span>
      <span className={isGenerating ? "status status-live" : "status"}>
        {isGenerating ? "Generating" : "Ready"}
      </span>
    </footer>
  );
}
