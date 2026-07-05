export interface MessageCursor {
  id: string;
  time: number;
}

export function encodeCursor(cursor: MessageCursor): string {
  return btoa(JSON.stringify(cursor));
}

export function decodeCursor(cursor: string): MessageCursor {
  return JSON.parse(atob(cursor));
}
