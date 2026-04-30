import { useState, useRef, useEffect, useCallback, Component, type ChangeEvent, type Dispatch, type MouseEvent, type SetStateAction } from "react";
import { LangToggle, LdField, TA, ThemeToggle, WbField } from "./components/shared/GameDesignToolControls";
import { EMOJIS, MODULES, MODULES_I18N, PALETTE, THEMES, TR } from "./config/gameDesignToolConfig";
import { FB_DEFS, FB_PORTS } from "./features/flowBuilder/flowBuilderConstants";
import { getSuggestions } from "./features/guides/documentSuggestions";
import { CLR as COLORS_CLR, GUIDE as COLORS_GUIDE, PRIMARIES as COLORS_PRIMARIES, SECONDARIES as COLORS_SECONDARIES, STEPS as COLORS_STEPS } from "./features/guides/colors/colorsConstants";
import { CLR as FOUR_KEYS_CLR, GUIDE as FOUR_KEYS_GUIDE, KEYS as FOUR_KEYS_KEYS, STEPS as FOUR_KEYS_STEPS } from "./features/guides/fourKeys/fourKeysConstants";
import { CLR as OCTALYSIS_CLR, CDS as OCTALYSIS_CDS, GUIDE as OCTALYSIS_GUIDE, STEPS as OCTALYSIS_STEPS } from "./features/guides/octalysis/octalysisConstants";
import { AESTHETICS as MDA_AESTHETICS, CLR as MDA_CLR, GUIDE as MDA_GUIDE, STEPS as MDA_STEPS } from "./features/guides/mda/mdaConstants";
import { CLR as PENS_CLR, COMPONENTS as PENS_COMPONENTS, GUIDE as PENS_GUIDE, STEPS as PENS_STEPS } from "./features/guides/pens/pensConstants";
import { CLR as TETRAD_CLR, ELEMENTS as TETRAD_ELEMENTS, GUIDE as TETRAD_GUIDE, STEPS as TETRAD_STEPS } from "./features/guides/tetrad/tetradConstants";
import { CLR as LUDONARRATIVE_CLR, GUIDE as LUDONARRATIVE_GUIDE, STEPS as LUDONARRATIVE_STEPS } from "./features/guides/ludonarrative/ludonarrativeConstants";
import { KANBAN_COLS, PROD_CLR, TASK_CATS, TASK_PRIO } from "./features/production/productionConstants";
import { LS_KEYS, lsGet, lsSet } from "./services/localStorage";
import { exportToPDF } from "./utils/gddExport";
import { scrollTo, todayStr, uid } from "./utils/gameDesignToolRuntime";
import { mdToHtml, stripHtml } from "./utils/gameDesignToolText";

declare global {
  interface Window {
    __gdt_loaded?: boolean;
  }
}

type ProjectId = string | number;
type DocumentId = string;
type StatusKey = "progress" | "done";
type ThemeKey = keyof typeof THEMES;
type LangKey = keyof typeof TR;
type ViewKey =
  | "landing"
  | "dashboard"
  | "project"
  | "module"
  | "document"
  | "brainstorming"
  | "production"
  | "flow-builder"
  | "mda-guided"
  | "double-a-guided"
  | "fourkeys-guided"
  | "colors-guided"
  | "octalysis-guided"
  | "pens-guided"
  | "tetrad-guided"
  | "ludonarrative-guided"
  | "reedsy-wb-guided"
  | "unity-ld-guided";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Project = {
  id: ProjectId;
  name: string;
  genre: string;
  platform: string;
  color: string;
  emoji: string;
  progress: number;
};

type ModuleMeta = {
  id: string;
  icon: string;
  label: string;
  color: string;
  desc: string;
};

type FlowNode = {
  id: string;
  type: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
};

type FlowEdge = {
  id: string;
  from: string;
  to: string;
  fromPort?: string;
  toPort?: string;
  label?: string;
};

type FlowData = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

type FlowSelection = { type: "node" | "edge"; id: string } | null;
type FlowDragging = { id: string; ox: number; oy: number } | null;
type FlowConnecting = { fromId: string; fromPort: string; ax: number; ay: number; cx: number; cy: number } | null;
type FlowPanning = { sx: number; sy: number; sp: CanvasPoint } | null;

type Document = {
  id: DocumentId;
  title: string;
  content: string;
  messages?: ChatMessage[];
  status: StatusKey;
  createdAt: string;
  updatedAt?: string | null;
  framework?: string;
  flowData?: FlowData;
};

type ProductionTask = {
  id: string;
  title: string;
  desc: string;
  priority: string;
  category: string;
  column: string;
  createdAt: string;
  updatedAt?: string | null;
};

type CanvasPoint = { x: number; y: number };
type CanvasStroke = { id: string; points: CanvasPoint[]; color: string; width: number };
type CanvasElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  color?: string;
  textColor?: string;
  src?: string;
  fontSize?: number;
};

type ProjectModuleData = {
  docs?: Document[];
  tasks?: ProductionTask[];
  elements?: CanvasElement[];
  strokes?: CanvasStroke[];
};

type DocumentModuleData = ProjectModuleData & { docs: Document[] };
type ProjectData = {
  [projectId: string]: Record<string, ProjectModuleData | undefined> | undefined;
  [projectId: number]: Record<string, ProjectModuleData | undefined> | undefined;
};
type ConfirmState = { type: "delete" | "clone"; id: ProjectId } | { type: "deleteDoc"; id: DocumentId } | null;
type SetProjectData = Dispatch<SetStateAction<ProjectData>>;
type InsertHtmlRef = { current: ((html: string) => void) | null };
type ModeChoice = "choice" | null;
type MechanicNewMode = "choice" | "frameworks" | null;
type EditableDiv = HTMLDivElement & { _init?: boolean };

// ── Fallback global para erros antes do React montar ─────────────────────────
if(typeof window !== 'undefined'){
  window.__gdt_loaded = false;
  window.onerror = function(msg, src, line, col, err){
    if(window.__gdt_loaded) return false; // React já montou — ErrorBoundary cuida
    document.body.style.cssText = 'margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#07070f;font-family:system-ui,sans-serif;color:#e2e8f0;text-align:center;padding:32px;box-sizing:border-box;';
    document.body.innerHTML = '<div><div style="font-size:48px;margin-bottom:16px">⚠️</div><div style="font-size:20px;font-weight:700;color:#f87171;margin-bottom:12px">Erro ao carregar</div><div style="color:#64748b;font-size:14px;max-width:400px;line-height:1.7;margin-bottom:24px">Ocorreu um erro inesperado ao inicializar a plataforma.</div><button onclick="location.reload()" style="background:#7c3aed;color:#fff;border:none;border-radius:10px;padding:12px 32px;font-size:14px;font-weight:700;cursor:pointer">🔄 Recarregar</button><details style="margin-top:16px;font-size:11px;color:#334155;max-width:500px"><summary style="cursor:pointer;color:#475569">Detalhes</summary>'+(err?.message||msg)+'</details></div>';
    return false;
  };
  // Marca que React montou — desativa o fallback
  setTimeout(()=>{ window.__gdt_loaded = true; }, 5000);
}

const mkS=(th)=>({
  app: {minHeight:'100vh',background:'var(--gdd-bg)',color:'var(--gdd-text)',fontFamily:'system-ui,sans-serif',fontSize:14},
  btn: (bg='#7c3aed',c='#fff',ex={})=>({background:bg,color:c,border:'none',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:700,fontSize:13,...ex}),
  card: clr=>({background:'var(--gdd-bg2)',border:`1px solid ${clr}28`,borderRadius:14,padding:20,cursor:'pointer',transition:'all .2s',position:'relative',overflow:'hidden'}),
  grid: (min=260)=>({display:'grid',gridTemplateColumns:`repeat(auto-fill,minmax(${min}px,1fr))`,gap:16}),
  inp: {background:'var(--gdd-bg3)',border:'1px solid '+'var(--gdd-border)',borderRadius:8,padding:'10px 14px',color:'var(--gdd-text)',fontSize:14,outline:'none',width:'100%',boxSizing:'border-box'},
  back: {background:'none',border:'1px solid '+'var(--gdd-border)',color:'var(--gdd-muted)',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontSize:12},
});
const S=mkS(THEMES.dark);// default for top-level components; GDDHub uses mkS(th)

// ── ImgResizeBar ──────────────────────────────────────────────────────────────
function ImgResizeBar({img,color,onClose}:{img: HTMLImageElement | null; color: string; onClose: () => void}){
  const [custom,setCustom]=useState('');
  if(!img)return null;
  const apply=w=>{img.style.width=w;img.style.maxWidth='100%';onClose();};
  return(
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',background:'var(--gdd-bg3)',border:`1px solid ${color}55`,borderRadius:8,flexWrap:'wrap'}}>
      <span style={{fontSize:11,color:'var(--gdd-dim)'}}>📐</span>
      {['25%','50%','75%','100%'].map(w=><button key={w} onClick={()=>apply(w)} style={{background:'none',border:`1px solid ${color}44`,color,borderRadius:5,padding:'3px 9px',cursor:'pointer',fontSize:11,fontWeight:600}}>{w==='100%'?'Full':w}</button>)}
      <div style={{display:'flex',gap:4}}>
        <input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="ex: 300px" style={{background:'var(--gdd-bg)',border:'1px solid '+'var(--gdd-border)',borderRadius:5,padding:'3px 8px',color:'var(--gdd-text)',fontSize:11,outline:'none',width:90}} onKeyDown={e=>e.key==='Enter'&&custom&&apply(custom)}/>
        <button onClick={()=>custom&&apply(custom)} style={{background:color,border:'none',color:'#000',borderRadius:5,padding:'3px 9px',cursor:'pointer',fontSize:11,fontWeight:700}}>OK</button>
      </div>
      <button onClick={onClose} style={{background:'none',border:'none',color:'var(--gdd-muted)',cursor:'pointer',fontSize:13,marginLeft:'auto'}}>✕</button>
    </div>
  );
}

// ── DocEditor ─────────────────────────────────────────────────────────────────
function DocEditor({value,color,onChange,insertRef}:{value: string; color: string; onChange: (value: string) => void; insertRef: InsertHtmlRef}){
  const edRef=useRef<EditableDiv | null>(null),fileRef=useRef<HTMLInputElement | null>(null);
  const [imgModal,setImgModal]=useState(false),[imgPrompt,setImgPrompt]=useState(''),[genLoading,setGenLoading]=useState(false),[selImg,setSelImg]=useState<HTMLImageElement | null>(null),[,tick]=useState(0);
  const hoverClr=color||'#7c3aed';
  useEffect(()=>{if(edRef.current&&!edRef.current._init){edRef.current.innerHTML=value||'';edRef.current._init=true;}},[]);
  useEffect(()=>{if(!insertRef)return;insertRef.current=html=>{const el=edRef.current;if(!el)return;el.focus();const r=document.createRange();r.selectNodeContents(el);r.collapse(false);const s=window.getSelection();if(!s)return;s.removeAllRanges();s.addRange(r);document.execCommand('insertHTML',false,'<hr>'+html);onChange(el.innerHTML);};},[insertRef,onChange]);
  const exec=(cmd:string,val?:string)=>{document.execCommand(cmd,false,val);edRef.current?.focus();tick(n=>n+1);};
  const qState=(cmd: string)=>{try{return document.queryCommandState(cmd);}catch(e){return false;}};
  const handleClick=(e: MouseEvent<HTMLDivElement>)=>{if(e.target instanceof HTMLImageElement)setSelImg(e.target);else setSelImg(null);};
  const handleUpload=(e: ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{const result=typeof r.result==='string'?r.result:'';if(!result)return;edRef.current?.focus();document.execCommand('insertHTML',false,'<br><img src="'+result+'" alt="'+f.name+'" style="max-width:100%;border-radius:8px;margin:8px 0;display:block"><br>');onChange(edRef.current?.innerHTML||'');};r.readAsDataURL(f);e.target.value='';};
  const handleGenImg=()=>{
    if(!imgPrompt.trim())return;setGenLoading(true);
    const url='https://image.pollinations.ai/prompt/'+encodeURIComponent(imgPrompt)+'?width=640&height=360&nologo=true&seed='+Math.floor(Math.random()*99999);
    const img=new Image();
    img.onload=()=>{const el=edRef.current;if(!el)return;el.focus();const r=document.createRange();r.selectNodeContents(el);r.collapse(false);const s=window.getSelection();if(!s)return;s.removeAllRanges();s.addRange(r);document.execCommand('insertHTML',false,'<br><figure style="margin:12px 0;text-align:center"><img src="'+url+'" alt="'+imgPrompt+'" style="max-width:100%;border-radius:8px;display:block;margin:0 auto"><figcaption>'+imgPrompt+'</figcaption></figure><br>');onChange(el.innerHTML||'');setGenLoading(false);setImgModal(false);setImgPrompt('');};
    img.onerror=()=>{setGenLoading(false);alert('Erro ao gerar. Tente outro prompt.');};img.src=url;
  };
  const TB=({label,title,cmd,active=false,onClick}:{label: string; title: string; cmd?: string; active?: boolean; onClick?: () => void})=><button title={title} onMouseDown={e=>{e.preventDefault();onClick?onClick():cmd&&exec(cmd);}} style={{background:active?color+'22':'none',border:'1px solid '+(active?color:'var(--gdd-border)'),color:active?color:'var(--gdd-dim)',borderRadius:5,padding:'3px 8px',cursor:'pointer',fontSize:12,fontWeight:active?700:400}}>{label}</button>;
  const imgHoverStyle='[contenteditable] img:hover{outline:2px solid '+hoverClr+'88}';
  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',position:'relative'}}>
      <div style={{display:'flex',alignItems:'center',gap:4,padding:'7px 12px',borderBottom:'1px solid '+'var(--gdd-border2)',background:'var(--gdd-bg)',flexWrap:'wrap',flexShrink:0}}>
        <TB label="B" title="Negrito" cmd="bold" active={qState('bold')}/><TB label="I" title="Itálico" cmd="italic" active={qState('italic')}/><TB label="U" title="Sublinhado" cmd="underline" active={qState('underline')}/>
        <div style={{width:1,height:14,background:'var(--gdd-border)',margin:'0 2px'}}/>
        <TB label="H1" title="Título" onClick={()=>exec('formatBlock','h2')}/><TB label="H2" title="Subtítulo" onClick={()=>exec('formatBlock','h3')}/><TB label="¶" title="Parágrafo" onClick={()=>exec('formatBlock','p')}/>
        <div style={{width:1,height:14,background:'var(--gdd-border)',margin:'0 2px'}}/>
        <TB label="• Lista" title="Lista" onClick={()=>exec('insertUnorderedList')}/><TB label="1. Lista" title="Numerada" onClick={()=>exec('insertOrderedList')}/>
        <div style={{width:1,height:14,background:'var(--gdd-border)',margin:'0 2px'}}/>
        <button onMouseDown={e=>{e.preventDefault();fileRef.current?.click();}} style={{background:'none',border:'1px solid '+'var(--gdd-border)',color:'var(--gdd-dim)',borderRadius:5,padding:'3px 8px',cursor:'pointer',fontSize:12}}>📷 Upload</button>
        <button onMouseDown={e=>{e.preventDefault();setImgModal(true);}} style={{background:color+'18',border:'1px solid '+color+'50',color,borderRadius:5,padding:'3px 8px',cursor:'pointer',fontSize:12,fontWeight:600}}>🖼️ IA Image</button>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleUpload}/>
      </div>
      {selImg&&<div style={{padding:'6px 12px',borderBottom:'1px solid '+'var(--gdd-border2)',background:'var(--gdd-bg0)',flexShrink:0}}><ImgResizeBar img={selImg} color={color} onClose={()=>{onChange(edRef.current?.innerHTML||'');setSelImg(null);}}/></div>}
      <div ref={edRef} contentEditable suppressContentEditableWarning onClick={handleClick} onInput={e=>onChange(e.currentTarget.innerHTML)} data-placeholder="Comece a escrever ou use a IA para gerar conteúdo..." style={{flex:1,overflowY:'auto',padding:'20px 24px',outline:'none',lineHeight:1.8,fontSize:14,color:'var(--gdd-text)',caretColor:color}}/>
      {imgModal&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}><div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border)',borderRadius:16,padding:24,width:380}}><h3 style={{margin:'0 0 6px',fontSize:16}}>🖼️ Gerar imagem com IA</h3><p style={{color:'var(--gdd-dim)',fontSize:12,margin:'0 0 14px'}}>Descreva a imagem a inserir.</p><textarea value={imgPrompt} onChange={e=>setImgPrompt(e.target.value)} placeholder="Ex: Floresta sombria com névoa, dark fantasy..." style={{...S.inp,height:80,resize:'none',fontSize:13}}/><div style={{display:'flex',gap:8,marginTop:14}}><button style={S.btn(genLoading?'var(--gdd-border)':color,'#fff',{flex:1})} onClick={handleGenImg} disabled={genLoading}>{genLoading?'Gerando...':'Gerar e inserir'}</button><button style={S.btn('var(--gdd-border)')} onClick={()=>{setImgModal(false);setImgPrompt('');}} >Cancelar</button></div></div></div>}
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:var(--gdd-dim);pointer-events:none}[contenteditable] h2{font-size:22px;font-weight:900;color:var(--gdd-text);margin:16px 0 8px}[contenteditable] h3{font-size:17px;font-weight:800;color:var(--gdd-text);margin:14px 0 6px}[contenteditable] h4{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--gdd-muted);margin:12px 0 5px}[contenteditable] p{margin:5px 0}[contenteditable] ul,[contenteditable] ol{padding-left:22px;margin:8px 0}[contenteditable] li{margin:4px 0}[contenteditable] strong,[contenteditable] b{color:var(--gdd-text);font-weight:700}[contenteditable] img{border-radius:8px;margin:8px 0;display:block;cursor:pointer}${imgHoverStyle}[contenteditable] figure{margin:12px 0}[contenteditable] figcaption{font-size:11px;color:var(--gdd-dim);text-align:center;margin-top:4px;font-style:italic}[contenteditable] hr{border:none;border-top:1px solid var(--gdd-border);margin:12px 0}[contenteditable] code{background:var(--gdd-border);padding:2px 5px;border-radius:4px;font-size:11px;font-family:monospace;color:#c084fc}`}</style>
    </div>
  );
}

// ── CanvasBoard ───────────────────────────────────────────────────────────────
function CanvasBoard({project,pData,setPData,onBack}:{project: Project; pData: ProjectData; setPData: SetProjectData; onBack: () => void}){
  const CLR='#fb923c';
  const SWATCHES=['#fef08a','#bbf7d0','#bfdbfe','#fecaca','#e9d5ff','#fed7aa'];
  const PEN_CLRS=['#f1f5f9','#f87171','#60a5fa','#34d399','#fbbf24','#a855f7'];
  const TOOLS=[{id:'select',label:'🖱️',title:'Selecionar'},{id:'sticky',label:'📌',title:'Post-it'},{id:'text',label:'T',title:'Texto'},{id:'pen',label:'✏️',title:'Caneta'},{id:'rect',label:'▭',title:'Retângulo'},{id:'circle',label:'◯',title:'Círculo'},{id:'image',label:'🖼️',title:'Imagem'}];

  const [tool,setTool]=useState('select');
  const [elements,setElements]=useState<CanvasElement[]>(()=>pData?.[project.id]?.canvas?.elements||[]);
  const [strokes,setStrokes]=useState<CanvasStroke[]>(()=>pData?.[project.id]?.canvas?.strokes||[]);
  const [selId,setSelId]=useState<string | null>(null);
  const [editId,setEditId]=useState<string | null>(null);
  const [elClr,setElClr]=useState('#fef08a');
  const [penClr,setPenClr]=useState('#f1f5f9');
  const [penSz,setPenSz]=useState(3);
  const [chatOpen,setChatOpen]=useState(true);
  const [msgs,setMsgs]=useState<ChatMessage[]>([]);
  const [chatIn,setChatIn]=useState('');
  const [chatLoad,setChatLoad]=useState(false);
  const [zoom,setZoom]=useState(1);

  const boardRef=useRef<HTMLDivElement | null>(null),cvRef=useRef<HTMLCanvasElement | null>(null),fileRef=useRef<HTMLInputElement | null>(null),chatEndRef=useRef<HTMLDivElement | null>(null),innerBoardRef=useRef<HTMLDivElement | null>(null);
  const pendPos=useRef<CanvasPoint | null>(null),dragRef=useRef<{id: string; ox: number; oy: number; sx: number; sy: number} | null>(null);
  const drawActive=useRef(false),drawPts=useRef<CanvasPoint[]>([]);
  const penClrRef=useRef(penClr),penSzRef=useRef(penSz),toolRef=useRef(tool),zoomRef=useRef(1);

  useEffect(()=>{penClrRef.current=penClr;},[penClr]);
  useEffect(()=>{penSzRef.current=penSz;},[penSz]);
  useEffect(()=>{toolRef.current=tool;},[tool]);
  useEffect(()=>{zoomRef.current=zoom;},[zoom]);

  useEffect(()=>{setPData(p=>({...p,[project.id]:{...(p[project.id]||{}),canvas:{elements,strokes}}}));},[elements,strokes]);

  const redrawStrokes=()=>{
    const cv=cvRef.current;if(!cv)return;
    const ctx=cv.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,cv.width,cv.height);
    const strokesSnap=strokes;
    strokesSnap.forEach(s=>{
      if(s.points.length<2)return;
      ctx.beginPath();ctx.strokeStyle=s.color;ctx.lineWidth=s.width;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.moveTo(s.points[0].x,s.points[0].y);s.points.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();
    });
  };

  useEffect(()=>{
    const cv=cvRef.current,board=boardRef.current;if(!cv||!board)return;
    const sz=()=>{cv.width=board.offsetWidth;cv.height=board.offsetHeight;redrawStrokes();};
    sz();window.addEventListener('resize',sz);return()=>window.removeEventListener('resize',sz);
  },[]);

  useEffect(()=>{redrawStrokes();},[strokes]);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[msgs,chatLoad]);

  const bp=e=>{const r=boardRef.current?.getBoundingClientRect();if(!r)return{x:0,y:0};return{x:(e.clientX-r.left)/zoomRef.current,y:(e.clientY-r.top)/zoomRef.current};};

  const addEl=(type,x,y,src='')=>{
    const map={sticky:[160,160],text:[180,60],rect:[160,100],circle:[120,120],image:[200,150]};
    const [w,h]=map[type]||[160,100];
    const bgMap={sticky:elClr,text:'transparent',rect:elClr,circle:elClr,image:'transparent'};
    const el={id:uid(),type,x:x-w/2,y:y-h/2,w,h,text:type==='sticky'?'Nota..':type==='text'?'Texto..':'',color:bgMap[type],textColor:type==='text'?'var(--gdd-text)':'#1a1a2e',src,fontSize:type==='text'?15:13};
    setElements(p=>[...p,el]);setSelId(el.id);setTool('select');
  };
  const updEl=(id,patch)=>setElements(p=>p.map(e=>e.id===id?{...e,...patch}:e));
  const delSel=()=>{if(selId){setElements(p=>p.filter(e=>e.id!==selId));setSelId(null);}};
  const undoStroke=()=>setStrokes(p=>p.slice(0,-1));
  const clearAll=()=>{setElements([]);setStrokes([]);setSelId(null);setEditId(null);const cv=cvRef.current;if(cv){const ctx=cv.getContext('2d');ctx?.clearRect(0,0,cv.width,cv.height);}};
  const changeZoom=delta=>setZoom(z=>parseFloat(Math.min(3,Math.max(0.25,z+delta)).toFixed(2)));
  const resetZoom=()=>setZoom(1);
  const onWheel=e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();changeZoom(e.deltaY<0?0.1:-0.1);}};

  const onBoardDown=e=>{
    if(e.target!==boardRef.current&&e.target!==cvRef.current&&e.target!==innerBoardRef.current)return;
    if(toolRef.current==='pen')return;
    if(toolRef.current==='image'){pendPos.current=bp(e);fileRef.current?.click();return;}
    if(toolRef.current==='select'){setSelId(null);setEditId(null);return;}
    addEl(toolRef.current,bp(e).x,bp(e).y);
  };
  const onBoardMove=e=>{
    if(!dragRef.current)return;
    const pos=bp(e);const{id,ox,oy,sx,sy}=dragRef.current;
    setElements(p=>p.map(el=>el.id===id?{...el,x:ox+pos.x-sx,y:oy+pos.y-sy}:el));
  };
  const onBoardUp=()=>{dragRef.current=null;};

  const onCvDown=e=>{
    if(toolRef.current!=='pen')return;
    drawActive.current=true;drawPts.current=[bp(e)];
  };
  const onCvMove=e=>{
    if(!drawActive.current)return;
    const pos=bp(e);drawPts.current=[...drawPts.current,pos];
    const cv=cvRef.current;if(!cv)return;
    const ctx=cv.getContext('2d');const pts=drawPts.current;if(!ctx||pts.length<2)return;
    ctx.beginPath();ctx.strokeStyle=penClrRef.current;ctx.lineWidth=penSzRef.current;
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.moveTo(pts[pts.length-2].x,pts[pts.length-2].y);ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);ctx.stroke();
  };
  const onCvUp=()=>{
    if(!drawActive.current)return;drawActive.current=false;
    if(drawPts.current.length>1)setStrokes(p=>[...p,{id:uid(),points:drawPts.current,color:penClrRef.current,width:penSzRef.current}]);
    drawPts.current=[];
  };
  const onElDown=(e,id)=>{
    e.stopPropagation();if(toolRef.current!=='select')return;
    setSelId(id);setEditId(null);
    const pos=bp(e);const el=elements.find(el=>el.id===id);if(!el)return;
    dragRef.current={id,ox:el.x,oy:el.y,sx:pos.x,sy:pos.y};
  };
  const onElDbl=(e,id)=>{
    e.stopPropagation();const el=elements.find(e=>e.id===id);
    if(el?.type==='sticky'||el?.type==='text')setEditId(id);
  };

  const sendChat=async()=>{
    if(!chatIn.trim()||chatLoad)return;
    const um: ChatMessage={role:'user',content:chatIn},nm=[...msgs,um];
    setMsgs(nm);setChatIn('');setChatLoad(true);
    const sys='Você é um especialista em análise e benchmarking de jogos. Sua ÚNICA função é ajudar game designers a encontrar e analisar jogos de referência. Ao receber perguntas sobre mecânicas, gêneros ou estilos, forneça recomendações de 3-5 jogos com análise concisa de cada um (mecânicas-chave, público, diferenciais). Seja direto e útil. Responda SOMENTE sobre jogos e game design. Responda em português brasileiro.';
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,system:sys,messages:nm})});
      const d=await r.json();setMsgs([...nm,{role:'assistant',content:d.content?.[0]?.text||'Erro.'}]);
    }catch(err){console.error(err);}finally{setChatLoad(false);}
  };

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--gdd-bg)',overflow:'hidden',fontFamily:'system-ui,sans-serif',color:'var(--gdd-text)',fontSize:14}}>
      <div style={{height:54,borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',padding:'0 16px',gap:12,flexShrink:0,background:'var(--gdd-bg)'}}>
        <button style={S.back} onClick={onBack}>← {project.name}</button>
        <span style={{color:CLR,fontWeight:700,fontSize:15}}>💡 Brainstorming & Benchmarking</span>
      </div>

      <div style={{borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',padding:'6px 14px',gap:5,flexShrink:0,background:'var(--gdd-bg)',flexWrap:'wrap'}}>
        {TOOLS.map(t=>(
          <button key={t.id} title={t.title} onClick={()=>setTool(t.id)}
            style={{background:tool===t.id?CLR+'22':'none',border:'1px solid '+(tool===t.id?CLR:'var(--gdd-border)'),color:tool===t.id?CLR:'var(--gdd-dim)',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:12,fontWeight:tool===t.id?700:400,whiteSpace:'nowrap'}}>
            {t.label}
          </button>
        ))}
        <div style={{width:1,height:20,background:'var(--gdd-border)',margin:'0 4px'}}/>
        {tool!=='pen'
          ?SWATCHES.map(c=><div key={c} onClick={()=>setElClr(c)} style={{width:20,height:20,borderRadius:4,background:c,cursor:'pointer',border:elClr===c?'2px solid #fff':'2px solid transparent',flexShrink:0}}/>)
          :<>
            {PEN_CLRS.map(c=><div key={c} onClick={()=>setPenClr(c)} style={{width:20,height:20,borderRadius:'50%',background:c,cursor:'pointer',border:penClr===c?'2px solid #fff':'2px solid transparent',flexShrink:0}}/>)}
            <select value={penSz} onChange={e=>setPenSz(+e.target.value)} style={{background:'var(--gdd-bg3)',border:'1px solid '+'var(--gdd-border)',color:'var(--gdd-text)',borderRadius:5,padding:'2px 6px',fontSize:11,cursor:'pointer'}}>
              {[1,2,3,5,8,12].map(s=><option key={s} value={s}>{s}px</option>)}
            </select>
            <button onClick={undoStroke} style={{background:'none',border:'1px solid '+'var(--gdd-border)',color:'var(--gdd-muted)',borderRadius:5,padding:'3px 9px',cursor:'pointer',fontSize:11}}>↩ Traço</button>
          </>
        }
        <div style={{marginLeft:'auto',display:'flex',gap:5,alignItems:'center'}}>
          {selId&&<button onClick={delSel} style={{background:'#ef444418',border:'1px solid #ef444440',color:'#f87171',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontSize:12,fontWeight:600}}>🗑️ Deletar</button>}
          <button onClick={clearAll} style={{background:'none',border:'1px solid '+'var(--gdd-border)',color:'var(--gdd-muted)',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontSize:11}}>Limpar tudo</button>
          <div style={{width:1,height:20,background:'var(--gdd-border)',margin:'0 4px'}}/>
          <button onClick={()=>changeZoom(-0.1)} title="Zoom out (Ctrl+Scroll)" style={{background:'none',border:'1px solid '+'var(--gdd-border)',color:'var(--gdd-muted)',borderRadius:6,padding:'3px 9px',cursor:'pointer',fontSize:14,fontWeight:700,lineHeight:1}}>−</button>
          <button onClick={resetZoom} title="Resetar zoom" style={{background:'var(--gdd-bg3)',border:'1px solid '+'var(--gdd-border)',color:zoom!==1?CLR:'var(--gdd-dim)',borderRadius:6,padding:'3px 8px',cursor:'pointer',fontSize:11,fontWeight:700,minWidth:46,textAlign:'center'}}>{Math.round(zoom*100)}%</button>
          <button onClick={()=>changeZoom(0.1)} title="Zoom in (Ctrl+Scroll)" style={{background:'none',border:'1px solid '+'var(--gdd-border)',color:'var(--gdd-muted)',borderRadius:6,padding:'3px 9px',cursor:'pointer',fontSize:14,fontWeight:700,lineHeight:1}}>+</button>
        </div>
      </div>

      <div style={{flex:1,position:'relative',overflow:'hidden',cursor:tool==='pen'?'crosshair':'default'}}
        ref={boardRef} onMouseDown={onBoardDown} onMouseMove={onBoardMove} onMouseUp={onBoardUp} onMouseLeave={onBoardUp} onWheel={onWheel}>

        <div ref={innerBoardRef} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',transform:`scale(${zoom})`,transformOrigin:'0 0'}}>

        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,var(--gdd-border) 1px,transparent 1px)',backgroundSize:'28px 28px',opacity:.45,pointerEvents:'none'}}/>

        <canvas ref={cvRef} style={{position:'absolute',top:0,left:0,pointerEvents:tool==='pen'?'all':'none'}}
          onMouseDown={onCvDown} onMouseMove={onCvMove} onMouseUp={onCvUp} onMouseLeave={onCvUp}/>

        {elements.map(el=>{
          const isSel=el.id===selId,isEdit=el.id===editId;
          return(
            <div key={el.id} style={{position:'absolute',left:el.x,top:el.y,width:el.w,height:el.h,boxSizing:'border-box',
              cursor:tool==='select'?'move':'default',userSelect:isEdit?'text':'none',
              outline:isSel?'2px solid #7c3aed':'none',outlineOffset:3,
              borderRadius:el.type==='circle'?'50%':'6px',background:el.color,
              boxShadow:el.type==='sticky'?'2px 6px 14px rgba(0,0,0,.35)':el.type==='rect'?'1px 2px 8px rgba(0,0,0,.2)':'none',
              overflow:'hidden',display:'flex'}}
              onMouseDown={e=>onElDown(e,el.id)}
              onDoubleClick={e=>onElDbl(e,el.id)}>
              {(el.type==='sticky'||el.type==='text')&&(
                isEdit
                  ?<textarea autoFocus value={el.text} onChange={e=>updEl(el.id,{text:e.target.value})} onBlur={()=>setEditId(null)}
                      style={{flex:1,background:'transparent',border:'none',outline:'none',resize:'none',color:el.textColor,fontSize:el.fontSize,fontFamily:'inherit',padding:el.type==='sticky'?10:4,lineHeight:1.55,cursor:'text'}}/>
                  :<div style={{flex:1,color:el.textColor,fontSize:el.fontSize,padding:el.type==='sticky'?10:4,lineHeight:1.55,wordBreak:'break-word',whiteSpace:'pre-wrap',overflow:'hidden'}}>
                    {el.text||<span style={{opacity:.35,fontStyle:'italic'}}>Duplo clique para editar</span>}
                  </div>
              )}
              {el.type==='image'&&(el.src
                ?<img src={el.src} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',borderRadius:6}}/>
                :<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gdd-muted)',fontSize:11,border:'2px dashed var(--gdd-border)',borderRadius:6}}>🖼️</div>
              )}
            </div>
          );
        })}

        {elements.length===0&&strokes.length===0&&(
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',pointerEvents:'none',textAlign:'center'}}>
            <div style={{fontSize:52,marginBottom:16,opacity:.15}}>💡</div>
            <div style={{fontSize:15,fontWeight:600,marginBottom:8,color:'#334155'}}>Canvas vazio</div>
            <div style={{fontSize:12,color:'var(--gdd-border)',maxWidth:300,lineHeight:1.65}}>Use a toolbar para adicionar post-its, textos, formas ou desenhos livres. O assistente de benchmarking está no canto inferior direito.</div>
          </div>
        )}

        </div>{/* end zoom wrapper */}

        {/* Benchmarking Chat */}
        <div style={{position:'absolute',bottom:16,right:16,width:chatOpen?320:52,background:'var(--gdd-bg2)',border:'1px solid '+CLR+'44',borderRadius:14,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,.5)',transition:'width .25s',zIndex:50}}>
          <div style={{padding:'10px 12px',background:CLR+'15',borderBottom:chatOpen?'1px solid '+CLR+'25':'none',display:'flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none'}} onClick={()=>setChatOpen(v=>!v)}>
            <span style={{fontSize:15,flexShrink:0}}>🔍</span>
            {chatOpen&&<><div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:CLR}}>Benchmarking IA</div><div style={{fontSize:10,color:'var(--gdd-muted)',marginTop:1}}>Análise de jogos de referência</div></div><span style={{color:'var(--gdd-dim)',fontSize:12}}>▾</span></>}
          </div>
          {chatOpen&&<>
            <div style={{height:230,overflowY:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:8}}>
              {msgs.length===0&&(
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  <div style={{color:'var(--gdd-muted)',fontSize:11,lineHeight:1.6,marginBottom:3}}>Pesquise referências de jogos:</div>
                  {['Jogos com mecânicas de crafting e sobrevivência','Roguelikes com boa curva de aprendizado','Mobile idle com alta retenção de jogadores','Referências de narrativa não-linear'].map((s,i)=>(
                    <button key={i} onClick={e=>{e.stopPropagation();setChatIn(s);}} style={{background:'var(--gdd-bg3)',border:'1px solid '+CLR+'25',color:'var(--gdd-muted)',borderRadius:6,padding:'6px 9px',cursor:'pointer',fontSize:11,textAlign:'left',lineHeight:1.4}}>{s}</button>
                  ))}
                </div>
              )}
              {msgs.map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{background:m.role==='user'?'#1a0f3a':'#0d1414',border:'1px solid '+(m.role==='user'?'#4c1d95':CLR+'33'),borderRadius:10,padding:'8px 10px',maxWidth:'92%',fontSize:11,lineHeight:1.65,whiteSpace:'pre-wrap'}}>
                    {m.role==='assistant'&&<div style={{color:CLR,fontSize:9,fontWeight:700,marginBottom:4,textTransform:'uppercase',letterSpacing:.5}}>🔍 Benchmarking</div>}
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoad&&<div style={{display:'flex'}}><div style={{background:'#0d1414',border:'1px solid '+CLR+'33',borderRadius:10,padding:'8px 10px',fontSize:11,color:'var(--gdd-muted)'}}>Pesquisando referências…</div></div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{padding:'8px 10px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',gap:6,background:'var(--gdd-bg)'}}>
              <input value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} onClick={e=>e.stopPropagation()} placeholder="Ex: jogos com stealth e crafting..." style={{...S.inp,flex:1,fontSize:11,padding:'6px 10px'}}/>
              <button style={S.btn(chatLoad?'var(--gdd-border)':CLR,'#fff',{padding:'0 10px',alignSelf:'stretch',borderRadius:7,fontSize:14})} onClick={e=>{e.stopPropagation();sendChat();}} disabled={chatLoad}>↑</button>
            </div>
          </>}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
        const f=e.target.files?.[0];if(!f)return;
        const r=new FileReader();r.onload=()=>{const result=typeof r.result==='string'?r.result:'';if(!result)return;const pos=pendPos.current||{x:200,y:200};addEl('image',pos.x,pos.y,result);};
        r.readAsDataURL(f);e.target.value='';
      }}/>
    </div>
  );
}

function DoubleAGuide({project,pData,setPData,onBack,onDocCreated}){
  const [step,setStep]=useState(0);
  const [docTitle,setDocTitle]=useState('Novo Personagem');
  const [mecanica,setMecanica]=useState('');
  const [selAt,setSelAt]=useState([]);  // até 3 atributos
  const [selAq,setSelAq]=useState([]);  // até 3 arquétipos
  const [atGrupo,setAtGrupo]=useState(DA_GRUPOS_AT[0]);
  const [aqGrupo,setAqGrupo]=useState(DA_GRUPOS_AQ[0]);
  const [conceito,setConceito]=useState('');
  const [conceitoLoading,setConceitoLoading]=useState(false);
  const [raca,setRaca]=useState('');
  const [classe,setClasse]=useState('');
  const [cultura,setCultura]=useState('');
  const [idade,setIdade]=useState('');
  const [estiloVisual,setEstiloVisual]=useState('');
  const [equipamentos,setEquipamentos]=useState('');
  const [combate,setCombate]=useState('');
  const [nomePersonagem,setNomePersonagem]=useState('');
  const [aiInput,setAiInput]=useState('');
  const [aiMsgs,setAiMsgs]=useState([[],[],[],[],[],[]]);
  const [aiLoad,setAiLoad]=useState(false);
  const [charImgUpload,setCharImgUpload]=useState('');
  const charImgFileRef=useRef<HTMLInputElement | null>(null);

  const chatEndRef=useRef<HTMLDivElement | null>(null);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[aiMsgs,aiLoad]);

  const toggleAt=nome=>{
    if(selAt.includes(nome)){setSelAt(s=>s.filter(x=>x!==nome));}
    else if(selAt.length<3){setSelAt(s=>[...s,nome]);}
  };
  const toggleAq=nome=>{
    if(selAq.includes(nome)){setSelAq(s=>s.filter(x=>x!==nome));}
    else if(selAq.length<3){setSelAq(s=>[...s,nome]);}
  };

  const getAtObjetos=()=>selAt.map(n=>DA_ATRIBUTOS.find(a=>a.nome===n)).filter(Boolean);
  const getAqObjetos=()=>selAq.map(n=>DA_ARQUETIPOS.find(a=>a.nome===n)).filter(Boolean);

  const buildCtx=()=>{
    const atStr=getAtObjetos().map(a=>a.nome+' ('+a.desc+')').join('; ');
    const aqStr=getAqObjetos().map(a=>a.nome+' ('+a.desc+')').join('; ');
    return `Você é um especialista em Character Design colaborando pelo Double A Framework (criado por Victor Hugo Costa).
Projeto: "${project.name}" | Gênero: ${project.genre} | Plataforma: ${project.platform}
Personagem sendo criado: "${docTitle}"
Mecânica principal: ${mecanica||'—'}
Atributos selecionados: ${atStr||'—'}
Arquétipos selecionados: ${aqStr||'—'}
${conceito?'Configuração conceitual: '+conceito:''}
Responda em português brasileiro de forma concisa e criativa.`;
  };

  const generateConceito=async()=>{
    setConceitoLoading(true);
    const atStr=getAtObjetos().map(a=>a.nome).join(', ');
    const aqStr=getAqObjetos().map(a=>a.nome).join(', ');
    const prompt=`Com base no Double A Framework, gere uma configuração conceitual única para este personagem.

Mecânica: ${mecanica}
Atributos: ${atStr}
Arquétipos: ${aqStr}
Projeto: ${project.name} (${project.genre})

Escreva 2 a 3 frases que capturem a essência do personagem — sua forma de agir, sua identidade narrativa e o que o torna único. Seja específico, evocativo e coeso. Sem títulos, apenas o texto descritivo.`;
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,messages:[{role:'user',content:prompt}]})});
      const d=await r.json();
      setConceito(d.content?.[0]?.text||'');
    }catch(e){console.error(e);}finally{setConceitoLoading(false);}
  };


  const handleCharImgUpload=(e)=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=()=>{if(typeof r.result==='string')setCharImgUpload(r.result);};
    r.readAsDataURL(f);
    e.target.value='';
  };

  const sendAi=async(msg)=>{
    const txt=msg||aiInput;if(!txt.trim()||aiLoad)return;
    const um={role:'user',content:txt};
    const curr=[...aiMsgs[step],um];
    setAiMsgs(m=>{const n=[...m];n[step]=curr;return n;});
    setAiInput('');setAiLoad(true);
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,system:buildCtx(),messages:curr})});
      const d=await r.json(),reply=d.content?.[0]?.text||'Erro.';
      setAiMsgs(m=>{const n=[...m];n[step]=[...curr,{role:'assistant',content:reply}];return n;});
    }catch(e){console.error(e);}finally{setAiLoad(false);}
  };

  const AI_HINTS=[
    ['Qual mecânica combina com '+project.genre+'?','Sugira uma mecânica para um personagem furtivo','Como definir a mecânica de um personagem de suporte?'],
    ['Quais atributos combinam com a mecânica "'+mecanica+'"?','Sugira combinações criativas de atributos para este personagem','Como equilibrar atributos opostos em um mesmo personagem?'],
    ['Quais arquétipos combinam com os atributos escolhidos?','Sugira arquétipos subversivos para este conceito','Como a combinação de arquétipos cria tensão narrativa?'],
    ['Expanda a configuração conceitual deste personagem','Como conectar o conceito à narrativa de '+project.name+'?','Que conflitos internos este personagem pode ter?'],
    ['Sugira nomes para este personagem com base nos arquétipos','Quais equipamentos fazem sentido para este personagem?','Como seria o estilo visual deste personagem?'],
    [],
  ];

  const compileHtml=()=>{
    const atObjs=getAtObjetos(),aqObjs=getAqObjetos();
    const atHtml=atObjs.map(a=>`<li><strong>${a.nome}</strong> — ${a.desc} <em>(Ref: ${a.ex})</em></li>`).join('');
    const aqHtml=aqObjs.map(a=>`<li><strong>${a.nome}</strong> — ${a.desc} <em>(Ref: ${a.personagem})</em></li>`).join('');
    return `<h2>🎭 Double A Framework — ${docTitle}</h2>
<p><em>Documento estruturado com o Double A Framework (Character Design Framework) — criado por Victor Hugo Costa.</em></p>
<hr>
<h2>⚔️ Mecânica</h2><p>${mecanica||'—'}</p>
<hr>
<h2>✦ Atributos</h2><ul>${atHtml||'<li>—</li>'}</ul>
<hr>
<h2>🎭 Arquétipos</h2><ul>${aqHtml||'<li>—</li>'}</ul>
<hr>
<h2>💡 Configuração Conceitual</h2><p>${conceito||'—'}</p>
<hr>
<h2>📋 Características</h2>
<ul>
${nomePersonagem?`<li><strong>Nome:</strong> ${nomePersonagem}</li>`:''}
${raca?`<li><strong>Raça / Espécie:</strong> ${raca}</li>`:''}
${classe?`<li><strong>Classe / Função:</strong> ${classe}</li>`:''}
${cultura?`<li><strong>Cultura e Origem:</strong> ${cultura}</li>`:''}
${idade?`<li><strong>Idade:</strong> ${idade}</li>`:''}
${estiloVisual?`<li><strong>Estilo Visual:</strong> ${estiloVisual}</li>`:''}
${equipamentos?`<li><strong>Equipamentos:</strong> ${equipamentos}</li>`:''}
${combate?`<li><strong>Estilo de Combate:</strong> ${combate}</li>`:''}
</ul>
${charImgUpload?`<hr><h2>🖼️ Imagem do Personagem</h2><figure style="margin:12px 0;text-align:center"><img src="${charImgUpload}" alt="${docTitle}" style="max-width:100%;border-radius:10px;display:block;margin:0 auto"><figcaption style="font-size:12px;color:#6b7280;margin-top:6px;font-style:italic">${docTitle}${raca?' · '+raca:''}</figcaption></figure>`:''}`;

  };

  const saveDoc=()=>{
    const pId=project.id,mId='characters',curr=pData?.[pId]?.[mId]||{docs:[]};
    const doc={id:uid(),title:docTitle,content:compileHtml(),messages:[],status:'progress',createdAt:todayStr(),updatedAt:null,framework:'double-a'};
    setPData(p=>({...p,[pId]:{...(p[pId]||{}),[mId]:{...curr,docs:[...(curr.docs||[]),doc]}}}));
    onDocCreated(doc);
  };

  const canNext=[
    mecanica.trim().length>5,
    selAt.length>0,
    selAq.length>0,
    conceito.trim().length>10,
    true,
  ];

  const currMsgs=step<6?aiMsgs[step]:[];
  const stepGuide=step<5?DA_GUIDES[step]:null;
  const atFiltrados=DA_ATRIBUTOS.filter(a=>a.grupo===atGrupo);
  const aqFiltrados=DA_ARQUETIPOS.filter(a=>a.grupo===aqGrupo);

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--gdd-bg)',color:'var(--gdd-text)',fontFamily:'system-ui,sans-serif',fontSize:14}}>
      {/* Header */}
      <div style={{height:54,borderBottom:'1px solid var(--gdd-border2)',display:'flex',alignItems:'center',padding:'0 16px',gap:10,flexShrink:0,background:'var(--gdd-bg)'}}>
        <button style={S.back} onClick={onBack}>← Personagens</button>
        <span style={{color:DA_CLR,fontWeight:700,fontSize:15}}>🃏 Double A Framework</span>
        <span style={{color:'var(--gdd-border)'}}>·</span>
        <input value={docTitle} onChange={e=>setDocTitle(e.target.value)} style={{background:'transparent',border:'none',color:'var(--gdd-text)',fontSize:14,fontWeight:600,outline:'none',padding:'2px 8px',borderRadius:5,flex:1,minWidth:0}} onFocus={e=>e.target.style.background='var(--gdd-bg3)'} onBlur={e=>e.target.style.background='transparent'}/>
        <span style={{fontSize:11,color:'#334155',whiteSpace:'nowrap'}}>{project.emoji} {project.name}</span>
      </div>

      {/* Stepper */}
      <div style={{borderBottom:'1px solid var(--gdd-border2)',display:'flex',alignItems:'stretch',background:'var(--gdd-bg0)',flexShrink:0,height:42,overflowX:'auto'}}>
        {DA_STEPS.map((s,i)=>(
          <button key={s.id} onClick={()=>i<=step&&setStep(i)}
            style={{display:'flex',alignItems:'center',gap:5,padding:'0 14px',background:'none',border:'none',borderBottom:step===i?'2px solid '+DA_CLR:'2px solid transparent',cursor:i<=step?'pointer':'default',color:step===i?DA_CLR:i<step?'var(--gdd-muted)':'#334155',fontWeight:step===i?700:400,fontSize:11,whiteSpace:'nowrap',position:'relative',flexShrink:0}}>
            <span style={{fontSize:12}}>{s.icon}</span>
            <span>{s.label}</span>
            {i<step&&<span style={{fontSize:9,color:'#34d399',fontWeight:900,marginLeft:2}}>✓</span>}
            {i<5&&<span style={{position:'absolute',right:-1,color:'var(--gdd-border2)',fontSize:16,pointerEvents:'none'}}>›</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        {step<5&&(
          <div style={{display:'flex',alignItems:'center',padding:'0 14px',gap:8,flexShrink:0}}>
            {step>0&&<button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 12px',fontSize:12})} onClick={()=>setStep(s=>s-1)}>← Anterior</button>}
            {step===3&&!conceito&&<button style={S.btn(DA_CLR,'#fff',{padding:'5px 14px',fontSize:12})} onClick={generateConceito} disabled={conceitoLoading}>{conceitoLoading?'Gerando…':'✦ Gerar conceito'}</button>}
            <button style={S.btn(canNext[step]?DA_CLR:'var(--gdd-border)','#fff',{padding:'5px 14px',fontSize:12,opacity:canNext[step]?1:.45})} disabled={!canNext[step]} onClick={()=>{if(step===3&&!conceito){generateConceito();}else{setStep(s=>s+1);}}}>Próximo →</button>
          </div>
        )}
        {step===5&&(
          <div style={{display:'flex',alignItems:'center',padding:'0 14px',gap:8,flexShrink:0}}>
            <button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 12px',fontSize:12})} onClick={()=>setStep(4)}>← Anterior</button>
            <button style={S.btn(DA_CLR,'#fff',{padding:'5px 18px',fontSize:13,fontWeight:800})} onClick={saveDoc}>💾 Salvar personagem</button>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left — Guide + AI */}
        <div style={{flex:'0 0 36%',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--gdd-bg0)',borderRight:'1px solid var(--gdd-border2)'}}>
          {step<5&&stepGuide&&(
            <>
              <div style={{padding:'14px 16px',borderBottom:'1px solid var(--gdd-border2)',flexShrink:0}}>
                <div style={{fontSize:10,fontWeight:700,color:DA_CLR,letterSpacing:1.5,marginBottom:6,textTransform:'uppercase'}}>🃏 Double A — {DA_STEPS[step].label}</div>
                <div style={{fontWeight:700,fontSize:13,color:'var(--gdd-text)',marginBottom:8}}>{stepGuide.title}</div>
                <div style={{color:'var(--gdd-dim)',fontSize:12,lineHeight:1.75,whiteSpace:'pre-wrap'}}>{stepGuide.body}</div>
              </div>
              <div style={{padding:'8px 16px',borderBottom:'1px solid var(--gdd-border2)',background:'var(--gdd-bg)',flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
                <span style={{color:DA_CLR,fontSize:11}}>✦</span>
                <span style={{fontWeight:700,fontSize:12,color:'var(--gdd-muted)'}}>IA de Character Design</span>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:10}}>
                {currMsgs.length===0&&AI_HINTS[step]?.length>0&&(
                  <div style={{display:'flex',flexDirection:'column',gap:5,paddingTop:4}}>
                    <div style={{color:'#334155',fontSize:11,marginBottom:4}}>Sugestões para esta etapa:</div>
                    {AI_HINTS[step].map((h,i)=>(
                      <button key={i} onClick={()=>sendAi(h)} style={{background:'var(--gdd-bg2)',border:'1px solid '+DA_CLR+'22',color:'var(--gdd-dim)',borderRadius:7,padding:'7px 10px',cursor:'pointer',fontSize:11,textAlign:'left',lineHeight:1.5}}>{h}</button>
                    ))}
                  </div>
                )}
                {currMsgs.map((m,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                    <div style={{background:m.role==='user'?'#1a0f3a':'#120d1a',border:'1px solid '+(m.role==='user'?'#4c1d9555':DA_CLR+'25'),borderRadius:10,padding:'8px 11px',maxWidth:'94%',fontSize:11,lineHeight:1.65,whiteSpace:'pre-wrap'}}>
                      {m.role==='assistant'&&<div style={{color:DA_CLR,fontSize:9,fontWeight:700,marginBottom:4,textTransform:'uppercase',letterSpacing:.5}}>🃏 Double A</div>}
                      {m.content}
                    </div>
                  </div>
                ))}
                {aiLoad&&<div style={{background:'#120d1a',border:'1px solid '+DA_CLR+'25',borderRadius:10,padding:'8px 11px',fontSize:11,color:'#334155',alignSelf:'flex-start'}}>Pensando…</div>}
                <div ref={chatEndRef}/>
              </div>
              <div style={{padding:'8px 10px',borderTop:'1px solid var(--gdd-border2)',display:'flex',gap:6,background:'var(--gdd-bg)',flexShrink:0}}>
                <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAi()} placeholder={'Pergunte sobre '+DA_STEPS[step].label.toLowerCase()+'...'} style={{...S.inp,flex:1,fontSize:11,padding:'6px 10px'}}/>
                <button style={S.btn(aiLoad?'var(--gdd-border)':DA_CLR,'#fff',{padding:'0 11px',alignSelf:'stretch',borderRadius:7,fontSize:13})} onClick={()=>sendAi()} disabled={aiLoad}>↑</button>
              </div>
            </>
          )}
          {step===5&&(
            <div style={{flex:1,overflowY:'auto',padding:'22px 20px'}}>
              <div style={{fontSize:10,fontWeight:700,color:DA_CLR,letterSpacing:1.5,marginBottom:14,textTransform:'uppercase'}}>📄 Resumo do personagem</div>
              {[
                {label:'Mecânica',value:mecanica||'—'},
                {label:'Atributos',value:selAt.join(', ')||'—'},
                {label:'Arquétipos',value:selAq.join(', ')||'—'},
                {label:'Configuração Conceitual',value:conceito||'—'},
                {label:'Nome',value:nomePersonagem||'—'},
                {label:'Raça / Espécie',value:raca||'—'},
                {label:'Classe / Função',value:classe||'—'},
                {label:'Cultura e Origem',value:cultura||'—'},
                {label:'Idade',value:idade||'—'},
                {label:'Estilo Visual',value:estiloVisual||'—'},
                {label:'Equipamentos',value:equipamentos||'—'},
                {label:'Estilo de Combate',value:combate||'—'},
              ].map(({label,value})=>(
                <div key={label} style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:DA_CLR,fontWeight:700,letterSpacing:.5,marginBottom:3,textTransform:'uppercase'}}>{label}</div>
                  <div style={{fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65,background:'var(--gdd-bg2)',borderRadius:6,padding:'7px 10px',border:'1px solid var(--gdd-border2)',whiteSpace:'pre-wrap'}}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Form */}
        <div style={{flex:1,overflowY:'auto',padding:'24px 28px',display:'flex',flexDirection:'column',gap:22}}>

          {/* STEP 0 — Mecânica */}
          {step===0&&(
            <>
              <div>
                <div style={{fontSize:11,color:DA_CLR,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>Papel no gameplay <span style={{color:'#ef4444'}}>*</span></div>
                <div style={{color:'var(--gdd-muted)',fontSize:12,marginBottom:10,lineHeight:1.6}}>Descreva a mecânica principal e o papel do personagem no jogo. Ex: <em>"Assassino furtivo especializado em eliminar alvos à distância"</em>, <em>"Suporte que cria barreiras e cura aliados"</em>.</div>
                <TA value={mecanica} onChange={setMecanica} placeholder={'Descreva a mecânica e o papel do personagem em '+project.name+'...'} rows={5}/>
                {mecanica.length<6&&mecanica.length>0&&<div style={{fontSize:11,color:'#ef4444',marginTop:5}}>Descreva com mais detalhes para continuar.</div>}
              </div>
              <div style={{background:'#a855f708',border:'1px solid #a855f720',borderRadius:10,padding:'14px 16px'}}>
                <div style={{fontSize:11,color:DA_CLR,fontWeight:700,marginBottom:6}}>💡 Exemplos de mecânica</div>
                {['Personagem de alto dano — ataca rapidamente e elimina alvos prioritários','Personagem de controle de área — restringe o movimento e opções do adversário','Personagem furtivo — usa invisibilidade e emboscadas','Personagem de suporte — cura, protege e potencializa aliados','Personagem tank — absorve dano e abre caminho para a equipe'].map((ex,i)=>(
                  <div key={i} onClick={()=>setMecanica(ex)} style={{fontSize:12,color:'var(--gdd-dim)',padding:'5px 0',cursor:'pointer',borderBottom:'1px solid var(--gdd-border2)',lineHeight:1.5}}
                    onMouseEnter={e=>e.currentTarget.style.color=DA_CLR} onMouseLeave={e=>e.currentTarget.style.color='var(--gdd-dim)'}>{ex}</div>
                ))}
              </div>
            </>
          )}

          {/* STEP 1 — Atributos */}
          {step===1&&(
            <>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                <div>
                  <div style={{fontSize:11,color:DA_CLR,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>Escolha até 3 atributos <span style={{color:'#ef4444'}}>*</span></div>
                  <div style={{fontSize:11,color:'var(--gdd-muted)',marginTop:2}}>Selecionados: <strong style={{color:selAt.length===3?DA_CLR:'var(--gdd-text)'}}>{selAt.length}/3</strong></div>
                </div>
                {selAt.length>0&&(
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    {selAt.map(n=>(
                      <span key={n} onClick={()=>toggleAt(n)} style={{background:DA_CLR+'22',border:'1px solid '+DA_CLR+'55',color:DA_CLR,borderRadius:8,padding:'3px 10px',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                        {n} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Grupo tabs */}
              <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                {DA_GRUPOS_AT.map(g=>(
                  <button key={g} onClick={()=>setAtGrupo(g)} style={{background:atGrupo===g?DA_CLR+'18':'var(--gdd-bg2)',border:'1px solid '+(atGrupo===g?DA_CLR+'55':'var(--gdd-border2)'),color:atGrupo===g?DA_CLR:'var(--gdd-muted)',borderRadius:8,padding:'5px 11px',cursor:'pointer',fontSize:11,fontWeight:atGrupo===g?700:400,transition:'all .15s'}}>
                    {g.split(' & ')[0]}
                  </button>
                ))}
              </div>
              <div style={{fontSize:10,color:'#334155',fontStyle:'italic'}}>{atGrupo}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:8}}>
                {atFiltrados.map(a=>{
                  const sel=selAt.includes(a.nome);
                  const disabled=!sel&&selAt.length===3;
                  return(
                    <div key={a.nome} onClick={()=>!disabled&&toggleAt(a.nome)}
                      style={{background:sel?DA_CLR+'18':'var(--gdd-bg2)',border:'1px solid '+(sel?DA_CLR:disabled?'var(--gdd-border2)':'var(--gdd-border2)'),borderRadius:10,padding:'10px 12px',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.4:1,transition:'all .15s'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontWeight:700,fontSize:12,color:sel?DA_CLR:'var(--gdd-muted)'}}>{a.nome}</span>
                        {sel&&<span style={{color:DA_CLR,fontSize:12,fontWeight:900}}>✓</span>}
                      </div>
                      <div style={{fontSize:11,color:'var(--gdd-dim)',lineHeight:1.45,marginBottom:4}}>{a.desc}</div>
                      <div style={{fontSize:10,color:'#334155',fontStyle:'italic'}}>Ref: {a.ex}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* STEP 2 — Arquétipos */}
          {step===2&&(
            <>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                <div>
                  <div style={{fontSize:11,color:DA_CLR,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>Escolha até 3 arquétipos <span style={{color:'#ef4444'}}>*</span></div>
                  <div style={{fontSize:11,color:'var(--gdd-muted)',marginTop:2}}>Selecionados: <strong style={{color:selAq.length===3?DA_CLR:'var(--gdd-text)'}}>{selAq.length}/3</strong></div>
                </div>
                {selAq.length>0&&(
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    {selAq.map(n=>(
                      <span key={n} onClick={()=>toggleAq(n)} style={{background:DA_CLR+'22',border:'1px solid '+DA_CLR+'55',color:DA_CLR,borderRadius:8,padding:'3px 10px',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                        {n} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                {DA_GRUPOS_AQ.map(g=>(
                  <button key={g} onClick={()=>setAqGrupo(g)} style={{background:aqGrupo===g?DA_CLR+'18':'var(--gdd-bg2)',border:'1px solid '+(aqGrupo===g?DA_CLR+'55':'var(--gdd-border2)'),color:aqGrupo===g?DA_CLR:'var(--gdd-muted)',borderRadius:8,padding:'5px 11px',cursor:'pointer',fontSize:11,fontWeight:aqGrupo===g?700:400,transition:'all .15s'}}>
                    {g.split(' & ')[0]}
                  </button>
                ))}
              </div>
              <div style={{fontSize:10,color:'#334155',fontStyle:'italic'}}>{aqGrupo}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:8}}>
                {aqFiltrados.map(a=>{
                  const sel=selAq.includes(a.nome);
                  const disabled=!sel&&selAq.length===3;
                  return(
                    <div key={a.nome} onClick={()=>!disabled&&toggleAq(a.nome)}
                      style={{background:sel?DA_CLR+'18':'var(--gdd-bg2)',border:'1px solid '+(sel?DA_CLR:'var(--gdd-border2)'),borderRadius:10,padding:'10px 12px',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.4:1,transition:'all .15s'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontWeight:700,fontSize:12,color:sel?DA_CLR:'var(--gdd-muted)'}}>{a.nome}</span>
                        {sel&&<span style={{color:DA_CLR,fontSize:12,fontWeight:900}}>✓</span>}
                      </div>
                      <div style={{fontSize:11,color:'var(--gdd-dim)',lineHeight:1.45,marginBottom:4}}>{a.desc}</div>
                      <div style={{fontSize:10,color:'#334155',fontStyle:'italic'}}>Ref: {a.personagem}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* STEP 3 — Conceito */}
          {step===3&&(
            <>
              {/* ── Resumo de tudo que foi preenchido ── */}
              <div style={{background:'var(--gdd-bg2)',border:'1px solid '+DA_CLR+'22',borderRadius:12,padding:'16px 18px',display:'flex',flexDirection:'column',gap:14}}>
                <div style={{fontSize:10,color:DA_CLR,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',marginBottom:2}}>📋 Sua base — o que você já definiu</div>

                {/* Mecânica */}
                <div>
                  <div style={{fontSize:10,color:DA_CLR,fontWeight:700,letterSpacing:.8,textTransform:'uppercase',marginBottom:4}}>⚔️ Mecânica</div>
                  <div style={{fontSize:12,color:'var(--gdd-muted)',lineHeight:1.6,background:'var(--gdd-bg)',borderRadius:7,padding:'8px 11px',border:'1px solid var(--gdd-border2)'}}>{mecanica||'—'}</div>
                </div>

                {/* Atributos */}
                <div>
                  <div style={{fontSize:10,color:DA_CLR,fontWeight:700,letterSpacing:.8,textTransform:'uppercase',marginBottom:6}}>✦ Atributos selecionados</div>
                  {selAt.length===0
                    ?<div style={{fontSize:12,color:'#334155',fontStyle:'italic'}}>Nenhum atributo selecionado</div>
                    :<div style={{display:'flex',flexDirection:'column',gap:5}}>
                      {getAtObjetos().map(a=>(
                        <div key={a.nome} style={{background:'var(--gdd-bg)',borderRadius:7,padding:'8px 11px',border:'1px solid '+DA_CLR+'22'}}>
                          <div style={{fontWeight:700,fontSize:12,color:DA_CLR,marginBottom:2}}>{a.nome}</div>
                          <div style={{fontSize:11,color:'var(--gdd-dim)',lineHeight:1.5}}>{a.desc}</div>
                          <div style={{fontSize:10,color:'#334155',marginTop:2,fontStyle:'italic'}}>Ref: {a.ex}</div>
                        </div>
                      ))}
                    </div>
                  }
                </div>

                {/* Arquétipos */}
                <div>
                  <div style={{fontSize:10,color:DA_CLR,fontWeight:700,letterSpacing:.8,textTransform:'uppercase',marginBottom:6}}>🎭 Arquétipos selecionados</div>
                  {selAq.length===0
                    ?<div style={{fontSize:12,color:'#334155',fontStyle:'italic'}}>Nenhum arquétipo selecionado</div>
                    :<div style={{display:'flex',flexDirection:'column',gap:5}}>
                      {getAqObjetos().map(a=>(
                        <div key={a.nome} style={{background:'var(--gdd-bg)',borderRadius:7,padding:'8px 11px',border:'1px solid '+DA_CLR+'22'}}>
                          <div style={{fontWeight:700,fontSize:12,color:DA_CLR,marginBottom:2}}>{a.nome}</div>
                          <div style={{fontSize:11,color:'var(--gdd-dim)',lineHeight:1.5}}>{a.desc}</div>
                          <div style={{fontSize:10,color:'#334155',marginTop:2,fontStyle:'italic'}}>Ref: {a.personagem}</div>
                        </div>
                      ))}
                    </div>
                  }
                </div>
              </div>

              {/* ── Configuração conceitual ── */}
              <div>
                <div style={{fontSize:11,color:DA_CLR,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>
                  Configuração conceitual <span style={{color:'#ef4444'}}>*</span>
                </div>
                <div style={{color:'var(--gdd-muted)',fontSize:12,marginBottom:12,lineHeight:1.65}}>
                  Escreva a essência do personagem com suas próprias palavras — ou use a IA para gerar uma proposta com base no que você definiu. Use o resumo acima como referência.
                </div>

                {/* Textarea sempre visível */}
                <TA value={conceito} onChange={setConceito}
                  placeholder={'Com base na mecânica, atributos e arquétipos acima, descreva a essência de '+docTitle+': sua forma de agir, identidade narrativa e o que o torna único…'}
                  rows={5}/>

                {/* Botão IA — abaixo da textarea */}
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
                  <div style={{flex:1,height:1,background:'var(--gdd-border2)'}}/>
                  <span style={{fontSize:10,color:'#334155',whiteSpace:'nowrap'}}>ou gerar com IA</span>
                  <div style={{flex:1,height:1,background:'var(--gdd-border2)'}}/>
                </div>
                <button onClick={generateConceito} disabled={conceitoLoading}
                  style={{marginTop:10,width:'100%',background:conceitoLoading?'var(--gdd-border2)':DA_CLR+'18',border:'1px solid '+(conceitoLoading?'var(--gdd-border)':DA_CLR+'55'),color:conceitoLoading?'var(--gdd-muted)':DA_CLR,borderRadius:9,padding:'10px 0',cursor:conceitoLoading?'not-allowed':'pointer',fontWeight:700,fontSize:13,transition:'all .15s'}}>
                  {conceitoLoading?'✦ Gerando…':'✦ Gerar configuração conceitual com IA'}
                </button>
                {conceito&&!conceitoLoading&&(
                  <button onClick={generateConceito} disabled={conceitoLoading}
                    style={{marginTop:6,background:'none',border:'none',color:'var(--gdd-border)',cursor:'pointer',fontSize:11,padding:'2px 0',display:'flex',alignItems:'center',gap:4}}
                    onMouseEnter={e=>e.currentTarget.style.color='var(--gdd-muted)'}
                    onMouseLeave={e=>e.currentTarget.style.color='var(--gdd-border)'}>
                    ↺ Gerar nova sugestão (substitui o texto atual)
                  </button>
                )}
              </div>
            </>
          )}

          {/* STEP 4 — Características */}
          {step===4&&(
            <>
              {conceito&&(
                <div style={{background:'#a855f708',border:'1px solid #a855f720',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65,fontStyle:'italic'}}>
                  <strong style={{color:DA_CLR,fontStyle:'normal'}}>Conceito: </strong>"{conceito}"
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                {[
                  {label:'Nome do personagem',val:nomePersonagem,set:setNomePersonagem,ph:'Ex: Kira Ashveil, Theron, 影'},
                  {label:'Raça / Espécie',val:raca,set:setRaca,ph:'Ex: Humano, Élfico, Androide'},
                  {label:'Classe / Função',val:classe,set:setClasse,ph:'Ex: Assassino, Mago de Batalha'},
                  {label:'Cultura e Origem',val:cultura,set:setCultura,ph:'Ex: Nômade das Terras Áridas'},
                  {label:'Idade aproximada',val:idade,set:setIdade,ph:'Ex: 27 anos, jovem adulto'},
                  {label:'Estilo de combate',val:combate,set:setCombate,ph:'Ex: Lâminas duplas e veneno'},
                ].map(({label,val,set,ph})=>(
                  <div key={label}>
                    <div style={{fontSize:10,color:DA_CLR,fontWeight:700,letterSpacing:.5,marginBottom:5,textTransform:'uppercase'}}>{label}</div>
                    <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={{...S.inp,width:'100%',boxSizing:'border-box',fontSize:12}}/>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:10,color:DA_CLR,fontWeight:700,letterSpacing:.5,marginBottom:5,textTransform:'uppercase'}}>Estilo visual e estética</div>
                <TA value={estiloVisual} onChange={setEstiloVisual} placeholder="Descreva a identidade visual — cores, silhueta, vestimenta, mood..." rows={3}/>

                {/* ── Upload de imagem do personagem ── */}
                <div style={{marginTop:12,background:'var(--gdd-bg2)',border:'1px solid '+DA_CLR+'22',borderRadius:10,padding:'12px 14px'}}>
                  <div style={{fontSize:10,color:DA_CLR,fontWeight:700,letterSpacing:.8,textTransform:'uppercase',marginBottom:8}}>🖼️ Imagem do personagem <span style={{color:'var(--gdd-border)',fontWeight:400,textTransform:'none',letterSpacing:0}}>(opcional)</span></div>

                  {/* Preview */}
                  {charImgUpload&&(
                    <div style={{marginBottom:10,position:'relative',display:'inline-block'}}>
                      <img src={charImgUpload} alt={docTitle}
                        style={{width:180,height:180,objectFit:'cover',borderRadius:8,display:'block',border:'2px solid '+DA_CLR+'44'}}/>
                      <button onClick={()=>setCharImgUpload('')} title="Remover imagem"
                        style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,.65)',border:'none',color:'#fff',borderRadius:'50%',width:20,height:20,cursor:'pointer',fontSize:11,lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                    </div>
                  )}

                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <button onClick={()=>charImgFileRef.current?.click()}
                      style={{background:'var(--gdd-bg3)',border:'1px solid var(--gdd-border)',color:'var(--gdd-muted)',borderRadius:7,padding:'6px 13px',cursor:'pointer',fontWeight:600,fontSize:12,display:'flex',alignItems:'center',gap:6,transition:'border-color .15s'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=DA_CLR+'66'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--gdd-border)'}>
                      <span>📁</span>{charImgUpload?'Trocar imagem':'Upload do computador'}
                    </button>
                    <input ref={charImgFileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleCharImgUpload}/>
                    <span style={{fontSize:10,color:'#334155'}}>Incluída no documento gerado</span>
                  </div>
                </div>
              </div>

              <div>
                <div style={{fontSize:10,color:DA_CLR,fontWeight:700,letterSpacing:.5,marginBottom:5,textTransform:'uppercase'}}>Equipamentos e artefatos</div>
                <TA value={equipamentos} onChange={setEquipamentos} placeholder="Liste armas, armaduras, itens especiais ou artefatos do personagem..." rows={3}/>
              </div>
            </>
          )}


          {/* STEP 5 — Compilar */}
          {step===5&&(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flex:1,textAlign:'center',gap:18,padding:'40px 0'}}>
              <div style={{fontSize:56}}>🎭</div>
              <div style={{fontWeight:800,fontSize:20,color:DA_CLR}}>{docTitle}</div>
              <div style={{color:'var(--gdd-muted)',fontSize:13,maxWidth:420,lineHeight:1.7}}>
                O personagem está estruturado e pronto para ser salvo.<br/>
                Revise o resumo ao lado e clique em <strong>Salvar personagem</strong> para adicioná-lo ao módulo de Personagens.
              </div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
                {[...selAt,...selAq].map(n=>(
                  <span key={n} style={{background:DA_CLR+'15',border:'1px solid '+DA_CLR+'40',color:DA_CLR,borderRadius:8,padding:'4px 12px',fontSize:12,fontWeight:600}}>{n}</span>
                ))}
              </div>
              {conceito&&<div style={{background:'var(--gdd-bg2)',border:'1px solid '+DA_CLR+'30',borderRadius:12,padding:'16px 20px',fontSize:13,color:'var(--gdd-text)',lineHeight:1.8,maxWidth:500,fontStyle:'italic'}}>"{conceito}"</div>}
              <button style={S.btn(DA_CLR,'#fff',{padding:'14px 36px',fontSize:15,fontWeight:800,borderRadius:12})} onClick={saveDoc}>💾 Salvar personagem</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── MDAGuide ──────────────────────────────────────────────────────────────────
function MDAGuide({project,pData,setPData,onBack,onDocCreated}){
  const AI_HINTS=[
    ['Quais estéticas jogos do mesmo gênero costumam usar?','Como combinar Challenge com Fellowship de forma eficaz?','Que emoção um jogo de '+project.genre+' deve priorizar?'],
    ['Como criar tensão dramática nas dinâmicas deste jogo?','Que sistemas de feedback funcionam bem para '+project.genre+'?','Como as dinâmicas devem suportar a estética escolhida?'],
    ['Quais mecânicas implementam bem a dinâmica de exploração?','Como fazer tuning de dificuldade sem frustrar o jogador?','Sugira mecânicas para o gênero '+project.genre+' na plataforma '+project.platform],
  ];

  const [step,setStep]=useState(0);
  const [docTitle,setDocTitle]=useState('Nova Mecânica MDA');
  const [selAes,setSelAes]=useState([]);
  const [aesDesc,setAesDesc]=useState('');
  const [aesModel,setAesModel]=useState('');
  const [dynDesc,setDynDesc]=useState('');
  const [dynFeed,setDynFeed]=useState('');
  const [mecRules,setMecRules]=useState('');
  const [mecTuning,setMecTuning]=useState('');
  const [aiInput,setAiInput]=useState('');
  const [aiMsgs,setAiMsgs]=useState([[],[],[]]);
  const [aiLoad,setAiLoad]=useState(false);
  const chatEndRef=useRef<HTMLDivElement | null>(null);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[aiMsgs,aiLoad]);

  const toggleAes=id=>setSelAes(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);

  const getCtx=()=>{
    const aesLabels=selAes.map(id=>MDA_AESTHETICS.find(a=>a.id===id)?.label).filter(Boolean).join(', ');
    const steps=['ESTÉTICA','DINÂMICA','MECÂNICA'];
    return `Você é um especialista em Game Design guiando o usuário pelo framework MDA (Mechanics, Dynamics, Aesthetics) de Hunicke, LeBlanc e Zubek.
Projeto: "${project.name}" | Gênero: ${project.genre} | Plataforma: ${project.platform}
Documento sendo criado: "${docTitle}"
Etapa atual: ${steps[step]||''}
Estéticas selecionadas: ${aesLabels||'Nenhuma ainda'}
${step>=1?`Descrição de estética: ${aesDesc}\nModelo estético: ${aesModel}`:''}
${step>=2?`Dinâmicas: ${dynDesc}\nSistemas de feedback: ${dynFeed}`:''}
Guie o usuário de forma concisa e prática, sempre referenciando o framework MDA. Responda em português brasileiro.`;
  };

  const sendAi=async(msg)=>{
    const txt=msg||aiInput;if(!txt.trim()||aiLoad)return;
    const um={role:'user',content:txt};
    const curr=[...aiMsgs[step],um];
    setAiMsgs(m=>{const n=[...m];n[step]=curr;return n;});
    setAiInput('');setAiLoad(true);
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,system:getCtx(),messages:curr})});
      const d=await r.json(),reply=d.content?.[0]?.text||'Erro.';
      setAiMsgs(m=>{const n=[...m];n[step]=[...curr,{role:'assistant',content:reply}];return n;});
    }catch(e){console.error(e);}finally{setAiLoad(false);}
  };

  const compileHtml=()=>{
    const aesLabels=selAes.map(id=>MDA_AESTHETICS.find(a=>a.id===id)?.label).filter(Boolean);
    const aesIcons=selAes.map(id=>MDA_AESTHETICS.find(a=>a.id===id)).filter(Boolean).map(a=>a.icon+' '+a.label).join(' · ');
    return `<h2>📐 MDA Framework — ${docTitle}</h2><p><em>Documento estruturado com o framework MDA (Hunicke, LeBlanc, Zubek)</em></p><hr><h2>🎭 Estética</h2><p><strong>Tipos de diversão selecionados:</strong> ${aesIcons||'—'}</p>${aesDesc?`<h3>Experiência do Jogador</h3><p>${aesDesc}</p>`:''} ${aesModel?`<h3>Modelo Estético</h3><p>${aesModel}</p>`:''}<hr><h2>⚡ Dinâmica</h2>${dynDesc?`<h3>Comportamentos Emergentes</h3><p>${dynDesc}</p>`:''} ${dynFeed?`<h3>Sistemas de Feedback</h3><p>${dynFeed}</p>`:''}<hr><h2>⚙️ Mecânica</h2>${mecRules?`<h3>Regras e Ações</h3><p>${mecRules}</p>`:''} ${mecTuning?`<h3>Tuning e Balanceamento</h3><p>${mecTuning}</p>`:''}`;
  };

  const saveDoc=()=>{
    const pId=project.id,mId='mechanics',curr=pData?.[pId]?.[mId]||{docs:[]};
    const doc={id:uid(),title:docTitle,content:compileHtml(),messages:[],status:'progress',createdAt:todayStr(),updatedAt:null,framework:'mda'};
    setPData(p=>({...p,[pId]:{...(p[pId]||{}),[mId]:{...curr,docs:[...(curr.docs||[]),doc]}}}));
    onDocCreated(doc);
  };

  const canNext=[selAes.length>0,dynDesc.trim().length>0,mecRules.trim().length>0];
  const currMsgs=step<3?aiMsgs[step]:[];
  const stepGuide=step<3?MDA_GUIDE[step]:null;


  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--gdd-bg)',color:'var(--gdd-text)',fontFamily:'system-ui,sans-serif',fontSize:14}}>
      {/* Header */}
      <div style={{height:54,borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',padding:'0 16px',gap:10,flexShrink:0,background:'var(--gdd-bg)'}}>
        <button style={S.back} onClick={onBack}>← Mecânicas</button>
        <span style={{color:MDA_CLR,fontWeight:700,fontSize:15}}>📐 MDA Framework</span>
        <span style={{color:'var(--gdd-border)'}}>·</span>
        <input value={docTitle} onChange={e=>setDocTitle(e.target.value)} style={{background:'transparent',border:'none',color:'var(--gdd-text)',fontSize:14,fontWeight:600,outline:'none',padding:'2px 8px',borderRadius:5,flex:1,minWidth:0}} onFocus={e=>e.target.style.background='var(--gdd-bg3)'} onBlur={e=>e.target.style.background='transparent'}/>
        <span style={{fontSize:11,color:'#334155',whiteSpace:'nowrap'}}>{project.emoji} {project.name}</span>
      </div>

      {/* Stepper */}
      <div style={{borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'stretch',background:'var(--gdd-bg0)',flexShrink:0,height:42}}>
        {MDA_STEPS.map((s,i)=>(
          <button key={s.id} onClick={()=>setStep(i)}
            style={{display:'flex',alignItems:'center',gap:6,padding:'0 18px',background:'none',border:'none',borderBottom:step===i?'2px solid '+MDA_CLR:'2px solid transparent',cursor:'pointer',color:step===i?MDA_CLR:i<step?'var(--gdd-muted)':'#334155',fontWeight:step===i?700:400,fontSize:12,whiteSpace:'nowrap',position:'relative'}}>
            <span style={{fontSize:13}}>{s.icon}</span>
            <span>{s.label}</span>
            {i<step&&<span style={{fontSize:9,color:'#34d399',fontWeight:900}}>✓</span>}
            {i<3&&<span style={{position:'absolute',right:-1,color:'var(--gdd-border2)',fontSize:18,pointerEvents:'none'}}>›</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        {step<3&&<div style={{display:'flex',alignItems:'center',padding:'0 16px',gap:8}}>
          {step>0&&<button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(s=>s-1)}>← Anterior</button>}
          <button style={S.btn(canNext[step]?MDA_CLR:'var(--gdd-border)','#000',{padding:'5px 14px',fontSize:12,opacity:canNext[step]?1:.5})} disabled={!canNext[step]} onClick={()=>setStep(s=>s+1)}>Próximo →</button>
        </div>}
        {step===3&&<div style={{display:'flex',alignItems:'center',padding:'0 16px',gap:8}}>
          <button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(2)}>← Voltar</button>
          <button style={S.btn(MDA_CLR,'#000',{padding:'5px 18px',fontSize:13,fontWeight:800})} onClick={saveDoc}>💾 Salvar documento</button>
        </div>}
      </div>

      {/* Body */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left — Guide theory + AI chat */}
        <div style={{flex:'0 0 36%',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--gdd-bg0)',borderRight:'1px solid '+'var(--gdd-border2)'}}>
          {step<3&&stepGuide&&(
            <>
              <div style={{padding:'14px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',flexShrink:0}}>
                <div style={{fontSize:10,fontWeight:700,color:MDA_CLR,letterSpacing:1.5,marginBottom:6,textTransform:'uppercase'}}>📚 Guia MDA — {MDA_STEPS[step].label}</div>
                <div style={{fontWeight:700,fontSize:13,color:'var(--gdd-text)',marginBottom:8}}>{stepGuide.title}</div>
                <div style={{color:'var(--gdd-dim)',fontSize:12,lineHeight:1.75,whiteSpace:'pre-wrap'}}>{stepGuide.body}</div>
              </div>
              <div style={{padding:'8px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',background:'var(--gdd-bg)',flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
                <span style={{color:MDA_CLR,fontSize:11}}>✦</span>
                <span style={{fontWeight:700,fontSize:12,color:'var(--gdd-muted)'}}>IA de Game Design</span>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:10}}>
                {currMsgs.length===0&&(
                  <div style={{display:'flex',flexDirection:'column',gap:5,paddingTop:4}}>
                    <div style={{color:'#334155',fontSize:11,marginBottom:4}}>Sugestões para esta etapa:</div>
                    {AI_HINTS[step].map((h,i)=>(
                      <button key={i} onClick={()=>sendAi(h)} style={{background:'var(--gdd-bg2)',border:'1px solid '+MDA_CLR+'22',color:'var(--gdd-dim)',borderRadius:7,padding:'7px 10px',cursor:'pointer',fontSize:11,textAlign:'left',lineHeight:1.5}}>{h}</button>
                    ))}
                  </div>
                )}
                {currMsgs.map((m,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                    <div style={{background:m.role==='user'?'#1a1a30':'#0d1414',border:'1px solid '+(m.role==='user'?'#4c1d9555':MDA_CLR+'25'),borderRadius:10,padding:'8px 11px',maxWidth:'94%',fontSize:11,lineHeight:1.65,whiteSpace:'pre-wrap'}}>
                      {m.role==='assistant'&&<div style={{color:MDA_CLR,fontSize:9,fontWeight:700,marginBottom:4,textTransform:'uppercase',letterSpacing:.5}}>📐 MDA</div>}
                      {m.content}
                    </div>
                  </div>
                ))}
                {aiLoad&&<div style={{background:'#0d1414',border:'1px solid '+MDA_CLR+'25',borderRadius:10,padding:'8px 11px',fontSize:11,color:'#334155',alignSelf:'flex-start'}}>Pensando…</div>}
                <div ref={chatEndRef}/>
              </div>
              <div style={{padding:'8px 10px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',gap:6,background:'var(--gdd-bg)',flexShrink:0}}>
                <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAi()} placeholder={'Pergunte sobre '+MDA_STEPS[step].label.toLowerCase()+'...'} style={{...S.inp,flex:1,fontSize:11,padding:'6px 10px'}}/>
                <button style={S.btn(aiLoad?'var(--gdd-border)':MDA_CLR,'#000',{padding:'0 11px',alignSelf:'stretch',borderRadius:7,fontSize:13})} onClick={()=>sendAi()} disabled={aiLoad}>↑</button>
              </div>
            </>
          )}
          {step===3&&(
            <div style={{flex:1,overflowY:'auto',padding:'22px 20px'}}>
              <div style={{fontSize:10,fontWeight:700,color:MDA_CLR,letterSpacing:1.5,marginBottom:14,textTransform:'uppercase'}}>📄 Resumo do documento</div>
              {[
                {label:'Estéticas',value:selAes.map(id=>MDA_AESTHETICS.find(a=>a.id===id)).filter(Boolean).map(a=>a.icon+' '+a.label).join(', ')||'—'},
                {label:'Experiência do jogador',value:aesDesc||'—'},
                {label:'Modelo estético',value:aesModel||'—'},
                {label:'Dinâmicas',value:dynDesc||'—'},
                {label:'Sistemas de feedback',value:dynFeed||'—'},
                {label:'Mecânicas / Regras',value:mecRules||'—'},
                {label:'Tuning',value:mecTuning||'—'},
              ].map(({label,value})=>(
                <div key={label} style={{marginBottom:14}}>
                  <div style={{fontSize:10,color:MDA_CLR,fontWeight:700,letterSpacing:.5,marginBottom:4,textTransform:'uppercase'}}>{label}</div>
                  <div style={{fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65,background:'var(--gdd-bg2)',borderRadius:6,padding:'8px 10px',border:'1px solid '+'var(--gdd-border2)'}}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Form inputs per step */}
        <div style={{flex:1,overflowY:'auto',padding:'24px 28px',display:'flex',flexDirection:'column',gap:20}}>

          {step===0&&(
            <>
              <div>
              <div style={{fontSize:11,color:MDA_CLR,fontWeight:700,letterSpacing:1,marginBottom:10,textTransform:'uppercase'}}>1 — Selecione os tipos de diversão <span style={{color:'#ef4444'}}>*</span></div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:8}}>
                  {MDA_AESTHETICS.map(a=>{const sel=selAes.includes(a.id);return(
                    <div key={a.id} onClick={()=>toggleAes(a.id)} style={{background:sel?MDA_CLR+'18':'var(--gdd-bg2)',border:'1px solid '+(sel?MDA_CLR:'var(--gdd-border2)'),borderRadius:10,padding:'10px 12px',cursor:'pointer',transition:'all .15s'}}>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                        <span style={{fontSize:16}}>{a.icon}</span>
                        <span style={{fontWeight:700,fontSize:12,color:sel?MDA_CLR:'var(--gdd-muted)'}}>{a.label}</span>
                        {sel&&<span style={{marginLeft:'auto',color:MDA_CLR,fontSize:11,fontWeight:900}}>✓</span>}
                      </div>
                      <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.45}}>{a.desc}</div>
                    </div>
                  );})}
                </div>
                {selAes.length===0&&<div style={{fontSize:11,color:'#334155',marginTop:6}}>Selecione pelo menos uma estética para continuar.</div>}
              </div>
              <div>
                <div style={{fontSize:11,color:MDA_CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>2 — Descreva a experiência do jogador</div>
                <TA value={aesDesc} onChange={setAesDesc} placeholder={'Como o jogador deve se sentir ao jogar '+project.name+'? Descreva emoções, momentos-chave e a progressão da experiência...'} rows={4}/>
              </div>
              <div>
                <div style={{fontSize:11,color:MDA_CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>3 — Modelo estético (opcional)</div>
                <TA value={aesModel} onChange={setAesModel} placeholder={'Como os tipos de diversão se combinam? Ex: "Challenge é primário, Fellowship emerge no multiplayer, Discovery aparece na exploração do mapa..."'} rows={3}/>
              </div>
            </>
          )}

          {step===1&&(
            <>
              <div style={{background:'#fbbf2408',border:'1px solid #fbbf2420',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
                <strong style={{color:MDA_CLR}}>Contexto: </strong>
                Estéticas escolhidas — {selAes.map(id=>MDA_AESTHETICS.find(a=>a.id===id)?.label).filter(Boolean).join(', ')||'—'}
              </div>
              <div>
                <div style={{fontSize:11,color:MDA_CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>1 — Comportamentos emergentes <span style={{color:'#ef4444'}}>*</span></div>
                <TA value={dynDesc} onChange={setDynDesc} placeholder={'Quais dinâmicas emergem espontaneamente das mecânicas? Como elas criam as estéticas desejadas? Ex: "a escassez de recursos cria tensão e senso de Challenge; jogadores competem naturalmente criando Fellowship adversarial..."'} rows={5}/>
              </div>
              <div>
                <div style={{fontSize:11,color:MDA_CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>2 — Sistemas de feedback e tensão</div>
                <TA value={dynFeed} onChange={setDynFeed} placeholder={'Como o jogo dá feedback ao jogador? Há loops de positive/negative feedback? Como a tensão é criada e resolvida? Ex: "rich get richer loop com válvulas de escape para jogadores atrás..."'} rows={4}/>
              </div>
            </>
          )}

          {step===2&&(
            <>
              <div style={{background:'#fbbf2408',border:'1px solid #fbbf2420',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
                <strong style={{color:MDA_CLR}}>Dinâmicas a implementar — </strong>
                {dynDesc.slice(0,120)}{dynDesc.length>120?'...':''}
              </div>
              <div>
                <div style={{fontSize:11,color:MDA_CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>1 — Regras e ações do jogador <span style={{color:'#ef4444'}}>*</span></div>
                <TA value={mecRules} onChange={setMecRules} placeholder={'Quais são as mecânicas concretas? Liste ações, controles, regras e sistemas. Ex: "o jogador pode coletar, craftar e equipar. Cada recurso tem peso que limita o inventário. Morte permanente remove inventário..."'} rows={5}/>
              </div>
              <div>
                <div style={{fontSize:11,color:MDA_CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>2 — Tuning e balanceamento</div>
                <TA value={mecTuning} onChange={setMecTuning} placeholder={'Como você vai iterar e balancear? Que variáveis são ajustáveis? Ex: "taxa de spawn, valores de dano e cura, probabilidades de drop — todos configuráveis para tuning de dificuldade..."'} rows={3}/>
              </div>
            </>
          )}

          {step===3&&(
            <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center',justifyContent:'center',flex:1,textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:52,marginBottom:4}}>📐</div>
              <div style={{fontWeight:800,fontSize:20,color:MDA_CLR}}>Documento MDA pronto!</div>
              <div style={{color:'var(--gdd-dim)',fontSize:13,maxWidth:420,lineHeight:1.7}}>O documento será salvo no módulo de Mecânicas com toda a estrutura MDA organizada. Você poderá continuar editando com o editor completo e a IA.</div>
              <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'14px 20px',width:'100%',maxWidth:400,textAlign:'left',marginTop:8}}>
                <div style={{fontSize:12,color:'var(--gdd-muted)',marginBottom:10}}>O documento conterá:</div>
                {[['🎭','Estética',selAes.length+' tipo(s) de diversão selecionado(s)'+(aesDesc?' + descrição':'')],['⚡','Dinâmica',dynDesc?'Comportamentos e feedback documentados':'—'],['⚙️','Mecânica',mecRules?'Regras e tuning documentados':'—']].map(([ic,lb,vl])=>(
                  <div key={lb} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                    <span style={{fontSize:15}}>{ic}</span>
                    <div><div style={{fontSize:12,fontWeight:700,color:'var(--gdd-muted)'}}>{lb}</div><div style={{fontSize:11,color:'var(--gdd-muted)'}}>{vl}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FourKeysGuide ─────────────────────────────────────────────────────────────
function FourKeysGuide({project,pData,setPData,onBack,onDocCreated}){
  const CLR=FOUR_KEYS_CLR;
  const KEYS=FOUR_KEYS_KEYS;
  const STEPS=FOUR_KEYS_STEPS;
  const GUIDE=FOUR_KEYS_GUIDE;
  const AI_HINTS=[
    ['Que combinação de chaves funciona melhor para '+project.genre+'?','Como equilibrar Hard Fun e Easy Fun sem frustrar o jogador?','Jogos de '+project.platform+' geralmente priorizam quais chaves?'],
    ['Que momentos de gameplay geram Fiero em jogos de '+project.genre+'?','Como criar Schadenfreude saudável sem toxicidade?','Quais emoções de Altered States funcionam bem em '+project.platform+'?'],
    ['Sugira objetos de gameplay para gerar Wonder em '+project.genre,'Que ações criam senso de espetáculo no People Factor?','Como o feedback audiovisual pode amplificar Hard Fun?'],
  ];

  const [step,setStep]=useState(0);
  const [docTitle,setDocTitle]=useState('Nova Mecânica — 4 Keys');
  const [selKeys,setSelKeys]=useState([]);      // ids das chaves ativas
  const [keyPriority,setKeyPriority]=useState({}); // id -> 'primary'|'secondary'
  const [playerProfile,setPlayerProfile]=useState('');
  const [emotionMap,setEmotionMap]=useState({}); // keyId -> texto
  const [triggerMap,setTriggerMap]=useState({}); // keyId -> texto
  const [objectMap,setObjectMap]=useState({});   // keyId -> texto
  const [integration,setIntegration]=useState('');
  const [aiInput,setAiInput]=useState('');
  const [aiMsgs,setAiMsgs]=useState([[],[],[]]);
  const [aiLoad,setAiLoad]=useState(false);
  const chatEndRef=useRef<HTMLDivElement | null>(null);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[aiMsgs,aiLoad]);

  const toggleKey=id=>{
    setSelKeys(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
    setKeyPriority(p=>({...p,[id]:p[id]||'primary'}));
  };
  const setPriority=(id,v)=>setKeyPriority(p=>({...p,[id]:v}));

  const activeKeys=KEYS.filter(k=>selKeys.includes(k.id));

  const getCtx=()=>{
    const keyLabels=activeKeys.map(k=>`${k.label} (${keyPriority[k.id]==='primary'?'Primária':'Secundária'})`).join(', ');
    const steps=['MAPEAMENTO DAS CHAVES','EMOÇÕES POR CHAVE','OBJETOS E AÇÕES'];
    return `Você é um especialista em Game Design guiando o usuário pelo framework 4 Keys to Fun (Why We Play Games) de Nicole Lazzaro / XEODesign.
Projeto: "${project.name}" | Gênero: ${project.genre} | Plataforma: ${project.platform}
Documento: "${docTitle}"
Etapa: ${steps[step]||''}
Chaves ativas: ${keyLabels||'Nenhuma ainda'}
${step>=1?`Perfil do jogador: ${playerProfile}`:''}
${step>=2?`Emoções mapeadas: ${JSON.stringify(emotionMap)}`:''}
Guie o usuário de forma prática e sempre referenciando a pesquisa de Lazzaro (XEODesign 2004). Foque em como criar emoção através de gameplay, não de narrativa ou cutscenes. Responda em português brasileiro.`;
  };

  const sendAi=async(msg)=>{
    const txt=msg||aiInput;if(!txt.trim()||aiLoad)return;
    const um={role:'user',content:txt};
    const curr=[...aiMsgs[step],um];
    setAiMsgs(m=>{const n=[...m];n[step]=curr;return n;});
    setAiInput('');setAiLoad(true);
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,system:getCtx(),messages:curr})});
      const d=await r.json(),reply=d.content?.[0]?.text||'Erro.';
      setAiMsgs(m=>{const n=[...m];n[step]=[...curr,{role:'assistant',content:reply}];return n;});
    }catch(e){console.error(e);}finally{setAiLoad(false);}
  };

  const compileHtml=()=>{
    const keyBlocks=activeKeys.map(k=>{
      const pri=keyPriority[k.id]==='primary'?'🔑 Primária':'🔸 Secundária';
      return `<h3>${k.icon} ${k.label} <em style="font-size:11px;color:#64748b">${pri}</em></h3><p><em>${k.tagline}</em></p>${emotionMap[k.id]?`<h4>Emoções-alvo</h4><p>${emotionMap[k.id]}</p>`:''}${triggerMap[k.id]?`<h4>Gatilhos no Gameplay</h4><p>${triggerMap[k.id]}</p>`:''}${objectMap[k.id]?`<h4>Objetos & Ações Emocionais</h4><p>${objectMap[k.id]}</p>`:''}`;
    }).join('');
    return `<h2>🗝️ 4 Keys to Fun — ${docTitle}</h2><p><em>Documento estruturado com o framework 4 Keys to Fun (Nicole Lazzaro / XEODesign, 2004)</em></p><hr>${playerProfile?`<h2>👤 Perfil do Jogador</h2><p>${playerProfile}</p><hr>`:''}<h2>🗝️ Mapeamento das Chaves</h2>${keyBlocks}${integration?`<hr><h2>🔗 Integração entre Chaves</h2><p>${integration}</p>`:''}`;
  };

  const saveDoc=()=>{
    const pId=project.id,mId='mechanics',curr=pData?.[pId]?.[mId]||{docs:[]};
    const doc={id:uid(),title:docTitle,content:compileHtml(),messages:[],status:'progress',createdAt:todayStr(),updatedAt:null,framework:'4keys'};
    setPData(p=>({...p,[pId]:{...(p[pId]||{}),[mId]:{...curr,docs:[...(curr.docs||[]),doc]}}}));
    onDocCreated(doc);
  };

  const canNext=[selKeys.length>0, activeKeys.every(k=>emotionMap[k.id]?.trim()), activeKeys.every(k=>objectMap[k.id]?.trim())];
  const currMsgs=step<3?aiMsgs[step]:[];
  const stepGuide=step<3?GUIDE[step]:null;


  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--gdd-bg)',color:'var(--gdd-text)',fontFamily:'system-ui,sans-serif',fontSize:14}}>
      {/* Header */}
      <div style={{height:54,borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',padding:'0 16px',gap:10,flexShrink:0,background:'var(--gdd-bg)'}}>
        <button style={S.back} onClick={onBack}>← Mecânicas</button>
        <span style={{color:CLR,fontWeight:700,fontSize:15}}>🗝️ 4 Keys to Fun</span>
        <span style={{color:'var(--gdd-border)'}}>·</span>
        <input value={docTitle} onChange={e=>setDocTitle(e.target.value)} style={{background:'transparent',border:'none',color:'var(--gdd-text)',fontSize:14,fontWeight:600,outline:'none',padding:'2px 8px',borderRadius:5,flex:1,minWidth:0}} onFocus={e=>e.target.style.background='var(--gdd-bg3)'} onBlur={e=>e.target.style.background='transparent'}/>
        <span style={{fontSize:11,color:'#334155',whiteSpace:'nowrap'}}>{project.emoji} {project.name}</span>
      </div>

      {/* Stepper */}
      <div style={{borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'stretch',background:'var(--gdd-bg0)',flexShrink:0,height:42}}>
        {STEPS.map((s,i)=>(
          <button key={s.id} onClick={()=>setStep(i)}
            style={{display:'flex',alignItems:'center',gap:6,padding:'0 18px',background:'none',border:'none',borderBottom:step===i?'2px solid '+CLR:'2px solid transparent',cursor:'pointer',color:step===i?CLR:i<step?'var(--gdd-muted)':'#334155',fontWeight:step===i?700:400,fontSize:12,whiteSpace:'nowrap',position:'relative'}}>
            <span style={{fontSize:13}}>{s.icon}</span>
            <span>{s.label}</span>
            {i<step&&<span style={{fontSize:9,color:'#34d399',fontWeight:900}}>✓</span>}
            {i<3&&<span style={{position:'absolute',right:-1,color:'var(--gdd-border2)',fontSize:18,pointerEvents:'none'}}>›</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        {step<3&&<div style={{display:'flex',alignItems:'center',padding:'0 16px',gap:8}}>
          {step>0&&<button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(s=>s-1)}>← Anterior</button>}
          <button style={S.btn(canNext[step]?CLR:'var(--gdd-border)','#fff',{padding:'5px 14px',fontSize:12,opacity:canNext[step]?1:.5})} disabled={!canNext[step]} onClick={()=>setStep(s=>s+1)}>Próximo →</button>
        </div>}
        {step===3&&<div style={{display:'flex',alignItems:'center',padding:'0 16px',gap:8}}>
          <button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(2)}>← Voltar</button>
          <button style={S.btn(CLR,'#fff',{padding:'5px 18px',fontSize:13,fontWeight:800})} onClick={saveDoc}>💾 Salvar documento</button>
        </div>}
      </div>

      {/* Body */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left — Guide + AI */}
        <div style={{flex:'0 0 36%',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--gdd-bg0)',borderRight:'1px solid '+'var(--gdd-border2)'}}>
          {step<3&&stepGuide&&(<>
            <div style={{padding:'14px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',flexShrink:0}}>
              <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,marginBottom:6,textTransform:'uppercase'}}>🗝️ Guia 4 Keys — {STEPS[step].label}</div>
              <div style={{fontWeight:700,fontSize:13,color:'var(--gdd-text)',marginBottom:8}}>{stepGuide.title}</div>
              <div style={{color:'var(--gdd-dim)',fontSize:12,lineHeight:1.75,whiteSpace:'pre-wrap'}}>{stepGuide.body}</div>
            </div>
            <div style={{padding:'8px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',background:'var(--gdd-bg)',flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:CLR,fontSize:11}}>✦</span>
              <span style={{fontWeight:700,fontSize:12,color:'var(--gdd-muted)'}}>IA de Game Design</span>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:10}}>
              {currMsgs.length===0&&(
                <div style={{display:'flex',flexDirection:'column',gap:5,paddingTop:4}}>
                  <div style={{color:'#334155',fontSize:11,marginBottom:4}}>Sugestões para esta etapa:</div>
                  {AI_HINTS[step].map((h,i)=>(
                    <button key={i} onClick={()=>sendAi(h)} style={{background:'var(--gdd-bg2)',border:'1px solid '+CLR+'22',color:'var(--gdd-dim)',borderRadius:7,padding:'7px 10px',cursor:'pointer',fontSize:11,textAlign:'left',lineHeight:1.5}}>{h}</button>
                  ))}
                </div>
              )}
              {currMsgs.map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{background:m.role==='user'?'#1a1030':'#0d1020',border:'1px solid '+(m.role==='user'?'#6d28d955':CLR+'25'),borderRadius:10,padding:'8px 11px',maxWidth:'94%',fontSize:11,lineHeight:1.65,whiteSpace:'pre-wrap'}}>
                    {m.role==='assistant'&&<div style={{color:CLR,fontSize:9,fontWeight:700,marginBottom:4,textTransform:'uppercase',letterSpacing:.5}}>🗝️ 4 Keys</div>}
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoad&&<div style={{background:'#0d1020',border:'1px solid '+CLR+'25',borderRadius:10,padding:'8px 11px',fontSize:11,color:'#334155',alignSelf:'flex-start'}}>Pensando…</div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{padding:'8px 10px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',gap:6,background:'var(--gdd-bg)',flexShrink:0}}>
              <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAi()} placeholder={'Pergunte sobre '+STEPS[step].label.toLowerCase()+'...'} style={{...S.inp,flex:1,fontSize:11,padding:'6px 10px'}}/>
              <button style={S.btn(aiLoad?'var(--gdd-border)':CLR,'#fff',{padding:'0 11px',alignSelf:'stretch',borderRadius:7,fontSize:13})} onClick={()=>sendAi()} disabled={aiLoad}>↑</button>
            </div>
          </>)}
          {step===3&&(
            <div style={{flex:1,overflowY:'auto',padding:'22px 20px'}}>
              <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,marginBottom:14,textTransform:'uppercase'}}>📄 Resumo do documento</div>
              {[
                {label:'Chaves ativas',value:activeKeys.map(k=>`${k.icon} ${k.label} (${keyPriority[k.id]==='primary'?'Primária':'Secundária'})`).join(', ')||'—'},
                {label:'Perfil do jogador',value:playerProfile||'—'},
                ...activeKeys.flatMap(k=>[
                  {label:`${k.icon} ${k.label} — emoções`,value:emotionMap[k.id]||'—'},
                  {label:`${k.icon} ${k.label} — objetos & ações`,value:objectMap[k.id]||'—'},
                ]),
                {label:'Integração entre chaves',value:integration||'—'},
              ].map(({label,value})=>(
                <div key={label} style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:.5,marginBottom:4,textTransform:'uppercase'}}>{label}</div>
                  <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.65,background:'var(--gdd-bg2)',borderRadius:6,padding:'7px 10px',border:'1px solid '+'var(--gdd-border2)'}}>{value.slice(0,180)}{value.length>180?'…':''}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Form */}
        <div style={{flex:1,overflowY:'auto',padding:'24px 28px',display:'flex',flexDirection:'column',gap:22}}>

          {/* STEP 0 — Mapear chaves */}
          {step===0&&(<>
            <div>
              <div style={{fontSize:11,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:4,textTransform:'uppercase'}}>1 — Selecione as chaves do seu jogo <span style={{color:'#ef4444'}}>*</span></div>
              <div style={{color:'var(--gdd-muted)',fontSize:12,marginBottom:12,lineHeight:1.6}}>Jogos de sucesso ativam pelo menos 3 das 4 chaves. Identifique quais são primárias (experiência central) e secundárias (complementares).</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {KEYS.map(k=>{
                  const sel=selKeys.includes(k.id);
                  const pri=keyPriority[k.id]==='primary';
                  return(
                    <div key={k.id} style={{background:sel?k.color+'12':'var(--gdd-bg2)',border:'1px solid '+(sel?k.color+'66':'var(--gdd-border2)'),borderRadius:12,padding:'14px 16px',transition:'all .15s'}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                        <div onClick={()=>toggleKey(k.id)} style={{width:20,height:20,borderRadius:6,border:'2px solid '+(sel?k.color:'#334155'),background:sel?k.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer',marginTop:1,transition:'all .15s'}}>
                          {sel&&<span style={{color:'#000',fontSize:11,fontWeight:900}}>✓</span>}
                        </div>
                        <div style={{flex:1,cursor:'pointer'}} onClick={()=>toggleKey(k.id)}>
                          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                            <span style={{fontSize:17}}>{k.icon}</span>
                            <span style={{fontWeight:700,fontSize:13,color:sel?k.color:'var(--gdd-muted)'}}>{k.label}</span>
                            <span style={{fontSize:11,color:'var(--gdd-muted)'}}>— {k.tagline}</span>
                          </div>
                          <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.55,marginBottom:sel?8:0}}>{k.desc}</div>
                          {sel&&<div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                            {k.emotions.map(e=><span key={e} style={{background:k.color+'18',border:'1px solid '+k.color+'33',color:k.color,borderRadius:8,padding:'2px 8px',fontSize:10}}>{e}</span>)}
                          </div>}
                        </div>
                        {sel&&(
                          <div style={{display:'flex',gap:4,flexShrink:0}}>
                            {['primary','secondary'].map(v=>(
                              <button key={v} onClick={()=>setPriority(k.id,v)} style={{background:keyPriority[k.id]===v?k.color+'22':'none',border:'1px solid '+(keyPriority[k.id]===v?k.color+'66':'var(--gdd-border)'),color:keyPriority[k.id]===v?k.color:'var(--gdd-muted)',borderRadius:6,padding:'3px 9px',cursor:'pointer',fontSize:10,fontWeight:keyPriority[k.id]===v?700:400}}>
                                {v==='primary'?'🔑 Primária':'🔸 Secundária'}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selKeys.length===0&&<div style={{fontSize:11,color:'#334155',marginTop:8}}>Selecione pelo menos uma chave para continuar.</div>}
            </div>
            <div>
              <div style={{fontSize:11,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>2 — Perfil do jogador-alvo</div>
              <TA value={playerProfile} onChange={setPlayerProfile} placeholder={'Quem é seu jogador? Hardcore ou casual? Joga sozinho ou em grupo? Busca desafio, escapismo, socialização? Ex: "jovens adultos que jogam em sessões curtas no mobile, buscando alívio de estresse (Altered States) e competição leve com amigos (People Factor)..."'} rows={4}/>
            </div>
          </>)}

          {/* STEP 1 — Emoções por chave */}
          {step===1&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Lembrete de Lazzaro: </strong>
              emoções devem vir do gameplay, não de cutscenes. Pense em que <em>momento do jogo</em> cada emoção surge.
            </div>
            {activeKeys.map(k=>(
              <div key={k.id} style={{background:'var(--gdd-bg2)',border:'1px solid '+k.color+'33',borderRadius:12,padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:18}}>{k.icon}</span>
                  <span style={{fontWeight:700,fontSize:14,color:k.color}}>{k.label}</span>
                  <span style={{fontSize:10,background:k.color+'18',color:k.color,border:'1px solid '+k.color+'30',borderRadius:6,padding:'1px 7px'}}>{keyPriority[k.id]==='primary'?'🔑 Primária':'🔸 Secundária'}</span>
                </div>
                <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.55,marginBottom:12}}>{k.desc}</div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:14}}>
                  {k.emotions.map(e=><span key={e} style={{background:k.color+'12',border:'1px solid '+k.color+'25',color:k.color,borderRadius:8,padding:'2px 8px',fontSize:10}}>{e}</span>)}
                </div>
                <div style={{fontSize:10,color:k.color,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>Emoções-alvo e momentos de gameplay <span style={{color:'#ef4444'}}>*</span></div>
                <TA value={emotionMap[k.id]||''} onChange={v=>setEmotionMap(m=>({...m,[k.id]:v}))}
                  placeholder={k.questions[0]+'\n'+k.questions[1]+'\n'+k.questions[2]} rows={4}/>
                <div style={{fontSize:10,color:k.color,fontWeight:700,letterSpacing:1,marginBottom:6,marginTop:12,textTransform:'uppercase'}}>Gatilhos específicos no gameplay</div>
                <TA value={triggerMap[k.id]||''} onChange={v=>setTriggerMap(m=>({...m,[k.id]:v}))}
                  placeholder={'Em que momento exato o jogador sente '+k.emotions[0]+'? Que ação ou evento dispara essa emoção?'} rows={3}/>
              </div>
            ))}
          </>)}

          {/* STEP 2 — Objetos & Ações */}
          {step===2&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Insight central de Lazzaro: </strong>
              é possível inserir emoção nos games adicionando <em>objetos e ações que produzem emoção</em> ao gameplay — sem precisar de story ou cutscenes.
            </div>
            {activeKeys.map(k=>(
              <div key={k.id} style={{background:'var(--gdd-bg2)',border:'1px solid '+k.color+'33',borderRadius:12,padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <span style={{fontSize:18}}>{k.icon}</span>
                  <span style={{fontWeight:700,fontSize:14,color:k.color}}>{k.label}</span>
                </div>
                <div style={{fontSize:10,color:k.color,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>Objetos & ações que geram emoção <span style={{color:'#ef4444'}}>*</span></div>
                <TA value={objectMap[k.id]||''} onChange={v=>setObjectMap(m=>({...m,[k.id]:v}))}
                  placeholder={'Liste objetos, ações ou sistemas de gameplay que geram '+k.label+'. Ex: timer visível, ranking público, power-up com risco...'} rows={4}/>
              </div>
            ))}
            <div>
              <div style={{fontSize:11,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>Integração entre chaves (opcional)</div>
              <TA value={integration} onChange={setIntegration}
                placeholder={'Como as chaves se reforçam? Ex: "o ranking (People Factor) aumenta a tensão do Hard Fun; o design visual ambíguo (Easy Fun) amplifica a surpresa nos Altered States..."'} rows={4}/>
            </div>
          </>)}

          {/* STEP 3 — Compilar */}
          {step===3&&(
            <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center',justifyContent:'center',flex:1,textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:52,marginBottom:4}}>🗝️</div>
              <div style={{fontWeight:800,fontSize:20,color:CLR}}>Documento 4 Keys pronto!</div>
              <div style={{color:'var(--gdd-dim)',fontSize:13,maxWidth:420,lineHeight:1.7}}>O documento será salvo no módulo de Mecânicas com a estrutura das 4 Chaves organizada. Você poderá continuar editando com o editor completo e a IA.</div>
              <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'14px 20px',width:'100%',maxWidth:420,textAlign:'left',marginTop:8}}>
                <div style={{fontSize:12,color:'var(--gdd-muted)',marginBottom:10}}>O documento conterá:</div>
                {activeKeys.map(k=>(
                  <div key={k.id} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10}}>
                    <span style={{fontSize:16,marginTop:1}}>{k.icon}</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:k.color}}>{k.label} <span style={{fontWeight:400,color:'var(--gdd-muted)',fontSize:10}}>({keyPriority[k.id]==='primary'?'Primária':'Secundária'})</span></div>
                      <div style={{fontSize:11,color:'var(--gdd-muted)'}}>
                        {[emotionMap[k.id]&&'emoções mapeadas',triggerMap[k.id]&&'gatilhos',objectMap[k.id]&&'objetos & ações'].filter(Boolean).join(' · ')||'—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ColorsGuide ───────────────────────────────────────────────────────────────
function ColorsGuide({project,pData,setPData,onBack,onDocCreated}){
  const CLR=COLORS_CLR;
  const PRIMARIES=COLORS_PRIMARIES;
  const SECONDARIES=COLORS_SECONDARIES;
  const STEPS=COLORS_STEPS;
  const GUIDE=COLORS_GUIDE;

  const AI_HINTS=[
    ['Que tipo de Toy funciona melhor para '+project.genre+' na '+project.platform+'?','Como equilibrar Fantasy aspiracional com Tension realista?','Que jogos do gênero '+project.genre+' têm as 4 primárias bem balanceadas?'],
    ['Como Struggle evolui conforme o jogador avança em '+project.genre+'?','Que tipos de Risk criam tensão sem frustrar o jogador casual?','Como Purpose e Reward trabalham juntos para criar satisfação duradoura?'],
    ['Que structure funciona melhor para '+project.genre+' em '+project.platform+'?','Como a structure deve mudar entre a hora 1 e a hora 10?','Como a structure expõe o jogador gradualmente às 8 cores?'],
  ];

  const [step,setStep]=useState(0);
  const [docTitle,setDocTitle]=useState('Nova Mecânica — Colors');

  // Primary fields
  const [toy,setToy]=useState('');
  const [fantasy,setFantasy]=useState('');
  const [tension,setTension]=useState('');
  const [progress,setProgress]=useState('');

  // Secondary fields
  const [struggle,setStruggle]=useState('');
  const [risk,setRisk]=useState('');
  const [purpose,setPurpose]=useState('');
  const [reward,setReward]=useState('');

  // Structure
  const [structure,setStructure]=useState('');
  const [simDesc,setSimDesc]=useState('');
  const [realDesc,setRealDesc]=useState('');

  const [aiInput,setAiInput]=useState('');
  const [aiMsgs,setAiMsgs]=useState([[],[],[]]);
  const [aiLoad,setAiLoad]=useState(false);
  const chatEndRef=useRef<HTMLDivElement | null>(null);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[aiMsgs,aiLoad]);

  // Map field values for the wheel
  const vals={toy,fantasy,tension,progress,struggle,risk,purpose,reward,structure};
  const filled=k=>vals[k]?.trim().length>0;

  const getCtx=()=>`Você é um especialista em Game Design guiando o usuário pelo framework "Colors of Game Design" de Felipe Dal Molin (UX Collective, 2022), que se baseia em MDA, 4 Keys 2 Fun e Gamer Motivation Model.
Projeto: "${project.name}" | Gênero: ${project.genre} | Plataforma: ${project.platform}
Documento: "${docTitle}"
Etapa: ${['CORES PRIMÁRIAS','CORES SECUNDÁRIAS','STRUCTURE'][step]||''}
Preenchido até agora:
- Toy: ${toy||'—'} | Fantasy: ${fantasy||'—'}
- Tension: ${tension||'—'} | Progress: ${progress||'—'}
${step>=1?`- Struggle: ${struggle||'—'} | Risk: ${risk||'—'}\n- Purpose: ${purpose||'—'} | Reward: ${reward||'—'}`:''}
${step>=2?`- Structure: ${structure||'—'}`:''}
Guie o usuário de forma prática, referenciando sempre o framework Colors of Game Design. Foque em como as cores se conectam e se suportam mutuamente. Responda em português brasileiro.`;

  const sendAi=async(msg)=>{
    const txt=msg||aiInput;if(!txt.trim()||aiLoad)return;
    const um={role:'user',content:txt};
    const curr=[...aiMsgs[step],um];
    setAiMsgs(m=>{const n=[...m];n[step]=curr;return n;});
    setAiInput('');setAiLoad(true);
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,system:getCtx(),messages:curr})});
      const d=await r.json(),reply=d.content?.[0]?.text||'Erro.';
      setAiMsgs(m=>{const n=[...m];n[step]=[...curr,{role:'assistant',content:reply}];return n;});
    }catch(e){console.error(e);}finally{setAiLoad(false);}
  };

  const compileHtml=()=>{
    const sec=(label,val)=>val?`<h3>${label}</h3><p>${val}</p>`:'';
    return `<h2>🎨 Colors of Game Design — ${docTitle}</h2>
<p><em>Documento estruturado com o framework Colors of Game Design (Felipe Dal Molin, 2022)</em></p><hr>
<h2>🎨 Cores Primárias</h2>
${sec('🎮 Toy — aspecto sensorial',toy)}${sec('🌟 Fantasy — aspecto simbólico/aspiracional',fantasy)}${sec('⚡ Tension — conflito e desafio',tension)}${sec('📈 Progress — crescimento e horizonte',progress)}<hr>
<h2>🔀 Cores Secundárias</h2>
<p><em>Emergem das intersecções entre as cores primárias</em></p>
${sec('⚔️ Struggle (Toy × Tension) — core gameplay',struggle)}${sec('☠️ Risk (Fantasy × Tension) — o que o jogador teme',risk)}${sec('🎯 Purpose (Fantasy × Progress) — o que almeja na ficção',purpose)}${sec('🏆 Reward (Toy × Progress) — o que ganha pelas ações',reward)}<hr>
<h2>🔄 Structure — o centro da roda</h2>
${sec('Organização geral do jogo',structure)}${sec('Simulation (Toy + Fantasy)',simDesc)}${sec('Realization (Tension + Progress)',realDesc)}`;
  };

  const saveDoc=()=>{
    const pId=project.id,mId='mechanics',curr=pData?.[pId]?.[mId]||{docs:[]};
    const doc={id:uid(),title:docTitle,content:compileHtml(),messages:[],status:'progress',createdAt:todayStr(),updatedAt:null,framework:'colors'};
    setPData(p=>({...p,[pId]:{...(p[pId]||{}),[mId]:{...curr,docs:[...(curr.docs||[]),doc]}}}));
    onDocCreated(doc);
  };

  const canNext=[
    toy.trim()&&fantasy.trim()&&tension.trim()&&progress.trim(),
    struggle.trim()&&risk.trim()&&purpose.trim()&&reward.trim(),
    structure.trim(),
  ];
  const currMsgs=step<3?aiMsgs[step]:[];


  // SVG Color Wheel — the visual identity of this framework
  const ColorWheel=()=>{
    const cx=110,cy=110,r1=70,r2=108;
    // 8 segments: Fantasy(top), Purpose(top-right), Progress(right), Reward(bottom-right), Toy(bottom), Struggle(bottom-left), Tension(left), Risk(top-left)
    const segments=[
      {id:'fantasy', label:'Fantasy', startDeg:-112.5, color:'#e85d9b'},
      {id:'purpose', label:'Purpose', startDeg:-67.5,  color:'#f59e0b'},
      {id:'progress',label:'Progress',startDeg:-22.5,  color:'#e85d9b'},
      {id:'reward',  label:'Reward',  startDeg:22.5,   color:'#f59e0b'},
      {id:'toy',     label:'Toy',     startDeg:67.5,   color:'#e85d9b'},
      {id:'struggle',label:'Struggle',startDeg:112.5,  color:'#f59e0b'},
      {id:'tension', label:'Tension', startDeg:157.5,  color:'#e85d9b'},
      {id:'risk',    label:'Risk',    startDeg:202.5,  color:'#f59e0b'},
    ];
    const toRad=d=>d*Math.PI/180;
    const arc=(cx,cy,r,startD,endD)=>{
      const s={x:cx+r*Math.cos(toRad(startD)),y:cy+r*Math.sin(toRad(startD))};
      const e={x:cx+r*Math.cos(toRad(endD)),  y:cy+r*Math.sin(toRad(endD))};
      return`M${cx},${cy} L${s.x},${s.y} A${r},${r} 0 0,1 ${e.x},${e.y} Z`;
    };
    const labelPos=(cx,cy,r,startD,endD)=>{const mid=(startD+endD)/2;return{x:cx+r*Math.cos(toRad(mid)),y:cy+r*Math.sin(toRad(mid))};};
    return(
      <svg viewBox="0 0 220 220" style={{width:200,height:200,flexShrink:0}}>
        {/* Background */}
        <circle cx={cx} cy={cy} r={r2+6} fill="#0a0a12" stroke="var(--gdd-border2)" strokeWidth="1"/>
        {segments.map((seg,i)=>{
          const endDeg=seg.startDeg+45;
          const isFilled=filled(seg.id);
          const isActive=isFilled;
          const gap=2;
          const sD=seg.startDeg+gap,eD=endDeg-gap;
          // outer arc
          const outerPath=`M${cx+r1*Math.cos(toRad(sD))},${cy+r1*Math.sin(toRad(sD))} A${r2},${r2} 0 0,1 ${cx+r2*Math.cos(toRad(sD))},${cy+r2*Math.sin(toRad(sD))} L${cx+r2*Math.cos(toRad(eD))},${cy+r2*Math.sin(toRad(eD))} A${r2},${r2} 0 0,0 ${cx+r2*Math.cos(toRad(sD))},${cy+r2*Math.sin(toRad(sD))} Z`;
          // wedge path
          const s1={x:cx+r1*Math.cos(toRad(sD)),y:cy+r1*Math.sin(toRad(sD))};
          const e1={x:cx+r1*Math.cos(toRad(eD)),y:cy+r1*Math.sin(toRad(eD))};
          const s2={x:cx+r2*Math.cos(toRad(sD)),y:cy+r2*Math.sin(toRad(sD))};
          const e2={x:cx+r2*Math.cos(toRad(eD)),y:cy+r2*Math.sin(toRad(eD))};
          const wedge=`M${s1.x},${s1.y} L${s2.x},${s2.y} A${r2},${r2} 0 0,1 ${e2.x},${e2.y} L${e1.x},${e1.y} A${r1},${r1} 0 0,0 ${s1.x},${s1.y} Z`;
          const lp=labelPos(cx,cy,(r1+r2)/2,sD,eD);
          return(
            <g key={seg.id}>
              <path d={wedge} fill={isActive?seg.color:seg.color+'22'} stroke="#0a0a12" strokeWidth="1.5"/>
              <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
                fontSize="8" fontWeight="700" fill={isActive?'#fff':seg.color+'66'}
                transform={`rotate(${(seg.startDeg+22.5)},${lp.x},${lp.y})`}>
                {seg.label}
              </text>
            </g>
          );
        })}
        {/* Center circle */}
        <circle cx={cx} cy={cy} r={r1-2} fill={filled('structure')?'#22d3ee22':'var(--gdd-bg2)'} stroke={filled('structure')?CLR:'var(--gdd-border)'} strokeWidth="1.5"/>
        <text x={cx} y={cy-6} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="800" fill={filled('structure')?CLR:'#334155'}>Structure</text>
        <text x={cx} y={cy+8} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill={filled('structure')?CLR+'99':'var(--gdd-border)'}>
          {filled('structure')?'✓ preenchido':'centro da roda'}
        </text>
        {/* Completion count */}
        <text x={cx} y={cy+20} textAnchor="middle" fontSize="6" fill="#334155">
          {[...PRIMARIES,...SECONDARIES].filter(x=>filled(x.id)).length}/8 cores
        </text>
      </svg>
    );
  };

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--gdd-bg)',color:'var(--gdd-text)',fontFamily:'system-ui,sans-serif',fontSize:14}}>
      {/* Header */}
      <div style={{height:54,borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',padding:'0 16px',gap:10,flexShrink:0,background:'var(--gdd-bg)'}}>
        <button style={S.back} onClick={onBack}>← Mecânicas</button>
        <span style={{color:CLR,fontWeight:700,fontSize:15}}>🎨 Colors of Game Design</span>
        <span style={{color:'var(--gdd-border)'}}>·</span>
        <input value={docTitle} onChange={e=>setDocTitle(e.target.value)} style={{background:'transparent',border:'none',color:'var(--gdd-text)',fontSize:14,fontWeight:600,outline:'none',padding:'2px 8px',borderRadius:5,flex:1,minWidth:0}} onFocus={e=>e.target.style.background='var(--gdd-bg3)'} onBlur={e=>e.target.style.background='transparent'}/>
        <span style={{fontSize:11,color:'#334155',whiteSpace:'nowrap'}}>{project.emoji} {project.name}</span>
      </div>

      {/* Stepper */}
      <div style={{borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'stretch',background:'var(--gdd-bg0)',flexShrink:0,height:42}}>
        {STEPS.map((s,i)=>(
          <button key={s.id} onClick={()=>setStep(i)}
            style={{display:'flex',alignItems:'center',gap:6,padding:'0 18px',background:'none',border:'none',borderBottom:step===i?'2px solid '+CLR:'2px solid transparent',cursor:'pointer',color:step===i?CLR:i<step?'var(--gdd-muted)':'#334155',fontWeight:step===i?700:400,fontSize:12,whiteSpace:'nowrap',position:'relative'}}>
            <span style={{fontSize:13}}>{s.icon}</span><span>{s.label}</span>
            {i<step&&<span style={{fontSize:9,color:'#34d399',fontWeight:900}}>✓</span>}
            {i<3&&<span style={{position:'absolute',right:-1,color:'var(--gdd-border2)',fontSize:18,pointerEvents:'none'}}>›</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        {step<3&&<div style={{display:'flex',alignItems:'center',padding:'0 16px',gap:8}}>
          {step>0&&<button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(s=>s-1)}>← Anterior</button>}
          <button style={S.btn(canNext[step]?CLR:'var(--gdd-border)','#000',{padding:'5px 14px',fontSize:12,opacity:canNext[step]?1:.5})} disabled={!canNext[step]} onClick={()=>setStep(s=>s+1)}>Próximo →</button>
        </div>}
        {step===3&&<div style={{display:'flex',alignItems:'center',padding:'0 16px',gap:8}}>
          <button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(2)}>← Voltar</button>
          <button style={S.btn(CLR,'#000',{padding:'5px 18px',fontSize:13,fontWeight:800})} onClick={saveDoc}>💾 Salvar documento</button>
        </div>}
      </div>

      {/* Body */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left — wheel + guide + AI */}
        <div style={{flex:'0 0 36%',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--gdd-bg0)',borderRight:'1px solid '+'var(--gdd-border2)'}}>
          {/* Live wheel */}
          <div style={{padding:'16px',borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',flexDirection:'column',alignItems:'center',gap:10,flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,textTransform:'uppercase',alignSelf:'flex-start'}}>🎨 Mapa de Cores — ao vivo</div>
            <ColorWheel/>
            <div style={{display:'flex',gap:10,fontSize:10,color:'var(--gdd-muted)'}}>
              <span><span style={{color:'#e85d9b',fontWeight:700}}>●</span> Primárias</span>
              <span><span style={{color:'#f59e0b',fontWeight:700}}>●</span> Secundárias</span>
              <span><span style={{color:CLR,fontWeight:700}}>●</span> Structure</span>
            </div>
          </div>

          {step<3&&(<>
            <div style={{padding:'12px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',flexShrink:0,overflowY:'auto',maxHeight:180}}>
              <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,marginBottom:5,textTransform:'uppercase'}}>📚 {STEPS[step].label}</div>
              <div style={{color:'var(--gdd-dim)',fontSize:11,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{GUIDE[step].body}</div>
            </div>
            <div style={{padding:'6px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',background:'var(--gdd-bg)',flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:CLR,fontSize:11}}>✦</span>
              <span style={{fontWeight:700,fontSize:12,color:'var(--gdd-muted)'}}>IA de Game Design</span>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:9}}>
              {currMsgs.length===0&&(
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  <div style={{color:'#334155',fontSize:11,marginBottom:3}}>Sugestões para esta etapa:</div>
                  {AI_HINTS[step].map((h,i)=>(
                    <button key={i} onClick={()=>sendAi(h)} style={{background:'var(--gdd-bg2)',border:'1px solid '+CLR+'22',color:'var(--gdd-dim)',borderRadius:7,padding:'6px 10px',cursor:'pointer',fontSize:11,textAlign:'left',lineHeight:1.5}}>{h}</button>
                  ))}
                </div>
              )}
              {currMsgs.map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{background:m.role==='user'?'#0d1a1a':'#0d1020',border:'1px solid '+(m.role==='user'?CLR+'44':CLR+'22'),borderRadius:10,padding:'7px 10px',maxWidth:'95%',fontSize:11,lineHeight:1.65,whiteSpace:'pre-wrap'}}>
                    {m.role==='assistant'&&<div style={{color:CLR,fontSize:9,fontWeight:700,marginBottom:3,textTransform:'uppercase',letterSpacing:.5}}>🎨 Colors</div>}
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoad&&<div style={{background:'#0d1020',border:'1px solid '+CLR+'22',borderRadius:10,padding:'7px 10px',fontSize:11,color:'#334155',alignSelf:'flex-start'}}>Pensando…</div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{padding:'7px 10px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',gap:6,background:'var(--gdd-bg)',flexShrink:0}}>
              <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAi()} placeholder={'Pergunte sobre '+STEPS[step].label.toLowerCase()+'...'} style={{...S.inp,flex:1,fontSize:11,padding:'6px 10px'}}/>
              <button style={S.btn(aiLoad?'var(--gdd-border)':CLR,'#000',{padding:'0 11px',alignSelf:'stretch',borderRadius:7,fontSize:13})} onClick={()=>sendAi()} disabled={aiLoad}>↑</button>
            </div>
          </>)}

          {step===3&&(
            <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
              <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,marginBottom:12,textTransform:'uppercase'}}>📄 Resumo</div>
              {[
                {label:'🎮 Toy',value:toy},{label:'🌟 Fantasy',value:fantasy},
                {label:'⚡ Tension',value:tension},{label:'📈 Progress',value:progress},
                {label:'⚔️ Struggle',value:struggle},{label:'☠️ Risk',value:risk},
                {label:'🎯 Purpose',value:purpose},{label:'🏆 Reward',value:reward},
                {label:'🔄 Structure',value:structure},
              ].map(({label,value})=>(
                <div key={label} style={{marginBottom:10}}>
                  <div style={{fontSize:9,color:CLR,fontWeight:700,letterSpacing:.5,marginBottom:3,textTransform:'uppercase'}}>{label}</div>
                  <div style={{fontSize:11,color:value?'var(--gdd-muted)':'var(--gdd-border)',lineHeight:1.55,background:'var(--gdd-bg2)',borderRadius:6,padding:'6px 9px',border:'1px solid '+(value?'var(--gdd-border2)':'var(--gdd-bg2)'),fontStyle:value?'normal':'italic'}}>
                    {value?value.slice(0,100)+(value.length>100?'…':''):'não preenchido'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — form */}
        <div style={{flex:1,overflowY:'auto',padding:'24px 28px',display:'flex',flexDirection:'column',gap:22}}>

          {/* STEP 0 — Primárias */}
          {step===0&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px'}}>
              <div style={{fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
                <strong style={{color:CLR}}>Mantra de Dal Molin: </strong>
                todo jogo tem esses 4 elementos. Como designer, sua missão é garantir que estejam <em>confortáveis, bem alimentados e conversando entre si</em>.
              </div>
            </div>
            {PRIMARIES.map(p=>(
              <div key={p.id} style={{background:'var(--gdd-bg2)',border:'1px solid '+(filled(p.id)?p.color+'55':'var(--gdd-border2)'),borderRadius:12,padding:'16px 18px',transition:'border-color .2s'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                  <span style={{fontSize:18}}>{p.icon}</span>
                  <span style={{fontWeight:800,fontSize:14,color:filled(p.id)?p.color:'var(--gdd-muted)'}}>{p.label}</span>
                  <span style={{fontSize:11,color:'var(--gdd-muted)',fontStyle:'italic'}}>— {p.tagline}</span>
                  {filled(p.id)&&<span style={{marginLeft:'auto',color:'#34d399',fontSize:11,fontWeight:900}}>✓</span>}
                </div>
                <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:12}}>{p.desc}</div>
                <div style={{fontSize:10,color:p.color,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>{p.label} no seu jogo <span style={{color:'#ef4444'}}>*</span></div>
                <TA value={vals[p.id]} onChange={p.id==='toy'?setToy:p.id==='fantasy'?setFantasy:p.id==='tension'?setTension:setProgress}
                  placeholder={p.questions.join('\n')} rows={3}/>
              </div>
            ))}
          </>)}

          {/* STEP 1 — Secundárias */}
          {step===1&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Insight de Dal Molin: </strong>
              o erro clássico é dominar Struggle mas esquecer Purpose — o jogo fica tecnicamente funcional mas vazio de significado. Cada cor secundária depende das duas primárias que a formam.
            </div>
            {SECONDARIES.map(sec=>{
              const parents=sec.parents.map(pid=>PRIMARIES.find(p=>p.id===pid));
              const setter=sec.id==='struggle'?setStruggle:sec.id==='risk'?setRisk:sec.id==='purpose'?setPurpose:setReward;
              return(
                <div key={sec.id} style={{background:'var(--gdd-bg2)',border:'1px solid '+(filled(sec.id)?sec.color+'55':'var(--gdd-border2)'),borderRadius:12,padding:'16px 18px',transition:'border-color .2s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                    <span style={{fontSize:18}}>{sec.icon}</span>
                    <span style={{fontWeight:800,fontSize:14,color:filled(sec.id)?sec.color:'var(--gdd-muted)'}}>{sec.label}</span>
                    {filled(sec.id)&&<span style={{marginLeft:'auto',color:'#34d399',fontSize:11,fontWeight:900}}>✓</span>}
                  </div>
                  <div style={{display:'flex',gap:6,marginBottom:8}}>
                    {parents.map(p=><span key={p.id} style={{background:p.color+'18',border:'1px solid '+p.color+'33',color:p.color,borderRadius:6,padding:'1px 8px',fontSize:10,fontWeight:700}}>{p.icon} {p.label}</span>)}
                    <span style={{color:'#334155',fontSize:10,alignSelf:'center'}}>→ {sec.tagline}</span>
                  </div>
                  <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:12}}>{sec.desc}</div>
                  <div style={{fontSize:10,color:sec.color,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>{sec.label} no seu jogo <span style={{color:'#ef4444'}}>*</span></div>
                  <TA value={vals[sec.id]} onChange={setter} placeholder={sec.questions.join('\n')} rows={3}/>
                </div>
              );
            })}
          </>)}

          {/* STEP 2 — Structure */}
          {step===2&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Dal Molin: </strong>
              Structure é a <em>"organização responsável por expor o jogador ao Risk, instalar o senso de Purpose, fazê-lo Struggle e oferecer Rewards."</em> Não existe a estrutura certa — existe a certa para o seu jogo.
            </div>
            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+(filled('structure')?CLR+'55':'var(--gdd-border2)'),borderRadius:12,padding:'16px 18px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{fontSize:20}}>🔄</span>
                <span style={{fontWeight:800,fontSize:14,color:filled('structure')?CLR:'var(--gdd-muted)'}}>Structure — o designing principle</span>
                {filled('structure')&&<span style={{marginLeft:'auto',color:'#34d399',fontSize:11,fontWeight:900}}>✓</span>}
              </div>
              <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:12}}>Como o jogo organiza e sequencia a exposição do jogador às 8 cores? Níveis lineares, open-world, roguelike, sandbox... A structure é o que faz o jogo <em>fluir</em>.</div>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>Organização geral <span style={{color:'#ef4444'}}>*</span></div>
              <TA value={structure} onChange={setStructure} placeholder={'Como o jogo estrutura a experiência ao longo do tempo? Ex: "série de níveis lineares com dificuldade crescente, cada um introduzindo um novo toy e aumentando o risk; desbloqueios de habilidades são os rewards principais..."'} rows={4}/>
            </div>
            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontWeight:700,fontSize:13,color:'var(--gdd-muted)',marginBottom:12}}>Eixos da experiência (opcional)</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div>
                  <div style={{fontSize:10,color:'#e85d9b',fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>🎭 Simulation<br/><span style={{color:'var(--gdd-muted)',fontWeight:400,fontSize:9}}>Toy + Fantasy — o que você faz e o que isso significa</span></div>
                  <TA value={simDesc} onChange={setSimDesc} placeholder={'Ex: "pressionar botão faz o herói dar uma estocada (Toy) → o jogador sente que é um guerreiro defendendo seu povo (Fantasy)"'} rows={3}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:'#f59e0b',fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>⚡ Realization<br/><span style={{color:'var(--gdd-muted)',fontWeight:400,fontSize:9}}>Tension + Progress — o que você enfrenta e o que ganha</span></div>
                  <TA value={realDesc} onChange={setRealDesc} placeholder={'Ex: "derrotar um boss (Tension) desbloqueia uma nova área e habilidade (Progress) → o jogador sente crescimento real dentro da ficção"'} rows={3}/>
                </div>
              </div>
            </div>
          </>)}

          {/* STEP 3 — Compilar */}
          {step===3&&(
            <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center',justifyContent:'center',flex:1,textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:52,marginBottom:4}}>🎨</div>
              <div style={{fontWeight:800,fontSize:20,color:CLR}}>Mapa de cores completo!</div>
              <div style={{color:'var(--gdd-dim)',fontSize:13,maxWidth:420,lineHeight:1.7}}>O documento será salvo no módulo de Mecânicas com todas as 8 cores + Structure documentadas. Você poderá continuar editando com o editor completo e a IA.</div>
              <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 20px',width:'100%',maxWidth:440,textAlign:'left',marginTop:8}}>
                <div style={{fontSize:11,color:'var(--gdd-muted)',marginBottom:12}}>Cores documentadas:</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  {[...PRIMARIES,...SECONDARIES].map(c=>(
                    <div key={c.id} style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:10,color:filled(c.id)?'#34d399':'#334155',fontWeight:900}}>{filled(c.id)?'✓':'○'}</span>
                      <span style={{fontSize:11,color:filled(c.id)?c.color:'#334155'}}>{c.icon} {c.label}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:10,color:filled('structure')?'#34d399':'#334155',fontWeight:900}}>{filled('structure')?'✓':'○'}</span>
                    <span style={{fontSize:11,color:filled('structure')?CLR:'#334155'}}>🔄 Structure</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── OctalysisGuide ────────────────────────────────────────────────────────────
function OctalysisGuide({project,pData,setPData,onBack,onDocCreated}){
  const CLR=OCTALYSIS_CLR;
  const CDs=OCTALYSIS_CDS;

  // Positions on octagon for SVG
  const OCT_CX=130,OCT_CY=130,OCT_R=95;
  const cdPos=(angle)=>{
    const r=angle*Math.PI/180;
    return{x:OCT_CX+OCT_R*Math.cos(r),y:OCT_CY+OCT_R*Math.sin(r)};
  };

  const STEPS=OCTALYSIS_STEPS;
  const GUIDE=OCTALYSIS_GUIDE;

  const AI_HINTS=[
    ['Quais CDs White Hat são mais importantes para '+project.genre+'?','Como criar Epic Meaning em '+project.genre+' sem uma narrativa complexa?','Como balancear Development com Creativity em '+project.platform+'?'],
    ['Como usar Scarcity sem frustrar o jogador casual de '+project.genre+'?','Que nível de Loss & Avoidance é saudável para '+project.genre+'?','Como Unpredictability pode ser usada para reter jogadores após o mid-game?'],
    ['Qual é o perfil Octalysis ideal para '+project.genre+' em '+project.platform+'?','Como o balanço de drives muda entre onboarding e endgame?','Que drives são mais fracas em '+project.genre+' e como reforçá-las?'],
  ];

  const [step,setStep]=useState(0);
  const [docTitle,setDocTitle]=useState('Nova Mecânica — Octalysis');
  // Per-CD: activated (bool), intensity (0-10), implementation text
  const [cdData,setCdData]=useState(()=>Object.fromEntries(CDs.map(c=>[c.id,{active:false,intensity:5,impl:''}])));
  const [phaseNotes,setPhaseNotes]=useState({early:'',mid:'',late:''});
  const [balanceNote,setBalanceNote]=useState('');
  const [aiInput,setAiInput]=useState('');
  const [aiMsgs,setAiMsgs]=useState([[],[],[]]);
  const [aiLoad,setAiLoad]=useState(false);
  const chatEndRef=useRef<HTMLDivElement | null>(null);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[aiMsgs,aiLoad]);

  const setCd=(id,field,val)=>setCdData(d=>({...d,[id]:{...d[id],[field]:val}}));
  const activeCDs=CDs.filter(c=>cdData[c.id].active);
  const whiteActive=CDs.filter(c=>c.side==='white'&&cdData[c.id].active);
  const blackActive=CDs.filter(c=>c.side==='black'&&cdData[c.id].active);
  const leftActive=CDs.filter(c=>c.brain==='left'&&cdData[c.id].active);
  const rightActive=CDs.filter(c=>c.brain==='right'&&cdData[c.id].active);

  const totalScore=activeCDs.reduce((s,c)=>s+cdData[c.id].intensity,0);
  const whiteScore=whiteActive.reduce((s,c)=>s+cdData[c.id].intensity,0);
  const blackScore=blackActive.reduce((s,c)=>s+cdData[c.id].intensity,0);
  const leftScore=leftActive.reduce((s,c)=>s+cdData[c.id].intensity,0);
  const rightScore=rightActive.reduce((s,c)=>s+cdData[c.id].intensity,0);

  const getCtx=()=>`Você é um especialista em gamificação guiando o usuário pelo framework Octalysis de Yu-kai Chou.
Projeto: "${project.name}" | Gênero: ${project.genre} | Plataforma: ${project.platform}
Documento: "${docTitle}"
Core Drives ativas: ${activeCDs.map(c=>`CD${c.n} ${c.label} (intensidade ${cdData[c.id].intensity}/10)`).join(', ')||'Nenhuma ainda'}
Score total: ${totalScore} | White Hat: ${whiteScore} | Black Hat: ${blackScore} | Left Brain: ${leftScore} | Right Brain: ${rightScore}
Guie com base no framework Octalysis. Foque em Human-Focused Design e no equilíbrio entre as drives. Responda em português brasileiro.`;

  const sendAi=async(msg)=>{
    const txt=msg||aiInput;if(!txt.trim()||aiLoad)return;
    const um={role:'user',content:txt};
    const curr=[...aiMsgs[step],um];
    setAiMsgs(m=>{const n=[...m];n[step]=curr;return n;});
    setAiInput('');setAiLoad(true);
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,system:getCtx(),messages:curr})});
      const d=await r.json(),reply=d.content?.[0]?.text||'Erro.';
      setAiMsgs(m=>{const n=[...m];n[step]=[...curr,{role:'assistant',content:reply}];return n;});
    }catch(e){console.error(e);}finally{setAiLoad(false);}
  };

  const compileHtml=()=>{
    const cdBlocks=activeCDs.map(c=>`<h3>${c.icon} CD${c.n}: ${c.label} <em style="font-size:11px;color:#64748b">(${c.side==='white'?'☀️ White Hat':c.side==='black'?'🌑 Black Hat':'⚪ Neutro'} · ${c.brain==='left'?'◀ Left Brain':'▶ Right Brain'} · Intensidade ${cdData[c.id].intensity}/10)</em></h3><p>${cdData[c.id].impl||'—'}</p>`).join('');
    const bar=pct=>'█'.repeat(Math.round(pct/10))+'░'.repeat(10-Math.round(pct/10));
    return `<h2>🔷 Octalysis Framework — ${docTitle}</h2>
<p><em>Documento estruturado com o Octalysis Framework de Yu-kai Chou</em></p><hr>
<h2>🔷 Core Drives Ativas (${activeCDs.length}/8)</h2>${cdBlocks}<hr>
<h2>⚖️ Balanço do Octágono</h2>
<p><strong>Score total:</strong> ${totalScore} pontos</p>
<p><strong>☀️ White Hat:</strong> ${whiteScore} | <strong>🌑 Black Hat:</strong> ${blackScore} | Razão W/B: ${blackScore>0?(whiteScore/blackScore).toFixed(1):'∞'}:1</p>
<p><strong>◀ Left Brain:</strong> ${leftScore} | <strong>▶ Right Brain:</strong> ${rightScore}</p>
${balanceNote?`<h3>Análise do Balanço</h3><p>${balanceNote}</p>`:''}<hr>
<h2>🗓️ Drives por Fase do Jogo</h2>
${phaseNotes.early?`<h3>🌱 Onboarding (horas iniciais)</h3><p>${phaseNotes.early}</p>`:''}
${phaseNotes.mid?`<h3>🔥 Mid-Game</h3><p>${phaseNotes.mid}</p>`:''}
${phaseNotes.late?`<h3>🏆 Endgame / Retenção</h3><p>${phaseNotes.late}</p>`:''}`;
  };

  const saveDoc=()=>{
    const pId=project.id,mId='mechanics',curr=pData?.[pId]?.[mId]||{docs:[]};
    const doc={id:uid(),title:docTitle,content:compileHtml(),messages:[],status:'progress',createdAt:todayStr(),updatedAt:null,framework:'octalysis'};
    setPData(p=>({...p,[pId]:{...(p[pId]||{}),[mId]:{...curr,docs:[...(curr.docs||[]),doc]}}}));
    onDocCreated(doc);
  };

  const whiteCDs=CDs.filter(c=>c.side==='white');
  const blackCDs=CDs.filter(c=>c.side==='black');
  const neutralCDs=CDs.filter(c=>c.side==='neutral');

  const canNext=[
    activeCDs.length>0,
    true, // balance step is optional
    true,
  ];

  // Octagon SVG
  const OctagonMap=()=>{
    const cx=130,cy=130,maxR=105,minR=18;
    const toR=a=>a*Math.PI/180;
    const pts=CDs.map(c=>{
      const a=c.pos.angle;
      const cd=cdData[c.id];
      const r=cd.active?minR+(maxR-minR)*(cd.intensity/10):minR;
      return{...c,a,r,px:cx+r*Math.cos(toR(a)),py:cy+r*Math.sin(toR(a)),lx:cx+(maxR+16)*Math.cos(toR(a)),ly:cy+(maxR+16)*Math.sin(toR(a))};
    });
    const polyPts=pts.map(p=>`${p.px},${p.py}`).join(' ');
    // octagon border
    const octPts=CDs.map(c=>`${cx+maxR*Math.cos(toR(c.pos.angle))},${cy+maxR*Math.sin(toR(c.pos.angle))}`).join(' ');
    return(
      <svg viewBox="0 0 260 260" style={{width:230,height:230,flexShrink:0}}>
        <polygon points={octPts} fill="none" stroke="var(--gdd-border2)" strokeWidth="1.5"/>
        {/* Grid rings */}
        {[0.25,0.5,0.75,1].map(f=>(
          <polygon key={f} points={CDs.map(c=>`${cx+(maxR*f)*Math.cos(toR(c.pos.angle))},${cy+(maxR*f)*Math.sin(toR(c.pos.angle))}`).join(' ')} fill="none" stroke="var(--gdd-border2)" strokeWidth="0.5"/>
        ))}
        {/* Axes */}
        {CDs.map(c=>(
          <line key={c.id} x1={cx} y1={cy} x2={cx+maxR*Math.cos(toR(c.pos.angle))} y2={cy+maxR*Math.sin(toR(c.pos.angle))} stroke="var(--gdd-border2)" strokeWidth="0.5"/>
        ))}
        {/* Filled area */}
        <polygon points={polyPts} fill={CLR+'30'} stroke={CLR} strokeWidth="1.5"/>
        {/* Points */}
        {pts.map(p=>(
          <circle key={p.id} cx={p.px} cy={p.py} r={cdData[p.id].active?4:2} fill={cdData[p.id].active?p.color:'var(--gdd-border)'} stroke={cdData[p.id].active?p.color+'99':'var(--gdd-border2)'} strokeWidth="1"/>
        ))}
        {/* Labels */}
        {pts.map(p=>{
          const a=p.a;
          const lx=cx+(maxR+20)*Math.cos(toR(a));
          const ly=cy+(maxR+20)*Math.sin(toR(a));
          const anchor=Math.abs(a)===90?'middle':a>-90&&a<90?'start':'end';
          return(
            <g key={p.id}>
              <text x={lx} y={ly-4} textAnchor={anchor} fontSize="7.5" fontWeight="700" fill={cdData[p.id].active?p.color:'#334155'}>CD{p.n}</text>
              <text x={lx} y={ly+5} textAnchor={anchor} fontSize="6.5" fill={cdData[p.id].active?p.color+'bb':'var(--gdd-border)'}>{p.icon}</text>
            </g>
          );
        })}
        {/* Center */}
        <circle cx={cx} cy={cy} r={minR-2} fill="var(--gdd-bg)" stroke="var(--gdd-border)" strokeWidth="1"/>
        <text x={cx} y={cy-3} textAnchor="middle" fontSize="7" fontWeight="800" fill={CLR}>OCT</text>
        <text x={cx} y={cy+6} textAnchor="middle" fontSize="6" fill="#334155">{totalScore}pts</text>
      </svg>
    );
  };


  const BarIndicator=({label,a,b,colorA,colorB})=>{
    const tot=a+b;const pct=tot>0?a/tot:0.5;
    return(
      <div style={{marginBottom:8}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:3}}>
          <span style={{color:colorA,fontWeight:700}}>{label.split('/')[0]} {a}pts</span>
          <span style={{color:colorB,fontWeight:700}}>{a+b===0?'—':`${Math.round(pct*100)}% / ${Math.round((1-pct)*100)}%`}</span>
          <span style={{color:colorB,fontWeight:700}}>{label.split('/')[1]} {b}pts</span>
        </div>
        <div style={{height:6,background:'var(--gdd-bg2)',borderRadius:3,overflow:'hidden'}}>
          <div style={{width:`${pct*100}%`,height:'100%',background:`linear-gradient(90deg,${colorA},${colorB})`,borderRadius:3,transition:'width .3s'}}/>
        </div>
      </div>
    );
  };

  const CDCard=({c,compact=false})=>{
    const cd=cdData[c.id];
    return(
      <div key={c.id} style={{background:'var(--gdd-bg2)',border:'1px solid '+(cd.active?c.color+'55':'var(--gdd-border2)'),borderRadius:12,padding:'14px 16px',transition:'border-color .2s'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
          <div onClick={()=>setCd(c.id,'active',!cd.active)} style={{width:20,height:20,borderRadius:6,border:'2px solid '+(cd.active?c.color:'#334155'),background:cd.active?c.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer',marginTop:2,transition:'all .15s'}}>
            {cd.active&&<span style={{color:'#000',fontSize:11,fontWeight:900}}>✓</span>}
          </div>
          <div style={{flex:1,cursor:'pointer'}} onClick={()=>setCd(c.id,'active',!cd.active)}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:2,flexWrap:'wrap'}}>
              <span style={{fontSize:16}}>{c.icon}</span>
              <span style={{fontWeight:800,fontSize:13,color:cd.active?c.color:'var(--gdd-muted)'}}>CD{c.n}: {c.label}</span>
              <span style={{fontSize:10,background:c.side==='white'?'#a78bfa18':c.side==='black'?'#ef444418':'#fb923c18',color:c.side==='white'?'#a78bfa':c.side==='black'?'#ef4444':'#fb923c',border:'1px solid '+(c.side==='white'?'#a78bfa30':c.side==='black'?'#ef444430':'#fb923c30'),borderRadius:6,padding:'1px 7px',whiteSpace:'nowrap'}}>
                {c.side==='white'?'☀️ White Hat':c.side==='black'?'🌑 Black Hat':'⚪ Neutro'}
              </span>
              <span style={{fontSize:10,color:'var(--gdd-muted)'}}>{c.brain==='left'?'◀ Left':'▶ Right'}</span>
            </div>
            <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.55,marginBottom:cd.active?10:0}}>{c.desc}</div>
          </div>
        </div>
        {cd.active&&(<>
          <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:4,marginBottom:12,paddingLeft:30}}>
            {c.mechanics.map(m=><span key={m} style={{background:c.color+'12',border:'1px solid '+c.color+'22',color:c.color,borderRadius:6,padding:'2px 8px',fontSize:10}}>{m}</span>)}
          </div>
          <div style={{paddingLeft:30}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <span style={{fontSize:10,color:c.color,fontWeight:700,whiteSpace:'nowrap'}}>Intensidade: {cd.intensity}/10</span>
              <input type="range" min={1} max={10} value={cd.intensity} onChange={e=>setCd(c.id,'intensity',+e.target.value)}
                style={{flex:1,accentColor:c.color,cursor:'pointer'}}/>
              <span style={{fontSize:10,color:'var(--gdd-muted)',whiteSpace:'nowrap',minWidth:32}}>{cd.intensity===10?'Máx':cd.intensity<=3?'Baixa':cd.intensity<=6?'Média':'Alta'}</span>
            </div>
            <div style={{fontSize:10,color:c.color,fontWeight:700,letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>Como esta drive é implementada no jogo <span style={{color:'#ef4444'}}>*</span></div>
            <TA value={cd.impl} onChange={v=>setCd(c.id,'impl',v)} placeholder={c.questions.join('\n')} rows={3}/>
          </div>
        </>)}
      </div>
    );
  };

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--gdd-bg)',color:'var(--gdd-text)',fontFamily:'system-ui,sans-serif',fontSize:14}}>
      {/* Header */}
      <div style={{height:54,borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',padding:'0 16px',gap:10,flexShrink:0}}>
        <button style={S.back} onClick={onBack}>← Mecânicas</button>
        <span style={{color:CLR,fontWeight:700,fontSize:15}}>🔷 Octalysis</span>
        <span style={{color:'var(--gdd-border)'}}>·</span>
        <input value={docTitle} onChange={e=>setDocTitle(e.target.value)} style={{background:'transparent',border:'none',color:'var(--gdd-text)',fontSize:14,fontWeight:600,outline:'none',padding:'2px 8px',borderRadius:5,flex:1,minWidth:0}} onFocus={e=>e.target.style.background='var(--gdd-bg3)'} onBlur={e=>e.target.style.background='transparent'}/>
        <span style={{fontSize:11,color:'#334155',whiteSpace:'nowrap'}}>{project.emoji} {project.name}</span>
      </div>

      {/* Stepper */}
      <div style={{borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'stretch',background:'var(--gdd-bg0)',flexShrink:0,height:42}}>
        {STEPS.map((s,i)=>(
          <button key={s.id} onClick={()=>setStep(i)}
            style={{display:'flex',alignItems:'center',gap:6,padding:'0 16px',background:'none',border:'none',borderBottom:step===i?'2px solid '+CLR:'2px solid transparent',cursor:'pointer',color:step===i?CLR:i<step?'var(--gdd-muted)':'#334155',fontWeight:step===i?700:400,fontSize:12,whiteSpace:'nowrap',position:'relative'}}>
            <span>{s.icon}</span><span>{s.label}</span>
            {i<step&&<span style={{fontSize:9,color:'#34d399',fontWeight:900,marginLeft:2}}>✓</span>}
            {i<3&&<span style={{position:'absolute',right:-1,color:'var(--gdd-border2)',fontSize:18,pointerEvents:'none'}}>›</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        {step<3&&<div style={{display:'flex',alignItems:'center',padding:'0 16px',gap:8}}>
          {step>0&&<button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(s=>s-1)}>← Anterior</button>}
          <button style={S.btn(canNext[step]?CLR:'var(--gdd-border)','#000',{padding:'5px 14px',fontSize:12,opacity:canNext[step]?1:.5})} disabled={!canNext[step]} onClick={()=>setStep(s=>s+1)}>Próximo →</button>
        </div>}
        {step===3&&<div style={{display:'flex',alignItems:'center',padding:'0 16px',gap:8}}>
          <button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(2)}>← Voltar</button>
          <button style={S.btn(CLR,'#000',{padding:'5px 18px',fontSize:13,fontWeight:800})} onClick={saveDoc}>💾 Salvar documento</button>
        </div>}
      </div>

      {/* Body */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left panel */}
        <div style={{flex:'0 0 36%',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--gdd-bg0)',borderRight:'1px solid '+'var(--gdd-border2)'}}>
          {/* Live octagon */}
          <div style={{padding:'14px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,textTransform:'uppercase',alignSelf:'flex-start'}}>🔷 Octágono — ao vivo</div>
            <OctagonMap/>
            {totalScore>0&&<>
              <div style={{width:'100%',padding:'0 4px'}}>
                <BarIndicator label="☀️ White Hat/🌑 Black Hat" a={whiteScore} b={blackScore} colorA="#a78bfa" colorB="#ef4444"/>
                <BarIndicator label="◀ Left Brain/▶ Right Brain" a={leftScore} b={rightScore} colorA="#fbbf24" colorB="#34d399"/>
              </div>
              <div style={{fontSize:10,color:'var(--gdd-muted)',textAlign:'center'}}>{activeCDs.length} drive{activeCDs.length!==1?'s':''} ativa{activeCDs.length!==1?'s':''} · score {totalScore}</div>
            </>}
          </div>

          {step<3&&(<>
            <div style={{padding:'10px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',flexShrink:0,overflowY:'auto',maxHeight:160}}>
              <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,marginBottom:5,textTransform:'uppercase'}}>📚 {STEPS[step].label}</div>
              <div style={{color:'var(--gdd-dim)',fontSize:11,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{GUIDE[step]?.body}</div>
            </div>
            <div style={{padding:'6px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',background:'var(--gdd-bg)',flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:CLR,fontSize:11}}>✦</span>
              <span style={{fontWeight:700,fontSize:12,color:'var(--gdd-muted)'}}>IA de Game Design</span>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:9}}>
              {aiMsgs[step].length===0&&(
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  <div style={{color:'#334155',fontSize:11,marginBottom:3}}>Sugestões:</div>
                  {AI_HINTS[step].map((h,i)=>(
                    <button key={i} onClick={()=>sendAi(h)} style={{background:'var(--gdd-bg2)',border:'1px solid '+CLR+'22',color:'var(--gdd-dim)',borderRadius:7,padding:'6px 10px',cursor:'pointer',fontSize:11,textAlign:'left',lineHeight:1.5}}>{h}</button>
                  ))}
                </div>
              )}
              {aiMsgs[step].map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{background:m.role==='user'?'#1a100a':'#0d1020',border:'1px solid '+(m.role==='user'?CLR+'44':CLR+'22'),borderRadius:10,padding:'7px 10px',maxWidth:'95%',fontSize:11,lineHeight:1.65,whiteSpace:'pre-wrap'}}>
                    {m.role==='assistant'&&<div style={{color:CLR,fontSize:9,fontWeight:700,marginBottom:3,textTransform:'uppercase',letterSpacing:.5}}>🔷 Octalysis</div>}
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoad&&<div style={{background:'#0d1020',border:'1px solid '+CLR+'22',borderRadius:10,padding:'7px 10px',fontSize:11,color:'#334155',alignSelf:'flex-start'}}>Pensando…</div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{padding:'7px 10px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',gap:6,background:'var(--gdd-bg)',flexShrink:0}}>
              <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAi()} placeholder="Pergunte sobre Octalysis..." style={{...S.inp,flex:1,fontSize:11,padding:'6px 10px'}}/>
              <button style={S.btn(aiLoad?'var(--gdd-border)':CLR,'#000',{padding:'0 11px',alignSelf:'stretch',borderRadius:7,fontSize:13})} onClick={()=>sendAi()} disabled={aiLoad}>↑</button>
            </div>
          </>)}

          {step===3&&(
            <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>
              <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,marginBottom:10,textTransform:'uppercase'}}>📄 Resumo</div>
              {CDs.map(c=>(
                <div key={c.id} style={{marginBottom:8,opacity:cdData[c.id].active?1:0.3}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                    <span style={{fontSize:9,color:cdData[c.id].active?'#34d399':'#334155',fontWeight:900}}>{cdData[c.id].active?'✓':'○'}</span>
                    <span style={{fontSize:11,color:cdData[c.id].active?c.color:'#334155',fontWeight:700}}>{c.icon} CD{c.n}</span>
                    {cdData[c.id].active&&<span style={{fontSize:10,color:'var(--gdd-muted)'}}>{cdData[c.id].intensity}/10</span>}
                  </div>
                  {cdData[c.id].active&&cdData[c.id].impl&&<div style={{fontSize:10,color:'var(--gdd-muted)',lineHeight:1.5,paddingLeft:14,borderLeft:'2px solid '+c.color+'33'}}>{cdData[c.id].impl.slice(0,80)}{cdData[c.id].impl.length>80?'…':''}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — form */}
        <div style={{flex:1,overflowY:'auto',padding:'24px 28px',display:'flex',flexDirection:'column',gap:18}}>

          {/* STEP 0 — White Hat */}
          {step===0&&(<>
            <div style={{background:'#a78bfa0a',border:'1px solid #a78bfa22',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:'#a78bfa'}}>☀️ White Hat: </strong>
              drives que motivam por empoderamento, significado e satisfação. Jogadores se sentem bem ao serem movidos por estas drives. Selecione as que se aplicam e ajuste a <strong>intensidade</strong> de cada uma.
            </div>
            {whiteCDs.map(c=><CDCard key={c.id} c={c}/>)}
            <div style={{background:'#fb923c0a',border:'1px solid #fb923c22',borderRadius:10,padding:'10px 14px',fontSize:11,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:'#fb923c'}}>⚪ Neutro — </strong>CD4 Ownership & Possession não é claramente White nem Black Hat.
            </div>
            {neutralCDs.map(c=><CDCard key={c.id} c={c}/>)}
          </>)}

          {/* STEP 1 — Black Hat */}
          {step===1&&(<>
            <div style={{background:'#ef44440a',border:'1px solid #ef444422',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:'#ef4444'}}>🌑 Black Hat: </strong>
              drives de urgência, medo e desejo pelo inacessível. Poderosas a curto prazo. Use com cuidado: em excesso, deixam o jogador se sentindo mal. O equilíbrio ideal é White Hat dominando a longo prazo.
            </div>
            {blackCDs.map(c=><CDCard key={c.id} c={c}/>)}
          </>)}

          {/* STEP 2 — Balanço */}
          {step===2&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Insight de Chou: </strong>
              um bom design Octalysis usa White Hat para retenção a longo prazo e Black Hat para engajamento imediato. Jogadores Left Brain param quando atingem o objetivo — jogadores Right Brain jogam indefinidamente.
            </div>
            {/* Score summary */}
            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontWeight:700,fontSize:13,color:'var(--gdd-muted)',marginBottom:14}}>⚖️ Balanço atual do seu design</div>
              <BarIndicator label="☀️ White Hat/🌑 Black Hat" a={whiteScore} b={blackScore} colorA="#a78bfa" colorB="#ef4444"/>
              <BarIndicator label="◀ Left Brain/▶ Right Brain" a={leftScore} b={rightScore} colorA="#fbbf24" colorB="#34d399"/>
              <div style={{marginTop:10,fontSize:11,color:'var(--gdd-muted)',lineHeight:1.65}}>
                {totalScore===0?'Nenhuma drive ativa ainda.':`Score total: ${totalScore} pontos em ${activeCDs.length} drives ativas. `}
                {whiteScore>0&&blackScore===0&&'⚠️ Apenas White Hat — pode faltar urgência. Considere adicionar Scarcity ou Unpredictability.'}
                {blackScore>whiteScore&&'⚠️ Black Hat dominante — pode criar engajamento ansioso. Balance com drives White Hat.'}
                {whiteScore>=blackScore*2&&blackScore>0&&'✅ Bom balanço White/Black Hat.'}
              </div>
            </div>
            {/* Análise escrita */}
            <div>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>Sua análise do balanço</div>
              <TA value={balanceNote} onChange={setBalanceNote} placeholder={'Como as drives se complementam no seu jogo? Há alguma drive intencionalmente ausente? O balanço White/Black Hat está alinhado com seu público-alvo?'} rows={4}/>
            </div>
            {/* Phase notes */}
            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontWeight:700,fontSize:13,color:'var(--gdd-muted)',marginBottom:14}}>🗓️ Drives por fase do jogo</div>
              {[
                {key:'early',icon:'🌱',label:'Onboarding / horas iniciais',placeholder:'Quais drives dominam quando o jogador começa? Ex: CD1 (Epic Meaning) para engajar, CD2 (Accomplishment) para recompensar as primeiras conquistas, CD7 (Curiosidade) para criar mistério inicial...'},
                {key:'mid',  icon:'🔥',label:'Mid-game',placeholder:'Como as drives evoluem no meio do jogo? Ex: CD3 (Criatividade) começa a emergir conforme o jogador ganha maestria; CD5 (Social) se torna mais importante em guilds e PvP...'},
                {key:'late', icon:'🏆',label:'Endgame / retenção de longo prazo',placeholder:'O que mantém o jogador após centenas de horas? Ex: CD4 (Ownership) de colecionáveis raros; CD1 (Epic Meaning) de status de veterano; CD3 (Criatividade) no meta-game...'},
              ].map(({key,icon,label,placeholder})=>(
                <div key={key} style={{marginBottom:14}}>
                  <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>{icon} {label}</div>
                  <TA value={phaseNotes[key]} onChange={v=>setPhaseNotes(p=>({...p,[key]:v}))} placeholder={placeholder} rows={3}/>
                </div>
              ))}
            </div>
          </>)}

          {/* STEP 3 — Compilar */}
          {step===3&&(
            <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center',justifyContent:'center',flex:1,textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:52}}>🔷</div>
              <div style={{fontWeight:800,fontSize:20,color:CLR}}>Octágono completo!</div>
              <div style={{color:'var(--gdd-dim)',fontSize:13,maxWidth:440,lineHeight:1.7}}>O documento será salvo com o score de cada Core Drive, o balanço White/Black Hat, Left/Right Brain e o mapa de drives por fase.</div>
              <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 20px',width:'100%',maxWidth:460,textAlign:'left',marginTop:8}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:14}}>
                  {CDs.map(c=>(
                    <div key={c.id} style={{display:'flex',alignItems:'center',gap:6,opacity:cdData[c.id].active?1:0.3}}>
                      <span style={{fontSize:10,color:cdData[c.id].active?'#34d399':'#334155',fontWeight:900}}>{cdData[c.id].active?'✓':'○'}</span>
                      <span style={{fontSize:11,color:cdData[c.id].active?c.color:'#334155'}}>{c.icon} CD{c.n}</span>
                      {cdData[c.id].active&&<span style={{fontSize:9,color:'var(--gdd-muted)'}}>{cdData[c.id].intensity}/10</span>}
                    </div>
                  ))}
                </div>
                <div style={{borderTop:'1px solid '+'var(--gdd-border2)',paddingTop:10,display:'flex',gap:16,justifyContent:'center',fontSize:12}}>
                  <span style={{color:'#a78bfa'}}>☀️ {whiteScore}pts</span>
                  <span style={{color:'#ef4444'}}>🌑 {blackScore}pts</span>
                  <span style={{color:'#fbbf24'}}>◀ {leftScore}pts</span>
                  <span style={{color:'#34d399'}}>▶ {rightScore}pts</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PENSGuide ─────────────────────────────────────────────────────────────────
function PENSGuide({project,pData,setPData,onBack,onDocCreated}){
  const CLR=PENS_CLR;
  const COMPONENTS=PENS_COMPONENTS;
  const STEPS=PENS_STEPS;
  const GUIDE=PENS_GUIDE;

  const AI_HINTS=[
    ['Como equilibrar Competência e Autonomia em '+project.genre+'?','Que mecânicas criam Relatedness em jogos single-player?','Como SDT explica por que jogadores param de jogar '+project.genre+'?'],
    ['Como tornar controles de '+project.genre+' verdadeiramente intuitivos?','Que técnicas criam Presence emocional em '+project.platform+'?','Como as 3 dimensões de Presence se manifestam em '+project.genre+'?'],
    ['Quais itens PENS são mais úteis para testar '+project.genre+' em estágio de protótipo?','Como interpretar scores baixos de Autonomia no playtest?','Que mudanças de design resolvem problemas de Competência identificados no PENS?'],
  ];

  const [step,setStep]=useState(0);
  const [docTitle,setDocTitle]=useState('Nova Mecânica — PENS');
  // Per-component data
  const [compData,setCompData]=useState(()=>
    Object.fromEntries(COMPONENTS.map(c=>[c.id,{design:'',testPlan:'',targetScore:5}]))
  );
  const [overallVision,setOverallVision]=useState('');
  const [aiInput,setAiInput]=useState('');
  const [aiMsgs,setAiMsgs]=useState([[],[],[]]);
  const [aiLoad,setAiLoad]=useState(false);
  const chatEndRef=useRef<HTMLDivElement | null>(null);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[aiMsgs,aiLoad]);

  const setComp=(id,field,val)=>setCompData(d=>({...d,[id]:{...d[id],[field]:val}}));
  const filled=id=>compData[id]?.design?.trim().length>0;

  const sdtComponents=COMPONENTS.filter(c=>c.sdt);
  const gameComponents=COMPONENTS.filter(c=>!c.sdt);

  const getCtx=()=>`Você é um especialista em game design guiando o usuário pelo framework PENS (Player Experience of Need Satisfaction) de Ryan, Rigby e Przybylski (2006), baseado na Self-Determination Theory.
Projeto: "${project.name}" | Gênero: ${project.genre} | Plataforma: ${project.platform}
Documento: "${docTitle}"
Etapa: ${['NECESSIDADES SDT','CONTROLS & PRESENCE','PLAYTEST GUIDE'][step]||''}
Componentes preenchidos: ${COMPONENTS.filter(c=>filled(c.id)).map(c=>c.label).join(', ')||'Nenhum ainda'}
Guie com base em SDT e na pesquisa empírica de Ryan et al. (2006). Foque em como satisfazer cada necessidade através de mecânicas concretas. Responda em português brasileiro.`;

  const sendAi=async(msg)=>{
    const txt=msg||aiInput;if(!txt.trim()||aiLoad)return;
    const um={role:'user',content:txt};
    const curr=[...aiMsgs[step],um];
    setAiMsgs(m=>{const n=[...m];n[step]=curr;return n;});
    setAiInput('');setAiLoad(true);
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,system:getCtx(),messages:curr})});
      const d=await r.json(),reply=d.content?.[0]?.text||'Erro.';
      setAiMsgs(m=>{const n=[...m];n[step]=[...curr,{role:'assistant',content:reply}];return n;});
    }catch(e){console.error(e);}finally{setAiLoad(false);}
  };

  const compileHtml=()=>{
    const blocks=COMPONENTS.map(c=>`<h3>${c.icon} ${c.label}${c.sdt?' <em style="font-size:10px;color:#818cf8">(SDT)</em>':' <em style="font-size:10px;color:#64748b">(Game-specific)</em>'}</h3>
<p><em>${c.tagline}</em></p>
${compData[c.id].design?`<h4>Design — como satisfazer esta necessidade</h4><p>${compData[c.id].design}</p>`:''}
${compData[c.id].testPlan?`<h4>Playtest — como medir (score-alvo: ${compData[c.id].targetScore}/7)</h4><p>${compData[c.id].testPlan}</p>`:''}
<details><summary style="font-size:11px;color:#64748b;cursor:pointer">Questões PENS para playtest</summary><ul style="font-size:11px;color:#64748b">${c.testItems.map(q=>`<li>${q}</li>`).join('')}</ul></details>`).join('');
    return `<h2>🧠 PENS Framework — ${docTitle}</h2>
<p><em>Documento estruturado com o Player Experience of Need Satisfaction (Ryan, Rigby & Przybylski, 2006)</em></p>
${overallVision?`<blockquote><strong>Visão geral:</strong> ${overallVision}</blockquote>`:''}
<hr><h2>🧠 Necessidades Psicológicas (SDT)</h2>${blocks.slice(0,3)}
<hr><h2>🎮 Componentes Game-Specific</h2>${blocks.slice(3)}`;
  };

  const saveDoc=()=>{
    const pId=project.id,mId='mechanics',curr=pData?.[pId]?.[mId]||{docs:[]};
    const doc={id:uid(),title:docTitle,content:compileHtml(),messages:[],status:'progress',createdAt:todayStr(),updatedAt:null,framework:'pens'};
    setPData(p=>({...p,[pId]:{...(p[pId]||{}),[mId]:{...curr,docs:[...(curr.docs||[]),doc]}}}));
    onDocCreated(doc);
  };

  const canNext=[
    sdtComponents.some(c=>filled(c.id)),
    gameComponents.some(c=>filled(c.id)),
    true,
  ];

  // Pentagon radar SVG
  const PentagonRadar=()=>{
    const cx=110,cy=115,maxR=85;
    const toR=a=>a*Math.PI/180;
    // 5 vertices: top, upper-right, lower-right, lower-left, upper-left
    const angles=[-90,-90+72,-90+144,-90+216,-90+288];
    const pts=COMPONENTS.map((c,i)=>{
      const score=compData[c.id].targetScore;
      const r=filled(c.id)?(score/7)*maxR:0;
      const full={x:cx+maxR*Math.cos(toR(angles[i])),y:cy+maxR*Math.sin(toR(angles[i]))};
      const dot={x:cx+r*Math.cos(toR(angles[i])),y:cy+r*Math.sin(toR(angles[i]))};
      const lbl={x:cx+(maxR+20)*Math.cos(toR(angles[i])),y:cy+(maxR+20)*Math.sin(toR(angles[i]))};
      return{...c,angle:angles[i],full,dot,lbl,score,r};
    });
    const gridRings=[0.25,0.5,0.75,1];
    const polyPts=pts.map(p=>`${p.dot.x},${p.dot.y}`).join(' ');
    const borderPts=pts.map(p=>`${p.full.x},${p.full.y}`).join(' ');
    const avgScore=COMPONENTS.filter(c=>filled(c.id)).length>0
      ?COMPONENTS.filter(c=>filled(c.id)).reduce((s,c)=>s+compData[c.id].targetScore,0)/COMPONENTS.filter(c=>filled(c.id)).length
      :0;
    return(
      <svg viewBox="0 0 220 230" style={{width:200,height:210,flexShrink:0}}>
        <polygon points={borderPts} fill="none" stroke="var(--gdd-border2)" strokeWidth="1.5"/>
        {gridRings.map(f=>(
          <polygon key={f} points={pts.map(p=>`${cx+(maxR*f)*Math.cos(toR(p.angle))},${cy+(maxR*f)*Math.sin(toR(p.angle))}`).join(' ')} fill="none" stroke="var(--gdd-border2)" strokeWidth="0.5" strokeDasharray={f<1?"2,2":""}/>
        ))}
        {pts.map(p=><line key={p.id} x1={cx} y1={cy} x2={p.full.x} y2={p.full.y} stroke="var(--gdd-border2)" strokeWidth="0.5"/>)}
        <polygon points={polyPts} fill={CLR+'25'} stroke={CLR} strokeWidth="1.5"/>
        {pts.map(p=>(
          <circle key={p.id} cx={p.dot.x} cy={p.dot.y} r={filled(p.id)?4:2} fill={filled(p.id)?p.color:'var(--gdd-border)'} stroke={filled(p.id)?p.color+'88':'var(--gdd-border2)'} strokeWidth="1"/>
        ))}
        {pts.map(p=>{
          const a=p.angle;
          const anchor=Math.abs(a+90)<15?'middle':Math.cos(toR(a))>0.1?'start':'end';
          return(
            <g key={p.id}>
              <text x={p.lbl.x} y={p.lbl.y-5} textAnchor={anchor} fontSize="8" fontWeight="700" fill={filled(p.id)?p.color:'#334155'}>{p.icon} {p.label}</text>
              {filled(p.id)&&<text x={p.lbl.x} y={p.lbl.y+5} textAnchor={anchor} fontSize="7" fill={p.color+'99'}>{p.score}/7</text>}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={14} fill="var(--gdd-bg)" stroke={CLR+'44'} strokeWidth="1"/>
        <text x={cx} y={cy-3} textAnchor="middle" fontSize="7" fontWeight="800" fill={CLR}>PENS</text>
        {avgScore>0&&<text x={cx} y={cy+6} textAnchor="middle" fontSize="6.5" fill="#475569">{avgScore.toFixed(1)}</text>}
      </svg>
    );
  };


  const CompCard=({c})=>{
    const cd=compData[c.id];
    return(
      <div style={{background:'var(--gdd-bg2)',border:'1px solid '+(filled(c.id)?c.color+'55':'var(--gdd-border2)'),borderRadius:12,padding:'16px 18px',transition:'border-color .2s'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
          <span style={{fontSize:18}}>{c.icon}</span>
          <span style={{fontWeight:800,fontSize:14,color:filled(c.id)?c.color:'var(--gdd-muted)'}}>{c.label}</span>
          {c.sdt&&<span style={{fontSize:10,background:CLR+'18',color:CLR,border:'1px solid '+CLR+'30',borderRadius:6,padding:'1px 7px'}}>SDT</span>}
          {filled(c.id)&&<span style={{marginLeft:'auto',color:'#34d399',fontSize:11,fontWeight:900}}>✓</span>}
        </div>
        <div style={{fontSize:11,color:'var(--gdd-muted)',fontStyle:'italic',marginBottom:8}}>{c.tagline}</div>
        <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:12}}>{c.desc}</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
          {c.designHints.map(h=><span key={h} style={{background:c.color+'12',border:'1px solid '+c.color+'22',color:c.color,borderRadius:6,padding:'2px 8px',fontSize:10}}>{h}</span>)}
        </div>
        <div style={{fontSize:10,color:c.color,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>Como o jogo satisfaz esta necessidade <span style={{color:'#ef4444'}}>*</span></div>
        <TA value={cd.design} onChange={v=>setComp(c.id,'design',v)}
          placeholder={c.designHints.map((h,i)=>i===0?h:'').join('')+'\n'+c.designHints.slice(1).join('\n')} rows={4}/>
      </div>
    );
  };

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--gdd-bg)',color:'var(--gdd-text)',fontFamily:'system-ui,sans-serif',fontSize:14}}>
      {/* Header */}
      <div style={{height:54,borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',padding:'0 16px',gap:10,flexShrink:0}}>
        <button style={S.back} onClick={onBack}>← Mecânicas</button>
        <span style={{color:CLR,fontWeight:700,fontSize:15}}>🧠 PENS</span>
        <span style={{color:'var(--gdd-border)'}}>·</span>
        <input value={docTitle} onChange={e=>setDocTitle(e.target.value)} style={{background:'transparent',border:'none',color:'var(--gdd-text)',fontSize:14,fontWeight:600,outline:'none',padding:'2px 8px',borderRadius:5,flex:1,minWidth:0}} onFocus={e=>e.target.style.background='var(--gdd-bg3)'} onBlur={e=>e.target.style.background='transparent'}/>
        <span style={{fontSize:11,color:'#334155',whiteSpace:'nowrap'}}>{project.emoji} {project.name}</span>
      </div>

      {/* Stepper */}
      <div style={{borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'stretch',background:'var(--gdd-bg0)',flexShrink:0,height:42}}>
        {STEPS.map((s,i)=>(
          <button key={s.id} onClick={()=>setStep(i)}
            style={{display:'flex',alignItems:'center',gap:6,padding:'0 16px',background:'none',border:'none',borderBottom:step===i?'2px solid '+CLR:'2px solid transparent',cursor:'pointer',color:step===i?CLR:i<step?'var(--gdd-muted)':'#334155',fontWeight:step===i?700:400,fontSize:12,whiteSpace:'nowrap',position:'relative'}}>
            <span>{s.icon}</span><span>{s.label}</span>
            {i<step&&<span style={{fontSize:9,color:'#34d399',fontWeight:900,marginLeft:2}}>✓</span>}
            {i<3&&<span style={{position:'absolute',right:-1,color:'var(--gdd-border2)',fontSize:18,pointerEvents:'none'}}>›</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        {step<3&&<div style={{display:'flex',alignItems:'center',padding:'0 16px',gap:8}}>
          {step>0&&<button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(s=>s-1)}>← Anterior</button>}
          <button style={S.btn(canNext[step]?CLR:'var(--gdd-border)',canNext[step]?'#fff':'var(--gdd-muted)',{padding:'5px 14px',fontSize:12,opacity:canNext[step]?1:.5})} disabled={!canNext[step]} onClick={()=>setStep(s=>s+1)}>Próximo →</button>
        </div>}
        {step===3&&<div style={{display:'flex',alignItems:'center',padding:'0 16px',gap:8}}>
          <button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(2)}>← Voltar</button>
          <button style={S.btn(CLR,'#fff',{padding:'5px 18px',fontSize:13,fontWeight:800})} onClick={saveDoc}>💾 Salvar documento</button>
        </div>}
      </div>

      {/* Body */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left panel */}
        <div style={{flex:'0 0 36%',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--gdd-bg0)',borderRight:'1px solid '+'var(--gdd-border2)'}}>
          {/* Live radar */}
          <div style={{padding:'14px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,textTransform:'uppercase',alignSelf:'flex-start'}}>🧠 Radar PENS — ao vivo</div>
            <PentagonRadar/>
            <div style={{width:'100%',display:'flex',flexDirection:'column',gap:3,paddingTop:2}}>
              {COMPONENTS.map(c=>(
                <div key={c.id} style={{display:'flex',alignItems:'center',gap:6,opacity:filled(c.id)?1:0.35}}>
                  <span style={{fontSize:10}}>{c.icon}</span>
                  <span style={{fontSize:10,color:filled(c.id)?c.color:'#334155',flex:1}}>{c.label}</span>
                  {filled(c.id)&&<>
                    <div style={{flex:1,maxWidth:60,height:3,background:'var(--gdd-bg2)',borderRadius:2}}>
                      <div style={{width:`${(compData[c.id].targetScore/7)*100}%`,height:'100%',background:c.color,borderRadius:2}}/>
                    </div>
                    <span style={{fontSize:9,color:c.color,minWidth:20,textAlign:'right'}}>{compData[c.id].targetScore}/7</span>
                  </>}
                </div>
              ))}
            </div>
          </div>

          {step<3&&(<>
            <div style={{padding:'10px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',flexShrink:0,overflowY:'auto',maxHeight:160}}>
              <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,marginBottom:5,textTransform:'uppercase'}}>📚 {STEPS[step].label}</div>
              <div style={{color:'var(--gdd-dim)',fontSize:11,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{GUIDE[step]?.body}</div>
            </div>
            <div style={{padding:'6px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',background:'var(--gdd-bg)',flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:CLR,fontSize:11}}>✦</span><span style={{fontWeight:700,fontSize:12,color:'var(--gdd-muted)'}}>IA de Game Design</span>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:9}}>
              {aiMsgs[step].length===0&&(
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  <div style={{color:'#334155',fontSize:11,marginBottom:3}}>Sugestões:</div>
                  {AI_HINTS[step].map((h,i)=>(
                    <button key={i} onClick={()=>sendAi(h)} style={{background:'var(--gdd-bg2)',border:'1px solid '+CLR+'22',color:'var(--gdd-dim)',borderRadius:7,padding:'6px 10px',cursor:'pointer',fontSize:11,textAlign:'left',lineHeight:1.5}}>{h}</button>
                  ))}
                </div>
              )}
              {aiMsgs[step].map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{background:m.role==='user'?'#0d0d20':'#0d1020',border:'1px solid '+(m.role==='user'?CLR+'44':CLR+'22'),borderRadius:10,padding:'7px 10px',maxWidth:'95%',fontSize:11,lineHeight:1.65,whiteSpace:'pre-wrap'}}>
                    {m.role==='assistant'&&<div style={{color:CLR,fontSize:9,fontWeight:700,marginBottom:3,textTransform:'uppercase',letterSpacing:.5}}>🧠 PENS</div>}
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoad&&<div style={{background:'#0d1020',border:'1px solid '+CLR+'22',borderRadius:10,padding:'7px 10px',fontSize:11,color:'#334155',alignSelf:'flex-start'}}>Pensando…</div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{padding:'7px 10px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',gap:6,background:'var(--gdd-bg)',flexShrink:0}}>
              <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAi()} placeholder="Pergunte sobre PENS..." style={{...S.inp,flex:1,fontSize:11,padding:'6px 10px'}}/>
              <button style={S.btn(aiLoad?'var(--gdd-border)':CLR,'#fff',{padding:'0 11px',alignSelf:'stretch',borderRadius:7,fontSize:13})} onClick={()=>sendAi()} disabled={aiLoad}>↑</button>
            </div>
          </>)}

          {step===3&&(
            <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>
              <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,marginBottom:10,textTransform:'uppercase'}}>📄 Resumo</div>
              {COMPONENTS.map(c=>(
                <div key={c.id} style={{marginBottom:10,opacity:filled(c.id)?1:0.3}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                    <span style={{fontSize:9,color:filled(c.id)?'#34d399':'#334155',fontWeight:900}}>{filled(c.id)?'✓':'○'}</span>
                    <span style={{fontSize:11,color:filled(c.id)?c.color:'#334155',fontWeight:700}}>{c.icon} {c.label}</span>
                    {filled(c.id)&&<span style={{fontSize:9,color:'var(--gdd-muted)',marginLeft:'auto'}}>score-alvo: {compData[c.id].targetScore}/7</span>}
                  </div>
                  {filled(c.id)&&<div style={{fontSize:10,color:'var(--gdd-muted)',lineHeight:1.5,paddingLeft:14,borderLeft:'2px solid '+c.color+'33'}}>{compData[c.id].design.slice(0,90)}{compData[c.id].design.length>90?'…':''}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — form */}
        <div style={{flex:1,overflowY:'auto',padding:'24px 28px',display:'flex',flexDirection:'column',gap:20}}>

          {/* STEP 0 — SDT Core */}
          {step===0&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Insight de Ryan et al. (2006): </strong>
              jogos populares satisfazem as 3 necessidades SDT de forma mais eficaz que jogos mal avaliados — independentemente de gráficos e gênero. Satisfação de necessidades é o <em>mecanismo</em> da diversão.
            </div>
            <div>
              <div style={{fontSize:11,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>Visão geral do jogo</div>
              <TA value={overallVision} onChange={setOverallVision} placeholder={'Como o jogo satisfaz necessidades psicológicas como um todo? Qual é o equilíbrio entre Competência, Autonomia e Relatedness que você busca?'} rows={2}/>
            </div>
            {sdtComponents.map(c=><CompCard key={c.id} c={c}/>)}
          </>)}

          {/* STEP 1 — Controls & Presence */}
          {step===1&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Nota de pesquisa: </strong>
              Controls e Presence foram adicionados ao PENS por Ryan & Rigby especificamente para games — não existem na SDT original. Presença tem 3 dimensões distintas: física, emocional e narrativa.
            </div>
            {gameComponents.map(c=><CompCard key={c.id} c={c}/>)}
          </>)}

          {/* STEP 2 — Playtest Guide */}
          {step===2&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>O diferencial do PENS: </strong>
              você pode usar estas questões em sessões de playtest reais. Scores abaixo de 4/7 indicam necessidade não satisfeita — área prioritária para redesign.
            </div>
            {/* Scores target & test plans */}
            {COMPONENTS.map(c=>(
              <div key={c.id} style={{background:'var(--gdd-bg2)',border:'1px solid '+(filled(c.id)?c.color+'44':'var(--gdd-border2)'),borderRadius:12,padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <span style={{fontSize:17}}>{c.icon}</span>
                  <span style={{fontWeight:700,fontSize:13,color:filled(c.id)?c.color:'var(--gdd-dim)'}}>{c.label}</span>
                  {!filled(c.id)&&<span style={{fontSize:10,color:'#334155',fontStyle:'italic'}}>— não preenchido nas etapas anteriores</span>}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                  <span style={{fontSize:10,color:c.color,fontWeight:700,whiteSpace:'nowrap'}}>Score-alvo: {compData[c.id].targetScore}/7</span>
                  <input type="range" min={3} max={7} value={compData[c.id].targetScore} onChange={e=>setComp(c.id,'targetScore',+e.target.value)} style={{flex:1,accentColor:c.color,cursor:'pointer'}}/>
                  <span style={{fontSize:10,color:'var(--gdd-muted)',whiteSpace:'nowrap',minWidth:50}}>
                    {compData[c.id].targetScore>=6?'Excelente':compData[c.id].targetScore>=5?'Bom':compData[c.id].targetScore>=4?'Aceitável':'Mínimo'}
                  </span>
                </div>
                <div style={{background:'var(--gdd-bg)',borderRadius:8,padding:'10px 12px',marginBottom:12,border:'1px solid '+'var(--gdd-border2)'}}>
                  <div style={{fontSize:10,color:'var(--gdd-muted)',fontWeight:700,marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>📋 Questões PENS para playtest</div>
                  {c.testItems.map((q,i)=>(
                    <div key={i} style={{display:'flex',gap:8,marginBottom:5,alignItems:'flex-start'}}>
                      <span style={{fontSize:10,color:c.color,fontWeight:700,marginTop:1,flexShrink:0}}>{i+1}.</span>
                      <span style={{fontSize:11,color:'var(--gdd-dim)',lineHeight:1.5}}>{q}</span>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:10,color:c.color,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>Plano de teste — quando e como medir</div>
                <TA value={compData[c.id].testPlan} onChange={v=>setComp(c.id,'testPlan',v)} placeholder={'Em que momento do playtest aplicar estas questões? O que observar além do questionário? Que comportamento do jogador indica insatisfação desta necessidade?'} rows={3}/>
              </div>
            ))}
          </>)}

          {/* STEP 3 — Compile */}
          {step===3&&(
            <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center',justifyContent:'center',flex:1,textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:52}}>🧠</div>
              <div style={{fontWeight:800,fontSize:20,color:CLR}}>Documento PENS pronto!</div>
              <div style={{color:'var(--gdd-dim)',fontSize:13,maxWidth:440,lineHeight:1.7}}>O documento inclui design de cada necessidade e o guia de playtest com as questões PENS validadas por Ryan et al. (2006).</div>
              <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 20px',width:'100%',maxWidth:420,textAlign:'left',marginTop:8}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {COMPONENTS.map(c=>(
                    <div key={c.id} style={{display:'flex',flexDirection:'column',gap:3,opacity:filled(c.id)?1:0.3}}>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <span style={{fontSize:10,color:filled(c.id)?'#34d399':'#334155',fontWeight:900}}>{filled(c.id)?'✓':'○'}</span>
                        <span style={{fontSize:11,color:filled(c.id)?c.color:'#334155'}}>{c.icon} {c.label}</span>
                      </div>
                      {filled(c.id)&&<div style={{height:3,background:'var(--gdd-bg2)',borderRadius:2,marginLeft:14}}><div style={{width:`${(compData[c.id].targetScore/7)*100}%`,height:'100%',background:c.color,borderRadius:2}}/></div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ElementalTetradGuide ──────────────────────────────────────────────────────
function ElementalTetradGuide({project,pData,setPData,onBack,onDocCreated}){
  const CLR=TETRAD_CLR;
  const ELEMENTS=TETRAD_ELEMENTS;
  const STEPS=TETRAD_STEPS;
  const GUIDE=TETRAD_GUIDE;

  const AI_HINTS=[
    ['Como a tecnologia de '+project.platform+' pode habilitar mecânicas únicas?','Que restrições técnicas de '+project.platform+' posso transformar em features criativas?','Como as mecânicas de '+project.genre+' podem reforçar o tema central do jogo?'],
    ['Como equilibrar narrativa dirigida e emergência em '+project.genre+'?','Que escolhas estéticas reforçam melhor as mecânicas de '+project.genre+'?','Como criar identidade estética distinta para '+project.name+' em '+project.platform+'?'],
    ['Os 4 elementos do meu Tetrad estão em harmonia?','Qual elemento está mais fraco e como fortalecê-lo?','Qual é o tema central que une os 4 elementos de '+project.name+'?'],
  ];

  const [step,setStep]=useState(0);
  const [docTitle,setDocTitle]=useState('Nova Mecânica — Elemental Tetrad');
  const [theme,setTheme]=useState(''); // the unifying theme
  const [harmonyNotes,setHarmonyNotes]=useState('');
  // Per-element, per-subfield data
  const [elemData,setElemData]=useState(()=>
    Object.fromEntries(ELEMENTS.map(e=>[e.id,Object.fromEntries(e.subfields.map(sf=>[sf.key,'']))]))
  );
  const [aiInput,setAiInput]=useState('');
  const [aiMsgs,setAiMsgs]=useState([[],[],[]]);
  const [aiLoad,setAiLoad]=useState(false);
  const chatEndRef=useRef<HTMLDivElement | null>(null);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[aiMsgs,aiLoad]);

  const setField=(eId,sfKey,val)=>setElemData(d=>({...d,[eId]:{...d[eId],[sfKey]:val}}));
  const elemFilled=id=>Object.values(elemData[id]).some(v=>v.trim().length>0);
  const allFilled=ids=>ids.every(id=>elemFilled(id));

  // Harmony: count filled elements and connections
  const filledEls=ELEMENTS.filter(e=>elemFilled(e.id));
  const harmonyScore=filledEls.length; // 0-4

  const getCtx=()=>`Você é um especialista em game design guiando pelo Elemental Tetrad de Jesse Schell (The Art of Game Design, 2008).
Projeto: "${project.name}" | Gênero: ${project.genre} | Plataforma: ${project.platform}
Documento: "${docTitle}"
Tema central: "${theme||'Não definido ainda'}"
Elementos preenchidos: ${filledEls.map(e=>e.label).join(', ')||'Nenhum ainda'}
Foque na HARMONIA entre os 4 elementos e em como cada um reforça o tema central. Use exemplos concretos de jogos conhecidos. Responda em português brasileiro.`;

  const sendAi=async(msg)=>{
    const txt=msg||aiInput;if(!txt.trim()||aiLoad)return;
    const um={role:'user',content:txt};
    const curr=[...aiMsgs[step],um];
    setAiMsgs(m=>{const n=[...m];n[step]=curr;return n;});
    setAiInput('');setAiLoad(true);
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,system:getCtx(),messages:curr})});
      const d=await r.json(),reply=d.content?.[0]?.text||'Erro.';
      setAiMsgs(m=>{const n=[...m];n[step]=[...curr,{role:'assistant',content:reply}];return n;});
    }catch(e){console.error(e);}finally{setAiLoad(false);}
  };

  const compileHtml=()=>{
    const elBlocks=ELEMENTS.map(e=>{
      const rows=e.subfields.map(sf=>elemData[e.id][sf.key]?`<h4>${sf.label}</h4><p>${elemData[e.id][sf.key]}</p>`:'').join('');
      return rows?`<h3>${e.icon} ${e.label}</h3>${rows}`:'';
    }).filter(Boolean).join('');
    return `<h2>◈ Elemental Tetrad — ${docTitle}</h2>
<p><em>Documento estruturado com o Elemental Tetrad de Jesse Schell (The Art of Game Design, 2008)</em></p>
${theme?`<blockquote><strong>🎯 Tema Central:</strong> ${theme}</blockquote>`:''}<hr>
${elBlocks}<hr>
<h2>🎯 Análise de Harmonia</h2>
<p><strong>Elementos documentados:</strong> ${filledEls.map(e=>e.icon+' '+e.label).join(', ')||'—'}</p>
${harmonyNotes?`<h3>Como os 4 elementos se reforçam</h3><p>${harmonyNotes}</p>`:''}`;
  };

  const saveDoc=()=>{
    const pId=project.id,mId='mechanics',curr=pData?.[pId]?.[mId]||{docs:[]};
    const doc={id:uid(),title:docTitle,content:compileHtml(),messages:[],status:'progress',createdAt:todayStr(),updatedAt:null,framework:'tetrad'};
    setPData(p=>({...p,[pId]:{...(p[pId]||{}),[mId]:{...curr,docs:[...(curr.docs||[]),doc]}}}));
    onDocCreated(doc);
  };

  // canNext per step
  const canNext=[
    elemFilled('technology')||elemFilled('mechanics'),
    elemFilled('story')||elemFilled('aesthetics'),
    true,
  ];

  // Diamond SVG — live visualization
  const DiamondViz=()=>{
    // positions: aesthetics=top, mechanics=left, story=right, technology=bottom
    const cx=110,cy=110;
    const pts={
      aesthetics:{x:cx,     y:18},
      mechanics: {x:18,     y:cy},
      story:     {x:202,    y:cy},
      technology:{x:cx,     y:202},
    };
    // 6 connections
    const conns=[
      ['aesthetics','mechanics'],['aesthetics','story'],['aesthetics','technology'],
      ['mechanics','story'],['mechanics','technology'],['story','technology'],
    ];
    // Layer of visibility (distance from player)
    const visLabel={player:'👁 Visível ao jogador',partial:'◑ Parcialmente visível',hidden:'👁‍🗨 Invisível ao jogador'};
    const elMap=Object.fromEntries(ELEMENTS.map(e=>[e.id,e]));

    return(
      <svg viewBox="0 0 220 220" style={{width:200,height:200,flexShrink:0}}>
        {/* Outer diamond border */}
        <polygon points={`${pts.aesthetics.x},${pts.aesthetics.y} ${pts.mechanics.x},${pts.mechanics.y} ${pts.technology.x},${pts.technology.y} ${pts.story.x},${pts.story.y}`} fill="none" stroke="var(--gdd-border2)" strokeWidth="1.2"/>
        {/* Connections */}
        {conns.map(([a,b])=>{
          const both=elemFilled(a)&&elemFilled(b);
          const either=elemFilled(a)||elemFilled(b);
          return(
            <line key={a+b} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y}
              stroke={both?CLR:either?CLR+'44':'var(--gdd-border2)'}
              strokeWidth={both?1.5:either?0.8:0.5}
              strokeDasharray={both?'':either?'3,3':'4,4'}
              style={{transition:'all .3s'}}/>
          );
        })}
        {/* Center glow when all filled */}
        {harmonyScore===4&&<circle cx={cx} cy={cy} r={22} fill={CLR+'18'} stroke={CLR+'40'} strokeWidth="1"/>}
        {/* Nodes */}
        {ELEMENTS.map(e=>{
          const p=pts[e.id];
          const filled=elemFilled(e.id);
          return(
            <g key={e.id}>
              <circle cx={p.x} cy={p.y} r={filled?16:12} fill={filled?e.color+'22':'var(--gdd-bg2)'} stroke={filled?e.color:'var(--gdd-border)'} strokeWidth={filled?1.5:1} style={{transition:'all .3s'}}/>
              <text x={p.x} y={p.y+1} textAnchor="middle" dominantBaseline="middle" fontSize={filled?12:10}>{e.icon}</text>
              {/* Label outside */}
              {e.diamond==='top'&&<text x={p.x} y={p.y-20} textAnchor="middle" fontSize="8" fontWeight={filled?700:400} fill={filled?e.color:'#334155'}>{e.label}</text>}
              {e.diamond==='left'&&<text x={p.x-18} y={p.y} textAnchor="end" fontSize="8" fontWeight={filled?700:400} fill={filled?e.color:'#334155'}>{e.label}</text>}
              {e.diamond==='right'&&<text x={p.x+18} y={p.y} textAnchor="start" fontSize="8" fontWeight={filled?700:400} fill={filled?e.color:'#334155'}>{e.label}</text>}
              {e.diamond==='bottom'&&<text x={p.x} y={p.y+22} textAnchor="middle" fontSize="8" fontWeight={filled?700:400} fill={filled?e.color:'#334155'}>{e.label}</text>}
            </g>
          );
        })}
        {/* Harmony score center */}
        <text x={cx} y={cy-5} textAnchor="middle" fontSize="7" fontWeight="800" fill={harmonyScore===4?CLR:'#334155'}>◈</text>
        <text x={cx} y={cy+5} textAnchor="middle" fontSize="6.5" fill={harmonyScore>0?CLR+'99':'var(--gdd-border2)'}>{harmonyScore}/4</text>
        {/* Player visibility arrow */}
        <text x={cx+62} y={24} textAnchor="middle" fontSize="6" fill="#475569">👁 player</text>
        <line x1={cx+62} y1={30} x2={cx+62} y2={190} stroke="var(--gdd-border2)" strokeWidth="0.5" markerEnd="url(#arr)"/>
        <text x={cx+62} y={200} textAnchor="middle" fontSize="6" fill="#475569">🔧 base</text>
        <defs><marker id="arr" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4" fill="var(--gdd-border2)"/></marker></defs>
      </svg>
    );
  };


  const ElementCard=({e})=>(
    <div style={{background:'var(--gdd-bg2)',border:'1px solid '+(elemFilled(e.id)?e.color+'55':'var(--gdd-border2)'),borderRadius:12,padding:'16px 18px',transition:'border-color .2s'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
        <span style={{fontSize:18}}>{e.icon}</span>
        <span style={{fontWeight:800,fontSize:14,color:elemFilled(e.id)?e.color:'var(--gdd-muted)'}}>{e.label}</span>
        <span style={{fontSize:9,background:e.visibility==='player'?e.color+'18':e.visibility==='partial'?e.color+'10':'var(--gdd-border2)',color:e.visibility==='player'?e.color:e.visibility==='partial'?e.color+'99':'#334155',border:'1px solid '+(e.visibility==='player'?e.color+'30':e.visibility==='partial'?e.color+'20':'var(--gdd-border)'),borderRadius:6,padding:'1px 7px',whiteSpace:'nowrap'}}>
          {e.visibility==='player'?'👁 Visível':e.visibility==='partial'?'◑ Parcial':'🔧 Invisível ao jogador'}
        </span>
        {elemFilled(e.id)&&<span style={{marginLeft:'auto',color:'#34d399',fontSize:11,fontWeight:900}}>✓</span>}
      </div>
      <div style={{fontSize:11,color:'var(--gdd-muted)',fontStyle:'italic',marginBottom:6}}>{e.tagline}</div>
      <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:14}}>{e.desc}</div>
      {e.subfields.map(sf=>(
        <div key={sf.key} style={{marginBottom:12}}>
          <div style={{fontSize:10,color:e.color,fontWeight:700,letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>{sf.label}</div>
          <TA value={elemData[e.id][sf.key]} onChange={v=>setField(e.id,sf.key,v)} placeholder={sf.placeholder} rows={2}/>
        </div>
      ))}
    </div>
  );

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--gdd-bg)',color:'var(--gdd-text)',fontFamily:'system-ui,sans-serif',fontSize:14}}>
      {/* Header */}
      <div style={{height:54,borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',padding:'0 16px',gap:10,flexShrink:0}}>
        <button style={S.back} onClick={onBack}>← Mecânicas</button>
        <span style={{color:CLR,fontWeight:700,fontSize:15}}>◈ Elemental Tetrad</span>
        <span style={{color:'var(--gdd-border)'}}>·</span>
        <input value={docTitle} onChange={e=>setDocTitle(e.target.value)} style={{background:'transparent',border:'none',color:'var(--gdd-text)',fontSize:14,fontWeight:600,outline:'none',padding:'2px 8px',borderRadius:5,flex:1,minWidth:0}} onFocus={e=>e.target.style.background='var(--gdd-bg3)'} onBlur={e=>e.target.style.background='transparent'}/>
        <span style={{fontSize:11,color:'#334155',whiteSpace:'nowrap'}}>{project.emoji} {project.name}</span>
      </div>

      {/* Stepper */}
      <div style={{borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'stretch',background:'var(--gdd-bg0)',flexShrink:0,height:42}}>
        {STEPS.map((s,i)=>(
          <button key={s.id} onClick={()=>setStep(i)}
            style={{display:'flex',alignItems:'center',gap:6,padding:'0 16px',background:'none',border:'none',borderBottom:step===i?'2px solid '+CLR:'2px solid transparent',cursor:'pointer',color:step===i?CLR:i<step?'var(--gdd-muted)':'#334155',fontWeight:step===i?700:400,fontSize:12,whiteSpace:'nowrap',position:'relative'}}>
            <span>{s.icon}</span><span>{s.label}</span>
            {s.desc&&step===i&&<span style={{fontSize:10,color:'var(--gdd-muted)',marginLeft:2}}>— {s.desc}</span>}
            {i<step&&<span style={{fontSize:9,color:'#34d399',fontWeight:900,marginLeft:2}}>✓</span>}
            {i<3&&<span style={{position:'absolute',right:-1,color:'var(--gdd-border2)',fontSize:18,pointerEvents:'none'}}>›</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        {step<3&&<div style={{display:'flex',alignItems:'center',padding:'0 16px',gap:8}}>
          {step>0&&<button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(s=>s-1)}>← Anterior</button>}
          <button style={S.btn(canNext[step]?CLR:'var(--gdd-border)',canNext[step]?'#000':'var(--gdd-muted)',{padding:'5px 14px',fontSize:12,opacity:canNext[step]?1:.5})} disabled={!canNext[step]} onClick={()=>setStep(s=>s+1)}>Próximo →</button>
        </div>}
        {step===3&&<div style={{display:'flex',alignItems:'center',padding:'0 16px',gap:8}}>
          <button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(2)}>← Voltar</button>
          <button style={S.btn(CLR,'#000',{padding:'5px 18px',fontSize:13,fontWeight:800})} onClick={saveDoc}>💾 Salvar documento</button>
        </div>}
      </div>

      {/* Body */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left panel */}
        <div style={{flex:'0 0 36%',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--gdd-bg0)',borderRight:'1px solid '+'var(--gdd-border2)'}}>
          {/* Live diamond */}
          <div style={{padding:'14px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,textTransform:'uppercase',alignSelf:'flex-start'}}>◈ Diamante — ao vivo</div>
            <DiamondViz/>
            <div style={{width:'100%',display:'flex',flexDirection:'column',gap:4}}>
              {/* harmony meter */}
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:10,color:'var(--gdd-muted)',whiteSpace:'nowrap'}}>Harmonia:</span>
                <div style={{flex:1,height:4,background:'var(--gdd-bg2)',borderRadius:2}}>
                  <div style={{width:`${(harmonyScore/4)*100}%`,height:'100%',background:CLR,borderRadius:2,transition:'width .4s'}}/>
                </div>
                <span style={{fontSize:10,color:harmonyScore===4?CLR:'#475569',fontWeight:700,minWidth:28}}>{harmonyScore}/4</span>
              </div>
              {/* theme preview */}
              {theme&&<div style={{fontSize:10,color:CLR+'88',fontStyle:'italic',textAlign:'center',paddingTop:2}}>"{theme.slice(0,60)}{theme.length>60?'…':''}"</div>}
            </div>
          </div>

          {step<3&&(<>
            <div style={{padding:'10px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',flexShrink:0,overflowY:'auto',maxHeight:155}}>
              <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,marginBottom:5,textTransform:'uppercase'}}>📚 {STEPS[step].label}</div>
              <div style={{color:'var(--gdd-dim)',fontSize:11,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{GUIDE[step]?.body}</div>
            </div>
            <div style={{padding:'6px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',background:'var(--gdd-bg)',flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:CLR,fontSize:11}}>✦</span><span style={{fontWeight:700,fontSize:12,color:'var(--gdd-muted)'}}>IA de Game Design</span>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:9}}>
              {aiMsgs[step].length===0&&(
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  <div style={{color:'#334155',fontSize:11,marginBottom:3}}>Sugestões:</div>
                  {AI_HINTS[step].map((h,i)=>(
                    <button key={i} onClick={()=>sendAi(h)} style={{background:'var(--gdd-bg2)',border:'1px solid '+CLR+'22',color:'var(--gdd-dim)',borderRadius:7,padding:'6px 10px',cursor:'pointer',fontSize:11,textAlign:'left',lineHeight:1.5}}>{h}</button>
                  ))}
                </div>
              )}
              {aiMsgs[step].map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{background:m.role==='user'?'#100e08':'#0a0d10',border:'1px solid '+(m.role==='user'?CLR+'44':CLR+'22'),borderRadius:10,padding:'7px 10px',maxWidth:'95%',fontSize:11,lineHeight:1.65,whiteSpace:'pre-wrap'}}>
                    {m.role==='assistant'&&<div style={{color:CLR,fontSize:9,fontWeight:700,marginBottom:3,textTransform:'uppercase',letterSpacing:.5}}>◈ Tetrad</div>}
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoad&&<div style={{background:'#0a0d10',border:'1px solid '+CLR+'22',borderRadius:10,padding:'7px 10px',fontSize:11,color:'#334155',alignSelf:'flex-start'}}>Pensando…</div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{padding:'7px 10px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',gap:6,background:'var(--gdd-bg)',flexShrink:0}}>
              <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAi()} placeholder="Pergunte sobre o Elemental Tetrad..." style={{...S.inp,flex:1,fontSize:11,padding:'6px 10px'}}/>
              <button style={S.btn(aiLoad?'var(--gdd-border)':CLR,'#000',{padding:'0 11px',alignSelf:'stretch',borderRadius:7,fontSize:13})} onClick={()=>sendAi()} disabled={aiLoad}>↑</button>
            </div>
          </>)}

          {step===3&&(
            <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>
              <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,marginBottom:10,textTransform:'uppercase'}}>📄 Resumo</div>
              {theme&&<div style={{marginBottom:12,background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:8,padding:'8px 12px',fontSize:11,color:CLR,fontStyle:'italic'}}>🎯 "{theme}"</div>}
              {ELEMENTS.map(e=>(
                <div key={e.id} style={{marginBottom:10,opacity:elemFilled(e.id)?1:0.3}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                    <span style={{fontSize:9,color:elemFilled(e.id)?'#34d399':'#334155',fontWeight:900}}>{elemFilled(e.id)?'✓':'○'}</span>
                    <span style={{fontSize:11,color:elemFilled(e.id)?e.color:'#334155',fontWeight:700}}>{e.icon} {e.label}</span>
                  </div>
                  {elemFilled(e.id)&&<div style={{fontSize:10,color:'var(--gdd-muted)',lineHeight:1.5,paddingLeft:14,borderLeft:'2px solid '+e.color+'33'}}>
                    {Object.values(elemData[e.id]).find(v=>v.trim())?.slice(0,80)||''}{(Object.values(elemData[e.id]).find(v=>v.trim())||'').length>80?'…':''}
                  </div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — form */}
        <div style={{flex:1,overflowY:'auto',padding:'24px 28px',display:'flex',flexDirection:'column',gap:20}}>

          {/* STEP 0 — Technology + Mechanics */}
          {step===0&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Insight de Schell: </strong>
              Technology fica na base do diamante pois define o que é possível. O designer começa entendendo os limites e oportunidades da plataforma — restrições criativas muitas vezes geram as soluções mais elegantes.
            </div>
            <ElementCard e={ELEMENTS.find(e=>e.id==='technology')}/>
            <ElementCard e={ELEMENTS.find(e=>e.id==='mechanics')}/>
          </>)}

          {/* STEP 1 — Story + Aesthetics */}
          {step===1&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Insight de Schell: </strong>
              Aesthetics fica no topo porque é o que o jogador encontra primeiro. Story e Mechanics têm a relação mais complexa do Tetrad — mecânicas criam liberdade, narrativas lineares exigem controle. O melhor design resolve essa tensão com mecânicas narrativas.
            </div>
            <ElementCard e={ELEMENTS.find(e=>e.id==='story')}/>
            <ElementCard e={ELEMENTS.find(e=>e.id==='aesthetics')}/>
          </>)}

          {/* STEP 2 — Harmony */}
          {step===2&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>"Holographic Vision" de Schell: </strong>
              o designer deve ver simultaneamente os 4 elementos e como se afetam. A pergunta central: cada elemento reforça o mesmo tema? Dissonâncias são sentidas pelo jogador, mesmo que ele não consiga nomeá-las.
            </div>

            {/* Theme input */}
            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+CLR+'44',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>🎯 Tema Central <span style={{color:'#ef4444'}}>*</span></div>
              <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:10}}>Schell chama de tema a "cola" que une os 4 elementos. Os melhores temas têm ressonância — tocam o jogador em nível arquetípico ou afirmam uma verdade que ele já sente. Ex: "amor resiliente supera qualquer obstáculo", "a sobrevivência exige escolhas morais impossíveis", "a curiosidade é recompensada em todo lugar".</div>
              <TA value={theme} onChange={setTheme} placeholder={'Qual é o tema central que une Technology, Mechanics, Story e Aesthetics neste jogo? Em uma frase: o que este jogo diz ao jogador sobre o mundo ou sobre si mesmo?'} rows={2}/>
            </div>

            {/* Harmony analysis — per connection */}
            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontWeight:700,fontSize:13,color:'var(--gdd-muted)',marginBottom:14}}>◈ Como os elementos se reforçam</div>
              {[
                {a:'mechanics', b:'aesthetics', icon:'⚙️↔✨', label:'Mechanics ↔ Aesthetics',
                 hint:'Como as regras e sistemas reforçam (ou contradizem) a experiência sensorial? Ex: mecânicas de furtividade + paleta escura e sons abafados.'},
                {a:'mechanics', b:'story',      icon:'⚙️↔📖', label:'Mechanics ↔ Story',
                 hint:'Como as regras e sistemas reforçam a narrativa? Como a história contextualiza as mecânicas? Onde há tensão entre liberdade mecânica e controle narrativo?'},
                {a:'story',     b:'aesthetics', icon:'📖↔✨', label:'Story ↔ Aesthetics',
                 hint:'Como a narrativa e a identidade visual/sonora se reforçam? O visual conta a história sem palavras? A música reforça os arcos emocionais?'},
                {a:'technology',b:'mechanics',  icon:'🔧↔⚙️', label:'Technology ↔ Mechanics',
                 hint:'O que a tecnologia escolhida habilita ou limita nas mecânicas? Alguma restrição técnica virou feature criativa?'},
              ].map(({a,b,icon,label,hint})=>(
                <div key={a+b} style={{marginBottom:14}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                    <span style={{fontSize:13}}>{icon}</span>
                    <span style={{fontSize:11,color:CLR,fontWeight:700}}>{label}</span>
                  </div>
                  <div style={{fontSize:10,color:'#334155',marginBottom:5,lineHeight:1.5,fontStyle:'italic'}}>{hint}</div>
                  <TA value={harmonyNotes.includes(label)?'':''} onChange={()=>{}} placeholder={hint} rows={2}/>
                </div>
              ))}
            </div>

            {/* Harmony overall */}
            <div>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>Análise geral da harmonia</div>
              <TA value={harmonyNotes} onChange={setHarmonyNotes} placeholder={'Avaliando os 4 elementos juntos: onde a harmonia está mais forte? Onde há dissonância? Como cada elemento serve ao tema central? Há algum elemento que contradiz os outros?'} rows={5}/>
            </div>
          </>)}

          {/* STEP 3 — Compile */}
          {step===3&&(
            <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center',justifyContent:'center',flex:1,textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:52}}>◈</div>
              <div style={{fontWeight:800,fontSize:20,color:CLR}}>Tetrad documentado!</div>
              <div style={{color:'var(--gdd-dim)',fontSize:13,maxWidth:440,lineHeight:1.7}}>O documento captura os 4 elementos do diamante de Schell e a análise de harmonia entre eles.</div>
              {theme&&<div style={{background:CLR+'10',border:'1px solid '+CLR+'30',borderRadius:10,padding:'12px 18px',maxWidth:420,width:'100%',fontSize:13,color:CLR,fontStyle:'italic'}}>🎯 "{theme}"</div>}
              <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 20px',width:'100%',maxWidth:420,marginTop:4}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {ELEMENTS.map(e=>(
                    <div key={e.id} style={{display:'flex',alignItems:'center',gap:6,opacity:elemFilled(e.id)?1:0.3}}>
                      <span style={{fontSize:9,color:elemFilled(e.id)?'#34d399':'#334155',fontWeight:900}}>{elemFilled(e.id)?'✓':'○'}</span>
                      <span style={{fontSize:12,color:elemFilled(e.id)?e.color:'#334155'}}>{e.icon} {e.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{borderTop:'1px solid '+'var(--gdd-border2)',paddingTop:10,marginTop:10,display:'flex',justifyContent:'center'}}>
                  <div style={{display:'flex',gap:4}}>
                    {[0,1,2,3].map(i=>(
                      <div key={i} style={{width:24,height:6,borderRadius:2,background:i<harmonyScore?CLR:'var(--gdd-border2)',transition:'background .3s'}}/>
                    ))}
                  </div>
                  <span style={{fontSize:11,color:CLR,marginLeft:8,fontWeight:700}}>Harmonia {harmonyScore}/4</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── LudonarrativeGuide ────────────────────────────────────────────────────────
function LudonarrativeGuide({project,pData,setPData,onBack,onDocCreated}){
  const CLR=LUDONARRATIVE_CLR;
  const STEPS=LUDONARRATIVE_STEPS;
  const GUIDE=LUDONARRATIVE_GUIDE;

  const AI_HINTS=[
    ['Qual abordagem narrativa combina melhor com '+project.genre+'?','Como definir um bom high concept para '+project.name+'?','Como identificar o tema central da experiência ludonarrativa?'],
    ['Como transformar uma mecânica de '+project.genre+' em um loop ludonarrativo?','Que emoções são mais adequadas para '+project.genre+'?','Que tipo de contexto fortalece mecânicas de exploração?'],
    ['Como conectar os loops ludonarrativos em um flow único?','Como equilibrar narrativa emergente e narrativa embutida?','Como o estado de sucesso de uma mecânica pode alimentar a próxima?'],
    ['Como garantir que os sistemas suportem a harmonia ludonarrativa?','Que sistemas seriam necessários para as mecânicas de '+project.genre+'?','Como testar se um novo sistema cria dissonância?'],
  ];

  const [step,setStep]=useState(0);
  const [docTitle,setDocTitle]=useState('Narrativa — Ludonarrativa');
  // Concept
  const [highConcept,setHighConcept]=useState('');
  const [approach,setApproach]=useState(''); // 'player' | 'designer' | ''
  const [theme,setTheme]=useState('');
  // Analysis — list of mechanic rows
  const EMPTY_ROW=()=>({id:uid(),mechanic:'',narrative:'',context:'',emotion:''});
  const [rows,setRows]=useState([EMPTY_ROW()]);
  const [activeRow,setActiveRow]=useState(0); // which row is being edited (for loop viz)
  // Interactions
  const [coreLoop,setCoreLoop]=useState('');
  const [flowSentences,setFlowSentences]=useState('');
  const [momentLoop,setMomentLoop]=useState('');
  // Synergy
  const [systems,setSystems]=useState(''); // free text: mechanic → system mapping
  const [envConsiderations,setEnvConsiderations]=useState('');
  const [dissonanceCheck,setDissonanceCheck]=useState('');

  const [aiInput,setAiInput]=useState('');
  const [aiMsgs,setAiMsgs]=useState([[],[],[],[]]);
  const [aiLoad,setAiLoad]=useState(false);
  const chatEndRef=useRef<HTMLDivElement | null>(null);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[aiMsgs,aiLoad]);

  const updateRow=(idx,field,val)=>setRows(r=>r.map((row,i)=>i===idx?{...row,[field]:val}:row));
  const addRow=()=>{setRows(r=>[...r,EMPTY_ROW()]);setActiveRow(rows.length);};
  const removeRow=idx=>setRows(r=>r.filter((_,i)=>i!==idx));

  const filledRows=rows.filter(r=>r.mechanic.trim()&&r.narrative.trim());
  const cur=rows[activeRow]||rows[0]||{mechanic:'',narrative:'',context:'',emotion:''};

  const getCtx=()=>`Você é um especialista em design narrativo para jogos, especializado em harmonia ludonarrativa (Ash & Despain, 2016).
Projeto: "${project.name}" | Gênero: ${project.genre} | Plataforma: ${project.platform}
Documento: "${docTitle}"
High Concept: "${highConcept||'Não definido'}"
Tema Central: "${theme||'Não definido'}"
Abordagem: ${approach==='player'?'Dirigida pelo jogador (Journey)':approach==='designer'?'Dirigida pelo designer (The Stanley Parable)':'Não definida'}
Mecânicas documentadas: ${filledRows.length}
Responda em português brasileiro. Use exemplos de jogos conhecidos.`;

  const sendAi=async(msg)=>{
    const txt=msg||aiInput;if(!txt.trim()||aiLoad)return;
    const si=Math.min(step,3);
    const um={role:'user',content:txt};
    const curr=[...aiMsgs[si],um];
    setAiMsgs(m=>{const n=[...m];n[si]=curr;return n;});
    setAiInput('');setAiLoad(true);
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,system:getCtx(),messages:curr})});
      const d=await r.json(),reply=d.content?.[0]?.text||'Erro.';
      setAiMsgs(m=>{const n=[...m];n[si]=[...curr,{role:'assistant',content:reply}];return n;});
    }catch(e){console.error(e);}finally{setAiLoad(false);}
  };

  // ── Live Ludonarrative Loop SVG ──────────────────────────────────────────────
  const LoopViz=()=>{
    const nodes=[
      {id:'mechanic',  label: cur.mechanic||'Mecânica',  icon:'🎮', cx:100, cy:28,  color:'#fbbf24'},
      {id:'narrative', label: cur.narrative||'Narrativa', icon:'📖', cx:178, cy:100, color:'#34d399'},
      {id:'context',   label: cur.context||'Contexto',   icon:'🗺️', cx:100, cy:172, color:'#22d3ee'},
      {id:'emotion',   label: cur.emotion||'Emoção',     icon:'💫', cx:22,  cy:100, color:CLR},
    ];
    const filled=[!!cur.mechanic,!!cur.narrative,!!cur.context,!!cur.emotion];
    // Arrows between nodes in clockwise order
    const arcs=[
      {from:0,to:1},{from:1,to:2},{from:2,to:3},{from:3,to:0}
    ];
    return(
      <svg viewBox="0 0 200 200" style={{width:180,height:180,flexShrink:0}}>
        <defs>
          <marker id="lnarr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={CLR+'88'}/>
          </marker>
          <marker id="lnarr-lit" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={CLR}/>
          </marker>
        </defs>
        {arcs.map(({from,to})=>{
          const a=nodes[from],b=nodes[to];
          const lit=filled[from]&&filled[to];
          const dx=b.cx-a.cx,dy=b.cy-a.cy,dist=Math.sqrt(dx*dx+dy*dy);
          const nx=dx/dist,ny=dy/dist,r=18;
          return(
            <line key={from+'-'+to}
              x1={a.cx+nx*r} y1={a.cy+ny*r}
              x2={b.cx-nx*(r+4)} y2={b.cy-ny*(r+4)}
              stroke={lit?CLR:CLR+'25'}
              strokeWidth={lit?1.8:0.8}
              markerEnd={lit?'url(#lnarr-lit)':'url(#lnarr)'}
              style={{transition:'all .3s'}}/>
          );
        })}
        {nodes.map((n,i)=>(
          <g key={n.id}>
            <circle cx={n.cx} cy={n.cy} r={18}
              fill={filled[i]?n.color+'22':'var(--gdd-bg2)'}
              stroke={filled[i]?n.color:'var(--gdd-border)'}
              strokeWidth={filled[i]?1.5:1}
              style={{transition:'all .3s'}}/>
            <text x={n.cx} y={n.cy+1} textAnchor="middle" dominantBaseline="middle" fontSize={11}>{n.icon}</text>
            {/* Label truncated */}
            <text x={n.cx} y={n.cy+(i===0?-24:i===2?24:0)}
              dx={i===1?22:i===3?-22:0}
              textAnchor={i===1?'start':i===3?'end':'middle'}
              dominantBaseline="middle"
              fontSize="7" fontWeight={filled[i]?700:400}
              fill={filled[i]?n.color:'#334155'}
              style={{transition:'color .3s'}}>
              {(filled[i]?n.label:['Mecânica','Narrativa','Contexto','Emoção'][i]).slice(0,16)}
            </text>
          </g>
        ))}
        {/* center: all filled = harmony */}
        {filled.every(Boolean)&&
          <text x={100} y={100} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={CLR} fontWeight="800">✦ loop</text>
        }
      </svg>
    );
  };

  // ── Rows count badge ─────────────────────────────────────────────────────────
  const canNext=[
    highConcept.trim().length>0,
    filledRows.length>0,
    coreLoop.trim().length>0,
    true,
  ];

  const compileHtml=()=>{
    const rowsHtml=filledRows.map((r,i)=>`
      <h4>Mecânica ${i+1}: ${r.mechanic}</h4>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr><th style="text-align:left;padding:4px 8px;background:#1a1a2e;color:#e879f9;width:110px">Mecânica</th><td style="padding:4px 8px">${r.mechanic}</td></tr>
        <tr><th style="text-align:left;padding:4px 8px;background:#1a1a2e;color:#e879f9">Narrativa</th><td style="padding:4px 8px">${r.narrative}</td></tr>
        <tr><th style="text-align:left;padding:4px 8px;background:#1a1a2e;color:#e879f9">Contexto</th><td style="padding:4px 8px">${r.context||'—'}</td></tr>
        <tr><th style="text-align:left;padding:4px 8px;background:#1a1a2e;color:#e879f9">Emoção</th><td style="padding:4px 8px">${r.emotion||'—'}</td></tr>
      </table>`).join('');
    return`<h2>📖 Ludonarrativa — ${docTitle}</h2>
<p><em>Baseado no modelo de Harmonia Ludonarrativa (Ash & Despain, SMU Guildhall, 2016)</em></p>
${highConcept?`<blockquote><strong>🎯 High Concept:</strong> ${highConcept}</blockquote>`:''}
${theme?`<blockquote><strong>💡 Tema Central:</strong> ${theme}</blockquote>`:''}
${approach?`<p><strong>Abordagem:</strong> ${approach==='player'?'Dirigida pelo Jogador (emergent narrative)':'Dirigida pelo Designer (embedded narrative)'}</p>`:''}
<hr><h2>🔍 Fase 1 — Análise: Loops Ludonarrativos</h2>${rowsHtml}
<hr><h2>🔗 Fase 2 — Interações</h2>
${coreLoop?`<h3>Core Game Loop</h3><p>${coreLoop}</p>`:''}
${flowSentences?`<h3>Frases do Loop Ludonarrativo</h3><p style="white-space:pre-wrap">${flowSentences}</p>`:''}
${momentLoop?`<h3>Loop Momento a Momento</h3><p>${momentLoop}</p>`:''}
<hr><h2>⚙️ Fase 3 — Sinergia</h2>
${systems?`<h3>Sistemas de Suporte</h3><p style="white-space:pre-wrap">${systems}</p>`:''}
${envConsiderations?`<h3>Considerações de Ambiente / Level Design</h3><p>${envConsiderations}</p>`:''}
${dissonanceCheck?`<h3>Checklist de Dissonância</h3><p>${dissonanceCheck}</p>`:''}`;
  };

  const saveDoc=()=>{
    const pId=project.id,mId='narrative',curr=pData?.[pId]?.[mId]||{docs:[]};
    const doc={id:uid(),title:docTitle,content:compileHtml(),messages:[],status:'progress',createdAt:todayStr(),updatedAt:null,framework:'ludonarrative'};
    setPData(p=>({...p,[pId]:{...(p[pId]||{}),[mId]:{...curr,docs:[...(curr.docs||[]),doc]}}}));
    onDocCreated(doc);
  };

  const si=Math.min(step,3);

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--gdd-bg)',color:'var(--gdd-text)',fontFamily:'system-ui,sans-serif',fontSize:14}}>
      {/* Header */}
      <div style={{height:54,borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',padding:'0 16px',gap:10,flexShrink:0}}>
        <button style={S.back} onClick={onBack}>← Narrativa</button>
        <span style={{color:CLR,fontWeight:700,fontSize:15}}>📖 Ludonarrativa</span>
        <span style={{color:'var(--gdd-border)'}}>·</span>
        <input value={docTitle} onChange={e=>setDocTitle(e.target.value)} style={{background:'transparent',border:'none',color:'var(--gdd-text)',fontSize:14,fontWeight:600,outline:'none',padding:'2px 8px',borderRadius:5,flex:1,minWidth:0}} onFocus={e=>e.target.style.background='var(--gdd-bg3)'} onBlur={e=>e.target.style.background='transparent'}/>
        <span style={{fontSize:11,color:'#334155',whiteSpace:'nowrap'}}>{project.emoji} {project.name}</span>
      </div>

      {/* Stepper */}
      <div style={{borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'stretch',background:'var(--gdd-bg0)',flexShrink:0,height:42}}>
        {STEPS.map((s,i)=>(
          <button key={s.id} onClick={()=>setStep(i)}
            style={{display:'flex',alignItems:'center',gap:6,padding:'0 14px',background:'none',border:'none',borderBottom:step===i?'2px solid '+CLR:'2px solid transparent',cursor:'pointer',color:step===i?CLR:i<step?'var(--gdd-muted)':'#334155',fontWeight:step===i?700:400,fontSize:12,whiteSpace:'nowrap',position:'relative'}}>
            <span>{s.icon}</span><span>{s.label}</span>
            {i<step&&<span style={{fontSize:9,color:'#34d399',fontWeight:900,marginLeft:2}}>✓</span>}
            {i<4&&<span style={{position:'absolute',right:-1,color:'var(--gdd-border2)',fontSize:18,pointerEvents:'none'}}>›</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        {step<4&&<div style={{display:'flex',alignItems:'center',padding:'0 14px',gap:8}}>
          {step>0&&<button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(s=>s-1)}>← Anterior</button>}
          <button style={S.btn(canNext[step]?CLR:'var(--gdd-border)',canNext[step]?'#000':'var(--gdd-muted)',{padding:'5px 14px',fontSize:12,opacity:canNext[step]?1:.5})} disabled={!canNext[step]} onClick={()=>setStep(s=>s+1)}>Próximo →</button>
        </div>}
        {step===4&&<div style={{display:'flex',alignItems:'center',padding:'0 14px',gap:8}}>
          <button style={S.btn('var(--gdd-border)','var(--gdd-muted)',{padding:'5px 14px',fontSize:12})} onClick={()=>setStep(3)}>← Voltar</button>
          <button style={S.btn(CLR,'#000',{padding:'5px 18px',fontSize:13,fontWeight:800})} onClick={saveDoc}>💾 Salvar documento</button>
        </div>}
      </div>

      {/* Body */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left panel */}
        <div style={{flex:'0 0 36%',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--gdd-bg0)',borderRight:'1px solid '+'var(--gdd-border2)'}}>
          {/* Loop viz */}
          <div style={{padding:'14px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,textTransform:'uppercase',alignSelf:'flex-start'}}>📖 Loop Ludonarrativo — ao vivo</div>
            <LoopViz/>
            <div style={{width:'100%',display:'flex',flexDirection:'column',gap:4}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:10,color:'var(--gdd-muted)',whiteSpace:'nowrap'}}>Loops:</span>
                <div style={{flex:1,height:4,background:'var(--gdd-bg2)',borderRadius:2}}>
                  <div style={{width:`${Math.min((filledRows.length/Math.max(filledRows.length,3))*100,100)}%`,height:'100%',background:CLR,borderRadius:2,transition:'width .4s'}}/>
                </div>
                <span style={{fontSize:10,color:CLR,fontWeight:700,minWidth:28}}>{filledRows.length}</span>
              </div>
              {step===1&&rows.length>1&&(
                <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:2}}>
                  {rows.map((r,i)=>(
                    <button key={r.id} onClick={()=>setActiveRow(i)}
                      style={{fontSize:9,padding:'2px 7px',borderRadius:5,border:'1px solid '+(i===activeRow?CLR:CLR+'30'),background:i===activeRow?CLR+'18':'transparent',color:i===activeRow?CLR:'#475569',cursor:'pointer'}}>
                      {r.mechanic.slice(0,12)||`Mec. ${i+1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {step<4&&(<>
            <div style={{padding:'10px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',flexShrink:0,overflowY:'auto',maxHeight:150}}>
              <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,marginBottom:5,textTransform:'uppercase'}}>📚 {STEPS[step].label}</div>
              <div style={{color:'var(--gdd-dim)',fontSize:11,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{GUIDE[Math.min(step,3)]?.body}</div>
            </div>
            <div style={{padding:'6px 16px',borderBottom:'1px solid '+'var(--gdd-border2)',background:'var(--gdd-bg)',flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:CLR,fontSize:11}}>✦</span><span style={{fontWeight:700,fontSize:12,color:'var(--gdd-muted)'}}>IA Narrativa</span>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:9}}>
              {aiMsgs[si].length===0&&(
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  <div style={{color:'#334155',fontSize:11,marginBottom:3}}>Sugestões:</div>
                  {AI_HINTS[si].map((h,i)=>(
                    <button key={i} onClick={()=>sendAi(h)} style={{background:'var(--gdd-bg2)',border:'1px solid '+CLR+'22',color:'var(--gdd-dim)',borderRadius:7,padding:'6px 10px',cursor:'pointer',fontSize:11,textAlign:'left',lineHeight:1.5}}>{h}</button>
                  ))}
                </div>
              )}
              {aiMsgs[si].map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{background:m.role==='user'?'#0e0814':'#080a12',border:'1px solid '+(m.role==='user'?CLR+'44':CLR+'22'),borderRadius:10,padding:'7px 10px',maxWidth:'95%',fontSize:11,lineHeight:1.65,whiteSpace:'pre-wrap'}}>
                    {m.role==='assistant'&&<div style={{color:CLR,fontSize:9,fontWeight:700,marginBottom:3,textTransform:'uppercase',letterSpacing:.5}}>📖 Ludonarrativa</div>}
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoad&&<div style={{background:'#080a12',border:'1px solid '+CLR+'22',borderRadius:10,padding:'7px 10px',fontSize:11,color:'#334155',alignSelf:'flex-start'}}>Pensando…</div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{padding:'7px 10px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',gap:6,background:'var(--gdd-bg)',flexShrink:0}}>
              <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAi()} placeholder="Pergunte sobre design narrativo..." style={{...S.inp,flex:1,fontSize:11,padding:'6px 10px'}}/>
              <button style={S.btn(aiLoad?'var(--gdd-border)':CLR,'#000',{padding:'0 11px',alignSelf:'stretch',borderRadius:7,fontSize:13})} onClick={()=>sendAi()} disabled={aiLoad}>↑</button>
            </div>
          </>)}

          {step===4&&(
            <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>
              <div style={{fontSize:10,fontWeight:700,color:CLR,letterSpacing:1.5,marginBottom:10,textTransform:'uppercase'}}>📄 Resumo</div>
              {highConcept&&<div style={{marginBottom:10,background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:8,padding:'8px 12px',fontSize:11,color:CLR,fontStyle:'italic'}}>"{highConcept.slice(0,80)}{highConcept.length>80?'…':''}"</div>}
              <div style={{marginBottom:8,fontSize:11,color:'var(--gdd-dim)'}}><span style={{color:'#34d399',fontWeight:700}}>{filledRows.length}</span> loop{filledRows.length!==1?'s':''} ludonarrativo{filledRows.length!==1?'s':''}</div>
              {filledRows.map((r,i)=>(
                <div key={r.id} style={{marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:9,color:'#34d399',fontWeight:900}}>✓</span>
                  <span style={{fontSize:11,color:CLR+'99'}}>{r.mechanic}</span>
                  <span style={{fontSize:10,color:'#334155'}}>→ {r.emotion||'…'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — form */}
        <div style={{flex:1,overflowY:'auto',padding:'24px 28px',display:'flex',flexDirection:'column',gap:20}}>

          {/* STEP 0 — Concept */}
          {step===0&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Ash & Despain (2016): </strong>
              A harmonia ludonarrativa é alcançada quando mecânicas e narrativa trabalham em sincronia, criando uma história unificada. Comece pelo high concept e pela abordagem narrativa.
            </div>

            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>🎯 High Concept Statement <span style={{color:'#ef4444'}}>*</span></div>
              <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:10}}>Uma frase que captura o núcleo da experiência: o que o jogador faz, em que contexto e com qual propósito. Ex: "o jogador deve navegar por um ambiente escuro com uma luz em busca de conhecimento."</div>
              <TA value={highConcept} onChange={setHighConcept} placeholder={'O jogador deve [ação principal] em [contexto] para [propósito narrativo]...'} rows={2}/>
            </div>

            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:10,textTransform:'uppercase'}}>🧭 Abordagem Narrativa</div>
              <div style={{display:'flex',gap:10,marginBottom:12}}>
                {[{id:'player',icon:'🌊',label:'Dirigida pelo Jogador',sub:'Narrativa emergente — o jogador é o agente direto da história (Journey)'},
                  {id:'designer',icon:'🎬',label:'Dirigida pelo Designer',sub:'Narrativa embutida — o designer dirige a experiência com objetivo singular (The Stanley Parable)'},
                  {id:'hybrid',icon:'⚖️',label:'Híbrida',sub:'Mix de emergente e embutida — jogador escolhe como, designer define aonde'},
                ].map(a=>(
                  <div key={a.id} onClick={()=>setApproach(a.id)}
                    style={{flex:1,background:approach===a.id?CLR+'12':'transparent',border:'1px solid '+(approach===a.id?CLR:CLR+'25'),borderRadius:10,padding:'12px',cursor:'pointer',transition:'all .2s'}}>
                    <div style={{fontSize:18,marginBottom:6}}>{a.icon}</div>
                    <div style={{fontWeight:700,fontSize:11,color:approach===a.id?CLR:'var(--gdd-dim)',marginBottom:4}}>{a.label}</div>
                    <div style={{fontSize:10,color:'var(--gdd-muted)',lineHeight:1.5}}>{a.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>💡 Tema Central</div>
              <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:10}}>O tema é a cola que une mecânicas e narrativa. Exemplos do paper: "nunca desista", "fuga e ascensão", "conhecimento tem poder".</div>
              <TA value={theme} onChange={setTheme} placeholder={'Qual é a mensagem ou sentimento central que une todas as mecânicas e a história?'} rows={2}/>
            </div>
          </>)}

          {/* STEP 1 — Analysis */}
          {step===1&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Loop Ludonarrativo: </strong>
              Para cada mecânica, preencha os 4 elementos. O loop se fecha quando a emoção gerada leva o jogador de volta à mecânica. Use verbos no gerúndio para mecânicas, infinitivos para narrativa.
            </div>

            {rows.map((row,idx)=>(
              <div key={row.id} onClick={()=>setActiveRow(idx)}
                style={{background:'var(--gdd-bg2)',border:'1px solid '+(activeRow===idx?CLR+'55':'var(--gdd-border2)'),borderRadius:12,padding:'16px 18px',cursor:'pointer',transition:'border-color .2s'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <span style={{fontWeight:800,fontSize:13,color:activeRow===idx?CLR:'var(--gdd-dim)'}}>Loop {idx+1}</span>
                  {row.mechanic&&<span style={{fontSize:10,background:CLR+'18',color:CLR,border:'1px solid '+CLR+'30',borderRadius:5,padding:'1px 7px'}}>{row.mechanic.slice(0,20)}</span>}
                  {rows.length>1&&<button onClick={e=>{e.stopPropagation();removeRow(idx);setActiveRow(Math.max(0,idx-1));}} style={{marginLeft:'auto',background:'none',border:'none',color:'#334155',cursor:'pointer',fontSize:12,padding:'2px 6px',borderRadius:4}}>✕</button>}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  {[
                    {field:'mechanic',  label:'① Mecânica',  color:'#fbbf24', hint:'O que o jogador faz — verbo gerúndio (ex: andando, pulando, coletando)'},
                    {field:'narrative', label:'② Narrativa',  color:'#34d399', hint:'Por que faz — propósito diegético (ex: explorar um ambiente desconhecido)'},
                    {field:'context',   label:'③ Contexto',   color:'#22d3ee', hint:'Onde/como acontece no espaço de jogo (ex: travessar um abismo escuro)'},
                    {field:'emotion',   label:'④ Emoção',     color:CLR,       hint:'O que o jogador sente (ex: mistério, fiero, maravilha, ambiguidade)'},
                  ].map(f=>(
                    <div key={f.field}>
                      <div style={{fontSize:10,color:f.color,fontWeight:700,letterSpacing:1,marginBottom:5,textTransform:'uppercase'}}>{f.label}</div>
                      <div style={{fontSize:10,color:'#334155',marginBottom:5,fontStyle:'italic',lineHeight:1.4}}>{f.hint}</div>
                      <TA value={row[f.field]} onChange={v=>{updateRow(idx,f.field,v);setActiveRow(idx);}} placeholder={f.hint} rows={2}/>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={addRow} style={S.btn(CLR+'18',CLR,{border:'1px dashed '+CLR+'44',borderRadius:10,padding:'12px',fontSize:12,display:'flex',alignItems:'center',gap:8,justifyContent:'center'})}>
              <span style={{fontSize:16}}>+</span> Adicionar nova mecânica
            </button>
          </>)}

          {/* STEP 2 — Interactions */}
          {step===2&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Interações: </strong>
              Como os loops individuais se encadeiam? A emoção do último nó de cada loop deve alimentar o próximo loop — criando um fluxo ludonarrativo contínuo.
            </div>

            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>🔄 Core Game Loop <span style={{color:'#ef4444'}}>*</span></div>
              <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:10}}>Liste as mecânicas na ordem em que se encadeiam no segundo a segundo. Ex: "Andar → Iluminar → Escutar → Pular → Coletar"</div>
              <TA value={coreLoop} onChange={setCoreLoop} placeholder={'Mecânica A → Mecânica B → Mecânica C → ...'} rows={2}/>
            </div>

            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>💬 Frases do Loop Ludonarrativo</div>
              <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:10}}>Escreva cada loop como uma frase: "[Mecânica] para [narrativa] em/com [contexto] criando [emoção]". Essas frases revelam dissonâncias.</div>
              {filledRows.length>0&&(
                <div style={{marginBottom:10,display:'flex',flexDirection:'column',gap:4}}>
                  {filledRows.map((r,i)=>(
                    <div key={r.id} style={{fontSize:11,color:CLR+'88',background:CLR+'08',borderRadius:6,padding:'6px 10px',fontStyle:'italic',lineHeight:1.6}}>
                      Sugerida: <em>{r.mechanic} para {r.narrative}{r.context?' em '+r.context:''}{r.emotion?', gerando '+r.emotion:''}.</em>
                    </div>
                  ))}
                </div>
              )}
              <TA value={flowSentences} onChange={setFlowSentences} placeholder={'Escreva as frases finais de cada loop e como elas se encadeiam...'} rows={5}/>
            </div>

            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>🔁 Loop Momento a Momento</div>
              <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:10}}>Como o loop funciona ao longo de uma sessão completa? O que acontece após o estado de sucesso — como o jogador é lançado de volta ao início do loop com nova motivação?</div>
              <TA value={momentLoop} onChange={setMomentLoop} placeholder={'Descreva o loop completo de uma sessão: objetivo → ação → sucesso → novo objetivo...'} rows={4}/>
            </div>
          </>)}

          {/* STEP 3 — Synergy */}
          {step===3&&(<>
            <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
              <strong style={{color:CLR}}>Sinergia: </strong>
              Cada mecânica precisa de um sistema que suporte sua narrativa. Se um sistema não suporta o loop, cria dissonância — mesmo que o gameplay funcione tecnicamente.
            </div>

            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>⚙️ Sistemas de Suporte</div>
              <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:10}}>Para cada mecânica, qual sistema a suporta? Ex: "Ouvir → Geiger Counter System (cliques de distância). Coletar → Rune Collection System (visual + feedback ao extrair)."</div>
              {filledRows.length>0&&(
                <div style={{marginBottom:10,display:'flex',flexDirection:'column',gap:5}}>
                  {filledRows.map((r,i)=>(
                    <div key={r.id} style={{fontSize:11,color:'var(--gdd-muted)',display:'flex',alignItems:'center',gap:6}}>
                      <span style={{color:CLR+'88',fontWeight:700,minWidth:90,flexShrink:0}}>{r.mechanic||`Mec. ${i+1}`}</span>
                      <span style={{color:'var(--gdd-border)'}}>→</span>
                      <span style={{color:'#334155',fontStyle:'italic'}}>sistema necessário?</span>
                    </div>
                  ))}
                </div>
              )}
              <TA value={systems} onChange={setSystems} placeholder={'Mecânica → Sistema que suporta sua narrativa\nEx:\nAndando → First-Person Movement System\nOuvindo → Geiger Counter System...'} rows={6}/>
            </div>

            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>🗺️ Ambiente & Level Design</div>
              <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:10}}>Como o design do espaço sustenta a harmonia ludonarrativa? A arquitetura do nível deve reforçar, não contradizer, as narrativas das mecânicas.</div>
              <TA value={envConsiderations} onChange={setEnvConsiderations} placeholder={'Como o design de nível reforça as mecânicas e a narrativa? Sightlines, progressão espacial, ritmo de encontros...'} rows={4}/>
            </div>

            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>⚠️ Checklist de Dissonância</div>
              <div style={{fontSize:11,color:'var(--gdd-muted)',lineHeight:1.6,marginBottom:10}}>Avalie cada mecânica: algum sistema ou elemento de ambiente cria conflito de contexto? Alguma nova mecânica substitui o propósito de outra (como o sonar substituiria a luz e o Geiger Counter)?</div>
              <TA value={dissonanceCheck} onChange={setDissonanceCheck} placeholder={'Liste possíveis dissonâncias identificadas e como foram ou serão resolvidas...'} rows={4}/>
            </div>
          </>)}

          {/* STEP 4 — Compile */}
          {step===4&&(
            <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center',justifyContent:'center',flex:1,textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:52}}>📖</div>
              <div style={{fontWeight:800,fontSize:20,color:CLR}}>Design narrativo documentado!</div>
              <div style={{color:'var(--gdd-dim)',fontSize:13,maxWidth:440,lineHeight:1.7}}>O documento captura seu modelo ludonarrativo completo — loops, interações e sinergia.</div>
              {highConcept&&<div style={{background:CLR+'10',border:'1px solid '+CLR+'30',borderRadius:10,padding:'12px 18px',maxWidth:420,width:'100%',fontSize:13,color:CLR,fontStyle:'italic'}}>🎯 "{highConcept}"</div>}
              <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 20px',width:'100%',maxWidth:420}}>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {[{label:'High Concept',ok:!!highConcept},{label:'Abordagem',ok:!!approach},{label:'Loops de análise',ok:filledRows.length>0,count:filledRows.length},{label:'Core game loop',ok:!!coreLoop},{label:'Sistemas',ok:!!systems}].map(({label,ok,count})=>(
                    <div key={label} style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:10,color:ok?'#34d399':'#334155',fontWeight:900}}>{ok?'✓':'○'}</span>
                      <span style={{fontSize:12,color:ok?'var(--gdd-muted)':'#334155'}}>{label}</span>
                      {count&&<span style={{fontSize:10,background:CLR+'18',color:CLR,borderRadius:4,padding:'1px 6px'}}>{count}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── WorldbuildingGuide helpers (defined OUTSIDE to avoid remount on each render)
const WB_CLR='#22d3ee';

// ── WorldbuildingGuide ────────────────────────────────────────────────────────
function ReedsyWorldbuildingGuide({project,pData,setPData,onBack,onDocCreated}){
  const CLR=WB_CLR;
  const [step,setStep]=useState(0);
  const [docTitle,setDocTitle]=useState('Worldbuilding — '+project.name);

  // Step 0 — Basics
  const [worldName,setWorldName]=useState('');
  const [population,setPopulation]=useState('');
  const [setting,setSetting]=useState('');
  const [logline,setLogline]=useState('');

  // Step 1 — Geography
  const [naturalWorld,setNaturalWorld]=useState('');
  const [floraFauna,setFloraFauna]=useState('');
  const [landscape,setLandscape]=useState('');
  const [locations,setLocations]=useState('');
  const [weather,setWeather]=useState('');

  // Step 2 — People
  const [races,setRaces]=useState('');
  const [languages,setLanguages]=useState('');
  const [socialFrameworks,setSocialFrameworks]=useState('');
  const [customs,setCustoms]=useState('');

  // Step 3 — Civilization
  const [history,setHistory]=useState('');
  const [culture,setCulture]=useState('');
  const [religion,setReligion]=useState('');
  const [education,setEducation]=useState('');
  const [leisure,setLeisure]=useState('');

  // Step 4 — Technology, Magic & Weapons
  const [magicSystem,setMagicSystem]=useState('');
  const [technology,setTechnology]=useState('');
  const [weaponry,setWeaponry]=useState('');

  // Step 5 — Economy
  const [economics,setEconomics]=useState('');
  const [tradeCommerce,setTradeCommerce]=useState('');
  const [transportation,setTransportation]=useState('');

  // Step 6 — Politics
  const [government,setGovernment]=useState('');
  const [law,setLaw]=useState('');
  const [warSystems,setWarSystems]=useState('');

  const STEPS=[
    {label:'Básico',icon:'🌍'},
    {label:'Geografia',icon:'🗺️'},
    {label:'Povos',icon:'👥'},
    {label:'Civilização',icon:'🏛️'},
    {label:'Magia & Tech',icon:'⚗️'},
    {label:'Economia',icon:'💰'},
    {label:'Política',icon:'⚖️'},
    {label:'Compilar',icon:'✨'},
  ];
  const TOTAL=STEPS.length;

  const compile=()=>{
    let html='';
    const h2=t=>`<h2>${t}</h2>`;
    const h3=t=>`<h3>${t}</h3>`;
    const p=t=>t?`<p>${t}</p>`:'';
    const badge=`<p><em>Criado com o Guia de Worldbuilding</em></p><hr>`;

    html+=badge;

    if(worldName||population||setting||logline){
      html+=h2('🌍 Parte 1 — Básico');
      if(worldName) html+=`<p><strong>Nome do mundo:</strong> ${worldName}</p>`;
      if(setting)   html+=`<p><strong>Ambientação:</strong> ${setting}</p>`;
      if(population)html+=`<p><strong>População estimada:</strong> ${population}</p>`;
      if(logline)   html+=`<p><strong>Em uma frase:</strong> ${logline}</p>`;
    }

    if(naturalWorld||floraFauna||landscape||locations||weather){
      html+=h2('🗺️ Parte 2 — Geografia');
      if(naturalWorld){html+=h3('Mundo Natural');html+=p(naturalWorld);}
      if(floraFauna) {html+=h3('Flora e Fauna'); html+=p(floraFauna);}
      if(landscape)  {html+=h3('Paisagem');       html+=p(landscape);}
      if(locations)  {html+=h3('Locais de Destaque');html+=p(locations);}
      if(weather)    {html+=h3('Clima e Estações');  html+=p(weather);}
    }

    if(races||languages||socialFrameworks||customs){
      html+=h2('👥 Parte 3 — Povos');
      if(races)            {html+=h3('Raças e Espécies');      html+=p(races);}
      if(languages)        {html+=h3('Idiomas');               html+=p(languages);}
      if(socialFrameworks) {html+=h3('Estruturas Sociais');    html+=p(socialFrameworks);}
      if(customs)          {html+=h3('Costumes e Rituais');    html+=p(customs);}
    }

    if(history||culture||religion||education||leisure){
      html+=h2('🏛️ Parte 4 — Civilização');
      if(history)   {html+=h3('História');  html+=p(history);}
      if(culture)   {html+=h3('Cultura');   html+=p(culture);}
      if(religion)  {html+=h3('Religião');  html+=p(religion);}
      if(education) {html+=h3('Educação');  html+=p(education);}
      if(leisure)   {html+=h3('Lazer');     html+=p(leisure);}
    }

    if(magicSystem||technology||weaponry){
      html+=h2('⚗️ Parte 5 — Tecnologia, Magia e Armamentos');
      if(magicSystem) {html+=h3('Sistema de Magia'); html+=p(magicSystem);}
      if(technology)  {html+=h3('Tecnologia');       html+=p(technology);}
      if(weaponry)    {html+=h3('Armamentos');        html+=p(weaponry);}
    }

    if(economics||tradeCommerce||transportation){
      html+=h2('💰 Parte 6 — Economia');
      if(economics)      {html+=h3('Sistema Econômico'); html+=p(economics);}
      if(tradeCommerce)  {html+=h3('Comércio');           html+=p(tradeCommerce);}
      if(transportation) {html+=h3('Transporte');         html+=p(transportation);}
    }

    if(government||law||warSystems){
      html+=h2('⚖️ Parte 7 — Política');
      if(government)  {html+=h3('Governo');    html+=p(government);}
      if(law)         {html+=h3('Lei');         html+=p(law);}
      if(warSystems)  {html+=h3('Sistemas de Guerra'); html+=p(warSystems);}
    }

    const pId=project.id,mId='worldbuilding',curr=pData?.[pId]?.[mId]||{docs:[]};
    const doc={id:Math.random().toString(36).slice(2,9),title:docTitle.trim()||'Worldbuilding',content:html,messages:[],status:'progress',createdAt:new Date().toLocaleDateString('pt-BR'),updatedAt:null,framework:'reedsy-wb'};
    setPData(p=>({...p,[pId]:{...(p[pId]||{}),[mId]:{...curr,docs:[...(curr.docs||[]),doc]}}}));
    onDocCreated(doc);
  };

  const filledSteps=[
    !!(worldName||logline),
    !!(naturalWorld||landscape||locations),
    !!(races||languages),
    !!(history||culture),
    !!(magicSystem||technology),
    !!(economics||tradeCommerce),
    !!(government||law),
  ];
  const canNext=step<TOTAL-1;
  const canPrev=step>0;

  return(
    <div style={{minHeight:'100vh',background:'var(--gdd-bg)',color:'var(--gdd-text)',fontFamily:'system-ui,sans-serif',fontSize:14,display:'flex',flexDirection:'column'}}>
      {/* Header */}
      <div style={{padding:'0 20px',height:54,borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',gap:12,background:'var(--gdd-bg)',flexShrink:0,position:'sticky',top:0,zIndex:20}}>
        <button style={S.back} onClick={onBack}>← Voltar</button>
        <span style={{color:CLR,fontWeight:800,fontSize:14}}>🌍 Guia de Worldbuilding</span>
        <span style={{marginLeft:'auto',fontSize:12,color:'var(--gdd-muted)'}}>Passo {step+1} de {TOTAL}</span>
      </div>

      {/* Step indicators */}
      <div style={{display:'flex',padding:'10px 20px',gap:5,borderBottom:'1px solid '+'var(--gdd-border2)',background:'var(--gdd-bg0)',overflowX:'auto',flexShrink:0}}>
        {STEPS.map((s,i)=>(
          <button key={i} onClick={()=>setStep(i)}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'6px 12px',borderRadius:8,border:'1px solid '+(i===step?CLR:filledSteps[i]?CLR+'44':'var(--gdd-border2)'),background:i===step?CLR+'18':'transparent',cursor:'pointer',flexShrink:0,transition:'all .15s'}}>
            <span style={{fontSize:14}}>{s.icon}</span>
            <span style={{fontSize:10,color:i===step?CLR:filledSteps[i]?CLR+'88':'#334155',fontWeight:700,whiteSpace:'nowrap'}}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:'auto',padding:'24px 20px',maxWidth:720,width:'100%',margin:'0 auto',boxSizing:'border-box'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>

          {/* Context tip */}
          <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
            <strong style={{color:CLR}}>Guia de Worldbuilding: </strong>
            {step===0&&'Comece com os fundamentos — o nome, a escala e a proposta central do seu mundo.'}
            {step===1&&'A geografia define como as pessoas vivem, se deslocam e interagem. Inclua o que for relevante para o seu jogo.'}
            {step===2&&'Os povos são o coração do worldbuilding — suas diferenças, línguas e estruturas sociais criam conflito e profundidade.'}
            {step===3&&'Civilização é o resultado acumulado de história, crenças e cultura. Preencha o que molda diretamente seu gameplay ou narrativa.'}
            {step===4&&'Magia e tecnologia são sistemas de poder — definam suas regras, limites e como a sociedade reage a eles.'}
            {step===5&&'Economia molda quem tem poder e por quê. Moeda, comércio e transporte conectam o mundo internamente.'}
            {step===6&&'Política determina quem manda e como conflitos são resolvidos — ou não. Essencial para narrativas com tensão externa.'}
            {step===7&&'Revise o nome do documento e clique em "Criar Documento". Você poderá continuar editando com a IA depois.'}
          </div>

          {/* STEP 0 — Basics */}
          {step===0&&(<>
            <WbField label="Nome do Mundo" hint="Como se chama o universo ou planeta onde a história se passa?" value={worldName} onChange={setWorldName} placeholder="Ex: Aetherion, Terra do Eterno Crepúsculo, Nexus-7..." rows={1}/>
            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>Tipo de Ambientação</div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                {[{id:'earth',label:'🌎 Terra Real'},{id:'alt-earth',label:'🌀 Terra Alternativa'},{id:'other',label:'🪐 Outro Planeta / Universo'}].map(o=>(
                  <div key={o.id} onClick={()=>setSetting(o.label)}
                    style={{flex:'1 1 140px',background:setting===o.label?CLR+'18':'transparent',border:'1px solid '+(setting===o.label?CLR:CLR+'25'),borderRadius:10,padding:'12px',cursor:'pointer',textAlign:'center',transition:'all .2s'}}>
                    <div style={{fontSize:12,fontWeight:700,color:setting===o.label?CLR:'var(--gdd-dim)'}}>{o.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <WbField label="População Estimada" hint="Quanto habitam este mundo? Dê uma ordem de grandeza." value={population} onChange={setPopulation} placeholder="Ex: ~2 bilhões, algumas centenas de milhares, desconhecida..." rows={1}/>
            <WbField label="Em Uma Frase" hint="Descreva o seu mundo com uma única frase que capture sua essência." value={logline} onChange={setLogline} placeholder="Um mundo onde a magia está se extinguindo e as facções humanas disputam os últimos fragmentos de poder..." rows={2}/>
          </>)}

          {/* STEP 1 — Geography */}
          {step===1&&(<>
            <WbField label="Mundo Natural" hint="Como o mundo foi criado? Como funcionam as leis físicas? Que corpos celestes existem?" value={naturalWorld} onChange={setNaturalWorld} placeholder="Descreva a cosmologia, física e origem do mundo..."/>
            <WbField label="Flora e Fauna" hint="Que criaturas e plantas existem? Alguma tem propriedades especiais ou mágicas?" value={floraFauna} onChange={setFloraFauna} placeholder="Descreva criaturas notáveis, ecossistemas, plantas com poderes ou perigos..."/>
            <WbField label="Paisagem e Biomas" hint="Onde ficam as montanhas, florestas, desertos, mares? Como o terreno interage com os habitantes?" value={landscape} onChange={setLandscape} placeholder="Descreva as regiões geográficas e como elas moldam a vida dos habitantes..."/>
            <WbField label="Locais de Destaque" hint="Quais são as grandes cidades, capitais, portos? Como o mundo está dividido geograficamente?" value={locations} onChange={setLocations} placeholder="Liste cidades importantes, capitais, locais sagrados ou estratégicos..." rows={4}/>
            <WbField label="Clima e Estações" hint="Que processos movem o clima? Que regiões são mais vulneráveis a eventos climáticos?" value={weather} onChange={setWeather} placeholder="Descreva o clima, as estações e fenômenos climáticos notáveis..."/>
          </>)}

          {/* STEP 2 — People */}
          {step===2&&(<>
            <WbField label="Raças e Espécies" hint="Que espécies inteligentes habitam o mundo? Como surgiran? Como coexistem?" value={races} onChange={setRaces} placeholder="Descreva as principais raças, espécies e suas relações entre si..."/>
            <WbField label="Idiomas" hint="Quantos idiomas existem? Qual é o mais falado? Há um idioma universal?" value={languages} onChange={setLanguages} placeholder="Descreva os idiomas, convenções de nomeação e diferenças regionais de sotaque..."/>
            <WbField label="Estruturas Sociais" hint="Que estruturas sociais sustentam as comunidades? Há castas? Patriarcado ou matriarcado?" value={socialFrameworks} onChange={setSocialFrameworks} placeholder="Descreva hierarquias sociais, classes, sistemas de família e tabus..."/>
            <WbField label="Costumes e Rituais" hint="Há ritos de passagem, tradições de morte, cerimônias de casamento? Que festas existem?" value={customs} onChange={setCustoms} placeholder="Descreva os principais costumes, rituais e festivais do mundo..."/>
          </>)}

          {/* STEP 3 — Civilization */}
          {step===3&&(<>
            <WbField label="História" hint="Como a civilização começou? Quais foram as guerras e eras mais marcantes?" value={history} onChange={setHistory} placeholder="Descreva as eras históricas, guerras e eventos que moldaram o presente..."/>
            <WbField label="Cultura" hint="O que define cada cultura? Arte, música, literatura — o que é celebrado ou proibido?" value={culture} onChange={setCulture} placeholder="Descreva culinária, vestuário, artes e o que os povos mais valorizam..."/>
            <WbField label="Religião" hint="Como as pessoas adoram? Que deuses e textos sagrados existem? Quem são os profetas?" value={religion} onChange={setReligion} placeholder="Descreva deidades, práticas religiosas, textos sagrados e figuras religiosas..."/>
            <WbField label="Educação" hint="A educação formal existe? Quem pode acessá-la? Qual é a taxa de alfabetização?" value={education} onChange={setEducation} placeholder="Descreva como o conhecimento é transmitido e quem tem acesso a ele..."/>
            <WbField label="Lazer e Entretenimento" hint="Como as pessoas passam o tempo livre? Há esportes organizados? Que formas de arte existem?" value={leisure} onChange={setLeisure} placeholder="Descreva passatempos, esportes, jogos e formas de entretenimento..."/>
          </>)}

          {/* STEP 4 — Magic, Tech & Weapons */}
          {step===4&&(<>
            <WbField label="Sistema de Magia" hint="Para que a magia é usada? Quem pode usá-la? Quais são seus limites e consequências?" value={magicSystem} onChange={setMagicSystem} placeholder="Descreva a origem da magia, quem a pratica, regras e restrições..."/>
            <WbField label="Tecnologia" hint="Qual é o nível tecnológico? Como tecnologia e magia coexistem?" value={technology} onChange={setTechnology} placeholder="Descreva o nível tecnológico e como ele impacta transporte, comunicação e medicina..."/>
            <WbField label="Armamentos" hint="Que armas predominam e por quê? Há armas especiais ou sagradas?" value={weaponry} onChange={setWeaponry} placeholder="Descreva armas comuns, quem as fabrica e se há armas lendárias ou restritas..."/>
          </>)}

          {/* STEP 5 — Economy */}
          {step===5&&(<>
            <WbField label="Sistema Econômico" hint="O mundo opera numa economia de mercado? Feudalismo? Socialismo? Há banco central?" value={economics} onChange={setEconomics} placeholder="Descreva o sistema econômico, moedas e como o governo regula os negócios..."/>
            <WbField label="Comércio e Moeda" hint="Como o comércio é facilitado? Que regiões são aliadas ou parceiras comerciais?" value={tradeCommerce} onChange={setTradeCommerce} placeholder="Descreva moedas, mercados, guildas, exportações e importações principais..."/>
            <WbField label="Transporte e Comunicação" hint="Como é fácil viajar dentro e fora das cidades? Como a informação se dissemina?" value={transportation} onChange={setTransportation} placeholder="Descreva meios de transporte, estradas, rotas comerciais e comunicação..."/>
          </>)}

          {/* STEP 6 — Politics */}
          {step===6&&(<>
            <WbField label="Governo" hint="Que forma de governo existe? Monarquia? República? Teocracia? É confiado pelo povo?" value={government} onChange={setGovernment} placeholder="Descreva a estrutura de poder, líderes e esfera de influência do governo..."/>
            <WbField label="Lei e Justiça" hint="Qual é o estado de direito? Como a lei é aplicada? Quais são os crimes mais graves?" value={law} onChange={setLaw} placeholder="Descreva o sistema jurídico, punições e como as pessoas são julgadas..."/>
            <WbField label="Sistemas de Guerra" hint="Como a guerra é declarada? Qual é a estrutura de comando do exército?" value={warSystems} onChange={setWarSystems} placeholder="Descreva como conflitos armados funcionam, o tamanho do exército e alianças militares..."/>
          </>)}

          {/* STEP 7 — Compile */}
          {step===7&&(
            <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center',textAlign:'center',padding:'10px 0'}}>
              <div style={{fontSize:52}}>🌍</div>
              <div style={{fontWeight:800,fontSize:20,color:CLR}}>Seu mundo está pronto para ganhar vida!</div>
              <div style={{color:'var(--gdd-dim)',fontSize:13,maxWidth:440,lineHeight:1.7}}>O documento compilará tudo que você preencheu. Continue editando e expandindo com a IA depois.</div>
              <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 20px',width:'100%',maxWidth:440}}>
                <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:12,textTransform:'uppercase'}}>Nome do documento</div>
                <input value={docTitle} onChange={e=>setDocTitle(e.target.value)}
                  style={{background:'var(--gdd-bg)',border:'1px solid '+'var(--gdd-border)',borderRadius:8,padding:'10px 14px',color:'var(--gdd-text)',fontSize:14,outline:'none',width:'100%',boxSizing:'border-box'}}
                  onFocus={e=>e.target.style.borderColor=CLR} onBlur={e=>e.target.style.borderColor='var(--gdd-border)'}/>
              </div>
              <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 20px',width:'100%',maxWidth:440}}>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {[
                    {label:'Básico',ok:!!(worldName||logline)},
                    {label:'Geografia',ok:!!(naturalWorld||landscape)},
                    {label:'Povos',ok:!!(races||languages)},
                    {label:'Civilização',ok:!!(history||culture)},
                    {label:'Magia & Tech',ok:!!(magicSystem||technology)},
                    {label:'Economia',ok:!!(economics||tradeCommerce)},
                    {label:'Política',ok:!!(government||law)},
                  ].map(({label,ok})=>(
                    <div key={label} style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:10,color:ok?'#34d399':'#334155',fontWeight:900}}>{ok?'✓':'○'}</span>
                      <span style={{fontSize:12,color:ok?'var(--gdd-muted)':'#475569'}}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button style={S.btn(CLR,'#000',{padding:'13px 36px',fontSize:15,borderRadius:12,fontWeight:800})} onClick={compile}>
                ✨ Criar Documento de Worldbuilding
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer nav */}
      {step<TOTAL-1&&(
        <div style={{padding:'14px 20px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',justifyContent:'space-between',background:'var(--gdd-bg)',flexShrink:0}}>
          <button style={S.btn('var(--gdd-border)','var(--gdd-dim)')} onClick={()=>canPrev&&setStep(s=>s-1)} disabled={!canPrev}>← Anterior</button>
          <button style={S.btn(CLR,'#000',{fontWeight:800})} onClick={()=>canNext&&setStep(s=>s+1)}>Próximo →</button>
        </div>
      )}
      {step===TOTAL-1&&(
        <div style={{padding:'14px 20px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',justifyContent:'flex-start',background:'var(--gdd-bg)',flexShrink:0}}>
          <button style={S.btn('var(--gdd-border)','var(--gdd-dim)')} onClick={()=>setStep(s=>s-1)}>← Anterior</button>
        </div>
      )}
    </div>
  );
}

// ── FlowBuilder ───────────────────────────────────────────────────────────────
// Calcula w/h da node com base no texto — garante que nenhum label seja truncado
function fbAutoSize(type, label){
  const def=FB_DEFS[type];
  const FONT_W=6.8; // largura aproximada por caractere em px (fonte 12px system-ui)
  const PAD_X=28;   // padding horizontal total
  const PAD_Y=20;   // padding vertical total
  const lines=label.split('\n');
  const maxChars=Math.max(...lines.map(l=>l.length));
  const rawW=Math.ceil(maxChars*FONT_W)+PAD_X;
  const rawH=lines.length*18+PAD_Y;
  // decisão tem geometria de losango — precisa de mais espaço
  const extraW=type==='decision'?24:0;
  const extraH=type==='decision'?24:0;
  return{
    w:Math.max(def.w, rawW+extraW),
    h:Math.max(def.h, rawH+extraH),
  };
}

function fbPortAbs(node,port){
  const d=FB_DEFS[node.type],w=node.w||d.w,h=node.h||d.h;
  if(port==='top')    return[node.x+w/2, node.y];
  if(port==='right')  return[node.x+w,   node.y+h/2];
  if(port==='bottom') return[node.x+w/2, node.y+h];
  return[node.x,       node.y+h/2];
}
function fbPortRel(type,w,h,port){
  if(port==='top')    return[w/2,0];
  if(port==='right')  return[w,  h/2];
  if(port==='bottom') return[w/2,h];
  return[0,h/2];
}
function fbEdgePath(n1,fp,n2,tp){
  const[ax,ay]=fbPortAbs(n1,fp),[bx,by]=fbPortAbs(n2,tp);
  const str=Math.max(60,Math.hypot(ax-bx,ay-by)*0.45);
  const tang=(p,px,py)=>{
    if(p==='top')    return[px,py-str];
    if(p==='bottom') return[px,py+str];
    if(p==='left')   return[px-str,py];
    return[px+str,py];
  };
  const[c1x,c1y]=tang(fp,ax,ay),[c2x,c2y]=tang(tp,bx,by);
  return`M${ax},${ay} C${c1x},${c1y} ${c2x},${c2y} ${bx},${by}`;
}
function FbShape({type,w,h,color,sel}){
  const fill=color+'1e',stroke=sel?color:color+'70',sw=sel?2.5:1.5;
  if(type==='start'||type==='end')
    return (<rect width={w} height={h} rx={h/2} fill={fill} stroke={stroke} strokeWidth={sw}/>);
  if(type==='process')
    return (<rect width={w} height={h} rx={5} fill={fill} stroke={stroke} strokeWidth={sw}/>);
  if(type==='decision'){
    const pts=`${w/2},1 ${w-1},${h/2} ${w/2},${h-1} 1,${h/2}`;
    return (<polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw}/>);
  }
  if(type==='io'){
    const sk=13,pts=`${sk},0 ${w},0 ${w-sk},${h} 0,${h}`;
    return (<polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw}/>);
  }
  if(type==='sub')return (
    <g>
      <rect width={w} height={h} rx={5} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <line x1={9} y1={0} x2={9} y2={h} stroke={stroke} strokeWidth={1} opacity={0.5}/>
      <line x1={w-9} y1={0} x2={w-9} y2={h} stroke={stroke} strokeWidth={1} opacity={0.5}/>
    </g>
  );
  if(type==='note'){
    const n=14;
    return (
      <g>
        <polygon points={`0,0 ${w-n},0 ${w},${n} ${w},${h} 0,${h}`} fill={fill} stroke={stroke} strokeWidth={sw}/>
        <polyline points={`${w-n},0 ${w-n},${n} ${w},${n}`} fill="none" stroke={stroke} strokeWidth={sw}/>
      </g>
    );
  }
  return (<rect width={w} height={h} rx={5} fill={fill} stroke={stroke} strokeWidth={sw}/>);
}
function FbNodePreview({type,color}){
  const fill=color+'22',stroke=color+'88';
  if(type==='decision')return (<svg width={22} height={18} viewBox="0 0 22 18"><polygon points="11,1 21,9 11,17 1,9" fill={fill} stroke={stroke} strokeWidth={1.5}/></svg>);
  if(type==='io')return (<svg width={24} height={16} viewBox="0 0 24 16"><polygon points="5,0 24,0 19,16 0,16" fill={fill} stroke={stroke} strokeWidth={1.5}/></svg>);
  if(type==='sub')return (<svg width={24} height={16} viewBox="0 0 24 16"><rect width={24} height={16} rx={3} fill={fill} stroke={stroke} strokeWidth={1.5}/><line x1={5} y1={0} x2={5} y2={16} stroke={stroke} strokeWidth={1}/><line x1={19} y1={0} x2={19} y2={16} stroke={stroke} strokeWidth={1}/></svg>);
  if(type==='note')return (<svg width={24} height={16} viewBox="0 0 24 16"><polygon points="0,0 18,0 24,6 24,16 0,16" fill={fill} stroke={stroke} strokeWidth={1.5}/></svg>);
  if(type==='start'||type==='end')return (<svg width={28} height={16} viewBox="0 0 28 16"><rect width={28} height={16} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5}/></svg>);
  return (<svg width={24} height={16} viewBox="0 0 24 16"><rect width={24} height={16} rx={3} fill={fill} stroke={stroke} strokeWidth={1.5}/></svg>);
}

function FlowBuilder({project,pData,setPData,doc,onBack,lang='pt'}:{project: Project; pData: ProjectData; setPData: SetProjectData; doc: Document | null; onBack: () => void; lang?: LangKey}){
  const CLR='#f472b6';
  const [nodes,setNodes]=useState<FlowNode[]>(()=>doc?.flowData?.nodes||[]);
  const [edges,setEdges]=useState<FlowEdge[]>(()=>doc?.flowData?.edges||[]);
  const [selected,setSelected]=useState<FlowSelection>(null);
  const [dragging,setDragging]=useState<FlowDragging>(null);
  const [connecting,setConnecting]=useState<FlowConnecting>(null);
  const [editingId,setEditingId]=useState<string | null>(null);
  const [editLabel,setEditLabel]=useState('');
  const [pan,setPan]=useState({x:100,y:80});
  const [zoom,setZoom]=useState(1);
  const [panning,setPanning]=useState<FlowPanning>(null);
  const [title,setTitle]=useState(doc?.title||'Novo Fluxo');
  const [editingTitle,setEditingTitle]=useState(false);
  const [saved,setSaved]=useState(true);
  // ── Reference panel state ──
  const [refPanelOpen,setRefPanelOpen]=useState(false);
  const [refDoc,setRefDoc]=useState<Document | null>(null);
  const [refMod,setRefMod]=useState<ModuleMeta | null>(null);
  const [showDocPicker,setShowDocPicker]=useState(false);
  const [pickerMod,setPickerMod]=useState<ModuleMeta | null>(null);
  const svgRef=useRef<SVGSVGElement | null>(null);
  const docId=useRef(doc?.id||uid());

  // Recalcula tamanho de todos os nós ao montar (garante que dados pré-carregados também ficam corretos)
  useEffect(()=>{
    setNodes(ns=>ns.map(n=>{const{w,h}=fbAutoSize(n.type,n.label);return{...n,w,h};}));
  },[]);

  const saveFlow=useCallback(()=>{
    const mId='flowcharts',pId=project.id;
    const snap=`<p style="color:var(--gdd-muted);font-size:12px">${nodes.length} nó${nodes.length!==1?'s':''} · ${edges.length} conexão${edges.length!==1?'ões':''}</p>`;
    const updated={...(doc||{}),id:docId.current,title,flowData:{nodes,edges},content:snap,framework:'flowbuilder',updatedAt:todayStr(),status:doc?.status||'progress',createdAt:doc?.createdAt||todayStr()};
    setPData(prev=>{
      const curr=prev?.[pId]?.[mId]||{docs:[]};
      const exists=curr.docs.some(d=>d.id===docId.current);
      const docs=exists?curr.docs.map(d=>d.id===docId.current?updated:d):[...curr.docs,updated];
      return{...prev,[pId]:{...(prev?.[pId]||{}),[mId]:{...curr,docs}}};
    });
    setSaved(true);
  },[nodes,edges,title,project.id,doc,setPData]);

  useEffect(()=>{setSaved(false);},[nodes,edges,title]);

  useEffect(()=>{
    const h=e=>{
      if((e.key==='Delete'||e.key==='Backspace')&&selected&&!editingId&&!editingTitle){
        e.preventDefault();
        if(selected.type==='node'){setNodes(ns=>ns.filter(n=>n.id!==selected.id));setEdges(es=>es.filter(e=>e.from!==selected.id&&e.to!==selected.id));}
        else setEdges(es=>es.filter(e=>e.id!==selected.id));
        setSelected(null);
      }
      if(e.key==='Escape'){setEditingId(null);setConnecting(null);}
    };
    window.addEventListener('keydown',h);
    return()=>window.removeEventListener('keydown',h);
  },[selected,editingId,editingTitle]);

  const toCanvas=e=>{
    const r=svgRef.current?.getBoundingClientRect();
    if(!r)return{x:0,y:0};
    return{x:(e.clientX-r.left-pan.x)/zoom,y:(e.clientY-r.top-pan.y)/zoom};
  };

  const addNode=type=>{
    const d=FB_DEFS[type];
    const cx=(svgRef.current?.clientWidth||800)/2,cy=(svgRef.current?.clientHeight||500)/2;
    const x=(cx-pan.x)/zoom-d.w/2,y=(cy-pan.y)/zoom-d.h/2;
    const n={id:uid(),type,x,y,w:d.w,h:d.h,label:d.label};
    setNodes(ns=>[...ns,n]);
    setSelected({type:'node',id:n.id});
  };

  const onBgDown=e=>{
    if(e.target===svgRef.current||e.target.dataset.bg){
      setSelected(null);
      setPanning({sx:e.clientX,sy:e.clientY,sp:{...pan}});
    }
  };
  const onMove=e=>{
    if(panning)setPan({x:panning.sp.x+(e.clientX-panning.sx),y:panning.sp.y+(e.clientY-panning.sy)});
    if(dragging){const{x,y}=toCanvas(e);setNodes(ns=>ns.map(n=>n.id===dragging.id?{...n,x:x-dragging.ox,y:y-dragging.oy}:n));}
    if(connecting){const{x,y}=toCanvas(e);setConnecting(c=>c?({...c,cx:x,cy:y}):c);}
  };
  const onUp=e=>{
    setPanning(null);setDragging(null);
    if(connecting){
      const{x,y}=toCanvas(e);
      const target=nodes.find(n=>{const d=FB_DEFS[n.type],w=n.w||d.w,h=n.h||d.h;return x>=n.x&&x<=n.x+w&&y>=n.y&&y<=n.y+h&&n.id!==connecting.fromId;});
      if(target){
        // best toPort
        let bestP='top',bestD=Infinity;
        const source=nodes.find(n=>n.id===connecting.fromId);
        if(!source){setConnecting(null);return;}
        FB_PORTS.forEach(tp=>{const[bx,by]=fbPortAbs(target,tp);const[ax,ay]=fbPortAbs(source,connecting.fromPort);const d=Math.hypot(ax-bx,ay-by);if(d<bestD){bestD=d;bestP=tp;}});
        const dup=edges.some(e=>e.from===connecting.fromId&&e.to===target.id);
        if(!dup)setEdges(es=>[...es,{id:uid(),from:connecting.fromId,to:target.id,fromPort:connecting.fromPort,toPort:bestP}]);
      }
      setConnecting(null);
    }
  };
  const onNodeDown=(e,nodeId)=>{
    e.stopPropagation();
    if(editingId)return;
    const{x,y}=toCanvas(e);
    const n=nodes.find(n=>n.id===nodeId);
    if(!n)return;
    setSelected({type:'node',id:nodeId});
    setDragging({id:nodeId,ox:x-n.x,oy:y-n.y});
  };
  const onPortDown=(e,nodeId,port)=>{
    e.stopPropagation();
    const node=nodes.find(n=>n.id===nodeId);
    if(!node)return;
    const[ax,ay]=fbPortAbs(node,port);
    setConnecting({fromId:nodeId,fromPort:port,ax,ay,cx:ax,cy:ay});
    setDragging(null);
  };
  const onNodeDbl=(e,nodeId)=>{
    e.stopPropagation();
    const n=nodes.find(n=>n.id===nodeId);
    if(!n)return;
    setEditingId(nodeId);setEditLabel(n.label);setDragging(null);
  };
  const commitLabel=()=>{setNodes(ns=>ns.map(n=>{if(n.id!==editingId)return n;const{w,h}=fbAutoSize(n.type,editLabel);return{...n,label:editLabel,w,h};}));setEditingId(null);};
  const onWheel=e=>{e.preventDefault();setZoom(z=>Math.max(0.25,Math.min(3,z*(e.deltaY>0?.88:1.12))));};

  const selNode=selected?.type==='node'?nodes.find(n=>n.id===selected.id):null;
  const selEdge=selected?.type==='edge'?edges.find(e=>e.id===selected.id):null;

  return(
    <div style={{...S.app,display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',userSelect:'none'}}>
      {/* Header */}
      <div style={{height:52,background:'var(--gdd-bg)',borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',flexShrink:0,gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button style={S.back} onClick={onBack}>← {project.name} / Fluxogramas</button>
          {editingTitle
            ?<input value={title} onChange={e=>setTitle(e.target.value)} onBlur={()=>setEditingTitle(false)} onKeyDown={e=>{if(e.key==='Enter')setEditingTitle(false);}} autoFocus style={{...S.inp,width:200,padding:'4px 10px',fontSize:14,fontWeight:700}}/>
            :<span style={{color:CLR,fontWeight:700,fontSize:15,cursor:'text'}} onDoubleClick={()=>setEditingTitle(true)}>{title}</span>
          }
          {!saved&&<span style={{fontSize:10,color:'var(--gdd-muted)',marginLeft:4}}>● não salvo</span>}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:11,color:'var(--gdd-muted)'}}>{Math.round(zoom*100)}%</span>
          <button style={S.btn('var(--gdd-border2)','var(--gdd-muted)',{padding:'4px 10px',fontSize:12})} onClick={()=>setZoom(z=>Math.min(3,z*1.15))}>+</button>
          <button style={S.btn('var(--gdd-border2)','var(--gdd-muted)',{padding:'4px 10px',fontSize:12})} onClick={()=>setZoom(z=>Math.max(0.25,z*0.87))}>−</button>
          <button style={S.btn('var(--gdd-border2)','var(--gdd-muted)',{padding:'4px 10px',fontSize:12})} onClick={()=>{setZoom(1);setPan({x:100,y:80});}}>Reset</button>
          <div style={{width:1,height:22,background:'var(--gdd-border2)',flexShrink:0}}/>
          <button
            title={refPanelOpen?'Fechar painel de referência':'Abrir documento como referência'}
            style={{...S.btn(refPanelOpen?CLR+'22':'var(--gdd-border2)',refPanelOpen?CLR:'var(--gdd-muted)',{padding:'4px 12px',fontSize:12,border:'1px solid '+(refPanelOpen?CLR+'55':'var(--gdd-border2)')})}}
            onClick={()=>{if(refPanelOpen){setRefPanelOpen(false);}else{setShowDocPicker(true);}}}>
            {refPanelOpen?'✕ Referência':'📄 Referência'}
          </button>
          <button style={S.btn(CLR,'#000',{padding:'7px 18px',fontWeight:800})} onClick={saveFlow}>💾 Salvar</button>
        </div>
      </div>

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* ── Reference Panel ─────────────────────────────────── */}
        {refPanelOpen&&refDoc&&(
          <div style={{width:340,minWidth:240,maxWidth:'42%',borderRight:'1px solid var(--gdd-border2)',display:'flex',flexDirection:'column',overflow:'hidden',flexShrink:0,background:'var(--gdd-bg0)'}}>
            {/* Panel header */}
            <div style={{height:42,borderBottom:'1px solid var(--gdd-border2)',display:'flex',alignItems:'center',gap:8,padding:'0 12px',flexShrink:0,background:'var(--gdd-bg)'}}>
              <span style={{fontSize:14,lineHeight:1}}>{refMod?.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:.8,textTransform:'uppercase',color:refMod?.color,lineHeight:1,marginBottom:2}}>{refMod?.label}</div>
                <div style={{fontSize:12,fontWeight:700,color:'var(--gdd-text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{refDoc.title}</div>
              </div>
              <button onClick={()=>setShowDocPicker(true)} title="Trocar documento" style={{background:'none',border:'1px solid var(--gdd-border2)',color:'var(--gdd-muted)',cursor:'pointer',fontSize:11,padding:'3px 7px',borderRadius:5,flexShrink:0}}>↕</button>
              <button onClick={()=>setRefPanelOpen(false)} title="Fechar painel" style={{background:'none',border:'none',color:'var(--gdd-muted)',cursor:'pointer',fontSize:16,padding:'2px 5px',lineHeight:1,flexShrink:0}}>✕</button>
            </div>
            {/* Panel content */}
            {refDoc.framework==='flowbuilder'
              ?<div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'var(--gdd-muted)',fontSize:12,textAlign:'center',padding:24,gap:6}}>
                <div style={{fontSize:32,marginBottom:4}}>🔀</div>
                <div style={{fontWeight:700,color:'var(--gdd-text)'}}>Fluxo visual</div>
                <div style={{opacity:.55}}>{refDoc.flowData?.nodes?.length||0} nós · {refDoc.flowData?.edges?.length||0} conexões</div>
                <div style={{marginTop:12,fontSize:11,opacity:.4,lineHeight:1.6}}>Fluxos visuais não têm<br/>conteúdo textual para exibir.</div>
              </div>
              :<div
                style={{flex:1,overflowY:'auto',padding:'18px 20px',fontSize:13,lineHeight:1.78,color:'var(--gdd-text)'}}
                dangerouslySetInnerHTML={{__html:refDoc.content||'<p style="color:var(--gdd-muted);font-style:italic;font-size:13px">Este documento ainda está vazio.</p>'}}
              />
            }
          </div>
        )}
        {/* Sidebar */}
        <div style={{width:154,background:'#09090f',borderRight:'1px solid '+'var(--gdd-border2)',padding:'12px 8px',display:'flex',flexDirection:'column',gap:6,flexShrink:0,overflowY:'auto'}}>
          <div style={{fontSize:9,color:'#334155',fontWeight:700,letterSpacing:1,textTransform:'uppercase',marginBottom:2}}>Formas</div>
          {Object.entries(FB_DEFS).map(([type,def])=>(
            <button key={type} onClick={()=>addNode(type)}
              style={{background:'var(--gdd-bg2)',border:'1px solid '+def.color+'38',borderRadius:8,padding:'7px 9px',cursor:'pointer',display:'flex',alignItems:'center',gap:8,textAlign:'left',transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=def.color;e.currentTarget.style.background=def.color+'12';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=def.color+'38';e.currentTarget.style.background='var(--gdd-bg2)';}}>
              <FbNodePreview type={type} color={def.color}/>
              <span style={{fontSize:11,color:'var(--gdd-muted)',fontWeight:600,lineHeight:1.3}}>{def.label}</span>
            </button>
          ))}
          <div style={{marginTop:6,borderTop:'1px solid '+'var(--gdd-border2)',paddingTop:8,fontSize:9,color:'#2a3040',lineHeight:1.7}}>
            Clique para adicionar<br/>Arraste para mover<br/>Arraste a ● para conectar<br/>Duplo-clique p/ editar<br/>Del para excluir
          </div>
          {selNode&&(
            <div style={{marginTop:4,borderTop:'1px solid '+'var(--gdd-border2)',paddingTop:8,display:'flex',flexDirection:'column',gap:6}}>
              <div style={{fontSize:9,color:'#334155',fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>Selecionado</div>
              <div style={{fontSize:11,color:FB_DEFS[selNode.type].color,fontWeight:700}}>{FB_DEFS[selNode.type].label}</div>
              <button onClick={()=>{setNodes(ns=>ns.filter(n=>n.id!==selected.id));setEdges(es=>es.filter(e=>e.from!==selected.id&&e.to!==selected.id));setSelected(null);}}
                style={S.btn('#3d1515','#f87171',{fontSize:11,padding:'5px 8px',width:'100%',borderRadius:6,border:'1px solid #f8717130'})}>
                🗑 Excluir nó
              </button>
            </div>
          )}
          {selEdge&&(
            <div style={{marginTop:4,borderTop:'1px solid '+'var(--gdd-border2)',paddingTop:8,display:'flex',flexDirection:'column',gap:6}}>
              <div style={{fontSize:9,color:'#334155',fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>Selecionado</div>
              <div style={{fontSize:11,color:'var(--gdd-dim)'}}>Conexão</div>
              <button onClick={()=>{setEdges(es=>es.filter(e=>e.id!==selected.id));setSelected(null);}}
                style={S.btn('#3d1515','#f87171',{fontSize:11,padding:'5px 8px',width:'100%',borderRadius:6,border:'1px solid #f8717130'})}>
                🗑 Excluir conexão
              </button>
            </div>
          )}
        </div>

        {/* Canvas SVG */}
        <svg ref={svgRef}
          style={{flex:1,background:'var(--gdd-bg)',backgroundImage:'radial-gradient(#1a1a2e 1px,transparent 1px)',backgroundSize:'28px 28px',cursor:panning?'grabbing':connecting?'crosshair':'default',display:'block'}}
          data-bg="1"
          onMouseDown={onBgDown} onMouseMove={onMove} onMouseUp={onUp} onWheel={onWheel}>
          <defs>
            <marker id="fb-arrow" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0,9 3.5,0 7" fill="#3d4a5c"/>
            </marker>
            <marker id="fb-arrow-sel" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0,9 3.5,0 7" fill="#f472b6"/>
            </marker>
            <marker id="fb-arrow-hover" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0,9 3.5,0 7" fill="#60a5fa"/>
            </marker>
          </defs>
          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {edges.map(edge=>{
              const n1=nodes.find(n=>n.id===edge.from),n2=nodes.find(n=>n.id===edge.to);
              if(!n1||!n2)return null;
              const isSel=selected?.type==='edge'&&selected?.id===edge.id;
              return(
                <path key={edge.id} d={fbEdgePath(n1,edge.fromPort,n2,edge.toPort)}
                  fill="none" stroke={isSel?'#f472b6':'#2d3748'} strokeWidth={isSel?2.5:1.5}
                  markerEnd={`url(#${isSel?'fb-arrow-sel':'fb-arrow'})`}
                  style={{cursor:'pointer'}}
                  onClick={e=>{e.stopPropagation();setSelected({type:'edge',id:edge.id});}}/>
              );
            })}
            {/* Connecting preview */}
            {connecting&&<line x1={connecting.ax} y1={connecting.ay} x2={connecting.cx} y2={connecting.cy} stroke={CLR} strokeWidth={1.5} strokeDasharray="5 3" markerEnd="url(#fb-arrow-sel)" style={{pointerEvents:'none'}}/>}
            {/* Nodes */}
            {nodes.map(node=>{
              const d=FB_DEFS[node.type],w=node.w||d.w,h=node.h||d.h;
              const isSel=selected?.type==='node'&&selected?.id===node.id;
              const isEditing=editingId===node.id;
              const showPorts=isSel||!!connecting;
              return(
                <g key={node.id} transform={`translate(${node.x},${node.y})`} style={{cursor:'move'}}
                  onMouseDown={e=>onNodeDown(e,node.id)}
                  onDoubleClick={e=>onNodeDbl(e,node.id)}>
                  <FbShape type={node.type} w={w} h={h} color={d.color} sel={isSel}/>
                  {isEditing
                    ?<foreignObject x={6} y={h/2-14} width={w-12} height={28}>
                       <input value={editLabel} onChange={e=>setEditLabel(e.target.value)}
                         onBlur={commitLabel} autoFocus
                         onKeyDown={e=>{if(e.key==='Enter')commitLabel();if(e.key==='Escape')setEditingId(null);}}
                         style={{width:'100%',background:'transparent',border:'none',outline:'none',color:'var(--gdd-text)',fontSize:12,textAlign:'center',fontFamily:'system-ui',fontWeight:600}}/>
                     </foreignObject>
                    :<text x={w/2} y={h/2} textAnchor="middle" dominantBaseline="middle"
                        style={{fontSize:11.5,fill:'var(--gdd-text)',fontFamily:'system-ui',fontWeight:600,pointerEvents:'none',userSelect:'none'}}>
                        {node.label}
                      </text>
                  }
                  {showPorts&&FB_PORTS.map(port=>{
                    const[px,py]=fbPortRel(node.type,w,h,port);
                    return (<circle key={port} cx={px} cy={py} r={5}
                      fill={connecting?.fromId===node.id&&connecting?.fromPort===port?CLR:'#1a1a2e'}
                      stroke={d.color} strokeWidth={1.5}
                      style={{cursor:'crosshair'}}
                      onMouseDown={e=>onPortDown(e,node.id,port)}/>);
                  })}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* ── Doc Picker Modal ─────────────────────────────────────── */}
      {showDocPicker&&(()=>{
        const MODS_ALL=MODULES_I18N[lang]||MODULES_I18N.pt;
        const MODS_PICK=MODS_ALL.filter(m=>m.id!=='brainstorming'&&m.id!=='flowcharts');
        const activeMod=pickerMod||MODS_PICK[0];
        const modDocs=(pData?.[project.id]?.[activeMod?.id]?.docs)||[];
        return(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:400}}
            onClick={e=>{if(e.target===e.currentTarget){setShowDocPicker(false);setPickerMod(null);}}}>
            <div style={{background:'var(--gdd-bg2)',border:'1px solid var(--gdd-border)',borderRadius:20,width:560,maxHeight:'78vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,.6)'}}>
              {/* Header */}
              <div style={{padding:'18px 22px 14px',borderBottom:'1px solid var(--gdd-border2)',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                  <div style={{fontWeight:800,fontSize:15,color:CLR}}>📄 Abrir documento como referência</div>
                  <button onClick={()=>{setShowDocPicker(false);setPickerMod(null);}} style={{background:'none',border:'none',color:'var(--gdd-muted)',cursor:'pointer',fontSize:17,lineHeight:1}}>✕</button>
                </div>
                <div style={{fontSize:12,color:'var(--gdd-muted)'}}>O documento abrirá ao lado do canvas em tela dividida.</div>
              </div>
              {/* Module tabs */}
              <div style={{display:'flex',overflowX:'auto',padding:'10px 14px 0',borderBottom:'1px solid var(--gdd-border2)',gap:4,flexShrink:0}}>
                {MODS_PICK.map(m=>{
                  const isAct=activeMod?.id===m.id;
                  const cnt=(pData?.[project.id]?.[m.id]?.docs||[]).length;
                  return(
                    <button key={m.id} onClick={()=>setPickerMod(m)}
                      style={{background:isAct?m.color+'18':'transparent',border:'1px solid '+(isAct?m.color+'66':'transparent'),borderBottom:'none',color:isAct?m.color:'var(--gdd-muted)',borderRadius:'8px 8px 0 0',padding:'6px 12px',cursor:'pointer',fontSize:12,fontWeight:isAct?700:500,whiteSpace:'nowrap',flexShrink:0,transition:'all .15s'}}>
                      {m.icon} {m.label}{cnt>0&&<span style={{marginLeft:5,background:isAct?m.color+'33':'var(--gdd-bg)',borderRadius:8,padding:'1px 6px',fontSize:10}}>{cnt}</span>}
                    </button>
                  );
                })}
              </div>
              {/* Doc list */}
              <div style={{flex:1,overflowY:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',gap:6}}>
                {modDocs.length===0
                  ?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 0',color:'var(--gdd-muted)',gap:8}}>
                    <div style={{fontSize:32,opacity:.3}}>{activeMod?.icon}</div>
                    <div style={{fontSize:13}}>Nenhum documento em {activeMod?.label}</div>
                  </div>
                  :modDocs.map(d=>{
                    const isActive=refDoc?.id===d.id;
                    const preview=d.content?stripHtml(d.content).slice(0,80):'';
                    return(
                      <div key={d.id}
                        onClick={()=>{setRefDoc(d);setRefMod(activeMod);setRefPanelOpen(true);setShowDocPicker(false);setPickerMod(null);}}
                        style={{background:isActive?activeMod?.color+'15':'var(--gdd-bg)',border:'1px solid '+(isActive?activeMod?.color+'55':'var(--gdd-border2)'),borderRadius:10,padding:'11px 14px',cursor:'pointer',transition:'all .15s',display:'flex',alignItems:'center',gap:10}}
                        onMouseEnter={e=>{if(!isActive){e.currentTarget.style.borderColor=activeMod?.color+'44';e.currentTarget.style.background='var(--gdd-bg3)';}}}
                        onMouseLeave={e=>{if(!isActive){e.currentTarget.style.borderColor='var(--gdd-border2)';e.currentTarget.style.background='var(--gdd-bg)';}}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:13,color:isActive?activeMod?.color:'var(--gdd-text)',marginBottom:preview?3:0}}>{d.title}</div>
                          {preview&&<div style={{fontSize:11,color:'var(--gdd-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{preview}…</div>}
                        </div>
                        {isActive&&<span style={{fontSize:11,color:activeMod?.color,fontWeight:700,flexShrink:0}}>✓ Aberto</span>}
                        {!isActive&&<span style={{fontSize:11,color:'var(--gdd-muted)',flexShrink:0}}>Abrir →</span>}
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── UnityLDGuide helpers (outside to avoid remount) ──────────────────────────
const LD_CLR='#34d399';

// ── UnityLDGuide ──────────────────────────────────────────────────────────────
function UnityLDGuide({project,pData,setPData,onBack,onDocCreated}){
  const CLR=LD_CLR;
  const [step,setStep]=useState(0);
  const [docTitle,setDocTitle]=useState('Level Design — '+project.name);
  const [editingTitle,setEditingTitle]=useState(false);

  // Step 0 — Conceito & Visão
  const [levelName,setLevelName]=useState('');
  const [genre,setGenre]=useState('');
  const [coherentDesign,setCoherentDesign]=useState('');
  const [references,setReferences]=useState('');
  const [audience,setAudience]=useState('');

  // Step 1 — 3Cs & Métricas
  const [camera,setCamera]=useState('');
  const [character,setCharacter]=useState('');
  const [controls,setControls]=useState('');
  const [metrics,setMetrics]=useState('');

  // Step 2 — Paper Design & Mecânicas
  const [paperLayout,setPaperLayout]=useState('');
  const [mechanics,setMechanics]=useState('');
  const [gymTests,setGymTests]=useState('');

  // Step 3 — Narrativa Ambiental
  const [envStoryWhy,setEnvStoryWhy]=useState('');
  const [envStoryWhat,setEnvStoryWhat]=useState('');
  const [envStoryWhere,setEnvStoryWhere]=useState('');
  const [envStoryWhen,setEnvStoryWhen]=useState('');
  const [envStoryHow,setEnvStoryHow]=useState('');

  // Step 4 — Player Pathing
  const [criticalPath,setCriticalPath]=useState('');
  const [goldenPath,setGoldenPath]=useState('');
  const [secondaryPaths,setSecondaryPaths]=useState('');

  // Step 5 — Ensino de Mecânicas
  const [ruleOfThree,setRuleOfThree]=useState('');
  const [subvertExpectations,setSubvertExpectations]=useState('');
  const [pacing,setPacing]=useState('');

  // Step 6 — Navegação & Atenção
  const [lineOfSight,setLineOfSight]=useState('');
  const [lighting,setLighting]=useState('');
  const [signposting,setSignposting]=useState('');
  const [spawnSave,setSpawnSave]=useState('');
  const [sound,setSound]=useState('');

  const STEPS=[
    {label:'Conceito',icon:'💡'},
    {label:'3Cs & Métricas',icon:'🎮'},
    {label:'Paper Design',icon:'📐'},
    {label:'Narrativa Ambiental',icon:'🌆'},
    {label:'Player Pathing',icon:'🛤️'},
    {label:'Mecânicas',icon:'🔁'},
    {label:'Navegação',icon:'🔦'},
    {label:'Compilar',icon:'✨'},
  ];
  const TOTAL=STEPS.length;

  const filledSteps=[
    !!(levelName||coherentDesign||references),
    !!(camera||character||metrics),
    !!(paperLayout||mechanics),
    !!(envStoryWhy||envStoryWhat),
    !!(criticalPath||goldenPath),
    !!(ruleOfThree||pacing),
    !!(lineOfSight||signposting),
    false,
  ];

  const TIPS=[
    'Defina a visão coerente do nível — tema, período, estilo — e pesquise referências. Um nível coeso começa com clareza de identidade.',
    'Os 3Cs (Câmera, Personagem, Controle) e as métricas definem o espaço jogável. Conheça antes de construir: velocidade, altura de salto, alcance de ação.',
    'Esboce o nível em papel antes de construir. Mapeie puzzles, inimigos e mecânicas principais. Teste as mecânicas em um "gym" isolado.',
    'Conte a história pelo ambiente — iluminação, props, grafites, destruição. Responda: por quê, o quê, onde, quando e como aconteceu aqui.',
    'Mapeie o Caminho Crítico (mais longo possível) e o Caminho Dourado (mais divertido). Adicione caminhos secundários para estilos de jogo diferentes.',
    'Use a Regra dos Três: o jogador deve praticar cada mecânica nova ao menos 3 vezes. Então subverta as expectativas para surpreendê-lo.',
    'Guie o jogador com iluminação, bloqueadores físicos, sinalização e som. Controle onde ele olha e onde pode ir.',
    'Revise o título e compile o documento. Você poderá continuar editando e expandindo com IA depois.',
  ];

  const compile=()=>{
    let html='';
    const h2=t=>`<h2>${t}</h2>`;
    const h3=t=>`<h3>${t}</h3>`;
    const p=t=>t?`<p>${t}</p>`:'';
    html+=`<p><em>Criado com o Guia de Level Design (Unity Introduction to Level Design)</em></p><hr>`;

    if(levelName||genre||coherentDesign||references||audience){
      html+=h2('💡 Parte 1 — Conceito & Visão');
      if(levelName)html+=`<p><strong>Nome do nível:</strong> ${levelName}</p>`;
      if(genre)html+=`<p><strong>Gênero / Tipo:</strong> ${genre}</p>`;
      if(coherentDesign){html+=h3('Design Coeso');html+=p(coherentDesign);}
      if(references){html+=h3('Referências');html+=p(references);}
      if(audience){html+=h3('Público-alvo');html+=p(audience);}
    }
    if(camera||character||controls||metrics){
      html+=h2('🎮 Parte 2 — 3Cs & Métricas');
      if(camera){html+=h3('Câmera');html+=p(camera);}
      if(character){html+=h3('Personagem');html+=p(character);}
      if(controls){html+=h3('Controle');html+=p(controls);}
      if(metrics){html+=h3('Métricas');html+=p(metrics);}
    }
    if(paperLayout||mechanics||gymTests){
      html+=h2('📐 Parte 3 — Paper Design & Mecânicas');
      if(paperLayout){html+=h3('Layout em Papel');html+=p(paperLayout);}
      if(mechanics){html+=h3('Mecânicas Identificadas');html+=p(mechanics);}
      if(gymTests){html+=h3('Testes no Gym');html+=p(gymTests);}
    }
    if(envStoryWhy||envStoryWhat||envStoryWhere||envStoryWhen||envStoryHow){
      html+=h2('🌆 Parte 4 — Narrativa Ambiental');
      if(envStoryWhy){html+=h3('Por quê isso acontece?');html+=p(envStoryWhy);}
      if(envStoryWhat){html+=h3('O que aconteceu?');html+=p(envStoryWhat);}
      if(envStoryWhere){html+=h3('Onde aconteceu?');html+=p(envStoryWhere);}
      if(envStoryWhen){html+=h3('Quando aconteceu?');html+=p(envStoryWhen);}
      if(envStoryHow){html+=h3('Como aconteceu?');html+=p(envStoryHow);}
    }
    if(criticalPath||goldenPath||secondaryPaths){
      html+=h2('🛤️ Parte 5 — Player Pathing');
      if(criticalPath){html+=h3('Caminho Crítico');html+=p(criticalPath);}
      if(goldenPath){html+=h3('Caminho Dourado');html+=p(goldenPath);}
      if(secondaryPaths){html+=h3('Caminhos Secundários');html+=p(secondaryPaths);}
    }
    if(ruleOfThree||subvertExpectations||pacing){
      html+=h2('🔁 Parte 6 — Ensino de Mecânicas');
      if(ruleOfThree){html+=h3('Regra dos Três');html+=p(ruleOfThree);}
      if(subvertExpectations){html+=h3('Subversão de Expectativas');html+=p(subvertExpectations);}
      if(pacing){html+=h3('Ritmo (Pacing)');html+=p(pacing);}
    }
    if(lineOfSight||lighting||signposting||spawnSave||sound){
      html+=h2('🔦 Parte 7 — Navegação & Atenção do Jogador');
      if(lineOfSight){html+=h3('Linha de Visão e Pontos Cegos');html+=p(lineOfSight);}
      if(lighting){html+=h3('Iluminação e Espaço');html+=p(lighting);}
      if(signposting){html+=h3('Sinalização');html+=p(signposting);}
      if(sound){html+=h3('Som');html+=p(sound);}
      if(spawnSave){html+=h3('Spawn, Save Points e Checkpoints');html+=p(spawnSave);}
    }

    const doc={id:uid(),title:docTitle,content:html,framework:'unity-ld',status:'progress',createdAt:todayStr(),updatedAt:todayStr()};
    const pId=project.id,mId='leveldesign';
    setPData(prev=>{const curr=prev?.[pId]?.[mId]||{docs:[]};return{...prev,[pId]:{...(prev?.[pId]||{}),[mId]:{...curr,docs:[...curr.docs,doc]}}};});
    onDocCreated(doc);
  };

  const canPrev=step>0;
  const canNext=step<TOTAL-1;

  return (
    <div style={{...S.app,display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'0 20px',height:54,borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--gdd-bg)',position:'sticky',top:0,zIndex:20,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button style={S.back} onClick={onBack}>← {project.name} / Level Design</button>
          <span style={{color:CLR,fontWeight:800,fontSize:14}}>🗺️ Guia de Level Design</span>
        </div>
        <span style={{fontSize:11,color:'#334155'}}>Passo {step+1} de {TOTAL}</span>
      </div>

      {/* Step indicators */}
      <div style={{display:'flex',padding:'10px 20px',gap:5,borderBottom:'1px solid '+'var(--gdd-border2)',background:'var(--gdd-bg0)',overflowX:'auto',flexShrink:0}}>
        {STEPS.map((s,i)=>(
          <button key={i} onClick={()=>setStep(i)}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'6px 12px',borderRadius:8,border:'1px solid '+(i===step?CLR:filledSteps[i]?CLR+'44':'var(--gdd-border2)'),background:i===step?CLR+'18':'transparent',cursor:'pointer',flexShrink:0,transition:'all .15s'}}>
            <span style={{fontSize:14}}>{s.icon}</span>
            <span style={{fontSize:10,color:i===step?CLR:filledSteps[i]?CLR+'88':'#334155',fontWeight:700,whiteSpace:'nowrap'}}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:'auto',padding:'24px 20px',maxWidth:720,width:'100%',margin:'0 auto',boxSizing:'border-box'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>

          {/* Tip */}
          <div style={{background:CLR+'08',border:'1px solid '+CLR+'20',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--gdd-muted)',lineHeight:1.65}}>
            <strong style={{color:CLR}}>Guia de Level Design: </strong>{TIPS[step]}
          </div>

          {/* STEP 0 — Conceito & Visão */}
          {step===0&&(<>
            <LdField label="Nome do Nível" hint="Como se chama este nível, fase ou área?" value={levelName} onChange={setLevelName} placeholder="Ex: A Floresta Corrompida, Nível 01 — Introdução, Hub Central..." rows={1}/>
            <LdField label="Gênero / Tipo de Jogo" hint="Qual é o gênero do jogo? Como esse nível se enquadra nele?" value={genre} onChange={setGenre} placeholder="Ex: Plataforma 2D, FPS, RPG de ação, puzzle..." rows={1}/>
            <LdField label="Design Coeso" hint="Qual é o tema, estilo e período histórico do nível? O que torna esse nível uma experiência coesa e única?" value={coherentDesign} onChange={setCoherentDesign} placeholder="Descreva a visão holística do nível — atmosfera, estética, sensação que deve provocar..."/>
            <LdField label="Pesquisa & Referências" hint="Que jogos, locais reais, filmes ou obras inspiram este nível? Liste referências visuais e de gameplay." value={references} onChange={setReferences} placeholder="Ex: Floresta de Dark Souls 1, level design de Hollow Knight, floresta amazônica real..."/>
            <LdField label="Público-alvo" hint="Quem vai jogar este nível? Hardcore, casual, crianças? Use a Taxonomia de Bartle (Achievers, Explorers, Socializers, Killers) se aplicável." value={audience} onChange={setAudience} placeholder="Descreva o perfil do jogador esperado e quais arquétipos de Bartle esse nível atende..."/>
          </>)}

          {/* STEP 1 — 3Cs & Métricas */}
          {step===1&&(<>
            <LdField label="Câmera" hint="Qual perspectiva a câmera usa? Como ela influencia o espaço jogável? FOV, altura, restrições de visão." value={camera} onChange={setCamera} placeholder="Ex: Câmera terceira pessoa com FOV 65°, câmera fixa isométrica, first-person sem opção de mirar..."/>
            <LdField label="Personagem" hint="Quais são as habilidades, armas e capacidades do personagem neste nível? Como isso afeta o design do espaço?" value={character} onChange={setCharacter} placeholder="Ex: Personagem pode correr, pular duplo e rolar. Não tem habilidades de ataque à distância neste nível..."/>
            <LdField label="Controle" hint="Como o jogador controla o personagem? Há diferenças entre plataformas? Quais ações são repetidas com frequência?" value={controls} onChange={setControls} placeholder="Ex: WASD + mouse, controle analógico com sensibilidade baixa para plataformas. Evitar ações rápidas repetidas..."/>
            <LdField label="Métricas do Nível" hint="Quais são as medidas fundamentais que definem o espaço? Altura de salto, velocidade de movimento, altura de obstáculos, largura de passagens." value={metrics} onChange={setMetrics} placeholder="Ex: Altura de pulo = 3m, velocidade = 6m/s, largura mínima de corredor = 2m, obstáculos escaláveis até 1.2m..."/>
          </>)}

          {/* STEP 2 — Paper Design & Mecânicas */}
          {step===2&&(<>
            <LdField label="Layout em Papel" hint="Descreva ou esboce o layout do nível. Inclua zonas, pontos de interesse, puzzles e encontros com inimigos." value={paperLayout} onChange={setPaperLayout} placeholder="Descreva a estrutura geral: entrada → zona A (combate) → zona B (puzzle) → boss → saída. Inclua bifurcações e segredos..." rows={5}/>
            <LdField label="Mecânicas Identificadas" hint="Liste as mecânicas de jogo que este nível usa e como introduzi-las gradualmente." value={mechanics} onChange={setMechanics} placeholder="Ex: 1) Pulo simples (intro) → 2) Pulo duplo (zona B) → 3) Pulo duplo + parede (boss arena). Explique como cada mecânica é ensinada..." rows={4}/>
            <LdField label="Testes no Gym" hint="O que foi ou será testado em um nível 'gym' (ambiente de teste isolado)? Quais mecânicas precisam ser validadas antes da produção?" value={gymTests} onChange={setGymTests} placeholder="Ex: Testar altura mínima de obstáculos com o pulo duplo, testar largura de corredores com câmera terceira pessoa..."/>
          </>)}

          {/* STEP 3 — Narrativa Ambiental */}
          {step===3&&(<>
            <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'14px 18px',fontSize:12,color:'var(--gdd-dim)',lineHeight:1.7}}>
              <strong style={{color:CLR}}>Storytelling ambiental</strong> — conte a história pelo ambiente, não por texto explícito. Use iluminação, props, destruição, grafites e posicionamento de objetos para responder às perguntas abaixo.
            </div>
            <LdField label="Por que isso está acontecendo?" hint="Que elementos do nível indicam ao jogador por que ele está ali? Como o contexto narrativo se manifesta visualmente?" value={envStoryWhy} onChange={setEnvStoryWhy} placeholder="Ex: Destroços de uma batalha recente, bandeiras de fações inimigas, cadáveres posicionados indicando fuga..."/>
            <LdField label="O que aconteceu aqui?" hint="Que elementos ambientais revelam eventos passados sem precisar de texto ou diálogo?" value={envStoryWhat} onChange={setEnvStoryWhat} placeholder="Ex: Janelas quebradas de dentro para fora (algo escapou), mesas com comida intocada (fuga rápida), sangue em trilha direcionada..."/>
            <LdField label="Onde estamos?" hint="Que elementos definem a localização e seu backstory? Como o nível comunica 'onde' estamos sem um mapa?" value={envStoryWhere} onChange={setEnvStoryWhere} placeholder="Ex: Arquitetura medieval decadente, placas com nomes de lugares, símbolos religiosos de uma facção específica..."/>
            <LdField label="Quando aconteceu?" hint="Que elementos comunicam o momento histórico, a hora do dia, ou a era em que o nível se passa?" value={envStoryWhen} onChange={setEnvStoryWhen} placeholder="Ex: Sol nascendo indicando início de conflito, tecnologia misturada com magia indicando era de transição..."/>
            <LdField label="Como aconteceu?" hint="Que pistas físicas revelam o método ou a causa dos eventos? Props e cenário que contem o 'como'." value={envStoryHow} onChange={setEnvStoryHow} placeholder="Ex: Crateras de explosão, paredes arranhadas por garras, colunas derrubadas na mesma direção (onda de impacto)..."/>
          </>)}

          {/* STEP 4 — Player Pathing */}
          {step===4&&(<>
            <LdField label="Caminho Crítico" hint="Qual é o caminho mais longo disponível para completar o nível? Inclua todos os conteúdos principais." value={criticalPath} onChange={setCriticalPath} placeholder="Descreva o percurso completo que testa todo o conteúdo: entrada → todas as áreas → saída, incluindo desvios..." rows={4}/>
            <LdField label="Caminho Dourado" hint="Qual é o caminho que oferece a melhor experiência de gameplay — mais recompensas, melhores momentos, mais diversão?" value={goldenPath} onChange={setGoldenPath} placeholder="Descreva o percurso ideal com os melhores momentos de jogo, segredos memoráveis e recompensas especiais..." rows={4}/>
            <LdField label="Caminhos Secundários e Terciários" hint="Quais são as rotas alternativas? Para que estilos de jogo (stealth, ação, exploração)? Há atalhos, segredos ou side quests?" value={secondaryPaths} onChange={setSecondaryPaths} placeholder="Ex: Rota stealth pelo telhado, atalho para jogadores avançados, área secreta com lore extra, side quest opcional..." rows={4}/>
          </>)}

          {/* STEP 5 — Ensino de Mecânicas */}
          {step===5&&(<>
            <LdField label="Regra dos Três" hint="Para cada mecânica nova deste nível, descreva as 3 instâncias de exposição: introdução simples → repetição → desafio com maior dificuldade." value={ruleOfThree} onChange={setRuleOfThree} placeholder="Ex: Inimigo com escudo: 1) Encontro solo, tempo livre → 2) Dois inimigos juntos → 3) Grupo em espaço apertado com obstáculos..." rows={5}/>
            <LdField label="Subversão de Expectativas" hint="Após estabelecer padrões, como este nível os subverte? Que twist surpreende sem frustrar o jogador?" value={subvertExpectations} onChange={setSubvertExpectations} placeholder="Ex: Inimigo com capacete que sobrevive ao primeiro golpe, surpresa baseada em mecânica já aprendida (não trava o jogador)..."/>
            <LdField label="Ritmo (Pacing)" hint="Como o nível alterna entre tensão e alívio? Que momentos de descanso existem entre os desafios?" value={pacing} onChange={setPacing} placeholder="Ex: Combate intenso → sala tranquila com lore → puzzle → boss. Descreva o ritmo emocional da experiência..."/>
          </>)}

          {/* STEP 6 — Navegação & Atenção */}
          {step===6&&(<>
            <LdField label="Linha de Visão e Pontos Cegos" hint="Onde o jogador consegue ver longe? Onde há pontos cegos para inimigos, segredos ou emboscadas?" value={lineOfSight} onChange={setLineOfSight} placeholder="Ex: Torre central com visão 360° da arena, corredores curvados ocultam inimigos, nicho escondido atrás de cascata..."/>
            <LdField label="Iluminação e Espaço" hint="Como a iluminação guia o jogador? Que áreas são iluminadas para atrair e quais são escuras para repelir?" value={lighting} onChange={setLighting} placeholder="Ex: Luz ao fundo dos corredores indica saída, zonas de perigo em vermelho, áreas seguras em dourado/branco..."/>
            <LdField label="Sinalização (Signposting)" hint="Que pistas visuais, símbolos ou estruturas guiam o jogador sem precisar de HUD? Como o jogador sabe para onde ir?" value={signposting} onChange={setSignposting} placeholder="Ex: Lanterna piscando sobre porta de saída, trilha de moedas indicando caminho, NPC olhando na direção correta..."/>
            <LdField label="Som" hint="Como o som guia a atenção do jogador? Que efeitos sonoros comunicam perigo, recompensa ou direção?" value={sound} onChange={setSound} placeholder="Ex: Som de água indica recurso próximo, música mais intensa em zonas de perigo, vozes de NPCs chamando o jogador..."/>
            <LdField label="Spawn, Save Points e Checkpoints" hint="Onde o jogador entra no nível e para onde está voltado? Onde ficam os save points e checkpoints? Há risco de soft-lock?" value={spawnSave} onChange={setSpawnSave} placeholder="Ex: Spawn na base da montanha olhando para o castelo (objetivo visível). Checkpoint após boss intermediário, save point automático antes de cutscene final..."/>
          </>)}

          {/* STEP 7 — Compilar */}
          {step===7&&(
            <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center',textAlign:'center',padding:'10px 0'}}>
              <div style={{fontSize:52}}>🗺️</div>
              <div style={{fontWeight:800,fontSize:20,color:CLR}}>Seu nível está pronto para ser construído!</div>
              <div style={{color:'var(--gdd-dim)',fontSize:13,maxWidth:440,lineHeight:1.7}}>O documento compilará tudo que você preencheu. Continue expandindo com a IA no editor depois.</div>
              <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 20px',width:'100%',maxWidth:440}}>
                <div style={{fontSize:10,color:CLR,fontWeight:700,letterSpacing:1,marginBottom:12,textTransform:'uppercase'}}>Nome do documento</div>
                {editingTitle
                  ?<input value={docTitle} onChange={e=>setDocTitle(e.target.value)} onBlur={()=>setEditingTitle(false)} onKeyDown={e=>{if(e.key==='Enter')setEditingTitle(false);}} autoFocus
                      style={{...S.inp,padding:'10px 14px',fontSize:14}}/>
                  :<div style={{background:'var(--gdd-bg)',border:'1px solid '+'var(--gdd-border)',borderRadius:8,padding:'10px 14px',color:'var(--gdd-text)',fontSize:14,cursor:'text',textAlign:'left'}} onClick={()=>setEditingTitle(true)}>{docTitle}</div>
                }
              </div>
              <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border2)',borderRadius:12,padding:'16px 20px',width:'100%',maxWidth:440}}>
                {[
                  {label:'Conceito & Visão',ok:!!(levelName||coherentDesign)},
                  {label:'3Cs & Métricas',ok:!!(camera||metrics)},
                  {label:'Paper Design',ok:!!(paperLayout||mechanics)},
                  {label:'Narrativa Ambiental',ok:!!(envStoryWhy||envStoryWhat)},
                  {label:'Player Pathing',ok:!!(criticalPath||goldenPath)},
                  {label:'Ensino de Mecânicas',ok:!!(ruleOfThree||pacing)},
                  {label:'Navegação & Atenção',ok:!!(lineOfSight||signposting)},
                ].map(({label,ok})=>(
                  <div key={label} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <span style={{fontSize:10,color:ok?'#34d399':'#334155',fontWeight:900}}>{ok?'✓':'○'}</span>
                    <span style={{fontSize:12,color:ok?'var(--gdd-muted)':'#475569'}}>{label}</span>
                  </div>
                ))}
              </div>
              <button style={S.btn(CLR,'#000',{padding:'13px 36px',fontSize:15,borderRadius:12,fontWeight:800})} onClick={compile}>
                ✨ Criar Documento de Level Design
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer nav */}
      {step<TOTAL-1&&(
        <div style={{padding:'14px 20px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',justifyContent:'space-between',background:'var(--gdd-bg)',flexShrink:0}}>
          <button style={S.btn('var(--gdd-border)','var(--gdd-dim)')} onClick={()=>canPrev&&setStep(s=>s-1)} disabled={!canPrev}>← Anterior</button>
          <button style={S.btn(CLR,'#000',{fontWeight:800})} onClick={()=>canNext&&setStep(s=>s+1)}>Próximo →</button>
        </div>
      )}
      {step===TOTAL-1&&(
        <div style={{padding:'14px 20px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',justifyContent:'flex-start',background:'var(--gdd-bg)',flexShrink:0}}>
          <button style={S.btn('var(--gdd-border)','var(--gdd-dim)')} onClick={()=>setStep(s=>s-1)}>← Anterior</button>
        </div>
      )}
    </div>
  );
}

// ── KanbanBoard ───────────────────────────────────────────────────────────────
function KanbanBoard({project,pData,setPData,onBack}){
  const getTasks=()=>pData?.[project.id]?.production?.tasks||[];
  const setTasks=updater=>{
    setPData(prev=>{
      const curr=prev?.[project.id]?.production||{tasks:[]};
      const newTasks=typeof updater==='function'?updater(curr.tasks):updater;
      return{...prev,[project.id]:{...(prev?.[project.id]||{}),production:{...curr,tasks:newTasks}}};
    });
  };

  const [dragId,setDragId]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [addCol,setAddCol]=useState('todo');
  const [editTask,setEditTask]=useState(null);
  const [form,setForm]=useState({title:'',desc:'',priority:'medium',category:'Design'});
  const [delConfirm,setDelConfirm]=useState(null);
  const [filterCat,setFilterCat]=useState('all');
  const [filterPrio,setFilterPrio]=useState('all');
  const [search,setSearch]=useState('');

  const tasks=getTasks();
  const total=tasks.length;
  const done=tasks.filter(t=>t.column==='done').length;
  const highPrio=tasks.filter(t=>t.priority==='high'&&t.column!=='done').length;
  const pct=total>0?Math.round((done/total)*100):0;

  const usedCats=[...new Set(tasks.map(t=>t.category).filter(Boolean))];

  const filtered=tasks.filter(t=>{
    if(filterCat!=='all'&&t.category!==filterCat)return false;
    if(filterPrio!=='all'&&t.priority!==filterPrio)return false;
    if(search&&!t.title.toLowerCase().includes(search.toLowerCase())&&!t.desc?.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });

  const openAdd=(colId='todo')=>{
    setAddCol(colId);
    setForm({title:'',desc:'',priority:'medium',category:'Design'});
    setEditTask(null);setShowModal(true);
  };
  const openEdit=task=>{
    setForm({title:task.title,desc:task.desc||'',priority:task.priority,category:task.category||'Design'});
    setEditTask(task);setAddCol(task.column);setShowModal(true);
  };
  const saveTask=()=>{
    if(!form.title.trim())return;
    if(editTask){
      setTasks(prev=>prev.map(t=>t.id===editTask.id?{...t,...form,column:addCol,updatedAt:todayStr()}:t));
    }else{
      setTasks(prev=>[...prev,{id:uid(),title:form.title.trim(),desc:form.desc.trim(),priority:form.priority,category:form.category,column:addCol,createdAt:todayStr(),updatedAt:null}]);
    }
    setShowModal(false);setEditTask(null);
  };
  const moveTask=(taskId,colId)=>setTasks(prev=>prev.map(t=>t.id===taskId?{...t,column:colId,updatedAt:todayStr()}:t));
  const deleteTask=taskId=>{setTasks(prev=>prev.filter(t=>t.id!==taskId));setDelConfirm(null);};

  const onDragStart=(e,taskId)=>{setDragId(taskId);e.dataTransfer.effectAllowed='move';};
  const onDragOver=(e,colId)=>{e.preventDefault();e.dataTransfer.dropEffect='move';setDragOver(colId);};
  const onDrop=(e,colId)=>{e.preventDefault();if(dragId)moveTask(dragId,colId);setDragId(null);setDragOver(null);};
  const onDragEnd=()=>{setDragId(null);setDragOver(null);};

  const hasFilters=filterCat!=='all'||filterPrio!=='all'||search;

  return(
    <div style={{minHeight:'100vh',background:'var(--gdd-bg)',color:'var(--gdd-text)',fontFamily:'system-ui,sans-serif',display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>

      {/* ── Header ── */}
      <div style={{padding:'0 20px',height:54,borderBottom:'1px solid var(--gdd-border2)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--gdd-bg)',flexShrink:0,gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button style={{background:'none',border:'1px solid var(--gdd-border)',color:'var(--gdd-muted)',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontSize:12}} onClick={onBack}>← {project.emoji} {project.name}</button>
          <span style={{color:PROD_CLR,fontWeight:800,fontSize:15,letterSpacing:-.3}}>🏭 Produção</span>
          <span style={{background:PROD_CLR+'15',border:'1px solid '+PROD_CLR+'30',color:PROD_CLR,borderRadius:8,padding:'2px 10px',fontSize:11,fontWeight:700}}>Kanban</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {/* Search */}
          <div style={{position:'relative',display:'flex',alignItems:'center'}}>
            <span style={{position:'absolute',left:8,color:'var(--gdd-dim)',fontSize:12,pointerEvents:'none'}}>🔎</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tarefa…"
              style={{background:'var(--gdd-bg3)',border:'1px solid var(--gdd-border)',borderRadius:8,padding:'6px 10px 6px 26px',color:'var(--gdd-text)',fontSize:12,outline:'none',width:160}}/>
          </div>
          <button style={{background:PROD_CLR,color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',cursor:'pointer',fontWeight:700,fontSize:13}}
            onClick={()=>openAdd('todo')}>+ Nova Tarefa</button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{padding:'8px 20px',background:'var(--gdd-bg0)',borderBottom:'1px solid var(--gdd-border2)',display:'flex',alignItems:'center',gap:20,flexShrink:0,flexWrap:'wrap'}}>
        {/* Progress bar */}
        <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:160}}>
          <div style={{flex:1,height:5,background:'var(--gdd-border)',borderRadius:3,overflow:'hidden'}}>
            <div style={{width:pct+'%',height:'100%',background:'linear-gradient(90deg,'+PROD_CLR+',#f97316)',borderRadius:3,transition:'width .4s'}}/>
          </div>
          <span style={{fontSize:11,color:PROD_CLR,fontWeight:700,whiteSpace:'nowrap'}}>{pct}% concluído</span>
        </div>
        {/* Counters */}
        <div style={{display:'flex',gap:16,alignItems:'center'}}>
          <span style={{fontSize:11,color:'var(--gdd-muted)'}}><strong style={{color:'var(--gdd-text)'}}>{total}</strong> tarefas</span>
          <span style={{fontSize:11,color:'#3b82f6'}}><strong>{tasks.filter(t=>t.column==='doing').length}</strong> em andamento</span>
          {highPrio>0&&<span style={{fontSize:11,color:'#f43f5e'}}><strong>{highPrio}</strong> alta prioridade</span>}
          <span style={{fontSize:11,color:'#34d399'}}><strong>{done}</strong> concluída{done!==1?'s':''}</span>
        </div>
        {/* Filters */}
        <div style={{display:'flex',gap:6,alignItems:'center',marginLeft:'auto'}}>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)}
            style={{background:'var(--gdd-bg2)',border:'1px solid var(--gdd-border)',borderRadius:6,padding:'3px 8px',color:'var(--gdd-muted)',fontSize:11,outline:'none',cursor:'pointer'}}>
            <option value="all">Todas categorias</option>
            {TASK_CATS.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterPrio} onChange={e=>setFilterPrio(e.target.value)}
            style={{background:'var(--gdd-bg2)',border:'1px solid var(--gdd-border)',borderRadius:6,padding:'3px 8px',color:'var(--gdd-muted)',fontSize:11,outline:'none',cursor:'pointer'}}>
            <option value="all">Todas prioridades</option>
            {Object.entries(TASK_PRIO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          {hasFilters&&<button onClick={()=>{setFilterCat('all');setFilterPrio('all');setSearch('');}} style={{background:'none',border:'1px solid var(--gdd-border)',color:'var(--gdd-muted)',borderRadius:6,padding:'3px 8px',cursor:'pointer',fontSize:11}}>✕ Limpar</button>}
        </div>
      </div>

      {/* ── Board ── */}
      <div style={{flex:1,overflowX:'auto',overflowY:'hidden',display:'flex',padding:'18px 18px 18px',gap:12,position:'relative'}}>
        {KANBAN_COLS.map(col=>{
          const colTasks=filtered.filter(t=>t.column===col.id);
          const allColTasks=tasks.filter(t=>t.column===col.id);
          const isOver=dragOver===col.id;
          return(
            <div key={col.id}
              style={{width:264,minWidth:264,display:'flex',flexDirection:'column',maxHeight:'100%',flexShrink:0}}
              onDragOver={e=>onDragOver(e,col.id)}
              onDrop={e=>onDrop(e,col.id)}
              onDragLeave={()=>setDragOver(d=>d===col.id?null:d)}>

              {/* Column header */}
              <div style={{padding:'10px 14px 10px',background:isOver?col.color+'20':col.color+'12',border:'2px solid '+(isOver?col.color:col.color+'33'),borderBottom:'none',borderRadius:'12px 12px 0 0',display:'flex',alignItems:'center',gap:7,flexShrink:0,transition:'all .15s'}}>
                <span style={{fontSize:15,lineHeight:1}}>{col.icon}</span>
                <span style={{fontWeight:800,fontSize:12,color:col.color,flex:1,letterSpacing:.2}}>{col.label}</span>
                <div style={{display:'flex',gap:4,alignItems:'center'}}>
                  {filtered.length<tasks.length&&allColTasks.length!==colTasks.length&&
                    <span style={{fontSize:10,color:col.color,opacity:.6}}>{colTasks.length}/</span>}
                  <span style={{background:col.color,borderRadius:6,padding:'1px 7px',fontSize:11,color:'#000',fontWeight:800,minWidth:20,textAlign:'center'}}>{allColTasks.length}</span>
                </div>
              </div>

              {/* Drop zone + cards */}
              <div style={{flex:1,overflowY:'auto',padding:'8px 8px 4px',background:isOver?col.color+'08':'var(--gdd-bg2)',border:'2px solid '+(isOver?col.color:col.color+'22'),borderTop:'1px solid '+col.color+(isOver?'':'18'),borderRadius:'0 0 12px 12px',display:'flex',flexDirection:'column',gap:7,minHeight:80,transition:'all .15s'}}>

                {colTasks.length===0&&(
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'18px 8px',color:'var(--gdd-border)',fontSize:11,textAlign:'center',gap:4,opacity:.6,pointerEvents:'none',flex:1}}>
                    <span style={{fontSize:20}}>{col.icon}</span>
                    <span>{isOver?'Solte aqui':'Vazio'}</span>
                  </div>
                )}

                {colTasks.map(task=>{
                  const prio=TASK_PRIO[task.priority]||TASK_PRIO.medium;
                  const isDragging=dragId===task.id;
                  return(
                    <div key={task.id} draggable
                      onDragStart={e=>onDragStart(e,task.id)}
                      onDragEnd={onDragEnd}
                      style={{background:'var(--gdd-bg)',border:'1px solid var(--gdd-border)',borderLeft:'3px solid '+prio.color,borderRadius:9,padding:'10px 11px',cursor:'grab',opacity:isDragging?.25:1,userSelect:'none',transition:'all .15s',flexShrink:0}}
                      onMouseEnter={e=>{if(!isDragging){e.currentTarget.style.borderColor=col.color+'88';e.currentTarget.style.boxShadow='0 3px 12px rgba(0,0,0,.3)';e.currentTarget.style.transform='translateY(-1px)';}}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--gdd-border)';e.currentTarget.style.borderLeftColor=prio.color;e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>

                      {/* Title row */}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:6,marginBottom:5}}>
                        <div style={{fontWeight:700,fontSize:12.5,lineHeight:1.4,flex:1,color:'var(--gdd-text)'}}>{task.title}</div>
                        <div style={{display:'flex',gap:2,flexShrink:0,opacity:.5}} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='.5'}>
                          <button onClick={e=>{e.stopPropagation();openEdit(task);}} title="Editar"
                            style={{background:'none',border:'none',color:'var(--gdd-muted)',cursor:'pointer',fontSize:12,padding:'1px 4px',borderRadius:4,lineHeight:1}}
                            onMouseEnter={e=>e.currentTarget.style.background='var(--gdd-bg3)'}
                            onMouseLeave={e=>e.currentTarget.style.background='none'}>✎</button>
                          <button onClick={e=>{e.stopPropagation();setDelConfirm(task.id);}} title="Excluir"
                            style={{background:'none',border:'none',color:'var(--gdd-muted)',cursor:'pointer',fontSize:11,padding:'1px 4px',borderRadius:4,lineHeight:1}}
                            onMouseEnter={e=>{e.currentTarget.style.background='#f8717120';e.currentTarget.style.color='#f87171';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--gdd-muted)';}}>✕</button>
                        </div>
                      </div>

                      {/* Description */}
                      {task.desc&&<div style={{color:'var(--gdd-dim)',fontSize:11,lineHeight:1.55,marginBottom:8,wordBreak:'break-word',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{task.desc}</div>}

                      {/* Footer badges */}
                      <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center',marginTop:task.desc?0:2}}>
                        <span style={{background:prio.bg,color:prio.color,borderRadius:4,padding:'1px 6px',fontSize:9.5,fontWeight:700,letterSpacing:.3}}>{prio.icon} {prio.label}</span>
                        {task.category&&<span style={{background:'var(--gdd-bg3)',color:'var(--gdd-dim)',borderRadius:4,padding:'1px 6px',fontSize:9.5,border:'1px solid var(--gdd-border2)'}}>{task.category}</span>}
                        <span style={{marginLeft:'auto',fontSize:9,color:'#2d3748',letterSpacing:.2}}>{task.updatedAt||task.createdAt}</span>
                      </div>

                      {/* Move to next col shortcut (only shown on hover via opacity parent trick) */}
                    </div>
                  );
                })}

                {/* Quick-add button */}
                <button onClick={()=>openAdd(col.id)}
                  style={{background:'none',border:'1px dashed '+col.color+'35',color:col.color+'70',borderRadius:8,padding:'7px',cursor:'pointer',fontSize:11.5,display:'flex',alignItems:'center',gap:5,justifyContent:'center',flexShrink:0,transition:'all .15s',marginTop:colTasks.length?4:0}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=col.color+'80';e.currentTarget.style.color=col.color;e.currentTarget.style.background=col.color+'0a';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=col.color+'35';e.currentTarget.style.color=col.color+'70';e.currentTarget.style.background='none';}}>
                  <span style={{fontSize:13,lineHeight:1}}>+</span> Adicionar
                </button>
              </div>
            </div>
          );
        })}

        {/* ── Empty state ── */}
        {tasks.length===0&&(
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',pointerEvents:'none',zIndex:0}}>
            <div style={{fontSize:60,marginBottom:18,opacity:.08}}>🏭</div>
            <div style={{fontSize:17,fontWeight:800,color:'var(--gdd-muted)',marginBottom:8}}>Board de produção vazio</div>
            <div style={{fontSize:13,color:'var(--gdd-border)',maxWidth:340,lineHeight:1.7}}>
              Use o Kanban para organizar tarefas, bugs, assets e sprints do seu jogo.<br/>
              Clique em <strong style={{color:PROD_CLR}}>+ Nova Tarefa</strong> para começar.
            </div>
          </div>
        )}

        {/* ── No results from filter ── */}
        {tasks.length>0&&filtered.length===0&&(
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',pointerEvents:'none',zIndex:0}}>
            <div style={{fontSize:40,marginBottom:12,opacity:.15}}>🔎</div>
            <div style={{fontSize:15,fontWeight:700,color:'var(--gdd-muted)',marginBottom:8}}>Nenhuma tarefa encontrada</div>
            <div style={{fontSize:12,color:'var(--gdd-border)'}}>Tente ajustar os filtros ou a busca.</div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}
          onClick={e=>e.target===e.currentTarget&&(setShowModal(false),setEditTask(null))}>
          <div style={{background:'var(--gdd-bg2)',border:'1px solid var(--gdd-border)',borderRadius:20,padding:32,width:460,boxShadow:'0 32px 80px rgba(0,0,0,.7)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24}}>
              <span style={{fontSize:22,lineHeight:1}}>{editTask?'✎':'🏭'}</span>
              <div>
                <h3 style={{margin:0,fontSize:17,fontWeight:800}}>{editTask?'Editar Tarefa':'Nova Tarefa'}</h3>
                <div style={{fontSize:11,color:'var(--gdd-muted)',marginTop:2}}>{project.emoji} {project.name} · Produção</div>
              </div>
            </div>

            {/* Title */}
            <div style={{marginBottom:14}}>
              <div style={{color:'var(--gdd-muted)',fontSize:11,marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:.6}}>Título *</div>
              <input style={{background:'var(--gdd-bg3)',border:'1px solid var(--gdd-border)',borderRadius:8,padding:'10px 14px',color:'var(--gdd-text)',fontSize:14,outline:'none',width:'100%',boxSizing:'border-box'}}
                value={form.title} placeholder="Ex: Implementar sistema de inventário…"
                onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                onKeyDown={e=>e.key==='Enter'&&saveTask()} autoFocus
                onFocus={e=>e.target.style.borderColor=PROD_CLR}
                onBlur={e=>e.target.style.borderColor='var(--gdd-border)'}/>
            </div>

            {/* Desc */}
            <div style={{marginBottom:16}}>
              <div style={{color:'var(--gdd-muted)',fontSize:11,marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:.6}}>Descrição <span style={{opacity:.5,textTransform:'none',fontWeight:400}}>(opcional)</span></div>
              <textarea style={{background:'var(--gdd-bg3)',border:'1px solid var(--gdd-border)',borderRadius:8,padding:'9px 13px',color:'var(--gdd-text)',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box',resize:'none',height:70,lineHeight:1.6,fontFamily:'system-ui,sans-serif'}}
                value={form.desc} placeholder="Detalhes, critérios de aceite, referências…"
                onChange={e=>setForm(f=>({...f,desc:e.target.value}))}
                onFocus={e=>e.target.style.borderColor=PROD_CLR}
                onBlur={e=>e.target.style.borderColor='var(--gdd-border)'}/>
            </div>

            {/* Priority + Category */}
            <div style={{display:'flex',gap:12,marginBottom:16}}>
              <div style={{flex:1}}>
                <div style={{color:'var(--gdd-muted)',fontSize:11,marginBottom:7,fontWeight:600,textTransform:'uppercase',letterSpacing:.6}}>Prioridade</div>
                <div style={{display:'flex',gap:5}}>
                  {Object.entries(TASK_PRIO).map(([k,v])=>(
                    <button key={k} onClick={()=>setForm(f=>({...f,priority:k}))}
                      style={{flex:1,background:form.priority===k?v.bg:'none',border:'1px solid '+(form.priority===k?v.color+'88':'var(--gdd-border)'),color:form.priority===k?v.color:'var(--gdd-dim)',borderRadius:7,padding:'6px 4px',cursor:'pointer',fontSize:11,fontWeight:form.priority===k?700:400,transition:'all .12s',display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
                      <span style={{fontSize:13,lineHeight:1}}>{v.icon}</span>
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{flex:1}}>
                <div style={{color:'var(--gdd-muted)',fontSize:11,marginBottom:7,fontWeight:600,textTransform:'uppercase',letterSpacing:.6}}>Categoria</div>
                <select style={{background:'var(--gdd-bg3)',border:'1px solid var(--gdd-border)',borderRadius:8,padding:'8px 11px',color:'var(--gdd-text)',fontSize:12,outline:'none',width:'100%',cursor:'pointer'}}
                  value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {TASK_CATS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Column */}
            <div style={{marginBottom:24}}>
              <div style={{color:'var(--gdd-muted)',fontSize:11,marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:.6}}>Coluna</div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {KANBAN_COLS.map(c=>(
                  <button key={c.id} onClick={()=>setAddCol(c.id)}
                    style={{background:addCol===c.id?c.color+'20':'none',border:'1px solid '+(addCol===c.id?c.color:'var(--gdd-border)'),color:addCol===c.id?c.color:'var(--gdd-muted)',borderRadius:7,padding:'5px 11px',cursor:'pointer',fontSize:11,fontWeight:addCol===c.id?700:400,transition:'all .12s'}}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{display:'flex',gap:10}}>
              <button style={{background:PROD_CLR,color:'#fff',border:'none',borderRadius:9,padding:'10px 0',cursor:'pointer',fontWeight:700,fontSize:13,flex:1,opacity:form.title.trim()?1:.5}}
                onClick={saveTask} disabled={!form.title.trim()}>
                {editTask?'💾 Salvar alterações':'+ Criar Tarefa'}
              </button>
              <button style={{background:'none',color:'var(--gdd-muted)',border:'1px solid var(--gdd-border)',borderRadius:9,padding:'10px 20px',cursor:'pointer',fontWeight:600,fontSize:13}}
                onClick={()=>{setShowModal(false);setEditTask(null);}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {delConfirm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300}}>
          <div style={{background:'var(--gdd-bg2)',border:'1px solid var(--gdd-border)',borderRadius:18,padding:32,width:320,textAlign:'center',boxShadow:'0 24px 64px rgba(0,0,0,.6)'}}>
            <div style={{fontSize:38,marginBottom:12}}>🗑️</div>
            <h3 style={{margin:'0 0 8px',fontSize:17,fontWeight:800}}>Excluir tarefa?</h3>
            <p style={{color:'var(--gdd-dim)',fontSize:13,margin:'0 0 22px',lineHeight:1.6}}>
              "{tasks.find(t=>t.id===delConfirm)?.title}" será removida permanentemente.
            </p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:8,padding:'8px 22px',cursor:'pointer',fontWeight:700,fontSize:13}}
                onClick={()=>deleteTask(delConfirm)}>Excluir</button>
              <button style={{background:'none',color:'var(--gdd-muted)',border:'1px solid var(--gdd-border)',borderRadius:8,padding:'8px 22px',cursor:'pointer',fontSize:13}}
                onClick={()=>setDelConfirm(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{padding:'6px 20px',borderTop:'1px solid var(--gdd-border2)',textAlign:'center',fontSize:10,color:'#2d3748',flexShrink:0}}>
        Criado por <a href="https://www.linkedin.com/in/victor-hugo-costa/" target="_blank" rel="noopener noreferrer" style={{color:'#374151',textDecoration:'none',fontWeight:600}}>Victor Hugo Costa</a> para toda a comunidade Game Dev
      </div>
    </div>
  );
}

// ── GDDExporter ───────────────────────────────────────────────────────────────
function GDDExporter({project,pData,onClose,lang='pt',theme='dark'}){
  const t=TR[lang]||TR.pt;
  const th=THEMES[theme]||THEMES.dark;
  const S=mkS(th);
  const STATUS_L={ progress:{label:t.st_progress,color:'#fbbf24',bg:'#fbbf2415'}, done:{label:t.st_done,color:'#34d399',bg:'#34d39915'} };
  const EXPORT_MODS=(MODULES_I18N[lang]||MODULES).filter(m=>m.id!=='brainstorming'&&m.id!=='production');
  const [sel,setSel]=useState(()=>{
    const init={};EXPORT_MODS.forEach(m=>{const docs=pData?.[project.id]?.[m.id]?.docs||[];if(docs.length>0)init[m.id]={checked:true,docs:Object.fromEntries(docs.map(d=>[d.id,true]))};});return init;
  });
  const toggleMod=mId=>setSel(s=>({...s,[mId]:s[mId]?{...s[mId],checked:!s[mId].checked}:{checked:true,docs:{}}}));
  const toggleDoc=(mId,dId)=>setSel(s=>({...s,[mId]:{...s[mId],docs:{...s[mId]?.docs,[dId]:!s[mId]?.docs?.[dId]}}}));
  const total=EXPORT_MODS.reduce((acc,m)=>{if(!sel[m.id]?.checked)return acc;return acc+(pData?.[project.id]?.[m.id]?.docs||[]).filter(d=>sel[m.id]?.docs?.[d.id]).length;},0);
  const doExport=()=>{
    const sections=[];EXPORT_MODS.forEach(m=>{if(!sel[m.id]?.checked)return;const docs=(pData?.[project.id]?.[m.id]?.docs||[]).filter(d=>sel[m.id]?.docs?.[d.id]&&m.id!=='flowcharts'||sel[m.id]?.docs?.[d.id]);if(docs.length)sections.push({mod:m,docs});});
    exportToPDF(project,sections);onClose();
  };
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300}}>
      <div style={{background:'var(--gdd-bg2)',border:'1px solid '+'var(--gdd-border)',borderRadius:20,width:520,maxHeight:'85vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div><div style={{fontWeight:800,fontSize:17}}>📥 Exportar GDD</div><div style={{color:'var(--gdd-muted)',fontSize:12,marginTop:3}}>{project.emoji} {project.name} · PDF</div></div>
          <button style={S.back} onClick={onClose}>✕</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'14px 18px',display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontSize:12,color:'var(--gdd-muted)',marginBottom:4}}>Selecione módulos e documentos a incluir:</div>
          {EXPORT_MODS.map(m=>{
            const docs=pData?.[project.id]?.[m.id]?.docs||[],mSel=sel[m.id];
            return(
              <div key={m.id} style={{background:'var(--gdd-bg)',border:'1px solid '+(mSel?.checked?m.color+'44':'var(--gdd-border2)'),borderRadius:10,overflow:'hidden',transition:'border-color .2s'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer'}} onClick={()=>toggleMod(m.id)}>
                  <div style={{width:17,height:17,borderRadius:5,border:'2px solid '+(mSel?.checked?m.color:'#334155'),background:mSel?.checked?m.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .15s'}}>
                    {mSel?.checked&&<span style={{color:'#000',fontSize:10,fontWeight:900}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:mSel?.checked?m.color:'var(--gdd-dim)'}}>{m.icon} {m.label}</span>
                  <span style={{marginLeft:'auto',fontSize:11,color:'#334155'}}>{docs.length} doc{docs.length!==1?'s':''}</span>
                </div>
                {mSel?.checked&&docs.length>0&&(
                  <div style={{borderTop:'1px solid '+'var(--gdd-border2)',padding:'7px 14px 10px 14px',display:'flex',flexDirection:'column',gap:5}}>
                    {docs.map(doc=>{const dSel=mSel?.docs?.[doc.id],st=STATUS_L[doc.status]||STATUS_L.progress;return(
                      <div key={doc.id} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'3px 0'}} onClick={()=>toggleDoc(m.id,doc.id)}>
                        <div style={{width:14,height:14,borderRadius:4,border:'2px solid '+(dSel?m.color:'var(--gdd-border)'),background:dSel?m.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          {dSel&&<span style={{color:'#000',fontSize:8,fontWeight:900}}>✓</span>}
                        </div>
                        <span style={{fontSize:12,color:dSel?'var(--gdd-text)':'#475569',flex:1}}>{doc.title}</span>
                        <span style={{background:st.bg,color:st.color,borderRadius:8,padding:'1px 8px',fontSize:10,fontWeight:700}}>{st.label}</span>
                      </div>
                    );})}
                  </div>
                )}
                {mSel?.checked&&docs.length===0&&<div style={{borderTop:'1px solid '+'var(--gdd-border2)',padding:'7px 14px',fontSize:12,color:'#334155',fontStyle:'italic'}}>Módulo vazio</div>}
              </div>
            );
          })}
        </div>
        <div style={{padding:'14px 18px',borderTop:'1px solid '+'var(--gdd-border2)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--gdd-bg)',flexShrink:0}}>
          <span style={{fontSize:12,color:'var(--gdd-muted)'}}>{total} documento{total!==1?'s':''} selecionado{total!==1?'s':''}</span>
          <div style={{display:'flex',gap:8}}>
            <button style={S.btn('var(--gdd-border)')} onClick={onClose}>{t.cancel}</button>
            <button style={S.btn(total?'#7c3aed':'var(--gdd-border)','#fff',{opacity:total?1:.5})} onClick={doExport} disabled={!total}>📥 {lang==='pt'?'Gerar PDF':'Export PDF'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
// ── Error Boundary ────────────────────────────────────────────────────────────
class GDTErrorBoundary extends Component {
  constructor(props){
    super(props);
    this.state={hasError:false,error:null};
  }
  static getDerivedStateFromError(error){
    return{hasError:true,error};
  }
  componentDidCatch(error,info){
    console.error('[GameDesignTool] Erro capturado:',error,info);
  }
  render(){
    if(this.state.hasError){
      return(
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'#07070f',color:'#e2e8f0',fontFamily:'system-ui,sans-serif',gap:20,padding:32,textAlign:'center'}}>
          <div style={{fontSize:52}}>⚠️</div>
          <div style={{fontWeight:800,fontSize:20,color:'#f472b6'}}>Algo deu errado</div>
          <div style={{color:'#64748b',fontSize:14,maxWidth:420,lineHeight:1.7}}>
            Ocorreu um erro inesperado. Seus dados foram salvos — clique abaixo para recarregar e continuar de onde parou.
          </div>
          <div style={{background:'#0f0f1a',border:'1px solid #1e1e30',borderRadius:10,padding:'10px 16px',fontSize:12,color:'#475569',fontFamily:'monospace',maxWidth:500,wordBreak:'break-all'}}>
            {String(this.state.error?.message||'Erro desconhecido').slice(0,200)}
          </div>
          <button
            onClick={()=>{this.setState({hasError:false,error:null});window.location.reload();}}
            style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:10,padding:'12px 32px',fontSize:14,fontWeight:700,cursor:'pointer'}}>
            🔄 Recarregar plataforma
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function GDDHubInner(){
  const [lang,setLang]=useState<LangKey>(()=>lsGet(LS_KEYS.lang,'pt') as LangKey);
  const [theme,setTheme]=useState<ThemeKey>(()=>lsGet(LS_KEYS.theme,'dark') as ThemeKey);
  const t=TR[lang]||TR.pt;
  const th=THEMES[theme]||THEMES.dark;
  const S=mkS(th);
  const MODULES=(MODULES_I18N[lang]||MODULES_I18N.pt) as ModuleMeta[];
  const STATUS_L={ progress:{label:t.st_progress,color:'#fbbf24',bg:'#fbbf2415'}, done:{label:t.st_done,color:'#34d399',bg:'#34d39915'} };

  // Inject CSS variables for theming (used by sub-components)
  useEffect(()=>{
    const r=document.documentElement;
    Object.entries(th).forEach(([k,v])=>r.style.setProperty('--gdd-'+k,v));
    r.style.setProperty('--gdd-text-color',th.text);
  },[th]);

  const [view,setView]=useState<ViewKey>('landing');
  const ECHOES_DEFAULT: Project[]=[
    {id:1,name:'Echoes of the Void',genre:'RPG de Ação',   platform:'PC / Console',color:'#7c3aed',emoji:'🌌',progress:65},
    {id:2,name:'Cardboard Kingdom', genre:'Jogo de Tabuleiro',platform:'Board Game',color:'#06b6d4',emoji:'♟️',progress:30},
    {id:3,name:'Neon Runners',      genre:'Endless Runner', platform:'Mobile',      color:'#f59e0b',emoji:'🏃',progress:10},
  ];
  const [projects,setProjects]=useState<Project[]>(()=>lsGet(LS_KEYS.projects,ECHOES_DEFAULT) as Project[]);
  const [project,setProject]=useState<Project | null>(null),[module,setModule]=useState<ModuleMeta | null>(null),[activeDoc,setActiveDoc]=useState<Document | null>(null);
  const PDATA_DEFAULT: ProjectData={
    1:{
      mechanics:{docs:[
        {id:'m1',title:'Sistema de Combate — Ecos e Ressonância',content:`<h2>⚔️ Sistema de Combate — Ecos e Ressonância</h2><p>O sistema central de combate de <strong>Echoes of the Void</strong> é construído em torno da mecânica de <strong>Ecos</strong>: toda ação do jogador gera uma "onda" no ambiente que pode ser amplificada, refletida ou absorvida dependendo do contexto.</p><hr><h3>Loop Principal</h3><p>O jogador alterna entre dois estados: <strong>Modo Físico</strong> (ataques diretos, movimentação tangível) e <strong>Modo Etéreo</strong> (habilidades baseadas em Ecos, teleporte curto, invisibilidade parcial). Trocar de modo tem custo de <em>Ressonância</em> — o recurso principal do jogo.</p><h3>Recursos</h3><ul><li><strong>Ressonância</strong> — barra principal. Regenera ao atacar em Modo Físico. Consome em habilidades Etéreas.</li><li><strong>Vitalidade</strong> — HP tradicional. Não regenera sozinha; requer consumíveis ou habilidades específicas.</li><li><strong>Ecos Ativos</strong> — contador de até 5 Ecos no campo. Cada Echo causa efeitos passivos e pode ser "detonado" por habilidades específicas.</li></ul><hr><h3>Mecânica de Ecos</h3><p>Ao acertar inimigos, o jogador deposita um <em>Eco</em> neles. Ecos acumulam e criam combos:</p><ul><li><strong>1 Eco</strong> — dano leve bônus no próximo ataque</li><li><strong>3 Ecos</strong> — stagger automático no inimigo</li><li><strong>5 Ecos</strong> — habilidade <em>Ressonância Total</em> disponível: explosão em área</li></ul><hr><h3>Balanceamento de Risco/Recompensa</h3><p>Permanecer no Modo Etéreo por muito tempo drena Ressonância até zerar, forçando o jogador de volta ao Físico em momento vulnerável. O loop de risco está em saber quando trocar de modo para maximizar Ecos sem se expor demais.</p>`,messages:[],status:'done',createdAt:'10/03/2026',updatedAt:'12/03/2026'},
        {id:'m2',title:'Progressão e Árvore de Habilidades',content:`<h2>📈 Progressão e Árvore de Habilidades</h2><p>A progressão em <strong>Echoes of the Void</strong> é não-linear. O jogador coleta <em>Fragmentos de Vácuo</em> ao derrotar inimigos e explorar o mundo, usando-os para desbloquear nós em três árvores independentes.</p><hr><h3>Árvore Física — "Carne e Aço"</h3><p>Focada em resistência, dano direto e capacidade de absorver golpes. Ideal para jogadores que preferem combate agressivo e frontal.</p><ul><li>Linha de Resistência: aumento de HP, armadura passiva, redução de knockback</li><li>Linha de Brutalidade: multiplicadores de dano crítico, animações de ataque mais rápidas</li><li>Linha de Impulso: dash com i-frames, contra-ataque automático</li></ul><h3>Árvore Etérea — "Vácuo e Sombra"</h3><p>Focada na mecânica de Ecos, habilidades especiais e mobilidade. Requer maior domínio do sistema de Ressonância.</p><ul><li>Linha de Amplificação: Ecos causam mais dano, acumulam mais rápido</li><li>Linha de Distorção: teleporte de maior alcance, passagem por barreiras</li><li>Linha de Ruptura: habilidade ultimate de ruptura dimensional</li></ul><h3>Árvore Híbrida — "Equilíbrio do Caos"</h3><p>Desbloqueada após investir pelo menos 5 pontos em cada uma das outras duas árvores. Oferece habilidades que combinam Físico + Etéreo simultaneamente, criando os combos mais poderosos do jogo.</p><hr><h3>Prestige System</h3><p>Ao atingir o nível máximo, o jogador pode fazer "Ressonância Ascendente" — resetar a árvore mas manter os efeitos passivos permanentes. Incentiva múltiplas runs com builds diferentes.</p>`,messages:[],status:'done',createdAt:'11/03/2026',updatedAt:'13/03/2026'},
        {id:'m3',title:'Sistema de Mundo Aberto — Zonas de Vácuo',content:`<h2>🌍 Sistema de Mundo Aberto — Zonas de Vácuo</h2><p>O mundo de Echoes of the Void é dividido em <strong>Zonas de Vácuo</strong>: regiões onde a barreira entre o plano físico e o Vácuo Etéreo é mais fina. Cada zona tem comportamentos únicos que afetam o gameplay.</p><hr><h3>Tipos de Zona</h3><ul><li><strong>Zona Estável</strong> — ambiente padrão. Troca de modo tem custo normal de Ressonância.</li><li><strong>Zona Amplificada</strong> — habilidades Etéreas custam 50% menos. Inimigos mais agressivos.</li><li><strong>Zona Suprimida</strong> — Modo Etéreo desabilitado. Só combate físico. Alta densidade de recursos.</li><li><strong>Zona de Ruptura</strong> — o ambiente colapsa periodicamente. Alto risco, recompensas raras exclusivas.</li></ul><hr><h3>Eventos Dinâmicos</h3><p>As zonas mudam ao longo do jogo. Uma área Estável pode se tornar Amplificada após um boss ser derrotado próximo. O jogador é incentivado a revisitar regiões antigas para encontrar novos segredos e desafios.</p>`,messages:[],status:'progress',createdAt:'14/03/2026',updatedAt:null},
      ]},
      characters:{docs:[
        {id:'c1',title:'Kael — O Portador do Eco',content:`<h2>🧙 Kael — O Portador do Eco</h2><p><em>Documento estruturado com o Double A Framework — criado por Victor Hugo Costa.</em></p><hr><h2>⚔️ Mecânica</h2><p>Personagem principal jogável. Arquetipo de <strong>guerreiro híbrido</strong> — alto dano em burst, mobilidade acima da média, fragilidade moderada. Especializado em combinar ataques físicos com detonações de Eco para maximizar dano em janelas curtas.</p><hr><h2>✦ Atributos</h2><ul><li><strong>Intensidade</strong> — Age com paixão intensa em tudo que faz. Suas emoções amplificam literalmente o poder dos Ecos que carrega.</li><li><strong>Adaptabilidade</strong> — Sobreviveu ao Vácuo por anos aprendendo a se moldar a qualquer ambiente ou situação.</li><li><strong>Lealdade Conflituosa</strong> — Profundamente leal a quem ama, mas sua missão pessoal frequentemente entra em conflito com os interesses coletivos.</li></ul><hr><h2>🎭 Arquétipos</h2><ul><li><strong>Herói</strong> — Assume o papel central na jornada de superação. É o catalisador de todas as mudanças no mundo. <em>(Ref: Link — The Legend of Zelda)</em></li><li><strong>Guerreiro</strong> — Enfrenta conflitos de forma direta e determinada. Prefere resolver problemas com ação a deliberação. <em>(Ref: Kratos — God of War)</em></li></ul><hr><h2>💡 Configuração Conceitual</h2><p>Kael é um sobrevivente moldado pelo Vácuo — um jovem que perdeu sua aldeia para uma Ruptura quando criança e desde então carrega fragmentos do plano etéreo dentro de si, literalmente. Ele não escolheu ser o Portador; o Vácuo o escolheu. Sua intensidade emocional não é uma fraqueza — é o que mantém os Ecos dentro dele coesos e poderosos.</p><hr><h2>📋 Características</h2><ul><li><strong>Nome:</strong> Kael Vordane</li><li><strong>Raça / Espécie:</strong> Humano com fragmentação etérea parcial</li><li><strong>Classe / Função:</strong> Portador — guerreiro híbrido físico/etéreo</li><li><strong>Cultura e Origem:</strong> Aldeia de Cinderval, destruída pela Grande Ruptura (ano 0 do jogo)</li><li><strong>Idade:</strong> 24 anos</li><li><strong>Estilo Visual:</strong> Armadura leve de couro reforçado com incrustações de cristal Etéreo (brilho violeta). Cabelos escuros, cicatriz no antebraço esquerdo onde o primeiro Eco se fixou.</li><li><strong>Equipamentos:</strong> Lâmina Dupla de Ressonância — espada de uma mão que vibra ao acumular Ecos; Manto do Vácuo — capa que se dissolve parcialmente no Modo Etéreo</li><li><strong>Estilo de Combate:</strong> Ágil e explosivo. Combos curtos e letais, seguidos de reposicionamento pelo Modo Etéreo. Não sustenta duelos prolongados.</li></ul>`,messages:[],status:'done',createdAt:'10/03/2026',updatedAt:'13/03/2026'},
        {id:'c2',title:'Seraphine — A Arquiteta do Vácuo',content:`<h2>🧙 Seraphine — A Arquiteta do Vácuo</h2><hr><h2>⚔️ Mecânica</h2><p>NPC aliada e mentora de Kael. Não é jogável diretamente, mas oferece upgrades, missões e intervenções táticas durante boss fights (invocável uma vez por zona).</p><hr><h2>💡 Configuração Conceitual</h2><p>Seraphine foi a primeira pesquisadora a compreender a natureza estrutural do Vácuo — não como uma ameaça a ser combatida, mas como um tecido vivo que responde à intenção. Ela é fria e calculista na superfície, mas carrega uma culpa profunda por ter inadvertidamente causado a Grande Ruptura décadas atrás ao tentar "estabilizar" o Vácuo com um experimento fracassado.</p><hr><h2>📋 Características</h2><ul><li><strong>Nome:</strong> Seraphine Aldric</li><li><strong>Raça / Espécie:</strong> Humana — idosa (aparência de 60 anos, idade real desconhecida)</li><li><strong>Classe / Função:</strong> Arquiteta do Vácuo — pesquisadora e manipuladora de estruturas etéreas</li><li><strong>Estilo Visual:</strong> Vestes acadêmicas em preto e dourado, óculos com lentes de cristal Etéreo que lhe permitem ver o Vácuo diretamente. Cabelos brancos presos.</li><li><strong>Estilo de Combate:</strong> Não combate diretamente. Quando invocada em boss fights, cria barreiras e amplificadores de Ecos que potencializam o jogador por 30 segundos.</li></ul>`,messages:[],status:'progress',createdAt:'11/03/2026',updatedAt:'12/03/2026'},
      ]},
      worldbuilding:{docs:[
        {id:'w1',title:'O Vácuo — Cosmologia e Lore',content:`<h2>🌍 O Vácuo — Cosmologia e Lore</h2><p>O universo de <strong>Echoes of the Void</strong> é estruturado em dois planos coexistentes: o <strong>Plano Físico</strong> (o mundo palpável dos humanos, cidades, natureza) e o <strong>Vácuo</strong> — um plano etéreo que existe "por cima" da realidade, invisível à maioria, mas constantemente presente.</p><hr><h3>A Natureza do Vácuo</h3><p>O Vácuo não é um lugar de trevas ou caos — é, na verdade, o "eco" de tudo que já existiu. Cada evento, cada emoção intensa, cada morte deixa uma ressonância no Vácuo. Essa ressonância acumula ao longo dos séculos, formando os <em>Ecos</em> que permeiam o mundo.</p><p>Para a maioria das pessoas, o Vácuo é imperceptível. Para os <em>Portadores</em> — indivíduos nascidos ou transformados por exposição intensa ao Vácuo — ele é tão real quanto o ar que respiram.</p><hr><h3>A Grande Ruptura</h3><p>Trinta anos antes dos eventos do jogo, a pesquisadora Seraphine Aldric tentou criar uma "ponte estável" entre os dois planos para permitir comunicação e comércio inter-dimensional. O experimento falhou catastroficamente. A <strong>Grande Ruptura</strong> abriu fissuras permanentes em todo o mundo, criando as Zonas de Vácuo e gerando a primeira geração de Portadores — crianças nascidas na zona de efeito que absorveram fragmentos etéreos.</p><hr><h3>Fações do Mundo</h3><ul><li><strong>A Guarda do Plano</strong> — organização militar criada após a Ruptura para "conter" as Zonas de Vácuo e eliminar Portadores considerados instáveis. Antagonista principal do jogo.</li><li><strong>Os Ressonantes</strong> — grupo underground de Portadores que acreditam ser os herdeiros legítimos do Vácuo. Moralmente ambíguos — seus métodos são violentos mas seu objetivo é legítimo.</li><li><strong>A Ordem do Eco</strong> — académicos e pesquisadores que estudam o Vácuo de forma científica. Aliados naturais de Kael, mas sua neutralidade política frequentemente os impede de agir.</li></ul>`,messages:[],status:'done',createdAt:'09/03/2026',updatedAt:'13/03/2026'},
        {id:'w2',title:'Mapa Mundial — Regiões e Pontos de Interesse',content:`<h2>🗺️ Mapa Mundial — Regiões e Pontos de Interesse</h2><p>O mundo de Echoes of the Void é um continente único chamado <strong>Aethermoor</strong>, com cinco regiões principais conectadas por uma rede de rotas terrestres e aquáticas. Cada região tem seu bioma único e grau de contaminação do Vácuo.</p><hr><h3>Regiões Principais</h3><ul><li><strong>Cinderval (Zona Suprimida)</strong> — Ruínas da aldeia natal de Kael. Ambiente de tutoria e emocionalmente carregado. Baixo nível de inimigos, alto valor narrativo.</li><li><strong>Metropolis de Erenhal (Zona Estável)</strong> — Maior cidade do continente. Hub principal do jogo — mercadores, missões secundárias, a sede da Guarda do Plano.</li><li><strong>Floresta de Silvarum (Zona Amplificada)</strong> — Floresta ancestral onde o Vácuo é mais denso. Lar dos Ressonantes. Alta dificuldade, recompensas únicas.</li><li><strong>Deserto de Kharrath (Zona de Ruptura)</strong> — Epicentro da Grande Ruptura. O ambiente muda constantemente. Boss final localizado aqui.</li><li><strong>Arquipélago de Thalaris (Zona Estável/Variável)</strong> — Ilhas com ruínas de civilizações antigas que já dominavam o Vácuo. Conteúdo de endgame e lore profundo.</li></ul><hr><h3>Pontos Notáveis</h3><ul><li>Torre de Seraphine — laboratório/fortaleza da Arquiteta, ponto central da narrativa</li><li>As Três Fissuras — portais permanentes entre os planos, guardiados pela Guarda do Plano</li><li>Mercado Etéreo — mercado underground dos Ressonantes, acessível apenas em Modo Etéreo</li></ul>`,messages:[],status:'done',createdAt:'10/03/2026',updatedAt:'12/03/2026'},
      ]},
      narrative:{docs:[
        {id:'n1',title:'Estrutura Narrativa — Três Atos',content:`<h2>📖 Estrutura Narrativa — Três Atos</h2><p>A narrativa de <strong>Echoes of the Void</strong> segue uma estrutura de três atos clássica com uma reviravolta central que recontextualiza os eventos do Ato I.</p><hr><h3>Ato I — O Portador Relutante</h3><p>Kael vive escondido em Erenhal, suprimindo seus poderes para evitar perseguição da Guarda do Plano. Um acidente durante uma briga de rua expõe seus Ecos publicamente. Forçado a fugir, ele encontra Seraphine — que revela que ele é o Portador "primário", o único capaz de fechar as Fissuras da Grande Ruptura.</p><p><strong>Conflito principal:</strong> Kael não quer ser herói. Ele quer apenas sobreviver. A primeira metade do Ato I é sobre convencê-lo de que fuga não é opção.</p><hr><h3>Ato II — A Verdade do Vácuo</h3><p>Kael começa a trabalhar com os Ressonantes para encontrar as Fissuras. À medida que fecha cada uma, descobre que a Grande Ruptura não foi um acidente — foi sabotagem. Alguém dentro da Ordem do Eco queria abrir as Fissuras intencionalmente para fusionar os dois planos permanentemente.</p><p><strong>Reviravolta central (ponto médio):</strong> Seraphine é a sabotadora. Mas sua motivação não é malícia — ela descobriu que o Vácuo está "morrendo" e a fusão é a única forma de salvá-lo. Ela mentiu sobre o acidente para proteger Kael da verdade.</p><hr><h3>Ato III — A Escolha do Eco</h3><p>Kael precisa decidir: fechar as Fissuras (salva o Plano Físico, deixa o Vácuo morrer) ou completar a fusão de Seraphine (salva ambos os planos, mas transforma irreversivelmente todos os seres vivos em Portadores). Três finais possíveis dependendo das escolhas acumuladas ao longo do jogo.</p><hr><h3>Temas Centrais</h3><ul><li>Identidade versus destino — Kael é definido pelo que é ou pelo que escolhe ser?</li><li>Culpa e redenção — Seraphine e o peso de uma decisão que destruiu o mundo</li><li>O que é real — quando o Vácuo e o Físico são igualmente válidos, o que define a "realidade"?</li></ul>`,messages:[],status:'done',createdAt:'09/03/2026',updatedAt:'14/03/2026'},
        {id:'n2',title:'Diálogos e Tom Narrativo',content:`<h2>✍️ Diálogos e Tom Narrativo</h2><p>O tom de <strong>Echoes of the Void</strong> é <strong>sombrio mas não niilista</strong>. O mundo passou por uma catástrofe, mas as pessoas continuam vivendo, criando comunidades, encontrando alegria. A escuridão existe para dar peso às vitórias, não para esmagar o jogador.</p><hr><h3>Voz de Kael</h3><p>Kael fala de forma direta, às vezes seca. Ele não é eloquente mas é honesto. Usa humor negro como mecanismo de defesa. Quando está genuinamente emocionado, suas frases ficam mais curtas, menos polidas.</p><p><em>Exemplo de diálogo:</em></p><p>"Você quer que eu salve o mundo." — Kael (plano, sem entonação de pergunta)<br/>"Essencialmente, sim." — Seraphine<br/>"Que conveniente para todo mundo exceto eu."</p><hr><h3>Voz de Seraphine</h3><p>Precisa, acadêmica, raramente usa contrações. Quando mente, suas frases ficam ligeiramente mais longas — ela preenche o silêncio com palavras para esconder o desconforto. Quando honesta, é brutalmente direta.</p><hr><h3>Harmonia Ludonarrativa</h3><p>As mecânicas de combate devem espelhar a narrativa: Kael usando o Modo Etéreo representa ele aceitando sua natureza de Portador. No início do jogo, o jogador é encorajado a depender do Modo Físico (Kael em negação). Conforme a narrativa avança, o Modo Etéreo se torna mais poderoso — externalizando o crescimento do personagem.</p>`,messages:[],status:'progress',createdAt:'12/03/2026',updatedAt:null},
      ]},
      leveldesign:{docs:[
        {id:'l1',title:'Nível 1 — Ruínas de Cinderval',content:`<h2>🗺️ Nível 1 — Ruínas de Cinderval</h2><p>O nível de abertura do jogo. Serve como tutorial emocional e mecânico simultaneamente. O jogador assume controle de Kael enquanto ele retorna às ruínas de sua aldeia natal — destruída pela Grande Ruptura 20 anos antes.</p><hr><h3>Visão Coerente</h3><p>Tom: melancolia silenciosa. O lugar que foi lar de Kael agora é uma casca habitada por inimigos menores da Guarda do Plano. A arquitetura ainda tem traços do que foi — uma praça central, a estrutura de uma escola — mas tudo em ruínas.</p><p>Objetivo emocional do nível: fazer o jogador sentir o peso da perda de Kael antes mesmo de apresentar a história verbalmente.</p><hr><h3>3Cs</h3><ul><li><strong>Câmera:</strong> Terceira pessoa, câmera sobre o ombro direito. FOV 85°. A câmera levemente mais baixa que o normal durante a abertura enfatiza o peso do momento.</li><li><strong>Personagem:</strong> Kael com movimentação ainda "reprimida" — velocidade de corrida reduzida em 20%, sem acesso ao Modo Etéreo (narrativamente justificado).</li><li><strong>Controles:</strong> Tutorial gradual. Ataque básico introduzido na entrada. Dodge introduzido no primeiro encontro com inimigos. Sem sobrecarga de informação.</li></ul><hr><h3>Layout — Paper Design</h3><p>Nível linear com uma bifurcação opcional: o caminho da esquerda leva à casa destruída de Kael (conteúdo emocional, item colecionável único, sem inimigos); o caminho da direita é o caminho principal com inimigos e o mini-boss.</p><hr><h3>Narrativa Ambiental</h3><ul><li>Brinquedo de madeira quebrado no chão da praça central — remete à infância de Kael</li><li>Uma fogueira ainda acesa, quase extinta — alguém passou por aqui recentemente</li><li>Placas de identificação de casas ainda pregadas nas paredes carbonizadas</li><li>Um altar improvisado com flores — alguém ainda visita e presta homenagens</li></ul><hr><h3>Ensinando a Mecânica de Ecos</h3><p>O primeiro inimigo do jogo tem exatamente 3 barras de saúde. O tutorial explica: cada ataque deposita um Eco. Com 3 Ecos, o inimigo fica em stagger. Isso ensina a mecânica central sem texto — o jogador descobre por experimentação.</p>`,messages:[],status:'done',createdAt:'11/03/2026',updatedAt:'14/03/2026'},
        {id:'l2',title:'Hub — Metrópolis de Erenhal',content:`<h2>🏙️ Hub — Metrópolis de Erenhal</h2><p>Erenhal é o hub central do jogo — a maior cidade de Aethermoor e a única totalmente protegida por barreiras que suprimem o Vácuo. Para Kael, é simultaneamente um refúgio e uma prisão.</p><hr><h3>Estrutura do Hub</h3><p>Erenhal é dividida em quatro distritos navegáveis livremente:</p><ul><li><strong>Distrito Baixo</strong> — favelas e mercado negro. Maioria de NPCs aliados, missões secundárias, o contato inicial com os Ressonantes.</li><li><strong>Distrito Médio</strong> — vida urbana comum. Lojas, NPCs com memória de diálogos, eventos dinâmicos.</li><li><strong>Distrito Alto</strong> — sede da Guarda do Plano, palácio do Governador. Zona de tensão — Kael não deveria estar aqui.</li><li><strong>Subterrâneo</strong> — acessível apenas em Modo Etéreo após Ato I. Mercado dos Ressonantes, quests exclusivas.</li></ul><hr><h3>Design de Progressão no Hub</h3><p>O hub muda visualmente ao longo do jogo. No Ato I é vibrante e movimentado. No Ato II, após eventos narrativos, a presença da Guarda aumenta — mais patrulhas, menos NPCs na rua, clima de tensão. No Ato III, dependendo das escolhas, o hub pode estar em guerra civil ou em paz negociada.</p>`,messages:[],status:'progress',createdAt:'13/03/2026',updatedAt:null},
      ]},
      flowcharts:{docs:[
        {id:'f1',title:'Fluxo de Progressão de Missão Principal',framework:'flowbuilder',flowData:{nodes:[{id:'fn1',type:'start',x:320,y:40,w:120,h:44,label:'Início da Missão'},{id:'fn2',type:'process',x:280,y:130,w:200,h:44,label:'Chegada em Cinderval'},{id:'fn3',type:'decision',x:260,y:220,w:240,h:52,label:'Explorar casa de Kael?'},{id:'fn4',type:'process',x:100,y:320,w:180,h:44,label:'Cutscene emocional + item'},{id:'fn5',type:'process',x:380,y:320,w:180,h:44,label:'Prossegue direto'},{id:'fn6',type:'process',x:240,y:420,w:200,h:44,label:'Encontro com inimigos'},{id:'fn7',type:'decision',x:230,y:510,w:220,h:52,label:'Derrotou mini-boss?'},{id:'fn8',type:'process',x:80,y:610,w:160,h:44,label:'Morte — Respawn'},{id:'fn9',type:'process',x:380,y:610,w:160,h:44,label:'Cutscene: Seraphine'},{id:'fn10',type:'end',x:310,y:700,w:140,h:44,label:'Fim do Nível 1'}],edges:[{id:'fe1',from:'fn1',fromPort:'bottom',to:'fn2',toPort:'top'},{id:'fe2',from:'fn2',fromPort:'bottom',to:'fn3',toPort:'top'},{id:'fe3',from:'fn3',fromPort:'left',to:'fn4',toPort:'top',label:'Sim'},{id:'fe4',from:'fn3',fromPort:'right',to:'fn5',toPort:'top',label:'Não'},{id:'fe5',from:'fn4',fromPort:'bottom',to:'fn6',toPort:'top'},{id:'fe6',from:'fn5',fromPort:'bottom',to:'fn6',toPort:'top'},{id:'fe7',from:'fn6',fromPort:'bottom',to:'fn7',toPort:'top'},{id:'fe8',from:'fn7',fromPort:'left',to:'fn8',toPort:'top',label:'Não'},{id:'fe9',from:'fn7',fromPort:'right',to:'fn9',toPort:'top',label:'Sim'},{id:'fe10',from:'fn8',fromPort:'bottom',to:'fn6',toPort:'left'},{id:'fe11',from:'fn9',fromPort:'bottom',to:'fn10',toPort:'top'}]},content:'',messages:[],status:'done',createdAt:'12/03/2026',updatedAt:'14/03/2026'},
        {id:'f2',title:'Fluxo de Sistema de Combate',framework:'flowbuilder',flowData:{nodes:[{id:'fc1',type:'start',x:300,y:30,w:140,h:44,label:'Encontro Inimigo'},{id:'fc2',type:'decision',x:260,y:120,w:220,h:52,label:'Modo Físico ou Etéreo?'},{id:'fc3',type:'process',x:80,y:220,w:180,h:44,label:'Ataque Físico'},{id:'fc4',type:'process',x:400,y:220,w:180,h:44,label:'Habilidade Etérea'},{id:'fc5',type:'process',x:80,y:310,w:180,h:44,label:'Deposita Eco no inimigo'},{id:'fc6',type:'process',x:400,y:310,w:180,h:44,label:'Consome Ressonância'},{id:'fc7',type:'decision',x:240,y:400,w:240,h:52,label:'Ecos acumulados ≥ 3?'},{id:'fc8',type:'process',x:80,y:500,w:180,h:44,label:'Continua combo'},{id:'fc9',type:'process',x:400,y:500,w:180,h:44,label:'Stagger + bonus dano'},{id:'fc10',type:'decision',x:240,y:590,w:240,h:52,label:'Ecos ≥ 5?'},{id:'fc11',type:'process',x:80,y:680,w:180,h:44,label:'Normal — aguarda mais'},{id:'fc12',type:'process',x:400,y:680,w:200,h:44,label:'Ressonância Total disponível!'},{id:'fc13',type:'end',x:300,y:770,w:140,h:44,label:'Inimigo derrotado'}],edges:[{id:'fce1',from:'fc1',fromPort:'bottom',to:'fc2',toPort:'top'},{id:'fce2',from:'fc2',fromPort:'left',to:'fc3',toPort:'top',label:'Físico'},{id:'fce3',from:'fc2',fromPort:'right',to:'fc4',toPort:'top',label:'Etéreo'},{id:'fce4',from:'fc3',fromPort:'bottom',to:'fc5',toPort:'top'},{id:'fce5',from:'fc4',fromPort:'bottom',to:'fc6',toPort:'top'},{id:'fce6',from:'fc5',fromPort:'bottom',to:'fc7',toPort:'top'},{id:'fce7',from:'fc6',fromPort:'bottom',to:'fc7',toPort:'top'},{id:'fce8',from:'fc7',fromPort:'left',to:'fc8',toPort:'top',label:'Não'},{id:'fce9',from:'fc7',fromPort:'right',to:'fc9',toPort:'top',label:'Sim'},{id:'fce10',from:'fc8',fromPort:'bottom',to:'fc10',toPort:'top'},{id:'fce11',from:'fc9',fromPort:'bottom',to:'fc10',toPort:'top'},{id:'fce12',from:'fc10',fromPort:'left',to:'fc11',toPort:'top',label:'Não'},{id:'fce13',from:'fc10',fromPort:'right',to:'fc12',toPort:'top',label:'Sim!'},{id:'fce14',from:'fc11',fromPort:'bottom',to:'fc13',toPort:'top'},{id:'fce15',from:'fc12',fromPort:'bottom',to:'fc13',toPort:'top'}]},content:'',messages:[],status:'progress',createdAt:'13/03/2026',updatedAt:null},
      ]},
      production:{tasks:[
        {id:'t1',title:'Design do sistema de Ecos — documento GDD completo',desc:'Finalizar a especificação técnica do sistema de acúmulo e detonação de Ecos para entrega ao time de programação.',priority:'high',category:'Design',column:'done',createdAt:'01/03/2026',updatedAt:'10/03/2026'},
        {id:'t2',title:'Concept art — Kael (3 variações de armadura)',desc:'Criar três propostas visuais para a armadura de Kael representando progressão: início, meio e endgame.',priority:'high',category:'Arte',column:'done',createdAt:'02/03/2026',updatedAt:'11/03/2026'},
        {id:'t3',title:'Protótipo de combate — Modo Físico',desc:'Implementar protótipo jogável do sistema de combate em Modo Físico com feedback de Ecos.',priority:'high',category:'Programação',column:'done',createdAt:'03/03/2026',updatedAt:'12/03/2026'},
        {id:'t4',title:'Implementar Modo Etéreo — troca e cooldown',desc:'Programar a troca entre modos com animação de transição, custo de Ressonância e estado de cooldown.',priority:'high',category:'Programação',column:'review',createdAt:'08/03/2026',updatedAt:'14/03/2026'},
        {id:'t5',title:'Mapa de Erenhal — blockout de geometria',desc:'Criar o blockout inicial da metrópolis com os quatro distritos definidos. Sem arte final — apenas volumes e escala.',priority:'medium',category:'Level Design',column:'review',createdAt:'09/03/2026',updatedAt:'13/03/2026'},
        {id:'t6',title:'Animações de Kael — set básico de combate',desc:'Produzir animações de idle, walk, run, ataque x1/x2/x3, dodge, hit e death.',priority:'high',category:'Arte',column:'doing',createdAt:'10/03/2026',updatedAt:'14/03/2026'},
        {id:'t7',title:'Sistema de diálogos — estrutura e tooling',desc:'Definir formato de arquivo de diálogos e implementar o sistema de exibição in-game com suporte a escolhas.',priority:'medium',category:'Programação',column:'doing',createdAt:'11/03/2026',updatedAt:'14/03/2026'},
        {id:'t8',title:'Trilha sonora — tema principal (demo)',desc:'Compor e produzir demo do tema principal de Echoes of the Void. Referências: NieR Automata, Hollow Knight.',priority:'medium',category:'Áudio',column:'doing',createdAt:'12/03/2026',updatedAt:'14/03/2026'},
        {id:'t9',title:'HUD — barra de Ressonância e contador de Ecos',desc:'Projetar e implementar os elementos de HUD do sistema de combate: barra de Ressonância, indicador de Ecos ativos e indicador de modo atual.',priority:'medium',category:'UI/UX',column:'todo',createdAt:'13/03/2026',updatedAt:null},
        {id:'t10',title:'IA de inimigos — comportamento básico Guardas',desc:'Implementar comportamento de patrulha, detecção do jogador, perseguição e ataque para os soldados da Guarda do Plano.',priority:'medium',category:'Programação',column:'todo',createdAt:'13/03/2026',updatedAt:null},
        {id:'t11',title:'Cutscene — abertura Cinderval (storyboard)',desc:'Criar storyboard completo da cutscene de abertura do jogo em Cinderval. Deve estabelecer tom e apresentar Kael sem diálogo.',priority:'low',category:'Narrativa',column:'todo',createdAt:'14/03/2026',updatedAt:null},
        {id:'t12',title:'SFX — pacote de sons de combate básico',desc:'Produzir efeitos sonoros para ataques, dodge, impacto, deposição de Eco e detonação de Ressonância Total.',priority:'medium',category:'Áudio',column:'backlog',createdAt:'14/03/2026',updatedAt:null},
        {id:'t13',title:'Localização — estrutura para PT/EN/ES',desc:'Definir pipeline de localização e extrair todas as strings de interface para arquivo externo.',priority:'low',category:'Programação',column:'backlog',createdAt:'14/03/2026',updatedAt:null},
        {id:'t14',title:'Boss 1 — design e moveset (Comandante da Guarda)',desc:'Documentar design completo do primeiro boss: moveset, fases, padrões de ataque e janelas de vulnerabilidade.',priority:'high',category:'Design',column:'backlog',createdAt:'14/03/2026',updatedAt:null},
        {id:'t15',title:'Playtest interno — build alpha v0.1',desc:'Organizar sessão de playtest interno com a build alpha focando no sistema de Ecos e na progressão do Nível 1.',priority:'low',category:'QA',column:'backlog',createdAt:'14/03/2026',updatedAt:null},
      ]},
    },
  };
  const [pData,setPData]=useState<ProjectData>(()=>lsGet(LS_KEYS.pData,PDATA_DEFAULT) as ProjectData);
  const [editContent,setEditContent]=useState(''),[hasUnsaved,setHasUnsaved]=useState(false);
  const [input,setInput]=useState(''),[loading,setLoading]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  const [showNew,setShowNew]=useState(false),[showNewDoc,setShowNewDoc]=useState(false),[newDocTitle,setNewDocTitle]=useState('');
  const [form,setForm]=useState({name:'',genre:'',platform:''});
  const [confirm,setConfirm]=useState<ConfirmState>(null),[showExport,setShowExport]=useState(false);
  const [mechNewMode,setMechNewMode]=useState<MechanicNewMode>(null); // null | 'choice' | 'frameworks'
  const [narrNewMode,setNarrNewMode]=useState<ModeChoice>(null); // null | 'choice'
  const [wbNewMode,setWbNewMode]=useState<ModeChoice>(null);     // null | 'choice'
  const [ldNewMode,setLdNewMode]=useState<ModeChoice>(null);     // null | 'choice'
  const [charNewMode,setCharNewMode]=useState<ModeChoice>(null); // null | 'choice'
  const chatRef=useRef<HTMLDivElement | null>(null),insertRef=useRef<((html: string) => void) | null>(null);

  useEffect(()=>{const fn=()=>setScrolled(window.scrollY>30);window.addEventListener('scroll',fn);return()=>window.removeEventListener('scroll',fn);},[]);
  useEffect(()=>{ if(typeof window!=='undefined') window.__gdt_loaded=true; },[]);

  // ── Persistência em localStorage ──────────────────────────────────────────
  useEffect(()=>{lsSet(LS_KEYS.lang,lang);},[lang]);
  useEffect(()=>{lsSet(LS_KEYS.theme,theme);},[theme]);
  useEffect(()=>{lsSet(LS_KEYS.projects,projects);},[projects]);
  useEffect(()=>{lsSet(LS_KEYS.pData,pData);},[pData]);

  const getMod=(pId?: ProjectId | null,mId?: string | null): DocumentModuleData=>{
    if(pId==null||!mId)return{docs:[]};
    const data=pData?.[pId]?.[mId]||{};
    return{...data,docs:data.docs||[]};
  };
  const setMod=(pId: ProjectId,mId: string,d: ProjectModuleData)=>setPData(p=>({...p,[pId]:{...(p[pId]||{}),[mId]:d}}));
  const modDocs=()=>getMod(project?.id,module?.id).docs||[];

  const buildCtx=(pId: ProjectId,mId: string,docId: DocumentId)=>{
    const proj=projects.find(p=>p.id===pId),data=pData[pId]||{};
    let ctx='PROJETO: "'+proj?.name+'" | Gênero: '+proj?.genre+' | Plataforma: '+proj?.platform+'\n\n';
    MODULES.filter(m=>m.id!=='brainstorming'&&m.id!=='production').forEach(m=>{const md=data[m.id];if(!md?.docs?.length)return;ctx+='=== '+m.label+' ===\n';md.docs.forEach(doc=>{ctx+='• "'+doc.title+'"'+(m.id===mId&&doc.id===docId?' ← DOC ATUAL':'')+': '+stripHtml(doc.content).slice(0,300)+'\n';});ctx+='\n';});
    return ctx;
  };
  const getDocMessages=(): ChatMessage[]=>!activeDoc||!project||!module?[]:getMod(project.id,module.id).docs.find(d=>d.id===activeDoc.id)?.messages||[];

  const createProject=()=>{if(!form.name.trim())return;const idx=projects.length;setProjects(p=>[...p,{id:uid(),name:form.name,genre:form.genre||'Indefinido',platform:form.platform||'Indefinida',color:PALETTE[idx%PALETTE.length],emoji:EMOJIS[idx%EMOJIS.length],progress:0}]);setForm({name:'',genre:'',platform:''});setShowNew(false);};
  const deleteProject=(id: ProjectId)=>{setProjects(p=>p.filter(x=>x.id!==id));setPData(d=>{const n={...d};delete n[id];return n;});setConfirm(null);};
  const cloneProject=(id: ProjectId)=>{const src=projects.find(p=>p.id===id);if(!src)return;const idx=projects.length,nId=uid();setProjects(p=>[...p,{...src,id:nId,name:src.name+' (Cópia)',color:PALETTE[idx%PALETTE.length],emoji:EMOJIS[idx%EMOJIS.length],progress:0}]);setPData(d=>({...d,[nId]:JSON.parse(JSON.stringify(d[id]||{}))}));setConfirm(null);};
  const createDoc=()=>{
    if(!newDocTitle.trim()||!project||!module)return;
    const pId=project.id,mId=module.id,curr=getMod(pId,mId);
    const doc: Document={id:uid(),title:newDocTitle.trim(),content:'',messages:[],status:'progress',createdAt:todayStr(),updatedAt:null};
    setMod(pId,mId,{...curr,docs:[...(curr.docs||[]),doc]});
    setNewDocTitle('');setShowNewDoc(false);openDoc(doc);
  };
  const openDoc=(doc: Document)=>{setActiveDoc(doc);setEditContent(doc.content);setHasUnsaved(false);setView('document');};
  const saveDoc=()=>{
    if(!project||!module||!activeDoc)return;
    const pId=project.id,mId=module.id,curr=getMod(pId,mId),now=todayStr();
    setMod(pId,mId,{...curr,docs:curr.docs.map(d=>d.id===activeDoc.id?{...d,content:editContent,updatedAt:now}:d)});
    setActiveDoc(d=>d?({...d,content:editContent,updatedAt:now}):d);setHasUnsaved(false);
  };
  const toggleStatus=(docId: DocumentId)=>{
    if(!project||!module)return;
    const pId=project.id,mId=module.id,curr=getMod(pId,mId);
    setMod(pId,mId,{...curr,docs:curr.docs.map(d=>d.id===docId?{...d,status:d.status==='progress'?'done':'progress'}:d)});
    if(activeDoc?.id===docId)setActiveDoc(v=>v?({...v,status:v.status==='progress'?'done':'progress'}):v);
  };
  const deleteDoc=(docId: DocumentId)=>{
    if(!project||!module)return;
    const pId=project.id,mId=module.id,curr=getMod(pId,mId);
    setMod(pId,mId,{...curr,docs:curr.docs.filter(d=>d.id!==docId)});setView('module');
  };
  const renameDoc=(title: string)=>{
    if(!project||!module||!activeDoc)return;
    const pId=project.id,mId=module.id,curr=getMod(pId,mId);
    setMod(pId,mId,{...curr,docs:curr.docs.map(d=>d.id===activeDoc.id?{...d,title}:d)});
    setActiveDoc(v=>v?({...v,title}):v);
  };

  const send=async()=>{
    if(!input.trim()||loading||!project||!module||!activeDoc)return;
    const pId=project.id,mId=module.id;
    const userMsg: ChatMessage={role:'user',content:input};
    // Use functional updater to avoid stale closure — reads current pData at update time
    setInput('');setLoading(true);
    let currentMsgs: ChatMessage[]=[];
    setPData(prev=>{
      const raw=prev?.[pId]?.[mId]||{};
      const curr: DocumentModuleData={...raw,docs:raw.docs||[]};
      const doc=curr.docs.find(d=>d.id===activeDoc.id);
      currentMsgs=[...(doc?.messages||[]),userMsg];
      return{...prev,[pId]:{...(prev[pId]||{}),[mId]:{...curr,docs:curr.docs.map(d=>d.id===activeDoc.id?{...d,messages:currentMsgs}:d)}}};
    });
    const sys='Você é um assistente especialista em Game Design colaborando no documento "'+activeDoc.title+'" do módulo "'+module.label+'", projeto "'+project.name+'".\n\nCONTEÚDO ATUAL DO DOCUMENTO:\n'+(stripHtml(editContent).slice(0,900)||'{vazio}')+'\n\nCONTEXTO DO PROJETO:\n'+buildCtx(pId,mId,activeDoc.id)+'\n\nUse Markdown rico: **negrito**, # Título, ## Subtítulo, - listas. Seja detalhado e criativo. Responda em português brasileiro.';
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1200,system:sys,messages:currentMsgs})});
      const data=await r.json(),reply=data.content?.[0]?.text||'Erro.';
      const assistantMsg: ChatMessage={role:'assistant',content:reply};
      // Use functional updater again to avoid stale closure on the response write
      setPData(prev=>{
        const raw=prev?.[pId]?.[mId]||{};
        const curr: DocumentModuleData={...raw,docs:raw.docs||[]};
        const doc=curr.docs.find(d=>d.id===activeDoc.id);
        const updatedMsgs=[...(doc?.messages||[]),assistantMsg];
        return{...prev,[pId]:{...(prev[pId]||{}),[mId]:{...curr,docs:curr.docs.map(d=>d.id===activeDoc.id?{...d,messages:updatedMsgs}:d)}}};
      });
    }catch(e){console.error(e);}finally{setLoading(false);}
  };
  useEffect(()=>{chatRef.current?.scrollIntoView({behavior:'smooth'});},[pData,loading]);

  const clr=module?.color||'#7c3aed';
  const getModuleById=(id: string)=>MODULES.find(m=>m.id===id)||null;
  const setLangControl=setLang as Dispatch<SetStateAction<string>>;
  const setThemeControl=setTheme as Dispatch<SetStateAction<string>>;

  const Confirm=()=>!confirm||confirm.type==='deleteDoc'?null:(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
      <div style={{background:th.bg2,border:'1px solid '+th.border,borderRadius:18,padding:32,width:340,textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:14}}>{confirm.type==='delete'?'🗑️':'⧉'}</div>
        <h3 style={{margin:'0 0 10px',fontSize:17}}>{confirm.type==='delete'?t.conf_del:t.conf_clone}</h3>
        <p style={{color:th.dim,fontSize:13,margin:'0 0 24px'}}>{confirm.type==='delete'?t.conf_del_m+' "'+projects.find(p=>p.id===confirm.id)?.name+'" '+t.conf_del_m2:t.conf_clone_m}</p>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button style={S.btn(confirm.type==='delete'?'#ef4444':'#7c3aed')} onClick={()=>confirm.type==='delete'?deleteProject(confirm.id):cloneProject(confirm.id)}>{confirm.type==='delete'?t.del_btn:t.clone_btn}</button>
          <button style={S.btn(th.border)} onClick={()=>setConfirm(null)}>{t ? t.cancel : 'Cancelar'}</button>
        </div>
      </div>
    </div>
  );

  // NAV_LINKS generated from t inside component

  if(view==='landing')return(
    <div style={S.app}>
      <div style={{position:'fixed',top:0,left:0,right:0,zIndex:50,padding:'0 32px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',background:scrolled?th.navBg:'transparent',backdropFilter:scrolled?'blur(14px)':'none',borderBottom:scrolled?'1px solid '+th.border2:'none',transition:'all .3s'}}>
        <span style={{fontSize:17,fontWeight:800,background:'linear-gradient(135deg,#a855f7,#22d3ee)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>🎮 Game Design Tool</span>
        <div style={{display:'flex',alignItems:'center',gap:20}}>
          {[{label:t.nav1,href:'hero'},{label:t.nav2,href:'how'},{label:t.nav3,href:'modules'},{label:t.nav4,href:'forwhom'}].map(l=><button key={l.href} onClick={()=>scrollTo(l.href)} style={{background:'none',border:'none',color:th.muted,cursor:'pointer',fontSize:13,fontWeight:500,padding:0}}>{l.label}</button>)}
          <LangToggle lang={lang} setLang={setLangControl}/><ThemeToggle theme={theme} setTheme={setThemeControl}/>
          <button style={S.btn('#7c3aed','#fff',{padding:'8px 18px'})} onClick={()=>setView('dashboard')}>{t.navBtn}</button>
        </div>
      </div>
      <section id="hero" style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'120px 24px 80px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 50% 30%,#7c3aed18,transparent)',pointerEvents:'none'}}/>
        <div style={{display:'inline-block',background:'#7c3aed18',border:'1px solid #7c3aed44',borderRadius:20,padding:'6px 18px',fontSize:12,color:'#a78bfa',fontWeight:600,marginBottom:28,letterSpacing:1}}>{t.hero_badge}</div>
        <h1 style={{fontSize:'clamp(34px,6vw,70px)',fontWeight:900,lineHeight:1.1,margin:'0 0 22px',maxWidth:780}}>{t.hero_h} <span style={{background:'linear-gradient(135deg,#a855f7,#22d3ee)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{t.hero_hl}</span> {t.hero_hc}</h1>
        <p style={{fontSize:'clamp(15px,2vw,18px)',color:th.dim,maxWidth:540,lineHeight:1.72,margin:'0 0 42px'}}>{t.hero_sub}</p>
        <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center'}}>
          <button style={S.btn('#7c3aed','#fff',{padding:'14px 32px',fontSize:15,borderRadius:10})} onClick={()=>setView('dashboard')}>{t.hero_cta}</button>
          <button style={S.btn('transparent',th.muted,{padding:'14px 32px',fontSize:15,border:'1px solid '+th.border,borderRadius:10})} onClick={()=>scrollTo('how')}>{t.hero_cta2}</button>
        </div>
      </section>
      <section id="how" style={{padding:'90px 32px',maxWidth:1100,margin:'0 auto',background:th.bg}}>
        <div style={{textAlign:'center',marginBottom:52}}><div style={{color:'#22d3ee',fontSize:12,fontWeight:700,letterSpacing:2,marginBottom:12}}>{t.how_tag}</div><h2 style={{fontSize:'clamp(24px,4vw,42px)',fontWeight:800,margin:0}}>{t.how_h}</h2></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:20}}>
          {t.how_steps.map(s=>(
            <div key={s.n} style={{background:th.bg2,border:'1px solid '+s.color+'22',borderRadius:14,padding:24,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:-8,right:-8,fontSize:70,fontWeight:900,color:s.color,opacity:.05}}>{s.n}</div>
              <div style={{fontSize:32,marginBottom:14}}>{s.icon}</div>
              <div style={{color:s.color,fontWeight:800,fontSize:10,letterSpacing:2,marginBottom:7}}>{t.how_tag.split(' ')[0]} {s.n}</div>
              <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>{s.title}</div>
              <div style={{color:th.dim,lineHeight:1.6,fontSize:12}}>{s.text}</div>
            </div>
          ))}
        </div>
      </section>
      <section id="modules" style={{padding:'80px 32px',background:th.bg0}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}><div style={{color:'#f472b6',fontSize:12,fontWeight:700,letterSpacing:2,marginBottom:12}}>{t.mods_tag}</div><h2 style={{fontSize:'clamp(24px,4vw,40px)',fontWeight:800,margin:0}}>{t.mods_h}</h2></div>
          <div style={S.grid(220)}>{MODULES.map(m=><div key={m.id} style={{...S.card(m.color),cursor:'default'}}><div style={{fontSize:26,marginBottom:10}}>{m.icon}</div><div style={{color:m.color,fontWeight:700,fontSize:14,marginBottom:5}}>{m.label}</div><div style={{color:th.dim,fontSize:12,lineHeight:1.55}}>{m.desc}</div></div>)}</div>
        </div>
      </section>
      <section id="forwhom" style={{padding:'90px 32px',maxWidth:1100,margin:'0 auto',background:th.bg}}>
        <div style={{textAlign:'center',marginBottom:48}}><div style={{color:'#fbbf24',fontSize:12,fontWeight:700,letterSpacing:2,marginBottom:12}}>{t.fw_tag}</div><h2 style={{fontSize:'clamp(24px,4vw,40px)',fontWeight:800,margin:0}}>{t.fw_h}</h2></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:18}}>
          {t.fw_items.map(p=><div key={p.title} style={{background:th.bg2,border:'1px solid '+th.border2,borderRadius:12,padding:22,textAlign:'center'}}><div style={{fontSize:34,marginBottom:12}}>{p.icon}</div><div style={{fontWeight:700,fontSize:14,marginBottom:7}}>{p.title}</div><div style={{color:th.dim,fontSize:12,lineHeight:1.6}}>{p.text}</div></div>)}
        </div>
      </section>
      <section style={{padding:'70px 32px',textAlign:'center',borderTop:'1px solid '+th.border2,background:th.bg}}>
        <h2 style={{fontSize:'clamp(22px,4vw,38px)',fontWeight:900,margin:'0 0 14px'}}>{t.cta_h}</h2>
        <p style={{color:th.dim,marginBottom:32,fontSize:14}}>{t.cta_s}</p>
        <button style={S.btn('#7c3aed','#fff',{padding:'14px 34px',fontSize:15,borderRadius:12})} onClick={()=>setView('dashboard')}>{t.cta_btn}</button>
      </section>

      {/* ── Seção do Criador ─────────────────────────────────── */}
      <section id="creator" style={{padding:'90px 32px',background:th.bg0,borderTop:'1px solid '+th.border2}}>
        <div style={{maxWidth:700,margin:'0 auto',textAlign:'center'}}>
          <div style={{color:'#a78bfa',fontSize:12,fontWeight:700,letterSpacing:2,marginBottom:16}}>{t.creator_tag}</div>
          {/* Avatar placeholder */}
          <div style={{width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,margin:'0 auto 22px',boxShadow:'0 0 32px #7c3aed44'}}>
            🎮
          </div>
          <h2 style={{fontSize:'clamp(20px,3.5vw,32px)',fontWeight:900,margin:'0 0 20px',background:'linear-gradient(135deg,#a855f7,#22d3ee)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            {t.creator_h}
          </h2>
          <p style={{color:th.dim,fontSize:15,lineHeight:1.85,maxWidth:580,margin:'0 auto 32px'}}>
            {t.creator_p}
          </p>
          <a href="https://www.linkedin.com/in/victor-hugo-costa/" target="_blank" rel="noopener noreferrer"
            style={{display:'inline-flex',alignItems:'center',gap:10,background:'#0a66c2',color:'#fff',borderRadius:10,padding:'12px 26px',fontSize:14,fontWeight:700,textDecoration:'none',boxShadow:'0 4px 20px #0a66c233',transition:'opacity .2s'}}
            onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            {t.creator_contact} — LinkedIn
          </a>
        </div>
      </section>

      <footer style={{padding:'18px 32px',borderTop:'1px solid '+th.border2,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:10,color:th.dim,fontSize:12,alignItems:'center'}}>
        <span style={{fontWeight:700,color:th.muted}}>🎮 Game Design Tool</span>
        <span style={{color:'#4b5563',fontSize:11}}>Criado por <a href="https://www.linkedin.com/in/victor-hugo-costa/" target="_blank" rel="noopener noreferrer" style={{color:th.muted,textDecoration:'none',fontWeight:600}}>Victor Hugo Costa</a> para toda a comunidade Game Dev</span>
        <span>© 2026 Game Design Tool</span>
      </footer>
    </div>
  );

  if(view==='dashboard')return(
    <div style={S.app}>
      <div style={{padding:'0 24px',height:54,borderBottom:'1px solid '+th.border2,display:'flex',alignItems:'center',justifyContent:'space-between',background:th.bg,position:'sticky',top:0,zIndex:20}}>
        <button style={S.back} onClick={()=>setView('landing')}>← Início</button>
        <span style={{fontSize:16,fontWeight:800,background:'linear-gradient(135deg,#a855f7,#22d3ee)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>🎮 Game Design Tool</span>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><LangToggle lang={lang} setLang={setLangControl}/><ThemeToggle theme={theme} setTheme={setThemeControl}/><button style={S.btn()} onClick={()=>setShowNew(true)}>{t.dash_new}</button></div>
      </div>
      <div style={{padding:28}}>
        <h2 style={{margin:'0 0 4px',fontSize:22,fontWeight:700}}>{t.dash_h}</h2>
        <p style={{color:th.muted,margin:'0 0 24px',fontSize:13}}>{projects.length} projeto{projects.length!==1?'s':''}</p>
        <div style={S.grid()}>
          {projects.map(p=>{
            const prodTasks=pData?.[p.id]?.production?.tasks||[];
            const prodTotal=prodTasks.length;
            const prodDone=prodTasks.filter(t=>t.column==='done').length;
            const progress=prodTotal>0?Math.round((prodDone/prodTotal)*100):0;
            const hasKanban=prodTotal>0;
            return(
            <div key={p.id} style={{...S.card(p.color),cursor:'default'}} onMouseEnter={e=>{e.currentTarget.style.borderColor=p.color;e.currentTarget.style.transform='translateY(-2px)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor=p.color+'28';e.currentTarget.style.transform='none';}}>
              <div style={{position:'absolute',top:-20,right:-20,fontSize:80,opacity:.06}}>{p.emoji}</div>
              <div style={{position:'absolute',top:12,right:12,display:'flex',gap:5}}>
                <button title="Clonar" onClick={()=>setConfirm({type:'clone',id:p.id})} style={{background:'#1e1e30',border:'1px solid '+th.border,borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:12,color:th.muted}}>⧉</button>
                <button title="Excluir" onClick={()=>setConfirm({type:'delete',id:p.id})} style={{background:'#1e1e30',border:'1px solid '+th.border,borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:12,color:'#f87171'}}>✕</button>
              </div>
              <div style={{fontSize:34,marginBottom:14,cursor:'pointer'}} onClick={()=>{setProject(p);setView('project');}}>{p.emoji}</div>
              <div style={{fontWeight:700,fontSize:16,marginBottom:4,cursor:'pointer'}} onClick={()=>{setProject(p);setView('project');}}>{p.name}</div>
              <div style={{color:th.dim,fontSize:12,marginBottom:16}}>{p.genre} · {p.platform}</div>
              <div style={{background:'#1e1e30',borderRadius:4,height:4,marginBottom:6}}><div style={{width:progress+'%',height:'100%',background:'linear-gradient(90deg,'+p.color+','+p.color+'88)',borderRadius:4,transition:'width .4s'}}/></div>
              <div style={{color:'#334155',fontSize:11,marginBottom:14,display:'flex',alignItems:'center',gap:6}}>
                <span>{progress}% concluído</span>
                {hasKanban&&<span style={{marginLeft:'auto',color:'#f43f5e',fontSize:10,fontWeight:600}}>🏭 {prodDone}/{prodTotal} tarefas</span>}
              </div>
              <button style={S.btn(p.color+'22',p.color,{border:'1px solid '+p.color+'44',padding:'7px 14px',width:'100%',borderRadius:8,fontSize:12})} onClick={()=>{setProject(p);setView('project');}}>Abrir projeto →</button>
            </div>
            );
          })}
        </div>
      </div>
      {showNew&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}><div style={{background:th.bg2,border:'1px solid '+th.border,borderRadius:18,padding:32,width:360}}><h3 style={{margin:'0 0 22px',fontSize:18}}>Novo Projeto</h3>{[['name','Nome do jogo *'],['genre','Gênero'],['platform','Plataforma']].map(([k,l])=><div key={k} style={{marginBottom:14}}><div style={{color:th.dim,fontSize:12,marginBottom:6}}>{l}</div><input style={S.inp} value={form[k]} placeholder={l} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&createProject()}/></div>)}<div style={{display:'flex',gap:10,marginTop:22}}><button style={S.btn()} onClick={createProject}>Criar</button><button style={S.btn(th.border)} onClick={()=>setShowNew(false)}>{t.cancel}</button></div></div></div>)}
      <Confirm/>
      <footer style={{padding:'12px 24px',borderTop:'1px solid '+th.border2,textAlign:'center',color:'#4b5563',fontSize:11}}>Criado por <a href="https://www.linkedin.com/in/victor-hugo-costa/" target="_blank" rel="noopener noreferrer" style={{color:th.muted,textDecoration:'none',fontWeight:600}}>Victor Hugo Costa</a> para toda a comunidade Game Dev</footer>
    </div>
  );

  if(view==='brainstorming')return(
    !project?null:
    <CanvasBoard project={project} pData={pData} setPData={setPData} onBack={()=>setView('project')}/>
  );

  if(view==='production')return(
    !project?null:
    <KanbanBoard project={project} pData={pData} setPData={setPData} onBack={()=>setView('project')}/>
  );

  if(!project&&['mda-guided','double-a-guided','fourkeys-guided','colors-guided','octalysis-guided','pens-guided','tetrad-guided','ludonarrative-guided','reedsy-wb-guided','unity-ld-guided'].includes(view)){setView('dashboard');return null;}

  if(view==='mda-guided')return(
    <MDAGuide project={project} pData={pData} setPData={setPData}
      onBack={()=>{setView('module');setModule(getModuleById('mechanics'));}}
      onDocCreated={(doc: Document)=>{setModule(getModuleById('mechanics'));openDoc(doc);}}/>
  );

  if(view==='double-a-guided')return(
    <DoubleAGuide project={project} pData={pData} setPData={setPData}
      onBack={()=>{setCharNewMode(null);setView('module');setModule(getModuleById('characters'));}}
      onDocCreated={(doc: Document)=>{setModule(getModuleById('characters'));openDoc(doc);}}/>
  );

  if(view==='fourkeys-guided')return(
    <FourKeysGuide project={project} pData={pData} setPData={setPData}
      onBack={()=>{setView('module');setModule(getModuleById('mechanics'));}}
      onDocCreated={(doc: Document)=>{setModule(getModuleById('mechanics'));openDoc(doc);}}/>
  );

  if(view==='colors-guided')return(
    <ColorsGuide project={project} pData={pData} setPData={setPData}
      onBack={()=>{setView('module');setModule(getModuleById('mechanics'));}}
      onDocCreated={(doc: Document)=>{setModule(getModuleById('mechanics'));openDoc(doc);}}/>
  );

  if(view==='octalysis-guided')return(
    <OctalysisGuide project={project} pData={pData} setPData={setPData}
      onBack={()=>{setView('module');setModule(getModuleById('mechanics'));}}
      onDocCreated={(doc: Document)=>{setModule(getModuleById('mechanics'));openDoc(doc);}}/>
  );

  if(view==='pens-guided')return(
    <PENSGuide project={project} pData={pData} setPData={setPData}
      onBack={()=>{setView('module');setModule(getModuleById('mechanics'));}}
      onDocCreated={(doc: Document)=>{setModule(getModuleById('mechanics'));openDoc(doc);}}/>
  );

  if(view==='tetrad-guided')return(
    <ElementalTetradGuide project={project} pData={pData} setPData={setPData}
      onBack={()=>{setView('module');setModule(getModuleById('mechanics'));}}
      onDocCreated={(doc: Document)=>{setModule(getModuleById('mechanics'));openDoc(doc);}}/>
  );

  if(view==='ludonarrative-guided')return(
    <LudonarrativeGuide project={project} pData={pData} setPData={setPData}
      onBack={()=>{setView('module');setModule(getModuleById('narrative'));}}
      onDocCreated={(doc: Document)=>{setModule(getModuleById('narrative'));openDoc(doc);}}/>
  );

  if(view==='reedsy-wb-guided')return(
    <ReedsyWorldbuildingGuide project={project} pData={pData} setPData={setPData}
      onBack={()=>{setView('module');setModule(getModuleById('worldbuilding'));}}
      onDocCreated={(doc: Document)=>{setModule(getModuleById('worldbuilding'));openDoc(doc);}}/>
  );

  if(view==='unity-ld-guided')return(
    <UnityLDGuide project={project} pData={pData} setPData={setPData}
      onBack={()=>{setView('module');setModule(getModuleById('leveldesign'));}}
      onDocCreated={(doc: Document)=>{setModule(getModuleById('leveldesign'));openDoc(doc);}}/>
  );

  if(view==='flow-builder')return(
    !project?null:
    <FlowBuilder project={project} pData={pData} setPData={setPData} doc={activeDoc} lang={lang}
      onBack={()=>{setView('module');setModule(getModuleById('flowcharts'));}}/>
  );

  if(view==='project')return(!project?null:
    <div style={S.app}>
      <div style={{padding:'0 24px',height:54,borderBottom:'1px solid '+th.border2,display:'flex',alignItems:'center',justifyContent:'space-between',background:th.bg,position:'sticky',top:0,zIndex:20}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button style={S.back} onClick={()=>setView('dashboard')}>← Dashboard</button>
          <span style={{fontWeight:700,fontSize:15}}>{project.emoji} {project.name}</span>
          <span style={{color:th.muted,fontSize:12}}>{project.genre} · {project.platform}</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><LangToggle lang={lang} setLang={setLangControl}/><ThemeToggle theme={theme} setTheme={setThemeControl}/><button style={S.btn('#1a1a2e','#a78bfa',{border:'1px solid #4c1d9544',padding:'7px 16px',fontSize:13})} onClick={()=>setShowExport(true)}>📥 Exportar GDD</button></div>
      </div>
      <div style={{padding:28}}>
        <h2 style={{margin:'0 0 4px',fontSize:20,fontWeight:700}}>Módulos</h2>
        <p style={{color:th.muted,margin:'0 0 24px',fontSize:13}}>Selecione um módulo para criar e organizar seus documentos</p>
        <div style={S.grid()}>
          {MODULES.map(m=>{
            const isBrain=m.id==='brainstorming';
            const isProd=m.id==='production';
            const docs=isBrain||isProd?[]:getMod(project.id,m.id).docs||[];
            const doneCount=docs.filter(d=>d.status==='done').length;
            const taskCount=isProd?(pData?.[project.id]?.production?.tasks||[]).length:0;
            const taskDone=isProd?(pData?.[project.id]?.production?.tasks||[]).filter(t=>t.column==='done').length:0;
            const taskPct=taskCount>0?Math.round((taskDone/taskCount)*100):0;
            return(
              <div key={m.id} style={S.card(m.color)}
                onClick={()=>{if(isBrain){setView('brainstorming');}else if(isProd){setView('production');}else{setModule(m);setView('module');}}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=m.color+'28';e.currentTarget.style.transform='none';}}>
                <div style={{position:'absolute',top:-14,right:-14,fontSize:60,opacity:.05}}>{m.icon}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div style={{fontSize:28,marginBottom:12}}>{m.icon}</div>
                  {!isBrain&&!isProd&&docs.length>0&&<div style={{background:m.color,borderRadius:10,padding:'2px 9px',fontSize:10,fontWeight:700,color:'#000'}}>{doneCount}/{docs.length}</div>}
                  {isBrain&&<div style={{background:m.color+'22',border:'1px solid '+m.color+'44',borderRadius:10,padding:'2px 9px',fontSize:10,fontWeight:700,color:m.color}}>Canvas</div>}
                  {isProd&&<div style={{background:m.color+'22',border:'1px solid '+m.color+'44',borderRadius:10,padding:'2px 9px',fontSize:10,fontWeight:700,color:m.color}}>Kanban</div>}
                </div>
                <div style={{fontWeight:700,fontSize:14,color:m.color,marginBottom:5}}>{m.label}</div>
                <div style={{color:th.dim,fontSize:12,lineHeight:1.5,marginBottom:10}}>{m.desc}</div>
                <div style={{fontSize:11,color:'#334155'}}>{isBrain?'Post-its · Caneta · Benchmarking IA':isProd?(taskCount===0?'Nenhuma tarefa — clique para começar':<span style={{display:'flex',flexDirection:'column',gap:4}}><span>{taskCount+' tarefa'+(taskCount!==1?'s':'')+' · '+taskDone+' concluída'+(taskDone!==1?'s':'')}</span><div style={{height:3,background:m.color+'22',borderRadius:2}}><div style={{width:taskPct+'%',height:'100%',background:m.color,borderRadius:2,transition:'width .3s'}}/></div></span>):docs.length===0?'Nenhum documento':docs.length+' documento'+(docs.length!==1?'s':'')+' · '+doneCount+' concluído'+(doneCount!==1?'s':'')}</div>
              </div>
            );
          })}
        </div>
      </div>
      {showExport&&<GDDExporter project={project} pData={pData} lang={lang} onClose={()=>setShowExport(false)}/>}
      <Confirm/>
      <footer style={{padding:'12px 24px',borderTop:'1px solid '+th.border2,textAlign:'center',color:'#4b5563',fontSize:11}}>Criado por <a href="https://www.linkedin.com/in/victor-hugo-costa/" target="_blank" rel="noopener noreferrer" style={{color:th.muted,textDecoration:'none',fontWeight:600}}>Victor Hugo Costa</a> para toda a comunidade Game Dev</footer>
    </div>
  );

  if(view==='module'){
    if(!project||!module)return null;
    const docs=modDocs();
    const isMechanics=module.id==='mechanics';
    const isNarrative=module.id==='narrative';
    const isWorldbuilding=module.id==='worldbuilding';
    const isFlowcharts=module.id==='flowcharts';
    const isLevelDesign=module.id==='leveldesign';
    const isCharacters=module.id==='characters';
    const openNewFlow=()=>{
      const doc: Document={id:uid(),title:'Novo Fluxo',content:'',flowData:{nodes:[],edges:[]},framework:'flowbuilder',status:'progress',createdAt:todayStr()};
      setActiveDoc(doc);setView('flow-builder');
    };
    const openFlowDoc=(doc: Document)=>{setActiveDoc(doc);setView('flow-builder');};
    const openNewDocFlow=()=>isMechanics?setMechNewMode('choice'):isNarrative?setNarrNewMode('choice'):isWorldbuilding?setWbNewMode('choice'):isFlowcharts?openNewFlow():isLevelDesign?setLdNewMode('choice'):isCharacters?setCharNewMode('choice'):setShowNewDoc(true);
    const newBtnLabel=isFlowcharts?'+ '+t.flow_new:t.mod_newdoc;
    return(
      <div style={S.app}>
        <div style={{padding:'0 20px',height:54,borderBottom:'1px solid '+th.border2,display:'flex',alignItems:'center',justifyContent:'space-between',background:th.bg,position:'sticky',top:0,zIndex:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}><button style={S.back} onClick={()=>setView('project')}>← {project.name}</button><span style={{color:clr,fontWeight:700,fontSize:15}}>{module.icon} {module.label}</span></div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}><LangToggle lang={lang} setLang={setLangControl}/><ThemeToggle theme={theme} setTheme={setThemeControl}/><button style={S.btn(clr,'#fff',{padding:'7px 16px',fontSize:13})} onClick={openNewDocFlow}>{newBtnLabel}</button></div>
        </div>
        <div style={{padding:28}}>
          <h2 style={{margin:'0 0 4px',fontSize:20,fontWeight:700}}>{module.icon} {module.label}</h2>
          <p style={{color:th.muted,margin:'0 0 28px',fontSize:13}}>{module.desc}</p>
          {docs.length===0?(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 24px',textAlign:'center'}}>
              <div style={{fontSize:60,marginBottom:18,opacity:.25}}>{module.icon}</div>
              <div style={{fontSize:18,fontWeight:700,color:'#334155',marginBottom:10}}>Nenhum documento ainda</div>
              <div style={{color:th.muted,fontSize:13,maxWidth:380,lineHeight:1.65,marginBottom:28}}>Cada documento tem seu próprio editor e conversa exclusiva com a IA.</div>
              <button style={S.btn(clr,'#fff',{padding:'12px 28px',fontSize:14,borderRadius:10})} onClick={openNewDocFlow}>+ {isFlowcharts?'Criar primeiro fluxo':'Criar primeiro documento'}</button>
            </div>
          ):(
            <div style={S.grid()}>
              {docs.map(doc=>{const st=STATUS_L[doc.status]||STATUS_L.progress,msgCount=doc.messages?.filter(m=>m.role==='user').length||0,preview=stripHtml(doc.content).slice(0,100);return(
                <div key={doc.id} style={S.card(clr)} onClick={()=>isFlowcharts?openFlowDoc(doc):openDoc(doc)} onMouseEnter={e=>{e.currentTarget.style.borderColor=clr;e.currentTarget.style.transform='translateY(-2px)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor=clr+'28';e.currentTarget.style.transform='none';}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10,gap:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,flex:1,minWidth:0}}>
                      {doc.framework==='mda'&&<span title="Criado com MDA" style={{fontSize:10,background:'#fbbf2418',color:'#fbbf24',border:'1px solid #fbbf2430',borderRadius:5,padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>📐 MDA</span>}
                      {doc.framework==='4keys'&&<span title="Criado com 4 Keys to Fun" style={{fontSize:10,background:'#ec489918',color:'#ec4899',border:'1px solid #ec489930',borderRadius:5,padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>🗝️ 4 Keys</span>}
                      {doc.framework==='colors'&&<span title="Criado com Colors of Game Design" style={{fontSize:10,background:'#22d3ee18',color:'#22d3ee',border:'1px solid #22d3ee30',borderRadius:5,padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>🎨 Colors</span>}
                      {doc.framework==='octalysis'&&<span title="Criado com Octalysis" style={{fontSize:10,background:'#f9731618',color:'#f97316',border:'1px solid #f9731630',borderRadius:5,padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>🔷 Octalysis</span>}
                      {doc.framework==='pens'&&<span title="Criado com PENS" style={{fontSize:10,background:'#818cf818',color:'#818cf8',border:'1px solid #818cf830',borderRadius:5,padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>🧠 PENS</span>}
                      {doc.framework==='tetrad'&&<span title="Criado com Elemental Tetrad" style={{fontSize:10,background:'#f59e0b18',color:'#f59e0b',border:'1px solid #f59e0b30',borderRadius:5,padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>◈ Tetrad</span>}
                      {doc.framework==='ludonarrative'&&<span title="Criado com Ludonarrative Framework" style={{fontSize:10,background:'#e879f918',color:'#e879f9',border:'1px solid #e879f930',borderRadius:5,padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>🎭 Ludo</span>}
                      {doc.framework==='reedsy-wb'&&<span title="Criado com o Guia de Worldbuilding" style={{fontSize:10,background:'#22d3ee18',color:'#22d3ee',border:'1px solid #22d3ee30',borderRadius:5,padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>🌍 WB Guide</span>}
                      {doc.framework==='unity-ld'&&<span title="Criado com o Guia de Level Design" style={{fontSize:10,background:'#34d39918',color:'#34d399',border:'1px solid #34d39930',borderRadius:5,padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>🗺️ LD Guide</span>}
                      {doc.framework==='double-a'&&<span title="Criado com o Double A Framework" style={{fontSize:10,background:'#a855f718',color:'#a855f7',border:'1px solid #a855f730',borderRadius:5,padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>🃏 Double A</span>}
                      {doc.framework==='flowbuilder'&&<span title="Fluxo visual" style={{fontSize:10,background:'#f472b618',color:'#f472b6',border:'1px solid #f472b630',borderRadius:5,padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>🔀 Fluxo</span>}
                      {doc.framework==='double-a'&&<span title="Criado com Double A Framework" style={{fontSize:10,background:'#a855f718',color:'#a855f7',border:'1px solid #a855f730',borderRadius:5,padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>🃏 Double A</span>}
                      <div style={{fontWeight:700,fontSize:15,color:th.text,lineHeight:1.3}}>{doc.title}</div>
                    </div>
                    <span style={{background:st.bg,border:'1px solid '+st.color+'40',color:st.color,borderRadius:10,padding:'2px 10px',fontSize:10,fontWeight:700,whiteSpace:'nowrap',flexShrink:0}}>{st.label}</span>
                  </div>
                  {isFlowcharts
                    ?<div style={{color:th.muted,fontSize:12,lineHeight:1.55,marginBottom:14}}>{(doc.flowData?.nodes?.length||0)} nós · {(doc.flowData?.edges?.length||0)} conexões</div>
                    :(preview&&<div style={{color:th.muted,fontSize:12,lineHeight:1.55,marginBottom:14}}>{preview}{doc.content.length>100?'…':''}</div>)
                  }
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8,borderTop:'1px solid '+th.border2}}>
                    <span style={{fontSize:10,color:'#334155'}}>{doc.updatedAt?'Editado '+doc.updatedAt:doc.createdAt}</span>
                    {msgCount>0&&<span style={{fontSize:10,color:th.muted}}>{msgCount} msg IA</span>}
                  </div>
                </div>
              );})}
              <div style={{background:th.bg2,border:'2px dashed '+clr+'30',borderRadius:14,padding:20,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:140,gap:8,transition:'all .2s'}} onClick={openNewDocFlow} onMouseEnter={e=>{e.currentTarget.style.borderColor=clr+'70';e.currentTarget.style.background=th.bg3;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=clr+'30';e.currentTarget.style.background=th.bg2;}}>
                <div style={{fontSize:26,opacity:.35}}>+</div><div style={{color:th.muted,fontSize:13,fontWeight:600}}>{isFlowcharts?'Novo fluxo':'Novo documento'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Mechanics: choice modal */}
        {isMechanics&&mechNewMode==='choice'&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
            <div style={{background:th.bg2,border:'1px solid '+th.border,borderRadius:20,padding:32,width:460}}>
              <div style={{fontSize:32,marginBottom:10}}>⚙️</div>
              <h3 style={{margin:'0 0 6px',fontSize:18}}>Novo documento de Mecânica</h3>
              <p style={{color:th.dim,fontSize:13,margin:'0 0 24px',lineHeight:1.6}}>Crie um documento em branco ou use um framework para guiar a criação.</p>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:22}}>
                <div onClick={()=>{setMechNewMode(null);setShowNewDoc(true);}} style={{background:th.bg3,border:'1px solid '+th.border,borderRadius:12,padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#fbbf2455'} onMouseLeave={e=>e.currentTarget.style.borderColor=th.border}>
                  <span style={{fontSize:28}}>📄</span>
                  <div><div style={{fontWeight:700,fontSize:14,marginBottom:3}}>Documento em branco</div><div style={{color:th.muted,fontSize:12}}>Editor livre com IA — sem estrutura predefinida.</div></div>
                </div>
                <div onClick={()=>setMechNewMode('frameworks')} style={{background:th.bg3,border:'1px solid #fbbf2430',borderRadius:12,padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#fbbf2488'} onMouseLeave={e=>e.currentTarget.style.borderColor='#fbbf2430'}>
                  <span style={{fontSize:28}}>📐</span>
                  <div><div style={{fontWeight:700,fontSize:14,color:'#fbbf24',marginBottom:3}}>Usar um Framework</div><div style={{color:th.muted,fontSize:12}}>A ferramenta guia a criação com base numa metodologia.</div></div>
                  <span style={{marginLeft:'auto',color:'#fbbf24',fontSize:13,fontWeight:700}}>→</span>
                </div>
              </div>
              <button style={S.btn(th.border,th.dim,{width:'100%'})} onClick={()=>setMechNewMode(null)}>{t.cancel}</button>
            </div>
          </div>
        )}

        {/* Mechanics: framework picker */}
        {isMechanics&&mechNewMode==='frameworks'&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
            <div style={{background:th.bg2,border:'1px solid '+th.border,borderRadius:20,padding:32,width:520,maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                <button style={S.back} onClick={()=>setMechNewMode('choice')}>← Voltar</button>
                <div><div style={{fontWeight:800,fontSize:17}}>📐 Escolha um Framework</div><div style={{color:th.muted,fontSize:12,marginTop:2}}>Metodologias de Game Design para guiar sua criação</div></div>
              </div>
              <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
                {/* MDA Card */}
                <div onClick={()=>{setMechNewMode(null);setView('mda-guided');}} style={{background:th.bg3,border:'1px solid #fbbf2444',borderRadius:14,padding:'18px 20px',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='#1e1a10';e.currentTarget.style.borderColor='#fbbf24aa';}} onMouseLeave={e=>{e.currentTarget.style.background=th.bg3;e.currentTarget.style.borderColor='#fbbf2444';}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{fontSize:36,lineHeight:1}}>🎭</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                        <div style={{fontWeight:800,fontSize:15,color:'#fbbf24'}}>MDA Framework</div>
                        <span style={{background:'#34d39918',color:'#34d399',border:'1px solid #34d39930',borderRadius:8,padding:'1px 8px',fontSize:10,fontWeight:700}}>Disponível</span>
                      </div>
                      <div style={{color:th.dim,fontSize:12,lineHeight:1.65,marginBottom:10}}>Mechanics, Dynamics, Aesthetics — de Hunicke, LeBlanc e Zubek (GDC 2001–2004). Abordagem formal que parte da experiência emocional desejada para chegar às regras do jogo.</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {['🎭 Estética','⚡ Dinâmica','⚙️ Mecânica'].map(t=><span key={t} style={{background:'#fbbf2412',border:'1px solid #fbbf2425',color:'#fbbf24',borderRadius:6,padding:'2px 9px',fontSize:11}}>{t}</span>)}
                      </div>
                    </div>
                    <span style={{color:'#fbbf24',fontSize:18,fontWeight:700,flexShrink:0}}>→</span>
                  </div>
                </div>
                {/* 4 Keys Card */}
                <div onClick={()=>{setMechNewMode(null);setView('fourkeys-guided');}} style={{background:th.bg3,border:'1px solid #ec489944',borderRadius:14,padding:'18px 20px',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='#1e1015';e.currentTarget.style.borderColor='#ec4899aa';}} onMouseLeave={e=>{e.currentTarget.style.background=th.bg3;e.currentTarget.style.borderColor='#ec489944';}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{fontSize:36,lineHeight:1}}>🗝️</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                        <div style={{fontWeight:800,fontSize:15,color:'#ec4899'}}>4 Keys to Fun</div>
                        <span style={{background:'#34d39918',color:'#34d399',border:'1px solid #34d39930',borderRadius:8,padding:'1px 8px',fontSize:10,fontWeight:700}}>Disponível</span>
                      </div>
                      <div style={{color:th.dim,fontSize:12,lineHeight:1.65,marginBottom:10}}>Por que jogamos — de Nicole Lazzaro / XEODesign (2004). Quatro chaves para emoção sem narrativa: Hard Fun, Easy Fun, Altered States e The People Factor.</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {['⚔️ Hard Fun','🔭 Easy Fun','🌀 Altered States','👥 People Factor'].map(t=><span key={t} style={{background:'#ec489912',border:'1px solid #ec489925',color:'#ec4899',borderRadius:6,padding:'2px 9px',fontSize:11}}>{t}</span>)}
                      </div>
                    </div>
                    <span style={{color:'#ec4899',fontSize:18,fontWeight:700,flexShrink:0}}>→</span>
                  </div>
                </div>
                {/* Placeholder frameworks */}
                {/* Colors of Game Design Card */}
                <div onClick={()=>{setMechNewMode(null);setView('colors-guided');}} style={{background:th.bg3,border:'1px solid #22d3ee44',borderRadius:14,padding:'18px 20px',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='#091a1e';e.currentTarget.style.borderColor='#22d3eeaa';}} onMouseLeave={e=>{e.currentTarget.style.background=th.bg3;e.currentTarget.style.borderColor='#22d3ee44';}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{fontSize:36,lineHeight:1}}>🎨</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                        <div style={{fontWeight:800,fontSize:15,color:'#22d3ee'}}>Colors of Game Design</div>
                        <span style={{background:'#34d39918',color:'#34d399',border:'1px solid #34d39930',borderRadius:8,padding:'1px 8px',fontSize:10,fontWeight:700}}>Disponível</span>
                      </div>
                      <div style={{color:th.dim,fontSize:12,lineHeight:1.65,marginBottom:10}}>Por Felipe Dal Molin (2022). 4 cores primárias + 4 secundárias + Structure formam o mapa completo do seu jogo — uma roda visual interativa que se preenche conforme você design.</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {['🎮 Toy','🌟 Fantasy','⚡ Tension','📈 Progress','⚔️ Struggle','☠️ Risk','🎯 Purpose','🏆 Reward'].map(t=><span key={t} style={{background:'#22d3ee12',border:'1px solid #22d3ee25',color:'#22d3ee',borderRadius:6,padding:'2px 9px',fontSize:10}}>{t}</span>)}
                      </div>
                    </div>
                    <span style={{color:'#22d3ee',fontSize:18,fontWeight:700,flexShrink:0}}>→</span>
                  </div>
                </div>
                {/* Octalysis Card */}
                <div onClick={()=>{setMechNewMode(null);setView('octalysis-guided');}} style={{background:th.bg3,border:'1px solid #f9731644',borderRadius:14,padding:'18px 20px',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='#1a1008';e.currentTarget.style.borderColor='#f97316aa';}} onMouseLeave={e=>{e.currentTarget.style.background=th.bg3;e.currentTarget.style.borderColor='#f9731644';}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{fontSize:36,lineHeight:1}}>🔷</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                        <div style={{fontWeight:800,fontSize:15,color:'#f97316'}}>Octalysis</div>
                        <span style={{background:'#34d39918',color:'#34d399',border:'1px solid #34d39930',borderRadius:8,padding:'1px 8px',fontSize:10,fontWeight:700}}>Disponível</span>
                      </div>
                      <div style={{color:th.dim,fontSize:12,lineHeight:1.65,marginBottom:10}}>De Yu-kai Chou (3.400+ citações acadêmicas). 8 Core Drives de motivação humana distribuídos em um octágono com balanço White Hat/Black Hat e Left/Right Brain.</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {['👑 Epic Meaning','⭐ Accomplishment','🎨 Creativity','💰 Ownership','👥 Social','💎 Scarcity','🎲 Curiosity','💀 Loss & Avoidance'].map(t=><span key={t} style={{background:'#f9731612',border:'1px solid #f9731625',color:'#f97316',borderRadius:6,padding:'2px 8px',fontSize:10}}>{t}</span>)}
                      </div>
                    </div>
                    <span style={{color:'#f97316',fontSize:18,fontWeight:700,flexShrink:0}}>→</span>
                  </div>
                </div>
                {/* PENS Card */}
                <div onClick={()=>{setMechNewMode(null);setView('pens-guided');}} style={{background:th.bg3,border:'1px solid #818cf844',borderRadius:14,padding:'18px 20px',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='#0e0e22';e.currentTarget.style.borderColor='#818cf8aa';}} onMouseLeave={e=>{e.currentTarget.style.background=th.bg3;e.currentTarget.style.borderColor='#818cf844';}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{fontSize:36,lineHeight:1}}>🧠</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                        <div style={{fontWeight:800,fontSize:15,color:'#818cf8'}}>PENS</div>
                        <span style={{background:'#34d39918',color:'#34d399',border:'1px solid #34d39930',borderRadius:8,padding:'1px 8px',fontSize:10,fontWeight:700}}>Disponível</span>
                      </div>
                      <div style={{color:th.dim,fontSize:12,lineHeight:1.65,marginBottom:10}}>De Ryan, Rigby & Przybylski (2006), baseado na Self-Determination Theory. 3 necessidades universais (Competência, Autonomia, Relatedness) + 2 game-specific (Controls, Presence). Inclui guia de playtest com questões validadas.</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {['⚡ Competence','🧭 Autonomy','💞 Relatedness','🎮 Intuitive Controls','🌌 Presence'].map(t=><span key={t} style={{background:'#818cf812',border:'1px solid #818cf825',color:'#818cf8',borderRadius:6,padding:'2px 8px',fontSize:10}}>{t}</span>)}
                      </div>
                    </div>
                    <span style={{color:'#818cf8',fontSize:18,fontWeight:700,flexShrink:0}}>→</span>
                  </div>
                </div>
                {/* Elemental Tetrad Card */}
                <div onClick={()=>{setMechNewMode(null);setView('tetrad-guided');}} style={{background:th.bg3,border:'1px solid #f59e0b44',borderRadius:14,padding:'18px 20px',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='#131008';e.currentTarget.style.borderColor='#f59e0baa';}} onMouseLeave={e=>{e.currentTarget.style.background=th.bg3;e.currentTarget.style.borderColor='#f59e0b44';}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{fontSize:36,lineHeight:1}}>◈</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                        <div style={{fontWeight:800,fontSize:15,color:'#f59e0b'}}>Elemental Tetrad</div>
                        <span style={{background:'#34d39918',color:'#34d399',border:'1px solid #34d39930',borderRadius:8,padding:'1px 8px',fontSize:10,fontWeight:700}}>Disponível</span>
                      </div>
                      <div style={{color:th.dim,fontSize:12,lineHeight:1.65,marginBottom:10}}>De Jesse Schell (The Art of Game Design, 2008). 4 elementos fundacionais em formato de diamante — Aesthetics no topo, Mechanics e Story no centro, Technology na base. Foco em harmonia: cada elemento reforçando um tema central.</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {['🔧 Technology','⚙️ Mechanics','📖 Story','✨ Aesthetics'].map(t=><span key={t} style={{background:'#f59e0b12',border:'1px solid #f59e0b25',color:'#f59e0b',borderRadius:6,padding:'2px 8px',fontSize:10}}>{t}</span>)}
                      </div>
                    </div>
                    <span style={{color:'#f59e0b',fontSize:18,fontWeight:700,flexShrink:0}}>→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Narrative: choice modal */}
        {isNarrative&&narrNewMode==='choice'&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
            <div style={{background:th.bg2,border:'1px solid '+th.border,borderRadius:20,padding:32,width:480}}>
              <div style={{fontSize:32,marginBottom:10}}>📖</div>
              <h3 style={{margin:'0 0 6px',fontSize:18}}>Novo documento de Narrativa</h3>
              <p style={{color:th.dim,fontSize:13,margin:'0 0 24px',lineHeight:1.6}}>Crie um documento em branco ou use o framework Ludonarrativo para guiar a criação.</p>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:22}}>
                <div onClick={()=>{setNarrNewMode(null);setShowNewDoc(true);}} style={{background:th.bg3,border:'1px solid '+th.border,borderRadius:12,padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#e879f955'} onMouseLeave={e=>e.currentTarget.style.borderColor=th.border}>
                  <span style={{fontSize:28}}>📄</span>
                  <div><div style={{fontWeight:700,fontSize:14,marginBottom:3}}>Documento em branco</div><div style={{color:th.muted,fontSize:12}}>Editor livre com IA — sem estrutura predefinida.</div></div>
                </div>
                <div onClick={()=>{setNarrNewMode(null);setView('ludonarrative-guided');}} style={{background:th.bg3,border:'1px solid #e879f930',borderRadius:12,padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#e879f988'} onMouseLeave={e=>e.currentTarget.style.borderColor='#e879f930'}>
                  <span style={{fontSize:28}}>🎭</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:'#e879f9',marginBottom:3}}>Framework Ludonarrativo</div>
                    <div style={{color:th.muted,fontSize:12}}>Guia completo: Análise → Loops → Interações → Sinergia. Baseado em Ash & Despain (SMU Guildhall, 2016).</div>
                  </div>
                  <span style={{marginLeft:'auto',color:'#e879f9',fontSize:13,fontWeight:700}}>→</span>
                </div>
              </div>
              <button style={S.btn(th.border,th.dim,{width:'100%'})} onClick={()=>setNarrNewMode(null)}>{t.cancel}</button>
            </div>
          </div>
        )}
        {/* Characters: choice modal */}
        {isCharacters&&charNewMode==='choice'&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
            <div style={{background:th.bg2,border:'1px solid '+th.border,borderRadius:20,padding:32,width:480}}>
              <div style={{fontSize:32,marginBottom:10}}>🧙</div>
              <h3 style={{margin:'0 0 6px',fontSize:18}}>Novo Personagem</h3>
              <p style={{color:th.dim,fontSize:13,margin:'0 0 24px',lineHeight:1.6}}>Crie um documento em branco ou use o <strong style={{color:'#a855f7'}}>Double A Framework</strong> para estruturar seu personagem com Atributos e Arquétipos.</p>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:22}}>
                <div onClick={()=>{setCharNewMode(null);setShowNewDoc(true);}} style={{background:th.bg3,border:'1px solid '+th.border,borderRadius:12,padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#a855f755'} onMouseLeave={e=>e.currentTarget.style.borderColor=th.border}>
                  <span style={{fontSize:28}}>📄</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:clr,marginBottom:3}}>Documento em branco</div>
                    <div style={{color:th.muted,fontSize:12}}>Editor livre com assistência de IA.</div>
                  </div>
                  <span style={{marginLeft:'auto',color:clr,fontSize:13,fontWeight:700}}>→</span>
                </div>
                <div onClick={()=>{setCharNewMode(null);setView('double-a-guided');}} style={{background:th.bg3,border:'1px solid #a855f730',borderRadius:12,padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='#160a24';e.currentTarget.style.borderColor='#a855f7aa';}} onMouseLeave={e=>{e.currentTarget.style.background=th.bg3;e.currentTarget.style.borderColor='#a855f730';}}>
                  <span style={{fontSize:28}}>🃏</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#a855f7',marginBottom:3}}>Double A Framework</div>
                    <div style={{color:th.muted,fontSize:12,lineHeight:1.5}}>Estruture seu personagem combinando Mecânica, Atributos e Arquétipos. Criado por Victor Hugo Costa.</div>
                  </div>
                  <span style={{marginLeft:'auto',color:'#a855f7',fontSize:13,fontWeight:700}}>→</span>
                </div>
              </div>
              <button style={S.btn(th.border,th.dim,{width:'100%'})} onClick={()=>setCharNewMode(null)}>{t.cancel}</button>
            </div>
          </div>
        )}

        {showNewDoc&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}><div style={{background:th.bg2,border:'1px solid '+th.border,borderRadius:18,padding:32,width:400}}><div style={{fontSize:34,marginBottom:12}}>{module.icon}</div><h3 style={{margin:'0 0 6px',fontSize:18}}>Novo documento</h3><p style={{color:th.dim,fontSize:12,margin:'0 0 18px'}}>Dê um nome claro para facilitar a organização.</p><input style={S.inp} value={newDocTitle} placeholder="Ex: Floresta Sombria, Sistema de Combate..." onChange={e=>setNewDocTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createDoc()} autoFocus/><div style={{display:'flex',gap:10,marginTop:18}}><button style={S.btn(clr)} onClick={createDoc}>Criar e abrir</button><button style={S.btn(th.border)} onClick={()=>{setShowNewDoc(false);setNewDocTitle('');}}>{t.cancel}</button></div></div></div>)}

        {/* Worldbuilding: choice modal */}
        {isWorldbuilding&&wbNewMode==='choice'&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
            <div style={{background:th.bg2,border:'1px solid '+th.border,borderRadius:20,padding:32,width:480}}>
              <div style={{fontSize:32,marginBottom:10}}>🌍</div>
              <h3 style={{margin:'0 0 6px',fontSize:18}}>Novo documento de Worldbuilding</h3>
              <p style={{color:th.dim,fontSize:13,margin:'0 0 24px',lineHeight:1.6}}>Crie um documento em branco ou use o Guia Reedsy para construir seu mundo passo a passo.</p>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:22}}>
                <div onClick={()=>{setWbNewMode(null);setShowNewDoc(true);}} style={{background:th.bg3,border:'1px solid '+th.border,borderRadius:12,padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#22d3ee55'} onMouseLeave={e=>e.currentTarget.style.borderColor=th.border}>
                  <span style={{fontSize:28}}>📄</span>
                  <div><div style={{fontWeight:700,fontSize:14,marginBottom:3}}>Documento em branco</div><div style={{color:th.muted,fontSize:12}}>Editor livre com IA — sem estrutura predefinida.</div></div>
                </div>
                <div onClick={()=>{setWbNewMode(null);setView('reedsy-wb-guided');}} style={{background:th.bg3,border:'1px solid #22d3ee30',borderRadius:12,padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#22d3ee88'} onMouseLeave={e=>e.currentTarget.style.borderColor='#22d3ee30'}>
                  <span style={{fontSize:28}}>🗺️</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:'#22d3ee',marginBottom:3}}>Guia de Worldbuilding</div>
                    <div style={{color:th.muted,fontSize:12}}>7 seções guiadas: Básico → Geografia → Povos → Civilização → Magia & Tech → Economia → Política.</div>
                  </div>
                  <span style={{marginLeft:'auto',color:'#22d3ee',fontSize:13,fontWeight:700}}>→</span>
                </div>
              </div>
              <button style={S.btn(th.border,th.dim,{width:'100%'})} onClick={()=>setWbNewMode(null)}>{t.cancel}</button>
            </div>
          </div>
        )}

        {/* Level Design: choice modal */}
        {isLevelDesign&&ldNewMode==='choice'&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
            <div style={{background:th.bg2,border:'1px solid '+th.border,borderRadius:20,padding:32,width:480}}>
              <div style={{fontSize:32,marginBottom:10}}>🗺️</div>
              <h3 style={{margin:'0 0 6px',fontSize:18}}>Novo documento de Level Design</h3>
              <p style={{color:th.dim,fontSize:13,margin:'0 0 24px',lineHeight:1.6}}>Crie um documento em branco ou use o Guia de Level Design baseado no e-book da Unity.</p>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:22}}>
                <div onClick={()=>{setLdNewMode(null);setShowNewDoc(true);}} style={{background:th.bg3,border:'1px solid '+th.border,borderRadius:12,padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#34d39955'} onMouseLeave={e=>e.currentTarget.style.borderColor=th.border}>
                  <span style={{fontSize:28}}>📄</span>
                  <div><div style={{fontWeight:700,fontSize:14,marginBottom:3}}>Documento em branco</div><div style={{color:th.muted,fontSize:12}}>Editor livre com IA — sem estrutura predefinida.</div></div>
                </div>
                <div onClick={()=>{setLdNewMode(null);setView('unity-ld-guided');}} style={{background:th.bg3,border:'1px solid #34d39930',borderRadius:12,padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#34d39988'} onMouseLeave={e=>e.currentTarget.style.borderColor='#34d39930'}>
                  <span style={{fontSize:28}}>🎮</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:'#34d399',marginBottom:3}}>Guia de Level Design</div>
                    <div style={{color:th.muted,fontSize:12}}>8 etapas: Conceito → 3Cs & Métricas → Paper Design → Narrativa Ambiental → Player Pathing → Ensino de Mecânicas → Navegação → Compilar.</div>
                  </div>
                  <span style={{marginLeft:'auto',color:'#34d399',fontSize:13,fontWeight:700}}>→</span>
                </div>
              </div>
              <button style={S.btn(th.border,th.dim,{width:'100%'})} onClick={()=>setLdNewMode(null)}>{t.cancel}</button>
            </div>
          </div>
        )}

        {/* Characters: Double A choice modal */}
        {isCharacters&&charNewMode==='choice'&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
            <div style={{background:th.bg2,border:'1px solid '+th.border,borderRadius:20,padding:32,width:500}}>
              <div style={{fontSize:32,marginBottom:10}}>🧙</div>
              <h3 style={{margin:'0 0 6px',fontSize:18}}>Novo documento de Personagem</h3>
              <p style={{color:th.dim,fontSize:13,margin:'0 0 24px',lineHeight:1.6}}>Crie um documento em branco ou use o Double A Framework para estruturar seu personagem passo a passo.</p>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:22}}>
                <div onClick={()=>{setCharNewMode(null);setShowNewDoc(true);}} style={{background:th.bg3,border:'1px solid '+th.border,borderRadius:12,padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#a855f755'} onMouseLeave={e=>e.currentTarget.style.borderColor=th.border}>
                  <span style={{fontSize:28}}>📄</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>Documento em branco</div>
                    <div style={{color:th.muted,fontSize:12}}>Editor livre com IA — sem estrutura predefinida.</div>
                  </div>
                </div>
                <div onClick={()=>{setCharNewMode(null);setView('double-a-guided');}} style={{background:th.bg3,border:'1px solid #a855f730',borderRadius:12,padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#a855f788'} onMouseLeave={e=>e.currentTarget.style.borderColor='#a855f730'}>
                  <span style={{fontSize:28}}>🃏</span>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                      <div style={{fontWeight:700,fontSize:14,color:'#a855f7'}}>Double A Framework</div>
                      <span style={{background:'#a855f720',border:'1px solid #a855f740',color:'#a855f7',borderRadius:6,padding:'1px 7px',fontSize:10,fontWeight:700}}>por Victor Hugo Costa</span>
                    </div>
                    <div style={{color:th.muted,fontSize:12,lineHeight:1.5}}>6 etapas: Mecânica → Atributos → Arquétipos → Configuração Conceitual → Características → Compilar.</div>
                  </div>
                  <span style={{marginLeft:'auto',color:'#a855f7',fontSize:13,fontWeight:700,flexShrink:0}}>→</span>
                </div>
              </div>
              <button style={S.btn(th.border,th.dim,{width:'100%'})} onClick={()=>setCharNewMode(null)}>{t.cancel}</button>
            </div>
          </div>
        )}

      <footer style={{padding:'12px 24px',borderTop:'1px solid '+th.border2,textAlign:'center',color:'#4b5563',fontSize:11}}>Criado por <a href="https://www.linkedin.com/in/victor-hugo-costa/" target="_blank" rel="noopener noreferrer" style={{color:th.muted,textDecoration:'none',fontWeight:600}}>Victor Hugo Costa</a> para toda a comunidade Game Dev</footer>
      </div>
    );
  }

  if(view==='document'&&activeDoc){
    if(!project||!module)return null;
    const messages=getDocMessages(),st=STATUS_L[activeDoc.status]||STATUS_L.progress;
    return(
      <div style={{...S.app,display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
        <div style={{padding:'0 16px',height:54,borderBottom:'1px solid '+th.border2,display:'flex',alignItems:'center',gap:10,background:th.bg,flexShrink:0}}>
          <button style={S.back} onClick={()=>setView('module')}>← {module.label}</button>
          <input value={activeDoc.title} onChange={e=>renameDoc(e.target.value)} style={{flex:1,background:'transparent',border:'none',color:th.text,fontSize:15,fontWeight:700,outline:'none',padding:'4px 8px',borderRadius:6}} onFocus={e=>e.target.style.background=th.bg3} onBlur={e=>e.target.style.background='transparent'}/>
          <button onClick={()=>toggleStatus(activeDoc.id)} style={{background:st.bg,border:'1px solid '+st.color+'40',color:st.color,borderRadius:10,padding:'4px 12px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>{st.label}</button>
          {hasUnsaved&&<span style={{fontSize:10,color:'#f59e0b',fontWeight:600,whiteSpace:'nowrap'}}>● não salvo</span>}
          <button style={S.btn(hasUnsaved?clr:th.border,'#fff',{padding:'6px 16px',fontSize:12,opacity:hasUnsaved?1:.4})} onClick={saveDoc} disabled={!hasUnsaved}>Salvar</button>
          <button onClick={()=>setConfirm({type:'deleteDoc',id:activeDoc.id})} style={{background:'none',border:'1px solid '+th.border,color:'#f87171',borderRadius:6,padding:'5px 9px',cursor:'pointer',fontSize:12}}>🗑️</button>
        </div>
        <div style={{padding:'5px 18px',background:th.bg0,borderBottom:'1px solid '+th.border2,fontSize:11,color:'#334155',flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
          <span style={{color:clr,opacity:.5}}>⚡</span>
          A IA lê este documento e todos os módulos de <strong style={{color:th.muted}}>{project.name}</strong>
          <span style={{marginLeft:'auto',color:'#2d3748',fontSize:10}}>Criado por <a href="https://www.linkedin.com/in/victor-hugo-costa/" target="_blank" rel="noopener noreferrer" style={{color:'#374151',textDecoration:'none'}}>Victor Hugo Costa</a></span>
        </div>
        <div style={{flex:1,display:'flex',overflow:'hidden'}}>
          <div style={{flex:'0 0 42%',display:'flex',flexDirection:'column',overflow:'hidden',background:th.bg0,borderRight:'1px solid '+th.border2}}>
            <div style={{padding:'10px 16px',borderBottom:'1px solid '+th.border2,display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
              <span style={{color:clr,fontSize:13}}>✦</span>
              <span style={{fontWeight:700,fontSize:13,color:th.muted}}>Conversa com a IA</span>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'14px',display:'flex',flexDirection:'column',gap:14}}>
              {messages.length===0&&(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',textAlign:'center',padding:'0 14px'}}>
                  <div style={{fontSize:36,marginBottom:14,opacity:.35}}>{module.icon}</div>
                  <div style={{fontWeight:700,fontSize:14,color:clr,marginBottom:8}}>IA pronta para colaborar</div>
                  <div style={{color:th.muted,fontSize:12,lineHeight:1.65,marginBottom:22}}>Faça perguntas, peça conteúdo ou expanda o que já está no documento.</div>
                  <div style={{display:'flex',flexDirection:'column',gap:6,width:'100%',maxWidth:300}}>
                    {getSuggestions(module.id,project,activeDoc.title).map((s,i)=><button key={i} onClick={()=>setInput(s)} style={{background:th.bg2,border:'1px solid '+clr+'33',color:th.muted,borderRadius:8,padding:'9px 12px',cursor:'pointer',fontSize:12,textAlign:'left',lineHeight:1.4}}>{s}</button>)}
                  </div>
                </div>
              )}
              {messages.map((msg,i)=>(
                <div key={i} style={{display:'flex',flexDirection:'column',alignItems:msg.role==='user'?'flex-end':'flex-start',gap:5}}>
                  {msg.role==='user'
                    ?<div style={{background:'#1a0f3a',border:'1px solid #4c1d95',borderRadius:12,borderBottomRightRadius:4,padding:'10px 13px',maxWidth:'88%',fontSize:13,lineHeight:1.65}}>{msg.content}</div>
                    :<>
                      <div style={{background:'#0d1a1a',border:'1px solid '+clr+'33',borderRadius:12,borderBottomLeftRadius:4,padding:'12px 13px',maxWidth:'97%',fontSize:13}}>
                        <div style={{color:clr,fontSize:10,fontWeight:700,marginBottom:7,textTransform:'uppercase',letterSpacing:.5}}>IA · {module.label}</div>
                        <div dangerouslySetInnerHTML={{__html:mdToHtml(msg.content)}} style={{lineHeight:1.72}}/>
                      </div>
                      <div style={{display:'flex',gap:5,paddingLeft:4}}>
                        <button onClick={()=>insertRef.current&&insertRef.current(mdToHtml(msg.content))} style={{background:'none',border:'1px dashed '+clr+'55',color:clr,borderRadius:6,padding:'3px 10px',cursor:'pointer',fontSize:11}}>↩ Inserir no doc</button>
                      </div>
                    </>
                  }
                </div>
              ))}
              {loading&&<div style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}><div style={{background:'#0d1a1a',border:'1px solid '+clr+'33',borderRadius:12,padding:'12px 13px',fontSize:13}}><div style={{color:clr,fontSize:10,fontWeight:700,marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>IA · {module.label}</div><div style={{color:'#334155'}}>Escrevendo…</div></div></div>}
              <div ref={chatRef}/>
            </div>
            <div style={{padding:'11px 13px',borderTop:'1px solid '+th.border2,display:'flex',gap:7,background:th.bg,flexShrink:0}}>
              <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder={'Peça à IA para expandir "'+activeDoc.title+'"...'} style={{...S.inp,flex:1,resize:'none',height:52,fontSize:13,paddingTop:9}}/>
              <button style={S.btn(loading?th.border:clr,'#fff',{padding:'0 14px',alignSelf:'stretch',borderRadius:8})} onClick={send} disabled={loading}>{loading?'…':'↑'}</button>
            </div>
          </div>
          <div style={{flex:'0 0 58%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <DocEditor key={activeDoc.id} value={editContent} color={clr} onChange={v=>{setEditContent(v);setHasUnsaved(true);}} insertRef={insertRef}/>
          </div>
        </div>
        {confirm?.type==='deleteDoc'&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}><div style={{background:th.bg2,border:'1px solid '+th.border,borderRadius:18,padding:32,width:340,textAlign:'center'}}><div style={{fontSize:38,marginBottom:14}}>🗑️</div><h3 style={{margin:'0 0 10px',fontSize:17}}>Excluir documento?</h3><p style={{color:th.dim,fontSize:13,margin:'0 0 22px'}}>"{activeDoc.title}" e toda a conversa com a IA serão perdidos.</p><div style={{display:'flex',gap:10,justifyContent:'center'}}><button style={S.btn('#ef4444')} onClick={()=>{deleteDoc(activeDoc.id);setConfirm(null);}}>Excluir</button><button style={S.btn(th.border)} onClick={()=>setConfirm(null)}>{t ? t.cancel : 'Cancelar'}</button></div></div></div>)}
      </div>
    );
  }
  // ── Fallback de segurança: nunca retornar null (causaria tela branca)
  // Isso acontece quando view tem um valor inesperado ou document view sem activeDoc
  if(view==='document'&&!activeDoc){
    // activeDoc perdido — volta para o módulo se existir, senão landing
    setTimeout(()=>setView(module?'module':'landing'),0);
  } else {
    setTimeout(()=>setView('landing'),0);
  }
  return(
    <div style={{...S.app,display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16}}>
      <div style={{fontSize:40}}>🔄</div>
      <div style={{color:'var(--gdd-muted)',fontSize:14}}>Redirecionando…</div>
    </div>
  );
}

export default function GDDHub(){
  return(
    <GDTErrorBoundary>
      <GDDHubInner/>
    </GDTErrorBoundary>
  );
}

