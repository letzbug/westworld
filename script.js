const songs = [
  {
    title: "Sweetwater.mid",
    duration: 128,
    bpm: 84,
    notes: [
      [0,64,.45],[.5,67,.45],[1,69,.45],[1.5,72,.9],[2.5,71,.45],[3,69,.45],[3.5,67,.7],
      [4.4,64,.45],[4.9,67,.45],[5.4,69,.45],[5.9,76,1.1],[7.2,74,.45],[7.7,72,.7],
      [8.6,60,.55],[9.2,64,.45],[9.7,67,.45],[10.2,72,.9],[11.3,69,.45],[11.8,67,.7],
      [12.8,57,.5],[13.3,60,.5],[13.8,64,.5],[14.3,69,.9],[15.3,67,.45],[15.8,64,.8],
      [16.8,52,.25],[17.1,59,.25],[17.4,64,.25],[17.7,67,.25],[18.0,72,.7],[18.8,76,.55],
      [19.6,74,.4],[20.1,72,.4],[20.6,69,.4],[21.1,67,.75]
    ]
  },
  {
    title: "The Entertainer.mid",
    duration: 194,
    bpm: 100,
    notes: [[0,60,.2],[.25,62,.2],[.5,64,.2],[.75,65,.2],[1,67,.5],[1.7,64,.2],[2,67,.2],[2.3,72,.7],[3.2,69,.3],[3.6,67,.3],[4,64,.6],[5,60,.2],[5.25,62,.2],[5.5,64,.2],[5.75,65,.2],[6,67,.5],[6.6,64,.2],[6.9,67,.2],[7.2,72,.7]]
  },
  {
    title: "Maple Leaf Rag.mid",
    duration: 156,
    bpm: 112,
    notes: [[0,72,.2],[.25,71,.2],[.5,72,.2],[.75,67,.2],[1,69,.4],[1.5,64,.3],[2,60,.2],[2.25,64,.2],[2.5,67,.2],[2.75,72,.2],[3,76,.5],[3.7,74,.2],[4,72,.2],[4.3,69,.5],[5,60,.25],[5.25,67,.25],[5.5,72,.25],[5.75,76,.25]]
  },
  {
    title: "Saloon Blues.mid",
    duration: 105,
    bpm: 78,
    notes: [[0,55,.5],[.8,58,.35],[1.3,60,.35],[1.8,61,.35],[2.3,62,.8],[3.4,60,.35],[3.9,58,.6],[4.8,55,.4],[5.3,58,.4],[5.8,60,.4],[6.3,63,.9],[7.4,62,.5]]
  },
  {
    title: "Whiskey Before Breakfast.mid",
    duration: 121,
    bpm: 118,
    notes: [[0,67,.2],[.25,69,.2],[.5,71,.2],[.75,72,.2],[1,74,.35],[1.5,72,.2],[1.75,71,.2],[2,69,.35],[2.5,67,.35],[3,64,.35],[3.5,67,.35],[4,69,.7]]
  },
  {
    title: "The Easy Winners.mid",
    duration: 166,
    bpm: 96,
    notes: [[0,60,.2],[.3,64,.2],[.6,67,.2],[.9,72,.45],[1.5,71,.2],[1.8,72,.2],[2.1,74,.45],[2.8,72,.35],[3.2,69,.35],[3.8,67,.8]]
  },
  {
    title: "Piano Roll Blues.mid",
    duration: 118,
    bpm: 90,
    notes: [[0,48,.25],[.4,55,.25],[.8,60,.25],[1.2,63,.35],[1.7,64,.35],[2.3,63,.35],[2.8,60,.45],[3.6,55,.45],[4.2,58,.3],[4.7,60,.3],[5.2,63,.7]]
  },
  {
    title: "Ragtime Annie.mid",
    duration: 142,
    bpm: 116,
    notes: [[0,64,.2],[.25,67,.2],[.5,69,.2],[.75,71,.2],[1,72,.4],[1.5,76,.35],[2,74,.25],[2.25,72,.25],[2.5,71,.25],[2.75,69,.25],[3,67,.5]]
  }
];

const whitePattern = [0,2,4,5,7,9,11];
const blackAfter = {0:1,1:3,3:6,4:8,5:10};
let audioCtx;
let masterGain;
let currentSong = 0;
let playing = false;
let startTime = 0;
let pauseAt = 0;
let speed = 1;
let volume = .8;
let rafId = null;
let noteTimers = [];
let activeTimeouts = [];

