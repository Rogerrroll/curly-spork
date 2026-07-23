"use strict";

const CONFIG = {
  name: "典之",
  date: "2026.07.26",
  scenes: [
    { name: "三中 · 初见站", sky: "#8fdad1", ground: "#70b56d", accent: "#e9b858" },
    { name: "一中 · 散步站", sky: "#93ccef", ground: "#639e68", accent: "#e97d85" },
    { name: "大学 · 南北站", sky: "#8878bd", ground: "#6d7194", accent: "#ffd067" },
    { name: "未来 · 许愿站", sky: "#42386f", ground: "#78628f", accent: "#ff8eaf" }
  ],
  memories: [
    { x: 520, title: "三中的初见", text: "从三中的同学名单里随机刷新出一位典之——后来才知道，这是超长友情任务的开场。", photo: "assets/photos/photo-1.jpg" },
    { x: 1050, title: "同校续费成功", text: "高中又在一中相遇。世界很大，但我们的地图仍然加载在同一所学校。", photo: "assets/photos/photo-2.jpg" },
    { x: 1580, title: "散步搭子认证", text: "走过很多没有任务奖励的路，却捡到了数不清的聊天、笑声和小秘密。", photo: "assets/photos/photo-3.jpg" },
    { x: 2120, title: "串门自由", text: "去对方家玩，是友情解锁的隐藏地图：不用客气，自动续杯，随时开聊。", photo: "assets/photos/photo-4.jpg" },
    { x: 2700, title: "南京 ↔ 佳木斯", text: "大学把距离拉得很长，但消息框、分享欲和惦记，把地图又悄悄折了起来。", photo: "assets/photos/photo-5.jpg" },
    { x: 3280, title: "马上大四下", text: "时间进度条跑得飞快。还好我们一边升级，一边记得交换彼此的新剧情。", photo: "assets/photos/photo-6.jpg" },
    { x: 3850, title: "画画技能 MAX", text: "典之的画笔绝对是稀有装备：脑洞、颜色和灵感一装备，普通世界也会变得闪闪发光。", photo: "assets/photos/photo-7.jpg" },
    { x: 4410, title: "南大新传许愿站", text: "认真准备考研的日子也许很累，但请相信：每一页书，都在给想去的方向铺路。", photo: "assets/photos/photo-8.jpg" }
  ],
  collectibles: [
    { x: 350, kind: "萝卜", icon: "carrot", toast: "收获像素萝卜：今日幸运 +21！" },
    { x: 860, kind: "草堆", icon: "hay", toast: "潜行草堆：刺客气质藏不住了。" },
    { x: 1390, kind: "散步鞋", icon: "shoe", toast: "散步鞋已装备：聊天续航无限。" },
    { x: 1930, kind: "星光票", icon: "star", toast: "星光票到账：这次不歪，全是好运！" },
    { x: 2480, kind: "信号", icon: "signal", toast: "跨越南北的友情信号：满格。" },
    { x: 3030, kind: "画笔", icon: "brush", toast: "稀有画笔：灵感暴击率 100%。" },
    { x: 3610, kind: "咖啡", icon: "coffee", toast: "备考咖啡：专注 +10，记得按时睡觉。" },
    { x: 4200, kind: "新传书", icon: "book", toast: "知识之书：正在前往喜欢的方向！" }
  ]
};

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const $ = (s) => document.querySelector(s);
const ui = {
  start: $("#startScreen"), memory: $("#memoryModal"), ending: $("#endingScreen"), gallery: $("#galleryScreen"),
  hud: $("#hud"), controls: $("#controls"), toast: $("#toast"), sound: $("#soundButton"),
  count: $("#collectCount"), scene: $("#sceneName"), progress: $("#sceneProgress")
};

const WORLD_WIDTH = 4800;
const FLOOR = 520;
let state = "start";
let lastTime = 0;
let cameraX = 0;
let toastTimer = 0;
let currentMemory = 0;
let collected = new Set();
let openedMemories = new Set();
let particles = [];
let obstacles = [];
let muted = false;
let audio = null;
let musicTimer = null;
const keys = { left: false, right: false, jump: false };
const player = { x: 110, y: FLOOR - 48, w: 30, h: 48, vx: 0, vy: 0, grounded: true, facing: 1, bump: 0 };

