/*
  Abhradeep Biswas Memorial Archive - 90s Web Desktop Script
  Real-time synth sound effects, draggable windows, guestbook CRUD, canvas memes, live breathing counter.
*/

// --- SOUND EFFECTS ENGINE (Web Audio API) ---
let audioCtx = null;
let soundMuted = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSynthTone(freq, duration, type = 'square', volume = 0.1) {
  if (soundMuted || !audioCtx) return;
  
  try {
    // Resume context if suspended (browser security)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    // Linear decay to avoid clicks
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

// Retro Sound Presets
function playClickSound() {
  // High-pitched short blip
  playSynthTone(1200, 0.05, 'sine', 0.08);
}

function playDoubleClickSound() {
  playSynthTone(1200, 0.04, 'sine', 0.08);
  setTimeout(() => playSynthTone(1600, 0.04, 'sine', 0.08), 50);
}

function playStartupSound() {
  // Classic arpeggio boot chord
  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playSynthTone(freq, 0.6, 'triangle', 0.12);
    }, idx * 120);
  });
}

function playAlertSound() {
  // Retro error buzz
  playSynthTone(150, 0.15, 'sawtooth', 0.15);
  setTimeout(() => playSynthTone(120, 0.15, 'sawtooth', 0.15), 100);
}

function playMinimizeSound() {
  // Downward frequency slide
  if (soundMuted || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch(e) {}
}

function playMaximizeSound() {
  // Upward frequency slide
  if (soundMuted || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch(e) {}
}

function playTrashSound() {
  // Crumpling/deleting noise (combining frequencies)
  playSynthTone(100, 0.2, 'sawtooth', 0.1);
  setTimeout(() => playSynthTone(80, 0.15, 'sawtooth', 0.1), 100);
  setTimeout(() => playSynthTone(60, 0.1, 'sawtooth', 0.1), 200);
}


// --- WINDOW DRAG AND DROP ENGINE ---
let activeWindow = null;
let highestZ = 100;

function focusWindow(win) {
  if (!win) return;
  highestZ += 2;
  win.style.zIndex = highestZ;
  
  // Update focus visual classes
  document.querySelectorAll('.retro-window').forEach(w => w.classList.remove('window-active'));
  win.classList.remove('window-minimized');
  win.classList.remove('window-closed');
  win.classList.add('window-active');
  
  // Highlight matching taskbar button
  document.querySelectorAll('.taskbar-win-btn').forEach(btn => {
    if (btn.getAttribute('data-window') === win.id) {
      btn.classList.add('btn-active');
    } else {
      btn.classList.remove('btn-active');
    }
  });
}

function makeWindowDraggable(win) {
  const titlebar = win.querySelector('.window-titlebar');
  if (!titlebar) return;
  
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  titlebar.onmousedown = dragMouseDown;
  titlebar.ontouchstart = dragTouchStart;

  function dragMouseDown(e) {
    e.preventDefault();
    focusWindow(win);
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    playClickSound();
  }

  function dragTouchStart(e) {
    focusWindow(win);
    pos3 = e.touches[0].clientX;
    pos4 = e.touches[0].clientY;
    document.ontouchend = closeDragElement;
    document.ontouchmove = elementTouchDrag;
    playClickSound();
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Bounds clamping
    let newTop = win.offsetTop - pos2;
    let newLeft = win.offsetLeft - pos1;
    
    // Contain window titlebar on screen
    if (newTop < 26) newTop = 26; // Ticker height offset
    if (newTop > window.innerHeight - 60) newTop = window.innerHeight - 60;
    
    win.style.top = newTop + "px";
    win.style.left = newLeft + "px";
  }

  function elementTouchDrag(e) {
    pos1 = pos3 - e.touches[0].clientX;
    pos2 = pos4 - e.touches[0].clientY;
    pos3 = e.touches[0].clientX;
    pos4 = e.touches[0].clientY;
    
    let newTop = win.offsetTop - pos2;
    let newLeft = win.offsetLeft - pos1;
    
    if (newTop < 26) newTop = 26;
    if (newTop > window.innerHeight - 60) newTop = window.innerHeight - 60;
    
    win.style.top = newTop + "px";
    win.style.left = newLeft + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    document.ontouchend = null;
    document.ontouchmove = null;
  }
}

// Initialize dragging on all windows
document.querySelectorAll('.retro-window').forEach(win => {
  makeWindowDraggable(win);
  
  // Set click behavior to focus window
  win.addEventListener('click', () => {
    focusWindow(win);
  });
});


// --- WINDOW STATE ACTIONS ---
function openWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;
  
  if (win.classList.contains('window-closed') || win.classList.contains('window-minimized')) {
    win.classList.remove('window-closed');
    win.classList.remove('window-minimized');
    playMaximizeSound();
  }
  focusWindow(win);
  renderTaskbarButtons();
}

function minimizeWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;
  win.classList.add('window-minimized');
  playMinimizeSound();
  
  // Remove focus and active taskbar classes
  win.classList.remove('window-active');
  const activeBtn = document.querySelector(`.taskbar-win-btn[data-window="${winId}"]`);
  if (activeBtn) activeBtn.classList.remove('btn-active');
}

function closeWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;
  win.classList.add('window-closed');
  playMinimizeSound();
  renderTaskbarButtons();
}

// Bind Control Buttons
document.querySelectorAll('.btn-close').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const winId = btn.getAttribute('data-window');
    closeWindow(winId);
  });
});

document.querySelectorAll('.btn-minimize').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const winId = btn.getAttribute('data-window');
    minimizeWindow(winId);
  });
});

// Double click icon setup
document.querySelectorAll('.desktop-icon').forEach(icon => {
  icon.addEventListener('dblclick', () => {
    const winId = icon.getAttribute('data-window');
    openWindow(winId);
    playDoubleClickSound();
  });
  
  // Single click for mobile touch compatibility
  icon.addEventListener('click', () => {
    playClickSound();
  });
});


// --- TASKBAR SYSTEM ---
function renderTaskbarButtons() {
  const taskbarList = document.getElementById('taskbar-open-windows');
  taskbarList.innerHTML = '';
  
  const windows = [
    { id: 'win-about', name: 'My Computer', icon: 'my-computer-icon-sm' },
    { id: 'win-timeline', name: 'Timeline.txt', icon: 'document-icon-sm' },
    { id: 'win-memes', name: 'Meme_Vault.exe', icon: 'image-icon-sm' },
    { id: 'win-guestbook', name: 'Guestbook.db', icon: 'guestbook-icon-sm' },
    { id: 'win-settings', name: 'Config.sys', icon: 'settings-icon-sm' },
    { id: 'win-recycle', name: 'Recycle Bin', icon: 'recycle-icon-sm' }
  ];
  
  windows.forEach(w => {
    const winEl = document.getElementById(w.id);
    if (!winEl || winEl.classList.contains('window-closed')) return;
    
    const btn = document.createElement('button');
    btn.className = 'taskbar-win-btn';
    btn.setAttribute('data-window', w.id);
    
    // Check if currently focused
    if (winEl.classList.contains('window-active') && !winEl.classList.contains('window-minimized')) {
      btn.classList.add('btn-active');
    }
    
    btn.innerHTML = `<div class="title-icon ${w.icon}"></div><span>${w.name}</span>`;
    
    btn.addEventListener('click', () => {
      playClickSound();
      if (winEl.classList.contains('window-active') && !winEl.classList.contains('window-minimized')) {
        // Toggle minimize if already active
        minimizeWindow(w.id);
      } else {
        // Restore/Focus window
        openWindow(w.id);
      }
    });
    
    taskbarList.appendChild(btn);
  });
}


