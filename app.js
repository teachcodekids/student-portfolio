const $ = (id) => document.getElementById(id);
const groups = [
  ["scratch", "Scratch", "⚑", "#ffdfac", "เกมแมวเก็บดาว", "ใช้บล็อกคำสั่งให้แมวเคลื่อนที่และนับคะแนนเมื่อเก็บดาว"],
  ["python", "Python", "⌘", "#dce9ff", "ดอกไม้เรขาคณิต", "ใช้ Python Turtle วาดกลีบดอกไม้ซ้ำด้วยลูป"],
  ["3d", "3D", "⬡", "#e9ddff", "หุ่นยนต์ตั้งโต๊ะ", "ประกอบรูปทรงพื้นฐานให้เป็นโมเดลหุ่นยนต์สามมิติ"],
  ["microbit", "micro:bit", "▦", "#dafaac", "หัวใจ LED", "แสดงรูปหัวใจบนไฟ LED ขนาด 5 × 5"],
  ["arcade", "MakeCode Arcade", "✚", "#ffd9e8", "เกมยานอวกาศ", "ควบคุมยานอวกาศและหลบสิ่งกีดขวางด้วยปุ่มทิศทาง"],
];
const isEditor = location.pathname.endsWith("/edit.html");
const published = window.publishedPortfolio || {name:"",cover:"",projects:[],revision:"initial"};
const storageKey = "maker-draft-v1:" + location.pathname;
let data = published;
if (isEditor) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.revision === published.revision) data = saved;
  } catch {}
  for (const id of ["profile","add","publish-panel"]) $(id).hidden = false;
  $("export").onclick = () => {
    const snapshot = {...data, revision: crypto.randomUUID()};
    const file = new Blob(["window.publishedPortfolio = ",JSON.stringify(snapshot),";\n"],{type:"text/javascript"});
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "portfolio.js";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}
let active = groups[0][0];
let editing = null;