function resizeCanvas() {
  const ratio = innerHeight / innerWidth;
  canvas.width = 360;
  canvas.height = Math.max(540, Math.min(720, Math.round(360 * ratio)));
  ctx.imageSmoothingEnabled = false;
}
resizeCanvas();
addEventListener("resize", resizeCanvas);

function resetGame() {
  player.x = 110; player.y = FLOOR - player.h; player.vx = 0; player.vy = 0; player.bump = 0;
  cameraX = 0; collected = new Set(); openedMemories = new Set(); particles = [];
  obstacles = [720, 1260, 1810, 2350, 2910, 3460, 4020].map((x, i) => ({ x, y: FLOOR - (i % 2 ? 34 : 26), w: i % 2 ? 34 : 28, h: i % 2 ? 34 : 26, hit: false }));
  updateHud();
}

function startGame() {
  resetGame(); state = "playing"; ui.start.classList.remove("active"); ui.ending.classList.remove("active"); ui.gallery.classList.remove("active");
  ui.hud.classList.remove("hidden"); ui.controls.classList.remove("hidden"); startAudio();
}

function sceneIndexAt(x) { return Math.min(3, Math.floor(x / 1200)); }
function updateHud() {
  const i = sceneIndexAt(player.x);
  ui.scene.textContent = CONFIG.scenes[i].name; ui.progress.textContent = `${i + 1} / 4`; ui.count.textContent = collected.size;
}

function showToast(text) {
  ui.toast.textContent = text; ui.toast.classList.add("show"); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 2200);
}

function openMemory(index) {
  if (state !== "playing") return;
  state = "memory"; currentMemory = index; openedMemories.add(index); keys.left = keys.right = keys.jump = false;
  const m = CONFIG.memories[index];
  $("#memoryCount").textContent = `回忆碎片 ${index + 1} / ${CONFIG.memories.length}`;
  $("#memoryTitle").textContent = m.title; $("#memoryText").textContent = m.text;
  const img = $("#memoryPhoto"), placeholder = $("#photoPlaceholder");
  img.style.display = "none"; placeholder.classList.remove("hidden"); img.onload = () => { placeholder.classList.add("hidden"); img.style.display = "block"; };
  img.onerror = () => { placeholder.classList.remove("hidden"); img.style.display = "none"; }; img.src = m.photo;
  ui.memory.classList.add("active"); ui.controls.classList.add("hidden"); playSound("memory");
}

function closeMemory() { ui.memory.classList.remove("active"); ui.controls.classList.remove("hidden"); state = "playing"; }

function finishGame() {
  if (state === "ending") return; state = "ending"; ui.hud.classList.add("hidden"); ui.controls.classList.add("hidden");
  $("#endingStats").textContent = `本次散步收集了 ${collected.size}/8 个彩蛋，打开了 ${openedMemories.size}/8 段回忆。`;
  makeCandles(); ui.ending.classList.add("active"); playSound("finish");
}

function makeCandles() {
  const cake = $("#cake"); cake.innerHTML = "";
  for (let i = 0; i < 21; i++) { const c = document.createElement("i"); c.className = "candle"; c.style.left = `${8 + (i % 11) * 12}px`; c.style.top = `${-22 - Math.floor(i / 11) * 17}px`; c.style.animationDelay = `${i % 4 * .1}s`; cake.appendChild(c); }
}

function buildGallery() {
  const grid = $("#galleryGrid"); grid.innerHTML = "";
  CONFIG.memories.forEach((m, i) => {
    const card = document.createElement("article"); card.className = "gallery-card";
    const holder = document.createElement("div"); holder.className = "gallery-placeholder"; holder.textContent = "照片待投放";
    const img = new Image(); img.alt = m.title; img.onload = () => holder.replaceWith(img); img.src = m.photo;
    card.append(holder); const p = document.createElement("p"); p.textContent = `${i + 1}. ${m.title}`; card.append(p); grid.append(card);
  });
}