// --- START MENU LOGIC ---
const startBtn = document.getElementById('start-button');
const startMenu = document.getElementById('start-menu');

startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  playClickSound();
  startMenu.classList.toggle('start-menu-closed');
});

// Close start menu when clicking outside
document.addEventListener('click', (e) => {
  if (!startMenu.classList.contains('start-menu-closed')) {
    if (!startMenu.contains(e.target) && e.target !== startBtn) {
      startMenu.classList.add('start-menu-closed');
    }
  }
});

// Start menu program clicks
document.querySelectorAll('.start-menu-item').forEach(item => {
  item.addEventListener('click', () => {
    startMenu.classList.add('start-menu-closed');
    const winId = item.getAttribute('data-window');
    if (winId) {
      openWindow(winId);
      playDoubleClickSound();
    }
  });
});

// Shutdown Option
document.getElementById('start-shutdown').addEventListener('click', () => {
  playAlertSound();
  showSystemAlert("Error: You cannot shut down Abhradeep Biswas. He is currently alive and actively compiling errors. Please shut down your browser instead.");
});


// --- RETRO SYSTEM ALERTS ---
const alertModal = document.getElementById('retro-alert');
const alertMsgText = document.getElementById('alert-message-text');
const alertOkBtn = document.getElementById('btn-alert-ok');

function showSystemAlert(msg) {
  alertMsgText.innerText = msg;
  alertModal.classList.remove('alert-closed');
  playAlertSound();
}

alertOkBtn.addEventListener('click', () => {
  alertModal.classList.add('alert-closed');
  playClickSound();
});


// --- BIOS & BOOTLOADER TIMER ---
const biosScreen = document.getElementById('bios-screen');
const desktopEnv = document.getElementById('desktop-environment');
const bootProgress = document.getElementById('boot-progress-bar');
const bootBtn = document.getElementById('boot-btn');
const biosClickTrigger = document.querySelector('.bios-text');

let bootStarted = false;

function triggerBootSequence() {
  if (bootStarted) return;
  bootStarted = true;
  
  // Init audio on user gesture
  initAudio();
  playClickSound();
  
  bootBtn.style.display = 'none';
  document.querySelector('.bios-text p.blink').style.display = 'none';
  document.querySelector('.boot-bar-container').style.display = 'block';
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 8) + 2;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      
      // Play retro startup chord and load desktop
      setTimeout(() => {
        playStartupSound();
        biosScreen.style.display = 'none';
        desktopEnv.className = 'desktop-visible';
        renderTaskbarButtons();
        
        // Auto open Timeline as welcome screen!
        setTimeout(() => {
          openWindow('win-timeline');
        }, 800);
      }, 500);
    }
    bootProgress.style.width = progress + '%';
  }, 80);
}

bootBtn.addEventListener('click', triggerBootSequence);
biosClickTrigger.addEventListener('click', triggerBootSequence);
document.addEventListener('keydown', (e) => {
  if (biosScreen.style.display !== 'none') {
    triggerBootSequence();
  }
});


// --- SYSTEM SETTINGS (CONFIG PANEL) ---
const chkCRTglow = document.getElementById('chk-crt-glow');
const chkCRTscanlines = document.getElementById('chk-crt-scanlines');
const chkCRTcurvature = document.getElementById('chk-crt-curvature');
const btnApplySettings = document.getElementById('btn-apply-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');

function applyVisualSettings() {
  playClickSound();
  
  // CRT Effects classes on body
  if (chkCRTglow.checked) {
    document.body.classList.add('crt-glow');
  } else {
    document.body.classList.remove('crt-glow');
  }

  if (chkCRTscanlines.checked) {
    document.body.classList.add('crt-scanlines');
  } else {
    document.body.classList.remove('crt-scanlines');
  }

  if (chkCRTcurvature.checked) {
    document.body.classList.add('crt-curved');
  } else {
    document.body.classList.remove('crt-curved');
  }

  // Theme color schemes
  const selectedTheme = document.querySelector('input[name="color-scheme"]:checked').value;
  document.body.classList.remove('theme-amber', 'theme-matrix');
  if (selectedTheme === 'amber') {
    document.body.classList.add('theme-amber');
  } else if (selectedTheme === 'matrix') {
    document.body.classList.add('theme-matrix');
  }
}