function artwork(group) {
  const c = document.createElement("canvas");
  c.width = 760; c.height = 380;
  const ctx = c.getContext("2d");
  const gradient = ctx.createLinearGradient(0,0,760,380);
  gradient.addColorStop(0,group[3]); gradient.addColorStop(1,"#25208c");
  ctx.fillStyle = gradient; ctx.fillRect(0,0,760,380);
  ctx.fillStyle = "#ffffff22";
  for(let x=20;x<760;x+=24) for(let y=20;y<380;y+=24) ctx.fillRect(x,y,2,2);
  ctx.fillStyle = "#171a32"; ctx.beginPath(); ctx.roundRect(195,42,370,296,24); ctx.fill();
  ctx.fillStyle = group[3]; ctx.beginPath(); ctx.roundRect(211,58,338,264,15); ctx.fill();
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "112px system-ui";
  if (group[0] === "microbit") {
    ["01010","11111","11111","01110","00100"].forEach((row,y)=>[...row].forEach((bit,x)=>{
      ctx.fillStyle = bit === "1" ? "#ff5274" : "#3a3358"; ctx.fillRect(306+x*31,117+y*31,24,24);
    }));
  } else {
    ctx.fillText({scratch:"🐱",python:"🌸","3d":"🤖",arcade:"🚀"}[group[0]],380,198);
  }
  return c.toDataURL("image/webp",.88);
}
const examples = groups.map(g=>({id:g[0],category:g[0],title:g[4],desc:g[5],image:artwork(g),demo:true}));
function save(next) { localStorage.setItem(storageKey,JSON.stringify(next)); data = next; render(); }
function render() {
  $("student").textContent = data.name || "ชื่อนักเรียน";
  $("cover").style.backgroundImage = data.cover ? 'url("' + data.cover + '")' : "";
  for(const button of $("categories").children) button.setAttribute("aria-pressed",button.dataset.category === active);
  $("category-title").textContent = groups.find(g=>g[0]===active)[1];
  const real = data.projects.filter(p=>p.category===active);
  $("count").textContent = real.length ? real.length + " ผลงาน" : "ตัวอย่างผลงาน";
  $("gallery").replaceChildren(...(real.length ? real : examples.filter(p=>p.category===active)).map(card));
}
function showDetail(p) {
  $("detail-title").textContent = p.title;
  $("detail-image").src = p.image;
  $("detail-image").alt = p.title;
  $("detail-desc").textContent = p.desc || "";
  $("detail").showModal();
}
function card(p) {
  const article = document.createElement("article"); article.className = "project";
  article.innerHTML = '<img><div class="project-body"><span class="sample">ผลงานตัวอย่าง</span><h3></h3><p></p><div class="actions"></div></div>';
  const img = article.querySelector("img"); img.src = p.image; img.alt = p.title;
  article.querySelector(".sample").hidden = !p.demo;
  article.querySelector("h3").textContent = p.title;
  article.querySelector("p").textContent = p.desc || "";
  const actions = article.querySelector(".actions");
  const view = document.createElement(p.url ? "a" : "button");
  view.className = "dark"; view.textContent = "ดูผลงาน ↗";
  if(p.url) { view.href=p.url; view.target="_blank"; view.rel="noopener noreferrer"; }
  else view.onclick=()=>showDetail(p);
  actions.append(view);
  if(isEditor && !p.demo) {
    const edit=document.createElement("button"); edit.className="outline"; edit.textContent="แก้ไข";
    edit.onclick=()=>openEditor("project",p); actions.append(edit);
  }
  return article;
}
for(const [id,name,icon,tint] of groups) {
  const button=document.createElement("button");
  button.className="category"; button.dataset.category=id;
  button.style.setProperty("--tint",tint);
  button.innerHTML='<span class="icon" aria-hidden="true">'+icon+'</span>'+name;
  button.onclick=()=>{ active=id; render(); };
  $("categories").append(button);
}
function openEditor(mode,p) {
  editing={mode,p};
  $("edit-title").textContent=mode==="cover"?"แก้ไขหน้าปก":p?"แก้ไขผลงาน":"เพิ่มผลงาน";
  $("error").textContent="";
  $("remove").hidden=!p;
  $("fields").innerHTML=mode==="cover"
    ? '<label>ชื่อนักเรียน<input name="title" maxlength="100" required></label><label>ภาพปก<input name="image" type="file" accept="image/*"></label>'
    : '<label>ชื่อผลงาน<input name="title" maxlength="100" required></label><label>หมวดผลงาน<select name="category"></select></label><label>ภาพผลงาน<input name="image" type="file" accept="image/*"></label><label>คำอธิบาย<textarea name="desc" maxlength="600"></textarea></label><label>ลิงก์เปิดผลงาน<input name="url" type="url" placeholder="https://…"><small>หากเว้นว่าง ปุ่มดูผลงานจะเปิดภาพและคำอธิบายในเว็บนี้</small></label>';
  const fields=$("edit-form").elements;
  fields.title.value=mode==="cover"?data.name:p?.title||"";
  if(mode==="project") {
    for(const [id,name] of groups) fields.category.add(new Option(name,id));
    fields.category.value=p?.category||active; fields.image.required=!p;
    fields.desc.value=p?.desc||""; fields.url.value=p?.url||"";
  }
  $("editor").showModal();
}
async function resize(file) {
  const source=URL.createObjectURL(file);
  try{
    const image=new Image(); image.src=source; await image.decode();
    const scale=Math.min(1,1100/Math.max(image.width,image.height));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(image.width*scale)); canvas.height=Math.max(1,Math.round(image.height*scale));
    canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
    return canvas.toDataURL("image/webp",.82);
  } finally { URL.revokeObjectURL(source); }
}
$("edit-form").onsubmit=async (event)=>{
  event.preventDefault();
  const fields=event.currentTarget.elements;
  const submit=event.submitter;
  const {mode,p}=editing;
  const title=fields.title.value.trim();
  if(!title) { $("error").textContent="กรุณากรอกชื่อ"; return; }
  submit.disabled=true;
  try {
    const file=fields.image.files[0];
    const image=file?await resize(file):mode==="cover"?data.cover:p?.image;
    if(mode==="cover") save({...data,name:title,cover:image});
    else {
      const url=fields.url.value.trim();
      if(url && !["https:","http:"].includes(new URL(url).protocol)) { $("error").textContent="กรุณาใช้ลิงก์ HTTPS หรือ HTTP"; return; }
      const project={id:p?.id||crypto.randomUUID(),title,category:fields.category.value,desc:fields.desc.value.trim(),url,image};
      const projects=p?data.projects.map(item=>item.id===p.id?project:item):[project,...data.projects];
      save({...data,projects}); active=project.category; render();
    }
    $("editor").close();
  } catch(error) {
    $("error").textContent=error.name==="QuotaExceededError"?"พื้นที่บันทึกเต็ม กรุณาลองใช้ภาพขนาดเล็กลง":"บันทึกไม่สำเร็จ กรุณาตรวจสอบไฟล์ภาพและลองอีกครั้ง";
  } finally { submit.disabled=false; }
};
$("remove").onclick=()=>{
  if(!editing.p || !confirm("ลบผลงานนี้ออกจากแฟ้ม?")) return;
  try { save({...data,projects:data.projects.filter(p=>p.id!==editing.p.id)}); $("editor").close(); }
  catch { $("error").textContent="ลบผลงานไม่สำเร็จ"; }
};
$("profile").onclick=()=>openEditor("cover");
$("add").onclick=()=>openEditor("project");
for(const id of ["editor","detail"]) $(id).querySelector(".close").onclick=()=>$(id).close();
render();
