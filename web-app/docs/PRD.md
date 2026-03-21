# Chat UI Product Requirements Document (PRD)

## 1. Executive Summary

**Product Name:** OpenCode Chat  
**Version:** 1.0.0  
**Date:** 2026-03-09

### Vision

สร้าง Chat Interface ที่รวมความสะดวกสบายของ messaging apps อย่าง Telegram, LINE, Messenger เข้ากับความสามารถในการแสดงผล markdown แบบ ChatGPT โดยใช้ OpenCode API เป็น backend

### Target Users

- นักพัฒนาซอฟต์แวร์ที่ใช้ AI assistant
- ผู้ใช้งานที่ต้องการ chat interface ที่มีประสิทธิภาพ
- ทีมที่ต้องการจัดการหลาย session การสนทนา

---

## 2. Product Goals

### Primary Goals

1. **Intuitive Chat Experience** - Interface ที่ใช้งานง่ายเหมือน messaging apps ที่คุ้นเคย
2. **Rich Content Rendering** - แสดงผล markdown, code blocks, tables ได้สมบูรณ์แบบ
3. **Session Management** - จัดการหลาย session ได้อย่างมีประสิทธิภาพ
4. **Real-time Updates** - Streaming response แบบ real-time

### Success Metrics

- ผู้ใช้สามารถเริ่มต้นใช้งานได้ภายใน 5 นาที
- รองรับ markdown features ครบถ้วน (headers, lists, code blocks, tables, etc.)
- Switch ระหว่าง sessions ใช้เวลา < 100ms
- Streaming latency < 50ms per chunk

---

## 3. User Stories

### Core Chat Functionality

```
As a user
I want to send messages and receive AI responses in real-time
So that I can have natural conversations with AI

As a user
I want to see markdown-formatted responses with proper styling
So that I can read code, lists, and formatted text easily

As a user
I want to copy code blocks with one click
So that I can use code snippets in my projects quickly
```

### Session Management

```
As a user
I want to see all my chat sessions in a sidebar
So that I can switch between different conversations easily

As a user
I want to create new sessions with custom titles
So that I can organize my work by topic or project

As a user
I want to delete or archive old sessions
So that I can keep my workspace organized

As a user
I want to search through my sessions
So that I can find previous conversations quickly
```

### Advanced Features

```
As a user
I want to fork a conversation at any point
So that I can explore different branches of a discussion

As a user
I want to see the status of AI processing (idle/busy)
So that I know when to expect a response

As a user
I want to abort an ongoing AI response
So that I can stop irrelevant generations
```

---

## 4. Functional Requirements

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     HEADER                                   │
│  [Logo]    [Search Bar]    [Settings]    [User Profile]     │
├──────────────┬──────────────────────────────┬───────────────┤
│              │                              │               │
│   SESSION    │         CHAT AREA            │   DETAILS     │
│   SIDEBAR    │                              │   PANEL       │
│   (Left)     │                              │   (Optional)  │
│              │                              │               │
│  📁 All      │  ┌────────────────────────┐  │               │
│  📄 Session 1│  │ User: Hello!           │  │  Session      │
│  📄 Session 2│  │ Bot: Hi! How can I...  │  │  Info         │
│  📄 Session 3│  │                        │  │               │
│  + New       │  │ [Markdown Content]     │  │  Tokens: 150  │
│              │  │                        │  │  Cost: $0.001 │
│  ─────────── │  └────────────────────────┘  │               │
│              │                              │               │
│  Search...   │  ┌────────────────────────┐  │               │
│              │  │ [Message Input      ]  │  │               │
│              │  │ [Send] [Attach] [Voice]│  │               │
│              │  └────────────────────────┘  │               │
│              │                              │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

### 4.2 Session Sidebar (Left Panel)

**Requirements:**

- **Position:** Fixed left side, 280px width
- **Sessions List:** Display all sessions sorted by `time.updated` (most recent first)
- **Session Item:**
  - Title (or auto-generated from first message)
  - Last message preview (truncated to 50 chars)
  - Timestamp (relative: "2 min ago", "1 hour ago")
  - Status indicator (idle 🟢 / busy 🟡 / error 🔴)
  - Context menu (rename, delete, archive, fork)