btnApplySettings.addEventListener('click', applyVisualSettings);
btnCloseSettings.addEventListener('click', () => {
  applyVisualSettings();
  closeWindow('win-settings');
});

// Sound Volume Tray Toggle
const soundToggleBtn = document.getElementById('tray-sound-toggle');
const soundIcon = document.getElementById('sound-icon');

soundToggleBtn.addEventListener('click', () => {
  soundMuted = !soundMuted;
  if (soundMuted) {
    soundIcon.className = 'sound-icon-sprite sound-off';
  } else {
    soundIcon.className = 'sound-icon-sprite sound-on';
    initAudio();
    playClickSound();
  }
});


// --- LIVE STATS WORKERS ---
// Clock Tray updater
function updateTrayClock() {
  const clock = document.getElementById('tray-clock');
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  minutes = minutes < 10 ? '0' + minutes : minutes;
  clock.innerText = `${hours}:${minutes} ${ampm}`;
}
setInterval(updateTrayClock, 1000);
updateTrayClock();

// Live Age/Breathing Second Counter since birth (Oct 24, 2006)
const birthDate = new Date('2006-10-24T08:00:00');
function updateAgeTimer() {
  const counter = document.getElementById('live-breathing-timer');
  const now = new Date();
  const secondsElapsed = Math.floor((now.getTime() - birthDate.getTime()) / 1000);
  counter.innerText = String(secondsElapsed).padStart(10, '0');
}
setInterval(updateAgeTimer, 1000);
updateAgeTimer();


// --- RECYCLE BIN FILE INTERACTIONS ---
const recycleFiles = document.querySelectorAll('.recycle-file');
const recycleStatus = document.getElementById('recycle-status-text');
const recycleBinSprite = document.getElementById('recycle-bin-sprite');
const btnEmptyBin = document.getElementById('btn-empty-bin');

let deletedFiles = {
  hopes: false,
  java: false,
  sanity: false,
  social: false
};

recycleFiles.forEach(file => {
  file.addEventListener('click', (e) => {
    e.stopPropagation();
    playClickSound();
    recycleFiles.forEach(f => f.classList.remove('file-clicked'));
    file.classList.add('file-clicked');
  });

  file.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    playDoubleClickSound();
    const type = file.getAttribute('data-file');
    
    let warningMsg = "";
    if (type === 'hopes') {
      warningMsg = "ACCESS DENIED: 'Hopes_&_Dreams.zip' has been heavily compressed since 2018. Trying to decompress this file requires an active will to live, which was not found in Abhradeep's system parameters.";
    } else if (type === 'java') {
      warningMsg = "WARNING: 'Spaghetti_Java_Code.class' contains 4,500 lines of nested loops, zero documentation, and a massive memory leak. Opening this may crash your browser. Proceed to trash it instead.";
    } else if (type === 'sanity') {
      warningMsg = "FILE CORRUPTED: 'Sanity_Backup_2019.dat' was compromised during college semester 1. Decompression error: CRC mismatch. Sane resources depleted.";
    } else if (type === 'social') {
      warningMsg = "DLL ERROR: 'Social_Skills.dll' could not be loaded because the host was too busy debugging JavaScript. Reinstalling Abhradeep in a social environment is recommended.";
    }
    showSystemAlert(warningMsg);
  });
});

// Deselect click anywhere else in recycle box
document.querySelector('#win-recycle .window-body').addEventListener('click', () => {
  recycleFiles.forEach(f => f.classList.remove('file-clicked'));
});

