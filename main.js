/* ==========================================================
   Birthday. - main.js
   Flow: PIN -> Loading -> Countdown -> Home (5 pages) -> Puzzle
   Sections: storage, screens, audio, preloading, then one
   block per screen.
   ========================================================== */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function ic(n) { return '<svg class="ic"><use href="#i-' + n + '"/></svg>'; }

  /* ------------------------------------------------------------
     Storage (safe if the browser blocks it). Fresh start each visit,
     same as the old login page which cleared everything.
  ------------------------------------------------------------ */
  var PUZZLE_KEY = 'tp_puzzle_solved';
  var solvedMem = false;
  function store(op, k, v) {
    try {
      if (op === 'get') return localStorage.getItem(k);
      if (op === 'set') localStorage.setItem(k, v);
      else localStorage.removeItem(k);
    } catch (e) {}
    return null;
  }
  store('del', PUZZLE_KEY);
  function isSolved() { return solvedMem || store('get', PUZZLE_KEY) === '1'; }

  /* ------------------------------------------------------------
     Screens
  ------------------------------------------------------------ */
  var screens = document.querySelectorAll('.screen');
  function show(name) {
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.toggle('active', screens[i].id === 's-' + name);
    }
  }

  /* ------------------------------------------------------------
     Audio. One element each, for the whole visit, so nothing restarts.
     APPLAUSE_START: 'countdown' (as before) or 'pin' (starts right
     after the correct code).
  ------------------------------------------------------------ */
  var APPLAUSE_START = 'countdown';
  var applause = $('applause');
  var song = $('bgAudio');
  var songPlaying = false;

  function startApplause() {
    if (!applause.paused || songPlaying) return;
    applause.loop = true;
    applause.volume = 0.7;
    var p = applause.play();
    if (p && p.catch) {
      p.catch(function () {
        // blocked by the browser: try again on the first tap
        document.addEventListener('pointerdown', function () {
          if (!songPlaying && applause.paused) applause.play().catch(function () {});
        }, { once: true });
      });
    }
  }

  /* ------------------------------------------------------------
     Background preloading. Starts the moment the page opens and keeps
     going while she types the code, through loading and the countdown.
     Order = what she needs first. Nothing ever blocks the screens.
  ------------------------------------------------------------ */
  function ensure(root) {
    var l = root.querySelectorAll('img[data-src]');
    for (var i = 0; i < l.length; i++) {
      if (!l[i].getAttribute('src')) l[i].src = l[i].getAttribute('data-src');
    }
  }

  function task(fn) {
    return function (next) {
      var fin = false;
      var t = setTimeout(done, 25000);   // never let one slow file block the queue
      function done() { if (fin) return; fin = true; clearTimeout(t); next(); }
      try { fn(done); } catch (e) { done(); }
    };
  }
  function bgTask(url) {
    return task(function (done) {
      var im = new Image();
      im.onload = im.onerror = done;
      im.src = url;
    });
  }
  function imgTask(url) {
    return task(function (done) {
      var els = document.querySelectorAll('img[data-src="' + url + '"]');
      if (!els.length) { done(); return; }
      var first = els[0];
      first.onload = first.onerror = function () {
        for (var i = 1; i < els.length; i++) els[i].src = url;
        done();
      };
      first.src = url;
    });
  }
  function audioTask(el, url) {
    return task(function (done) {
      if (typeof fetch !== 'function') { done(); return; }
      fetch(url).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.blob();
      }).then(function (b) {
        // keep the file in memory; only swap if it has not started playing yet
        if (el.paused && !el.currentTime) {
          el.src = URL.createObjectURL(b);
          el.preload = 'auto';
        }
        done();
      }).catch(function () { done(); });
    });
  }
  function runQueue(list, lanes) {
    var i = 0;
    function next() { if (i < list.length) list[i++](next); }
    for (var c = 0; c < lanes; c++) next();
  }

  setTimeout(function () {
    runQueue([
      bgTask('assets/login.jpg'),          // PIN background
      imgTask('assets/cutie.png'),         // first thing on the home screen
      audioTask(applause, 'assets/applause.mp3'),
      imgTask('assets/hero-bg.jpg'),       // surprise picture
      imgTask('assets/puzzle.jpeg'),       // game picture
      imgTask('assets/img1.jpeg'),
      imgTask('assets/img2.jpeg'),
      imgTask('assets/img3.jpeg'),
      imgTask('assets/img4.jpeg'),
      imgTask('assets/img5.jpg'),
      imgTask('assets/img6.jpg'),
      audioTask(song, 'assets/song.mp3')   // only needed when she taps play
    ], 2);
  }, 50);

  /* ------------------------------------------------------------
     1. PIN
  ------------------------------------------------------------ */
  var CODE = '1234';
  var typed = '';
  var pinBusy = false;
  var dotsEl = $('dots');
  var pinMsg = $('pinMsg');

  function renderDots() {
    var d = dotsEl.querySelectorAll('span');
    for (var i = 0; i < d.length; i++) d[i].classList.toggle('filled', i < typed.length);
  }
  function pinPress(k) {
    if (pinBusy || typed.length >= 4) return;
    typed += k;
    renderDots();
    if (typed.length === 4) {
      pinBusy = true;
      setTimeout(checkPin, 180);
    }
  }
  function pinDel() {
    if (pinBusy) return;
    typed = typed.slice(0, -1);
    renderDots();
  }
  function checkPin() {
    if (typed === CODE) {
      pinMsg.textContent = 'CORRECT';
      pinMsg.className = 'msg ok';
      if (APPLAUSE_START === 'pin') startApplause();
      setTimeout(runLoading, 600);
    } else {
      pinMsg.textContent = 'WRONG';
      pinMsg.className = 'msg err';
      dotsEl.classList.add('shake');
      setTimeout(function () {
        dotsEl.classList.remove('shake');
        typed = '';
        renderDots();
        pinMsg.textContent = '';
        pinMsg.className = 'msg';
        pinBusy = false;
      }, 500);
    }
  }
  $('pad').addEventListener('click', function (e) {
    var b = e.target.closest('.btn');
    if (!b) return;
    if (b.getAttribute('data-k')) pinPress(b.getAttribute('data-k'));
    else if (b.getAttribute('data-act') === 'del') pinDel();
  });

  /* ------------------------------------------------------------
     2. LOADING  (counts 1 → 365 days, about 3 seconds)
  ------------------------------------------------------------ */
  function runLoading() {
    show('load');
    var countEl = $('count');
    var msgEl = $('loadMsg');
    var msgs = [
      { at: 1,   text: 'A special day' },
      { at: 122, text: 'Another moment' },
      { at: 245, text: 'A blessed one' }
    ];
    var total = 3000;
    var shown = 0;
    var start = performance.now();
    countEl.textContent = '1';
    msgEl.textContent = msgs[0].text;

    function tick(now) {
      var elapsed = Math.max(0, now - start);
      var val = Math.max(1, Math.min(365, Math.floor(elapsed / total * 365)));
      countEl.textContent = val;

      var idx = 0;
      for (var i = 0; i < msgs.length; i++) if (val >= msgs[i].at) idx = i;
      if (idx !== shown) {
        shown = idx;
        msgEl.classList.add('swap');
        setTimeout(function () {
          msgEl.textContent = msgs[idx].text;
          msgEl.classList.remove('swap');
        }, 200);
      }

      if (elapsed < total) requestAnimationFrame(tick);
      else {
        countEl.textContent = '365';
        setTimeout(runCountdown, 700);
      }
    }
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------
     3. COUNTDOWN  (5 → 1, one second each)
  ------------------------------------------------------------ */
  function runCountdown() {
    show('count');
    if (APPLAUSE_START === 'countdown') startApplause();
    var numEl = $('cdNum');
    var n = 5;
    function put(v) {
      numEl.textContent = v;
      numEl.classList.add('pop');
      setTimeout(function () { numEl.classList.remove('pop'); }, 150);
    }
    put(n);
    var iv = setInterval(function () {
      n--;
      if (n < 1) { clearInterval(iv); enterHome(); return; }
      put(n);
    }, 1000);
  }

  /* ------------------------------------------------------------
     4. HOME
  ------------------------------------------------------------ */
  var home = $('s-home');
  var currentPage = 'home';
  var names = ['home', 'music', 'message', 'gallery', 'surprise'];
  var navLeft = $('navLeft');
  var navIcon = $('navIcon');
  var navIdx = $('navIdx');
  var drawer = $('drawer');
  var dov = $('dov');

  function pageEl(name) { return home.querySelector('.page[data-page="' + name + '"]'); }

  function openDrawer() { drawer.classList.add('open'); dov.classList.add('open'); }
  function closeDrawer() { drawer.classList.remove('open'); dov.classList.remove('open'); }

  function setNav(name) {
    navIcon.setAttribute('href', name === 'home' ? '#i-bars' : '#i-arrow-left');
    var idx = names.indexOf(name) + 1;
    navIdx.textContent = (idx < 10 ? '0' + idx : idx) + ' / 05';
  }

  function resetHome() {
    var ps = home.querySelectorAll('.page');
    for (var i = 0; i < ps.length; i++) {
      ps[i].classList.remove('active');
      ps[i].classList.remove('exit-left');
      ps[i].style.transform = '';
      ps[i].style.opacity = '';
    }
    pageEl('home').classList.add('active');
    currentPage = 'home';
    setNav('home');
    closeDrawer();
  }

  function enterHome() {
    resetHome();
    ensure(pageEl('home'));
    show('home');
  }

  function showPage(name) {
    if (name === currentPage) return;
    var oldP = pageEl(currentPage);
    var newP = pageEl(name);
    if (!oldP || !newP) return;
    ensure(newP);
    var back = currentPage !== 'home' && name === 'home';
    newP.classList.remove('exit-left');
    newP.style.transform = back ? 'translateX(-30%)' : 'translateX(100%)';
    newP.style.opacity = '0';
    newP.classList.add('active');
    requestAnimationFrame(function () {
      newP.style.transform = '';
      newP.style.opacity = '';
    });
    if (back) oldP.classList.add('exit-left');
    else oldP.classList.remove('active');
    setTimeout(function () {
      oldP.classList.remove('active');
      oldP.classList.remove('exit-left');
      oldP.style.transform = '';
      oldP.style.opacity = '';
    }, 550);
    currentPage = name;
    setNav(name);
    if (name === 'surprise') onEnterSurprise();
  }

  navLeft.addEventListener('click', function () {
    if (currentPage === 'home') openDrawer(); else showPage('home');
  });
  $('labArrow').addEventListener('click', openDrawer);
  $('drawerClose').addEventListener('click', closeDrawer);
  dov.addEventListener('click', closeDrawer);
  $('igBack').addEventListener('click', function () { showPage('home'); });

  var drawerBtns = home.querySelectorAll('.drawer-btn');
  for (var di = 0; di < drawerBtns.length; di++) {
    drawerBtns[di].addEventListener('click', function () {
      var pg = this.getAttribute('data-page');
      closeDrawer();
      setTimeout(function () { showPage(pg); }, 300);
    });
  }

  // ---- music ----
  var playBtn = $('playBtn');
  var eq = $('eq');
  playBtn.addEventListener('click', function () {
    if (!songPlaying) {
      applause.pause();
      songPlaying = true;
      song.currentTime = 0;
      song.play().catch(function () {});
      playBtn.innerHTML = ic('pause');
      eq.classList.add('active');
    } else {
      song.pause();
      songPlaying = false;
      playBtn.innerHTML = ic('play');
      eq.classList.remove('active');
    }
  });
  song.addEventListener('ended', function () {
    songPlaying = false;
    playBtn.innerHTML = ic('play');
    eq.classList.remove('active');
  });

  // ---- message ----
  var LETTER = "Today is a beautiful reminder of how lucky I am to have someone as amazing as you in my life.\n\nYou bring so much happiness, warmth, and positivity just by being yourself.\n\nNo matter where life takes us, I will always cherish those moments.\n\nHappy Birthday. You are truly special to me.";
  var typer = null;
  $('notif').addEventListener('click', function () {
    var box = $('letter');
    clearInterval(typer);
    if (box.classList.contains('hidden')) {
      box.classList.remove('hidden');
      var el = $('letterText');
      el.textContent = '';
      var i = 0;
      typer = setInterval(function () {
        el.textContent = LETTER.slice(0, ++i);
        if (i >= LETTER.length) clearInterval(typer);
      }, 40);
    } else {
      box.classList.add('hidden');
    }
  });

  // ---- gallery slideshow ----
  var igSlides = home.querySelectorAll('.ig-slide');
  var igIdx = 0;
  setInterval(function () {
    if (currentPage !== 'gallery' || !home.classList.contains('active') || document.hidden) return;
    igSlides[igIdx].classList.remove('active');
    igIdx = (igIdx + 1) % igSlides.length;
    igSlides[igIdx].classList.add('active');
  }, 2000);

  // ---- surprise ----
  var giftBtn = $('giftBtn');
  var flyerWrap = $('flyerWrap');
  var surpriseSub = $('surpriseSub');
  var playGameBtn = $('playGame');

  function onEnterSurprise() {
    flyerWrap.classList.add('hidden');
    if (!isSolved()) {
      surpriseSub.innerHTML = ic('lock') + ' Complete a game to unlock the gift';
      playGameBtn.classList.remove('hidden');
      giftBtn.classList.add('hidden');
      return;
    }
    surpriseSub.innerHTML = ic('gift') + ' A little magic is waiting…';
    playGameBtn.classList.add('hidden');
    giftBtn.classList.remove('hidden');
    showHurray();
  }
  function showHurray() {
    var o = document.createElement('div');
    o.className = 'hurray-overlay';
    o.innerHTML = '<span>HURRAY</span>';
    document.body.appendChild(o);
    setTimeout(function () { o.remove(); }, 2000);
  }
  giftBtn.addEventListener('click', function () {
    giftBtn.classList.add('hidden');
    surpriseSub.innerHTML = ic('wand-magic-sparkles') + ' Magic revealed!';
    flyerWrap.classList.remove('hidden');
    burst(['star', 'certificate', 'heart-f', 'bolt', 'wand-magic-sparkles']);
  });

  function burst(icons) {
    for (var i = 0; i < 60; i++) {
      var c = document.createElement('span');
      c.innerHTML = ic(icons[Math.floor(Math.random() * icons.length)]);
      c.className = 'burst-piece';
      c.style.color = ['#e94b2c', '#0a0a0a', '#ffd166'][Math.floor(Math.random() * 3)];
      c.style.left = (50 + (Math.random() * 60 - 30)) + 'vw';
      c.style.top = (50 + (Math.random() * 40 - 20)) + 'vh';
      document.body.appendChild(c);
      (function (el) {
        requestAnimationFrame(function () {
          el.style.transform = 'translate(' + (Math.random() * 400 - 200) + 'px, ' + (Math.random() * -400) + 'px) rotate(' + (Math.random() * 720) + 'deg)';
          el.style.opacity = '0';
        });
        setTimeout(function () { el.remove(); }, 1600);
      })(c);
    }
  }

  async function shareFlyer() {
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
  }
  $('shareBtn').addEventListener('click', shareFlyer);
  $('pzShare').addEventListener('click', shareFlyer);

  /* ------------------------------------------------------------
     5. PUZZLE (inside the same page, so the sound keeps playing)
  ------------------------------------------------------------ */
  var pzGrid = $('pzGrid');
  var pzPreview = $('pzPreview');
  var pzHint = $('pzHint');
  var pzSwaps = $('pzSwaps');
  var pzWin = $('pzWin');
  var pz = { solved: false, swaps: 0, sel: null, timer: null };

  playGameBtn.addEventListener('click', function () {
    show('puzzle');
    startPuzzle();
  });

  function startPuzzle() {
    clearInterval(pz.timer);
    pz.solved = false; pz.swaps = 0; pz.sel = null;
    ensure($('s-puzzle'));
    pzSwaps.textContent = 'SWAPS: 0';
    pzHint.textContent = 'Memorize the image! Shuffling in 3s…';
    pzPreview.classList.remove('hidden');
    pzGrid.classList.add('hidden');
    pzGrid.innerHTML = '';
    pzWin.classList.add('hidden');
    pzWin.classList.remove('show');
    var count = 3;
    pz.timer = setInterval(function () {
      count--;
      if (count <= 0) {
        clearInterval(pz.timer);
        shuffle();
        pzPreview.classList.add('hidden');
        pzGrid.classList.remove('hidden');
        pzHint.textContent = 'Tap two pieces to swap them';
      } else {
        pzHint.textContent = 'Memorize the image! Shuffling in ' + count + 's…';
      }
    }, 1000);
  }

  function shuffle() {
    var order = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    var sorted = true;
    for (var k = 0; k < order.length; k++) if (order[k] !== k) sorted = false;
    if (sorted) return shuffle();
    pzGrid.innerHTML = '';
    order.forEach(function (orig) {
      var p = document.createElement('div');
      p.className = 'piece';
      p.dataset.correct = orig;
      p.style.backgroundImage = "url('assets/puzzle.jpeg')";
      p.style.backgroundPosition = ((orig % 3) * 50) + '% ' + (Math.floor(orig / 3) * 50) + '%';
      p.addEventListener('click', function () { tap(p); });
      pzGrid.appendChild(p);
    });
  }

  function tap(p) {
    if (pz.solved) return;
    if (!pz.sel) { pz.sel = p; p.classList.add('sel'); return; }
    if (pz.sel === p) { p.classList.remove('sel'); pz.sel = null; return; }
    var a = pz.sel, b = p;
    var aBg = a.style.backgroundPosition;
    a.style.backgroundPosition = b.style.backgroundPosition;
    b.style.backgroundPosition = aBg;
    var aC = a.dataset.correct;
    a.dataset.correct = b.dataset.correct;
    b.dataset.correct = aC;
    a.classList.remove('sel');
    pz.sel = null;
    pz.swaps++;
    pzSwaps.textContent = 'SWAPS: ' + pz.swaps;
    checkPuzzle();
  }

  function checkPuzzle() {
    var pieces = [].slice.call(pzGrid.children);
    var done = pieces.every(function (p, i) { return Number(p.dataset.correct) === i; });
    if (!done) return;
    pz.solved = true;
    pzHint.textContent = 'Perfect';
    solvedMem = true;
    store('set', PUZZLE_KEY, '1');
    burst(['star', 'certificate', 'heart-f', 'bolt']);
    var o = document.createElement('div');
    o.className = 'hurray';
    o.innerHTML = '<span>HURRAY</span>';
    document.body.appendChild(o);
    setTimeout(function () { o.remove(); }, 1700);
    setTimeout(function () {
      pzWin.classList.remove('hidden');
      setTimeout(function () { pzWin.classList.add('show'); }, 30);
    }, 1600);
  }

  $('pzBack').addEventListener('click', function () {
    resetHome();
    show('home');
  });
})();
