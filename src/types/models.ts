// types/models.ts

export interface ModelConfig {
  providerID: string;      // "openai", "anthropic", "local"
  modelID: string;         // "gpt-4", "claude-3-opus"
  name: string;            // Display name
  description?: string;    // Model capabilities
  maxTokens?: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
}

export interface ModelProvider {
  id: string;
  name: string;
  icon?: string;
  models: ModelConfig[];
}

export interface ToolExecution {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'running' | 'complete' | 'error';
  progress: number;
  result?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
}

export interface FileReference {
  path: string;           // Relative path
  absolutePath: string;   // Full path
  name: string;
  extension: string;
  size: number;
  lastModified: number;
  content?: string;       // File content (if small)
}

export interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  size?: number;
  lastModified?: number;
}

export interface Agent {
  name: string;
  description?: string;
  mode: 'subagent' | 'primary' | 'all';
  native?: boolean;
  hidden?: boolean;
}
