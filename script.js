const songs = [
  {
    title: "Sweetwater.mid",
    duration: 128,
    notes: [[0,64,.35],[.45,67,.35],[.9,69,.35],[1.35,72,.9],[2.3,71,.35],[2.75,69,.35],[3.2,67,.65],[4.2,64,.35],[4.65,67,.35],[5.1,69,.35],[5.55,76,1.0],[6.75,74,.35],[7.2,72,.65],[8.2,60,.45],[8.75,64,.35],[9.2,67,.35],[9.65,72,.8],[10.7,69,.35],[11.15,67,.6],[12.1,57,.45],[12.6,60,.45],[13.1,64,.45],[13.6,69,.8],[14.6,67,.35],[15.05,64,.75]]
  },
  { title:"The Entertainer.mid", duration:194, notes:[[0,60,.16],[.25,62,.16],[.5,64,.16],[.75,65,.16],[1,67,.45],[1.65,64,.16],[1.95,67,.16],[2.25,72,.65],[3.05,69,.25],[3.45,67,.25],[3.85,64,.55],[4.8,60,.16],[5.05,62,.16],[5.3,64,.16],[5.55,65,.16],[5.8,67,.45]]},
  { title:"Maple Leaf Rag.mid", duration:156, notes:[[0,72,.16],[.24,71,.16],[.48,72,.16],[.72,67,.16],[.96,69,.32],[1.44,64,.25],[1.92,60,.16],[2.16,64,.16],[2.4,67,.16],[2.64,72,.16],[2.88,76,.45],[3.55,74,.16],[3.85,72,.16],[4.15,69,.4]]},
  { title:"Saloon Blues.mid", duration:105, notes:[[0,55,.45],[.75,58,.3],[1.2,60,.3],[1.65,61,.3],[2.1,62,.75],[3.15,60,.3],[3.6,58,.55],[4.45,55,.35],[4.95,58,.35],[5.45,60,.35],[5.95,63,.85],[7.0,62,.45]]},
  { title:"Whiskey Before Breakfast.mid", duration:121, notes:[[0,67,.16],[.22,69,.16],[.44,71,.16],[.66,72,.16],[.88,74,.3],[1.35,72,.16],[1.57,71,.16],[1.8,69,.3],[2.25,67,.3],[2.7,64,.3],[3.15,67,.3],[3.6,69,.55]]},
  { title:"The Easy Winners.mid", duration:166, notes:[[0,60,.16],[.3,64,.16],[.6,67,.16],[.9,72,.38],[1.45,71,.16],[1.75,72,.16],[2.05,74,.38],[2.7,72,.3],[3.1,69,.3],[3.65,67,.7]]},
  { title:"Piano Roll Blues.mid", duration:118, notes:[[0,48,.22],[.4,55,.22],[.8,60,.22],[1.2,63,.3],[1.7,64,.3],[2.25,63,.3],[2.75,60,.4],[3.55,55,.4],[4.15,58,.25],[4.65,60,.25],[5.15,63,.65]]},
  { title:"Ragtime Annie.mid", duration:142, notes:[[0,64,.16],[.22,67,.16],[.44,69,.16],[.66,71,.16],[.88,72,.35],[1.35,76,.3],[1.85,74,.2],[2.08,72,.2],[2.3,71,.2],[2.55,69,.2],[2.8,67,.45]]}
];

let audioCtx, masterGain;
let currentSong = 0;
let playing = false;
let started = false;
let startTime = 0;
let pauseAt = 0;
let speed = 1;
let volume = .8;
let raf = null;
let timers = [];
let activeTimers = [];

const songMenu = document.getElementById("songMenu");
const nowTitle = document.getElementById("nowTitle");
const timeText = document.getElementById("timeText");
const keyLights = document.getElementById("keyLights");
const hammerRail = document.getElementById("hammerRail");
const playBtn = document.getElementById("playBtn");
const speedSlider = document.getElementById("speedSlider");
const volumeSlider = document.getElementById("volumeSlider");
const highlightToggle = document.getElementById("highlightToggle");

function fmt(sec){
  sec = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;
}

function ensureAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(audioCtx.destination);
  }
}

function midiToFreq(midi){
  return 440 * Math.pow(2,(midi-69)/12);
}

function playTone(midi, dur){
  ensureAudio();
  const now = audioCtx.currentTime;
  const oscA = audioCtx.createOscillator();
  const oscB = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  oscA.type = "triangle";
  oscB.type = "sine";
  oscA.frequency.value = midiToFreq(midi);
  oscB.frequency.value = midiToFreq(midi) * 2.002;

  filter.type = "lowpass";
  filter.frequency.value = 2300;
  filter.Q.value = .65;

  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.34, now+.015);
  gain.gain.exponentialRampToValueAtTime(.13, now+.13);
  gain.gain.exponentialRampToValueAtTime(.0001, now+dur+.55);

  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  oscA.start(now);
  oscB.start(now);
  oscA.stop(now+dur+.6);
  oscB.stop(now+dur+.6);

  animateNote(midi, dur);
}

