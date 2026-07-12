import{t as e}from"./jsx-runtime-CEYMauoA.js";import{t}from"./createLucideIcon-rGH91BOO.js";import{t as n}from"./CollapsiblePart-Dk5SKVpN.js";import{n as r,t as i}from"./card-BMQhYD7Y.js";var a=t(`git-commit-horizontal`,[[`circle`,{cx:`12`,cy:`12`,r:`3`,key:`1v7zrd`}],[`line`,{x1:`3`,x2:`9`,y1:`12`,y2:`12`,key:`1dyftd`}],[`line`,{x1:`15`,x2:`21`,y1:`12`,y2:`12`,key:`oup4p8`}]]),o=e();function s({part:e}){let t=e.files?.length??0;return(0,o.jsx)(n,{label:`Patch`,detail:`${e.hash?.slice(0,7)} (${t} file${t===1?``:`s`})`,children:(0,o.jsx)(i,{children:(0,o.jsx)(r,{className:`p-3`,children:(0,o.jsxs)(`div`,{className:`space-y-2`,children:[(0,o.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,o.jsx)(a,{className:`size-4 text-muted-foreground`}),(0,o.jsx)(`span`,{className:`text-xs font-medium text-muted-foreground`,children:`Patch`}),(0,o.jsx)(`span`,{className:`text-xs font-mono text-muted-foreground`,children:e.hash})]}),e.files&&e.files.length>0&&(0,o.jsxs)(`div`,{className:`space-y-1`,children:[(0,o.jsxs)(`div`,{className:`text-xs text-muted-foreground`,children:[e.files.length,` file`,e.files.length>1?`s`:``,` `,`modified:`]}),(0,o.jsx)(`ul`,{className:`text-xs space-y-1`,children:e.files.map((e,t)=>(0,o.jsx)(`li`,{className:`font-mono truncate`,children:e},t))})]})]})})})})}s.__docgenInfo={description:``,methods:[],displayName:`PatchPart`,props:{part:{required:!0,tsType:{name:`PatchPartType`},description:``}}};var c={title:`Chat/Message/Parts/PatchPart`,component:s,tags:[`autodocs`],argTypes:{part:{control:`object`,description:`Patch part data from SDK`}}},l={args:{part:{type:`patch`,hash:`abc123def456`,files:[]}}},u={args:{part:{type:`patch`,hash:`abc123def456`,files:[`src/App.tsx`,`src/index.ts`,`package.json`]}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "patch",
      hash: "abc123def456",
      files: []
    } as any
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "patch",
      hash: "abc123def456",
      files: ["src/App.tsx", "src/index.ts", "package.json"]
    } as any
  }
}`,...u.parameters?.docs?.source}}};var d=[`Default`,`WithFiles`];export{l as Default,u as WithFiles,d as __namedExportsOrder,c as default};