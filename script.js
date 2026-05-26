const songs = [
  {title:"Sweetwater.mid", duration:128, notes:[[0,64,.35],[.5,67,.35],[1,69,.35],[1.5,72,.8],[2.45,71,.3],[2.9,69,.3],[3.35,67,.6],[4.2,64,.35],[4.7,67,.35],[5.2,69,.35],[5.7,76,.9],[6.85,74,.35],[7.3,72,.65],[8.2,60,.45],[8.8,64,.35],[9.3,67,.35],[9.8,72,.85],[10.9,69,.35],[11.35,67,.6],[12.25,57,.45],[12.8,60,.45],[13.35,64,.45],[13.9,69,.8],[14.9,67,.35],[15.4,64,.7]]},
  {title:"The Entertainer.mid", duration:194, notes:[[0,60,.18],[.25,62,.18],[.5,64,.18],[.75,65,.18],[1,67,.45],[1.65,64,.18],[1.95,67,.18],[2.25,72,.65],[3.05,69,.25],[3.45,67,.25],[3.85,64,.55]]},
  {title:"Maple Leaf Rag.mid", duration:156, notes:[[0,72,.16],[.24,71,.16],[.48,72,.16],[.72,67,.16],[.96,69,.32],[1.44,64,.25],[1.92,60,.16],[2.16,64,.16],[2.4,67,.16],[2.64,72,.16],[2.88,76,.45]]},
  {title:"Saloon Blues.mid", duration:105, notes:[[0,55,.45],[.75,58,.3],[1.2,60,.3],[1.65,61,.3],[2.1,62,.75],[3.15,60,.3],[3.6,58,.55],[4.45,55,.35],[4.95,58,.35],[5.45,60,.35],[5.95,63,.85]]},
  {title:"Whiskey Before Breakfast.mid", duration:121, notes:[[0,67,.16],[.22,69,.16],[.44,71,.16],[.66,72,.16],[.88,74,.3],[1.35,72,.16],[1.57,71,.16],[1.8,69,.3],[2.25,67,.3],[2.7,64,.3],[3.15,67,.3],[3.6,69,.55]]},
  {title:"The Easy Winners.mid", duration:166, notes:[[0,60,.16],[.3,64,.16],[.6,67,.16],[.9,72,.38],[1.45,71,.16],[1.75,72,.16],[2.05,74,.38],[2.7,72,.3],[3.1,69,.3],[3.65,67,.7]]},
  {title:"Piano Roll Blues.mid", duration:118, notes:[[0,48,.22],[.4,55,.22],[.8,60,.22],[1.2,63,.3],[1.7,64,.3],[2.25,63,.3],[2.75,60,.4],[3.55,55,.4],[4.15,58,.25],[4.65,60,.25],[5.15,63,.65]]},
  {title:"Ragtime Annie.mid", duration:142, notes:[[0,64,.16],[.22,67,.16],[.44,69,.16],[.66,71,.16],[.88,72,.35],[1.35,76,.3],[1.85,74,.2],[2.08,72,.2],[2.3,71,.2],[2.55,69,.2],[2.8,67,.45]]}
];

let audioCtx, masterGain;
let current=0, playing=false, startedAt=0, pausedAt=0, speed=1, volume=.8, raf=null;
let timers=[];

const songList=document.getElementById("songList");
const nowTitle=document.getElementById("nowTitle");
const timeText=document.getElementById("timeText");
const playBtn=document.getElementById("playBtn");
const keyboard=document.getElementById("keyboard");
const mechanism=document.getElementById("mechanism");
const holeLayer=document.getElementById("holeLayer");
const speedSlider=document.getElementById("speedSlider");
const volumeSlider=document.getElementById("volumeSlider");
const speedText=document.getElementById("speedText");
const volumeText=document.getElementById("volumeText");
const highlightToggle=document.getElementById("highlightToggle");

const whitePC=[0,2,4,5,7,9,11];
const blackAfter={0:1,1:3,3:6,4:8,5:10};

function fmt(s){s=Math.max(0,Math.floor(s));return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}

function makeSongList(){
  songList.innerHTML="";
  songs.forEach((s,i)=>{
    const div=document.createElement("div");
    div.className="song"+(i===current?" active":"");
    div.innerHTML=`<span>${s.title}</span><span>${fmt(s.duration)}</span>`;
    div.onclick=()=>loadSong(i,true);
    songList.appendChild(div);
  });
}

function makeKeyboard(){
  keyboard.innerHTML="";
  const whites=[];
  for(let n=36;n<=96;n++) if(whitePC.includes(n%12)) whites.push(n);
  whites.forEach(n=>{
    const k=document.createElement("div");
    k.className="white-key";
    k.dataset.note=n;
    keyboard.appendChild(k);
  });
  whites.forEach((n,i)=>{
    if(blackAfter[n%12]!==undefined && n+1<=96){
      const b=document.createElement("div");
      b.className="black-key";
      b.dataset.note=n+1;
      b.style.left=`${((i+.66)/whites.length)*100}%`;
      keyboard.appendChild(b);
    }
  });
}

function makeMechanism(){
  mechanism.innerHTML="";
  for(let i=0;i<61;i++){
    const a=document.createElement("div");
    a.className="action";
    a.dataset.index=i;
    a.innerHTML=`<i class="wire"></i><i class="head"></i><i class="red"></i>`;
    mechanism.appendChild(a);
  }
}