// Empty Bin Action
btnEmptyBin.addEventListener('click', () => {
  if (Object.values(deletedFiles).every(v => v === true)) {
    showSystemAlert("The Recycle Bin is already empty! Stop erasing his non-existent files.");
    return;
  }
  
  playTrashSound();
  document.querySelectorAll('.recycle-file').forEach(file => {
    file.style.display = 'none';
    const type = file.getAttribute('data-file');
    deletedFiles[type] = true;
  });
  
  recycleStatus.innerText = "0 object(s) in bin";
  // Change desktop icons sprite to empty recycle bin
  recycleBinSprite.className = 'icon-sprite recycle-icon'; // Removes full class
  
  showSystemAlert("Success: Abhradeep's files (including his sanity) have been permanently erased into digital oblivion. He is still breathing, however.");
});


// --- DYNAMIC RETRO MEME GENERATOR (Canvas Pixel Art) ---
const memeCanvasBox = document.getElementById('current-meme-image');
const btnPrevMeme = document.getElementById('btn-prev-meme');
const btnNextMeme = document.getElementById('btn-next-meme');
const memeIndexText = document.getElementById('meme-index');
const memeCaption = document.getElementById('meme-caption');

let currentMemeIdx = 0;

const memesDatabase = [
  {
    caption: "Abhradeep was blaming the compiler for a missing semicolon.",
    render: (ctx) => {
      // Draw Compiler flowchart
      ctx.fillStyle = '#000000';
      ctx.strokeRect(10, 10, 300, 160);
      
      // Node 1: Code writes
      ctx.fillRect(40, 20, 90, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText("Write Code", 55, 38);
      
      // Arrow
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(85, 50); ctx.lineTo(85, 70); ctx.stroke();
      
      // Node 2: Compiles?
      ctx.strokeRect(40, 70, 90, 30);
      ctx.fillText("Compiles?", 55, 88);
      
      // Arrow Right (No)
      ctx.beginPath();
      ctx.moveTo(130, 85); ctx.lineTo(190, 85); ctx.stroke();
      ctx.fillText("No", 150, 78);
      
      // Node 3: Blame compiler
      ctx.fillRect(190, 70, 110, 30);
      ctx.fillStyle = '#fff';
      ctx.fillText("Blame Compiler", 200, 88);
      
      // Loop Arrow back to Write Code
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(245, 70); ctx.lineTo(245, 35); ctx.lineTo(130, 35); ctx.stroke();
      
      // Arrow Down (Yes)
      ctx.beginPath();
      ctx.moveTo(85, 100); ctx.lineTo(85, 120); ctx.stroke();
      ctx.fillText("Yes", 90, 113);
      
      // Node 4: NullPointer
      ctx.strokeRect(20, 120, 130, 30);
      ctx.fillText("NullPointerException", 25, 138);
      
      // Arrow from Node 4 to Blame compiler
      ctx.beginPath();
      ctx.moveTo(150, 135); ctx.lineTo(245, 135); ctx.lineTo(245, 100); ctx.stroke();
    }
  },
  {
    caption: "Abhradeep was searching for sanity.",
    render: (ctx) => {
      // Browser History Mock
      ctx.fillStyle = '#000000';
      ctx.font = '11px monospace';
      ctx.fillText("Netscape History Tracker", 15, 20);
      ctx.strokeRect(10, 30, 300, 120);
      
      ctx.fillText("14:32 - how to center a div classic HTML", 20, 50);
      ctx.fillText("14:35 - why is javascript like this", 20, 70);
      ctx.fillText("15:01 - what is past continuous tense", 20, 90);
      ctx.fillText("15:10 - symptoms of drinking 5 cups of tea", 20, 110);
      ctx.fillText("15:15 - git push --force safety checks", 20, 130);
    }
  },
  {
    caption: "Coffee Consumption vs. Code Sanity correlation.",
    render: (ctx) => {
      // Chart
      ctx.fillStyle = '#000000';
      // Axes
      ctx.beginPath();
      ctx.moveTo(40, 20); ctx.lineTo(40, 140); ctx.lineTo(280, 140); ctx.stroke();
      
      ctx.font = '9px monospace';
      ctx.fillText("Sanity", 10, 18);
      ctx.fillText("Coffee (cups)", 200, 155);
      
      // Curve: Downward dithered zig-zag
      ctx.beginPath();
      ctx.moveTo(40, 30);
      ctx.lineTo(80, 45);
      ctx.lineTo(120, 80);
      ctx.lineTo(160, 110);
      ctx.lineTo(200, 135);
      ctx.lineTo(260, 138);
      ctx.stroke();
      
      // Annotations
      ctx.fillText("Start (Excited)", 50, 25);
      ctx.fillText("Semicolon bug!", 120, 70);
      ctx.fillText("Existential Dread", 180, 120);
    }
  },
  {
    caption: "Abhradeep was attending virtual lectures in 2021.",
    render: (ctx) => {
      // Draw screen mock zoom call
      ctx.fillStyle = '#000000';
      ctx.strokeRect(20, 20, 280, 120);
      
      // Speaker Box Active
      ctx.strokeRect(30, 30, 70, 50);
      ctx.font = '10px monospace';
      ctx.fillText("Professor", 40, 95);
      // Professor stick figure talking
      ctx.beginPath();
      ctx.arc(65, 45, 8, 0, Math.PI * 2);
      ctx.moveTo(65, 53); ctx.lineTo(65, 70);
      ctx.stroke();
      
      // Abhradeep Box (Cam off)
      ctx.fillRect(120, 30, 70, 50);
      ctx.fillStyle = '#ffffff';
      ctx.fillText("Abhradeep (Muted)", 125, 95);
      ctx.font = '9px monospace';
      ctx.fillText(" [CAMERA OFF] ", 122, 58);
      
      // Student 3 Box
      ctx.fillStyle = '#000';
      ctx.strokeRect(210, 30, 70, 50);
      ctx.fillText("Zzz...", 230, 58);
      ctx.fillText("Another Dev", 215, 95);
      
      ctx.fillText("Meeting Time: 1 hour 45 mins over schedule", 20, 155);
    }
  },
  {
    caption: "The CPU structure of Abhradeep Biswas.",
    render: (ctx) => {
      // Draw block architecture of his brain
      ctx.fillStyle = '#000000';
      ctx.strokeRect(30, 20, 260, 120);
      
      // Sub-units
      ctx.strokeRect(40, 35, 70, 40);
      ctx.font = '9px monospace';
      ctx.fillText("Sarcasm Reg.", 45, 58);
      
      ctx.strokeRect(120, 35, 80, 40);
      ctx.fillText("Spaghetti Code", 124, 50);
      ctx.fillText("Compiler (Null)", 124, 65);
      
      ctx.strokeRect(210, 35, 70, 40);
      ctx.fillText("Panic Module", 213, 58);
      
      // Core bus
      ctx.fillRect(40, 90, 240, 10);
      ctx.fillText("SHARED TEA BUS LINE", 100, 115);
      
      // Connections
      ctx.beginPath();
      ctx.moveTo(75, 75); ctx.lineTo(75, 90);
      ctx.moveTo(160, 75); ctx.lineTo(160, 90);
      ctx.moveTo(245, 75); ctx.lineTo(245, 90);
      ctx.stroke();
    }
  }
];

function drawCurrentMeme() {
  // Create a canvas dynamically to render the dithered graphic
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  
  // Clear canvas (White bg)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw Meme logic
  const meme = memesDatabase[currentMemeIdx];
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  meme.render(ctx);
  
  // Apply dithering noise filter for retro authenticity
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    const gray = 0.299*r + 0.587*g + 0.114*b;
    
    // Add tiny randomized noise to simulate 90s monochrome GIF export
    const noise = (Math.random() - 0.5) * 15;
    const binary = (gray + noise) > 128 ? 255 : 0;
    
    data[i] = binary;
    data[i+1] = binary;
    data[i+2] = binary;
  }
  ctx.putImageData(imgData, 0, 0);
  
  // Render canvas to placeholder
  memeCanvasBox.innerHTML = '';
  memeCanvasBox.appendChild(canvas);
  
  // Update controls
  memeIndexText.innerText = `${currentMemeIdx + 1} / ${memesDatabase.length}`;
  memeCaption.innerText = meme.caption;
}

