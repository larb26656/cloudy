interface SessionStatusBarProps {
  directory: string;
  isGenerating: boolean;
}

export function SessionStatusBar({
  directory,
  isGenerating,
}: SessionStatusBarProps) {
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
