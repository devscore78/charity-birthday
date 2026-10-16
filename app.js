// ============================================================
// BIRTHDAY SITE
// ============================================================

console.log('=== APP.JS STARTED ===');

// ============================================================
// PIN (global functions called directly from HTML onclick)
// ============================================================
var PIN_CODE = '1234';
var pinEntered = '';

function pinPress(key) {
  console.log('PIN press:', key);
  if (pinEntered.length >= 4) return;
  pinEntered += key;
  pinUpdateDots();

  if (pinEntered.length === 4) {
    setTimeout(function () {
      if (pinEntered === PIN_CODE) {
        console.log('PIN correct');
        pinEntered = '';
        pinUpdateDots();
        goToLoading();
      } else {
        console.log('PIN wrong');
        var dots = document.getElementById('pinDots');
        if (dots) {
          dots.classList.add('shake');
          setTimeout(function () { dots.classList.remove('shake'); }, 500);
        }
        setTimeout(function () {
          pinEntered = '';
          pinUpdateDots();
        }, 500);
      }
    }, 180);
  }
}

function pinDelete() {
  console.log('PIN delete');
  if (!pinEntered.length) return;
  pinEntered = pinEntered.slice(0, -1);
  pinUpdateDots();
}

function pinUpdateDots() {
  var dots = document.getElementById('pinDots');
  if (!dots) return;
  var els = dots.querySelectorAll('span');
  els.forEach(function (d, i) {
    if (i < pinEntered.length) d.classList.add('filled');
    else d.classList.remove('filled');
  });
}

// Make sure they're global
window.pinPress = pinPress;
window.pinDelete = pinDelete;

console.log('PIN functions ready');

// ============================================================
// SCREENS
// ============================================================
function goTo(name) {
  var all = document.querySelectorAll('.screen');
  all.forEach(function (s) { s.classList.remove('active'); });
  var target = document.getElementById('screen-' + name);
  if (target) target.classList.add('active');
}

// ============================================================
// LOADING
// ============================================================
function goToLoading() {
  console.log('Going to loading');
  goTo('loading');
  var countEl = document.getElementById('loadCount');
  var msgEl = document.getElementById('loadMessage');
  var messages = [
    { at: 1,  text: 'A special day' },
    { at: 34, text: 'Another moment' },
    { at: 67, text: 'A blessed one' },
  ];
  var totalMs = 3000;
  var start = performance.now();

  function tick(now) {
    var elapsed = now - start;
    var pct = Math.min(100, Math.floor((elapsed / totalMs) * 100));
    if (countEl) countEl.textContent = Math.max(1, pct);

    var targetMsg = messages[0];
    for (var i = 0; i < messages.length; i++) {
      if (pct >= messages[i].at) targetMsg = messages[i];
    }
    if (msgEl && msgEl.textContent !== targetMsg.text) {
      msgEl.classList.add('swap');
      (function (t) {
        setTimeout(function () {
          msgEl.textContent = t;
          msgEl.classList.remove('swap');
        }, 200);
      })(targetMsg.text);
    }

    if (elapsed < totalMs) requestAnimationFrame(tick);
    else {
      if (countEl) countEl.textContent = '100';
      setTimeout(startBalloonSequence, 700);
    }
  }
  requestAnimationFrame(tick);
}

// ============================================================
// COUNTDOWN
// ============================================================
function startBalloonSequence() {
  console.log('Going to countdown');
  goTo('balloon');
  var numEl = document.getElementById('balloonNumber');
  var subEl = document.getElementById('balloonSub');
  var seq = [5, 4, 3, 2, 1];
  var i = 0;
  if (subEl) subEl.textContent = 'PREPARING';
  var step = setInterval(function () {
    if (i >= seq.length) {
      clearInterval(step);
      goToApp();
      return;
    }
    if (numEl) {
      numEl.textContent = seq[i];
      numEl.classList.add('pop');
      setTimeout(function () { numEl.classList.remove('pop'); }, 150);
    }
    i++;
  }, 1000);
}

// ============================================================
// APP
// ============================================================
var bgAudio = document.getElementById('bgAudio');
var applauseAudio = document.getElementById('applauseAudio');
var currentPage = 'home';
var pageNames = ['home', 'music', 'message', 'gallery', 'surprise'];
var navLeftBtn = document.getElementById('navLeftBtn');
var navLeftIcon = document.getElementById('navLeftIcon');
var navIndex = document.getElementById('navIndex');

