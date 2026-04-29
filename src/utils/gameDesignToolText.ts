export const stripHtml = (html: string) => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || '';
};

export function mdToHtml(md: string) {
  if (!md) return '';
  const inline = (t: string) =>
    t
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  const lines = md.split('\n');
  let out = '';
  let inUl = false;
  let inOl = false;
  const close = () => {
    if (inUl) {
      out += '</ul>';
      inUl = false;
    }
    if (inOl) {
      out += '</ol>';
      inOl = false;
    }
  };
  for (const raw of lines) {
    const l = raw.trimEnd();
    if (l.startsWith('### ')) {
      close();
      out += `<h4>${inline(l.slice(4))}</h4>`;
    } else if (l.startsWith('## ')) {
      close();
      out += `<h3>${inline(l.slice(3))}</h3>`;
    } else if (l.startsWith('# ')) {
      close();
      out += `<h2>${inline(l.slice(2))}</h2>`;
    } else if (l.startsWith('- ') || l.startsWith('* ')) {
      if (!inUl) {
        close();
        out += '<ul>';
        inUl = true;
      }
      out += `<li>${inline(l.slice(2))}</li>`;
    } else if (/^\d+\. /.test(l)) {
      if (!inOl) {
        close();
        out += '<ol>';
        inOl = true;
      }
      out += `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`;
    } else if (l === '---') {
      close();
      out += '<hr>';
    } else if (l === '') {
      close();
      out += '<br>';
    } else {
      close();
      out += `<p>${inline(l)}</p>`;
    }
  }
  close();
  return out;
}

export function xesc(s: unknown) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
