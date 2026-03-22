# OpenCode Chat - Phase 2 PRD

## Document Information
- **Version:** 2.0.0
- **Date:** 2026-03-09
- **Phase:** Phase 2 - Enhanced Features

---

## 1. Feature Overview

### 1.1 Model Selection Per Message
**User Story:**
```
As a user, I want to select which AI model to use for the next message
So that I can choose the best model for each specific task
```

**Acceptance Criteria:**
- [ ] Dropdown/model selector in chat input area
- [ ] Show available models from API (OpenAI, Claude, local models, etc.)
- [ ] Display model info (name, provider, capabilities)
- [ ] Remember last used model per session
- [ ] Visual indicator of current selected model
- [ ] Quick switch between recent models

**Technical Requirements:**
```typescript
interface ModelConfig {
  providerID: string;      // "openai", "anthropic", "local"
  modelID: string;         // "gpt-4", "claude-3-opus"
  name: string;            // Display name
  description?: string;    // Model capabilities
  maxTokens?: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
}

interface SendMessageRequest {
  model?: ModelConfig;     // Optional - use default if not specified
  parts: PartInput[];
  // ... other fields
}
```

**UI/UX:**
- Model selector dropdown ใน input area (ขวาล่าง หรือ บน input)
- Badge แสดง model ที่เลือกอยู่
- Hover แสดง model info
- Shortcut key (Cmd/Ctrl + M) เปลี่ยน model เร็ว

---

### 1.2 AI Thinking & Tool Usage Visibility
**User Story:**
```
As a user, I want to see what AI is doing (thinking, using tools)
So that I can understand and steer AI's actions
```

**Acceptance Criteria:**
- [ ] Show "thinking" state when AI is reasoning
- [ ] Display tool calls (name, arguments) in real-time
- [ ] Show tool execution progress
- [ ] Display intermediate steps/milestones
- [ ] Allow user to cancel/interrupt tool execution
- [ ] Collapsible thinking blocks

**Events to Handle:**
```typescript
// From API SSE
type ToolEvent = {
  type: 'tool.start';
  properties: {
    sessionID: string;
    messageID: string;
    tool: string;           // "read_file", "execute_command", etc.
    arguments: object;      // Tool parameters
  }
} | {
  type: 'tool.progress';
  properties: {
    sessionID: string;
    messageID: string;
    progress: number;       // 0-100
    status: string;         // "Reading file...", "Executing..."
  }
} | {
  type: 'tool.complete' | 'tool.error';
  properties: {
    sessionID: string;
    messageID: string;
    result?: any;
    error?: string;
  }
} | {
  type: 'reasoning.start' | 'reasoning.delta' | 'reasoning.complete';
  properties: {
    sessionID: string;
    messageID: string;
    text?: string;          // Reasoning content
  }
}
```

**UI Components:**
```typescript
interface ThinkingBlockProps {
  isActive: boolean;
  reasoningText?: string;
  onToggle?: () => void;
}

interface ToolCallCardProps {
  tool: string;
  arguments: object;
  status: 'pending' | 'running' | 'complete' | 'error';
  progress?: number;
  result?: any;
  onCancel?: () => void;
}
```

**UX Design:**
- Thinking block: Collapsible section สีเทาอ่อน มี icon 💭
- Tool cards: Card แยกแต่ละ tool มี progress bar, status badge
- Real-time updates: ข้อมูลอัพเดททันทีที่ได้รับ event
- Cancel button: หยุด tool execution ได้

---

### 1.3 Directory Path Configuration & Session Filtering
**User Story:**
```
As a user, I want to configure the working directory path
So that I can work with files in my project
```

**Extended User Story - Session Filtering:**
```
As a user, I want to filter sessions by directory
So that I can easily find and work with sessions in specific projects
```

**Acceptance Criteria:**
- [ ] Set/change working directory per session
- [ ] Validate directory exists and is accessible
- [ ] Show current directory in header/status bar
- [ ] Quick switch between recent directories
- [ ] Browse/select directory with file picker
- [ ] Display directory contents/tree view
- [ ] **Filter sessions list by selected directory**
- [ ] **Show "All Directories" option to view all sessions**
- [ ] **Directory selector in sidebar with recent directories list**
- [ ] **Auto-reload sessions when directory filter changes**
- [ ] **Visual indicator showing which directory is currently filtered**

**API Integration:**
```typescript
// Update session directory
PATCH /session/{sessionID}
{
  "directory": "/new/path/to/project"
}

// Validate directory
GET /directory/validate?path=/path/to/project

// List directory contents
GET /directory/list?path=/path/to/project

// List sessions filtered by directory
GET /session?directory=/path/to/project&roots=true&limit=50
// Returns only sessions in the specified directory

// List all sessions (no filter)
GET /session?roots=true&limit=50
```

