// Acreditaciones PWA · lógica de la app. Datos iniciales en data.js.

// ===== 1. CONFIGURACIÓN: áreas que se controlan por colaborador =====
const AREAS=["TAQUILLA","CDS","LO","LP","SPYRAL","DULCERIA","CREPAS","BAGUIS","BEBIDAS"];

// ===== 2. CONTRASEÑA (guardada en binario, ver README para cambiarla)
// Ofuscación básica: NO es seguridad real, cualquiera con conocimientos puede revertirla. =====
const KEY="acreditaciones-v1";
const PW="01000111 01100001 01100010 01111001 01110011 00110001 00110011 00100011";
const bin=s=>[...new TextEncoder().encode(s)].map(b=>b.toString(2).padStart(8,"0")).join(" ");
const isOk=()=>{try{return sessionStorage.getItem("acred-ok")==="1"}catch(e){return false}};

// ===== 3. ESTADO DE LA APP
// S = {people:[{id,name,a:{ÁREA:"SI"|"PEND"|número|""},vac}]} · tab: 1 acreditaciones / 2 vacaciones =====
let S,tab=1,q="",flt="all",inst=null;

// ===== 4. UTILIDADES (selector corto y escape de HTML) =====
const $=s=>document.querySelector(s),dlg=$("#dlg");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

// ===== 5. PERSISTENCIA: todo se guarda en localStorage del dispositivo
// load() lee los datos guardados o usa SEED (data.js) la primera vez; save() guarda tras cada cambio. =====
function load(){try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!S||!S.people)S=JSON.parse(JSON.stringify(SEED))}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));toast("Guardado ✓")}catch(e){toast("No se pudo guardar")}}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("on"),1200)}

// ===== 6. ESTADOS DE CADA ÁREA
// kind(): clasifica el valor · label(): texto del chip · counts(): totales · match(): aplica búsqueda y filtros =====
const kind=v=>v==="SI"?"si":v==="PEND"?"pend":typeof v==="number"?"prog":"none";
const label=v=>v==="SI"?"SI":v==="PEND"?"PEND":typeof v==="number"?v+"%":"–";
function counts(){const c={si:0,pend:0,prog:0};S.people.forEach(p=>AREAS.forEach(a=>{const k=kind(p.a[a]);if(c[k]!==undefined)c[k]++}));return c}
function match(p){
  if(q&&!(p.name+" "+p.id).toLowerCase().includes(q))return false;
  const k=AREAS.map(a=>kind(p.a[a]));
  if(flt==="pend")return k.includes("pend");
  if(flt==="prog")return k.includes("prog");
  if(flt==="ok")return k.some(x=>x==="si")&&!k.includes("pend")&&!k.includes("prog");
  if(flt==="none")return k.includes("none");
  return true}

// ===== 7. VISTAS (se redibujan completas en cada cambio)
// render(): pestaña activa · viewA(): tarjetas de acreditaciones · viewV(): lista de vacaciones =====
function render(){
  $("#t1").className=tab==1?"on":"";$("#t2").className=tab==2?"on":"";
  $("#app").innerHTML=tab==1?viewA():viewV();
}
function viewA() {
  const c = counts(), list = S.people.filter(match);
  const F = [
    ["all", "Todos"],
    ["pend", "Con pendientes"],
    ["prog", "En curso"],
    ["ok", "Completos"],
    ["none", "Sin asignar"]
  ];

  return `<div class="sum">
    <span class="pill s-si">${c.si} acreditadas</span>
    <span class="pill s-pend">${c.pend} pendientes</span>
    <span class="pill s-prog">${c.prog} en curso</span>
  </div>

  <input type="search" id="q" placeholder="Buscar nombre o ID" value="${esc(q)}">

  <div class="filters">
    ${F.map(f => `<button data-f="${f[0]}" class="${flt == f[0] ? "on" : ""}">${f[1]}</button>`).join("")}
  </div>

  <div class="grid">
    ${list.map(p => `<div class="card">
      <button class="nm" data-p="${p.id}">${esc(p.name)}</button>
      <span class="id">ID ${esc(p.id)}</span>
      <div class="chips">
        ${AREAS.map(a => `<button class="chip s-${kind(p.a[a])}" data-p="${p.id}" data-a="${a}">
          <span>${a}</span><b>${label(p.a[a])}</b>
        </button>`).join("")}
      </div>
    </div>`).join("") || "<p>Sin resultados.</p>"}
  </div>

  <p class="leg">
    Toca un área para cambiar su estado. Durazno = acreditado ·
    Morado = pendiente · Verde = % de avance del curso · Gris = sin asignar.
  </p>

  <p class="copyright">
    © 2026 Gabriela. Todos los derechos reservados.
  </p>`;
}