- **Actions:**
  - "+ New Chat" button at top
  - Search/filter sessions
  - Archive/restore functionality

**API Integration:**

```
GET /session?limit=50&roots=true
GET /session/status
```

### 4.3 Chat Area (Center Panel)

**Requirements:**

- **Position:** Center, flexible width
- **Message Bubbles:**
  - **User Messages:** Right-aligned, distinct color
  - **Bot Messages:** Left-aligned, markdown rendered
- **Message Features:**
  - Timestamp on hover
  - Copy message button
  - Regenerate response (for bot messages)
  - Message actions menu
- **Input Area:**
  - Multi-line text input with auto-resize
  - Send button (Enter to send, Shift+Enter for new line)
  - File attachment support
  - Typing indicator while bot is generating

**API Integration:**

```
POST /session/{sessionID}/message  (with streaming)
GET /session/{sessionID}/message
POST /session/{sessionID}/abort
```

### 4.4 Details Panel (Right Panel - Optional)

**Requirements:**

- **Toggle:** Collapsible panel (default: hidden)
- **Content:**
  - Session metadata (created, updated)
  - Token usage statistics
  - Cost information
  - Model information
  - File attachments in session

**API Integration:**

```
GET /session/{sessionID}
```

### 4.5 Markdown Rendering

**Required Elements:**

- **Headers:** H1-H6 with proper styling
- **Text Formatting:** Bold, italic, strikethrough, inline code
- **Lists:** Ordered and unordered with nesting
- **Code Blocks:**
  - Syntax highlighting for major languages
  - Line numbers option
  - Copy button
  - Language label
- **Tables:** Styled tables with headers
- **Blockquotes:** Distinct styling
- **Links:** Clickable with hover effects
- **Horizontal Rules:** Visual separator
- **Math:** LaTeX support (optional v2)

**Example Rendering:**

````markdown
# Hello World

This is **bold** and _italic_ text.

## Code Example

```javascript
function greet() {
  console.log("Hello!");
}
```
````

## List

- Item 1
- Item 2
  - Nested item
- Item 3

## Table

| Name | Value |
| ---- | ----- |
| A    | 1     |
| B    | 2     |

```

### 4.6 Streaming Implementation

**Requirements:**
- Real-time message updates via Server-Sent Events
- Smooth text appearance (word-by-word or sentence-by-sentence)
- Typing indicator while streaming
- Auto-scroll to bottom (unless user scrolls up)
- Abort button to stop generation

**API Integration:**
```

GET /event?directory={projectDir}
Content-Type: text/event-stream

````

**Event Handling:**
- `message.part.delta` - Append text to current message
- `message.part.updated` - New part added
- `session.status` - Update typing indicator

---

## 5. Technical Requirements

### 5.1 Frontend Stack

**Recommended:**
- **Framework:** React 18+ with TypeScript
- **State Management:** Zustand or Redux Toolkit
- **Styling:** Tailwind CSS or styled-components
- **Markdown:** react-markdown + remark/rehype plugins
- **Code Highlighting:** Prism.js or Shiki
- **Icons:** Lucide React or Phosphor Icons

**Alternative (Vue):**
- **Framework:** Vue 3 with TypeScript
- **State:** Pinia
- **Markdown:** markdown-it or marked

### 5.2 API Client

**Core Requirements:**
- Base URL: `http://127.0.0.1:4096`
- Request timeout: 30s for regular, 5min for streaming
- Error handling with retry logic
- Authentication header support