**UI Components:**
```typescript
interface DirectoryConfigProps {
  currentDirectory: string;
  onChange: (newPath: string) => void;
  recentDirectories: string[];
}

interface DirectoryBrowserProps {
  rootPath: string;
  onSelect: (selectedPath: string) => void;
  fileFilter?: string[];    // [".js", ".ts", ".json"]
}

interface DirectoryFilterProps {
  selectedDirectory: string | null;
  recentDirectories: string[];
  onSelect: (directory: string | null) => void;
}

// Directory Filter State
interface DirectoryState {
  selectedDirectory: string | null;
  recentDirectories: string[];
  availableDirectories: string[];  // Extracted from existing sessions
}
```

**UX Design:**
- Directory badge ใน header: แสดง path ปัจจุบัน (truncate ถ้ายาว)
- Click to edit: เปลี่ยน path ได้ทันที
- Dropdown: Recent directories + Browse button
- File tree panel: แสดงไฟล์ใน directory (optional sidebar)
- **Directory Filter in Sidebar:**
  - Dropdown selector ใต้ปุ่ม "New Chat"
  - แสดงชื่อ directory (หรือ "All Directories")
  - Recent directories list (สูงสุด 5 รายการ)
  - Custom path input สำหรับพิมพ์ path เอง
  - Clear filter button (X) กลับไปดูทั้งหมด
  - Active state highlight สีฟ้า

**UI Mockup - Directory Filter:**
```
┌─────────────────────────────────────┐
│ [+ New Chat]                        │
├─────────────────────────────────────┤
│ 📁 [All Directories    ▼]          │
├─────────────────────────────────────┤
│ 🔍 Search chats...                  │
├─────────────────────────────────────┤
│ ● Session 1                    2m   │
│ ● Session 2                    5m   │
│ ...                                 │
└─────────────────────────────────────┘

Dropdown Open:
┌─────────────────────────────────────┐
│ 📁 All Directories         ✓       │
│ ─────────────────────────────────── │
│ 🕐 Recent:                          │
│    📁 /path/to/project-1           │
│    📁 /path/to/project-2           │
│ ─────────────────────────────────── │
│ Custom Path:                        │
│ [____________] [Go]                 │
└─────────────────────────────────────┘
```

**Technical Flow:**
1. User selects directory from dropdown
2. UI updates `selectedDirectory` state
3. Call `loadSessions(selectedDirectory)` with filter parameter
4. API returns only sessions in that directory
5. Session list re-renders with filtered results
6. Update "New Chat" button to create session in selected directory

---

### 1.4 File Mention with Fuzzy Search
**User Story:**
```
As a user, I want to mention/reference files using fuzzy search
So that I can quickly include files in my messages
```

**Acceptance Criteria:**
- [ ] Trigger with @ symbol or / symbol
- [ ] Fuzzy search across all files in directory
- [ ] Show file icon, path, and preview
- [ ] Keyboard navigation (arrow keys, enter)
- [ ] Include file content or reference in message
- [ ] Support glob patterns (e.g., "@src/**/*.js")

**Technical Implementation:**
```typescript
// File mention trigger
interface FileMentionProps {
  directory: string;
  onSelect: (files: FileReference[]) => void;
  maxResults?: number;
}

interface FileReference {
  path: string;           // Relative path
  absolutePath: string;   // Full path
  name: string;
  extension: string;
  size: number;
  lastModified: number;
  content?: string;       // File content (if small)
}

// Fuzzy search function
function fuzzySearchFiles(
  query: string,
  files: FileReference[],
  options?: {
    maxResults?: number;
    includeContent?: boolean;
  }
): FileReference[];
```

**API Integration:**
```typescript
// Search files
GET /directory/search?directory=/path&query=user&limit=10

// Get file content
GET /file/read?path=/path/to/file.js

// Send message with file references
POST /session/{sessionID}/message
{
  "parts": [
    { "type": "text", "text": "Review this file:" },
    { 
      "type": "file", 
      "path": "src/components/App.tsx",
      "content": "..."  // Optional: include content
    }
  ]
}
```

**UI/UX:**
- Trigger: พิมพ์ `@` หรือ `/` ใน input → เปิด search dropdown
- Search UI: Input + รายการไฟล์ แสดง icon, path, highlight matching text
- Fuzzy matching: ค้นหาแบบยืดหยุ่น (e.g., "usrctrl" → "UserController")
- Keyboard shortcuts:
  - `↑↓` Navigate results
  - `Enter` Select
  - `Esc` Cancel
  - `Tab` Accept first match
- Visual: File icons ตาม extension, breadcrumb path, size info

---

## 2. Technical Architecture

