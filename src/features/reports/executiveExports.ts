import type { Workspace } from '../../domain/model';
import { projectProgress, lateMilestones, projectIsAtRisk } from '../../domain/metrics';

export type ExecutiveRow = { Proyecto: string; Área: string; Responsable: string; Metodología: string; Estado: string; Semáforo: string; Avance: string; 'Fecha objetivo': string; 'Tareas abiertas': number };
const escapeHtml = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
export function executiveRows(workspace: Workspace, projectIds?: Set<string>): ExecutiveRow[] {
  return workspace.projects.filter((p) => !projectIds || projectIds.has(p.id)).map((p) => ({
    Proyecto: p.name, Área: p.area, Responsable: workspace.members.find((m) => m.id === p.ownerId)?.name || 'Sin asignar',
    Metodología: String(p.methodologyId), Estado: p.status, Semáforo: p.semaforo, Avance: projectProgress(p.id, workspace.stages) + '%',
    'Fecha objetivo': p.dueDate, 'Tareas abiertas': workspace.tasks.filter((t) => t.projectId === p.id && t.status !== 'Completado').length,
  }));
}
function download(name: string, content: Blob) { const url = URL.createObjectURL(content); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 3000); }
function tableHtml(rows: ExecutiveRow[]) { const keys = Object.keys(rows[0] || { Proyecto: '', Área: '', Responsable: '', Metodología: '', Estado: '', Semáforo: '', Avance: '', 'Fecha objetivo': '', 'Tareas abiertas': '' }); return '<table border="1"><thead><tr>' + keys.map((k) => '<th>' + escapeHtml(k) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + keys.map((k) => '<td>' + escapeHtml(r[k as keyof ExecutiveRow]) + '</td>').join('') + '</tr>').join('') + '</tbody></table>'; }
export function exportExcel(rows: ExecutiveRow[]) {
  const html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><h2>ITM Project Hub · Portafolio</h2>' + tableHtml(rows) + '</body></html>';
  download('ITM_Portafolio.xls', new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' }));
}
export function exportPdf(rows: ExecutiveRow[], title = 'ITM Project Hub · Resumen ejecutivo') {
  const popup = window.open('', '_blank');
  if (!popup) { window.alert('Permite las ventanas emergentes para generar el PDF.'); return; }
  popup.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(title) + '</title><style>body{font:12px Arial;padding:24px;color:#20345b}h1{font-size:22px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccd5e2;padding:7px;text-align:left}th{background:#eaf1fb}@page{size:landscape;margin:12mm}</style></head><body><h1>' + escapeHtml(title) + '</h1><p>Generado: ' + new Date().toLocaleString('es-MX') + '</p>' + tableHtml(rows) + '</body></html>');
  popup.document.close(); popup.focus(); popup.print();
}
export function exportImage(rows: ExecutiveRow[], title = 'ITM Project Hub · Portafolio') {
  const width = 1200, rowHeight = 32, height = Math.max(280, 140 + Math.min(25, rows.length) * rowHeight);
  const lines = rows.slice(0, 25).map((r, i) => '<text x="40" y="' + (155 + i * rowHeight) + '" font-size="17" fill="#33415c">' + escapeHtml((r.Proyecto || '').slice(0, 60)) + '</text><text x="1000" y="' + (155 + i * rowHeight) + '" font-size="17" fill="#5367d8">' + escapeHtml(r.Avance) + '</text>').join('');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '"><rect width="100%" height="100%" fill="#f8faff"/><rect width="100%" height="84" fill="#172f65"/><text x="40" y="54" font-size="28" font-family="Arial" font-weight="bold" fill="white">' + escapeHtml(title) + '</text><text x="40" y="110" font-size="16" font-family="Arial" fill="#697992">Proyectos: ' + rows.length + ' · ' + new Date().toLocaleDateString('es-MX') + '</text><g font-family="Arial">' + lines + '</g></svg>';
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob); const image = new Image();
  image.onload = () => { const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); if (ctx) { ctx.drawImage(image, 0, 0); canvas.toBlob((png) => { if (png) download('ITM_Portafolio.png', png); }); } URL.revokeObjectURL(url); };
  image.onerror = () => { URL.revokeObjectURL(url); window.alert('No se pudo crear la imagen.'); }; image.src = url;
}
export function weeklyExecutiveSummary(workspace: Workspace, ids?: Set<string>) {
  const projects = workspace.projects.filter((p) => !ids || ids.has(p.id));
  const selected = new Set(projects.map((p) => p.id));
  const now = new Date(), next = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10), today = now.toISOString().slice(0, 10);
  const tasks = workspace.tasks.filter((t) => selected.has(t.projectId));
  const risks = workspace.raids.filter((r) => selected.has(r.projectId) && r.status !== 'Cerrado');
  const upcoming = tasks.filter((t) => t.dueDate && t.dueDate >= today && t.dueDate <= next && t.status !== 'Completado').sort((a,b) => a.dueDate.localeCompare(b.dueDate));
  const overdue = lateMilestones(workspace).filter((item) => selected.has(item.project.id));
  const avg = projects.length ? Math.round(projects.reduce((sum, p) => sum + projectProgress(p.id, workspace.stages), 0) / projects.length) : 0;
  const atRisk = projects.filter((p) => projectIsAtRisk(p, workspace.stages, workspace.raids));
  return { projects, avg, atRisk, risks, upcoming, overdue, today, next, tasks };
}
// PowerPoint real (.pptx), generated client-side with a small uncompressed ZIP / Office Open XML package.
const encoder = new TextEncoder();
function crc32(data: Uint8Array) { let c = -1; for (const b of data) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); } return (c ^ -1) >>> 0; }
function zip(files: { name: string; data: string }[]) {
  const locals: Uint8Array[] = [], central: Uint8Array[] = []; let offset = 0;
  const u16 = (v: DataView, at: number, n: number) => v.setUint16(at, n, true);
  const u32 = (v: DataView, at: number, n: number) => v.setUint32(at, n >>> 0, true);
  files.forEach((f) => { const name = encoder.encode(f.name), data = encoder.encode(f.data), crc = crc32(data);
    const head = new Uint8Array(30 + name.length); const v = new DataView(head.buffer); u32(v,0,0x04034b50);u16(v,4,20);u32(v,14,crc);u32(v,18,data.length);u32(v,22,data.length);u16(v,26,name.length);head.set(name,30);locals.push(head,data);
    const dir = new Uint8Array(46+name.length);const d=new DataView(dir.buffer);u32(d,0,0x02014b50);u16(d,4,20);u16(d,6,20);u32(d,16,crc);u32(d,20,data.length);u32(d,24,data.length);u16(d,28,name.length);u32(d,42,offset);dir.set(name,46);central.push(dir);offset+=head.length+data.length;
  });
  const centralSize=central.reduce((n,x)=>n+x.length,0);const end=new Uint8Array(22),e=new DataView(end.buffer);u32(e,0,0x06054b50);u16(e,8,files.length);u16(e,10,files.length);u32(e,12,centralSize);u32(e,16,offset);
  const all=[...locals,...central,end],out=new Uint8Array(all.reduce((n,x)=>n+x.length,0));let pos=0;all.forEach(x=>{out.set(x,pos);pos+=x.length;});return out;
}
function slide(lines: string[]) {
  const shape=(line:string,i:number)=>'<p:sp><p:nvSpPr><p:cNvPr id="'+(i+2)+'" name="Text '+i+'"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="550000" y="'+(500000+i*480000)+'"/><a:ext cx="10900000" cy="420000"/></a:xfrm></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="es-MX" sz="'+(i===0?2600:1600)+'"/><a:t>'+escapeHtml(line.slice(0,130))+'</a:t></a:r></a:p></p:txBody></p:sp>';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:spPr/></p:spTree></p:cSld></p:sld>'.replace('<p:spPr/></p:spTree>',lines.slice(0,10).map(shape).join('')+'<p:spPr/></p:spTree>');
}
export function exportPowerPoint(rows: ExecutiveRow[], title='ITM Project Hub · Reporte ejecutivo') {
  const chunks: string[][]=[[title,'Fecha: '+new Date().toLocaleDateString('es-MX'),'Proyectos analizados: '+rows.length],...Array.from({length:Math.ceil(rows.length/8)},(_,i)=>['Portafolio · '+(i+1),...rows.slice(i*8,i*8+8).map(r=>r.Proyecto+' · '+r.Avance+' · '+r.Estado)])];
  const slides=chunks.map((x,i)=>({name:'ppt/slides/slide'+(i+1)+'.xml',data:slide(x)}));
  const types='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'+slides.map((_,i)=>'<Override PartName="/ppt/slides/slide'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>').join('')+'</Types>';
  const rels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>';
  const pres='<?xml version="1.0" encoding="UTF-8"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst>'+slides.map((_,i)=>'<p:sldId id="'+(256+i)+'" r:id="rId'+(i+1)+'"/>').join('')+'</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>';
  const presRels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+slides.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+(i+1)+'.xml"/>').join('')+'</Relationships>';
  const bytes=zip([{name:'[Content_Types].xml',data:types},{name:'_rels/.rels',data:rels},{name:'ppt/presentation.xml',data:pres},{name:'ppt/_rels/presentation.xml.rels',data:presRels},...slides]);
  download('ITM_Reporte_Ejecutivo.pptx',new Blob([bytes as BlobPart],{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation'}));
}
