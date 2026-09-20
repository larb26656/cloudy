import { BrowserWorkspaceGate } from "./components/BrowserWorkspaceGate";
import { ChatApp } from "./components/ChatApp";
import "./styles/App.css";

function App() {
  return (
    <BrowserWorkspaceGate>
      {(directory) => <ChatApp directory={directory} />}
    </BrowserWorkspaceGate>
  );
}

export default App;