function repeatedNotes(){
  const out=[];
  const song=songs[current];
  const phrase=16;
  const loops=Math.ceil(song.duration/phrase);
  for(let l=0;l<loops;l++){
    song.notes.forEach(([t,n,d],idx)=>{
      const nt=t+l*phrase;
      if(nt<song.duration){
        out.push([nt,n,d]);
        if(idx%3===0 && n>52) out.push([nt+.025,n-12,Math.min(d,.25)]);
        if(idx%7===0 && n<82) out.push([nt+.04,n+7,Math.min(d,.2)]);
      }
    });
  }
  return out.sort((a,b)=>a[0]-b[0]);
}

function makeRoll(){
  holeLayer.innerHTML="";
  const dur=songs[current].duration;
  repeatedNotes().forEach(([t,n,d])=>{
    const h=document.createElement("i");
    h.className="hole";
    h.style.left=`${8+(t/dur)*185}%`;
    h.style.top=`${12+((96-n)/60)*125}px`;
    h.style.height=`${Math.max(7,d*22)}px`;
    holeLayer.appendChild(h);
  });
}

function ensureAudio(){
  if(!audioCtx){
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    masterGain=audioCtx.createGain();
    masterGain.gain.value=volume;
    masterGain.connect(audioCtx.destination);
  }
}

function freq(n){return 440*Math.pow(2,(n-69)/12)}

function sound(n,d){
  ensureAudio();
  const now=audioCtx.currentTime;
  const o1=audioCtx.createOscillator();
  const o2=audioCtx.createOscillator();
  const g=audioCtx.createGain();
  const f=audioCtx.createBiquadFilter();

  o1.type="triangle"; o2.type="sine";
  o1.frequency.value=freq(n); o2.frequency.value=freq(n)*2.002;
  f.type="lowpass"; f.frequency.value=2350; f.Q.value=.65;

  g.gain.setValueAtTime(.0001,now);
  g.gain.exponentialRampToValueAtTime(.32,now+.015);
  g.gain.exponentialRampToValueAtTime(.12,now+.12);
  g.gain.exponentialRampToValueAtTime(.0001,now+d+.5);

  o1.connect(f); o2.connect(f); f.connect(g); g.connect(masterGain);
  o1.start(now); o2.start(now); o1.stop(now+d+.55); o2.stop(now+d+.55);
  animateNote(n,d);
}

function midiIndex(n){return Math.max(0,Math.min(60,Math.round(((n-36)/60)*60)))}

function animateNote(n,d){
  if(!highlightToggle.checked)return;
  document.querySelectorAll(`[data-note="${n}"]`).forEach(el=>el.classList.add("active"));
  const a=document.querySelector(`.action[data-index="${midiIndex(n)}"]`);
  if(a)a.classList.add("active");
  setTimeout(()=>{
    document.querySelectorAll(`[data-note="${n}"]`).forEach(el=>el.classList.remove("active"));
    if(a)a.classList.remove("active");
  },Math.max(90,d*1000));
}

function clearTimers(){timers.forEach(clearTimeout);timers=[]}

function pos(){return playing?pausedAt+((performance.now()-startedAt)/1000)*speed:pausedAt}

function schedule(from=0){
  clearTimers();
  repeatedNotes().forEach(([t,n,d])=>{
    if(t<from)return;
    timers.push(setTimeout(()=>sound(n,d/speed),((t-from)/speed)*1000));
  });
}

function tick(){
  const p=pos(), dur=songs[current].duration;
  timeText.textContent=`${fmt(p)} / ${fmt(dur)}`;
  if(p>=dur){next(true);return}
  raf=requestAnimationFrame(tick);
}

function play(){
  ensureAudio();
  if(audioCtx.state==="suspended")audioCtx.resume();
  if(playing)return;
  document.body.classList.add("playing");
  playing=true;
  startedAt=performance.now();
  schedule(pausedAt);
  playBtn.textContent="Ⅱ";
  tick();
}

function pause(){
  if(!playing)return;
  pausedAt=pos();
  playing=false;
  document.body.classList.remove("playing");
  clearTimers();
  cancelAnimationFrame(raf);
  playBtn.textContent="▶";
}

function stop(){
  pause();
  pausedAt=0;
  timeText.textContent=`00:00 / ${fmt(songs[current].duration)}`;
}

function loadSong(i,auto=false){
  stop();
  current=(i+songs.length)%songs.length;
  nowTitle.textContent=songs[current].title;
  makeSongList();
  makeRoll();
  timeText.textContent=`00:00 / ${fmt(songs[current].duration)}`;
  if(auto)play();
}
function next(auto=false){loadSong(current+1,auto)}
function prev(){loadSong(current-1,playing)}

playBtn.onclick=()=>playing?pause():play();
document.getElementById("stopBtn").onclick=stop;
document.getElementById("nextBtn").onclick=()=>next(playing);
document.getElementById("prevBtn").onclick=prev;

speedSlider.oninput=e=>{
  speed=Number(e.target.value)/100;
  speedText.textContent=e.target.value+"%";
  if(playing){const p=pos();pause();pausedAt=p;play();}
}
volumeSlider.oninput=e=>{
  volume=Number(e.target.value)/100;
  volumeText.textContent=e.target.value+"%";
  if(masterGain)masterGain.gain.value=volume;
}

makeKeyboard();
makeMechanism();
makeSongList();
loadSong(0,false);
