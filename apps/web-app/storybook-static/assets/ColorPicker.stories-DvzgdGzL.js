import{a as e,t}from"./react-D0JuimcS.js";import{t as n}from"./jsx-runtime-CEYMauoA.js";import{a as r,l as i,r as a,t as o}from"./workspaceStore-B1KVW7dj.js";var s=e(t(),1),c=n(),l={title:`UI/ColorPicker`,component:a,tags:[`autodocs`],parameters:{layout:`centered`},argTypes:{colors:{control:!1},columns:{control:`select`,options:[2,3,4,6]},size:{control:`select`,options:[`sm`,`md`,`lg`]}}},u={args:{colors:o,columns:4,size:`md`},render:e=>{let[t,n]=(0,s.useState)(o[0]);return(0,c.jsx)(a,{...e,value:t,onChange:n})}},d={args:{colors:o,columns:4,size:`sm`},render:e=>{let[t,n]=(0,s.useState)(o[0]);return(0,c.jsx)(a,{...e,value:t,onChange:n})}},f={args:{colors:o,columns:4,size:`lg`},render:e=>{let[t,n]=(0,s.useState)(o[0]);return(0,c.jsx)(a,{...e,value:t,onChange:n})}},p={args:{colors:o,columns:6,size:`md`},render:e=>{let[t,n]=(0,s.useState)(o[0]);return(0,c.jsx)(a,{...e,value:t,onChange:n})}},m={args:{colors:o,columns:4,size:`md`,label:`Workspace Color`},render:e=>{let[t,n]=(0,s.useState)(o[0]);return(0,c.jsx)(a,{...e,value:t,onChange:n})}},h={args:{colors:o,columns:4,size:`md`,disabled:!0},render:e=>{let[t,n]=(0,s.useState)(o[0]);return(0,c.jsx)(a,{...e,value:t,onChange:n})}},g={args:{colors:[`#FF0000`,`#00FF00`,`#0000FF`,`#FFFF00`,`#FF00FF`,`#00FFFF`],columns:3,size:`md`},render:e=>{let[t,n]=(0,s.useState)((e.colors??[`#FF0000`])[0]);return(0,c.jsx)(a,{...e,value:t,onChange:n})}},_={args:{colors:o,columns:4,size:`md`,label:`Color`},render:e=>{let{control:t,watch:n}=i({defaultValues:{color:o[0]}}),s=n(`color`);return(0,c.jsxs)(`div`,{className:`space-y-4`,children:[(0,c.jsx)(r,{name:`color`,control:t,render:({field:t})=>(0,c.jsx)(a,{...e,value:t.value,onChange:t.onChange})}),(0,c.jsxs)(`p`,{className:`text-sm text-muted-foreground`,children:[`Selected: `,(0,c.jsx)(`span`,{style:{color:s},children:s})]})]})}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "md"
  },
  render: args => {
    const [value, setValue] = useState<string>(WORKSPACE_COLORS[0]);
    return <ColorPicker {...args} value={value} onChange={setValue} />;
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "sm"
  },
  render: args => {
    const [value, setValue] = useState<string>(WORKSPACE_COLORS[0]);
    return <ColorPicker {...args} value={value} onChange={setValue} />;
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "lg"
  },
  render: args => {
    const [value, setValue] = useState<string>(WORKSPACE_COLORS[0]);
    return <ColorPicker {...args} value={value} onChange={setValue} />;
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    colors: WORKSPACE_COLORS,
    columns: 6,
    size: "md"
  },
  render: args => {
    const [value, setValue] = useState<string>(WORKSPACE_COLORS[0]);
    return <ColorPicker {...args} value={value} onChange={setValue} />;
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "md",
    label: "Workspace Color"
  },
  render: args => {
    const [value, setValue] = useState<string>(WORKSPACE_COLORS[0]);
    return <ColorPicker {...args} value={value} onChange={setValue} />;
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "md",
    disabled: true
  },
  render: args => {
    const [value, setValue] = useState<string>(WORKSPACE_COLORS[0]);
    return <ColorPicker {...args} value={value} onChange={setValue} />;
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    colors: ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"] as const,
    columns: 3,
    size: "md"
  },
  render: args => {
    const colors = args.colors ?? ["#FF0000"];
    const [value, setValue] = useState<string>(colors[0]);
    return <ColorPicker {...args} value={value} onChange={setValue} />;
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    colors: WORKSPACE_COLORS,
    columns: 4,
    size: "md",
    label: "Color"
  },
  render: args => {
    const {
      control,
      watch
    } = useForm({
      defaultValues: {
        color: WORKSPACE_COLORS[0]
      }
    });
    const selectedColor = watch("color");
    return <div className="space-y-4">
        <Controller name="color" control={control} render={({
        field
      }) => <ColorPicker {...args} value={field.value} onChange={field.onChange} />} />
        <p className="text-sm text-muted-foreground">
          Selected: <span style={{
          color: selectedColor
        }}>{selectedColor}</span>
        </p>
      </div>;
  }
}`,..._.parameters?.docs?.source}}};var v=[`Default`,`Small`,`Large`,`SixColumns`,`WithLabel`,`Disabled`,`CustomColors`,`WithReactHookForm`];export{g as CustomColors,u as Default,h as Disabled,f as Large,p as SixColumns,d as Small,m as WithLabel,_ as WithReactHookForm,v as __namedExportsOrder,l as default};