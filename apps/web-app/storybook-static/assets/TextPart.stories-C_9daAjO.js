import{t as e}from"./jsx-runtime-CEYMauoA.js";import{t}from"./MarkdownRenderer-Bs4QouqK.js";var n=e();function r({part:e}){return(0,n.jsxs)(`div`,{className:`text-sm leading-relaxed`,children:[e.synthetic&&(0,n.jsx)(`span`,{className:`text-xs text-muted-foreground italic mr-2`,children:`(synthetic)`}),e.ignored&&(0,n.jsx)(`span`,{className:`text-xs text-muted-foreground line-through mr-2`,children:`(ignored)`}),(0,n.jsx)(t,{content:e.text})]})}r.__docgenInfo={description:``,methods:[],displayName:`TextPart`,props:{part:{required:!0,tsType:{name:`TextPartType`},description:``}}};var i={title:`Chat/Message/Parts/TextPart`,component:r,tags:[`autodocs`],argTypes:{part:{control:`object`,description:`Text part data from SDK`}}},a={args:{part:{type:`text`,text:`Hello, this is a sample text response from the AI assistant.`}}},o={args:{part:{type:`text`,text:`This is a synthetic message.`,synthetic:!0}}},s={args:{part:{type:`text`,text:`This message was ignored.`,ignored:!0}}},c={args:{part:{type:`text`,text:`This is **bold** and this is _italic_. 

- List item 1
- List item 2

\`const x = 1\``}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "text",
      text: "Hello, this is a sample text response from the AI assistant."
    } as any
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "text",
      text: "This is a synthetic message.",
      synthetic: true
    } as any
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "text",
      text: "This message was ignored.",
      ignored: true
    } as any
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "text",
      text: "This is **bold** and this is _italic_. \\n\\n- List item 1\\n- List item 2\\n\\n\`const x = 1\`"
    } as any
  }
}`,...c.parameters?.docs?.source}}};var l=[`Default`,`WithSynthetic`,`WithIgnored`,`WithMarkdown`];export{a as Default,s as WithIgnored,c as WithMarkdown,o as WithSynthetic,l as __namedExportsOrder,i as default};