btnPrevMeme.addEventListener('click', () => {
  playClickSound();
  currentMemeIdx--;
  if (currentMemeIdx < 0) currentMemeIdx = memesDatabase.length - 1;
  drawCurrentMeme();
});

btnNextMeme.addEventListener('click', () => {
  playClickSound();
  currentMemeIdx++;
  if (currentMemeIdx >= memesDatabase.length) currentMemeIdx = 0;
  drawCurrentMeme();
});

// Init first meme rendering
drawCurrentMeme();


// --- GUESTBOOK SYSTEM STORE ---
const guestbookForm = document.getElementById('guestbook-form');
const gbNameInput = document.getElementById('gb-name');
const gbMsgInput = document.getElementById('gb-msg');
const gbEntriesList = document.getElementById('guestbook-entries');
const gbCountText = document.getElementById('gb-entry-count');

// Preloaded mock records
const mockEntries = [
  {
    name: "WebMaster_98",
    msg: "I was looking at Abhradeep's code. He was declaring variables as integer but writing string coordinates. Sarcasm compilers stood up and cheered.",
    time: "2026-07-06 14:15"
  },
  {
    name: "SipTeaCodeSlow",
    msg: "He was sitting in the cafeteria. He was insisting that Java is faster than C++, and then his program was compiling for 10 minutes straight.",
    time: "2026-07-05 09:40"
  },
  {
    name: "NullPointerSurvivor",
    msg: "I remember when Abhradeep was debugging. He was screaming at his computer monitor, only to discover he was editing the wrong file the whole afternoon.",
    time: "2026-07-03 23:11"
  }
];

