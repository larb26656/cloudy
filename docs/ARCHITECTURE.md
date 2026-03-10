# Chat UI - Component Architecture

## Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── SearchBar
│   │   └── UserMenu
│   ├── Sidebar
│   │   ├── NewChatButton
│   │   ├── SessionSearch
│   │   └── SessionList
│   │       └── SessionItem (×N)
│   ├── ChatContainer
│   │   ├── MessageList
│   │   │   └── MessageBubble (×N)
│   │   │       ├── UserMessage
│   │   │       └── AssistantMessage
│   │   │           ├── MarkdownRenderer
│   │   │           │   ├── CodeBlock
│   │   │           │   ├── Table
│   │   │           │   └── InlineElements
│   │   │           └── MessageActions
│   │   └── ChatInput
│   │       ├── TextArea
│   │       ├── AttachmentButton
│   │       └── SendButton
│   └── DetailsPanel (optional)
│       ├── SessionInfo
│       └── UsageStats
└── Modals/Overlays
    ├── SettingsModal
    ├── DeleteConfirmModal
    └── ToastContainer
```

## Key Components

### 1. SessionItem
```typescript
interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onClick: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
  onFork: () => void;
}
```

### 2. MessageBubble
```typescript
interface MessageBubbleProps {
  message: Message;
  isStreaming: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
}
```

### 3. MarkdownRenderer
```typescript
interface MarkdownRendererProps {
  content: string;
  enableCodeCopy: boolean;
  enableSyntaxHighlight: boolean;
}
```

### 4. ChatInput
```typescript
interface ChatInputProps {
  onSend: (text: string, attachments?: File[]) => void;
  onAbort: () => void;
  isLoading: boolean;
  placeholder?: string;
}
```

## State Flow

```
User Action → Store Action → API Call → Store Update → UI Re-render

Examples:
1. Click Session
   Click → selectSession(sessionId) → GET /session/{id}/message → update messages state → MessageList re-renders

2. Send Message
   Submit → sendMessage(text) → POST /session/{id}/message → add temp message → SSE events → update streaming message

3. Create Session
   Click New Chat → createSession() → POST /session → add to sessions list → select new session
```

## Event Streaming Flow

```
App Mount → Connect EventSource → Listen for Events → Update State → UI Updates

Event Types:
- message.part.delta → Append text to streaming message
- message.part.updated → Add new part (code block, file, etc.)
- session.status → Update typing indicator
- session.updated → Update session metadata (title)
```

## Folder Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Icon.tsx
│   │   └── Tooltip.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── ChatContainer.tsx
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   └── MarkdownRenderer.tsx
│   ├── session/
│   │   ├── SessionList.tsx
│   │   ├── SessionItem.tsx
│   │   └── NewSessionButton.tsx
│   └── markdown/
│       ├── CodeBlock.tsx
│       ├── Table.tsx
│       └── InlineCode.tsx
├── hooks/
│   ├── useSessions.ts
│   ├── useMessages.ts
│   ├── useStreaming.ts
│   └── useEventSource.ts
├── stores/
│   ├── sessionStore.ts
│   ├── messageStore.ts
│   └── uiStore.ts
├── api/
│   ├── client.ts
│   ├── sessions.ts
│   └── messages.ts
├── types/
│   ├── session.ts
│   ├── message.ts
│   └── api.ts
├── utils/
│   ├── markdown.ts
│   ├── formatters.ts
│   └── constants.ts
└── styles/
    ├── globals.css
    └── themes.css
```

## Key Hooks

### useEventSource
```typescript
function useEventSource(directory: string) {
  const [events, setEvents] = useState<Event[]>([]);
  
  useEffect(() => {
    const es = new EventSource(`${API_BASE}/event?directory=${directory}`);
    es.onmessage = (e) => setEvents(prev => [...prev, JSON.parse(e.data)]);
    return () => es.close();
  }, [directory]);
  
  return events;
}
```

### useStreaming
```typescript
function useStreaming(sessionId: string) {
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const appendChunk = (chunk: string) => {
    setStreamingContent(prev => prev + chunk);
  };
  
  const startStreaming = () => {
    setStreamingContent('');
    setIsStreaming(true);
  };
  
  const stopStreaming = () => {
    setIsStreaming(false);
  };
  
  return { streamingContent, isStreaming, appendChunk, startStreaming, stopStreaming };
}
```

## CSS Architecture

### Utility Classes
```css
/* Layout */
.sidebar { @apply w-[280px] h-full flex flex-col bg-bg-secondary border-r border-border; }
.chat-area { @apply flex-1 flex flex-col bg-bg-primary; }
.message-list { @apply flex-1 overflow-y-auto p-4 space-y-4; }

/* Messages */
.message-bubble { @apply max-w-[80%] p-4 rounded-2xl; }
.message-user { @apply bg-accent-primary text-white self-end; }
.message-bot { @apply bg-bg-secondary text-text-primary self-start; }

/* Markdown */
.markdown h1 { @apply text-2xl font-bold mb-4; }
.markdown pre { @apply bg-gray-900 rounded-lg p-4 overflow-x-auto; }
.markdown code { @apply font-mono text-sm; }
```

## API Integration Points

### Session Management
```typescript
// stores/sessionStore.ts
export const useSessionStore = create((set, get) => ({
  sessions: [],
  currentSessionId: null,
  
  loadSessions: async () => {
    const sessions = await api.get('/session', { roots: true });
    set({ sessions });
  },
  
  createSession: async (title?: string) => {
    const session = await api.post('/session', { title });
    set({ sessions: [session, ...get().sessions] });
    return session;
  },
  
  selectSession: async (id: string) => {
    set({ currentSessionId: id });
    const messages = await api.get(`/session/${id}/message`);
    useMessageStore.getState().setMessages(id, messages);
  }
}));
```

### Message Handling
```typescript
// stores/messageStore.ts
export const useMessageStore = create((set, get) => ({
  messages: {},
  streamingMessageId: null,
  
  sendMessage: async (sessionId: string, text: string) => {
    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    set(state => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), {
          id: tempId,
          role: 'user',
          parts: [{ type: 'text', text }]
        }]
      }
    }));
    
    // API call
    await api.post(`/session/${sessionId}/message`, {
      parts: [{ type: 'text', text }]
    });
  },
  
  appendStreamChunk: (sessionId: string, messageId: string, chunk: string) => {
    set(state => {
      const sessionMessages = state.messages[sessionId] || [];
      const messageIndex = sessionMessages.findIndex(m => m.id === messageId);
      
      if (messageIndex === -1) {
        // New streaming message
        return {
          messages: {
            ...state.messages,
            [sessionId]: [...sessionMessages, {
              id: messageId,
              role: 'assistant',
              parts: [{ type: 'text', text: chunk }]
            }]
          },
          streamingMessageId: messageId
        };
      }
      
      // Append to existing
      const updatedMessages = [...sessionMessages];
      const textPart = updatedMessages[messageIndex].parts[0];
      textPart.text += chunk;
      
      return {
        messages: {
          ...state.messages,
          [sessionId]: updatedMessages
        }
      };
    });
  }
}));
```