function update(dt) {
  if (state !== "playing") return;
  const accel = 900, maxSpeed = 150;
  if (keys.left) { player.vx -= accel * dt; player.facing = -1; }
  if (keys.right) { player.vx += accel * dt; player.facing = 1; }
  if (!keys.left && !keys.right) player.vx *= Math.pow(.0008, dt);
  player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));
  if (keys.jump && player.grounded) { player.vy = -325; player.grounded = false; playSound("jump"); }
  keys.jump = false; player.vy += 850 * dt; player.x += player.vx * dt; player.y += player.vy * dt;
  player.x = Math.max(10, Math.min(WORLD_WIDTH - 60, player.x));
  if (player.y + player.h >= FLOOR) { player.y = FLOOR - player.h; player.vy = 0; player.grounded = true; }
  player.bump = Math.max(0, player.bump - dt);

  obstacles.forEach((o) => {
    if (rectHit(player, o) && !o.hit) { o.hit = true; player.vx = -player.facing * 120; player.vy = -180; player.bump = .55; showToast(["被路边石头进行了友情提醒。","撞到空气墙了？不，是知识点。","优雅落地失败，但问题不大。"][Math.floor(Math.random()*3)]); playSound("bump"); }
    if (Math.abs(player.x - o.x) > 220) o.hit = false;
  });
  CONFIG.collectibles.forEach((c, i) => {
    if (!collected.has(i) && Math.abs((player.x + player.w/2) - c.x) < 30 && Math.abs((player.y + player.h/2) - (FLOOR - 70)) < 55) {
      collected.add(i); burst(c.x, FLOOR - 70, CONFIG.scenes[sceneIndexAt(c.x)].accent); showToast(c.toast); updateHud(); playSound("collect");
    }
  });
  CONFIG.memories.forEach((m, i) => { if (!openedMemories.has(i) && Math.abs(player.x - m.x) < 24) openMemory(i); });
  if (player.x > WORLD_WIDTH - 150) finishGame();
  cameraX += ((player.x - canvas.width * .38) - cameraX) * Math.min(1, dt * 5); cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraX));
  particles.forEach(p => { p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 120*dt; p.life -= dt; }); particles = particles.filter(p => p.life > 0);
  updateHud();
}