function loadGuestbook() {
  let entries = JSON.parse(localStorage.getItem('abhradeep_gb_entries'));
  if (!entries) {
    entries = mockEntries;
    localStorage.setItem('abhradeep_gb_entries', JSON.stringify(entries));
  }
  
  gbEntriesList.innerHTML = '';
  entries.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'guestbook-entry';
    div.innerHTML = `
      <div class="entry-meta">
        <span>From: ${escapeHTML(entry.name)}</span>
        <span>${escapeHTML(entry.time)}</span>
      </div>
      <div class="entry-text">"${escapeHTML(entry.msg)}"</div>
    `;
    gbEntriesList.appendChild(div);
  });
  
  gbCountText.innerText = `${entries.length} entries recorded`;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

guestbookForm.addEventListener('submit', (e) => {
  e.preventDefault();
  playClickSound();
  
  const name = gbNameInput.value.trim();
  const msg = gbMsgInput.value.trim();
  
  if (!name || !msg) return;
  
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  
  const newEntry = { name, msg, time: timestamp };
  
  const entries = JSON.parse(localStorage.getItem('abhradeep_gb_entries')) || [];
  entries.unshift(newEntry); // Add to top
  localStorage.setItem('abhradeep_gb_entries', JSON.stringify(entries));
  
  gbNameInput.value = '';
  gbMsgInput.value = '';
  
  loadGuestbook();
  playDoubleClickSound();
  showSystemAlert("Success: Your sarcastic comment was stored in the ledger. Abhradeep is still breathing, but his ego was slightly bruised.");
});

// Load the ledger initially
loadGuestbook();
