/* categorias.js — agrupa los gastos en Grupo > Subcategoría y marca los fijos.
   Va DESPUÉS de fijos.js. Reclasifica todo el histórico según estas reglas. */
(function(){
const norm = s => (s||"").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
const SC="Servicios casa", JA="Casa: jardín y arreglos", EQ="Casa: equipamiento", AU="Auto y moto",
      AL="Alimentos", PI="Pilar", SA="Salud", DE="Deportes", SJ="Salidas y juntadas",
      RP="Ropa y cuidado personal", PR="Proyectos";

// [categoría original (opcional), palabra en la nota, subcategoría, grupo, ¿fijo? 1/0]
// Se aplica la primera regla que coincida. Para sumar un concepto nuevo, agregá una línea.
const REGLAS = [
 ["servicios","\\bluz\\b","Luz",SC,1],
 ["servicios","\\bgas\\b","Gas",SC,1],
 [null,"wifi","Wifi",SC,1],
 [null,"expensas","Expensas",SC,1],
 [null,"municipal","Municipal",SC,0],
 [null,"jardinero","Jardinero",SC,1],
 [null,"\\bcata\\b","Cata",SC,1],
 [null,"celu","Celular",SC,1],
 [null,"regulador|ferreter|tapa hierro","Arreglos",JA,0],
 [null,"tierra|riego|chips|cantero|melaleuc|tijera","Jardín y cantero",JA,0],
 [null,"cloro","Pileta",JA,0],
 [null,"silla","Muebles",EQ,0],
 [null,"calefon","Calefón (cuotas)",EQ,0],
 [null,"nafta","Nafta",AU,1],
 [null,"seguro","Seguro y registro",AU,1],
 [null,"registro","Seguro y registro",AU,0],
 [null,"cubierta","Cubiertas (cuotas)",AU,0],
 [null,"peaje|estacionamiento","Peaje y estacionamiento",AU,0],
 ["auto","frenos|aceite|alineacion|control rueda|valvula|bateria","Mantenimiento",AU,0],
 ["alimentos","coto|supermerc","Supermercado",AL,0],
 ["alimentos","pizza|empanada|cena sin luz","Comida hecha",AL,0],
 ["pilar","cuota|comedor|grilli cole|^grilli$","Colegio",PI,1],
 ["pilar","danza|gimnasia","Actividades",PI,1],
 [null,"psicolog","Psicóloga",SA,1],
 ["deportes","\\bgym\\b","Gym",DE,1],
 [null,"ecoparque|unicenter","Paseos",SJ,0],
 [null,"peluquer","Peluquería",RP,0],
 [null,"publicidad","Publicidad FB",PR,0],
 [null,"stream","Stream y equipo",PR,0],
 [null,"combi","Combi","Otros",0]
];
// Si ninguna regla coincide, se usa la categoría vieja (subcategoría "Sin clasificar" para revisar)
const FALLBACK = {
 "alimentos":["Frescos y almacén",AL], "auto":["Sin clasificar",AU], "pilar":["Escuela y eventos",PI],
 "gastos medicos":["Farmacia",SA], "deportes":["Fútbol",DE], "salidas":["Salidas",SJ], "juntadas":["Juntadas",SJ],
 "ropa":["Ropa",RP], "regalos":["Regalos","Regalos"], "servicios":["Sin clasificar",SC],
 "gastos casa":["Sin clasificar",JA], "otros":["Sin clasificar","Otros"]
};

// Los fijos que se controlan mes a mes en la solapa Gastos Fijos
FIXED_ITEMS.length = 0;
FIXED_ITEMS.push("Luz","Gas","Wifi","Expensas","Jardinero","Cata","Celular","Nafta","Seguro","Colegio","Actividades","Psicóloga","Gym");

function clasificar(r){
  if(r.tipo!=="Gasto" || r.sub) return;
  const cat = norm(r.categoria), nota = norm(r.nota);
  r.catOrig = r.categoria; r.notaOrig = r.nota;
  const h = REGLAS.find(([c,n]) => (!c || new RegExp(c).test(cat)) && new RegExp(n).test(nota));
  let sub, grupo, fijo = 0;
  if(h){ sub=h[2]; grupo=h[3]; fijo=h[4]; }
  else { const f = FALLBACK[cat] || ["Sin clasificar", r.categoria]; sub=f[0]; grupo=f[1]; }
  r.sub = sub; r.categoria = grupo; r.fijo = !!fijo;
  r.nota = sub + (nota && nota!==norm(sub) ? " — "+r.notaOrig : "");
}

const base = renderAll;
window.renderAll = function(){ RAW.forEach(clasificar); base(); };
if(typeof RAW!=="undefined" && RAW.length) window.renderAll();
})();
