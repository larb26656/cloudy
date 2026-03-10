# OpenCode Chat

A modern chat interface for OpenCode API, inspired by Telegram, LINE, Messenger, and ChatGPT.

## Features

- **Real-time Chat**: Stream messages with Server-Sent Events
- **Markdown Rendering**: Full support for code blocks, tables, lists, and more
- **Session Management**: Create, rename, delete, and fork chat sessions
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode**: Toggle between light and dark themes

## Tech Stack

- **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- **Zustand** for state management
- **react-markdown** for markdown rendering
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+
- OpenCode API running at `http://127.0.0.1:4096`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # React components
│   ├── chat/      # Chat-related components
│   ├── session/   # Session sidebar components
│   └── markdown/  # Markdown rendering components
├── hooks/         # Custom React hooks
├── stores/        # Zustand stores
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## API Integration

The app integrates with OpenCode API:

- **Sessions**: `GET/POST/PATCH/DELETE /session/{id}`
- **Messages**: `GET/POST /session/{id}/message`
- **Streaming**: `GET /event` (Server-Sent Events)

## Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://127.0.0.1:4096
```

## License

MIT