function goToApp() {
  console.log('Going to app');
  goTo('app');

  if (bgAudio) {
    bgAudio.volume = 0.6;
    bgAudio.currentTime = 0;
    var p = bgAudio.play();
    if (p) p.catch(function () {});
  }

  currentPage = 'home';
  updateNavIcon('home');
  updateNavIndex('home');
  initVinylGallery();
  refreshSurpriseState();
}

function updateNavIcon(page) {
  if (!navLeftIcon) return;
  if (page === 'home') {
    navLeftIcon.className = 'fa-solid fa-bars';
  } else {
    navLeftIcon.className = 'fa-solid fa-arrow-left';
  }
}

function updateNavIndex(page) {
  if (!navIndex) return;
  var idx = pageNames.indexOf(page) + 1;
  navIndex.textContent = (idx < 10 ? '0' + idx : idx) + ' / 05';
}

function showPage(name) {
  if (name === currentPage) return;
  var oldPage = document.querySelector('.page[data-page="' + currentPage + '"]');
  var newPage = document.querySelector('.page[data-page="' + name + '"]');
  if (!oldPage || !newPage) return;

  var goingBack = currentPage !== 'home' && name === 'home';

  newPage.classList.remove('exit-left');

  if (goingBack) {
    newPage.style.transform = 'translateX(-30%)';
    newPage.style.opacity = '0';
    newPage.classList.add('active');
    requestAnimationFrame(function () {
      newPage.style.transform = '';
      newPage.style.opacity = '';
    });
    oldPage.classList.add('exit-left');
  } else {
    newPage.style.transform = 'translateX(100%)';
    newPage.style.opacity = '0';
    newPage.classList.add('active');
    requestAnimationFrame(function () {
      newPage.style.transform = '';
      newPage.style.opacity = '';
    });
    oldPage.classList.remove('active');
  }

  setTimeout(function () {
    oldPage.classList.remove('active');
    oldPage.classList.remove('exit-left');
    oldPage.style.transform = '';
    oldPage.style.opacity = '';
  }, 550);

  currentPage = name;
  updateNavIcon(name);
  updateNavIndex(name);
}

if (navLeftBtn) {
  navLeftBtn.addEventListener('click', function () {
    if (currentPage === 'home') openDrawer();
    else showPage('home');
  });
}

var labArrowBtn = document.getElementById('labArrowBtn');
if (labArrowBtn) labArrowBtn.addEventListener('click', openDrawer);

// ============================================================
// DRAWER
// ============================================================
var drawer = document.getElementById('drawer');
var drawerOverlay = document.getElementById('drawerOverlay');
var drawerClose = document.getElementById('drawerClose');

function openDrawer() {
  if (!drawer) return;
  drawer.classList.add('open');
  if (drawerOverlay) drawerOverlay.classList.add('open');
}
function closeDrawer() {
  if (!drawer) return;
  drawer.classList.remove('open');
  if (drawerOverlay) drawerOverlay.classList.remove('open');
}

if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

document.querySelectorAll('.drawer-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    closeDrawer();
    var page = btn.dataset.page;
    setTimeout(function () {
      if (page === 'home') showPage('home');
      else {
        showPage(page);
        if (page === 'music') playApplause();
      }
    }, 300);
  });
});

// ============================================================
// MUSIC
// ============================================================
var applausePlayed = false;
function playApplause() {
  if (applausePlayed) return;
  if (!applauseAudio) return;
  applauseAudio.currentTime = 0;
  applauseAudio.volume = 0.85;
  applauseAudio.play().catch(function () {});
  applausePlayed = true;
  var eq = document.getElementById('musicEq');
  if (eq) {
    eq.classList.add('active');
    setTimeout(function () { eq.classList.remove('active'); }, 3200);
  }
}

var musicPlayBtn = document.getElementById('musicPlayBtn');
if (musicPlayBtn) {
  musicPlayBtn.addEventListener('click', function () {
    if (!bgAudio) return;
    if (bgAudio.paused) {
      bgAudio.play().catch(function () {});
      musicPlayBtn.classList.add('playing');
      var eq = document.getElementById('musicEq');
      if (eq) eq.classList.add('active');
    } else {
      bgAudio.pause();
      musicPlayBtn.classList.remove('playing');
      var eq2 = document.getElementById('musicEq');
      if (eq2) eq2.classList.remove('active');
    }
    if (!applausePlayed) playApplause();
  });
}