**Key Endpoints Map:**
```typescript
interface APIEndpoints {
  // Sessions
  listSessions: () => GET /session
  createSession: (data) => POST /session
  getSession: (id) => GET /session/{id}
  updateSession: (id, data) => PATCH /session/{id}
  deleteSession: (id) => DELETE /session/{id}
  forkSession: (id, data) => POST /session/{id}/fork

  // Messages
  getMessages: (sessionId) => GET /session/{id}/message
  sendMessage: (sessionId, data) => POST /session/{id}/message
  abortGeneration: (sessionId) => POST /session/{id}/abort

  // Streaming
  subscribeEvents: (directory) => GET /event
}
````

### 5.3 Data Models

**Session:**

```typescript
interface Session {
  id: string;
  slug: string;
  title: string | null;
  directory: string;
  parentID: string | null;
  time: {
    created: number;
    updated: number;
    archived?: number;
  };
  status: "idle" | "busy" | "retry";
  summary?: {
    title: string;
    body: string;
  };
}
```

**Message:**

```typescript
interface Message {
  info: {
    id: string;
    sessionID: string;
    role: "user" | "assistant";
    time: { created: number };
    model?: {
      providerID: string;
      modelID: string;
    };
  };
  parts: Part[];
}

interface Part {
  id: string;
  type: "text" | "reasoning" | "tool" | "file" | "stepStart" | "stepFinish";
  // Type-specific fields...
}
```

### 5.4 State Management

**Store Structure:**

```typescript
interface AppState {
  // Sessions
  sessions: Session[];
  currentSessionId: string | null;
  sessionStatus: Record<string, SessionStatus>;

  // Messages
  messages: Record<string, Message[]>; // sessionId -> messages
  streamingMessageId: string | null;

  // UI
  sidebarOpen: boolean;
  detailsPanelOpen: boolean;
  theme: "light" | "dark";

  // Actions
  loadSessions: () => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  sendMessage: (sessionId: string, content: string) => Promise<void>;
  abortGeneration: (sessionId: string) => Promise<void>;
}
```

---

## 6. UI/UX Specifications

### 6.1 Design System

**Color Palette:**

```css
/* Light Theme */
--bg-primary: #ffffff;
--bg-secondary: #f7f7f8;
--bg-tertiary: #ececf1;
--text-primary: #343541;
--text-secondary: #6e6e80;
--accent-primary: #10a37f;
--accent-hover: #0d8c6d;
--border: #d9d9e3;
--user-bubble: #10a37f;
--bot-bubble: #f7f7f8;

/* Dark Theme */
--bg-primary: #343541;
--bg-secondary: #444654;
--bg-tertiary: #40414f;
--text-primary: #ececf1;
--text-secondary: #8e8ea0;
--accent-primary: #19c37d;
--accent-hover: #15a76a;
--border: #4d4d5f;
--user-bubble: #19c37d;
--bot-bubble: #444654;
```

**Typography:**

- Primary: Inter, system-ui, -apple-system
- Monospace: JetBrains Mono, Fira Code, Consolas
- Sizes: 14px base, 16px messages, 12px timestamps

**Spacing:**

- Sidebar: 280px
- Max content width: 800px
- Message padding: 16px 24px
- Input height: 56px (min), auto-expand to 200px

### 6.2 Responsive Design

**Breakpoints:**

- Mobile: < 768px (hide sidebar, show hamburger menu)
- Tablet: 768px - 1024px (collapsible sidebar)
- Desktop: > 1024px (fixed sidebar)

**Mobile Adaptations:**

- Swipe to open sidebar
- Bottom sheet for session list
- Full-screen message input
- Hide details panel

### 6.3 Animations

**Micro-interactions:**

- Message appear: fade-in + slide-up (200ms ease-out)
- Typing indicator: pulse animation
- Button hover: scale(1.02) + shadow
- Session switch: cross-fade (150ms)

**Loading States:**

- Skeleton screens for initial load
- Spinner for async operations
- Shimmer effect for streaming text

---

## 7. Features by Phase

### Phase 1: MVP (Week 1-2)

**Core Chat:**

- [ ] Basic chat interface
- [ ] Send/receive messages
- [ ] Markdown rendering (basic)
- [ ] Session sidebar
- [ ] Create new sessions
- [ ] Real-time streaming

**API Integration:**

- [ ] List sessions
- [ ] Get messages
- [ ] Send message with streaming
- [ ] Session status polling

### Phase 2: Enhanced (Week 3-4)

**Chat Improvements:**

- [ ] Code block syntax highlighting
- [ ] Copy code button
- [ ] Message timestamps
- [ ] Typing indicator
- [ ] Abort generation
- [ ] Auto-scroll management

**Session Management:**

- [ ] Rename sessions
- [ ] Delete sessions
- [ ] Search sessions
- [ ] Session forking

### Phase 3: Polish (Week 5-6)

**UI/UX:**

- [ ] Dark/light theme toggle
- [ ] Responsive design
- [ ] Keyboard shortcuts
- [ ] Smooth animations
- [ ] Toast notifications

**Advanced:**

- [ ] File attachments
- [ ] Message regeneration
- [ ] Export conversation
- [ ] Token/cost display

### Phase 4: Future (Optional)

- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Plugin system
- [ ] Collaborative sessions
- [ ] Mobile apps (React Native/Flutter)

---

## 8. API Integration Guide

### 8.1 Initialization Flow

```typescript
// 1. Load all sessions
const sessions = await api.get("/session", {
  params: { roots: true, limit: 50 },
});

