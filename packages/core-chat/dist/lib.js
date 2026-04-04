// src/lib/client.ts
var _oc = null;
function initCoreChat(oc) {
  _oc = oc;
}
function getOc() {
  if (!_oc) {
    throw new Error("CoreChat not initialized. Call initCoreChat(oc) first.");
  }
  return _oc;
}
function getErrorMessage(error) {
  if (error.message) return error.message;
  if (error.errors && error.errors.length > 0) {
    const firstError = error.errors[0];
    if (firstError?.message) {
      return firstError.message;
    }
  }
  if (error.data && typeof error.data === "object" && "message" in error.data) {
    return String(error.data.message);
  }
  return "Unknown error";
}
function createDefaultTitle(isChild = false) {
  const prefix = isChild ? "Child session - " : "New session - ";
  return prefix + (/* @__PURE__ */ new Date()).toISOString();
}

// src/types.ts
function buildParts(directory, content) {
  const textPart = { type: "text", text: content.text };
  const mentionParts = content.mentions.map((mention) => {
    const filename = mention.id;
    const path = `${directory}/${filename}`;
    const url = `file://${path}`;
    return {
      type: "file",
      mime: "text/plain",
      url,
      filename,
      source: {
        type: "file",
        text: {
          value: filename,
          start: 0,
          end: filename.length
        },
        path
      }
    };
  });
  return [textPart, ...mentionParts];
}
export {
  buildParts,
  createDefaultTitle,
  getErrorMessage,
  getOc,
  initCoreChat
};
//# sourceMappingURL=lib.js.map