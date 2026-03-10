import { useEffect } from 'react';
import { SessionList } from './components/session/SessionList';
import { ChatContainer } from './components/chat/ChatContainer';
import { useSessionStore } from './stores/sessionStore';
import { useUIStore } from './stores/uiStore';
import { useEventSource } from './hooks/useEventSource';

function App() {
  const { sessions, currentSessionId, loadSessions } = useSessionStore();
  const { sidebarOpen, isDarkMode, selectedDirectory } = useUIStore();

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Get directory for EventSource - use selected directory filter if available, otherwise use current session's directory
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const directory = selectedDirectory || currentSession?.directory || null;

  // Subscribe to real-time events
  useEventSource(directory);

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0`}
      >
        <div className="w-80 h-full">
          <SessionList />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentSessionId ? (
          <ChatContainer sessionId={currentSessionId} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl font-bold">AI</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                OpenCode Chat
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Your AI-powered coding assistant
              </p>
              <button
                onClick={() => useSessionStore.getState().createSession()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