// 2. If no sessions, create one
if (sessions.length === 0) {
  const newSession = await api.post("/session", {
    title: "New Chat",
  });
}

// 3. Select first session and load messages
const currentSession = sessions[0];
const messages = await api.get(`/session/${currentSession.id}/message`);

// 4. Subscribe to real-time events
const eventSource = new EventSource(
  `${API_BASE}/event?directory=${currentSession.directory}`,
);
```

### 8.2 Sending a Message

```typescript
async function sendMessage(sessionId: string, text: string) {
  // 1. Optimistically add user message to UI
  const tempUserMessage = addTempMessage(sessionId, text, "user");

  try {
    // 2. Send message to API
    const response = await api.post(`/session/${sessionId}/message`, {
      parts: [{ type: "text", text }],
      noReply: false,
    });

    // 3. Handle streaming via SSE (message.part.delta events)
    // The assistant message will be built incrementally
  } catch (error) {
    // 4. Handle error and remove temp message
    removeTempMessage(tempUserMessage.id);
    showError("Failed to send message");
  }
}
```

### 8.3 Streaming Event Handler

```typescript
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.event) {
    case "message.part.delta":
      // Append text to current message
      appendMessageText(data.sessionID, data.messageID, data.delta);
      break;

    case "message.part.updated":
      // New part added (code block, tool call, etc.)
      addMessagePart(data.sessionID, data.messageID, data.part);
      break;

    case "session.status":
      // Update typing indicator
      updateSessionStatus(data.sessionID, data.status);
      break;

    case "session.updated":
      // Session metadata changed (title, etc.)
      updateSession(data.session);
      break;
  }
};
```

### 8.4 Error Handling

```typescript
// Session busy
if (error.code === "SESSION_BUSY") {
  showToast("AI is still processing. Please wait.");
}

// Rate limit
if (error.code === "RATE_LIMIT") {
  showToast("Too many requests. Please slow down.");
}

