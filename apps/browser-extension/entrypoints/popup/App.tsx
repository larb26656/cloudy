import { useEffect, useState } from "react";
import "./App.css";
import { SendSelectionData } from "../hub-client";

function App() {
  const [context, setContext] = useState<SendSelectionData | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]?.id) {
        browser.tabs
          .sendMessage(tabs[0].id, { action: "getSelection" })
          .then((response) => {
            if (response?.success) {
              const data = response.data;

              setContext({
                url: data.url,
                selection: data.data,
              });
            }
          })
          .catch(() => {
            setContext(null);
          });
      }
    });
  }, []);

  const handleSendToHub = async () => {
    if (!context) return;

    setStatus("loading");

    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;

    try {
      const response = await browser.tabs.sendMessage(tab.id, {
        action: "sendToHub",
        data: context,
      });
      if (response?.success) {
        setStatus("success");
        browser.tabs.sendMessage(tab.id, { action: "clearSelection" });
        setTimeout(() => window.close(), 1500);
      } else {
        setStatus("error");
        setErrorMsg(response?.error || "Failed to send");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("Could not connect to page");
    }
  };

  const handleClear = async () => {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) {
      await browser.tabs.sendMessage(tab.id, { action: "clearSelection" });
    }
    setContext(null);
  };

  return (
    <div className="container">
      <h2>Cloudy</h2>

      {!context && (
        <p className="hint">
          Select some text on the page, then click capture below.
        </p>
      )}

      {context && (
        <>
          <div className="preview">
            <div className="preview-url">{context.url}</div>
            <pre className="preview-text">
              {context.selection.slice(0, 200)}
              {context.selection.length > 200 ? "..." : ""}
            </pre>
          </div>

          {status === "success" && (
            <div className="success">Sent to Cloudy!</div>
          )}

          {status === "error" && <div className="error">{errorMsg}</div>}

          {status !== "success" && (
            <div className="actions">
              <button onClick={handleSendToHub} disabled={status === "loading"}>
                {status === "loading" ? "Sending..." : "Send to Cloudy"}
              </button>
              <button onClick={handleClear} className="secondary">
                Clear
              </button>
            </div>
          )}
        </>
      )}

      {context && (
        <button onClick={() => window.location.reload()} className="reload">
          Refresh
        </button>
      )}
    </div>
  );
}

export default App;
