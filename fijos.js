/* fijos.js — mejora de la solapa "Gastos Fijos". Se carga DESPUÉS del script principal. */
(function(){
// Opcional: si un fijo tiene un monto esperado distinto al del mes anterior, ponelo acá.
// Ej: { "Expensas": 85000 }
const ESPERADO_FIJO = {};

const norm = s => (s||"").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function matches(item,row){
  const re = new RegExp("\\b"+esc(norm(item))+"\\b");
  return re.test(norm(row.categoria)) || re.test(norm(row.nota));
}
function prevMonth(ym){
  const [y,m]=ym.split("-").map(Number), d=new Date(y,m-2,1);
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
}
// Pagos fijos de un mes, agrupados por ítem (cada gasto se asigna a un solo ítem)
function pagosDe(ym){
  const out = {}; FIXED_ITEMS.forEach(i=>out[i]={monto:0,n:0,fecha:""});
  let otros = 0;
  RAW.filter(r=>r.tipo==="Gasto" && r.ym===ym && r.fijo).forEach(r=>{
    const it = FIXED_ITEMS.find(i=>matches(i,r));
    if(it){ out[it].monto+=r.monto; out[it].n++; out[it].fecha=r.fecha; } else otros+=r.monto;
  });
  return {items:out, otros};
}

window.renderFijos = function(){
  const meses = [...new Set(RAW.map(r=>r.ym))].sort();
  const sel = currentMonth();
  const ym = sel==="ALL" ? meses[meses.length-1] : sel;
  const checklist = document.getElementById("fijosChecklist");

  if(!RAW.some(r=>r.tipo==="Gasto" && r.fijo)){
    checklist.innerHTML = `<div class="state-msg" style="padding:30px 20px;">Todavía no hay gastos marcados como fijos en el Form.</div>`;
    return;
  }
  const act = pagosDe(ym), ant = pagosDe(prevMonth(ym));
  let esperado=0, pagado=0, pendMonto=0; const pend=[];

  let html = FIXED_ITEMS.map(item=>{
    const p = act.items[item];
    const e = ESPERADO_FIJO[item] || ant.items[item].monto || p.monto;
    const ok = p.n>0;
    esperado += e;
    if(ok) pagado += p.monto; else { pend.push(item); pendMonto += e; }
    const dif = ok && e && p.monto!==e ? ` · ${p.monto>e?"+":"−"}${fmtMoney(Math.abs(p.monto-e))} vs esperado` : "";
    return `<div class="fijos-row"><div>
        <div class="fijos-name">${item}</div>
        <div class="fijos-note">${ok ? p.fecha+dif : (e ? "Esperado ~ "+fmtMoney(e) : "Sin pagar")}</div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;">
        <span class="fijos-amt">${ok ? fmtMoney(p.monto) : (e ? fmtMoney(e) : "")}</span>
        <span class="fijos-status ${ok?"ok":"pending"}">${ok?"Pagado":"Pendiente"}</span>
      </div></div>`;
  }).join("");

  if(act.otros>0){
    esperado += act.otros; pagado += act.otros;
    html += `<div class="fijos-row"><div><div class="fijos-name">Otros fijos cargados</div>
      <div class="fijos-note">Marcados como fijos pero fuera de la lista</div></div>
      <div style="display:flex;align-items:center;gap:14px;"><span class="fijos-amt">${fmtMoney(act.otros)}</span>
      <span class="fijos-status ok">Pagado</span></div></div>`;
  }
  checklist.innerHTML = html;

  document.getElementById("sumFijos").textContent = fmtMoney(esperado);
  const card = document.getElementById("sumFijos").parentElement;
  let sub = document.getElementById("fijosSub");
  if(!sub){ sub = document.createElement("div"); sub.id="fijosSub"; sub.className="subvalue"; card.appendChild(sub); }
  sub.textContent = `${ymLabel(ym)} · Pagado ${fmtMoney(pagado)} · Falta ${fmtMoney(pendMonto)}`;
  document.getElementById("sumPendientes").textContent = pend.length;
  document.getElementById("pendientesDetalle").textContent = pend.length ? `${pend.join(", ")} · faltan ${fmtMoney(pendMonto)}` : "Todo pagado este mes ✓";

  const evo = meses.map(m=>({ym:m, total:RAW.filter(r=>r.tipo==="Gasto" && r.ym===m && r.fijo).reduce((s,r)=>s+r.monto,0)}));
  const max = Math.max(1, ...evo.map(d=>d.total));
  document.getElementById("fijosEvoChart").innerHTML = `<div class="hbar-list">${evo.map(d=>`
    <div class="hbar-row"><div class="hbar-label">${ymLabel(d.ym)}</div>
    <div class="hbar-track"><div class="hbar-fill fixed" style="width:${(d.total/max*100).toFixed(0)}%"></div></div>
    <div class="hbar-val">${fmtMoney(d.total)}</div></div>`).join("")}</div>`;
};
// Si los datos ya cargaron antes que este archivo, redibujo
if(typeof RAW!=="undefined" && RAW.length) renderFijos();
})();