// ===== Escala de color rojo–amarillo–verde para vacaciones (mínimo, mediana, máximo), igual que el Excel. =====
function scale(v,lo,mid,hi){const C=[[255,124,146],[255,214,128],[116,232,170]];let t,a,b;if(v<=mid){t=mid==lo?1:(v-lo)/(mid-lo);a=C[0];b=C[1]}else{t=hi==mid?1:(v-mid)/(hi-mid);a=C[1];b=C[2]}return`rgb(${a.map((x,i)=>Math.round(x+(b[i]-x)*t)).join(",")})`}
function viewV(){
  const L=S.people.filter(p=>!q||(p.name+p.id).toLowerCase().includes(q)).sort((a,b)=>b.vac-a.vac||a.name.localeCompare(b.name));
  const all=S.people.map(p=>p.vac).sort((a,b)=>a-b),lo=all[0],hi=all[all.length-1],mid=all[Math.floor((all.length-1)/2)];
  return `<input type="search" id="q" placeholder="Buscar colaborador" value="${esc(q)}"><p class="leg">Días de vacaciones 2026. Usa − y + o toca el número.</p>`+
  L.map(p=>`<div class="vac" style="background:${scale(p.vac,lo,mid,hi)}"><span style="flex:1"><b style="text-align:left;font-size:15px">${esc(p.name)}</b></span><button class="step" data-v="${p.id}" data-d="-1">−</button><b data-n="${p.id}" role="button" tabindex="0">${p.vac}</b><button class="step" data-v="${p.id}" data-d="1">+</button></div>`).join("")}

// ===== 8. VENTANAS: sheetArea() cambia el estado de un área · sheetPerson() agrega/edita/elimina · menu() opciones =====
const byId=id=>S.people.find(p=>p.id==id);
function sheetArea(p,a){
  const v=p.a[a];
  dlg.innerHTML=`<b>${esc(p.name)}</b><div class="id">${a}</div>
  <button class="opt s-si" data-set="SI">Acreditado</button><button class="opt s-pend" data-set="PEND">Pendiente de acreditar</button>
  <div class="row" style="margin-top:8px"><input type="number" id="pc" min="0" max="100" placeholder="% de avance del curso" value="${typeof v==="number"?v:""}"><button class="s-prog" data-set="PC" style="white-space:nowrap">Guardar %</button></div>
  <button class="opt s-none" data-set="">Sin asignar</button>`;
  dlg.onclick=e=>{const b=e.target.closest("[data-set]");if(e.target===dlg)return dlg.close();if(!b)return;let s=b.dataset.set;
    if(s==="PC"){const n=parseInt($("#pc").value);if(isNaN(n)||n<0||n>100)return toast("Escribe un % entre 0 y 100");s=n}
    p.a[a]=s;save();dlg.close();render()};
  dlg.showModal()}
function sheetPerson(p){
  const n=!p;p=p||{id:"",name:"",a:{},vac:0};
  dlg.innerHTML=`<b>${n?"Nuevo colaborador":"Editar colaborador"}</b>
  <p><input type="text" id="pn" placeholder="Nombre" value="${esc(p.name)}"></p><p><input type="text" id="pi" placeholder="ID" value="${esc(p.id)}"></p>
  <button class="opt s-prog" data-ok>Guardar</button>${n?"":'<button class="opt" data-del>Eliminar</button>'}`;
  dlg.onclick=e=>{if(e.target===dlg)return dlg.close();
    if(e.target.closest("[data-ok]")){const nm=$("#pn").value.trim().toUpperCase(),id=$("#pi").value.trim();if(!nm||!id)return toast("Falta nombre o ID");
      if(S.people.some(x=>x.id==id&&x!==p))return toast("Ese ID ya existe");p.name=nm;p.id=id;if(n)S.people.push(p);S.people.sort((a,b)=>a.name.localeCompare(b.name));save();dlg.close();render()}
    if(e.target.closest("[data-del]")&&confirm("¿Eliminar a "+p.name+"?")){S.people=S.people.filter(x=>x!==p);save();dlg.close();render()}};
  dlg.showModal()}