const songList = document.getElementById("songList");
const keyboard = document.getElementById("keyboard");
const actionRail = document.getElementById("actionRail");
const paperRoll = document.getElementById("paperRoll");
const holeLayer = document.getElementById("holeLayer");
const nowTitle = document.getElementById("nowTitle");
const timeText = document.getElementById("timeText");
const statusLight = document.getElementById("statusLight");
const playBtn = document.getElementById("playBtn");
const speedSlider = document.getElementById("speedSlider");
const volumeSlider = document.getElementById("volumeSlider");
const speedValue = document.getElementById("speedValue");
const volumeValue = document.getElementById("volumeValue");
const highlightToggle = document.getElementById("highlightToggle");

function fmt(sec){
  sec = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;
}

function initSongs(){
  songList.innerHTML = "";
  songs.forEach((song, i)=>{
    const row = document.createElement("div");
    row.className = "song-item" + (i === currentSong ? " active" : "");
    row.innerHTML = `<span>${song.title}</span><span class="song-time">${fmt(song.duration)}</span>`;
    row.addEventListener("click",()=>loadSong(i,true));
    songList.appendChild(row);
  });
}

function initKeyboard(){
  keyboard.innerHTML = "";
  actionRail.innerHTML = "";
  const whiteNotes = [];
  for(let midi=36; midi<=96; midi++){
    if(whitePattern.includes(midi%12)) whiteNotes.push(midi);
  }
  whiteNotes.forEach(midi=>{
    const key = document.createElement("div");
    key.className = "key white";
    key.dataset.note = midi;
    keyboard.appendChild(key);
  });

  const whiteCount = whiteNotes.length;
  whiteNotes.forEach((midi, index)=>{
    const offset = blackAfter[midi%12];
    if(offset !== undefined && midi + 1 <= 96){
      const black = document.createElement("div");
      black.className = "key black";
      black.dataset.note = midi + 1;
      black.style.left = `${((index + .68) / whiteCount) * 100}%`;
      keyboard.appendChild(black);
    }
  });

  for(let i=0;i<49;i++){
    const action = document.createElement("div");
    action.className = "action";
    action.dataset.index = i;
    action.innerHTML = `<div class="hammer"></div>`;
    actionRail.appendChild(action);
  }
}

function generateRollHoles(){
  holeLayer.innerHTML = "";
  const song = songs[currentSong];
  const notes = expandSongNotes(song);
  notes.forEach(([t,n,d])=>{
    const h = document.createElement("div");
    h.className = "hole";
    const x = (t / Math.max(20, song.duration)) * 180 + 10;
    const y = ((n - 36) / 60) * 120 + 12;
    h.style.left = `${x}%`;
    h.style.top = `${Math.max(8, Math.min(135, y))}px`;
    h.style.height = `${Math.max(7, d*18)}px`;
    holeLayer.appendChild(h);
  });
}

function expandSongNotes(song){
  const out = [];
  const loop = Math.max(1, Math.ceil(song.duration / 22));
  for(let r=0;r<loop;r++){
    song.notes.forEach(n=>{
      const nt = n[0] + r * 22;
      if(nt < song.duration) out.push([nt, n[1], n[2]]);
      if(nt + .03 < song.duration && n[1] > 54 && Math.random() > .55) out.push([nt+.02, n[1]-12, Math.min(n[2],.35)]);
    });
  }
  return out.sort((a,b)=>a[0]-b[0]);
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

function playNote(midi, dur=.35){
  ensureAudio();
  const now = audioCtx.currentTime;
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc1.type = "triangle";
  osc2.type = "sine";
  osc1.frequency.value = midiToFreq(midi);
  osc2.frequency.value = midiToFreq(midi) * 2.001;

  filter.type = "lowpass";
  filter.frequency.value = 2200;
  filter.Q.value = .7;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.32, now + .018);
  gain.gain.exponentialRampToValueAtTime(0.12, now + .12);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur + .45);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + dur + .55);
  osc2.stop(now + dur + .55);

  animateNote(midi, dur);
}

function animateNote(midi, dur){
  if(!highlightToggle.checked) return;
  document.querySelectorAll(`[data-note="${midi}"]`).forEach(el=>el.classList.add("active"));
  const actionIndex = Math.round(((midi - 36) / 60) * 48);
  const action = document.querySelector(`.action[data-index="${Math.max(0,Math.min(48,actionIndex))}"]`);
  if(action) action.classList.add("active");

  const timeout = setTimeout(()=>{
    document.querySelectorAll(`[data-note="${midi}"]`).forEach(el=>el.classList.remove("active"));
    if(action) action.classList.remove("active");
  }, Math.max(90, dur * 1000));
  activeTimeouts.push(timeout);
}

