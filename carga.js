/* carga.js — carga manual (botones) + "Últimos movimientos".
   Va al final del index.html, DESPUÉS de categorias.js.
   Usa el mismo script de Google que Siri ("Gastos Voz"). */
(function(){
/* ===== CONFIG: pegá acá la URL de la app web del script (termina en /exec) ===== */
const API_URL = "https://script.google.com/macros/s/AKfycby-BRCKaV2ohoxDBrh0DCHz5xSU1Guuhj8qhYMMXphQRxqpR__cQFaIsfTSZAsOqr8I/exec";

const CATS_GASTO = [
  ["Alimentos","Alimentos"],["PIlar","Pili"],["Servicios","Servicios"],["Auto","Auto"],["Gastos casa","Casa"],
  ["Gastos medicos","Salud"],["Deportes","Deportes"],["Salidas","Salidas"],["Juntadas","Juntadas"],
  ["Regalos","Regalos"],["Ropa","Ropa"],["Vacaciones/Viajes","Viajes"],["Otros","Otros"]
];
const CATS_INGRESO = [["Alquiler","Alquiler"],["Fabrica","Fábrica"],["Inversiones","Inversiones"],["Sueldo","Sueldo"],["Extra","Extra"],["Reintegro","Reintegro"],["Otro","Otro"]];
const MEDIOS = ["TC","Débito","Efectivo","Mercado Pago","Transferencia"];
const LS_KEY = "gastosClave";

const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s => (s||"").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
const ls = { get(k){ try{return localStorage.getItem(k);}catch(e){return null;} }, set(k,v){ try{localStorage.setItem(k,v);}catch(e){} }, del(k){ try{localStorage.removeItem(k);}catch(e){} } };

/* ---------- Estilos ---------- */
const css = `
.fab-cargar{position:fixed;right:20px;bottom:22px;z-index:50;font-family:'Poppins',sans-serif;font-weight:700;font-size:15px;
  background:var(--teal);color:#fff;border:none;border-radius:999px;padding:14px 22px;box-shadow:0 6px 18px rgba(18,138,130,.35);cursor:pointer;}
.fab-cargar:active{transform:scale(.97);}
.ov{position:fixed;inset:0;background:rgba(27,42,58,.45);z-index:60;display:none;align-items:flex-end;justify-content:center;}
.ov.open{display:flex;}
@media(min-width:700px){.ov{align-items:center;}}
.sheet{background:var(--card);width:100%;max-width:560px;max-height:92vh;overflow-y:auto;border-radius:22px 22px 0 0;padding:20px 18px 26px;}
@media(min-width:700px){.sheet{border-radius:22px;}}
.sheet h2{font-family:'Poppins',sans-serif;font-size:18px;margin:0;color:var(--navy);}
.sheet-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.x-btn{background:var(--bg);border:none;border-radius:999px;width:34px;height:34px;font-size:16px;cursor:pointer;color:var(--ink-soft);}
.seg{display:grid;grid-template-columns:1fr 1fr;background:var(--bg);border-radius:999px;padding:4px;margin-bottom:16px;}
.seg button{border:none;background:transparent;border-radius:999px;padding:9px;font-family:'Poppins',sans-serif;font-weight:600;font-size:14px;color:var(--ink-soft);cursor:pointer;}
.seg button.on.g{background:var(--red);color:#fff;} .seg button.on.i{background:var(--teal);color:#fff;}
.lbl{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft);margin:14px 0 8px;}
.chips{display:flex;flex-wrap:wrap;gap:8px;}
.chip{border:1.5px solid var(--line);background:var(--card);border-radius:999px;padding:8px 14px;font-size:13.5px;font-weight:600;color:var(--navy);cursor:pointer;}
.chip.on{background:var(--navy);border-color:var(--navy);color:#fff;}
.chip.sug{font-weight:500;padding:6px 12px;font-size:12.5px;background:var(--bg);border-color:var(--bg);}
.inp{width:100%;font-family:'Inter',sans-serif;font-size:16px;padding:12px 14px;border:1.5px solid var(--line);border-radius:12px;color:var(--ink);background:var(--card);}
.inp:focus{outline:none;border-color:var(--teal);}
.inp.monto{font-family:'Poppins',sans-serif;font-size:26px;font-weight:700;}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.btn-main{width:100%;margin-top:20px;border:none;border-radius:14px;padding:15px;font-family:'Poppins',sans-serif;font-weight:700;font-size:16px;background:var(--teal);color:#fff;cursor:pointer;}
.btn-main:disabled{opacity:.5;cursor:default;}
.rapido{display:flex;gap:8px;}
.rapido .inp{font-size:14px;}
.rapido button{border:none;background:var(--navy);color:#fff;border-radius:12px;padding:0 16px;font-weight:700;cursor:pointer;}
.hint{font-size:12px;color:var(--ink-soft);margin-top:6px;}
.sep{display:flex;align-items:center;gap:10px;color:var(--ink-soft);font-size:12px;margin:18px 0 2px;}
.sep:before,.sep:after{content:"";flex:1;height:1px;background:var(--line);}
.toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--navy);color:#fff;border-radius:999px;padding:12px 18px;font-size:14px;font-weight:600;
  z-index:70;display:none;align-items:center;gap:14px;box-shadow:var(--shadow);max-width:92vw;}
.toast.show{display:flex;}
.toast button{background:transparent;border:1.5px solid rgba(255,255,255,.5);color:#fff;border-radius:999px;padding:5px 12px;font-weight:700;cursor:pointer;}
.ult-filtros{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;}
.ult-dia{font-family:'Poppins',sans-serif;font-size:11.5px;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.04em;margin:14px 0 4px;}
.ult-item{display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:9px 0;border-top:1px solid var(--line);}
.ult-item .t{font-weight:600;font-size:14px;color:var(--navy);}
.ult-item .s{font-size:12px;color:var(--ink-soft);}
.ult-item .m{font-weight:700;font-variant-numeric:tabular-nums;text-align:right;}
.ult-item .m.ing{color:var(--teal);}
.ult-msg{padding:24px 0;text-align:center;color:var(--ink-soft);font-size:13px;}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);

/* ---------- Estructura ---------- */
document.body.insertAdjacentHTML("beforeend", `
<button class="fab-cargar" id="fabCargar">+ Cargar</button>
<div class="ov" id="ovCarga"><div class="sheet">
  <div class="sheet-head"><h2>Nuevo movimiento</h2><button class="x-btn" data-close>✕</button></div>
  <div class="lbl" style="margin-top:0">Rápido, como se lo dirías a Siri</div>
  <div class="rapido"><input class="inp" id="cRapido" placeholder="Ej: 15 mil súper con la visa" autocomplete="off"><button id="cRapidoBtn">Cargar</button></div>
  <div class="hint">Entiende monto, categoría, medio de pago y "ayer".</div>
  <div class="sep">o elegí con botones</div>
  <div class="seg"><button class="g on" data-tipo="GASTO">Gasto</button><button class="i" data-tipo="INGRESO">Ingreso</button></div>
  <div class="lbl">Categoría</div><div class="chips" id="cCats"></div>
  <div class="lbl">Monto</div><input class="inp monto" id="cMonto" inputmode="numeric" placeholder="$0" autocomplete="off">
  <div class="lbl">Detalle</div><input class="inp" id="cNota" placeholder="Ej: Coto, Nafta, Jardinero" autocomplete="off">
  <div class="chips" id="cSug" style="margin-top:8px"></div>
  <div class="lbl">Medio de pago</div><div class="chips" id="cMedios"></div>
  <div class="lbl">Fecha</div><input class="inp" type="date" id="cFecha">
  <button class="btn-main" id="cGuardar">Guardar</button>
</div></div>
<div class="ov" id="ovUlt"><div class="sheet">
  <div class="sheet-head"><h2>Últimos movimientos</h2><button class="x-btn" data-close>✕</button></div>
  <div class="ult-filtros" id="uFiltros"></div>
  <div id="uLista"></div>
</div></div>
<div class="toast" id="toast"><span id="toastTxt"></span><button id="toastUndo">Deshacer</button></div>`);

const refreshBtn = document.getElementById("refreshBtn");
refreshBtn.insertAdjacentHTML("afterend", `<button class="refresh-btn" id="btnUltimos">🕘 Últimos movimientos</button>`);

const $ = id => document.getElementById(id);
let tipo = "GASTO", cat = "", medio = "";
let ultimoLocal = null; // fila que agregué a RAW para poder deshacer

/* ---------- Abrir / cerrar ---------- */
function abrir(id){ $(id).classList.add("open"); }
function cerrar(id){ $(id).classList.remove("open"); }
document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => b.closest(".ov").classList.remove("open"));
document.querySelectorAll(".ov").forEach(o => o.addEventListener("click", e => { if(e.target === o) o.classList.remove("open"); }));
$("fabCargar").onclick = () => { resetForm(); abrir("ovCarga"); };
$("btnUltimos").onclick = () => { abrir("ovUlt"); cargarUltimos(); };

/* ---------- Formulario ---------- */
function hoyISO(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function catsOrdenadas(){
  // las más usadas primero, según el histórico
  const base = tipo==="GASTO" ? CATS_GASTO : CATS_INGRESO, cnt = {};
  (typeof RAW!=="undefined"?RAW:[]).forEach(r => { const c = norm(r.catOrig || r.categoria); cnt[c]=(cnt[c]||0)+1; });
  return [...base].sort((a,b)=>(cnt[norm(b[0])]||0)-(cnt[norm(a[0])]||0));
}
function pintarCats(){
  $("cCats").innerHTML = catsOrdenadas().map(([v,l])=>`<button class="chip ${v===cat?"on":""}" data-v="${esc(v)}">${esc(l)}</button>`).join("");
  $("cCats").querySelectorAll(".chip").forEach(b => b.onclick = () => { cat=b.dataset.v; pintarCats(); pintarSug(); });
}
function pintarSug(){
  // detalles que más usaste en esa categoría (últimos 4 meses)
  if(!cat || typeof RAW==="undefined"){ $("cSug").innerHTML=""; return; }
  const desde = Date.now() - 120*864e5, cnt = {};
  RAW.filter(r => norm(r.catOrig||r.categoria)===norm(cat) && r.fechaSort>desde).forEach(r => {
    const n = (r.notaOrig!=null ? r.notaOrig : r.nota || "").trim(); if(!n) return;
    const k = n.charAt(0).toUpperCase()+n.slice(1); cnt[k]=(cnt[k]||0)+1;
  });
  const top = Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).slice(0,6);
  $("cSug").innerHTML = top.map(n=>`<button class="chip sug">${esc(n)}</button>`).join("");
  $("cSug").querySelectorAll(".chip").forEach(b => b.onclick = () => { $("cNota").value = b.textContent; });
}
function pintarMedios(){
  $("cMedios").innerHTML = MEDIOS.map(m=>`<button class="chip ${m===medio?"on":""}">${esc(m)}</button>`).join("");
  $("cMedios").querySelectorAll(".chip").forEach(b => b.onclick = () => { medio = medio===b.textContent ? "" : b.textContent; pintarMedios(); });
}
document.querySelectorAll(".seg button").forEach(b => b.onclick = () => {
  tipo = b.dataset.tipo; cat = "";
  document.querySelectorAll(".seg button").forEach(x => x.classList.toggle("on", x===b));
  pintarCats(); pintarSug();
});
$("cMonto").addEventListener("input", e => {
  const d = e.target.value.replace(/\D/g,"");
  e.target.value = d ? "$" + Number(d).toLocaleString("es-AR") : "";
});
function resetForm(){
  cat=""; medio=""; $("cMonto").value=""; $("cNota").value=""; $("cRapido").value=""; $("cFecha").value=hoyISO();
  pintarCats(); pintarSug(); pintarMedios();
}

/* ---------- Llamadas al script ---------- */
async function api(params){
  if(!API_URL) throw new Error("Falta conectar el dashboard con el script (API_URL en carga.js).");
  let k = ls.get(LS_KEY);
  if(!k){ k = prompt("Clave de carga (la misma que usa Siri):"); if(!k) throw new Error("Sin clave."); ls.set(LS_KEY, k.trim()); k=k.trim(); }
  // POST: la clave viaja en el cuerpo, no en la dirección
  const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(Object.assign({k}, params)) });
  const j = await res.json();
  if(j.error === "clave"){ ls.del(LS_KEY); throw new Error("Clave incorrecta, probá de nuevo."); }
  return j;
}

$("cGuardar").onclick = async () => {
  const monto = Number($("cMonto").value.replace(/\D/g,""));
  if(!cat) return toast("Elegí una categoría");
  if(!monto) return toast("Falta el monto");
  const btn = $("cGuardar"); btn.disabled = true; btn.textContent = "Guardando…";
  try{
    const nota = $("cNota").value.trim(), fecha = $("cFecha").value || hoyISO();
    const j = await api({a:"add", tipo, cat, monto, nota, medio, fecha});
    if(!j.ok) throw new Error(j.mensaje || "No se pudo guardar");
    agregarLocal({tipo, cat, monto, nota, fecha});
    cerrar("ovCarga"); toast(j.mensaje, true);
  }catch(e){ toast(e.message); }
  finally{ btn.disabled=false; btn.textContent="Guardar"; }
};

async function cargaRapida(){
  const t = $("cRapido").value.trim(); if(!t) return;
  const btn = $("cRapidoBtn"); btn.disabled = true;
  try{
    const j = await api({a:"voz", t, r:"1"});
    if(!j.ok) throw new Error(j.mensaje);
    if(j.tipo === "carga"){ if(j.campos) agregarLocal(j.campos); cerrar("ovCarga"); toast(j.mensaje, true); }
    else toast(j.mensaje);
  }catch(e){ toast(e.message); }
  finally{ btn.disabled=false; }
}
$("cRapidoBtn").onclick = cargaRapida;
$("cRapido").addEventListener("keydown", e => { if(e.key==="Enter") cargaRapida(); });

/* El CSV publicado tarda unos minutos en actualizarse: sumo el movimiento a mano para verlo ya */
function agregarLocal({tipo, cat, monto, nota, fecha}){
  if(typeof RAW==="undefined") return;
  const now = new Date(), [y,m,d] = fecha.split("-").map(Number);
  const dt = new Date(y, m-1, d, now.getHours(), now.getMinutes());
  const row = { tipo: tipo==="GASTO"?"Gasto":"Ingreso", categoria: cat, monto, ym: `${y}-${String(m).padStart(2,"0")}`,
    fecha: `${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}`, fechaSort: dt.getTime(), nota, fijo:false };
  RAW.push(row); ultimoLocal = row;
  window.renderAll();
}

/* ---------- Aviso + deshacer ---------- */
let toastTimer;
function toast(txt, conUndo){
  $("toastTxt").textContent = txt; $("toastUndo").style.display = conUndo ? "" : "none";
  $("toast").classList.add("show"); clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>$("toast").classList.remove("show"), conUndo ? 7000 : 3500);
}
$("toastUndo").onclick = async () => {
  $("toast").classList.remove("show");
  try{
    const j = await api({a:"undo"});
    if(ultimoLocal){ const i = RAW.indexOf(ultimoLocal); if(i>-1) RAW.splice(i,1); ultimoLocal=null; window.renderAll(); }
    toast(j.mensaje);
  }catch(e){ toast(e.message); }
};

/* ---------- Últimos movimientos ---------- */
let filtroUlt = "Todos", itemsUlt = [];
function pintarFiltros(){
  $("uFiltros").innerHTML = ["Todos","Gastos","Ingresos","Siri"].map(f=>`<button class="chip ${f===filtroUlt?"on":""}">${f}</button>`).join("");
  $("uFiltros").querySelectorAll(".chip").forEach(b => b.onclick = () => { filtroUlt=b.textContent; pintarFiltros(); pintarUltimos(); });
}
async function cargarUltimos(){
  pintarFiltros();
  $("uLista").innerHTML = `<div class="ult-msg">Cargando…</div>`;
  const mes = typeof currentMonth==="function" ? currentMonth() : "ALL";
  try{
    if(!API_URL) throw new Error("sin api");
    const j = await api({a:"list", n:"150", mes: mes==="ALL" ? "" : mes});
    itemsUlt = (j.items||[]).map(r => ({...r, dia: r.fecha.slice(0,10), hora: r.fecha.slice(11)}));
  }catch(e){
    // sin conexión al script: muestro lo que ya tiene el dashboard
    const src = (typeof RAW!=="undefined"?RAW:[]).filter(r => mes==="ALL" || r.ym===mes);
    itemsUlt = [...src].sort((a,b)=>b.fechaSort-a.fechaSort).slice(0,150).map(r => {
      const d = new Date(r.fechaSort);
      return { tipo:r.tipo, cat:r.catOrig||r.categoria, monto:r.monto, nota:r.notaOrig!=null?r.notaOrig:r.nota, medio:"", origen:"",
        dia: `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`,
        hora: `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}` };
    });
  }
  pintarUltimos();
}
function pintarUltimos(){
  const l = itemsUlt.filter(r => filtroUlt==="Todos" || (filtroUlt==="Gastos" && r.tipo==="Gasto") || (filtroUlt==="Ingresos" && r.tipo==="Ingreso") || (filtroUlt==="Siri" && r.origen==="Siri"));
  if(!l.length){ $("uLista").innerHTML = `<div class="ult-msg">No hay movimientos para mostrar.</div>`; return; }
  const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  let html = "", diaAnt = "";
  l.forEach(r => {
    if(r.dia !== diaAnt){
      const [dd,mm,yy] = r.dia.split("/").map(Number);
      html += `<div class="ult-dia">${DIAS[new Date(yy,mm-1,dd).getDay()]} ${dd}/${mm}</div>`; diaAnt = r.dia;
    }
    const catTxt = r.cat==="PIlar" ? "Pili" : r.cat;
    const extra = [r.hora, r.medio, r.origen==="Siri"?"🗣️ Siri":r.origen==="Web"?"💻 Web":""].filter(Boolean).join(" · ");
    html += `<div class="ult-item"><div class="t">${esc(r.nota || catTxt)}</div>
      <div class="m ${r.tipo==="Ingreso"?"ing":""}">${r.tipo==="Ingreso"?"+":""}${fmtMoney(r.monto)}</div>
      <div class="s">${esc(catTxt)}${extra?" · "+esc(extra):""}</div><div></div></div>`;
  });
  $("uLista").innerHTML = html;
}
})();