### 2.1 State Management Updates

```typescript
// stores/uiStore.ts - Add new state
interface UIState {
  // ... existing state
  
  // Model selection
  selectedModel: ModelConfig | null;
  availableModels: ModelConfig[];
  
  // Directory & Session Filtering
  selectedDirectory: string | null;   // null = show all sessions
  recentDirectories: string[];
  directoryTree: DirectoryNode | null;
  
  // File search
  isFileSearchOpen: boolean;
  fileSearchQuery: string;
  fileSearchResults: FileReference[];
  
  // Tool visibility
  expandedThinkingBlocks: string[];  // messageIDs
  expandedToolCards: string[];       // tool execution IDs
}

// stores/sessionStore.ts - Add directory filter
interface SessionState {
  // ... existing state
  
  // Directory filtering
  currentDirectory: string | null;
  
  // Actions
  loadSessions: (directory?: string | null) => Promise<void>;
  setCurrentDirectory: (directory: string | null) => void;
}

// stores/messageStore.ts - Add thinking/tool state
interface MessageState {
  // ... existing state
  
  thinkingContent: Record<string, string>;  // messageID -> thinking text
  toolExecutions: Record<string, ToolExecution[]>;  // messageID -> tools
}

interface ToolExecution {
  id: string;
  tool: string;
  arguments: object;
  status: 'pending' | 'running' | 'complete' | 'error';
  progress: number;
  result?: any;
  error?: string;
  startTime: number;
  endTime?: number;
}
```

### 2.2 Event Handling Updates

```typescript
// hooks/useEventSource.ts - Handle new events
switch (data.type) {
  // ... existing cases
  
  case 'reasoning.start':
    messageStore.setThinkingState(props.messageID, 'active');
    break;
    
  case 'reasoning.delta':
    messageStore.appendThinkingText(props.messageID, props.text);
    break;
    
  case 'reasoning.complete':
    messageStore.setThinkingState(props.messageID, 'complete');
    break;
    
  case 'tool.start':
    messageStore.addToolExecution(props.messageID, {
      id: props.partID,
      tool: props.tool,
      arguments: props.arguments,
      status: 'running',
      progress: 0,
    });
    break;
    
  case 'tool.progress':
    messageStore.updateToolProgress(props.messageID, props.partID, {
      progress: props.progress,
      status: props.status,
    });
    break;
    
  case 'tool.complete':
    messageStore.completeToolExecution(props.messageID, props.partID, {
      result: props.result,
      status: 'complete',
    });
    break;
}
```

### 2.3 New Components

```
src/
├── components/
│   ├── chat/
│   │   ├── ModelSelector.tsx        # Model dropdown/selector
│   │   ├── ThinkingBlock.tsx        # Collapsible thinking content
│   │   ├── ToolCallCard.tsx         # Tool execution card
│   │   └── FileMentionDropdown.tsx  # Fuzzy file search
│   ├── settings/
│   │   ├── DirectoryConfig.tsx      # Directory path config
│   │   └── SettingsModal.tsx        # Main settings modal
│   └── common/
│       ├── FuzzySearch.tsx          # Reusable fuzzy search
│       └── FileIcon.tsx             # File type icons
├── hooks/
│   ├── useFileSearch.ts             # File search logic
│   ├── useDirectory.ts              # Directory operations
│   └── useModels.ts                 # Model management
└── utils/
    ├── fuzzyMatch.ts                # Fuzzy matching algorithm
    └── fileUtils.ts                 # File path utilities
```

---

## 3. UI/UX Specifications

### 3.1 Model Selector Design

```
┌─────────────────────────────────────────────────────────┐
│ [Input Area]                                            │
│ ┌──────────────────────────────────────┬──────────────┐ │
│ │ Type a message...                    │ [GPT-4 ▼]    │ │
│ │                                      │              │ │
│ └──────────────────────────────────────┴──────────────┘ │
│                                                         │
│ Dropdown:                                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔍 Search models...                                 │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 🤖 OpenAI                                           │ │
│ │    ├─ GPT-4 (Current)                               │ │
│ │    ├─ GPT-4 Turbo                                   │ │
│ │    └─ GPT-3.5 Turbo                                 │ │
│ │ 🎭 Anthropic                                        │ │
│ │    ├─ Claude 3 Opus                                 │ │
│ │    └─ Claude 3 Sonnet                               │ │
│ │ 🏠 Local                                            │ │
│ │    └─ Llama 2 (local)                               │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 3.2 AI Thinking Block

```
┌─────────────────────────────────────────────────────────┐
│ 💭 AI is thinking... [▼]                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Let me analyze the code structure...                │ │
│ │ First, I'll check the imports...                    │ │
│ │ The issue seems to be in the useEffect hook...     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Tool Execution Card

