import{t as e}from"./jsx-runtime-CEYMauoA.js";import{t}from"./createLucideIcon-rGH91BOO.js";import{t as n}from"./CollapsiblePart-Dk5SKVpN.js";import{n as r,t as i}from"./card-BMQhYD7Y.js";var a=t(`brain`,[[`path`,{d:`M12 18V5`,key:`adv99a`}],[`path`,{d:`M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4`,key:`1e3is1`}],[`path`,{d:`M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5`,key:`1gqd8o`}],[`path`,{d:`M17.997 5.125a4 4 0 0 1 2.526 5.77`,key:`iwvgf7`}],[`path`,{d:`M18 18a4 4 0 0 0 2-7.464`,key:`efp6ie`}],[`path`,{d:`M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517`,key:`1gq6am`}],[`path`,{d:`M6 18a4 4 0 0 1-2-7.464`,key:`k1g0md`}],[`path`,{d:`M6.003 5.125a4 4 0 0 0-2.526 5.77`,key:`q97ue3`}]]),o=e();function s({part:e}){let t=e.time.end?`${((e.time.end-e.time.start)/1e3).toFixed(2)}s`:null;return(0,o.jsx)(n,{label:`Thinking`,detail:t||``,children:(0,o.jsx)(i,{children:(0,o.jsxs)(r,{children:[(0,o.jsxs)(`div`,{className:`flex items-center gap-2 mb-2`,children:[(0,o.jsx)(a,{className:`size-4 text-muted-foreground`}),(0,o.jsx)(`span`,{className:`text-xs font-medium text-muted-foreground`,children:`Reasoning`}),t&&(0,o.jsx)(`span`,{className:`text-xs text-muted-foreground`,children:t})]}),(0,o.jsx)(`div`,{className:`text-sm font-mono leading-relaxed whitespace-pre-wrap`,children:e.text})]})})})}s.__docgenInfo={description:``,methods:[],displayName:`ReasoningPart`,props:{part:{required:!0,tsType:{name:`ReasoningPartType`},description:``}}};var c={title:`Chat/Message/Parts/ReasoningPart`,component:s,tags:[`autodocs`],argTypes:{part:{control:`object`,description:`Reasoning part data from SDK`}}},l={args:{part:{type:`reasoning`,text:`Let me analyze this problem step by step...`,time:{start:Date.now()-5e3,end:Date.now()}}}},u={args:{part:{type:`reasoning`,text:`Thinking about the best approach to solve this...`,time:{start:Date.now()-1e4,end:Date.now()}}}},d={args:{part:{type:`reasoning`,text:`Let me think through this complex problem:

1. First, I need to understand the requirements
2. Then analyze the current codebase structure
3. Design a solution that handles edge cases
4. Implement the feature with proper error handling
5. Write tests to ensure reliability

This requires careful consideration of multiple factors...`,time:{start:Date.now()-15e3,end:Date.now()}}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "reasoning",
      text: "Let me analyze this problem step by step...",
      time: {
        start: Date.now() - 5000,
        end: Date.now()
      }
    } as any
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "reasoning",
      text: "Thinking about the best approach to solve this...",
      time: {
        start: Date.now() - 10000,
        end: Date.now()
      }
    } as any
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "reasoning",
      text: "Let me think through this complex problem:\\n\\n1. First, I need to understand the requirements\\n2. Then analyze the current codebase structure\\n3. Design a solution that handles edge cases\\n4. Implement the feature with proper error handling\\n5. Write tests to ensure reliability\\n\\nThis requires careful consideration of multiple factors...",
      time: {
        start: Date.now() - 15000,
        end: Date.now()
      }
    } as any
  }
}`,...d.parameters?.docs?.source}}};var f=[`Default`,`WithDuration`,`LongReasoning`];export{l as Default,d as LongReasoning,u as WithDuration,f as __namedExportsOrder,c as default};