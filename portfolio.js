(() => {
  'use strict';

  const site = document.getElementById('rp-site');
  if (!site) return;
  const root = document.documentElement;
  const byId = id => document.getElementById(id);
  const one = selector => site.querySelector(selector);
  const all = selector => Array.from(site.querySelectorAll(selector));
  const inEnglish = () => root.lang.toLowerCase().startsWith('en');
  const preferredMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 700px)');
  const storage = {
    read(key) { try { return localStorage.getItem(key); } catch { return null; } },
    save(key, value) { try { localStorage.setItem(key, value); } catch { /* Private browsing */ } }
  };

  const nav = one('.rp-nav');
  const menuButton = byId('rp-menu-toggle');
  const workButton = byId('work-toggle');
  const workMenu = byId('rp-work-list');
  function setWorkMenu(open) {
    workButton.setAttribute('aria-expanded', String(open));
    workMenu.hidden = !open;
  }
  function setMobileMenu(open) {
    nav.dataset.mobileOpen = String(open);
    menuButton.setAttribute('aria-expanded', String(open));
    one('main').inert = open;
    one('.rp-footer').inert = open;
    if (!open) setWorkMenu(false);
  }
  workButton.addEventListener('click', () => setWorkMenu(workMenu.hidden));
  menuButton.addEventListener('click', () => setMobileMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setMobileMenu(false);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.rp-work-menu')) setWorkMenu(false);
  });
  mobile.addEventListener('change', () => setMobileMenu(false));

  const themeButton = byId('rp-theme');
  function setTheme(dark, save) {
    root.dataset.theme = dark ? 'dark' : 'light';
    themeButton.setAttribute('aria-pressed', String(dark));
    document.querySelector('meta[name="theme-color"]').content = dark ? '#1d1d1d' : '#fcf9ef';
    if (save) storage.save('ruopan-portfolio-theme', root.dataset.theme);
  }
  const savedTheme = storage.read('ruopan-portfolio-theme');
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)');
  setTheme(savedTheme ? savedTheme === 'dark' : darkMode.matches, false);
  themeButton.addEventListener('click', () => setTheme(root.dataset.theme !== 'dark', true));
  darkMode.addEventListener('change', () => { if (!storage.read('ruopan-portfolio-theme')) setTheme(darkMode.matches, false); });

  const introCopy = one('.rp-intro-copy');
  let roleTrigger = null;
  let roleNote = null;
  let rolePinned = false;
  let leaveTimer;

  function closeRoleNote() {
    clearTimeout(leaveTimer);
    if (!roleNote) return;
    roleNote.hidden = true;
    roleTrigger.setAttribute('aria-expanded', 'false');
    roleTrigger = null;
    roleNote = null;
    rolePinned = false;
  }

  function positionRoleNote() {
    if (!roleNote) return;
    const anchor = roleTrigger.getBoundingClientRect();
    const bounds = introCopy.getBoundingClientRect();
    const gap = 7;
    const centered = anchor.left - bounds.left + (anchor.width - roleNote.offsetWidth) / 2;
    const left = Math.max(0, Math.min(centered, bounds.width - roleNote.offsetWidth));
    const fitsAbove = anchor.top - roleNote.offsetHeight - gap >= nav.offsetHeight;
    const useAbove = fitsAbove && anchor.bottom + gap + roleNote.offsetHeight > window.innerHeight;
    const top = useAbove ? anchor.top - roleNote.offsetHeight - gap : anchor.bottom + gap;
    roleNote.toggleAttribute('data-above', useAbove);
    roleNote.style.left = Math.round(left) + 'px';
    roleNote.style.top = Math.round(top - bounds.top) + 'px';
  }

  function showRoleNote(trigger) {
    clearTimeout(leaveTimer);
    if (roleTrigger === trigger) return;
    closeRoleNote();
    roleTrigger = trigger;
    roleNote = byId(trigger.getAttribute('aria-controls'));
    roleNote.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    positionRoleNote();
  }

  function leaveRoleNote(event) {
    if (event.pointerType === 'touch' || rolePinned || roleTrigger?.matches(':focus-visible')) return;
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(closeRoleNote, 180);
  }

  for (const trigger of introCopy.querySelectorAll('button[aria-controls]')) {
    const note = byId(trigger.getAttribute('aria-controls'));
    trigger.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') showRoleNote(trigger);
    });
    trigger.addEventListener('pointerleave', leaveRoleNote);
    trigger.addEventListener('focus', () => showRoleNote(trigger));
    trigger.addEventListener('blur', event => {
      if (event.relatedTarget || !rolePinned) closeRoleNote();
    });
    trigger.addEventListener('click', () => {
      if (roleTrigger === trigger && rolePinned) return closeRoleNote();
      showRoleNote(trigger);
      rolePinned = true;
    });
    note.addEventListener('pointerenter', () => clearTimeout(leaveTimer));
    note.addEventListener('pointerleave', leaveRoleNote);
  }
  document.addEventListener('pointerdown', event => {
    if (roleNote && !roleNote.contains(event.target) && !roleTrigger.contains(event.target)) closeRoleNote();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeRoleNote();
  });
  window.addEventListener('hashchange', closeRoleNote);
  window.addEventListener('resize', positionRoleNote);
  new ResizeObserver(positionRoleNote).observe(introCopy);

  const storefront = one('.rp-storefront');
  const shopArt = byId('rp-shop-art');
  const seasons = {
    spring: ['春日', 'spring'], summer: ['夏日', 'summer'],
    fall: ['秋日', 'autumn'], winter: ['冬日', 'winter']
  };
  function describeSeason() {
    const season = seasons[storefront.dataset.season];
    shopArt.alt = inEnglish()
      ? 'A storefront in the Shenzhen hills in ' + season[1] + ', with World Mall painted in cursive above the entrance.'
      : '深圳山脚的' + season[0] + '店面，招牌上用英文连笔写着 World Mall';
  }
  one('.rp-seasons').addEventListener('change', event => {
    const season = event.target.value;
    if (!Object.hasOwn(seasons, season)) return;
    storefront.dataset.season = season;
    shopArt.src = './assets/store-' + season + '.webp';
    describeSeason();
  });
  const shimmer = one('.rp-scene-shimmer');
  [8, 16, 37, 57, 79, 88].forEach((position, index) => {
    const leaf = document.createElement('i');
    leaf.style.setProperty('--leaf-x', position + '%');
    leaf.style.setProperty('--leaf-duration', (7 + index % 3) + 's');
    leaf.style.setProperty('--leaf-start', -(index * 2.3) + 's');
    shimmer.append(leaf);
  });
  const pauseButton = byId('rp-pause');
  function setPaused(paused) {
    storefront.dataset.paused = String(paused);
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? '播放动画 / Play animation' : '暂停动画 / Pause animation');
    one('[data-play-icon]').hidden = !paused;
    one('[data-pause-icon]').hidden = paused;
  }
  setPaused(preferredMotion.matches);
  pauseButton.addEventListener('click', () => setPaused(storefront.dataset.paused !== 'true'));
  preferredMotion.addEventListener('change', event => setPaused(event.matches));

  const inside = byId('rp-inside');
  const outside = byId('rp-outside');
  const enter = byId('rp-enter');
  const exit = byId('rp-exit');
  const objectButtons = all('.rp-object');
  const objectNotes = all('[data-note]');
  function selectObject(index) {
    objectButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.object === index)));
    objectNotes.forEach(note => { note.hidden = note.dataset.note !== index; });
  }
  objectButtons.forEach(button => button.addEventListener('click', () => {
    selectObject(button.getAttribute('aria-pressed') === 'true' ? null : button.dataset.object);
  }));
  selectObject(null);
  function setShopInterior(open, focus) {
    outside.hidden = open;
    inside.hidden = !open;
    selectObject(null);
    if (focus) {
      (open ? exit : enter).focus({preventScroll:true});
      window.scrollTo({top:0,behavior:'instant'});
    }
  }
  enter.addEventListener('click', () => setShopInterior(true, true));
  exit.addEventListener('click', () => setShopInterior(false, true));

  const dialog = byId('rp-lightbox');
  const dialogTitle = byId('rp-lightbox-heading');
  const dialogBody = byId('rp-lightbox-body');
  let opener = null;
  function openExhibit(button) {
    dialogBody.replaceChildren();
    if (button.hasAttribute('data-cover')) {
      const image = button.querySelector('img').cloneNode(true);
      image.removeAttribute('loading');
      dialogBody.append(image);
      dialogTitle.textContent = inEnglish() ? 'Case study' : '案例封面';
    } else {
      const id = button.dataset.openFigure;
      const exhibit = byId(id)?.querySelector('[data-exhibit]');
      if (!exhibit) return;
      for (const child of exhibit.children) dialogBody.append(child.cloneNode(true));
      dialogTitle.textContent = inEnglish() ? 'Design exhibit' : '脱敏设计图';
    }
    opener = button;
    dialog.showModal();
    byId('rp-dialog-close').focus();
  }
  site.addEventListener('click', event => {
    const button = event.target.closest('[data-open-figure],[data-cover]');
    if (button) openExhibit(button);
  });
  byId('rp-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { opener?.focus({preventScroll:true}); opener = null; });

  const views = all('[data-view]');
  let currentView = 'home';
  const detailIds = new Set(views.map(view => view.id));
  function showRoute({initial = false} = {}) {
    const anchor = location.hash.slice(1);
    const section = anchor === 'contact' ? currentView : detailIds.has(anchor) ? anchor : 'home';
    if (dialog.open) dialog.close();
    setMobileMenu(false);
    const changed = currentView !== section;
    if (changed || anchor === 'home') setShopInterior(false, false);
    views.forEach(view => { view.hidden = view.id !== section; });
    currentView = section;
    if (initial && !anchor) return;
    requestAnimationFrame(() => {
      if (anchor === 'projects' || anchor === 'contact') {
        byId(anchor).scrollIntoView({block:'start',behavior:'instant'});
      } else {
        window.scrollTo({top:0,behavior:'instant'});
        if (!initial && changed) byId(section).querySelector('h1')?.focus({preventScroll:true});
      }
    });
  }
  window.addEventListener('hashchange', () => showRoute());
  site.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (anchor && anchor.hash === location.hash) {
      event.preventDefault();
      showRoute();
    }
  });
  /* The existing chat navigates with replaceState and does not dispatch hashchange. */
  document.addEventListener('click', event => {
    if (!event.target.closest('.chat-reference')) return;
    requestAnimationFrame(() => requestAnimationFrame(() => showRoute()));
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || dialog.open || event.target.closest('#rp-pet-shell')) return;
    if (!workMenu.hidden) { setWorkMenu(false); workButton.focus(); }
    else if (nav.dataset.mobileOpen === 'true') { setMobileMenu(false); menuButton.focus(); }
    else if (!inside.hidden && currentView === 'home') setShopInterior(false, true);
  });
  showRoute({initial:true});

  const languageButton = one('[data-language]');
  languageButton.addEventListener('click', () => {
    const bridge = byId('rp-locale-bridge');
    if (bridge) bridge.click();
    else root.lang = inEnglish() ? 'zh-CN' : 'en';
  });
  new MutationObserver(describeSeason).observe(root, {attributes:true,attributeFilter:['lang']});
  const videoDetails = one('.rp-video');
  videoDetails.addEventListener('toggle', () => {
    const video = videoDetails.querySelector('video');
    if (videoDetails.open && !video.hasAttribute('src')) video.src = video.dataset.videoSrc;
    if (!videoDetails.open) video.pause();
  });
  byId('rp-wechat').addEventListener('click', async () => {
    const value = 'quartZ0520';
    const feedback = byId('rp-copy-note');
    try {
      await navigator.clipboard.writeText(value);
      feedback.textContent = inEnglish() ? 'WeChat ID copied.' : '已复制微信号。';
    } catch {
      feedback.textContent = inEnglish() ? 'WeChat ID: ' + value : '微信号 ' + value;
    }
  });
})();