function initVisualNoteLayers(){
  keyLights.innerHTML = "";
  hammerRail.innerHTML = "";

  for(let i=0;i<49;i++){
    const k = document.createElement("div");
    k.className = "key-light";
    k.dataset.index = i;
    k.style.left = `${(i / 49) * 100}%`;
    keyLights.appendChild(k);

    const h = document.createElement("div");
    h.className = "hammer-spark";
    h.dataset.index = i;
    h.style.left = `${(i / 49) * 100}%`;
    hammerRail.appendChild(h);
  }
}

function midiToIndex(midi){
  return Math.max(0, Math.min(48, Math.round(((midi - 36) / 60) * 48)));
}

function animateNote(midi, dur){
  if(!highlightToggle.checked) return;
  const idx = midiToIndex(midi);
  const key = document.querySelector(`.key-light[data-index="${idx}"]`);
  const hammer = document.querySelector(`.hammer-spark[data-index="${idx}"]`);
  if(key) key.classList.add("active");
  if(hammer) hammer.classList.add("active");

  const t = setTimeout(()=>{
    if(key) key.classList.remove("active");
    if(hammer) hammer.classList.remove("active");
  }, Math.max(90, dur*1000));
  activeTimers.push(t);
}

function expandedNotes(song){
  const out = [];
  const phrase = 16;
  const loops = Math.ceil(song.duration / phrase);
  for(let l=0;l<loops;l++){
    const offset = l * phrase;
    song.notes.forEach(([t,n,d], idx)=>{
      const nt = t + offset;
      if(nt < song.duration){
        out.push([nt,n,d]);
        if(idx % 3 === 0 && n > 52) out.push([nt+.025,n-12,Math.min(d,.28)]);
        if(idx % 7 === 0 && n < 80) out.push([nt+.05,n+7,Math.min(d,.22)]);
      }
    });
  }
  return out.sort((a,b)=>a[0]-b[0]);
}

function clearTimers(){
  timers.forEach(clearTimeout);
  activeTimers.forEach(clearTimeout);
  timers = [];
  activeTimers = [];
}

function getPos(){
  if(!playing) return pauseAt;
  return pauseAt + ((performance.now()-startTime)/1000) * speed;
}

function schedule(from=0){
  clearTimers();
  expandedNotes(songs[currentSong]).forEach(([t,n,d])=>{
    if(t < from) return;
    const timer = setTimeout(()=>playTone(n,d/speed), ((t-from)/speed)*1000);
    timers.push(timer);
  });
}

function animate(){
  const song = songs[currentSong];
  const pos = getPos();
  timeText.textContent = `${fmt(pos)} / ${fmt(song.duration)}`;
  if(pos >= song.duration){
    nextSong(true);
    return;
  }
  raf = requestAnimationFrame(animate);
}

function play(){
  ensureAudio();
  if(audioCtx.state === "suspended") audioCtx.resume();
  document.body.classList.add("started","playing");
  started = true;
  if(playing) return;
  playing = true;
  startTime = performance.now();
  schedule(pauseAt);
  playBtn.title = "Pause";
  animate();
}

function pause(){
  if(!playing) return;
  pauseAt = getPos();
  playing = false;
  document.body.classList.remove("playing");
  clearTimers();
  cancelAnimationFrame(raf);
  playBtn.title = "Play";
}

function stop(){
  pause();
  pauseAt = 0;
  timeText.textContent = `00:00 / ${fmt(songs[currentSong].duration)}`;
  document.querySelectorAll(".active").forEach(el=>{
    if(!el.classList.contains("song-row")) el.classList.remove("active");
  });
}

function loadSong(i, autoplay=false){
  stop();
  currentSong = (i + songs.length) % songs.length;
  nowTitle.textContent = songs[currentSong].title;
  timeText.textContent = `00:00 / ${fmt(songs[currentSong].duration)}`;
  renderSongs();
  if(autoplay) play();
}

function nextSong(autoplay=false){ loadSong(currentSong+1, autoplay); }
function prevSong(){ loadSong(currentSong-1, playing); }

function renderSongs(){
  songMenu.innerHTML = "";
  songs.forEach((song,i)=>{
    const row = document.createElement("div");
    row.className = "song-row" + (i === currentSong ? " active" : "");
    row.innerHTML = `<span>${song.title}</span><span>${fmt(song.duration)}</span>`;
    row.addEventListener("click",()=>loadSong(i,true));
    songMenu.appendChild(row);
  });
}

playBtn.addEventListener("click",()=>playing ? pause() : play());
document.getElementById("stopBtn").addEventListener("click",stop);
document.getElementById("nextBtn").addEventListener("click",()=>nextSong(playing));
document.getElementById("prevBtn").addEventListener("click",prevSong);

speedSlider.addEventListener("input",e=>{
  speed = Number(e.target.value)/100;
  if(playing){
    const p = getPos();
    pause();
    pauseAt = p;
    play();
  }
});

volumeSlider.addEventListener("input",e=>{
  volume = Number(e.target.value)/100;
  if(masterGain) masterGain.gain.value = volume;
});

initVisualNoteLayers();
renderSongs();
loadSong(0,false);
