import{t as e}from"./MarkdownRenderer-Bs4QouqK.js";var t={title:`Markdown/MarkdownRenderer`,component:e,tags:[`autodocs`],argTypes:{content:{control:`text`,description:`Markdown content to render`}}},n={args:{content:`# Hello World

This is a **bold** text and this is _italic_.

- Item 1
- Item 2
- Item 3

## Code Example

Inline code: \`const x = 42\`

Code block:

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\``}},r={args:{content:`## Features

| Feature | Status |
|---------|--------|
| Markdown | ✅ |
| Code Blocks | ✅ |
| Tables | ✅ |
| Lists | ✅ |`}},i={args:{content:`> This is a blockquote with important information.

You can use it for:

- Highlights
- Notes
- Warnings`}},a={args:{content:`# API Documentation

## Endpoints

### GET /api/users

Returns a list of users.

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

async function getUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  return response.json();
}
\`\`\`

## Error Handling

| Error Code | Description |
|------------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |

> **Note:** Always validate input on the client side before sending to the server.

## Authentication

\`\`\`javascript
const token = localStorage.getItem('auth_token');

fetch('/api/protected', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
});
\`\`\`
`}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:'{\n  args: {\n    content: "# Hello World\\n\\nThis is a **bold** text and this is _italic_.\\n\\n- Item 1\\n- Item 2\\n- Item 3\\n\\n## Code Example\\n\\nInline code: `const x = 42`\\n\\nCode block:\\n\\n```javascript\\nfunction greet(name) {\\n  console.log(`Hello, ${name}!`);\\n}\\n```"\n  }\n}',...n.parameters?.docs?.source}}},r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`## Features\\n\\n| Feature | Status |\\n|---------|--------|\\n| Markdown | ✅ |\\n| Code Blocks | ✅ |\\n| Tables | ✅ |\\n| Lists | ✅ |\`
  }
}`,...r.parameters?.docs?.source}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`> This is a blockquote with important information.\\n\\nYou can use it for:\\n\\n- Highlights\\n- Notes\\n- Warnings\`
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`# API Documentation

## Endpoints

### GET /api/users

Returns a list of users.

\\\`\\\`\\\`typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

async function getUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  return response.json();
}
\\\`\\\`\\\`

## Error Handling

| Error Code | Description |
|------------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |

> **Note:** Always validate input on the client side before sending to the server.

## Authentication

\\\`\\\`\\\`javascript
const token = localStorage.getItem('auth_token');

fetch('/api/protected', {
  headers: {
    'Authorization': \\\`Bearer \\\${token}\\\`
  }
});
\\\`\\\`\\\`
\`
  }
}`,...a.parameters?.docs?.source}}};var o=[`Default`,`WithTable`,`WithBlockquote`,`ComplexDocument`];export{a as ComplexDocument,n as Default,i as WithBlockquote,r as WithTable,o as __namedExportsOrder,t as default};