// ============================================================
// MESSAGE
// ============================================================
var notifBell = document.getElementById('notifBell');
if (notifBell) {
  notifBell.addEventListener('click', function () {
    var wrap = document.getElementById('letterWrap');
    if (!wrap) return;
    if (wrap.classList.contains('hidden')) {
      wrap.classList.remove('hidden');
      if (typeof MESSAGES !== 'undefined') {
        typeText(document.getElementById('mailText'), MESSAGES.mailText, 40);
      }
    } else {
      wrap.classList.add('hidden');
    }
  });
}

function typeText(el, text, speed) {
  if (!el) return;
  el.textContent = '';
  el.classList.remove('done');
  var i = 0;
  clearInterval(el._typer);
  el._typer = setInterval(function () {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) {
      clearInterval(el._typer);
      el.classList.add('done');
    }
  }, speed || 55);
}

// ============================================================
// VINYL GALLERY
// ============================================================
var GALLERY_IMAGES = [
  'assets/img1.jpeg',
  'assets/img2.jpeg',
  'assets/img3.jpeg',
  'assets/img4.jpeg',
  'assets/img5.jpeg',
  'assets/img6.jpeg'
];
var vinylIndex = 0;
var vinylTimer = null;
var polaroids = [];

function initVinylGallery() {
  var stack = document.getElementById('polaroidStack');
  if (!stack) return;
  if (polaroids.length) return;

  var els = stack.querySelectorAll('.polaroid');
  els.forEach(function (el, i) {
    var img = el.querySelector('img');
    img.src = GALLERY_IMAGES[i % GALLERY_IMAGES.length];
    polaroids.push(el);
  });
  vinylIndex = els.length;

  vinylTimer = setInterval(function () {
    if (currentPage !== 'gallery') return;
    cyclePolaroid();
  }, 1500);
}

function cyclePolaroid() {
  if (polaroids.length < 3) return;
  var target = polaroids[2];
  var img = target.querySelector('img');
  target.classList.add('out');
  setTimeout(function () {
    img.src = GALLERY_IMAGES[vinylIndex % GALLERY_IMAGES.length];
    vinylIndex++;
    target.classList.remove('out');
    target.classList.add('in');
    setTimeout(function () { target.classList.remove('in'); }, 950);
  }, 850);
}

// ============================================================
// SURPRISE
// ============================================================
function refreshSurpriseState() {
  if (typeof CONFIG === 'undefined') return;
  var solved = localStorage.getItem(CONFIG.PUZZLE_SOLVED_KEY) === '1';
  var sub = document.getElementById('surpriseSub');
  var flyerWrap = document.getElementById('flyerWrap');
  var playBtn = document.getElementById('playGameBtn');
  if (!sub || !flyerWrap || !playBtn) return;

  if (solved) {
    sub.innerHTML = '<i class="fa-solid fa-lock-open"></i> Your surprise is unlocked!';
    flyerWrap.classList.remove('hidden');
    playBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> PLAY AGAIN';
  } else {
    sub.innerHTML = '<i class="fa-solid fa-lock"></i> Complete the game to unlock your surprise';
    flyerWrap.classList.add('hidden');
    playBtn.innerHTML = '<i class="fa-solid fa-puzzle-piece"></i> PLAY GAME';
  }
}

var playGameBtn = document.getElementById('playGameBtn');
if (playGameBtn) {
  playGameBtn.addEventListener('click', function () {
    goTo('puzzle');
    startPuzzle();
  });
}

// ============================================================
// PUZZLE
// ============================================================
var puzzleSolved = false;
var swaps = 0;
var selectedPiece = null;

function startPuzzle() {
  puzzleSolved = false;
  swaps = 0;
  selectedPiece = null;
  var swapsLabel = document.getElementById('swapsLabel');
  var hint = document.getElementById('puzzleHint');
  var preview = document.getElementById('puzzlePreview');
  var grid = document.getElementById('puzzleGrid');
  if (!swapsLabel || !hint || !preview || !grid) return;

  swapsLabel.textContent = 'SWAPS: 0';
  hint.textContent = 'Memorize the image! Shuffling in 3s…';
  preview.classList.remove('hidden');
  grid.classList.add('hidden');

  var count = 3;
  var cd = setInterval(function () {
    count--;
    if (count <= 0) {
      clearInterval(cd);
      shufflePuzzle();
      preview.classList.add('hidden');
      grid.classList.remove('hidden');
      hint.textContent = 'Tap two pieces to swap them';
    } else {
      hint.textContent = 'Memorize the image! Shuffling in ' + count + 's…';
    }
  }, 1000);
}

