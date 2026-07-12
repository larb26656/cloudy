import{t as e}from"./jsx-runtime-CEYMauoA.js";import{t}from"./createLucideIcon-rGH91BOO.js";import{t as n}from"./CollapsiblePart-Dk5SKVpN.js";import{n as r,t as i}from"./card-BMQhYD7Y.js";var a=t(`camera`,[[`path`,{d:`M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z`,key:`18u6gg`}],[`circle`,{cx:`12`,cy:`13`,r:`3`,key:`1vg3eu`}]]),o=e();function s({part:e}){return(0,o.jsx)(n,{label:`Snapshot`,detail:e.snapshot?.slice(0,50)||``,children:(0,o.jsx)(i,{children:(0,o.jsx)(r,{className:`p-3`,children:(0,o.jsxs)(`div`,{className:`space-y-2`,children:[(0,o.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,o.jsx)(a,{className:`size-4 text-muted-foreground`}),(0,o.jsx)(`span`,{className:`text-xs font-medium text-muted-foreground`,children:`Snapshot`})]}),(0,o.jsx)(`div`,{className:`text-xs font-mono bg-muted rounded p-2 overflow-x-auto`,children:e.snapshot})]})})})})}s.__docgenInfo={description:``,methods:[],displayName:`SnapshotPart`,props:{part:{required:!0,tsType:{name:`SnapshotPartType`},description:``}}};var c={title:`Chat/Message/Parts/SnapshotPart`,component:s,tags:[`autodocs`],argTypes:{part:{control:`object`,description:`Snapshot part data from SDK`}}},l={args:{part:{type:`snapshot`,snapshot:`{"conversationId": "abc123", "step": 5}`}}},u={args:{part:{type:`snapshot`,snapshot:`{
  "conversationId": "abc123",
  "step": 5,
  "metadata": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "history": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"}
  ]
}`}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "snapshot",
      snapshot: '{"conversationId": "abc123", "step": 5}'
    } as any
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "snapshot",
      snapshot: \`{
  "conversationId": "abc123",
  "step": 5,
  "metadata": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "history": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"}
  ]
}\`
    } as any
  }
}`,...u.parameters?.docs?.source}}};var d=[`Default`,`LongSnapshot`];export{l as Default,u as LongSnapshot,d as __namedExportsOrder,c as default};