// Network error
if (error.code === "NETWORK_ERROR") {
  showToast("Connection lost. Retrying...");
  // Auto-retry with exponential backoff
}
```

---

## 9. Security & Performance

### 9.1 Security Requirements

- **No sensitive data in localStorage** (except UI preferences)
- **Input sanitization** for XSS prevention
- **CSP headers** for script injection prevention
- **HTTPS** for production deployments

### 9.2 Performance Targets

| Metric                     | Target  |
| -------------------------- | ------- |
| First Paint                | < 1s    |
| Time to Interactive        | < 2s    |
| Message Render             | < 16ms  |
| Session Switch             | < 100ms |
| Initial Load (50 sessions) | < 500ms |
| Memory Usage               | < 100MB |

### 9.3 Optimization Strategies

- **Virtualization:** Use react-window for long message lists
- **Debouncing:** Input and search with 300ms debounce
- **Memoization:** React.memo for message components
- **Lazy Loading:** Markdown components loaded on demand
- **Image Optimization:** Lazy load with blur placeholder
- **State Normalization:** Flattened state with normalized entities

---

## 10. Testing Strategy

### 10.1 Test Types

**Unit Tests:**

- Message parsing and rendering
- Markdown transformation
- State management logic
- Utility functions

**Integration Tests:**

- API client methods
- Event streaming
- Session management flows
- Message sending/receiving

**E2E Tests:**

- Complete user flows
- Cross-browser compatibility
- Mobile responsiveness
- Performance benchmarks

### 10.2 Test Cases

```typescript
describe("Chat Interface", () => {
  it("should render markdown correctly", () => {
    const markdown = "# Hello\n\n**bold** text";
    const result = renderMarkdown(markdown);
    expect(result).toContain("<h1>Hello</h1>");
    expect(result).toContain("<strong>bold</strong>");
  });

  it("should handle streaming messages", async () => {
    const sessionId = "ses_test";
    await sendMessage(sessionId, "Hello");

    // Simulate streaming chunks
    receiveStreamChunk(sessionId, "msg_1", "Hello");
    receiveStreamChunk(sessionId, "msg_1", " World");

    expect(getMessageText(sessionId, "msg_1")).toBe("Hello World");
  });

  it("should switch sessions", async () => {
    await selectSession("ses_1");
    expect(currentSessionId).toBe("ses_1");
    expect(messages["ses_1"]).toBeDefined();
  });
});
```

---

## 11. Deployment & DevOps

### 11.1 Environment Setup

```bash
# Development
npm run dev
# API: http://127.0.0.1:4096
# App: http://localhost:3000

# Production Build
npm run build
# Output: dist/ folder

# Docker
docker build -t cloudy-webapp .
docker run -p 3000:80 cloudy-webapp
```

### 11.2 Environment Variables

```env
# Required
VITE_API_BASE_URL=http://127.0.0.1:4096

# Optional
VITE_DEFAULT_DIRECTORY=/path/to/project
VITE_ENABLE_ANALYTICS=true
VITE_THEME=system
```

---

## 12. Open Questions & Decisions

### Pending Decisions

1. **Authentication:** Will the API require auth tokens or use session-based auth?
2. **File Uploads:** What's the max file size and supported formats?
3. **Offline Support:** Should we implement local caching for offline mode?
4. **Collaboration:** Multi-user sessions in future?
5. **Mobile Apps:** Native apps or PWA?

### Known Limitations

- API streaming requires EventSource support (no IE11)
- File uploads limited by API constraints
- Markdown math rendering requires additional library
- Session storage limited by browser localStorage (~5MB)

---

## 13. Appendix

### 13.1 API Reference Summary

**Base URL:** `http://127.0.0.1:4096`

| Endpoint                | Method | Description               |
| ----------------------- | ------ | ------------------------- |
| `/session`              | GET    | List all sessions         |
| `/session`              | POST   | Create new session        |
| `/session/{id}`         | GET    | Get session details       |
| `/session/{id}`         | PATCH  | Update session            |
| `/session/{id}`         | DELETE | Delete session            |
| `/session/{id}/message` | GET    | Get messages              |
| `/session/{id}/message` | POST   | Send message              |
| `/session/{id}/abort`   | POST   | Abort generation          |
| `/event`                | GET    | Subscribe to events (SSE) |

### 13.2 Glossary

- **Session:** A conversation thread with the AI
- **Part:** A component of a message (text, code, tool call, etc.)
- **Fork:** Creating a new session branch from a specific message
- **Streaming:** Real-time message delivery via SSE
- **Markdown:** Lightweight markup language for formatting text

### 13.3 Resources

- OpenCode API Documentation: http://127.0.0.1:4096/doc
- React Markdown: https://github.com/remarkjs/react-markdown
- Tailwind CSS: https://tailwindcss.com
- Lucide Icons: https://lucide.dev

---

## Document History

| Version | Date       | Author | Changes              |
| ------- | ---------- | ------ | -------------------- |
| 1.0.0   | 2026-03-09 | Luck   | Initial PRD creation |

---

_This PRD is a living document. Please update as requirements evolve._