function shufflePuzzle() {
  var grid = document.getElementById('puzzleGrid');
  if (!grid) return;
  var order = [0,1,2,3,4,5,6,7,8];
  for (var i = order.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  var sorted = true;
  for (var k = 0; k < order.length; k++) if (order[k] !== k) sorted = false;
  if (sorted) return shufflePuzzle();

  grid.innerHTML = '';
  order.forEach(function (originalIndex) {
    var row = Math.floor(originalIndex / 3);
    var col = originalIndex % 3;
    var p = document.createElement('div');
    p.className = 'piece';
    p.dataset.correct = originalIndex;
    p.style.backgroundImage = "url('assets/puzzle.jpeg')";
    p.style.backgroundPosition = (col * 50) + '% ' + (row * 50) + '%';
    p.addEventListener('click', function () { handlePieceClick(p); });
    grid.appendChild(p);
  });
}

function handlePieceClick(p) {
  if (puzzleSolved) return;
  if (!selectedPiece) { selectedPiece = p; p.classList.add('sel'); return; }
  if (selectedPiece === p) { p.classList.remove('sel'); selectedPiece = null; return; }
  swapPieces(selectedPiece, p);
  selectedPiece.classList.remove('sel');
  selectedPiece = null;
  swaps++;
  var label = document.getElementById('swapsLabel');
  if (label) label.textContent = 'SWAPS: ' + swaps;
  checkSolved();
}

function swapPieces(a, b) {
  var aBg = a.style.backgroundPosition;
  a.style.backgroundPosition = b.style.backgroundPosition;
  b.style.backgroundPosition = aBg;
  var aCorrect = a.dataset.correct;
  a.dataset.correct = b.dataset.correct;
  b.dataset.correct = aCorrect;
}

function checkSolved() {
  var grid = document.getElementById('puzzleGrid');
  if (!grid) return;
  var pieces = [].slice.call(grid.children);
  var solved = pieces.every(function (p, i) { return Number(p.dataset.correct) === i; });
  if (solved) {
    puzzleSolved = true;
    var hint = document.getElementById('puzzleHint');
    if (hint) hint.textContent = 'Perfect';
    if (typeof CONFIG !== 'undefined') {
      localStorage.setItem(CONFIG.PUZZLE_SOLVED_KEY, '1');
    }
    burstConfetti();
    playHurray();
    setTimeout(function () {
      goToApp();
      refreshSurpriseState();
      setTimeout(function () { showPage('surprise'); }, 400);
    }, 2200);
  }
}

function burstConfetti() {
  var icons = ['fa-solid fa-star', 'fa-solid fa-certificate', 'fa-solid fa-heart', 'fa-solid fa-bolt'];
  for (var i = 0; i < 50; i++) {
    var c = document.createElement('span');
    c.innerHTML = '<i class="' + icons[Math.floor(Math.random() * icons.length)] + '"></i>';
    c.style.cssText = 'position:fixed;font-size:22px;pointer-events:none;z-index:9999;transition:transform 1.2s ease,opacity 1.2s ease;color:' + (['#e94b2c','#0a0a0a'][Math.floor(Math.random() * 2)]) + ';';
    c.style.left = (50 + (Math.random() * 60 - 30)) + 'vw';
    c.style.top = (50 + (Math.random() * 40 - 20)) + 'vh';
    document.body.appendChild(c);
    (function (el) {
      requestAnimationFrame(function () {
        el.style.transform = 'translate(' + (Math.random() * 360 - 180) + 'px, ' + (Math.random() * -360) + 'px) rotate(' + (Math.random() * 360) + 'deg)';
        el.style.opacity = '0';
      });
      setTimeout(function () { el.remove(); }, 1400);
    })(c);
  }
}

function playHurray() {
  var overlay = document.createElement('div');
  overlay.className = 'hurray-overlay';
  overlay.innerHTML = '<span class="hurray-text">HURRAY</span>';
  document.body.appendChild(overlay);
  setTimeout(function () { overlay.remove(); }, 1700);
}

// ============================================================
// SHARE
// ============================================================
var shareBtn = document.getElementById('shareBtn');
if (shareBtn) {
  shareBtn.addEventListener('click', async function () {
    try {
      var res = await fetch('assets/hero-bg.jpg');
      var blob = await res.blob();
      var file = new File([blob], 'surprise.jpg', { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Happy Birthday!' });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'Happy Birthday!', url: window.location.href });
        return;
      }
      alert('Sharing not supported.');
    } catch (e) {}
  });
}

console.log('=== APP.JS FULLY LOADED ===');