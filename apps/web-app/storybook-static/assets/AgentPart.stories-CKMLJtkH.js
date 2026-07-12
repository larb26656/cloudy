import{t as e}from"./jsx-runtime-CEYMauoA.js";import{t}from"./createLucideIcon-rGH91BOO.js";import{t as n}from"./bot-DQEnW5-_.js";import{t as r}from"./CollapsiblePart-Dk5SKVpN.js";import{n as i,t as a}from"./card-BMQhYD7Y.js";var o=t(`code`,[[`path`,{d:`m16 18 6-6-6-6`,key:`eg8j8`}],[`path`,{d:`m8 6-6 6 6 6`,key:`ppft3o`}]]),s=e();function c({part:e}){return(0,s.jsx)(r,{label:`Agent`,detail:e.name,children:(0,s.jsx)(a,{children:(0,s.jsx)(i,{className:`p-3`,children:(0,s.jsxs)(`div`,{className:`space-y-2`,children:[(0,s.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,s.jsx)(n,{className:`size-4 text-muted-foreground`}),(0,s.jsx)(`span`,{className:`text-xs font-medium text-muted-foreground`,children:`Agent`})]}),(0,s.jsx)(`div`,{className:`text-sm font-medium`,children:e.name}),e.source&&(0,s.jsxs)(`div`,{className:`text-xs font-mono bg-muted rounded p-2 overflow-x-auto`,children:[(0,s.jsxs)(`div`,{className:`flex items-center gap-1 mb-1`,children:[(0,s.jsx)(o,{className:`size-3`}),(0,s.jsx)(`span`,{children:`Source:`})]}),(0,s.jsx)(`div`,{className:`truncate`,children:e.source.value.slice(e.source.start,e.source.end)})]})]})})})})}c.__docgenInfo={description:``,methods:[],displayName:`AgentPart`,props:{part:{required:!0,tsType:{name:`AgentPartType`},description:``}}};var l={title:`Chat/Message/Parts/AgentPart`,component:c,tags:[`autodocs`],argTypes:{part:{control:`object`,description:`Agent part data from SDK`}}},u={args:{part:{type:`agent`,name:`code-reviewer`}}},d={args:{part:{type:`agent`,name:`code-reviewer`,source:{type:`text`,value:`const agent = require('@opencode-ai/code-reviewer');`,start:0,end:40}}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "agent",
      name: "code-reviewer"
    } as any
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "agent",
      name: "code-reviewer",
      source: {
        type: "text" as const,
        value: "const agent = require('@opencode-ai/code-reviewer');",
        start: 0,
        end: 40
      }
    } as any
  }
}`,...d.parameters?.docs?.source}}};var f=[`Default`,`WithSource`];export{u as Default,d as WithSource,f as __namedExportsOrder,l as default};