/* ═══════════════════════════════════════════════════════════════
   EO Automations — main.js
   Video Scrub Hero · GSAP ScrollTrigger · FAQ · Mobile Menu
═══════════════════════════════════════════════════════════════ */

window.addEventListener('load', () => {
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    initAll();
  } else {
    // GSAP yuklanmagan — fallback
    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right')
      .forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    document.querySelectorAll('.svh__phase').forEach((el, i) => {
      if (i === 2) el.classList.add('active');
    });
  }
});

function initAll() {
  initNav();
  initMobileMenu();
  initScrollVideoHero();
  initRevealAnimations();
  initCounters();
  initFAQ();
  initSmoothScroll();
  initActiveNav();
  initStackScroll();
}

/* ══════════════════════════════════════════════════════════════
   NAV
══════════════════════════════════════════════════════════════ */
function initNav() {
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ══════════════════════════════════════════════════════════════
   MOBILE MENU
══════════════════════════════════════════════════════════════ */
function initMobileMenu() {
  const burger   = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  if (!burger || !navLinks) return;

  burger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(isOpen));
    const [s1, , s3] = burger.querySelectorAll('span');
    const s2 = burger.querySelectorAll('span')[1];
    if (isOpen) {
      gsap.to(s1, { rotation: 45, y: 7, duration: 0.3 });
      gsap.to(s2, { opacity: 0, duration: 0.2 });
      gsap.to(s3, { rotation: -45, y: -7, duration: 0.3 });
    } else {
      gsap.to([s1, s2, s3], { rotation: 0, y: 0, opacity: 1, duration: 0.3 });
    }
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      const spans = burger.querySelectorAll('span');
      gsap.to(spans, { rotation: 0, y: 0, opacity: 1, duration: 0.3 });
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   SCROLL VIDEO HERO
   ─────────────────────────────────────────────────────────────
   400vh scroll maydoni:
   0–33%  → Faza 1 (Rutina)    video 0%–35%
   33–66% → Faza 2 (O'tish)    video 35%–65%
   66–100%→ Faza 3 (Natija)    video 65%–100%
══════════════════════════════════════════════════════════════ */
function initScrollVideoHero() {
  const video   = document.getElementById('heroVideo');
  const pin     = document.getElementById('svhPin');
  const dark    = document.getElementById('svhDark');
  const fill    = document.getElementById('svhProgressFill');
  const cue     = document.getElementById('svhCue');
  const phase1  = document.getElementById('svhPhase1');
  const phase2  = document.getElementById('svhPhase2');
  const phase3  = document.getElementById('svhPhase3');
  const pLabels = document.querySelectorAll('.pl');

  if (!video || !pin) return;

  // Video tayyor bo'lishini kutish
  const setupScrub = () => {
    const dur = video.duration || 10; // fallback duration

    // ── Phase visibility function ───────────────────────────
    const setPhase = (progress) => {
      // Progress 0–1

      // Fill bar
      if (fill) fill.style.width = (progress * 100) + '%';

      // Hide scroll cue after first 5%
      if (cue) cue.style.opacity = progress < 0.05 ? '1' : '0';

      // Phase thresholds
      const inPhase1 = progress < 0.28;
      const inPhase2 = progress >= 0.28 && progress < 0.62;
      const inPhase3 = progress >= 0.62;

      // Crossfade phases
      animatePhase(phase1, inPhase1, progress < 0.15 ? (progress / 0.15) : (1 - (progress - 0.15) / 0.13));
      animatePhase(phase2, inPhase2, progress < 0.35 ? ((progress - 0.28) / 0.07) : (1 - (progress - 0.55) / 0.07));
      animatePhase(phase3, inPhase3, Math.min(1, (progress - 0.62) / 0.12));

      // Active progress labels
      pLabels.forEach((lbl, i) => {
        lbl.classList.toggle('active',
          (i === 0 && inPhase1) ||
          (i === 1 && inPhase2) ||
          (i === 2 && inPhase3)
        );
      });

      // Dark overlay: faza 1 da qoʻng'iroq (0.55), faza 3 da kamroq (0.3)
      if (dark) {
        const darkness = inPhase1 ? 0.55 : inPhase3 ? 0.3 : 0.42;
        dark.style.background = `rgba(0,0,0,${darkness})`;
      }

      // Video scrub
      if (isFinite(dur) && dur > 0) {
        const targetTime = Math.min(progress * dur, dur - 0.001);
        if (Math.abs(video.currentTime - targetTime) > 0.05) {
          video.currentTime = targetTime;
        }
      }
    };

    // Phase 1 ko'rinadi boshlang'ichda
    phase1.style.opacity = '1';
    phase1.style.transform = 'translateY(0)';

    // ── ScrollTrigger Pin + Scrub ───────────────────────────
    ScrollTrigger.create({
      trigger: '.svh',
      start: 'top top',
      end: 'bottom bottom',
      pin: pin,
      pinSpacing: false,
      scrub: 0.8,
      onUpdate: self => setPhase(self.progress),
      onEnter: () => {
        gsap.fromTo(phase1,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
        );
      },
    });
  };

  // Video metadata tayyor bo'lganda
  if (video.readyState >= 1) {
    setupScrub();
  } else {
    video.addEventListener('loadedmetadata', setupScrub, { once: true });
    // 2 soniya fallback
    setTimeout(setupScrub, 2000);
  }
}

// Phase animatsiyasi yordamchi
function animatePhase(el, shouldShow, rawOpacity) {
  if (!el) return;
  const opacity = Math.max(0, Math.min(1, rawOpacity));
  el.style.opacity = shouldShow ? opacity.toFixed(3) : '0';
  el.style.transform = shouldShow
    ? `translateY(${(1 - opacity) * 20}px)`
    : 'translateY(20px)';
}

/* ══════════════════════════════════════════════════════════════
   REVEAL ANIMATIONS (sektsiyalar uchun)
══════════════════════════════════════════════════════════════ */
function initRevealAnimations() {
  gsap.utils.toArray('.reveal-up').forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0) * 0.12;
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0,
        duration: 0.75,
        ease: 'power3.out',
        delay,
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  gsap.utils.toArray('.reveal-left').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, x: -50 },
      {
        opacity: 1, x: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 87%', toggleActions: 'play none none none' }
      }
    );
  });

  gsap.utils.toArray('.reveal-right').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, x: 50 },
      {
        opacity: 1, x: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 87%', toggleActions: 'play none none none' }
      }
    );
  });

  // Cards stagger
  ['service-card', 'case-card', 'pricing-card', 'testi-card', 'process-step'].forEach(cls => {
    gsap.utils.toArray(`.${cls}`).forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0,
          duration: 0.6, ease: 'power2.out',
          delay: i * 0.1,
          scrollTrigger: { trigger: card, start: 'top 93%', toggleActions: 'play none none none' }
        }
      );
    });
  });

  // Final CTA glow
  gsap.to('.fca__glow', {
    scale: 1.35, opacity: 0.9, duration: 3.5,
    ease: 'sine.inOut', yoyo: true, repeat: -1,
  });
}