```
┌─────────────────────────────────────────────────────────┐
│ 🔧 read_file                                            │
│ src/components/App.tsx                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━ 100%                          │
│ [████████████████████] ✓ Complete (2.3 KB)             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ⚙️ execute_command                                      │
│ npm run build                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━ 45%                           │
│ [██████████░░░░░░░░░░] 🔄 Building...                  │
│ Output: Compiling modules...                            │
│ [Cancel]                                               │
└─────────────────────────────────────────────────────────┘
```

### 3.4 File Mention Dropdown

```
┌─────────────────────────────────────────────────────────┐
│ Type: @                                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔍 user                                              │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 📄 UserController.ts        src/controllers/         │ │
│ │ 📄 UserService.ts          src/services/             │ │
│ │ 📁 users/                  src/data/                 │ │
│ │ 📄 user.config.js          config/                   │ │
│ │ 📄 User.types.ts          src/types/                 │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Timeline

### Week 1: Foundation
- [ ] Setup ModelSelector component
- [ ] Fetch available models from API
- [ ] Store selected model in state
- [ ] Integrate model selection into send message flow

### Week 2: Tool Visibility
- [ ] Create ThinkingBlock component
- [ ] Create ToolCallCard component
- [ ] Handle reasoning events (start/delta/complete)
- [ ] Handle tool events (start/progress/complete/error)
- [ ] Add animations and transitions

### Week 3: Directory Configuration
- [ ] Create DirectoryConfig component
- [ ] Implement directory validation
- [ ] Add file tree view
- [ ] Persist recent directories
- [ ] Integrate with session API

### Week 4: File Mention
- [ ] Implement fuzzy search algorithm
- [ ] Create FileMentionDropdown component
- [ ] Add @ trigger mechanism
- [ ] Keyboard navigation
- [ ] File icon mapping
- [ ] Integration with message sending

---

## 5. API Requirements

### New Endpoints Needed:

```yaml
# Get available models
GET /models
Response:
  - providerID: string
  - modelID: string
  - name: string
  - description: string
  - capabilities: string[]

# Validate directory
GET /directory/validate
Params:
  - path: string
Response:
  - valid: boolean
  - error?: string

# List directory
GET /directory/list
Params:
  - path: string
  - recursive?: boolean
Response:
  - files: FileInfo[]
  - directories: DirectoryInfo[]

# Search files
GET /directory/search
Params:
  - directory: string
  - query: string
  - limit?: number
Response:
  - results: FileInfo[]

# Read file
GET /file/read
Params:
  - path: string
Response:
  - content: string
  - size: number
  - encoding: string
```

---

## 6. Testing Checklist

### Model Selection
- [ ] Can select different models
- [ ] Model persists across messages
- [ ] Model resets on new session (configurable)
- [ ] Shows loading state when fetching models
- [ ] Handles API errors gracefully

### Tool Visibility
- [ ] Thinking block expands/collapses
- [ ] Shows reasoning content
- [ ] Tool cards show correct status
- [ ] Progress bars update smoothly
- [ ] Cancel button stops tool execution
- [ ] Error states handled properly

### Directory Config & Session Filtering
- [ ] Can change directory
- [ ] Validates directory exists
- [ ] Shows error for invalid paths
- [ ] Recent directories list works
- [ ] File tree displays correctly
- [ ] **Directory filter dropdown shows in sidebar**
- [ ] **Selecting directory filters session list**
- [ ] **"All Directories" shows all sessions**
- [ ] **Session count updates when filter changes**
- [ ] **New Chat creates session in selected directory**
- [ ] **Recent directories persist across reloads**
- [ ] **Custom path input works**
- [ ] **Clear filter button (X) works**
- [ ] **Active directory highlighted in dropdown**

### File Mention
- [ ] @ trigger opens search
- [ ] Fuzzy search returns correct results
- [ ] Keyboard navigation works
- [ ] Selected files added to message
- [ ] Works with nested directories

---

## Appendix

### Color Coding for Tool Status
- **Pending:** Gray ⏳
- **Running:** Blue 🔄
- **Complete:** Green ✅
- **Error:** Red ❌

### Keyboard Shortcuts
- `Cmd/Ctrl + M` - Open model selector
- `Cmd/Ctrl + D` - Open directory config
- `@` or `/` - Open file mention
- `Esc` - Close any dropdown/modal
- `↑↓` - Navigate lists
- `Enter` - Select/Confirm

### File Type Icons
- `.js/.ts` - 📄 JavaScript/TypeScript
- `.json` - 📋 JSON
- `.md` - 📝 Markdown
- `.css/.scss` - 🎨 Styles
- Folder - 📁 Directory
- Default - 📄 File