function rectHit(a,b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
function burst(x,y,color) { for(let i=0;i<16;i++) particles.push({x,y,vx:(Math.random()-.5)*180,vy:-Math.random()*180,life:.8+Math.random()*.5,color}); }

function draw() {
  const si = sceneIndexAt(player.x), scene = CONFIG.scenes[si];
  ctx.fillStyle = scene.sky; ctx.fillRect(0,0,canvas.width,canvas.height);
  drawSky(si); ctx.save(); ctx.translate(-Math.floor(cameraX), 0); drawWorld(); drawPlayer(); particles.forEach(drawParticle); ctx.restore();
  if (state === "start") drawStartBackdrop();
}

function drawSky(si) {
  if (si < 2) { ctx.fillStyle="#fff3c4"; for(let i=0;i<5;i++){ const x=((i*103-cameraX*.12)%460+460)%460-40; ctx.fillRect(x,90+(i%3)*52,48,12);ctx.fillRect(x+10,82+(i%3)*52,28,8); } }
  else { ctx.fillStyle="#fff1b1"; for(let i=0;i<24;i++){ const x=(i*71-cameraX*.08)%390; const y=55+(i*47)%270; ctx.fillRect(x,y,i%3===0?3:2,i%3===0?3:2); } }
  ctx.fillStyle = si===3 ? "#e38198" : "rgba(255,255,255,.18)"; ctx.fillRect(0,360,canvas.width,100);
}

function drawWorld() {
  for(let s=0;s<4;s++) drawSceneLandmark(s, s*1200);
  ctx.fillStyle="#473956"; ctx.fillRect(0,FLOOR,WORLD_WIDTH,canvas.height-FLOOR); ctx.fillStyle=CONFIG.scenes[sceneIndexAt(player.x)].ground; ctx.fillRect(0,FLOOR-10,WORLD_WIDTH,14);
  for(let x=0;x<WORLD_WIDTH;x+=32){ ctx.fillStyle=x%64?"#544462":"#66516e";ctx.fillRect(x,FLOOR+20,22,5); }
  obstacles.forEach(drawObstacle);
  CONFIG.collectibles.forEach((c,i)=>{ if(!collected.has(i)) drawCollectible(c,i); });
  CONFIG.memories.forEach((m,i)=>drawMemoryMarker(m,i));
  drawFinishGate();
}

function drawSceneLandmark(si, base) {
  const scene=CONFIG.scenes[si]; ctx.fillStyle=scene.accent;
  if(si===0){ ctx.fillRect(base+80,330,210,180); ctx.fillStyle="#f4dfac";ctx.fillRect(base+94,345,182,165);ctx.fillStyle="#4c4160";for(let i=0;i<4;i++)ctx.fillRect(base+110+i*41,375,25,30); pixelText("三 中",base+147,445,22,"#a34f58"); }
  if(si===1){ ctx.fillStyle="#d96e73";ctx.fillRect(base+70,405,250,105);ctx.fillStyle="#f5e4bd";ctx.fillRect(base+85,420,220,90);ctx.fillStyle="#557fa0";for(let i=0;i<5;i++)ctx.fillRect(base+100+i*40,440,24,28); pixelText("一 中",base+145,490,20,"#8e4053");ctx.fillStyle="#c3df9f";ctx.fillRect(base+420,465,320,8); }
  if(si===2){ drawSign(base+120,"南京",-1);drawSign(base+500,"佳木斯",1);ctx.fillStyle="#b6a0ce";ctx.fillRect(base+760,395,230,115);pixelText("大四下 LOADING...",base+785,455,13,"#fff0b5"); }
  if(si===3){ ctx.fillStyle="#f1bd77";ctx.fillRect(base+110,380,90,130);ctx.fillStyle="#fff2ce";ctx.fillRect(base+125,395,60,82);ctx.strokeStyle="#6e416b";ctx.lineWidth=6;ctx.strokeRect(base+125,395,60,82); pixelText("冲!",base+140,445,16,"#e05b84");ctx.fillStyle="#b9a1cf";ctx.fillRect(base+510,425,260,85); pixelText("南大新传方向 →",base+535,470,15,"#fff0b5"); }
  ctx.fillStyle="rgba(35,27,57,.75)";ctx.fillRect(base+12,270,165,34);pixelText(scene.name,base+24,292,13,"#fff4ce");
}

function drawSign(x,text,dir){ctx.fillStyle="#5c4052";ctx.fillRect(x,380,10,130);ctx.fillStyle="#ffd16f";ctx.fillRect(x-35,385,90,36);pixelText((dir<0?"← ":"")+text+(dir>0?" →":""),x-27,408,13,"#4b3655");}
function drawObstacle(o){ctx.fillStyle="#3e3550";ctx.fillRect(o.x,o.y,o.w,o.h);ctx.fillStyle="#7f7293";ctx.fillRect(o.x+4,o.y+4,o.w-8,7);ctx.fillStyle="#f1e0b4";ctx.fillRect(o.x+6,o.y+15,4,4);ctx.fillRect(o.x+o.w-10,o.y+15,4,4);}
function drawMemoryMarker(m,i){const open=openedMemories.has(i);ctx.fillStyle=open?"#a09bac":"#fff2c2";ctx.fillRect(m.x-17,FLOOR-82,34,58);ctx.fillStyle="#3d3151";ctx.fillRect(m.x-21,FLOOR-86,42,6);ctx.fillRect(m.x-21,FLOOR-28,42,6);pixelText(open?"✓":"?",m.x-6,FLOOR-47,20,open?"#6550a4":"#e55e8b");}
function drawFinishGate(){const x=WORLD_WIDTH-110;ctx.fillStyle="#ffd36a";ctx.fillRect(x,FLOOR-180,18,170);ctx.fillRect(x+90,FLOOR-180,18,170);ctx.fillRect(x,FLOOR-190,108,20);pixelText("许愿站",x+20,FLOOR-175,15,"#54365f");}

function drawCollectible(c,i){const bob=Math.sin(performance.now()/220+i)*5,x=c.x,y=FLOOR-70+bob;ctx.fillStyle="#fff3a3";ctx.fillRect(x-15,y-18,30,30);ctx.fillStyle="#d3537d";pixelText(String(i+1),x-5,y+3,13,"#d3537d");ctx.fillStyle="#fff";ctx.fillRect(x-20,y-8,3,3);ctx.fillRect(x+18,y-13,3,3);}
function drawParticle(p){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y),5,5);ctx.globalAlpha=1;}

