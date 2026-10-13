/* categorias.js — agrupa los gastos en Grupo > Subcategoría y marca los fijos.
   Va DESPUÉS de fijos.js.
   La clasificación ya NO se decide acá: la hace el script de Google con las pestañas
   "Estructura" y "Diccionario" de la planilla, y la deja en las columnas
   GRUPO / SUBCATEGORIA / FIJO. Este archivo solo las lee.
   Para cambiar cómo se clasifica algo, se edita el Diccionario de la planilla. */
(function(){
const norm = s => (s||"").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();

// Solo para gastos que todavía no clasificó el script (recién cargados: tarda hasta 15 min).
// Misma tabla que usa el script de Google cuando una nota no coincide con el Diccionario.
const POR_CATEGORIA = {
  "alimentos":        ["Comida", "Súper y almacén"],
  "pilar":            ["Pilar", "Actividades y varios"],
  "servicios":        ["Casa", "Mantenimiento y arreglos"],
  "gastos casa":      ["Casa", "Mantenimiento y arreglos"],
  "auto":             ["Auto", "Mantenimiento"],
  "gastos medicos":   ["Salud", "Farmacia"],
  "deportes":         ["Deportes", "Fútbol"],
  "salidas":          ["Ocio", "Salidas y juntadas"],
  "juntadas":         ["Ocio", "Salidas y juntadas"],
  "regalos":          ["Otros", "Regalos"],
  "ropa":             ["Personal", "Ropa"],
  "vacaciones/viajes":["Otros", "Varios"],
  "otros":            ["Otros", "Varios"]
};

function clasificar(r){
  if(r.tipo!=="Gasto" || r.sub) return;
  r.catOrig = r.categoria; r.notaOrig = r.nota;
  let grupo = r.grupoS, sub = r.subS;
  if(!grupo || !sub || grupo==="Sin clasificar"){
    const f = POR_CATEGORIA[norm(r.categoria)] || ["Otros", "Varios"];
    grupo = f[0]; sub = f[1];
  }
  r.categoria = grupo;
  r.sub = sub;
  r.fijo = r.fijoS === true;
  r.nota = sub + (r.notaOrig && norm(r.notaOrig)!==norm(sub) ? " — " + r.notaOrig : "");
}

const base = renderAll;
window.renderAll = function(){ RAW.forEach(clasificar); base(); };
if(typeof RAW!=="undefined" && RAW.length) window.renderAll();
})();