// ===== Descarga un archivo generado en el navegador. =====
function dl(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click()}
function menu(){
  dlg.innerHTML=`<b>Opciones</b>${inst?'<button class="opt" data-m="inst">Instalar app</button>':""}
  <button class="opt" data-m="csv">Exportar a Excel (CSV)</button><button class="opt" data-m="json">Descargar respaldo</button>
  <button class="opt" data-m="imp">Restaurar respaldo</button><button class="opt" data-m="rst">Volver a los datos del Excel original</button>`;
  dlg.onclick=e=>{if(e.target===dlg)return dlg.close();const mm=e.target.closest("[data-m]");if(!mm)return;const m=mm.dataset.m;dlg.close();
    if(m==="inst"){inst.prompt();inst=null}
    if(m==="json")dl("acreditaciones-respaldo.json",JSON.stringify(S),"application/json");
    if(m==="imp")$("#file").click();
    if(m==="rst"&&confirm("Se perderán todos tus cambios. ¿Continuar?")){S=JSON.parse(JSON.stringify(SEED));save();render()}
    if(m==="csv"){const r=[["ID","COLABORADOR",...AREAS,"DIAS VACACIONES 2026"]];S.people.forEach(p=>r.push([p.id,p.name,...AREAS.map(a=>p.a[a]===""||p.a[a]==null?"":p.a[a]),p.vac]));
      dl("ACREDITACIONES_"+new Date().toISOString().slice(0,10)+".csv","\ufeff"+r.map(x=>x.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(",")).join("\n"),"text/csv")}};
  dlg.showModal()}

// ===== 9. IMPORTAR RESPALDO (.json) =====
$("#file").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.people)throw 0;S=d;save();render()}catch(x){toast("Archivo no válido")}};r.readAsText(f);e.target.value=""};

// ===== 10. EVENTOS: un solo listener para todos los botones (delegación) + buscador =====
document.addEventListener("click",e=>{
  const t=e.target.closest("button,[data-n]");if(!t||t.closest("dialog"))return;
  if(t.id==="t1"||t.id==="t2"){tab=t.id==="t1"?1:2;q="";return render()}
  if(t.id==="menuBtn")return menu();if(t.id==="add")return sheetPerson();
  if(t.dataset.f){flt=t.dataset.f;return render()}
  if(t.dataset.a)return sheetArea(byId(t.dataset.p),t.dataset.a);
  if(t.classList.contains("nm"))return sheetPerson(byId(t.dataset.p));
  if(t.dataset.v){const p=byId(t.dataset.v);p.vac=Math.max(0,p.vac+ +t.dataset.d);save();return render()}
  if(t.dataset.n){const p=byId(t.dataset.n),n=prompt("Días de vacaciones de "+p.name,p.vac);if(n!==null&&!isNaN(parseInt(n))){p.vac=Math.max(0,parseInt(n));save();render()}}});
document.addEventListener("input",e=>{if(e.target.id==="q"){q=e.target.value.toLowerCase();const pos=e.target.selectionStart;render();const i=$("#q");i.focus();i.setSelectionRange(pos,pos)}});

// ===== 11. INSTALACIÓN COMO APP (muestra "Instalar app" en el menú si el navegador lo permite) =====
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();inst=e});

// ===== 12. ARRANQUE: carga datos, dibuja, pide contraseña y registra el service worker (modo sin internet) =====
load();render();
if(isOk())$("#lock").hidden=true;else setTimeout(()=>$("#pw").focus(),50);
$("#lf").onsubmit=e=>{e.preventDefault();if(bin($("#pw").value)===PW){try{sessionStorage.setItem("acred-ok","1")}catch(x){}$("#lock").hidden=true;$("#pw").value="";$("#err").textContent=""}else{$("#err").textContent="Contraseña incorrecta";$("#pw").select()}};
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js");
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();