function drawPlayer() {
  const p=player, x=Math.round(p.x), y=Math.round(p.y+(p.bump?Math.sin(p.bump*40)*3:0)); ctx.save();
  if(p.facing<0){ctx.translate(x+p.w,y);ctx.scale(-1,1);}else ctx.translate(x,y);
  ctx.fillStyle="#3c2b43";ctx.fillRect(5,1,21,18);ctx.fillRect(2,8,7,17);ctx.fillStyle="#f0b58f";ctx.fillRect(7,12,17,15);ctx.fillStyle="#352a45";ctx.fillRect(18,17,3,3);ctx.fillStyle="#e66b91";ctx.fillRect(6,27,20,16);ctx.fillStyle="#ffd265";ctx.fillRect(22,29,8,13);ctx.fillStyle="#4b3e65";ctx.fillRect(7,43,7,5);ctx.fillRect(20,43,7,5);ctx.fillStyle="#fff1c4";ctx.fillRect(8,31,3,3);ctx.restore();
}
function drawStartBackdrop(){ctx.fillStyle="rgba(36,25,65,.12)";for(let x=0;x<canvas.width;x+=28)for(let y=0;y<canvas.height;y+=28)if((x+y)%56===0)ctx.fillRect(x,y,5,5);}
function pixelText(text,x,y,size,color){ctx.fillStyle=color;ctx.font=`bold ${size}px monospace`;ctx.textBaseline="alphabetic";ctx.fillText(text,x,y);}

function loop(t){const dt=Math.min(.034,(t-lastTime)/1000||0);lastTime=t;update(dt);draw();requestAnimationFrame(loop);}

function startAudio(){if(muted)return;if(!audio) audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==="suspended")audio.resume();if(!musicTimer) scheduleMusic();}
function tone(freq,duration,type="square",volume=.035,delay=0){if(muted||!audio)return;const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(audio.destination);o.start(now);o.stop(now+duration);}
function scheduleMusic(){if(!audio||muted){musicTimer=null;return;}const notes=[262,330,392,523,392,330,294,349,440,587,440,349];notes.forEach((n,i)=>tone(n,.18,"square",.018,i*.22));musicTimer=setTimeout(scheduleMusic,notes.length*220);}
function playSound(kind){if(muted)return;startAudio();if(kind==="jump")tone(330,.12,"square",.03);if(kind==="collect"){tone(523,.12,"square",.04);tone(784,.2,"square",.035,.1);}if(kind==="bump")tone(110,.15,"sawtooth",.025);if(kind==="memory")tone(440,.12,"sine",.035);if(kind==="finish")[523,659,784,1047].forEach((n,i)=>tone(n,.5,"square",.035,i*.16));}
function toggleSound(){muted=!muted;ui.sound.classList.toggle("muted",muted);ui.sound.textContent=muted?"×":"♫";if(muted&&musicTimer){clearTimeout(musicTimer);musicTimer=null;}else startAudio();}

$("#startButton").addEventListener("click",startGame);$("#memoryClose").addEventListener("click",closeMemory);$("#restartButton").addEventListener("click",startGame);ui.sound.addEventListener("click",toggleSound);
$("#galleryButton").addEventListener("click",()=>{buildGallery();ui.ending.classList.remove("active");ui.gallery.classList.add("active");});
$("#galleryBack").addEventListener("click",()=>{ui.gallery.classList.remove("active");ui.ending.classList.add("active");});

document.querySelectorAll("[data-control]").forEach(btn=>{
  const key=btn.dataset.control;
  const down=e=>{e.preventDefault();keys[key]=true;btn.classList.add("pressed");startAudio();};
  const up=e=>{e.preventDefault();if(key!=="jump")keys[key]=false;btn.classList.remove("pressed");};
  btn.addEventListener("pointerdown",down);btn.addEventListener("pointerup",up);btn.addEventListener("pointercancel",up);btn.addEventListener("pointerleave",up);
});
addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","ArrowUp"," ","a","d","w"].includes(e.key))e.preventDefault();if(e.key==="ArrowLeft"||e.key==="a")keys.left=true;if(e.key==="ArrowRight"||e.key==="d")keys.right=true;if(e.key==="ArrowUp"||e.key==="w"||e.key===" ")keys.jump=true;});
addEventListener("keyup",e=>{if(e.key==="ArrowLeft"||e.key==="a")keys.left=false;if(e.key==="ArrowRight"||e.key==="d")keys.right=false;});
document.addEventListener("visibilitychange",()=>{if(document.hidden){keys.left=keys.right=keys.jump=false;}});
resetGame();requestAnimationFrame(loop);
