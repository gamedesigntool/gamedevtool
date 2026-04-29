import type { Dispatch, SetStateAction } from "react";

type ThemeToggleProps = {
  theme:string;
  setTheme:Dispatch<SetStateAction<string>>;
};

type LangToggleProps = {
  lang:string;
  setLang:Dispatch<SetStateAction<string>>;
};

type TextAreaProps = {
  value:string;
  onChange:(value:string)=>void;
  placeholder?:string;
  rows?:number;
};

type FieldProps = TextAreaProps & {
  label:string;
  hint?:string;
};

const WB_CLR='#22d3ee';
const LD_CLR='#34d399';

export function ThemeToggle({theme,setTheme}:ThemeToggleProps){
  return <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} title={theme==='dark'?'Light mode':'Dark mode'} style={{background:'none',border:'1px solid var(--gdd-border)',color:'var(--gdd-muted)',borderRadius:8,padding:'4px 9px',cursor:'pointer',fontSize:15,lineHeight:1,transition:'all .2s'}}>{theme==='dark'?'☀️':'🌙'}</button>;
}

export function LangToggle({lang,setLang}:LangToggleProps){
  return <button onClick={()=>setLang(l=>l==='pt'?'en':'pt')} title="Switch language" style={{background:'none',border:'1px solid var(--gdd-border)',color:'var(--gdd-muted)',borderRadius:8,padding:'4px 9px',cursor:'pointer',fontSize:11,fontWeight:700,letterSpacing:.5,transition:'all .2s'}}>{lang==='pt'?'EN':'PT'}</button>;
}

export function TA({value,onChange,placeholder,rows=3}:TextAreaProps){
  return(
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{background:'var(--gdd-bg3)',border:'1px solid '+'var(--gdd-border)',borderRadius:8,padding:'12px 14px',color:'var(--gdd-text)',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box',resize:'vertical',lineHeight:1.7}}/>
  );
}

export function WbTA({value,onChange,placeholder,rows=3}:TextAreaProps){
  return(
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{background:'var(--gdd-bg)',border:'1px solid '+'var(--gdd-border)',borderRadius:8,padding:'10px 12px',color:'var(--gdd-text)',fontSize:13,resize:'vertical',outline:'none',width:'100%',boxSizing:'border-box',lineHeight:1.6,fontFamily:'system-ui,sans-serif'}}
      onFocus={e=>e.target.style.borderColor=WB_CLR} onBlur={e=>e.target.style.borderColor='var(--gdd-border)'}/>
  );
}

export function WbField({label,hint,value,onChange,placeholder,rows}:FieldProps){
  return(
    <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
      <div style={{fontSize:10,color:WB_CLR,fontWeight:700,letterSpacing:1,marginBottom:hint?6:8,textTransform:'uppercase'}}>{label}</div>
      {hint&&<div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:8}}>{hint}</div>}
      <WbTA value={value} onChange={onChange} placeholder={placeholder} rows={rows}/>
    </div>
  );
}

export function LdTA({value,onChange,placeholder,rows=3}:TextAreaProps){
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{background:'var(--gdd-bg)',border:'1px solid '+'var(--gdd-border)',borderRadius:8,padding:'10px 12px',color:'var(--gdd-text)',fontSize:13,resize:'vertical',outline:'none',width:'100%',boxSizing:'border-box',lineHeight:1.6,fontFamily:'system-ui,sans-serif'}}
      onFocus={e=>e.target.style.borderColor=LD_CLR} onBlur={e=>e.target.style.borderColor='var(--gdd-border)'}/>
  );
}

export function LdField({label,hint,value,onChange,placeholder,rows}:FieldProps){
  return (
    <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
      <div style={{fontSize:10,color:LD_CLR,fontWeight:700,letterSpacing:1,marginBottom:hint?6:8,textTransform:'uppercase'}}>{label}</div>
      {hint&&<div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:8}}>{hint}</div>}
      <LdTA value={value} onChange={onChange} placeholder={placeholder} rows={rows}/>
    </div>
  );
}
