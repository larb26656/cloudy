import{t as e}from"./MarkdownRenderer-Bs4QouqK.js";var t={title:`Markdown/CodeBlock`,component:e,tags:[`autodocs`],argTypes:{content:{control:`text`,description:`Markdown content with code blocks`}}},n={args:{content:`Here is some JavaScript code:

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}

const result = greet("World");
\`\`\`

And here is some inline code: \`const x = 42\``}},r={args:{content:`\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): Promise<User> {
  return fetch(\`/api/users/\${id}\`)
    .then(res => res.json());
}
\`\`\``}},i={args:{content:`\`\`\`python
def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence up to n numbers."""
    if n <= 0:
        return []
    
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    
    return sequence[:n]

# Usage
print(fibonacci(10))
\`\`\``}},a={args:{content:`\`\`\`json
{
  "name": "cloudy-webapp",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "highlight.js": "^11.9.0",
    "diff2html": "^3.4.0"
  }
}
\`\`\``}},o={args:{content:`\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
\`\`\``}},s={args:{content:"```\nThis is a code block without a specified language.\nIt will still be highlighted automatically.\n```"}},c={args:{content:`# Getting Started

To install the package, run:

\`\`\`bash
npm install my-package
\`\`\`

## Usage

Import and use it in your code:

\`\`\`javascript
import { myFunction } from 'my-package';

const result = myFunction({
  option1: true,
  option2: 'value'
});

console.log(result);
\`\`\`

### Notes

> This is a blockquote with important information.

- First item
- Second item
- Third item
`}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`Here is some JavaScript code:

\\\`\\\`\\\`javascript
function greet(name) {
  console.log(\\\`Hello, \\\${name}!\\\`);
  return true;
}

const result = greet("World");
\\\`\\\`\\\`

And here is some inline code: \\\`const x = 42\\\`\`
  }
}`,...n.parameters?.docs?.source}}},r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`\\\`\\\`\\\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): Promise<User> {
  return fetch(\\\`/api/users/\\\${id}\\\`)
    .then(res => res.json());
}
\\\`\\\`\\\`\`
  }
}`,...r.parameters?.docs?.source}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`\\\`\\\`\\\`python
def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence up to n numbers."""
    if n <= 0:
        return []
    
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    
    return sequence[:n]

# Usage
print(fibonacci(10))
\\\`\\\`\\\`\`
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`\\\`\\\`\\\`json
{
  "name": "cloudy-webapp",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "highlight.js": "^11.9.0",
    "diff2html": "^3.4.0"
  }
}
\\\`\\\`\\\`\`
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`\\\`\\\`\\\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
\\\`\\\`\\\`\`
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:"{\n  args: {\n    content: `\\`\\`\\`\nThis is a code block without a specified language.\nIt will still be highlighted automatically.\n\\`\\`\\``\n  }\n}",...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`# Getting Started

To install the package, run:

\\\`\\\`\\\`bash
npm install my-package
\\\`\\\`\\\`

## Usage

Import and use it in your code:

\\\`\\\`\\\`javascript
import { myFunction } from 'my-package';

const result = myFunction({
  option1: true,
  option2: 'value'
});

console.log(result);
\\\`\\\`\\\`

### Notes

> This is a blockquote with important information.

- First item
- Second item
- Third item
\`
  }
}`,...c.parameters?.docs?.source}}};var l=[`JavaScriptCode`,`TypeScriptCode`,`PythonCode`,`JSONCode`,`BashCode`,`NoLanguage`,`MixedContent`];export{o as BashCode,a as JSONCode,n as JavaScriptCode,c as MixedContent,s as NoLanguage,i as PythonCode,r as TypeScriptCode,l as __namedExportsOrder,t as default};