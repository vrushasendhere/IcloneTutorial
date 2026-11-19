const CATS = GUIDE.cats, F = GUIDE.items;
/* ---------------- app ---------------- */
const $ = s => document.querySelector(s);
/* Progress is saved in the browser when allowed; otherwise it lasts until the tab closes. */
let canStore = true, store = {};
try { store = JSON.parse(localStorage.getItem(GUIDE.key) || "{}"); } catch (e) { canStore = false; }
store.done = store.done || {}; store.steps = store.steps || {};
const save = () => { if (canStore) try { localStorage.setItem(GUIDE.key, JSON.stringify(store)); } catch (e) {} };
let filter = "all", query = "";

F.forEach((f,i)=> f.id = f.cat + "_" + i);

function ytLink(q){
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q + " -reallusion");
}
function matches(f){
  if (filter === "todo" && store.done[f.id]) return false;
  if (["Beginner","Intermediate","Advanced"].includes(filter) && f.level !== filter) return false;
  if (!query) return true;
  const hay = (f.title+" "+f.where+" "+f.short+" "+f.more+" "+f.ex+" "+f.try.join(" ")).toLowerCase();
  return query.split(/\s+/).every(w => hay.includes(w));
}
function card(f){
  const d = store.done[f.id] ? " done" : "";
  const steps = f.try.map((s,j)=>{
    const k = f.id+"_"+j;
    return `<li data-k="${k}" class="${store.steps[k]?'ok':''}">${s}</li>`;
  }).join("");
  return `<div class="card${d}" id="${f.id}">
    <div class="top"><div class="ico">${f.icon}</div>
      <div class="ttl"><h3>${f.title}</h3><div class="where">${f.where}</div></div>
      <span class="lvl ${f.level}">${f.level}</span></div>
    <p class="short">${f.short}</p>
    <div class="btns">
      <button data-t="more">💡 Explain</button>
      <button data-t="try">🛠️ Try it</button>
      <a class="yt" href="${ytLink(f.yt)}" target="_blank" rel="noopener">▶ Tutorials</a>
      <label><input type="checkbox" ${store.done[f.id]?"checked":""} data-done="${f.id}"> learned</label>
    </div>
    <div class="more">${f.more}<div class="ex">🐘 <b>Example:</b> ${f.ex}</div></div>
    <div class="try"><span class="goal">Practice (click a step when done):</span><ol>${steps}</ol></div>
  </div>`;
}
function render(){
  let html = "";
  CATS.forEach(([id,icon,name])=>{
    const items = F.filter(f=>f.cat===id && matches(f));
    if (!items.length) return;
    html += `<h2 class="cat" id="cat_${id}">${icon} ${name} <small>${items.length} topics</small></h2><div class="grid">${items.map(card).join("")}</div>`;
  });
  if (!html) html = `<div class="empty">Nothing matches “${query}”. Ask Claude about it!</div>`;
  $("#content").innerHTML = intro() + html;
  stats();
}
function stats(){
  $("#nav").innerHTML = CATS.map(([id,icon,name])=>{
    const all = F.filter(f=>f.cat===id);
    const done = all.filter(f=>store.done[f.id]).length;
    return `<a data-go="${id}"><span>${icon} ${name}</span><small>${done}/${all.length}</small></a>`;
  }).join("");
  const n = Object.values(store.done).filter(Boolean).length;
  $("#barfill").style.width = (100*n/F.length)+"%";
  $("#ptext").textContent = `${n} / ${F.length} learned`;
}
function intro(){
  if (query || filter!=="all") return "";
  return `<div class="intro"><b>How to use:</b> each card is one ${GUIDE.product} feature.
  <b>💡 Explain</b> opens the details and an example, <b>🛠️ Try it</b> gives a short practice task, and
  <b>▶ Tutorials</b> searches YouTube (Reallusion's own channel is filtered out).
  Tick <b>learned</b> to track progress; it's saved in this browser. Press <kbd>/</kbd> to search.
  Menu names can differ slightly between ${GUIDE.product} updates. If something doesn't match your screen, ask Claude.</div>`;
}

document.addEventListener("click", e=>{
  const t = e.target;
  if (t.dataset.t){ t.closest(".card").querySelector("."+t.dataset.t).classList.toggle("open"); }
  if (t.tagName==="LI" && t.dataset.k){ store.steps[t.dataset.k]=!store.steps[t.dataset.k]; t.classList.toggle("ok"); save(); }
  if (t.closest("[data-go]")){ const el = document.getElementById("cat_"+t.closest("[data-go]").dataset.go); if(el) el.scrollIntoView({behavior:"smooth"}); }
  if (t.classList.contains("chip") && t.dataset.f){
    document.querySelectorAll(".chip[data-f]").forEach(c=>c.classList.remove("on"));
    t.classList.add("on"); filter = t.dataset.f; render();
  }
});
document.addEventListener("change", e=>{
  if (e.target.dataset.done){
    store.done[e.target.dataset.done]=e.target.checked; save();
    if (filter==="todo") return render();
    e.target.closest(".card").classList.toggle("done", e.target.checked);
    stats();
  }
});
$("#search").addEventListener("input", e=>{ query = e.target.value.trim().toLowerCase(); render(); });
document.addEventListener("keydown", e=>{ if(e.key==="/" && document.activeElement!==$("#search")){ e.preventDefault(); $("#search").focus(); }});
$("#theme").onclick = ()=>{ document.body.classList.toggle("light"); store.light=document.body.classList.contains("light"); save(); };
if (store.light) document.body.classList.add("light");
render();
