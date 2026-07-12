import{t as e}from"./jsx-runtime-CEYMauoA.js";import{t}from"./createLucideIcon-rGH91BOO.js";import{t as n}from"./CollapsiblePart-Dk5SKVpN.js";import{n as r,t as i}from"./card-BMQhYD7Y.js";var a=t(`circle-alert`,[[`circle`,{cx:`12`,cy:`12`,r:`10`,key:`1mglay`}],[`line`,{x1:`12`,x2:`12`,y1:`8`,y2:`12`,key:`1pkeuh`}],[`line`,{x1:`12`,x2:`12.01`,y1:`16`,y2:`16`,key:`4dfq90`}]]),o=t(`rotate-ccw`,[[`path`,{d:`M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8`,key:`1357e3`}],[`path`,{d:`M3 3v5h5`,key:`1xhq8a`}]]);function s(e,t=`en-US`){return new Date(e).toLocaleTimeString(t,{hour:`2-digit`,minute:`2-digit`})}var c=e();function l({part:e}){let t=s(e.time.created);return(0,c.jsx)(n,{label:`Retry`,detail:`Attempt #${e.attempt} - ${e.error.data.message?.slice(0,30)||``}`,children:(0,c.jsx)(i,{children:(0,c.jsx)(r,{className:`p-3`,children:(0,c.jsxs)(`div`,{className:`space-y-2`,children:[(0,c.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,c.jsx)(o,{className:`size-4 text-muted-foreground`}),(0,c.jsx)(`span`,{className:`text-xs font-medium text-muted-foreground`,children:`Retry`}),(0,c.jsxs)(`span`,{className:`text-xs text-muted-foreground`,children:[`Attempt #`,e.attempt]}),(0,c.jsx)(`span`,{className:`text-xs text-muted-foreground`,children:t})]}),(0,c.jsxs)(`div`,{className:`space-y-1`,children:[(0,c.jsxs)(`div`,{className:`flex items-start gap-2`,children:[(0,c.jsx)(a,{className:`size-3 text-destructive mt-0.5`}),(0,c.jsx)(`div`,{className:`text-xs`,children:e.error.data.message})]}),e.error.data.statusCode&&(0,c.jsxs)(`div`,{className:`text-xs text-muted-foreground ml-5`,children:[`Status: `,e.error.data.statusCode]})]})]})})})})}l.__docgenInfo={description:``,methods:[],displayName:`RetryPart`,props:{part:{required:!0,tsType:{name:`RetryPartType`},description:``}}};var u={title:`Chat/Message/Parts/RetryPart`,component:l,tags:[`autodocs`],argTypes:{part:{control:`object`,description:`Retry part data from SDK`}}},d={args:{part:{type:`retry`,attempt:1,time:{created:Date.now()-6e4},error:{data:{message:`Rate limit exceeded. Please wait before retrying.`,statusCode:429}}}}},f={args:{part:{type:`retry`,attempt:3,time:{created:Date.now()-3e5},error:{data:{message:`Connection timeout`,statusCode:504}}}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "retry",
      attempt: 1,
      time: {
        created: Date.now() - 60000
      },
      error: {
        data: {
          message: "Rate limit exceeded. Please wait before retrying.",
          statusCode: 429
        }
      }
    } as any
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "retry",
      attempt: 3,
      time: {
        created: Date.now() - 300000
      },
      error: {
        data: {
          message: "Connection timeout",
          statusCode: 504
        }
      }
    } as any
  }
}`,...f.parameters?.docs?.source}}};var p=[`Default`,`MultipleAttempts`];export{d as Default,f as MultipleAttempts,p as __namedExportsOrder,u as default};