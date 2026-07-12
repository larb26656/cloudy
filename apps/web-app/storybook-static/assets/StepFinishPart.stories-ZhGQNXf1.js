function e(e){return null}var t={title:`Chat/Message/Parts/StepFinishPart`,component:e,tags:[`autodocs`],argTypes:{part:{control:`object`,description:`Step finish part data from SDK`},info:{control:`object`,description:`Optional assistant message info`}}},n={args:{part:{type:`step-finish`,tokens:{input:1500,output:500,reasoning:0,cache:{read:0,write:0}},cost:.0025}}},r={args:{part:{type:`step-finish`,tokens:{input:2e3,output:800,reasoning:1500,cache:{read:500,write:200}},cost:.0045}}},i={args:{part:{type:`step-finish`,tokens:{input:1e3,output:300,reasoning:0,cache:{read:0,write:0}},cost:.0015},info:{modelID:`claude-3-opus`}}},a={args:{part:{type:`step-finish`,tokens:{input:0,output:0,reasoning:0,cache:{read:0,write:0}},cost:0}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "step-finish",
      tokens: {
        input: 1500,
        output: 500,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0
        }
      },
      cost: 0.0025
    } as any
  }
}`,...n.parameters?.docs?.source}}},r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "step-finish",
      tokens: {
        input: 2000,
        output: 800,
        reasoning: 1500,
        cache: {
          read: 500,
          write: 200
        }
      },
      cost: 0.0045
    } as any
  }
}`,...r.parameters?.docs?.source}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "step-finish",
      tokens: {
        input: 1000,
        output: 300,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0
        }
      },
      cost: 0.0015
    } as any,
    info: {
      modelID: "claude-3-opus"
    } as any
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    part: {
      type: "step-finish",
      tokens: {
        input: 0,
        output: 0,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0
        }
      },
      cost: 0
    } as any
  }
}`,...a.parameters?.docs?.source}}};var o=[`Default`,`WithReasoning`,`WithModelInfo`,`ZeroCost`];export{n as Default,i as WithModelInfo,r as WithReasoning,a as ZeroCost,o as __namedExportsOrder,t as default};