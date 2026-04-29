import { todayStr } from './gameDesignToolRuntime';
import { xesc } from './gameDesignToolText';

type ExportProject = {
  name: string;
  genre: string;
  platform: string;
  emoji: string;
};

type ExportDoc = {
  title: string;
  content?: string;
  status?: 'progress' | 'done' | string;
  createdAt?: string;
  updatedAt?: string | null;
  framework?: string;
  flowData?: {
    nodes?: unknown[];
    edges?: unknown[];
  };
};

type ExportModule = {
  icon: string;
  label: string;
};

type ExportSection = {
  mod: ExportModule;
  docs: ExportDoc[];
};

type ZipFile = {
  name: string;
  data: Uint8Array;
};

const CRC_TBL = (() => {
  const t = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (0xedb88320 | 0) ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

export function crc32(buf: Uint8Array) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TBL[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

export function createZip(files: ZipFile[]) {
  const enc = new TextEncoder();
  const lp: Uint8Array[] = [];
  const cp: Uint8Array[] = [];
  const off: number[] = [];
  let lo = 0;
  for (const { name, data } of files) {
    const nb = enc.encode(name);
    const cr = crc32(data);
    const sz = data.length;
    off.push(lo);
    const lh = new Uint8Array(30 + nb.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint32(14, cr, true);
    lv.setUint32(18, sz, true);
    lv.setUint32(22, sz, true);
    lv.setUint16(26, nb.length, true);
    lh.set(nb, 30);
    lp.push(lh, data);
    lo += lh.length + sz;
    const cd = new Uint8Array(46 + nb.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint32(16, cr, true);
    cv.setUint32(20, sz, true);
    cv.setUint32(24, sz, true);
    cv.setUint16(28, nb.length, true);
    cv.setUint32(42, off[off.length - 1], true);
    cd.set(nb, 46);
    cp.push(cd);
  }
  const cdOff = lo;
  const cdSz = cp.reduce((s, p) => s + p.length, 0);
  const eo = new Uint8Array(22);
  const ev = new DataView(eo.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSz, true);
  ev.setUint32(16, cdOff, true);
  const all = [...lp, ...cp, eo];
  const total = all.reduce((s, p) => s + p.length, 0);
  const res = new Uint8Array(total);
  let pos = 0;
  for (const p of all) {
    res.set(p, pos);
    pos += p.length;
  }
  return res;
}

function inlineRuns(node: Node, bold = false, italic = false): string {
  if (node.nodeType === 3) {
    const t = node.textContent;
    if (!t) return '';
    const rpr = [bold ? '<w:b/>' : '', italic ? '<w:i/>' : ''].join('');
    return `<w:r>${rpr ? `<w:rPr>${rpr}</w:rPr>` : ''}<w:t xml:space="preserve">${xesc(t)}</w:t></w:r>`;
  }
  if (!(node instanceof HTMLElement)) return '';
  const tag = node.tagName.toLowerCase();
  const kids = Array.from(node.childNodes);
  if (tag === 'strong' || tag === 'b') return kids.map(c => inlineRuns(c, true, italic)).join('');
  if (tag === 'em' || tag === 'i') return kids.map(c => inlineRuns(c, bold, true)).join('');
  if (tag === 'br') return '<w:r><w:br/></w:r>';
  return kids.map(c => inlineRuns(c, bold, italic)).join('');
}

function nodeToOoxml(node: Node): string {
  if (node.nodeType === 3) {
    const t = node.textContent?.trim();
    if (!t) return '';
    return `<w:p><w:r><w:t xml:space="preserve">${xesc(t)}</w:t></w:r></w:p>`;
  }
  if (!(node instanceof HTMLElement)) return '';
  const tag = node.tagName.toLowerCase();
  const kids = Array.from(node.childNodes);
  switch (tag) {
    case 'h2':
      return `<w:p><w:pPr><w:spacing w:before="320" w:after="120"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="52"/><w:color w:val="1a0040"/></w:rPr><w:t>${xesc(node.textContent)}</w:t></w:r></w:p>`;
    case 'h3':
      return `<w:p><w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="2d1b69"/></w:rPr><w:t>${xesc(node.textContent)}</w:t></w:r></w:p>`;
    case 'h4':
      return `<w:p><w:pPr><w:spacing w:before="160" w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="64748b"/></w:rPr><w:t>${xesc(node.textContent)}</w:t></w:r></w:p>`;
    case 'p': {
      const runs = kids.map(c => inlineRuns(c)).join('');
      if (!runs) return '<w:p/>';
      return `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr>${runs}</w:p>`;
    }
    case 'br':
      return '<w:p/>';
    case 'hr':
      return `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="CCCCCC"/></w:pBdr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>`;
    case 'ul':
      return Array.from(node.children)
        .filter(n => n.tagName === 'LI')
        .map(li => {
          const runs = Array.from(li.childNodes)
            .map(c => inlineRuns(c))
            .join('');
          return `<w:p><w:pPr><w:ind w:left="360" w:hanging="280"/><w:spacing w:after="60"/></w:pPr><w:r><w:t xml:space="preserve">• </w:t></w:r>${runs}</w:p>`;
        })
        .join('');
    case 'ol': {
      let n = 0;
      return Array.from(node.children)
        .filter(c => c.tagName === 'LI')
        .map(li => {
          n++;
          const runs = Array.from(li.childNodes)
            .map(c => inlineRuns(c))
            .join('');
          return `<w:p><w:pPr><w:ind w:left="360" w:hanging="280"/><w:spacing w:after="60"/></w:pPr><w:r><w:t xml:space="preserve">${n}. </w:t></w:r>${runs}</w:p>`;
        })
        .join('');
    }
    case 'figure': {
      const cap = node.querySelector('figcaption');
      return `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="888888"/></w:rPr><w:t>[📷 ${xesc(cap?.textContent || 'Imagem')}]</w:t></w:r></w:p>`;
    }
    case 'img':
      return `<w:p><w:r><w:rPr><w:i/><w:color w:val="888888"/></w:rPr><w:t>[📷 ${xesc((node as HTMLImageElement).alt || 'Imagem')}]</w:t></w:r></w:p>`;
    default:
      return kids.map(c => nodeToOoxml(c)).join('');
  }
}

export function htmlToOoxml(html: string) {
  if (!html) return '<w:p/>';
  const doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
  const root = doc.body.firstChild;
  return root ? Array.from(root.childNodes).map(n => nodeToOoxml(n)).join('') || '<w:p/>' : '<w:p/>';
}

export function exportToPDF(project: ExportProject, sections: ExportSection[]) {
  const STATUS_L = { progress: { label: 'Em andamento', color: '#fbbf24', bg: '#fbbf2415' }, done: { label: 'Concluído', color: '#34d399', bg: '#34d39915' } };
  const html = sections
    .map(
      ({ mod, docs }) => `
    <div class="module">
      <h2 class="mod-title"><span class="mod-icon">${mod.icon}</span>${mod.label}</h2>
      ${docs
        .map(doc => {
          const st = STATUS_L[doc.status === 'done' ? 'done' : 'progress'];
          const meta = doc.updatedAt ? 'Editado ' + doc.updatedAt : 'Criado ' + doc.createdAt;
          const isFlow = doc.framework === 'flowbuilder';
          const content = isFlow
            ? `<p class="flow-info">Fluxo visual · ${doc.flowData?.nodes?.length || 0} nós · ${doc.flowData?.edges?.length || 0} conexões</p>`
            : doc.content || '';
          return `<div class="doc">
          <div class="doc-header">
            <span class="doc-title">${xesc(doc.title)}</span>
            <span class="doc-status" style="color:${st.color};border-color:${st.color}40;background:${st.color}18">${st.label}</span>
          </div>
          <div class="doc-meta">${meta}</div>
          <div class="doc-content">${content}</div>
        </div>`;
        })
        .join('')}
    </div>
  `,
    )
    .join('');

  const css = `
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a2a;background:#fff;}
    @page{margin:18mm 18mm 18mm 18mm;}
    @media print{
      #__gdt_overlay_toolbar{display:none!important;}
      .cover{background:#0c0c14!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .cover *{color:inherit!important;}
      .doc{page-break-inside:avoid;}
    }
    #__gdt_overlay{position:fixed;inset:0;z-index:99999;background:#fff;overflow-y:auto;}
    #__gdt_overlay_toolbar{position:sticky;top:0;z-index:100000;background:#1e1e30;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:2px solid #7c3aed;}
    #__gdt_overlay_toolbar span{color:#a78bfa;font-family:system-ui,sans-serif;font-size:13px;font-weight:600;}
    #__gdt_overlay_toolbar button{font-family:system-ui,sans-serif;font-size:13px;font-weight:700;border:none;border-radius:8px;padding:8px 18px;cursor:pointer;}
    .btn-print{background:#7c3aed;color:#fff;}
    .btn-close{background:#2a2a40;color:#a78bfa;}
    .cover{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:60px 40px;background:#0c0c14;color:#fff;page-break-after:always;}
    .cover-emoji{font-size:80px;margin-bottom:24px;line-height:1;}
    .cover-title{font-size:44px;font-weight:900;color:#fff;margin-bottom:8px;}
    .cover-gdd{font-size:16px;color:#a78bfa;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;}
    .cover-meta{font-size:14px;color:#888;margin-bottom:4px;}
    .cover-date{font-size:12px;color:#475569;margin-top:14px;}
    .cover-bar{width:60px;height:4px;background:linear-gradient(90deg,#7c3aed,#a78bfa);border-radius:2px;margin:20px auto;}
    .content{max-width:740px;margin:0 auto;padding:48px 40px;}
    .module{margin-bottom:48px;}
    .mod-title{font-size:21px;font-weight:800;color:#4c1d95;padding-bottom:10px;border-bottom:2px solid #7c3aed;margin-bottom:22px;display:flex;align-items:center;gap:10px;}
    .mod-icon{font-size:19px;}
    .doc{margin-bottom:26px;padding:18px 20px;border:1px solid #e5e7eb;border-radius:10px;background:#fafafa;}
    .doc-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px;gap:12px;}
    .doc-title{font-size:15px;font-weight:700;color:#111827;flex:1;}
    .doc-status{font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;border:1px solid;white-space:nowrap;flex-shrink:0;}
    .doc-meta{font-size:11px;color:#9ca3af;margin-bottom:10px;font-style:italic;}
    .doc-content{font-size:13px;color:#374151;line-height:1.75;}
    .doc-content h2{font-size:15px;font-weight:700;color:#1f2937;margin:14px 0 6px;}
    .doc-content h3{font-size:13px;font-weight:700;color:#374151;margin:10px 0 4px;}
    .doc-content p{margin-bottom:6px;}
    .doc-content ul,.doc-content ol{margin:6px 0 6px 18px;}
    .doc-content li{margin-bottom:3px;}
    .doc-content strong{font-weight:700;}
    .doc-content em{font-style:italic;color:#6b7280;}
    .doc-content hr{border:none;border-top:1px solid #e5e7eb;margin:10px 0;}
    .doc-content code{background:#f3f4f6;padding:1px 5px;border-radius:3px;font-size:12px;}
    .flow-info{font-style:italic;color:#6b7280;}
  `;

  const old = document.getElementById('__gdt_overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = '__gdt_overlay';

  const style = document.createElement('style');
  style.textContent = css;
  overlay.appendChild(style);

  const toolbar = document.createElement('div');
  toolbar.id = '__gdt_overlay_toolbar';
  toolbar.innerHTML = `
    <span>📄 ${xesc(project.name)} — Game Design Document</span>
    <div style="display:flex;gap:8px">
      <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
      <button class="btn-close" onclick="document.getElementById('__gdt_overlay').remove()">✕ Fechar</button>
    </div>
  `;
  overlay.appendChild(toolbar);

  const body = document.createElement('div');
  body.innerHTML = `
    <div class="cover">
      <div class="cover-emoji">${project.emoji}</div>
      <div class="cover-title">${xesc(project.name)}</div>
      <div class="cover-bar"></div>
      <div class="cover-gdd">Game Design Document</div>
      <div class="cover-meta">${xesc(project.genre)} · ${xesc(project.platform)}</div>
      <div class="cover-date">Exportado em ${todayStr()}</div>
    </div>
    <div class="content">${html}</div>
  `;
  overlay.appendChild(body);

  document.body.appendChild(overlay);
  overlay.scrollTop = 0;
}
