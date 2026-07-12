import{t as e}from"./jsx-runtime-CEYMauoA.js";import{t}from"./createLucideIcon-rGH91BOO.js";import{t as n}from"./CollapsiblePart-Dk5SKVpN.js";import{n as r,t as i}from"./card-BMQhYD7Y.js";var a=t(`paperclip`,[[`path`,{d:`m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551`,key:`1miecu`}]]),o=e();function s({source:e}){return e.type===`file`?(0,o.jsxs)(`div`,{className:`text-xs text-muted-foreground`,children:[e.path,` (`,e.text.start,`-`,e.text.end,`)`]}):e.type===`symbol`?(0,o.jsxs)(`div`,{className:`text-xs text-muted-foreground`,children:[e.path,`:`,e.range.start.line+1]}):null}function c({part:e}){return(0,o.jsx)(n,{label:`File`,detail:e.filename||`Untitled`,children:(0,o.jsx)(i,{children:(0,o.jsx)(r,{className:`p-3`,children:(0,o.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[(0,o.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,o.jsx)(a,{className:`size-4 text-muted-foreground`}),(0,o.jsx)(`span`,{className:`text-xs font-medium text-muted-foreground`,children:`File`}),(0,o.jsx)(`span`,{className:`text-sm font-medium`,children:e.filename||`Untitled`})]}),e.source&&(0,o.jsx)(s,{source:e.source}),e.mime&&(0,o.jsxs)(`div`,{className:`text-xs text-muted-foreground`,children:[`MIME: `,e.mime]})]})})})})}c.__docgenInfo={description:``,methods:[],displayName:`FilePart`,props:{part:{required:!0,tsType:{name:`FilePartType`},description:``}}};var l={title:`Chat/Message/Parts/FilePart`,component:c,tags:[`autodocs`],argTypes:{part:{control:`object`,description:`File part data from SDK`}}},u={args:{part:{type:`file`,filename:`package.json`,mime:`application/json`,url:``}}},d={args:{part:{type:`file`,filename:`image.png`,mime:`image/png`,url:``}}},f={args:{part:{type:`file`,filename:`src/index.ts`,mime:`text/typescript`,url:``,source:{type:`file`,path:`src/index.ts`,text:{value:`export const x = 1;`,start:0,end:17}}}}},p={args:{part:{type:`file`,filename:`App.tsx`,mime:`text/typescript`,url:``,source:{type:`symbol`,path:`src/App.tsx`,symbol:`App`,range:{start:{line:5,character:0},end:{line:10,character:1}}}}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "file",
      filename: "package.json",
      mime: "application/json",
      url: ""
    } as any
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "file",
      filename: "image.png",
      mime: "image/png",
      url: ""
    } as any
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "file",
      filename: "src/index.ts",
      mime: "text/typescript",
      url: "",
      source: {
        type: "file",
        path: "src/index.ts",
        text: {
          value: "export const x = 1;",
          start: 0,
          end: 17
        }
      }
    } as any
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "file",
      filename: "App.tsx",
      mime: "text/typescript",
      url: "",
      source: {
        type: "symbol",
        path: "src/App.tsx",
        symbol: "App",
        range: {
          start: {
            line: 5,
            character: 0
          },
          end: {
            line: 10,
            character: 1
          }
        }
      }
    } as any
  }
}`,...p.parameters?.docs?.source}}};var m=[`Default`,`WithMime`,`WithFileSource`,`WithSymbolSource`];export{u as Default,f as WithFileSource,d as WithMime,p as WithSymbolSource,m as __namedExportsOrder,l as default};