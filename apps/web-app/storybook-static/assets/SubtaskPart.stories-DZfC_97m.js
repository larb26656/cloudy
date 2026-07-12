import{a as e,t}from"./react-D0JuimcS.js";import{t as n}from"./jsx-runtime-CEYMauoA.js";import{t as r}from"./createLucideIcon-rGH91BOO.js";import{t as i}from"./bot-DQEnW5-_.js";import{t as a}from"./CollapsiblePart-Dk5SKVpN.js";import{n as o,t as s}from"./SessionViewDialog-B_7hj35j.js";import{n as c,t as l}from"./card-BMQhYD7Y.js";import{t as u}from"./button-bFYSKbiQ.js";var d=r(`zap`,[[`path`,{d:`M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z`,key:`1xq2db`}]]),f=e(t(),1),p=n();function m({part:e}){let t=e.agent||e.description?.slice(0,30)||``,[n,r]=(0,f.useState)(!1);return(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(a,{label:`Subtask`,detail:t,trailing:(0,p.jsx)(u,{variant:`ghost`,size:`icon-sm`,className:`text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300`,onClick:()=>r(!0),children:(0,p.jsx)(o,{className:`size-3.5`})}),children:(0,p.jsx)(l,{children:(0,p.jsx)(c,{children:(0,p.jsxs)(`div`,{className:`space-y-2`,children:[(0,p.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,p.jsx)(d,{className:`size-4 text-muted-foreground`}),(0,p.jsx)(`span`,{className:`text-xs font-medium text-muted-foreground`,children:`Subtask`})]}),e.agent&&(0,p.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,p.jsx)(i,{className:`size-3 text-muted-foreground`}),(0,p.jsx)(`span`,{className:`text-sm font-medium`,children:e.agent})]}),e.description&&(0,p.jsx)(`div`,{className:`text-sm`,children:e.description}),e.prompt&&(0,p.jsx)(`div`,{className:`text-xs font-mono bg-muted rounded p-2 overflow-x-auto`,children:e.prompt})]})})})}),(0,p.jsx)(s,{sessionId:e.sessionID,open:n,onOpenChange:r})]})}m.__docgenInfo={description:``,methods:[],displayName:`SubtaskPart`,props:{part:{required:!0,tsType:{name:`SubtaskPart`},description:``}}};var h={title:`Chat/Message/Parts/SubtaskPart`,component:m,tags:[`autodocs`],argTypes:{part:{control:`object`,description:`Subtask part data from SDK`}}},g={args:{part:{type:`subtask`,agent:`code-reviewer`,description:`Review the PR for best practices`}}},_={args:{part:{type:`subtask`,agent:`test-generator`,description:`Generate unit tests`,prompt:`Create tests for the authentication module covering:
- Login flow
- Password reset
- Token refresh`}}},v={args:{part:{type:`subtask`,description:`Analyze the codebase structure`}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "subtask",
      agent: "code-reviewer",
      description: "Review the PR for best practices"
    } as any
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "subtask",
      agent: "test-generator",
      description: "Generate unit tests",
      prompt: "Create tests for the authentication module covering:\\n- Login flow\\n- Password reset\\n- Token refresh"
    } as any
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "subtask",
      description: "Analyze the codebase structure"
    } as any
  }
}`,...v.parameters?.docs?.source}}};var y=[`Default`,`WithPrompt`,`WithoutAgent`];export{g as Default,_ as WithPrompt,v as WithoutAgent,y as __namedExportsOrder,h as default};