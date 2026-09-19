import { ASK_DIRECTORY } from "../services/opencode";

interface ExtensionSessionStatusBarProps {
  isGenerating: boolean;
}

export function ExtensionSessionStatusBar({
  isGenerating,
}: ExtensionSessionStatusBarProps) {
  return (
    <footer className="session-status">
      <span className="directory" title={ASK_DIRECTORY}>
        {ASK_DIRECTORY}
      </span>
      <span className={isGenerating ? "status status-live" : "status"}>
        {isGenerating ? "Generating" : "Ready"}
      </span>
    </footer>
  );
}