function scheduleSong(fromSeconds=0){
  clearSchedules();
  const song = songs[currentSong];
  const notes = expandSongNotes(song);
  notes.forEach(([t,n,d])=>{
    if(t < fromSeconds) return;
    const delay = ((t - fromSeconds) / speed) * 1000;
    const timer = setTimeout(()=>playNote(n, d / speed), delay);
    noteTimers.push(timer);
  });
}

function clearSchedules(){
  noteTimers.forEach(clearTimeout);
  noteTimers = [];
  activeTimeouts.forEach(clearTimeout);
  activeTimeouts = [];
}

function getPosition(){
  if(!playing) return pauseAt;
  return pauseAt + ((performance.now() - startTime) / 1000) * speed;
}

function animate(){
  const song = songs[currentSong];
  const pos = getPosition();
  timeText.textContent = `${fmt(pos)} / ${fmt(song.duration)}`;
  const progress = Math.min(1, pos / song.duration);
  paperRoll.style.transform = `translateX(${-progress * 50}%)`;
  if(pos >= song.duration){
    nextSong(true);
    return;
  }
  rafId = requestAnimationFrame(animate);
}

function play(){
  ensureAudio();
  if(audioCtx.state === "suspended") audioCtx.resume();
  if(playing) return;
  playing = true;
  startTime = performance.now();
  scheduleSong(pauseAt);
  playBtn.textContent = "Ⅱ";
  statusLight.style.background = "#7cc84a";
  statusLight.style.boxShadow = "0 0 14px #7cc84a";
  animate();
}

function pause(){
  if(!playing) return;
  pauseAt = getPosition();
  playing = false;
  clearSchedules();
  cancelAnimationFrame(rafId);
  playBtn.textContent = "▶";
  statusLight.style.background = "#a46b35";
  statusLight.style.boxShadow = "0 0 12px #a46b35";
}

function stop(){
  pause();
  pauseAt = 0;
  paperRoll.style.transform = "translateX(0)";
  timeText.textContent = `00:00 / ${fmt(songs[currentSong].duration)}`;
  document.querySelectorAll(".active").forEach(el=>{
    if(!el.classList.contains("tab") && !el.classList.contains("song-item")) el.classList.remove("active");
  });
}

function loadSong(i, autoplay=false){
  stop();
  currentSong = (i + songs.length) % songs.length;
  nowTitle.textContent = songs[currentSong].title;
  initSongs();
  generateRollHoles();
  timeText.textContent = `00:00 / ${fmt(songs[currentSong].duration)}`;
  if(autoplay) play();
}

function nextSong(autoplay=false){ loadSong(currentSong+1, autoplay); }
function prevSong(){ loadSong(currentSong-1, playing); }

document.getElementById("playBtn").addEventListener("click",()=> playing ? pause() : play());
document.getElementById("stopBtn").addEventListener("click", stop);
document.getElementById("nextBtn").addEventListener("click",()=>nextSong(playing));
document.getElementById("prevBtn").addEventListener("click", prevSong);

speedSlider.addEventListener("input", e=>{
  speed = Number(e.target.value)/100;
  speedValue.textContent = `${e.target.value}%`;
  if(playing){
    const pos = getPosition();
    pause();
    pauseAt = pos;
    play();
  }
});

volumeSlider.addEventListener("input", e=>{
  volume = Number(e.target.value)/100;
  volumeValue.textContent = `${e.target.value}%`;
  if(masterGain) masterGain.gain.value = volume;
});

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    if(view === "piano"){
      document.getElementById("viewOverlay").classList.add("hidden");
      return;
    }
    const copy = {
      roll:["Paper Roll View","This view focuses on the moving music roll. The generated holes are mapped to the current song pattern and scroll while the piano plays."],
      mechanism:["Mechanism View","The visible hammer rail reacts to notes in real time. Each played note lifts a small hammer and lights the corresponding piano key."],
      settings:["Settings","Use the controls on the left to change speed, volume and note highlighting. The whole project is static and works on GitHub Pages."],
      about:["About","A browser-based saloon player piano simulator inspired by old Wurlitzer roll mechanisms and western automaton aesthetics. Use your own MIDI files later if you want to extend it."]
    };
    document.getElementById("overlayTitle").textContent = copy[view][0];
    document.getElementById("overlayText").textContent = copy[view][1];
    document.getElementById("viewOverlay").classList.remove("hidden");
  });
});

document.getElementById("closeOverlay").addEventListener("click",()=>{
  document.getElementById("viewOverlay").classList.add("hidden");
  document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
  document.querySelector('[data-view="piano"]').classList.add("active");
});

document.querySelectorAll("[data-mech]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll("[data-mech]").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const mode = btn.dataset.mech;
    document.body.dataset.mech = mode;
  });
});

initKeyboard();
initSongs();
loadSong(0,false);