/* ══════════════════════════════════════════════════════════════
   COUNTERS
══════════════════════════════════════════════════════════════ */
function initCounters() {
  const run = (el, target) => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target, duration: 2.2, ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.val); }
    });
  };

  document.querySelectorAll('.trust-num, .stat-num').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    if (!target) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => run(el, target),
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   FAQ ACCORDION
══════════════════════════════════════════════════════════════ */
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q')?.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      if (isOpen) {
        document.querySelectorAll('.faq-item.open').forEach(other => {
          if (other !== item) other.classList.remove('open');
        });
      }
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   SMOOTH SCROLL
══════════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  const nav = document.getElementById('nav');
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = (nav?.offsetHeight || 0) + 20;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   ACTIVE NAV
══════════════════════════════════════════════════════════════ */
function initActiveNav() {
  const sections    = document.querySelectorAll('section[id]');
  const navLinkEls  = document.querySelectorAll('.nav__links a');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinkEls.forEach(l => {
          l.style.color = l.getAttribute('href') === `#${e.target.id}` ? 'var(--white)' : '';
        });
      }
    });
  }, { threshold: 0.35 });
  sections.forEach(s => obs.observe(s));
}

/* ══════════════════════════════════════════════════════════════
   STACK LOGO SCROLL (marquee)
══════════════════════════════════════════════════════════════ */
function initStackScroll() {
  const logos = document.querySelector('.stack-bar__logos');
  if (!logos) return;
  // Duplicate for infinite effect
  logos.innerHTML += logos.innerHTML;
  const total = logos.children.length;
  const halfW = logos.scrollWidth / 2;

  gsap.to(logos, {
    x: -halfW,
    duration: 22,
    ease: 'none',
    repeat: -1,
    modifiers: {
      x: gsap.utils.unitize(x => parseFloat(x) % halfW)
    }
  });
}
