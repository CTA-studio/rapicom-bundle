const blockScroll = window.blockScroll;
const unblockScroll = window.unblockScroll;
const handleUnblockScroll = window.handleUnblockScroll;
const cleanUpTriggers = window.cleanUpTriggers;
const cleanUpPageListeners = window.cleanUpPageListeners;
const lenisInstance = window.lenisInstance;
const cookieManager = window.cookieManager;
const uiManager = window.uiManager;

//-Variabili apertura Menu

window.isNavOpen = false;
window.isAnimating = false;

//-Variabili apertura e animazioni Nav Pagina
window.isUiReady = false;
//-Variabili Barba
window.isBarbaTransition = false;

//-------------
let patternGridElements = {
  wrapper: document.getElementById("pattern-grid") || null,
  get squares() {
    return document.querySelectorAll(".grid-square");
  },
  slogan: document.querySelector(".txt_tran_wrap") || null,
};

const backHomeLink = document.querySelector(".b_link") || null;
const burger = document.getElementById("burger") || null;

//-------------Burger Elements

const burgerElements = {
  lineTop: document.querySelector(".burger-line-top") || null,
  lineBottom: document.querySelector(".burger-line-bottom") || null,
  btn: document.getElementById("burger-btn") || null,
  burgerLabel: document.querySelector(".burger-label-container") || null,
  label: document.querySelector(".burger-label") || null,
};

//
// Brand
const brandElements = {
  container: document.getElementById("brand") || null,
  brandMark: document.querySelector(".brand-mark-container") || null,
};
// Brand Elements

//
function initBarbaWithGSAP() {
  if (typeof barba === "undefined" || typeof gsap === "undefined") {
    console.error("Barba.js o GSAP non sono stati caricati correttamente.");
    return;
  }

  function normalizePath(path = "") {
    return String(path)
      .replace(/\/+$/, "")
      .replace(/\/index\.html$/, "");
  }

  function isHomeHref(href) {
    if (!href) return false;
    if (href.startsWith("#")) return false;

    try {
      const url = new URL(href, window.location.origin);
      const path = normalizePath(url.pathname);
      const isSameOrigin = url.origin === window.location.origin;
      return isSameOrigin && path === "";
    } catch {
      return false;
    }
  }

  function getRouteContext(data) {
    const fromNs = data.current?.namespace || "";
    const toNs = data.next?.namespace || "";

    const currentPath = normalizePath(data.current?.url?.path || "");
    const nextPath = normalizePath(data.next?.url?.path || "");

    const triggerHref =
      data.trigger instanceof HTMLElement
        ? data.trigger.getAttribute("href") || ""
        : "";

    const isFromHome = fromNs === "home" || currentPath === "";
    const isToHome =
      toNs === "home" || nextPath === "" || isHomeHref(triggerHref);

    const isHomeToOther = isFromHome && !isToHome;
    const isOtherToHome = !isFromHome && isToHome;

    return {
      fromNs,
      toNs,
      currentPath,
      nextPath,
      triggerHref,
      isFromHome,
      isToHome,
      isHomeToOther,
      isOtherToHome,
    };
  }

  function setHomeBootSource(data, source) {
    const ctx = getRouteContext(data);
    if (ctx.isOtherToHome) {
      window.__homeBootSource = source;
    }
    return ctx;
  }

  function getTransTargets(root) {
    if (!root) return [];

    return Array.from(root.querySelectorAll("[data-trans]")).sort((a, b) => {
      const av = Number(a.getAttribute("data-trans")) || 0;
      const bv = Number(b.getAttribute("data-trans")) || 0;
      return av - bv;
    });
  }

  function prepTransTargets(root) {
    const targets = getTransTargets(root);
    if (!targets.length) return [];

    root.__transTargets = targets;
    root.__transPlayed = false;

    gsap.set(targets, {
      autoAlpha: 0,
      y: 100,
      willChange: "transform, opacity",
    });

    return targets;
  }

  function playMenuTargets(root) {
    const targets = root?.__transTargets || getTransTargets(root);
    if (!targets.length) return null;

    return gsap.to(targets, {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power1.out",
      onComplete: () => {
        gsap.set(targets, {
          clearProps: "opacity,visibility,transform,will-change",
        });
        delete root.__transTargets;
        delete root.__transPlayed;
      },
    });
  }

  /** === BUTTONS */

  function buildButtonLeaveTransition(done) {
    const bgTrans = patternGridElements.wrapper;
    const squares = gsap.utils.toArray(patternGridElements.squares);
    const txtWraps = patternGridElements.slogan;

    if (!bgTrans || !squares.length) {
      done?.();
      return null;
    }

    const duration = 0.6;
    const staggerAmount = 0.2;

    gsap.set(bgTrans, { visibility: "visible" });
    gsap.set(txtWraps, { autoAlpha: 0 });
    gsap.set(squares, {
      parseTransform: true,
      y: 0,
      scale: 0,
    });

    const gridTL = gsap.timeline({
      onComplete: () => {
        done?.();
      },
    });

    gridTL
      .to(squares, {
        scale: 1,
        duration,
        ease: "power2.out",
        stagger: {
          amount: staggerAmount,
          from: "center",
          axis: "x",
          grid: "auto",
        },
      })
      .to(
        squares,
        {
          borderRadius: "0px",
          borderColor: "transparent",
          duration: 0.4,
          ease: "linear",
          stagger: {
            amount: staggerAmount,
            from: "end",
            axis: "y",
            grid: "auto",
          },
        },
        0.2
      )
      .to(
        txtWraps,
        {
          autoAlpha: 1,
          duration: 0.6,
          ease: "power2.out",
        },
        0.18
      );

    return gridTL;
  }

  function buildButtonEnterTransition(done, root, opts = {}) {
    const { enableTargets = true } = opts;

    const bgTrans = patternGridElements.wrapper;
    const squares = gsap.utils.toArray(patternGridElements.squares);
    const txtWraps = patternGridElements.slogan;
    const targets = enableTargets
      ? root
        ? root.__transTargets || getTransTargets(root)
        : []
      : [];

    if (!bgTrans || !squares.length) {
      done?.();
      return null;
    }

    const duration = 0.6;
    const staggerAmount = 0.2;
    const buttonEnterLead = 0.4;

    gsap.killTweensOf([bgTrans, txtWraps, ...targets]);
    gsap.set(bgTrans, { visibility: "visible" });

    const gridTL = gsap.timeline({
      defaults: {
        overwrite: "auto",
      },
      onStart: () => {
        lenisInstance.forceScrollToTop?.();
        window.safeRequestIdleCallback(() => {
          done?.();
        });
      },
      onComplete: () => {
        lenisInstance.update?.();
        lenisInstance.start?.();

        gsap.set(txtWraps, {
          clearProps: "all",
        });

        gsap.set(bgTrans, {
          clearProps: "visibility",
        });

        if (enableTargets && targets.length) {
          gsap.set(targets, {
            clearProps: "all",
          });
        }

        if (root && enableTargets) {
          delete root.__transTargets;
          delete root.__transPlayed;
        }
      },
    });

    gridTL
      .to(
        txtWraps,
        {
          autoAlpha: 0,
          duration: 0.4,
          ease: "power1.out",
        },
        0.6
      )
      .to(
        squares,
        {
          borderRadius: "",
          borderColor: "#00d37f",
          duration: 0.4,
          ease: "linear",
          stagger: {
            amount: staggerAmount,
            from: "end",
            axis: "y",
            grid: "auto",
          },
        },
        0.6
      )
      .to(
        squares,
        {
          y: -100,
          scale: 0,
          duration: duration,
          ease: "power2.out",
          stagger: {
            amount: staggerAmount,
            from: "end",
            axis: "y",
            grid: "auto",
          },
        },
        "-=0.4"
      );

    if (enableTargets && targets.length) {
      gridTL.to(
        targets,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power1.out",
        },
        `-=${buttonEnterLead}`
      );
    }

    return gridTL;
  }

  function commonAfter(data, opts = {}) {
    updatePageMetaAndInteractions(data.next.html);
    initializeMainFunctions();
    const { unlockPageTrigger = true } = opts;

    if (unlockPageTrigger) {
      window.pageTrigger?.unlockAfterBarba(data.next.container);
    }

    if (!cookieManager.getCookie("cta")) {
      uiManager.showBanner();
    }
  }

  barba.init({
    debug: false,
    timeout: 5000,
    transitions: [
      {
        name: "button-transition",
        from: {
          custom: ({ trigger }) =>
            trigger instanceof HTMLElement &&
            trigger.getAttribute("data-custom") === "button",
        },
        beforeLeave(data) {
          window.isBarbaTransition = true;
          lenisInstance.stop();
        },
        leave(data) {
          const done = this.async();
          buildButtonLeaveTransition(done);
        },
        beforeEnter(data) {
          const ctx = setHomeBootSource(data, "button");

          if (!ctx.isToHome) {
            prepTransTargets(data.next.container);
          }
        },
        enter(data) {
          const done = this.async();
          const ctx = getRouteContext(data);

          buildButtonEnterTransition(done, data.next.container, {
            enableTargets: !ctx.isToHome,
          });
        },
        after(data) {
          window.pageTrigger?.setBrandOpen(false);
          commonAfter(data, { unlockPageTrigger: true });
        },
      },

      {
        name: "menu-transition",
        from: {
          custom: ({ trigger }) =>
            trigger instanceof HTMLElement &&
            trigger.getAttribute("data-custom") === "menu",
        },
        beforeLeave(data) {
          window.isBarbaTransition = true;
        },
        leave(data) {
          const done = this.async();
          done();
        },
        beforeEnter(data) {
          const ctx = setHomeBootSource(data, "menu");

          if (!ctx.isToHome) {
            prepTransTargets(data.next.container);
          }
        },
        enter(data) {
          const done = this.async();
          const ctx = getRouteContext(data);
          done();
          lenisInstance.forceScrollToTop?.();
          window.headerAnimation.closeMenuBarba?.(() => {
            if (!ctx.isToHome) {
              playMenuTargets(data.next.container);
            }
          });
        },
        after(data) {
          window.pageTrigger?.setBrandOpen(false);
          commonAfter(data, { unlockPageTrigger: true });
        },
      },

      {
        name: "popstate-transition",
        beforeLeave(data) {
          window.isBarbaTransition = true;
          lenisInstance.stop();
        },
        leave(data) {
          const done = this.async();
          buildButtonLeaveTransition(done);
        },
        beforeEnter(data) {
          const ctx = setHomeBootSource(data, "button");

          if (!ctx.isToHome) {
            prepTransTargets(data.next.container);
          }
        },
        enter(data) {
          const done = this.async();
          const ctx = getRouteContext(data);

          buildButtonEnterTransition(done, data.next.container, {
            enableTargets: !ctx.isToHome,
          });
        },
        after(data) {
          window.pageTrigger?.setBrandOpen(false);
          commonAfter(data, { unlockPageTrigger: true });
        },
      },
    ],

    hooks: {
      after() {
        window.isBarbaTransition = false;
      },
    },

    preventRunning: true,
    scroll: {
      reset: true,
    },
    prefetch: true,
  });

  document.querySelectorAll('a[data-barba="link"]').forEach((link) => {
    link.addEventListener("mouseenter", () => barba.prefetch(link.href));
  });
}

window.pageTrigger = window.pageTrigger || {
  hero: null,
  enterTl: null,
  st: null,
  _locked: false,
  _isBrandOpen: null, // stato visivo corrente

  setInit(root = document) {
    this.rebind(root);
  },

  rebind(root = document) {
    this.destroy();

    this.hero =
      root?.querySelector?.("#hero") || document.getElementById("hero") || null;

    this.init();
  },

  setBrandState(isOpen, immediate = false, force = false) {
    if (
      !window.gsap ||
      !brandElements?.brandMark ||
      !brandElements?.container
    ) {
      return;
    }

    // se è già nello stato giusto e non devo forzare, non faccio nulla
    if (!force && this._isBrandOpen === isOpen) return;

    gsap.killTweensOf([brandElements.brandMark, brandElements.container]);

    const clip = isOpen ? "0%" : "100%";
    const scale = isOpen ? 0.9 : 1;

    if (immediate) {
      gsap.set(brandElements.brandMark, { "--clip-l": clip });
      gsap.set(brandElements.container, { scale });
    } else {
      gsap.to(brandElements.brandMark, {
        "--clip-l": clip,
        duration: 0.6,
        ease: "power1.inOut",
        overwrite: "auto",
      });

      gsap.to(brandElements.container, {
        scale,
        duration: 0.6,
        ease: "power1.inOut",
        overwrite: "auto",
      });
    }

    this._isBrandOpen = isOpen;
  },

  setBrandOpen(immediate = false, force = false) {
    this.setBrandState(true, immediate, force);
  },

  setBrandClosed(immediate = false, force = false) {
    this.setBrandState(false, immediate, force);
  },

  uiTriggerEnter() {
    if (!this.hero || !window.gsap || !window.ScrollTrigger) return;

    this.enterTl = gsap.timeline({
      paused: true,
      onComplete: () => {
        window.isUiReady = true;
        this._isBrandOpen = false; // pagina “attiva”, brand chiuso
      },
      onReverseComplete: () => {
        window.isUiReady = false;
        this._isBrandOpen = true; // top page, brand aperto
      },
    });

    this.enterTl
      .to(
        brandElements.brandMark,
        {
          "--clip-l": "100%",
          duration: 0.6,
          ease: "power1.inOut",
        },
        0
      )
      .to(
        brandElements.container,
        {
          scale: 1,
          duration: 0.6,
          ease: "power1.inOut",
        },
        0
      );

    this.st = ScrollTrigger.create({
      trigger: this.hero,
      start: "bottom 20%",
      //end: "bottom 45%",
      scrub: true,
      onEnter: () => {
        if (this._locked) return;
        this.enterTl?.play();
      },
      onEnterBack: () => {
        if (this._locked) return;
        this.enterTl?.reverse();
      },
    });

    // sync iniziale safe
    if (ScrollTrigger.isInViewport(this.hero, 0.5)) {
      window.isUiReady = false;
      this._isBrandOpen = true;
    }
  },

  lockForBarba() {
    this._locked = true;

    try {
      this.st?.disable(false);
    } catch (_) {}

    try {
      this.enterTl?.pause();
    } catch (_) {}

    // durante leave vogliamo SEMPRE il brand aperto
    this.setBrandOpen(true, true);
    window.isUiReady = false;
  },

  unlockAfterBarba(root = document) {
    this._locked = false;
    this.rebind(root);
  },

  destroy() {
    try {
      this.st?.kill();
    } catch (_) {}

    try {
      this.enterTl?.kill();
    } catch (_) {}

    this.hero = null;
    this.st = null;
    this.enterTl = null;
  },

  init() {
    this.uiTriggerEnter();
  },
};

window.UIanimations = window.UIanimations || {
  btnPrimaryAnimation: function () {
    const bp = window.bp?.get?.() || {};
    const isTouchSmall = !!bp.touchDown;

    document.querySelectorAll(".btn-primary").forEach((btn) => {
      const textWrap = btn.querySelector(".btn-text-wrap");
      const text = btn.querySelector(".btn-cta-txt");
      const textGhost = btn.querySelector(".btn-cta-txt.ghost");
      const hov = btn.querySelector(".btn-icon-hov-cont");
      const icon = btn.querySelector(".btn-icon");
      const iconHov = btn.querySelector(".btn-icon-hov");
      const iconWrap = btn.querySelector(".btn-icon-wrapper");

      const requiredEls = [textWrap, text, hov, icon, iconHov, iconWrap];

      // Se ghost è richiesto, lo aggiungiamo nei required
      if (!isTouchSmall) requiredEls.push(textGhost);
      if (requiredEls.some((el) => !el)) return;

      // Split solo se non touch
      let chars = [];
      let ghostChars = [];

      if (!isTouchSmall && !text.classList.contains("split-ready")) {
        const splitMain = SplitText.create(text, {
          type: "chars",
          autoSplit: true,
          mask: "chars",
        });
        text.split = splitMain;
        text.classList.add("split-ready");

        const splitGhost = SplitText.create(textGhost, {
          type: "chars",
          autoSplit: true,
        });
        textGhost.split = splitGhost;
        textGhost.classList.add("split-ready");

        chars = splitMain.chars;
        ghostChars = splitGhost.chars;

        gsap.set(chars, {
          rotateX: 0,
          opacity: 1,
          transformOrigin: "top",
        });

        gsap.set(ghostChars, {
          rotateX: -90,
          opacity: 0,
          transformOrigin: "top",
        });
      }

      const tl = gsap.timeline({ paused: true });

      // Animazioni condizionate
      tl.to(icon, {
        scale: 0,
        duration: 0.2,
        ease: "power2.out",
      });

      if (!isTouchSmall && chars.length && ghostChars.length) {
        tl.to(
          chars,
          {
            rotateX: 90,
            transformOrigin: "top",
            duration: 0.3,
            stagger: { amount: 0.2 },
            ease: "power2.out",
          },
          0
        ).to(
          ghostChars,
          {
            rotateX: 0,
            opacity: 1,
            transformOrigin: "bottom",
            duration: 0.3,
            stagger: { amount: 0.2 },
            ease: "power2.out",
          },
          "<"
        );
      }

      tl.to(
        [hov, iconHov],
        {
          scale: 1,
          duration: 0.2,
          stagger: 0.1,
          ease: "power2.out",
        },
        0.1
      ).to(
        [iconWrap, textWrap],
        {
          "--glow-strength": 0.6,
          duration: 0.5,
          ease: "power2.out",
        },
        0
      );

      // Eventi
      function handleEnter() {
        tl.play();
      }

      function handleLeave() {
        tl.reverse();
      }

      btn.addEventListener("mouseenter", handleEnter);
      btn.addEventListener("mouseleave", handleLeave);
      btn.addEventListener("touchstart", handleEnter);
      btn.addEventListener("touchend", handleLeave);

      window.pageSpecificListeners.push(
        { element: btn, event: "mouseenter", handler: handleEnter },
        { element: btn, event: "mouseleave", handler: handleLeave },
        { element: btn, event: "touchstart", handler: handleEnter },
        { element: btn, event: "touchend", handler: handleLeave }
      );
    });
  },
  init: function () {
    this.btnPrimaryAnimation();
  },
};
window.headerAnimation = window.headerAnimation || {
  bp: function () {
    const is = window.bp?.is;
    if (typeof is !== "function") {
      return {
        xsOnly: false,
        smOnly: false,
        mdOnly: false,
        lgUp: true,
        touchDown: false,
        phoneDown: false,
      };
    }

    return {
      xsOnly: is("xsOnly"),
      smOnly: is("smOnly"),
      mdOnly: is("mdOnly"),
      lgUp: is("lgUp"),
      touchDown: is("touchDown"),
      phoneDown: is("phoneDown"),
    };
  },

  disableBackHomeLink() {
    if (backHomeLink) {
      gsap.set(backHomeLink, { pointerEvents: "none" });
    }
  },

  enableBackHomeLink() {
    if (backHomeLink) {
      gsap.set(backHomeLink, { clearProps: "pointerEvents" });
    }
  },
  menuBackHomeLink() {
    if (backHomeLink) {
      backHomeLink.setAttribute("data-custom", "menu");
    }
  },

  buttonBackHomeLink() {
    if (backHomeLink) {
      backHomeLink.setAttribute("data-custom", "button");
    }
  },

  disableBurgerClick() {
    if (burger) {
      gsap.set(burger, { pointerEvents: "none" });
    }
  },

  enableBurgerClick() {
    if (burger) {
      gsap.set(burger, { clearProps: "pointerEvents" });
    }
  },

  burgerHover() {
    if (
      !burger ||
      !burgerElements.lineTop ||
      !burgerElements.lineBottom ||
      !burgerElements.btn ||
      !burgerElements.label ||
      !burgerElements.burgerLabel
    )
      return;

    const bp = this.bp();
    const isMobile = !!bp.touchDown;
    const hoverTl = gsap.timeline({ paused: true });
    const clickTl = gsap.timeline({ paused: true });
    const resetTl = gsap.timeline({ paused: true });

    // Hover Animation (solo desktop)
    hoverTl
      .to(burgerElements.btn, { scale: 0.6, duration: 0.4, ease: "power2.out" })
      .to(
        burgerElements.label,
        { x: -5, duration: 0.3, ease: "power2.out" },
        "<"
      )
      .to(
        [burgerElements.lineTop, burgerElements.lineBottom],
        { scale: 1, duration: 0.4, ease: "power2.out" },
        "<"
      );

    // Click Animation
    clickTl
      .to(burgerElements.btn, {
        scale: 1,
        duration: 1,
        ease: "back.out(2)",
      })
      .to(
        burgerElements.lineBottom,
        { scale: 1, y: -3, rotateZ: 45, duration: 0.3, ease: "none" },
        "<"
      )
      .to(
        burgerElements.lineTop,
        { scale: 1, y: 3, rotateZ: -45, duration: 0.3, ease: "none" },
        "<"
      )
      .to(
        burgerElements.burgerLabel,
        {
          "--clip-r": "90%",
          "--clip-l": "10%",
          ease: "power1.out",
          duration: 0.8,
        },
        0.1
      )
      .to(
        burgerElements.label,
        { x: 0, duration: 0.3, ease: "power2.out" },
        "<"
      );

    // Reset Animation (differenziato)
    if (isMobile) {
      resetTl
        .to(
          burgerElements.btn,
          { scale: 0.6, duration: 0.4, ease: "power2.out" },
          0
        )
        .to(
          [burgerElements.lineTop, burgerElements.lineBottom],
          { y: 0, rotateZ: 0, duration: 0.4, ease: "power2.out" },
          "<"
        );
    } else {
      resetTl
        .to(
          burgerElements.btn,
          { scale: 0.3, duration: 0.4, ease: "power2.out" },
          0
        )
        .to(
          [burgerElements.lineTop, burgerElements.lineBottom],
          { scale: 0, y: 0, rotateZ: 0, duration: 0.4, ease: "power2.out" },
          "<"
        );
    }

    resetTl.to(
      burgerElements.burgerLabel,
      { "--clip-r": "0%", "--clip-l": "0%", duration: 0.3, ease: "power2.out" },
      "<"
    );

    // Hover events (solo desktop)
    if (!isMobile) {
      burger.addEventListener("mouseenter", () => {
        if (!window.isNavOpen && !window.isAnimating) hoverTl.play();
      });

      burger.addEventListener("mouseleave", () => {
        if (!window.isNavOpen && !window.isAnimating) hoverTl.reverse();
      });
    }

    // Click
    burger.addEventListener("click", () => {
      if (window.isAnimating) return;

      if (window.isNavPageOpen && window.headerAnimation.closePageNav) {
        window.headerAnimation.closePageNav();
      }

      if (!window.isNavOpen) {
        hoverTl.pause(0);
        clickTl.play(0);
        window.headerAnimation.openMenu();
      } else {
        window.headerAnimation.closeMenu();
      }
    });

    // ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && window.isNavOpen && !window.isAnimating) {
        window.headerAnimation.closeMenu();
      }
    });

    // Rende accessibili le timeline da fuori
    this.hoverTl = hoverTl;
    this.clickTl = clickTl;
    this.resetTl = resetTl;
  },

  openMenu() {
    this.openTL?.play(0);
    this.hoverTl?.pause(); // disattiva eventuale hover
  },

  closeMenu() {
    const bp = this.bp();
    const isMobile = !!bp.touchDown;
    this.closeTL?.play(0);
    this.clickTl?.reverse(0);
    this.clickTl?.eventCallback("onReverseComplete", null); // reset callback precedente

    this.clickTl?.eventCallback("onReverseComplete", () => {
      if (!isMobile && burger.matches(":hover")) {
        this.hoverTl?.play(0); // solo su desktop e se siamo sopra, torna in hover
      } else {
        this.resetTl?.play(0); // altrimenti reset completo
      }
    });
  },

  closeMenuBarba(onEnter, opts = {}) {
    const bp = this.bp();
    const isMobile = !!bp.touchDown;

    this._menuBarbaEnterHook = typeof onEnter === "function" ? onEnter : null;
    this._menuBarbaEnterPlayed = false;
    this._menuBarbaNextRoot = opts.nextRoot || null;

    this.closeTLBarba?.play(0);
    this.clickTl?.reverse(0);
    this.clickTl?.eventCallback("onReverseComplete", null);

    this.clickTl?.eventCallback("onReverseComplete", () => {
      if (!isMobile && burger.matches(":hover")) {
        this.hoverTl?.play(0);
      } else {
        this.resetTl?.play(0);
      }
    });
  },

  initNav() {
    const bp = this.bp();
    const isTouch = !!bp.touchDown;

    const nav = document.getElementById("nav");
    const navWrapper = document.getElementById("nav-wrapper");

    if (!burger || !backHomeLink || !patternGridElements.wrapper || !navWrapper)
      return;

    const navBackground = patternGridElements.wrapper;
    const squares = gsap.utils.toArray(patternGridElements.squares);
    const btnLink = navWrapper.querySelectorAll(".menu-item-label");
    const navIcon = navWrapper.querySelectorAll(".nav-btn-icon-hov");
    const imgBackground = navWrapper.querySelector(".nav-background");
    const footerNav = navWrapper.querySelector(".footer-nav");
    const imgContainer = navWrapper.querySelector(".menu-img-container");

    const uiCloseTargets = [imgBackground, imgContainer].filter(Boolean);

    if (
      !nav ||
      !navBackground ||
      !btnLink.length ||
      !navIcon.length ||
      !footerNav ||
      !squares.length
    )
      return;

    const duration = 0.6;
    const staggerAmount = 0.2;

    const gridTL = gsap.timeline();
    const uiTL = gsap.timeline();
    const txtTL = gsap.timeline();

    this.openTL = gsap.timeline({
      paused: true,
      onStart: () => {
        window.isAnimating = true;
        window.isNavOpen = true;
        this.disableBackHomeLink();
        this.disableBurgerClick();
        handleBlockScroll();
        gsap.set(squares, {
          parseTransform: true,
          y: 100,
          scale: 0,
        });
        nav.classList.add("is-visible");
        gsap.set(navBackground, { visibility: "visible" });

        if (window.isUiReady) {
          window.pageTrigger?.setBrandOpen(false);
        }
      },
      onComplete: () => {
        window.isAnimating = false;
        if (burger) {
          burger.setAttribute("aria-expanded", "true");
          burger.setAttribute("aria-label", "Chiudi il Menu");
        }
        this.menuBackHomeLink();
        this.enableBackHomeLink();
        this.enableBurgerClick();
      },
    });

    this.closeTL = gsap.timeline({
      paused: true,
      onStart: () => {
        window.isAnimating = true;
        this.disableBackHomeLink();
        this.disableBurgerClick();
      },
      onComplete: () => {
        window.isAnimating = false;
        window.isNavOpen = false;
        handleUnblockScroll();
        gsap.set([navBackground, nav, btnLink], { clearProps: "all" });
        nav.classList.remove("is-visible");
        this.buttonBackHomeLink();
        this.enableBackHomeLink();
        this.enableBurgerClick();
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Apri il Menu");
      },
    });

    this.closeTLBarba = gsap.timeline({
      paused: true,
      onStart: () => {
        window.isAnimating = true;
        this.disableBackHomeLink();
        this.disableBurgerClick();
      },
      onComplete: () => {
        window.isAnimating = false;
        window.isNavOpen = false;
        handleUnblockScroll();

        gsap.set([navBackground, nav, btnLink], { clearProps: "all" });

        nav.classList.remove("is-visible");
        this.buttonBackHomeLink();
        this.enableBackHomeLink();
        this.enableBurgerClick();

        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Apri il Menu");

        if (this._menuBarbaNextRoot) {
          window.pageTrigger?.unlockAfterBarba(this._menuBarbaNextRoot);
          this._menuBarbaNextRoot = null;
        }
      },
    });
    this.openTL.add(gridTL, 0).add(txtTL, 0.5).add(uiTL, 0);

    gridTL
      .to(squares, {
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power1.inOut",
        stagger: {
          amount: staggerAmount,
          from: "center",
          axis: "x",
          grid: "auto",
        },
      })
      .to(
        squares,
        {
          borderRadius: "0px",
          borderColor: "transparent",
          duration: 0.4,
          ease: "linear",
          stagger: {
            amount: staggerAmount,
            from: "end",
            axis: "y",
            grid: "auto",
          },
        },
        0.2
      );

    txtTL
      .to(btnLink, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: {
          amount: 0.2,
          from: "end",
        },
      })
      .to(navIcon, { opacity: 1, duration: 0.6, ease: "power2.out" }, "<+=0.4")
      .to(
        footerNav,
        {
          y: "0%",
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.6"
      );

    uiTL.to(imgBackground, {
      opacity: 0.1,
      duration: 0.8,
      ease: "linear",
    });

    if (!isTouch && imgContainer) {
      uiTL.to(
        imgContainer,
        {
          opacity: 1,
          duration: 0.35,
          ease: "power1.inOut",
        },
        0.4
      );
    }

    this.closeTL
      .to(btnLink, {
        y: 100,
        duration: 0.4,
        ease: "power2.out",
        stagger: {
          amount: 0.1,
          from: "end",
        },
      })
      .to(navIcon, { opacity: 0, duration: 0.4, ease: "power2.out" }, "<");
    if (uiCloseTargets.length) {
      this.closeTL.to(
        uiCloseTargets,
        {
          opacity: 0,
          duration: duration,
          ease: "linear",
        },
        "<"
      );
    }
    this.closeTL
      .to(
        footerNav,
        {
          y: "110%",
          duration: 0.5,
          ease: "power2.out",
        },
        "<"
      )
      .to(
        squares,
        {
          borderRadius: "",
          borderColor: "#00d37f",
          duration: 0.2,
          ease: "linear",
          stagger: {
            amount: staggerAmount,
            from: "edge",
            axis: "y",
            grid: "auto",
          },
        },
        0
      )
      .to(
        squares,
        {
          scale: 0,
          duration: duration,
          ease: "power2.out",
          stagger: {
            amount: staggerAmount,
            from: "random",
            grid: "auto",
          },
        },
        "-=0.4"
      );

    this.closeTL.add(() => {
      if (!window.isUiReady) return;
      window.pageTrigger?.setBrandClosed(false);
    }, 0.2);

    const menuEnterLead = 0.2;

    this.closeTLBarba
      .to(btnLink, {
        y: 100,
        duration: 0.4,
        ease: "power2.out",
        stagger: {
          amount: 0.1,
          from: "end",
        },
      })
      .to(navIcon, { opacity: 0, duration: 0.4, ease: "power2.out" }, "<");
    if (uiCloseTargets.length) {
      this.closeTLBarba.to(
        uiCloseTargets,
        {
          opacity: 0,
          duration: duration,
          ease: "linear",
        },
        "<"
      );
    }
    this.closeTLBarba
      .to(
        footerNav,
        {
          y: "110%",
          duration: 0.5,
          ease: "power2.out",
        },
        "<"
      )
      .to(
        squares,
        {
          borderRadius: "",
          borderColor: "#00d37f",
          duration: 0.2,
          ease: "linear",
          stagger: {
            amount: staggerAmount,
            from: "end",
            axis: "y",
            grid: "auto",
          },
        },
        0
      )
      .to(
        squares,
        {
          y: "-100%",
          scale: 0,
          duration: duration,
          ease: "power2.out",
          stagger: {
            amount: staggerAmount,
            from: "end",
            axis: "y",
            grid: "auto",
          },
        },
        "-=0.4"
      )
      .add(() => {
        if (this._menuBarbaEnterPlayed) return;
        this._menuBarbaEnterPlayed = true;
        this._menuBarbaEnterHook?.();
      }, `-=${menuEnterLead}`);
  },

  initMenuHover() {
    const bp = this.bp();
    const isMobile = !!bp.touchDown;

    const allImgs = document.querySelectorAll(".img-menu");

    const hideAllImgs = () => {
      if (isMobile) return;
      allImgs.forEach((el) => {
        if (!el) return;
        gsap.killTweensOf(el);
        gsap.to(el, {
          opacity: 0,
          scale: 1,
          filter: "blur(20px)",
          clipPath: "inset(50% 50% 50% 50%)",
          duration: 0.45,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    };

    const showImg = (img) => {
      if (isMobile || !img) return;

      allImgs.forEach((el) => {
        if (!el || el === img) return;
        gsap.killTweensOf(el);
        gsap.to(el, {
          opacity: 0,
          scale: 1,
          filter: "blur(20px)",
          clipPath: "inset(50% 50% 50% 50%)",
          duration: 0.45,
          ease: "power2.out",
          overwrite: "auto",
        });
      });

      gsap.killTweensOf(img);
      gsap.fromTo(
        img,
        {
          opacity: 0,
          scale: 1,
          filter: "blur(20px)",
          clipPath: "inset(50% 50% 50% 50%)",
        },
        {
          opacity: 1,
          scale: 1.05,
          filter: "blur(0px)",
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        }
      );
    };

    hideAllImgs();

    document.querySelectorAll(".menu-link-primary").forEach((btnNavbar) => {
      const text = btnNavbar.querySelector(".menu-item-label");
      const icon = btnNavbar.querySelector(".nav-btn-icon-hov");
      const imgId = btnNavbar.getAttribute("data-img-id");
      const targetImg = imgId ? document.getElementById(imgId) : null;

      if (!text || !icon) return;

      text.style.setProperty("--stop1-btn-nav", "100%");
      text.style.setProperty("--stop2-btn-nav", "0%");
      text.style.setProperty("--stop3-btn-nav", "100%");

      const iconDur = isMobile ? 0.18 : 0.3;
      const textDur = isMobile ? 0.22 : 0.4;
      const iconEase = isMobile ? "power1.out" : "power2.out";
      const textEase = isMobile ? "power1.out" : "power2.inOut";

      const tl = gsap.timeline({ paused: true });
      let mobileResetDC = null;

      tl.to(icon, {
        transformOrigin: "bottom left",
        scale: 1,
        duration: iconDur,
        ease: iconEase,
      }).to(
        text,
        {
          "--stop1-btn-nav": "0%",
          duration: textDur,
          ease: textEase,
        },
        "<"
      );

      function handleEnter() {
        tl.play(0);
        showImg(targetImg);
      }

      function handleLeave() {
        tl.reverse();
        hideAllImgs();
      }

      function handleMobileClick() {
        if (!isMobile) return;

        mobileResetDC?.kill();
        tl.play(0);
      }

      btnNavbar.addEventListener("mouseenter", handleEnter);
      btnNavbar.addEventListener("mouseleave", handleLeave);

      if (isMobile) {
        btnNavbar.addEventListener("click", handleMobileClick);
      }
    });
  },

  init: function () {
    this.initNav();
    this.burgerHover();
    this.initMenuHover();
  },
};
// =====================================================
// Rapicom — secondSectionAnimation (solo #NetCenter, lgUp)
// =====================================================
window.secondSectionAnimation = window.secondSectionAnimation || {
  // helper BP (usa window.bp se c’è, altrimenti matchMedia)
  bp: function () {
    const is = window.bp?.is;
    if (typeof is !== "function") {
      // se bp non c'è, non blocco nulla: assumo desktop (safe)
      return { lgUp: true, touchDown: false, phoneDown: false };
    }

    return {
      xsOnly: is("xsOnly"),
      smOnly: is("smOnly"),
      mdOnly: is("mdOnly"),
      lgUp: is("lgUp"),
      touchDown: is("touchDown"), // (max-width: 991px)
      phoneDown: is("phoneDown"), // (max-width: 767px)
    };
  },
  _cleanups: [],

  _pushCleanup: function (fn) {
    if (typeof fn !== "function") return fn;
    this._cleanups.push(fn);
    return fn;
  },

  _splitChars: function (el) {
    if (!el) return [];
    if (!window.SplitText) return [el];

    try {
      el.__splitChars?.revert?.();
    } catch (_) {}

    const sp = SplitText.create(el, { type: "chars", autoSplit: true });
    el.__splitChars = sp;

    this._pushCleanup(() => {
      try {
        sp.revert();
      } catch (_) {}
      try {
        delete el.__splitChars;
      } catch (_) {
        el.__splitChars = null;
      }
    });

    return sp.chars || [el];
  },

  _splitLines: function (el) {
    if (!el) return [];
    if (!window.SplitText) return [el];

    try {
      el.__splitLines?.revert?.();
    } catch (_) {}

    const sp = SplitText.create(el, { type: "lines", autoSplit: true });
    el.__splitLines = sp;

    this._pushCleanup(() => {
      try {
        sp.revert();
      } catch (_) {}
      try {
        delete el.__splitLines;
      } catch (_) {
        el.__splitLines = null;
      }
    });

    return sp.lines || [el];
  },

  _killMaybe: function (obj) {
    try {
      obj?.kill?.();
    } catch (_) {}
  },

  cleanup: function (root) {
    const scope = root || document.querySelector("#NetCenter") || document;

    // cleanup custom registrati nel modulo
    if (Array.isArray(this._cleanups) && this._cleanups.length) {
      const fns = this._cleanups.splice(0);
      fns.forEach((fn) => {
        try {
          fn();
        } catch (_) {}
      });
    }

    // kill tl / st locali card1
    const card1 = scope.querySelector?.("#card1");
    if (card1) {
      this._killMaybe(card1.__card1HeadTl);
      this._killMaybe(card1.__card1DeviceTl);
      this._killMaybe(card1.__card1HeadST);
      this._killMaybe(card1.__card1DeviceST);
      card1.__card1HeadTl = null;
      card1.__card1DeviceTl = null;
      card1.__card1HeadST = null;
      card1.__card1DeviceST = null;
      this._killMaybe(card2.__card2MasterTl);
      card2.__card2MasterTl = null;
    }

    // kill st locali card2
    const card2 = scope.querySelector?.("#card2");
    if (card2) {
      (card2.__card2ItemSTs || []).forEach((st) => this._killMaybe(st));
      (card2.__card2AutoItemSTs || []).forEach((st) => this._killMaybe(st));
      this._killMaybe(card2.__card2LoopST);

      card2.__card2ItemSTs = [];
      card2.__card2AutoItemSTs = [];
      card2.__card2LoopST = null;
    }

    // reset flag per rebinding observer/bind
    scope
      .querySelectorAll?.("[data-hotspot-observed]")
      .forEach((el) => el.removeAttribute("data-hotspot-observed"));

    scope
      .querySelectorAll?.("[data-ring-bound]")
      .forEach((el) => el.removeAttribute("data-ring-bound"));
  },

  // -------------------------------------------------
  // 1) HEADER (Desktop + TouchDown)
  // -------------------------------------------------
  header: function () {
    const bp = this.bp();

    const section = document.querySelector("#NetCenter");
    if (!section) return;

    const header = section.querySelector(".section-header");
    if (!header) return;

    const line = header.querySelector(".generic-line");
    const h3 = header.querySelector(".h-rap");
    const pars = header.querySelectorAll(".par");
    if (!h3) return;

    // h3 sempre “lines”
    const h3Lines = this._splitLines(h3);

    // par: desktop -> lines, touchDown -> elementi (niente split)
    let parTargets = [];
    if (bp.touchDown) {
      parTargets = Array.from(pars);
    } else {
      pars.forEach((p) => parTargets.push(...this._splitLines(p)));
    }

    // init state
    gsap.set(h3Lines, { opacity: 0, y: 50 });

    if (bp.touchDown) {
      gsap.set(parTargets, { opacity: 0 });
    } else {
      gsap.set(parTargets, { opacity: 0, y: 20 });
    }

    const ease = bp.touchDown ? "power2.inOut" : "power1.inOut";

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: header,
        start: bp.touchDown ? "top 70%" : "top 85%",
        once: true,
      },
    });

    if (line) {
      tl.to(line, { scaleX: 1, ease, duration: 0.5 }, bp.phoneDown ? 0.8 : 0.3);
    }

    tl.to(h3Lines, { opacity: 1, y: 0, stagger: 0.08, ease, duration: 0.6 }, 0);

    if (bp.touchDown) {
      tl.to(
        parTargets,
        { opacity: 1, ease, duration: 0.6, stagger: 0.08 },
        0.2
      );
    } else {
      tl.to(
        parTargets,
        { opacity: 1, y: 0, ease, duration: 0.6, stagger: 0.1 },
        0.2
      );
    }
  },

  gridCardShellRingInit: function (root) {
    if (!this.bp?.().lgUp) return;
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;

    const scope = root || document;
    const shells = Array.from(scope.querySelectorAll(".grid-card-shell"));
    if (!shells.length) return;

    if (!window.pageSpecificListeners) window.pageSpecificListeners = [];

    shells.forEach((shell) => {
      if (shell.dataset.ringBound === "1") return;
      shell.dataset.ringBound = "1";

      let W = 0,
        H = 0;
      let spot = 0;

      let tx = 0,
        ty = 0;
      let cx = 0,
        cy = 0;

      let raf = 0;
      let inside = false;

      const oTo = gsap.quickTo(shell, "--spot-o", {
        duration: 0.22,
        ease: "power1.out",
      });

      const measure = () => {
        const nw = shell.clientWidth || 0;
        const nh = shell.clientHeight || 0;
        if (!nw || !nh) return;

        // evita “micro flash” da RO se non cambia nulla
        if (nw === W && nh === H && spot) return;

        W = nw;
        H = nh;

        const cs = getComputedStyle(shell);
        const scale = parseFloat(cs.getPropertyValue("--spotScale")) || 1.15;
        const minS = parseFloat(cs.getPropertyValue("--spotMin")) || 360;
        const maxS = parseFloat(cs.getPropertyValue("--spotMax")) || 760;

        const diag = Math.hypot(W, H);
        spot = Math.round(Math.min(maxS, Math.max(minS, diag * scale)));

        shell.style.setProperty("--spot", `${spot}px`);
      };

      const setPos = (x, y) => {
        shell.style.setProperty("--px", `${x.toFixed(1)}px`);
        shell.style.setProperty("--py", `${y.toFixed(1)}px`);
      };

      const tick = () => {
        raf = 0;
        if (!inside) return;

        const k = 0.16; // burro
        cx += (tx - cx) * k;
        cy += (ty - cy) * k;

        setPos(cx, cy);
        raf = requestAnimationFrame(tick);
      };

      const setTargetFromEvent = (e) => {
        const r = shell.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;

        // proiezione sul bordo
        const cx0 = W * 0.5;
        const cy0 = H * 0.5;

        let dx = x - cx0;
        let dy = y - cy0;

        if (dx === 0 && dy === 0) {
          dx = 1;
          dy = -1;
        }

        const sx = Math.abs(dx) / (W * 0.5);
        const sy = Math.abs(dy) / (H * 0.5);
        const t = 1 / Math.max(sx, sy);

        tx = cx0 + dx * t;
        ty = cy0 + dy * t;
      };

      const park = () => {
        // “alto-destra” (puoi cambiare se vuoi)
        setPos(W, 0);
        cx = tx = W;
        cy = ty = 0;
      };

      const onEnter = (e) => {
        inside = true;
        measure();
        setTargetFromEvent(e);

        cx = tx;
        cy = ty; // no scatto
        setPos(cx, cy);

        oTo(1);
        if (!raf) raf = requestAnimationFrame(tick);
      };

      const onMove = (e) => {
        if (!inside) return;
        setTargetFromEvent(e);
        if (!raf) raf = requestAnimationFrame(tick);
      };

      const onLeave = () => {
        inside = false;
        oTo(0);
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        park();
      };

      shell.addEventListener("pointerenter", onEnter, { passive: true });
      shell.addEventListener("pointermove", onMove, { passive: true });
      shell.addEventListener("pointerleave", onLeave, { passive: true });

      window.pageSpecificListeners.push(
        { element: shell, event: "pointerenter", handler: onEnter },
        { element: shell, event: "pointermove", handler: onMove },
        { element: shell, event: "pointerleave", handler: onLeave }
      );

      if (window.ResizeObserver) {
        const ro = new ResizeObserver(measure);
        ro.observe(shell);
        shell.__ringRO = ro;
      }

      // init
      measure();
      park();
      shell.style.setProperty("--spot-o", "0");
    });
  },

  // -------------------------------------------------
  // Hotspot SVG sync + DrawSVG (no getTotalLength)
  // -------------------------------------------------
  syncHotspotSvg: function (box) {
    // dimensioni LAYOUT (non influenzate da scale/rotate)
    const w = Math.max(0, Math.round(box.clientWidth || box.offsetWidth || 0));
    const h = Math.max(
      0,
      Math.round(box.clientHeight || box.offsetHeight || 0)
    );
    if (!w || !h) return false;

    const br = getComputedStyle(box).borderTopLeftRadius;
    const r = Math.max(0, parseFloat(br) || 0);

    const svgs = box.querySelectorAll("svg.hotspot-stroke");
    if (!svgs.length) return false;

    svgs.forEach((svg) => {
      // evita schiacciamenti “strani”
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      // sync di tutti gli stroke dentro questo svg
      const strokes = svg.querySelectorAll(".stroke");
      strokes.forEach((rect) => {
        const sw = parseFloat(getComputedStyle(rect).strokeWidth) || 2.5;

        rect.setAttribute("x", sw / 2);
        rect.setAttribute("y", sw / 2);
        rect.setAttribute("width", Math.max(0, w - sw));
        rect.setAttribute("height", Math.max(0, h - sw));

        const rx = Math.max(0, r - sw / 2);
        rect.setAttribute("rx", rx);
        rect.setAttribute("ry", rx);
      });
    });

    return true;
  },

  setupDrawSvg: function (box) {
    // se DrawSVGPlugin non c'è, non faccio nulla (non rompo la pagina)
    if (!window.DrawSVGPlugin) return;

    const strokes = box.querySelectorAll("svg.hotspot-stroke .stroke");
    if (!strokes.length) return;

    // stato iniziale: completamente nascosto
    gsap.set(strokes, { drawSVG: "0%" });
  },

  _syncAndDraw: function (box) {
    if (!this.syncHotspotSvg(box)) return;

    // dopo il sync il rect cambia -> set drawSVG sullo stato corretto
    this.setupDrawSvg(box);
  },

  hotspotsInit: function (root) {
    if (!this.bp().lgUp) return;
    if (!root) return;

    const boxes = root.querySelectorAll(".hotspot-box");
    if (!boxes.length) return;

    boxes.forEach((box) => this._syncAndDraw(box));

    if (!window.ResizeObserver) return;

    if (!this._hotspotRO) {
      this._hotspotRO = new ResizeObserver((entries) => {
        entries.forEach((entry) => this._syncAndDraw(entry.target));
      });
    }

    boxes.forEach((box) => {
      if (box.dataset.hotspotObserved === "1") return;
      box.dataset.hotspotObserved = "1";
      this._hotspotRO.observe(box);
    });
  },
  animateStrokeIn: function (panel, opts = {}) {
    const strokes = panel.querySelectorAll("svg.hotspot-stroke .stroke");
    if (!strokes.length) return null;

    // reset pulito: sempre da 0
    gsap.set(strokes, { drawSVG: "0%" });

    return gsap.to(strokes, {
      drawSVG: "100%",
      duration: opts.duration ?? 0.6,
      ease: opts.ease ?? "power1.inOut",
      stagger: opts.stagger ?? 0.08,
      overwrite: "auto",
    });
  },

  animateStrokeOut: function (panel, opts = {}) {
    const strokes = panel.querySelectorAll("svg.hotspot-stroke .stroke");
    if (!strokes.length) return null;

    return gsap.to(strokes, {
      drawSVG: "0%",
      duration: opts.duration ?? 0.35,
      ease: opts.ease ?? "power1.inOut",
      overwrite: "auto",
    });
  },

  // -------------------------------------------------
  // 2) CARD1
  // -------------------------------------------------
  card1: function () {
    const bp = this.bp();
    if (!window.gsap || !window.ScrollTrigger) return;

    const section = document.querySelector("#NetCenter");
    if (!section) return;

    const card = section.querySelector("#card1");
    if (!card) return;

    const startHead = bp.phoneDown ? "top 65%" : "top 70%";
    const startDevice = bp.touchDown ? "top 55%" : "top 50%";
    const ease = bp.phoneDown ? "power2.inOut" : "power1.inOut";

    // cleanup locale in caso di re-init
    try {
      card.__card1HeadTl?.kill?.();
      card.__card1DeviceTl?.kill?.();
      card.__card1HeadST?.kill?.();
      card.__card1DeviceST?.kill?.();
    } catch (_) {}

    // ---------- TESTI ----------
    const subH = card.querySelector(".sub-h");
    const h3 = card.querySelector(".h-rap");
    if (!subH || !h3) return;

    const subHChars = this._splitChars(subH);

    gsap.set(subHChars, {
      opacity: 0,
      rotateX: 90,
      transformOrigin: "50% 50% -0.5em",
    });

    gsap.set(h3, { "--txt-mix": "0%" });

    const tlHead = gsap.timeline({ paused: true });
    tlHead
      .to(
        subHChars,
        {
          opacity: 1,
          rotateX: 0,
          stagger: 0.05,
          ease: ease,
          duration: 0.6,
          overwrite: "auto",
        },
        0
      )
      .to(
        h3,
        {
          "--txt-mix": "100%",
          ease: ease,
          duration: 0.6,
          overwrite: "auto",
        },
        0.3
      );

    const stHead = ScrollTrigger.create({
      trigger: card,
      start: startHead,
      once: true,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      onEnter: () => tlHead.play(0),
      onEnterBack: () => tlHead.play(0),
    });

    card.__card1HeadTl = tlHead;
    card.__card1HeadST = stHead;

    // ---------- DEVICE ----------
    const device = card.querySelector(".big-device-group");
    const img = card.querySelector(".net-img");
    const bigDevice = card.querySelector("#big-device");
    if (!device || !img || !bigDevice) return;

    const btnCards = Array.from(bigDevice.querySelectorAll(".btn_card"));

    if (bp.lgUp) {
      this.hotspotsInit(card);
      this.card1BtnMixHover(card, bigDevice, btnCards);
      this.card1DarkMode(card, bigDevice);
      this.card1InfoBox(card, bigDevice);
      this.card1Operatiions(card, bigDevice);
      this.card1Categories(card, bigDevice);
      this.card1Smart(card, bigDevice);
    }

    // stato iniziale robusto
    bigDevice.classList.remove("active");
    delete bigDevice.dataset.deviceReady;

    gsap.set(img, { opacity: 0 });
    gsap.set(btnCards, { opacity: 0 });
    gsap.set(device, { "--glow-strength": "0%" });

    if (bp.touchDown) {
      gsap.set(device, { y: 100 });
    } else {
      gsap.set(device, {
        scale: 0.8,
        rotateX: 75,
        transformOrigin: "50% 50%",
      });
    }

    const finalizeDevice = () => {
      bigDevice.dataset.deviceReady = "1";
      if (bp.lgUp) bigDevice.classList.add("active");
    };

    const revealDeviceNow = () => {
      gsap.killTweensOf([device, img, ...btnCards]);

      if (bp.touchDown) {
        gsap.set(device, { y: 0 });
      } else {
        gsap.set(device, { scale: 1, rotateX: 0 });
      }

      gsap.set(device, { "--glow-strength": "90%" });
      gsap.set(img, { opacity: 1 });
      gsap.set(btnCards, { opacity: 1, x: 0 });

      finalizeDevice();
    };

    let devicePlayed = false;

    const tlDevice = gsap.timeline({
      paused: true,
      onStart: () => {
        devicePlayed = true;
      },
      onComplete: finalizeDevice,
    });

    if (bp.touchDown) {
      tlDevice.to(
        device,
        { y: 0, duration: 0.8, ease: ease, overwrite: "auto" },
        0
      );

      tlDevice.to(
        img,
        { opacity: 1, duration: 0.6, ease: ease, overwrite: "auto" },
        0.1
      );

      tlDevice.to(
        device,
        { "--glow-strength": "90%", duration: 0.6, ease: "linear" },
        0.55
      );
    } else {
      tlDevice.to(
        device,
        {
          scale: 1,
          rotateX: 0,
          duration: 0.8,
          ease: "power1.inOut",
          overwrite: "auto",
        },
        0
      );

      tlDevice.to(
        img,
        {
          opacity: 1,
          duration: 0.8,
          ease: "power1.inOut",
          overwrite: "auto",
        },
        0.1
      );

      tlDevice.to(
        device,
        { "--glow-strength": "90%", duration: 0.8, ease: "linear" },
        0.8
      );
    }

    if (btnCards.length) {
      tlDevice.to(
        btnCards,
        {
          opacity: 1,
          x: 0,
          stagger: 0.08,
          duration: 0.6,
          ease: bp.touchDown ? "power2.inOut" : "power1.inOut",
          overwrite: "auto",
        },
        0.6
      );
    }

    const playDevice = () => {
      if (devicePlayed) return;
      tlDevice.play(0);
    };

    const stDevice = ScrollTrigger.create({
      trigger: card,
      start: startDevice,
      once: true,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      onEnter: playDevice,
      onEnterBack: playDevice,
    });

    card.__card1DeviceTl = tlDevice;
    card.__card1DeviceST = stDevice;

    // fallback:
    // se la card è già in viewport quando inizializziamo,
    // non lasciamo net-img "spenta"
    const syncIfAlreadyVisible = () => {
      if (devicePlayed) return;
      if (ScrollTrigger.isInViewport(card, 0.2)) {
        revealDeviceNow();
        devicePlayed = true;
        try {
          stDevice.kill();
        } catch (_) {}
      }
    };

    requestAnimationFrame(syncIfAlreadyVisible);

    if (document.readyState !== "complete") {
      const onLoad = () => syncIfAlreadyVisible();
      window.addEventListener("load", onLoad, { once: true });

      this._pushCleanup(() => {
        try {
          window.removeEventListener("load", onLoad);
        } catch (_) {}
      });
    }
  },
  // -------------------------------------------------
  // Hover desktop: anima solo --btn-mix del bottone
  // -------------------------------------------------
  card1BtnMixHover: function (card, bigDevice, btnCards) {
    if (!this.bp().lgUp) return;
    if (!btnCards || !btnCards.length) return;

    if (!window.pageSpecificListeners) window.pageSpecificListeners = [];

    if (!bigDevice.__btnMixOffs) bigDevice.__btnMixOffs = [];
    if (bigDevice.dataset.btnMixBound === "1" && bigDevice.__btnMixOffs.length)
      return;
    bigDevice.dataset.btnMixBound = "1";

    const add = (el, type, fn, opts) => {
      if (!el) return () => {};
      el.addEventListener(type, fn, opts);
      const off = () => {
        try {
          el.removeEventListener(type, fn, opts);
        } catch (_) {}
      };
      window.pageSpecificListeners.push(off);
      bigDevice.__btnMixOffs.push(off);
      return off;
    };

    let activeBtn = null;

    // --- Helpers grafici ---
    const setMix = (btn, v) => gsap.set(btn, { "--mix": v, "--btn-mix": v });
    const tweenMix = (btn, v) =>
      gsap.to(btn, {
        "--mix": v,
        "--btn-mix": v,
        duration: 0.22,
        ease: "power1.out",
        overwrite: "auto",
      });
    const setBtnActive = (btn, isActive) => {
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    };

    // --- Reset Totale ---
    const resetAll = () => {
      btnCards.forEach((b) => {
        if (b.__enterTimer) clearTimeout(b.__enterTimer);
        setBtnActive(b, false);
        setMix(b, "0%");
      });

      if (activeBtn) {
        // Chiama il reset profondo della feature
        activeBtn.__featureReset?.();
        activeBtn.__featureLeave?.(); // Safety call
        activeBtn = null;
      }
    };

    bigDevice.__resetFeatures = resetAll;

    btnCards.forEach((b) => {
      setMix(b, "0%");
      setBtnActive(b, false);
    });

    // --- Logica Apertura ---
    const openBtn = (btn) => {
      if (!bigDevice.classList.contains("active")) return;
      if (activeBtn === btn) return; // Già aperto

      // Se c'era un altro bottone aperto, chiudilo e Resettalo
      if (activeBtn) {
        setBtnActive(activeBtn, false);
        tweenMix(activeBtn, "0%");
        activeBtn.__featureReset?.();
        activeBtn.__featureLeave?.();
      }

      setBtnActive(btn, true);
      tweenMix(btn, "100%");

      // *** RESETTA PRIMA DI ENTRARE ***
      // Questo è cruciale: pulisce lo stato "sporco" precedente
      btn.__featureReset?.();

      // Avvia animazione
      btn.__featureEnter?.();

      activeBtn = btn;
    };

    const closeBtn = (btn) => {
      if (activeBtn !== btn) return;
      setBtnActive(btn, false);
      tweenMix(btn, "0%");

      btn.__featureLeave?.();
      activeBtn = null;
    };

    // --- EVENTI CON DEBOUNCE (Ritardo intelligente) ---
    btnCards.forEach((btn) => {
      btn.__enterTimer = null;

      add(btn, "pointerenter", (e) => {
        if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;

        // Pulisci eventuali timer pendenti
        if (btn.__enterTimer) clearTimeout(btn.__enterTimer);

        // ATTESA DI 0.15s (un po' più lunga per sicurezza)
        btn.__enterTimer = setTimeout(() => {
          openBtn(btn);
        }, 150);
      });

      add(btn, "pointerleave", (e) => {
        if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;

        // Se l'utente esce PRIMA che il timer scatti, annulla tutto
        if (btn.__enterTimer) {
          clearTimeout(btn.__enterTimer);
          btn.__enterTimer = null;
        }

        // Chiudi solo se era attivo
        if (activeBtn === btn) {
          closeBtn(btn);
        }
      });

      // Touch / Click (Immediato)
      add(btn, "pointerup", (e) => {
        if (e.pointerType !== "touch") return;
        if (activeBtn === btn) closeBtn(btn);
        else openBtn(btn);
      });

      add(btn, "pointercancel", () => {
        if (btn.__enterTimer) clearTimeout(btn.__enterTimer);
        if (activeBtn === btn) closeBtn(btn);
      });
    });

    const btnArea =
      card.querySelector(".net-feature-controls") ||
      card.querySelector(".bt_card_wrap")?.parentElement;
    if (btnArea) add(btnArea, "mouseleave", () => resetAll());
    add(bigDevice, "mouseleave", () => resetAll());
  },

  setInteractionState: function (interaction, isOpen) {
    if (!interaction) return;
    interaction.hidden = !isOpen;
    interaction.setAttribute("aria-hidden", isOpen ? "false" : "true");
  },

  // -------------------------------------------------
  // DarkMode: TL di prova (overlay opacity + popover)
  // -------------------------------------------------
  card1DarkMode: function (card, bigDevice) {
    if (!this.bp().lgUp) return;

    const btn =
      bigDevice.querySelector('.btn_card[data-target="darkmode"]') ||
      bigDevice.querySelector('.btn_card[aria-controls="feature-darkmode"]');
    const panel = card.querySelector("#feature-darkmode");
    if (!btn || !panel) return;

    const interaction = panel.classList.contains("interaction_box")
      ? panel
      : panel.querySelector(".interaction_box");
    const darkLayer = panel.querySelector(".dash_img[data-box-img]");
    const popover = panel.querySelector(".hotspot-popover");

    if (!darkLayer || !popover) return;
    if (btn.dataset.darkBound === "1") return;
    btn.dataset.darkBound = "1";

    // 1. Dichiarazione variabili (per evitare errori di inizializzazione)
    let tlIn, tlOut;

    // 2. Definizione Reset Sicuro
    const hardReset = () => {
      // Usa il ? per non dare errore se la timeline non esiste ancora
      tlIn?.pause(0);
      tlOut?.pause(0);

      // Reset CSS immediato
      gsap.set(popover, { autoAlpha: 0, y: "3rem" });
      gsap.set(darkLayer, { opacity: 0 });

      this.setInteractionState(interaction, false);
    };

    this.setInteractionState(interaction, false);

    // 3. Creazione Timeline
    tlIn = gsap.timeline({ paused: true });
    tlIn.to(
      darkLayer,
      { opacity: 1, duration: 0.5, ease: "power1.inOut", overwrite: "auto" },
      0
    );
    tlIn.to(
      popover,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: "power1.inOut",
        overwrite: "auto",
      },
      0.08
    );

    tlOut = gsap.timeline({
      paused: true,
      onComplete: () => {
        this.setInteractionState(interaction, false);
      },
    });
    tlOut.to(
      popover,
      {
        autoAlpha: 0,
        y: "3rem",
        duration: 0.25,
        ease: "power1.inOut",
        overwrite: "auto",
      },
      0
    );
    tlOut.to(
      darkLayer,
      { opacity: 0, duration: 0.35, ease: "power1.inOut", overwrite: "auto" },
      0.05
    );

    // 4. Bindings
    btn.__featureReset = hardReset;

    btn.__featureEnter = () => {
      if (!bigDevice.classList.contains("active")) return;
      this.setInteractionState(interaction, true);
      tlIn.restart(true);
    };

    btn.__featureLeave = () => {
      tlIn.pause();
      tlOut.restart(true);
    };

    // 5. Inizializzazione Finale (importante farlo qui in fondo)
    hardReset();
  },
  card1InfoBox: function (card, bigDevice) {
    if (!this.bp().lgUp) return;

    const btn =
      bigDevice.querySelector('.btn_card[data-target="infobox"]') ||
      bigDevice.querySelector('.btn_card[aria-controls="feature-infobox"]');
    const panel = card.querySelector("#feature-infobox");
    if (!btn || !panel) return;
    if (btn.dataset.infoboxBound === "1") return;
    btn.dataset.infoboxBound = "1";

    const interaction = panel.classList.contains("interaction_box")
      ? panel
      : panel.querySelector(".interaction_box");
    const popover = panel.querySelector(".hotspot-popover");
    const baseImg =
      panel.querySelector(".dash-img[data-box-img]:not([data-slide])") ||
      panel.querySelector(".dash_img[data-box-img]:not([data-slide])");

    const getSlideImg = (id) =>
      panel.querySelector(`.dash-img[data-box-img][data-slide="${id}"]`) ||
      panel.querySelector(`.dash_img[data-box-img][data-slide="${id}"]`);
    const getSlideEl = (id) =>
      panel.querySelector(`.hotspot_slide[data-slide="${id}"]`);
    const getStrokes = (id) => {
      const a = panel.querySelectorAll(
        `.hotspot-box[data-slide="${id}"] svg.hotspot-stroke .stroke`
      );
      if (a && a.length) return Array.from(a);
      return [];
    };

    const slides = Array.from(
      panel.querySelectorAll(".hotspot_slide[data-slide]")
    );
    if (!slides.length) return;
    const slideIds = slides
      .map((s) => Number(s.getAttribute("data-slide")))
      .sort((a, b) => a - b);
    const temps = Array.from(panel.querySelectorAll(".temp_item[data-slide]"));

    const p = {
      hold: 3,
      slideIn: 0.7,
      slideOut: 0.55,
      slideXIn: 14,
      slideXOut: 14,
      imgIn: 0.55,
      imgOut: 0.45,
      popIn: 0.5,
      popOut: 0.35,
      strokeIn: 0.85,
      strokeOut: 0.65,
      ease: "power1.inOut",
      overlap: 0.08,
    };
    const canDraw = !!gsap?.plugins?.drawSVG || !!window.DrawSVGPlugin;

    const setStrokeHidden = (strokes) => {
      if (!strokes?.length) return;
      if (canDraw) gsap.set(strokes, { drawSVG: "0% 0%" });
      else
        strokes.forEach((s) =>
          gsap.set(s, {
            strokeDasharray: s.getTotalLength?.() || 100,
            strokeDashoffset: s.getTotalLength?.() || 100,
          })
        );
    };
    const strokeIn = (strokes) => {
      if (!strokes?.length) return gsap.timeline();
      return canDraw
        ? gsap.to(strokes, {
            drawSVG: "0% 100%",
            duration: p.strokeIn,
            ease: p.ease,
            stagger: 0.1,
            overwrite: "auto",
          })
        : gsap.to(strokes, {
            strokeDashoffset: 0,
            duration: p.strokeIn,
            ease: p.ease,
            stagger: 0.1,
            overwrite: "auto",
          });
    };
    const strokeOutForward = (strokes) => {
      if (!strokes?.length) return gsap.timeline();
      return canDraw
        ? gsap.to(strokes, {
            drawSVG: "100% 100%",
            duration: p.strokeOut,
            ease: p.ease,
            stagger: { each: 0.08, from: "end" },
            overwrite: "auto",
          })
        : gsap.to(strokes, {
            strokeDashoffset: (i, t) => t.getTotalLength(),
            duration: p.strokeOut,
            ease: p.ease,
            stagger: { each: 0.08, from: "end" },
            overwrite: "auto",
          });
    };

    // Dichiarazione variabili (Hoisting fix)
    let tlIn, tlOut;
    const state = {
      pos: 0,
      active: false,
      timer: null,
      fillTween: null,
      gotoTl: null,
    };

    // --- HARD RESET (Corretto) ---
    const hardReset = () => {
      // 1. Ferma le timeline principali riavvolgendole a 0.
      // NON usare killTweensOf su elementi gestiti da tlIn/tlOut!
      tlIn?.pause(0);
      tlOut?.pause(0);

      // 2. Uccidi solo le animazioni DINAMICHE (slide)
      state.gotoTl?.kill();
      state.timer?.kill();
      state.fillTween?.kill();
      state.active = false;
      state.pos = 0;

      // 3. Reset CSS (Assicurati che tutto sia invisibile)
      this.setInteractionState(interaction, false);
      if (popover) gsap.set(popover, { autoAlpha: 0, y: "3rem" });
      if (baseImg) gsap.set(baseImg, { opacity: 0 });

      slideIds.forEach((id) => {
        const s = getSlideEl(id),
          im = getSlideImg(id),
          st = getStrokes(id);
        if (s) gsap.set(s, { autoAlpha: 0, x: -p.slideXIn, display: "none" });
        if (im) gsap.set(im, { opacity: 0 });
        if (st.length) setStrokeHidden(st);
      });
      if (temps.length) temps.forEach((t) => gsap.set(t, { "--fill": "0%" }));
    };

    this.setInteractionState(interaction, false);

    // --- GotoPos (Slide Logic) ---
    const gotoPos = (nextPos) => {
      if (!state.active) return;
      state.timer?.kill();
      state.fillTween?.kill();
      state.gotoTl?.kill();
      const nPos =
        ((nextPos % slideIds.length) + slideIds.length) % slideIds.length;
      const prevId = slideIds[state.pos];
      const nextId = slideIds[nPos];
      state.pos = nPos;

      const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
      state.gotoTl = tl;

      // OUT Prev
      if (prevId !== nextId) {
        const prevS = getSlideEl(prevId),
          prevIm = getSlideImg(prevId),
          prevSt = getStrokes(prevId);
        if (prevS)
          tl.to(
            prevS,
            {
              autoAlpha: 0,
              x: p.slideXOut,
              duration: p.slideOut,
              ease: p.ease,
              onComplete: () => gsap.set(prevS, { display: "none" }),
            },
            0
          );
        if (prevIm) tl.to(prevIm, { opacity: 0, duration: p.imgOut }, 0);
        if (prevSt.length) tl.add(strokeOutForward(prevSt), 0);
      }

      // IN Next
      tl.addLabel("in", p.overlap);
      const nextS = getSlideEl(nextId),
        nextIm = getSlideImg(nextId),
        nextSt = getStrokes(nextId);
      if (nextIm)
        tl.fromTo(
          nextIm,
          { opacity: 0 },
          { opacity: 1, duration: p.imgIn, ease: p.ease },
          "in"
        );
      if (nextSt.length) {
        tl.add(() => setStrokeHidden(nextSt), "in");
        tl.add(strokeIn(nextSt), "in");
      }
      if (nextS) {
        gsap.set(nextS, { display: "block" });
        tl.fromTo(
          nextS,
          { autoAlpha: 0, x: -p.slideXIn },
          { autoAlpha: 1, x: 0, duration: p.slideIn, ease: p.ease },
          "in+=0.1"
        );
      }

      const elTemp = panel.querySelector(`.temp_item[data-slide="${nextId}"]`);
      if (elTemp)
        state.fillTween = gsap.to(elTemp, {
          "--fill": "100%",
          duration: p.hold - 0.15,
          ease: "none",
        });
      tl.add(() => {
        state.timer = gsap.delayedCall(p.hold, () => gotoPos(nPos + 1));
      }, "in");
    };

    // --- Creazione Timeline ---
    tlIn = gsap.timeline({ paused: true });
    tlIn.add(() => {
      this.setInteractionState(interaction, true);
    }, 0);
    if (baseImg)
      tlIn.to(
        baseImg,
        { opacity: 1, duration: 0.35, ease: p.ease, overwrite: "auto" },
        0
      );
    if (popover)
      tlIn.to(
        popover,
        {
          autoAlpha: 1,
          y: 0,
          duration: p.popIn,
          ease: p.ease,
          overwrite: "auto",
        },
        0.05
      );
    tlIn.add(() => {
      state.active = true;
      state.pos = 0;
      gotoPos(0);
    }, 0.15);

    tlOut = gsap.timeline({
      paused: true,
      onComplete: () => {
        this.setInteractionState(interaction, false);
      },
    });
    if (popover)
      tlOut.to(
        popover,
        {
          autoAlpha: 0,
          y: "3rem",
          duration: p.popOut,
          ease: p.ease,
          overwrite: "auto",
        },
        0
      );
    if (baseImg)
      tlOut.to(
        baseImg,
        { opacity: 0, duration: 0.3, ease: p.ease, overwrite: "auto" },
        0.15
      );

    btn.__featureReset = hardReset;

    btn.__featureEnter = () => {
      if (!bigDevice.classList.contains("active")) return;
      if (bigDevice.__activeFeatureBtn && bigDevice.__activeFeatureBtn !== btn)
        bigDevice.__activeFeatureBtn.__featureLeave?.();

      bigDevice.__activeFeatureBtn = btn;
      this.setInteractionState(interaction, true);
      tlIn.restart(true);
    };

    btn.__featureLeave = () => {
      tlIn.pause();
      state.active = false;
      state.timer?.kill();
      state.fillTween?.kill();
      state.gotoTl?.kill();

      const curId = slideIds[state.pos];
      const curS = getSlideEl(curId),
        curIm = getSlideImg(curId),
        curSt = getStrokes(curId);

      if (curS)
        gsap.to(curS, {
          autoAlpha: 0,
          x: p.slideXOut,
          duration: p.slideOut,
          ease: p.ease,
        });

      if (curIm) gsap.to(curIm, { opacity: 0, duration: p.imgOut });
      if (curSt.length) strokeOutForward(curSt);

      if (bigDevice.__activeFeatureBtn === btn) {
        bigDevice.__activeFeatureBtn = null;
      }

      tlOut.restart(true);
    };

    // Init finale
    hardReset();

    bigDevice.__infoBox = { in: tlIn, out: tlOut, gotoPos };
  },
  card1Operatiions: function (card, bigDevice) {
    if (!this.bp().lgUp) return;

    const btn =
      bigDevice.querySelector('.btn_card[data-target="operations"]') ||
      bigDevice.querySelector('.btn_card[aria-controls="feature-operations"]');
    const panel = card.querySelector("#feature-operations");
    if (!btn || !panel) return;

    if (btn.dataset.operationsBound === "1") return;
    btn.dataset.operationsBound = "1";

    const interaction = panel.classList.contains("interaction_box")
      ? panel
      : panel.querySelector(".interaction_box");
    const popover = panel.querySelector(".hotspot-popover");
    const baseImg =
      panel.querySelector(".dash-img[data-box-img]:not([data-slide])") ||
      panel.querySelector(".dash_img[data-box-img]:not([data-slide])");

    const getSlideImg = (id) =>
      panel.querySelector(`.dash-img[data-box-img][data-slide="${id}"]`) ||
      panel.querySelector(`.dash_img[data-box-img][data-slide="${id}"]`);
    const getSlideEl = (id) =>
      panel.querySelector(`.hotspot_slide[data-slide="${id}"]`);
    const getStrokes = (id) => {
      const a = panel.querySelectorAll(
        `.hotspot-box[data-slide="${id}"] svg.hotspot-stroke .stroke`
      );
      if (a && a.length) return Array.from(a);
      return [];
    };

    const slides = Array.from(
      panel.querySelectorAll(".hotspot_slide[data-slide]")
    );
    if (!slides.length) return;
    const slideIds = slides
      .map((s) => Number(s.getAttribute("data-slide")))
      .sort((a, b) => a - b);
    const temps = Array.from(panel.querySelectorAll(".temp_item[data-slide]"));

    const p = {
      hold: 3,
      slideIn: 0.7,
      slideOut: 0.55,
      slideXIn: 14,
      slideXOut: 14,
      imgIn: 0.55,
      imgOut: 0.45,
      popIn: 0.5,
      popOut: 0.35,
      strokeIn: 0.85,
      strokeOut: 0.65,
      ease: "power1.inOut",
      overlap: 0.08,
    };
    const canDraw = !!gsap?.plugins?.drawSVG || !!window.DrawSVGPlugin;

    const setStrokeHidden = (strokes) => {
      if (!strokes?.length) return;
      if (canDraw) gsap.set(strokes, { drawSVG: "0% 0%" });
      else
        strokes.forEach((s) =>
          gsap.set(s, {
            strokeDasharray: s.getTotalLength?.() || 100,
            strokeDashoffset: s.getTotalLength?.() || 100,
          })
        );
    };
    const strokeIn = (strokes) => {
      if (!strokes?.length) return gsap.timeline();
      return canDraw
        ? gsap.to(strokes, {
            drawSVG: "0% 100%",
            duration: p.strokeIn,
            ease: p.ease,
            stagger: 0.1,
            overwrite: "auto",
          })
        : gsap.to(strokes, {
            strokeDashoffset: 0,
            duration: p.strokeIn,
            ease: p.ease,
            stagger: 0.1,
            overwrite: "auto",
          });
    };
    const strokeOutForward = (strokes) => {
      if (!strokes?.length) return gsap.timeline();
      return canDraw
        ? gsap.to(strokes, {
            drawSVG: "100% 100%",
            duration: p.strokeOut,
            ease: p.ease,
            stagger: { each: 0.08, from: "end" },
            overwrite: "auto",
          })
        : gsap.to(strokes, {
            strokeDashoffset: (i, t) => t.getTotalLength(),
            duration: p.strokeOut,
            ease: p.ease,
            stagger: { each: 0.08, from: "end" },
            overwrite: "auto",
          });
    };

    // 1. Variabili
    let tlIn, tlOut;
    const state = {
      pos: 0,
      active: false,
      timer: null,
      fillTween: null,
      gotoTl: null,
    };

    // 2. Reset Sicuro
    const hardReset = () => {
      // Pausa sicura delle timeline principali
      tlIn?.pause(0);
      tlOut?.pause(0);

      // Kill solo delle parti dinamiche
      state.gotoTl?.kill();
      state.timer?.kill();
      state.fillTween?.kill();
      state.active = false;
      state.pos = 0;

      // Reset CSS
      this.setInteractionState(interaction, false);
      if (popover) gsap.set(popover, { autoAlpha: 0, y: "3rem" });
      if (baseImg) gsap.set(baseImg, { opacity: 0 });

      slideIds.forEach((id) => {
        const s = getSlideEl(id),
          im = getSlideImg(id),
          st = getStrokes(id);
        if (s) gsap.set(s, { autoAlpha: 0, x: -p.slideXIn, display: "none" });
        if (im) gsap.set(im, { opacity: 0 });
        if (st.length) setStrokeHidden(st);
      });
      if (temps.length) temps.forEach((t) => gsap.set(t, { "--fill": "0%" }));
    };

    this.setInteractionState(interaction, false);

    // Logic...
    const gotoPos = (nextPos) => {
      if (!state.active) return;
      state.timer?.kill();
      state.fillTween?.kill();
      state.gotoTl?.kill();
      const nPos =
        ((nextPos % slideIds.length) + slideIds.length) % slideIds.length;
      const prevId = slideIds[state.pos];
      const nextId = slideIds[nPos];
      state.pos = nPos;

      const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
      state.gotoTl = tl;

      if (prevId !== nextId) {
        const prevS = getSlideEl(prevId),
          prevIm = getSlideImg(prevId),
          prevSt = getStrokes(prevId);
        if (prevS)
          tl.to(
            prevS,
            {
              autoAlpha: 0,
              x: p.slideXOut,
              duration: p.slideOut,
              ease: p.ease,
              onComplete: () => gsap.set(prevS, { display: "none" }),
            },
            0
          );
        if (prevIm) tl.to(prevIm, { opacity: 0, duration: p.imgOut }, 0);
        if (prevSt.length) tl.add(strokeOutForward(prevSt), 0);
      }

      tl.addLabel("in", p.overlap);
      const nextS = getSlideEl(nextId),
        nextIm = getSlideImg(nextId),
        nextSt = getStrokes(nextId);
      if (nextIm)
        tl.fromTo(
          nextIm,
          { opacity: 0 },
          { opacity: 1, duration: p.imgIn, ease: p.ease },
          "in"
        );
      if (nextSt.length) {
        tl.add(() => setStrokeHidden(nextSt), "in");
        tl.add(strokeIn(nextSt), "in");
      }
      if (nextS) {
        gsap.set(nextS, { display: "block" });
        tl.fromTo(
          nextS,
          { autoAlpha: 0, x: -p.slideXIn },
          { autoAlpha: 1, x: 0, duration: p.slideIn, ease: p.ease },
          "in+=0.1"
        );
      }

      const elTemp = panel.querySelector(`.temp_item[data-slide="${nextId}"]`);
      if (elTemp)
        state.fillTween = gsap.to(elTemp, {
          "--fill": "100%",
          duration: p.hold - 0.15,
          ease: "none",
        });
      tl.add(() => {
        state.timer = gsap.delayedCall(p.hold, () => gotoPos(nPos + 1));
      }, "in");
    };

    // 3. Timeline
    tlIn = gsap.timeline({ paused: true });
    tlIn.add(() => {
      this.setInteractionState(interaction, true);
    }, 0);
    if (baseImg)
      tlIn.to(
        baseImg,
        { opacity: 1, duration: 0.35, ease: p.ease, overwrite: "auto" },
        0
      );
    if (popover)
      tlIn.to(
        popover,
        {
          autoAlpha: 1,
          y: 0,
          duration: p.popIn,
          ease: p.ease,
          overwrite: "auto",
        },
        0.05
      );
    tlIn.add(() => {
      state.active = true;
      state.pos = 0;
      gotoPos(0);
    }, 0.15);

    tlOut = gsap.timeline({
      paused: true,
      onComplete: () => {
        this.setInteractionState(interaction, false);
      },
    });
    if (popover)
      tlOut.to(
        popover,
        {
          autoAlpha: 0,
          y: "3rem",
          duration: p.popOut,
          ease: p.ease,
          overwrite: "auto",
        },
        0
      );
    if (baseImg)
      tlOut.to(
        baseImg,
        { opacity: 0, duration: 0.3, ease: p.ease, overwrite: "auto" },
        0.15
      );

    // 4. Bindings
    btn.__featureReset = hardReset;

    btn.__featureEnter = () => {
      if (!bigDevice.classList.contains("active")) return;
      if (bigDevice.__activeFeatureBtn && bigDevice.__activeFeatureBtn !== btn)
        bigDevice.__activeFeatureBtn.__featureLeave?.();

      bigDevice.__activeFeatureBtn = btn;
      this.setInteractionState(interaction, true);
      tlIn.restart(true);
    };

    btn.__featureLeave = () => {
      tlIn.pause();
      state.active = false;
      state.timer?.kill();
      state.fillTween?.kill();
      state.gotoTl?.kill();

      const curId = slideIds[state.pos];
      const curS = getSlideEl(curId),
        curIm = getSlideImg(curId),
        curSt = getStrokes(curId);

      if (curS)
        gsap.to(curS, {
          autoAlpha: 0,
          x: p.slideXOut,
          duration: p.slideOut,
          ease: p.ease,
        });

      if (curIm) gsap.to(curIm, { opacity: 0, duration: p.imgOut });
      if (curSt.length) strokeOutForward(curSt);

      if (bigDevice.__activeFeatureBtn === btn) {
        bigDevice.__activeFeatureBtn = null;
      }

      tlOut.restart(true);
    };

    // 5. Init Finale
    hardReset();

    bigDevice.__operations = { in: tlIn, out: tlOut, gotoPos };
  },
  card1Categories: function (card, bigDevice) {
    if (!this.bp().lgUp) return;
    const btn =
      bigDevice.querySelector('.btn_card[data-target="categories"]') ||
      bigDevice.querySelector('.btn_card[aria-controls="feature-categories"]');
    const panel = card.querySelector("#feature-categories");
    if (!btn || !panel) return;

    const interaction = panel.classList.contains("interaction_box")
      ? panel
      : panel.querySelector(".interaction_box");
    const popover = panel.querySelector(".hotspot-popover");
    const boxImg = panel.querySelector(".dash_img[data-box-img]");
    const strokes = Array.from(
      panel.querySelectorAll("svg.hotspot-stroke .stroke")
    );

    if (btn.dataset.categoriesBound === "1") return;
    btn.dataset.categoriesBound = "1";

    this.setInteractionState(interaction, false);
    gsap.set(popover, { autoAlpha: 0, y: "3rem" });
    if (boxImg) gsap.set(boxImg, { opacity: 0 });
    gsap.set(strokes, { drawSVG: "0% 0%" });

    const tlIn = gsap.timeline({ paused: true });
    tlIn.to(
      strokes,
      {
        drawSVG: "0% 100%",
        duration: 0.6,
        ease: "power1.inOut",
        overwrite: "auto",
      },
      0
    );
    if (boxImg)
      tlIn.to(boxImg, { opacity: 1, duration: 0.35, overwrite: "auto" }, 0.05);
    if (popover)
      tlIn.to(
        popover,
        { autoAlpha: 1, y: 0, duration: 0.5, overwrite: "auto" },
        0.1
      );

    const tlOut = gsap.timeline({
      paused: true,
      onComplete: () => {
        this.setInteractionState(interaction, false);
      },
    });
    tlOut.to(
      strokes,
      {
        drawSVG: "100% 100%",
        duration: 0.45,
        stagger: { each: 0.06, from: "end" },
        overwrite: "auto",
      },
      0
    );
    if (boxImg)
      tlOut.to(boxImg, { opacity: 0, duration: 0.25, overwrite: "auto" }, 0.2);
    if (popover)
      tlOut.to(
        popover,
        { autoAlpha: 0, y: "3rem", duration: 0.25, overwrite: "auto" },
        0
      );

    // --- RESET SENZA DISTRUZIONE ---
    btn.__featureReset = () => {
      // Mettiamo in pausa a 0. Questo resetta le timeline al punto di partenza.
      tlIn.pause(0);
      tlOut.pause(0);

      // Rinforziamo il CSS per sicurezza (in caso tlIn non fosse partita)
      gsap.set(strokes, { drawSVG: "0% 0%" });
      if (boxImg) gsap.set(boxImg, { opacity: 0 });
      if (popover) gsap.set(popover, { autoAlpha: 0, y: "3rem" });

      this.setInteractionState(interaction, false);
    };

    btn.__featureEnter = () => {
      if (!bigDevice.classList.contains("active")) return;
      this.setInteractionState(interaction, true);
      tlIn.restart(true);
    };
    btn.__featureLeave = () => {
      tlIn.pause();
      tlOut.restart(true);
    };
  },
  card1Smart: function (card, bigDevice) {
    if (!this.bp().lgUp) return;

    const btn =
      bigDevice.querySelector('.btn_card[data-target="smart"]') ||
      bigDevice.querySelector('.btn_card[aria-controls="feature-smart"]');
    const panel = card.querySelector("#feature-smart");
    if (!btn || !panel) return;

    const interaction = panel.classList.contains("interaction_box")
      ? panel
      : panel.querySelector(".interaction_box");
    const popover = panel.querySelector(".hotspot-popover");
    const boxImg = panel.querySelector(".dash_img[data-box-img]");
    const strokes = Array.from(
      panel.querySelectorAll("svg.hotspot-stroke .stroke")
    );
    if (!strokes.length) return;

    if (btn.dataset.smartBound === "1") return;
    btn.dataset.smartBound = "1";

    // 1. Variabili
    let tlIn, tlOut;

    // 2. Reset Sicuro
    const hardReset = () => {
      tlIn?.pause(0);
      tlOut?.pause(0);

      gsap.set(strokes, { drawSVG: "0% 0%" });
      if (boxImg) gsap.set(boxImg, { opacity: 0 });
      if (popover) gsap.set(popover, { autoAlpha: 0, y: "3rem" });

      this.setInteractionState(interaction, false);
    };

    this.setInteractionState(interaction, false);

    // 3. Timeline
    tlIn = gsap.timeline({ paused: true });
    tlIn.to(
      strokes,
      {
        drawSVG: "0% 100%",
        duration: 0.6,
        ease: "power1.inOut",
        stagger: 0.08,
        overwrite: "auto",
      },
      0
    );
    if (boxImg)
      tlIn.to(
        boxImg,
        { opacity: 1, duration: 0.35, ease: "power1.inOut", overwrite: "auto" },
        0.05
      );
    if (popover)
      tlIn.to(
        popover,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: "power1.inOut",
          overwrite: "auto",
        },
        0.1
      );

    tlOut = gsap.timeline({
      paused: true,
      onComplete: () => {
        this.setInteractionState(interaction, false);
      },
    });
    tlOut.to(
      strokes,
      {
        drawSVG: "100% 100%",
        duration: 0.45,
        ease: "power1.inOut",
        stagger: { each: 0.06, from: "end" },
        overwrite: "auto",
      },
      0
    );
    if (boxImg)
      tlOut.to(
        boxImg,
        { opacity: 0, duration: 0.25, ease: "power1.inOut", overwrite: "auto" },
        0.2
      );
    if (popover)
      tlOut.to(
        popover,
        {
          autoAlpha: 0,
          y: "3rem",
          duration: 0.25,
          ease: "power1.inOut",
          overwrite: "auto",
        },
        0
      );

    // 4. Bindings
    btn.__featureReset = hardReset;

    btn.__featureEnter = () => {
      if (!bigDevice.classList.contains("active")) return;
      this.setInteractionState(interaction, true);
      tlIn.restart(true);
    };

    btn.__featureLeave = () => {
      tlIn.pause();
      tlOut.restart(true);
    };

    // 5. Init finale
    hardReset();
  },
  // CARD2 ====================================================
  card2: function () {
    const bp = this.bp();
    if (!window.gsap || !window.ScrollTrigger) return;

    const section = document.querySelector("#NetCenter");
    if (!section) return;

    const card = section.querySelector("#card2");
    if (!card) return;

    try {
      card.__card2MasterTl?.kill?.();
      card.__card2MasterTl = null;
    } catch (_) {}

    const items = Array.from(
      card.querySelectorAll("#card2-item1, #card2-item2, #card2-item3")
    );
    items.sort((a, b) => a.id.localeCompare(b.id));
    if (!items.length) return;

    // =========================
    // MODE
    // lgUp: items affiancati (sequenza)
    // !lgUp (mdOnly + phoneDown): items stacked (trigger per item)
    // =========================
    const stacked = !bp.lgUp;
    const startStackHead = bp.phoneDown ? "top 65%" : "top 70%";
    const ease = bp.phoneDown ? "power2.inOut" : "power1.inOut";

    // =========================
    // CLEANUP (switch desktop <-> stacked)
    // =========================
    if (card.__card2ItemSTs?.length) {
      card.__card2ItemSTs.forEach((st) => st.kill());
    }
    card.__card2ItemSTs = [];

    if (card.__card2AutoItemSTs?.length) {
      card.__card2AutoItemSTs.forEach((st) => st.kill());
    }
    card.__card2AutoItemSTs = [];

    if (card.__card2LoopST) {
      card.__card2LoopST.kill();
      card.__card2LoopST = null;
    }

    // =========================
    // DESKTOP master TL + sequenza
    // =========================
    let tlMaster = null;

    const itemGap = 1;
    const itemStart = {
      "card2-item1": 0.0,
      "card2-item2": 0.6,
      "card2-item3": 0.8,
    };

    const autoLoops = []; // { tl, reset }
    let inView = false;
    let loopsReady = false;

    const startLoops = () => {
      autoLoops.forEach(({ tl, reset }) => {
        reset();
        tl.play(0);
      });
    };

    const stopLoops = () => {
      autoLoops.forEach(({ tl, reset }) => {
        tl.pause(0);
        reset();
      });
    };

    const maybeStartLoops = () => {
      if (inView && loopsReady) startLoops();
    };

    if (!stacked) {
      tlMaster = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: "top 70%",
          once: true,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
        },
      });

      card.__card2MasterTl = tlMaster;
    }

    // =========================
    // ITEMS
    // =========================
    items.forEach((item, i) => {
      const startAt = !stacked ? itemStart[item.id] ?? i * itemGap : 0;

      const subH = item.querySelector(".sub-h");
      const h3 = item.querySelector(".h-rap");
      const par = item.querySelector(".par");
      if (!subH || !h3) return;

      const subHChars = this._splitChars(subH);

      gsap.set(subHChars, {
        opacity: 0,
        rotateX: 90,
        transformOrigin: "50% 50% -0.5em",
      });
      gsap.set(h3, { "--txt-mix": "0%" });
      if (par) gsap.set(par, { "--txt-mix": "0%" });

      const itemTl = gsap.timeline(
        stacked
          ? {
              scrollTrigger: {
                trigger: item,
                start: startStackHead,
                once: true,
              },
            }
          : {}
      );

      if (stacked && itemTl.scrollTrigger) {
        card.__card2ItemSTs.push(itemTl.scrollTrigger);
      }

      itemTl
        .to(
          subHChars,
          {
            opacity: 1,
            rotateX: 0,
            stagger: 0.05,
            ease: ease,
            duration: 0.6,
          },
          0
        )
        .to(
          h3,
          {
            "--txt-mix": "100%",
            ease: "power1.inOut",
            duration: 0.6,
          },
          0.2
        );

      if (par) {
        itemTl.to(
          par,
          {
            "--txt-mix": "100%",
            ease: "power1.inOut",
            duration: 0.8,
          },
          0.6
        );
      }

      // -------------------------------------------------
      // EXTRA: ITEM1 (mm stack)
      // -------------------------------------------------
      if (item.id === "card2-item1") {
        const mm1 = item.querySelector(".mm-1");
        const mm2 = item.querySelector(".mm-2");
        const mm3 = item.querySelector(".mm-3");
        const mm4 = item.querySelector(".mm-4");
        const clip1 =
          mm1?.querySelector(".clip-s1") || item.querySelector(".clip-s1");

        // tablet + mobile
        const isTouch = !bp.lgUp;

        // valori X target
        const X1 = isTouch ? "50%" : "30%";
        const X2 = isTouch ? "10%" : "0%";
        const X3 = isTouch ? "-20%" : "-20%";
        const X4 = isTouch ? "-50%" : "-40%";

        if (mm1) gsap.set(mm1, { x: "0%" });

        const setStackBase = (el) => {
          if (!el) return;
          gsap.set(el, { opacity: 0, x: "0%" });
        };
        setStackBase(mm2);
        setStackBase(mm3);
        setStackBase(mm4);
        if (clip1) gsap.set(clip1, { opacity: 0 });

        const mmTl = gsap.timeline();

        if (mm1) {
          mmTl.to(
            mm1,
            { x: X1, duration: 0.6, ease: "power1.inOut", overwrite: "auto" },
            0
          );
        }

        if (mm2) {
          mmTl.to(
            mm2,
            {
              opacity: 1,
              x: X2,
              duration: 0.6,
              ease: "power1.inOut",
              overwrite: "auto",
            },
            0
          );
        }

        if (mm3) {
          mmTl.to(
            mm3,
            {
              opacity: 1,
              x: X3,
              duration: 0.6,
              ease: "power1.inOut",
              overwrite: "auto",
            },
            0
          );
        }

        if (mm4) {
          mmTl.to(
            mm4,
            {
              opacity: 1,
              x: X4,
              duration: 0.6,
              ease: "power1.inOut",
              overwrite: "auto",
            },
            0
          );
        }

        if (clip1) {
          mmTl.to(
            clip1,
            { opacity: 1, duration: 0.8, ease: "linear", overwrite: "auto" },
            0
          );
        }

        // attacca mmTl dentro itemTl
        itemTl.add(mmTl, 0.52);
      }

      // -------------------------------------------------
      // EXTRA: ITEM2 (linee + gruppi + loop automatico)
      // -------------------------------------------------
      if (item.id === "card2-item2") {
        const g1UseY = !bp.lgUp; // tablet + phone
        const animWrap = item.querySelector(".grid-card_animation");
        const g1 = item.querySelector(".gc_a_g1");
        const g2 = item.querySelector(".gc_a_g2");

        const pBg = Array.from(item.querySelectorAll(".sp_line_bot-bg path"));
        const pBot = Array.from(item.querySelectorAll(".sp_line_bot path"));
        const pColTop = Array.from(
          item.querySelectorAll(".sp_line_bot-col.top path")
        );
        const pColBot = Array.from(
          item.querySelectorAll(".sp_line_bot-col.bot path")
        );

        if (pBot.length && pBg.length) {
          const canDraw = !!gsap?.plugins?.drawSVG || !!window.DrawSVGPlugin;
          const dirBase = "back";

          const setHidden = (paths, dir = "fwd") => {
            const arr = (Array.isArray(paths) ? paths : [paths]).filter(
              Boolean
            );
            if (!arr.length) return;

            if (canDraw) {
              gsap.set(arr, {
                drawSVG: dir === "back" ? "100% 100%" : "0% 0%",
              });
            } else {
              arr.forEach((p) => {
                const len = p.getTotalLength?.() || 0;
                if (!len) return;
                gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
              });
            }
          };

          const drawInOnTl = (tlRef, paths, vars, at) => {
            const arr = (Array.isArray(paths) ? paths : [paths]).filter(
              Boolean
            );
            if (!arr.length) return;

            if (canDraw) tlRef.to(arr, { drawSVG: "0% 100%", ...vars }, at);
            else tlRef.to(arr, { strokeDashoffset: 0, ...vars }, at);
          };

          // stato iniziale
          setHidden(pBot, dirBase);
          setHidden(pBg, dirBase);
          setHidden(pColTop, "back");
          setHidden(pColBot, "fwd");

          if (g1)
            gsap.set(
              g1,
              g1UseY ? { y: -50, opacity: 0 } : { x: -50, opacity: 0 }
            );

          if (g2)
            gsap.set(g2, { scale: 0, opacity: 0, transformOrigin: "50% 50%" });

          if (animWrap) {
            gsap.set(animWrap, {
              "--ico1": "100%",
              "--ico2": "100%",
              "--logo-clip": "100%",
            });
          }

          const tA = 0.55;

          if (g1) {
            itemTl.to(
              g1,
              {
                ...(g1UseY ? { y: 0 } : { x: 0 }),
                opacity: 1,
                duration: 0.6,
                ease: "power1.out",
                overwrite: "auto",
              },
              tA
            );
          }

          if (g2) {
            itemTl.to(
              g2,
              {
                scale: 1,
                opacity: 1,
                duration: 0.65,
                ease: "back.out(1.35)",
                overwrite: "auto",
              },
              tA + 0.75
            );
          }

          drawInOnTl(
            itemTl,
            [pBot, pBg],
            { duration: 0.8, ease: "power1.inOut", overwrite: "auto" },
            tA + 0.1
          );

          // LOOP
          if (animWrap && (pColTop.length || pColBot.length)) {
            if (animWrap.__autoTl) animWrap.__autoTl.kill();

            const autoTl = gsap.timeline({
              paused: true,
              repeat: -1,
              repeatDelay: 0.6,
              defaults: { overwrite: "auto" },
            });

            const resetLoop = () => {
              gsap.set(animWrap, {
                "--ico1": "100%",
                "--ico2": "100%",
                "--logo-clip": "100%",
                "--op": "1",
              });
              setHidden(pColTop, "back");
              setHidden(pColBot, "fwd");
            };

            autoTl.add(resetLoop, 0);

            autoTl.to(
              animWrap,
              { "--ico1": "0%", duration: 0.45, ease: "power1.inOut" },
              0.05
            );
            drawInOnTl(
              autoTl,
              pColTop,
              { duration: 0.75, ease: "power1.inOut" },
              0.1
            );

            autoTl.to(
              animWrap,
              { "--logo-clip": "0%", duration: 0.35, ease: "power1.inOut" },
              0.7
            );

            drawInOnTl(
              autoTl,
              pColBot,
              { duration: 0.75, ease: "power1.inOut" },
              0.85
            );
            autoTl.to(
              animWrap,
              { "--ico2": "0%", duration: 0.45, ease: "power1.inOut" },
              1.15
            );

            autoTl.to({}, { duration: 1.3 }, "+=0.15");

            autoTl.to(
              animWrap,
              {
                "--ico1": "100%",
                "--ico2": "100%",
                "--logo-clip": "100%",
                "--op": "0",
                duration: 0.55,
                ease: "power1.inOut",
              },
              ">"
            );

            autoTl.to({}, { duration: 0.15 });

            animWrap.__autoTl = autoTl;

            if (!stacked) {
              // desktop: usa manager card-level
              autoLoops.push({ tl: autoTl, reset: resetLoop });
              itemTl.add(() => {
                loopsReady = true;
                maybeStartLoops();
              }, tA + 1);
            } else {
              // stacked: start/stop per ITEM (quando entra/esce viewport)
              // stacked: start/stop per ITEM, ma NON prima dell’ingresso
              const loopState = { ready: false, inView: false };

              // quando l’ingresso è “pronto”, abilito la loop
              itemTl.add(() => {
                loopState.ready = true;
                if (loopState.inView) {
                  resetLoop();
                  autoTl.play(0);
                }
              }, tA + 1);

              // viewport control (start uguale all’ingresso dell’item)
              const stAuto = ScrollTrigger.create({
                trigger: item,
                start: startStackHead,
                end: "bottom 20%",
                onEnter: () => {
                  loopState.inView = true;
                  if (loopState.ready) {
                    resetLoop();
                    autoTl.play(0);
                  }
                },
                onEnterBack: () => {
                  loopState.inView = true;
                  if (loopState.ready) {
                    resetLoop();
                    autoTl.play(0);
                  }
                },
                onLeave: () => {
                  loopState.inView = false;
                  autoTl.pause(0);
                  resetLoop();
                },
                onLeaveBack: () => {
                  loopState.inView = false;
                  autoTl.pause(0);
                  resetLoop();
                },
              });

              card.__card2AutoItemSTs.push(stAuto);
            }
          }
        }
      }

      // -------------------------------------------------
      // EXTRA: ITEM3 (grid-card_animation vars: op/sc/blur)
      // -------------------------------------------------
      if (item.id === "card2-item3") {
        const animWrap = item.querySelector(".grid-card_animation");
        if (!animWrap) return;

        const noBlur = !bp.lgUp; // da tablet in giù

        // init
        gsap.set(animWrap, {
          "--op-img": "0",
          "--img-sc": "0.9",
          ...(noBlur ? {} : { "--blur": "5px" }),
        });

        const tA = 0.55;

        // anim
        itemTl.to(
          animWrap,
          {
            "--op-img": "1",
            "--img-sc": "1",
            ...(noBlur ? {} : { "--blur": "0px" }),
            duration: 0.75,
            ease: "power1.inOut",
            overwrite: "auto",
          },
          tA
        );
      }

      // desktop: attacco nel master con startAt
      if (!stacked && tlMaster) tlMaster.add(itemTl, startAt);
    });

    // ======================
    // DESKTOP: start/stop loop SOLO in viewport
    // ======================
    // ======================
    // DESKTOP: start/stop loop SOLO in viewport
    // ======================
    if (!stacked) {
      card.__card2LoopST = ScrollTrigger.create({
        trigger: card,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
          inView = true;
          maybeStartLoops();
        },
        onEnterBack: () => {
          inView = true;
          maybeStartLoops();
        },
        onLeave: () => {
          inView = false;
          stopLoops();
        },
        onLeaveBack: () => {
          inView = false;
          stopLoops();
        },
      });

      inView = ScrollTrigger.isInViewport(card, 0.2);
      if (!inView) stopLoops();
      else maybeStartLoops();
    }
  },

  card3: function () {
    const bp = this.bp();
    if (!window.gsap || !window.ScrollTrigger) return;

    const section = document.querySelector("#NetCenter");
    if (!section) return;

    const card = section.querySelector("#card3");
    if (!card) return;

    const splitChars = (el) => {
      if (!el) return [];
      if (!window.SplitText) return [el];
      if (el.__splitChars?.chars?.length) return el.__splitChars.chars;
      const sp = SplitText.create(el, { type: "chars", autoSplit: true });
      el.__splitChars = sp;
      return sp.chars || [el];
    };

    const subH = card.querySelector(".sub-h");
    const h3 = card.querySelector(".h-rap");
    const pars = Array.from(card.querySelectorAll(".par"));
    const ease = bp.phoneDown ? "power2.inOut" : "power1.inOut";
    if (!subH || !h3) return;

    const subHChars = splitChars(subH);

    // HEAD init
    gsap.set(subHChars, {
      opacity: 0,
      rotateX: 90,
      transformOrigin: "50% 50% -0.5em",
    });
    gsap.set(h3, { "--txt-mix": "0%" });
    if (pars.length) gsap.set(pars, { "--txt-mix": "0%" });

    // IMG init (no blur su touchDown)
    const animWrap = card.querySelector(".grid-card_animation");
    const noBlur = bp.touchDown; // tablet + phone
    if (animWrap) {
      gsap.set(animWrap, {
        "--op-img": "0",
        ...(noBlur ? {} : { "--blur": "5px" }),
      });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: bp.touchDown ? "top 65%" : "top 70%",
        once: true,
      },
    });

    // HEAD
    tl.to(
      subHChars,
      {
        opacity: 1,
        rotateX: 0,
        stagger: 0.05,
        ease: ease,
        duration: 0.6,
      },
      0
    ).to(
      h3,
      {
        "--txt-mix": "100%",
        ease: "power1.inOut",
        duration: 0.6,
      },
      0.2
    );

    if (pars.length) {
      tl.to(
        pars,
        {
          "--txt-mix": "100%",
          ease: "power1.inOut",
          duration: 0.6,
          stagger: 0.1,
        },
        0.6
      );
    }

    // IMG (no blur su touchDown)
    if (animWrap) {
      tl.to(
        animWrap,
        {
          "--op-img": "1",
          ...(noBlur ? {} : { "--blur": "0px" }),
          duration: 0.75,
          ease: "power1.inOut",
          overwrite: "auto",
        },
        0.55
      );
    }
  },

  // API -------------------------------------------------
  init: function () {
    if (!window.pageSpecificListeners) window.pageSpecificListeners = [];

    this.header();
    this.card1();
    this.card2();
    this.card3();
    this.gridCardShellRingInit(document.querySelector("#NetCenter"));
  },
};
/** Sezione Sticky home */
window.fluxAnimation = window.fluxAnimation || {
  // ----------------------------------
  // BP helper (come il tuo)
  // ----------------------------------
  bp: function () {
    const is = window.bp?.is;
    if (typeof is !== "function") {
      // se bp non c'è, non blocco nulla: assumo desktop (safe)
      return { lgUp: true, touchDown: false, phoneDown: false };
    }

    return {
      xsOnly: is("xsOnly"),
      smOnly: is("smOnly"),
      mdOnly: is("mdOnly"),
      lgUp: is("lgUp"),
      touchDown: is("touchDown"), // (max-width: 991px)
      phoneDown: is("phoneDown"), // (max-width: 767px)
    };
  },

  _cleanups: [],
  _inited: false,

  // refs runtime
  _scope: null,
  _w: null,
  _a: null,
  _panels: null,

  // ----------------------------------
  // utils
  // ----------------------------------
  _pushCleanup: function (fn) {
    this._cleanups.push(fn);
  },

  _safeKill: function (x) {
    try {
      x && x.kill && x.kill();
    } catch (_) {}
  },

  _splitChars: function (el) {
    if (!el) return [];
    if (!window.SplitText) return [el];

    if (el.__fluxSplitChars?.chars?.length) return el.__fluxSplitChars.chars;

    const sp = SplitText.create(el, { type: "chars", autoSplit: true });
    el.__fluxSplitChars = sp;

    this._pushCleanup(() => {
      try {
        sp.revert();
      } catch (_) {}
      try {
        delete el.__fluxSplitChars;
      } catch (_) {
        el.__fluxSplitChars = null;
      }
    });

    return sp.chars || [el];
  },

  setActive: function (idx) {
    if (!this._a) return;
    const n = Number(idx) || 0;
    this._a.dataset.fluxActive = String(n);
    this._a.style.setProperty("--flux-active", String(n));
  },

  _setupAutoPauseTouch: function (step, cont, api) {
    if (!("IntersectionObserver" in window)) return () => {};

    const bp = this.bp?.() || {};
    if (!bp.touchDown) return () => {}; // solo touchDown

    const target =
      cont?.closest?.(
        "#flux_animation_mb1, #flux_animation_mb2, #flux_animation_mb3"
      ) ||
      step ||
      cont;

    if (!target) return () => {};

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries && entries[0];
        if (!e) return;

        // SOLO auto-pause: non riprendo mai automaticamente
        if (!e.isIntersecting) {
          if (api.getUiState?.() === "running") {
            api.setAutoPaused?.(true);
            api.pause?.();
          }
        }
      },
      { threshold: 0 }
    );

    io.observe(target);

    return () => {
      try {
        io.disconnect();
      } catch (_) {}
    };
  },

  initDesktopPins: function (panels) {
    const bp = this.bp();
    if (!bp.lgUp) return;
    if (!window.ScrollTrigger || !this._w || !this._a || !panels?.length)
      return;

    // =========================
    // PIN GLOBALE COLONNA DESTRA
    // - pinna #f-a per tutta la durata di .flux-wrapper / #f-w
    // =========================
    const mainWrap = this._w; // #f-w
    const rightCol = this._a; // #f-a

    const stMainPin = ScrollTrigger.create({
      trigger: mainWrap,
      start: "top top",
      end: "bottom bottom",
      pin: rightCol,
      pinSpacing: false,
      //anticipatePin: 1,
      refreshPriority: 20,
      invalidateOnRefresh: true,
      id: "flux-main-pin",
    });

    this._pushCleanup(() => this._safeKill(stMainPin));

    // =========================
    // PIN LOCALI PANEL SINISTRI
    // - ogni .flux_panel resta fermo per la durata del relativo .flux_step
    // =========================
    panels.forEach((step, i) => {
      const panel = step.querySelector(".flux_panel");
      if (!panel) return;

      const stPanelPin = ScrollTrigger.create({
        trigger: step,
        start: "top top",
        end: "bottom bottom",
        pin: panel,
        pinSpacing: false,
        //anticipatePin: 1,
        refreshPriority: 10,
        invalidateOnRefresh: true,
        id: `flux-panel-pin-${i}`,
      });

      this._pushCleanup(() => this._safeKill(stPanelPin));
    });
  },

  // ----------------------------------
  // INIT
  // ----------------------------------
  init: function (root) {
    const bp = this.bp();
    if (!(bp.lgUp || bp.touchDown)) return;
    if (!window.gsap || !window.ScrollTrigger) return;

    // re-init safe
    this.destroy();

    const scope = root || document;
    const w = scope.querySelector("#f-w");
    const a = scope.querySelector("#f-a");
    if (!w || !a) return;

    this._scope = scope;
    this._w = w;
    this._a = a;

    const panels = Array.from(w.querySelectorAll(".flux_step[data-flux]")).sort(
      (p, q) => (+p.dataset.flux || 0) - (+q.dataset.flux || 0)
    );
    if (!panels.length) return;
    this._panels = panels;

    // default state
    this.setActive(a.dataset.fluxActive ?? 0);
    // DESKTOP: pin globale + pin panel
    if (bp.lgUp) {
      this.initDesktopPins(panels);
    }

    // 1) head animations (per ora identico)
    this.initHeads(panels);
    this.initStickyFx(panels);

    // Progress SOLO desktop (lgUp)
    if (bp.lgUp) {
      this.initProgress(panels);
      this.initStickyState(panels);
    }

    ScrollTrigger.refresh();
    this._inited = true;
  },

  // ==============================
  // HOTSPOT SVG (sync + draw)
  // ==============================
  syncHotspotSvg: function (box) {
    const w = Math.max(0, Math.round(box.clientWidth || box.offsetWidth || 0));
    const h = Math.max(
      0,
      Math.round(box.clientHeight || box.offsetHeight || 0)
    );
    if (!w || !h) return false;

    const br = getComputedStyle(box).borderTopLeftRadius;
    const r = Math.max(0, parseFloat(br) || 0);

    const svgs = box.querySelectorAll("svg.hotspot-stroke");
    if (!svgs.length) return false;

    svgs.forEach((svg) => {
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      const strokes = svg.querySelectorAll(".stroke");
      strokes.forEach((rect) => {
        const sw = parseFloat(getComputedStyle(rect).strokeWidth) || 2.5;

        rect.setAttribute("x", sw / 2);
        rect.setAttribute("y", sw / 2);
        rect.setAttribute("width", Math.max(0, w - sw));
        rect.setAttribute("height", Math.max(0, h - sw));

        const rx = Math.max(0, r - sw / 2);
        rect.setAttribute("rx", rx);
        rect.setAttribute("ry", rx);
      });
    });

    return true;
  },

  _setupDrawSvg: function (box) {
    if (!window.DrawSVGPlugin) return;
    const strokes = box.querySelectorAll("svg.hotspot-stroke .stroke");
    if (!strokes.length) return;
    gsap.set(strokes, { drawSVG: "0%" });
  },

  _syncAndDraw: function (box) {
    if (!box) return;
    if (!this.syncHotspotSvg(box)) return;
    this._setupDrawSvg(box);
  },

  hotspotsInit: function (root) {
    if (!this.bp().lgUp) return;
    if (!root) return;

    const boxes = root.querySelectorAll(
      ".plaf_data1, .plaf_data2, .plaf_data3"
    );
    if (!boxes.length) return;

    boxes.forEach((box) => this._syncAndDraw(box));

    if (!window.ResizeObserver) return;

    if (!this._hotspotRO) {
      this._hotspotRO = new ResizeObserver((entries) => {
        entries.forEach((entry) => this._syncAndDraw(entry.target));
      });
      // cleanup RO
      this._pushCleanup(() => {
        try {
          this._hotspotRO.disconnect();
        } catch (_) {}
        this._hotspotRO = null;
      });
    }

    boxes.forEach((box) => {
      if (box.dataset.hotspotObserved === "1") return;
      box.dataset.hotspotObserved = "1";
      this._hotspotRO.observe(box);
    });
  },

  // ==============================
  // Draw helpers (TL-based)
  // ==============================
  _setHiddenDraw: function (paths) {
    const arr = (Array.isArray(paths) ? paths : [paths]).flat().filter(Boolean);
    if (!arr.length) return;

    if (window.DrawSVGPlugin) {
      gsap.set(arr, { drawSVG: "0%" });
    } else {
      arr.forEach((p) => {
        const len = p.getTotalLength?.() || 0;
        if (!len) return;
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
    }
  },

  _drawInOnTl: function (tlRef, paths, vars, at) {
    const arr = (Array.isArray(paths) ? paths : [paths]).flat().filter(Boolean);
    if (!arr.length) return;

    if (window.DrawSVGPlugin) tlRef.to(arr, { drawSVG: "100%", ...vars }, at);
    else tlRef.to(arr, { strokeDashoffset: 0, ...vars }, at);
  },

  _drawOutOnTl: function (tlRef, paths, vars, at) {
    const arr = (Array.isArray(paths) ? paths : [paths]).flat().filter(Boolean);
    if (!arr.length) return;

    if (window.DrawSVGPlugin) tlRef.to(arr, { drawSVG: "0%", ...vars }, at);
    else {
      tlRef.to(
        arr,
        {
          strokeDashoffset: (i, t) => t.getTotalLength?.() || 0,
          ...vars,
        },
        at
      );
    }
  },

  // ----------------------------------
  // 1) HEAD animations per panel
  // ----------------------------------
  initHeads: function (panels) {
    panels.forEach((panel) => {
      const subH = panel.querySelector(".sub-h");
      const h3 = panel.querySelector(".h-rap");
      const pars = Array.from(panel.querySelectorAll(".par"));
      if (!subH || !h3) return;

      const subHChars = this._splitChars(subH);

      // stato iniziale head
      gsap.set(subHChars, {
        opacity: 0,
        rotateX: 90,
        transformOrigin: "50% 50% -0.5em",
      });
      gsap.set(h3, { "--txt-mix": "0%" });
      if (pars.length) gsap.set(pars, { "--txt-mix": "0%" });

      const headTl = gsap.timeline({ paused: true });
      headTl
        .to(
          subHChars,
          {
            opacity: 1,
            rotateX: 0,
            stagger: 0.05,
            ease: "power1.inOut",
            duration: 0.6,
          },
          0
        )
        .to(
          h3,
          { "--txt-mix": "100%", ease: "power1.inOut", duration: 0.6 },
          0.2
        );

      if (pars.length) {
        headTl.to(
          pars,
          {
            "--txt-mix": "100%",
            ease: "power1.inOut",
            duration: 0.6,
            stagger: 0.08,
          },
          0.3
        );
      }

      const bp = this.bp();
      const headStart = bp.touchDown ? "top 65%" : "top 20%";
      const stHead = ScrollTrigger.create({
        trigger: panel,
        start: headStart,
        once: true,
        onEnter: () => headTl.play(0),
        onEnterBack: () => headTl.play(0),
      });

      if (ScrollTrigger.isInViewport(panel, 0.2)) headTl.play(0);

      this._pushCleanup(() => this._safeKill(stHead));
      this._pushCleanup(() => this._safeKill(headTl));
    });
  },

  // ----------------------------------
  // 2) Sticky state switching (slot)
  // ----------------------------------
  initStickyState: function (panels) {
    const firstInView = panels.find((p) => ScrollTrigger.isInViewport(p, 0.15));
    if (firstInView) this.setActive(+firstInView.dataset.flux || 0);

    panels.forEach((panel) => {
      const idx = Number(panel.dataset.flux || 0);

      const stState = ScrollTrigger.create({
        trigger: panel,
        start: "top center",
        end: "bottom center",
        onEnter: () => this.setActive(idx),
        onEnterBack: () => this.setActive(idx),
      });

      this._pushCleanup(() => this._safeKill(stState));
    });
  },

  // ----------------------------------
  // 3) Progress scrub
  // .flux-progress_item[data-flux] -> .flux_step[data-flux]
  // start: top step tocca top viewport
  // end: bottom step passa top viewport
  // ----------------------------------
  initProgress: function (panels) {
    if (!this.bp().lgUp) return;
    const a = this._a;
    if (!a) return;

    const items = Array.from(
      a.querySelectorAll(".flux-progress_item[data-flux]")
    );
    if (!items.length) return;

    // mappa rapida flux->panel
    const panelByIdx = new Map();
    panels.forEach((p) => panelByIdx.set(String(+p.dataset.flux || 0), p));

    items.forEach((it) => {
      const key = String(+it.dataset.flux || 0);
      const step = panelByIdx.get(key);
      if (!step) return;

      // stato iniziale
      gsap.set(it, { "--fill": "0%" });

      const tw = gsap.to(it, {
        "--fill": "100%",
        ease: "none",
        scrollTrigger: {
          trigger: step,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      this._pushCleanup(() => this._safeKill(tw.scrollTrigger));
      this._pushCleanup(() => this._safeKill(tw));
    });
  },

  // ----------------------------------
  // 4) Sticky FX (placeholder)
  // ----------------------------------
  initStickyFx: function (panels) {
    const scope = this._scope || document;
    const bp = this.bp();
    const isTouch = bp.touchDown;

    // -----------------------
    // scegli root(s)
    // desktop: #flux_animation
    // touchDown: #flux_animation_mb1/2/3
    // -----------------------
    const pick = (sel) =>
      scope.querySelector(sel) || this._a?.querySelector(sel) || null;

    let fxRoots = [];

    if (isTouch) {
      // mobile/tablet: root separati
      [
        "#flux_animation_mb1",
        "#flux_animation_mb2",
        "#flux_animation_mb3",
      ].forEach((id) => {
        const el = pick(id);
        if (el) fxRoots.push(el);
      });
    } else {
      //  desktop: root unico
      const fxRoot = pick("#flux_animation");
      if (fxRoot) fxRoots = [fxRoot];
    }

    if (!fxRoots.length) return;

    // hotspots (safe: su touchDown la tua hotspotsInit torna subito per via del gate lgUp)
    fxRoots.forEach((r) => this.hotspotsInit(r));

    // -----------------------
    // helper: estrai conts da un root
    // - se root stesso è un cont valido, lo includo
    // - altrimenti prendo i children .flux_anim_cont[data-flux]
    // -----------------------
    const getContsFrom = (rootEl) => {
      if (!rootEl) return [];
      const selfIsCont =
        rootEl.matches?.(".flux_anim_cont[data-flux]") &&
        rootEl.dataset.flux != null;

      if (selfIsCont) return [rootEl];

      return Array.from(rootEl.querySelectorAll(".flux_anim_cont[data-flux]"));
    };

    const allConts = fxRoots.flatMap(getContsFrom);

    // -----------------------
    // mappa flux -> cont
    // (fallback: se manca data-flux, proviamo a mappare mb1->0, mb2->1, mb3->2)
    // -----------------------
    const animByIdx = new Map();

    allConts.forEach((el) => {
      const k = String(+el.dataset.flux || 0);
      animByIdx.set(k, el);
    });

    // fallback SOLO su touchDown, se i cont non hanno data-flux coerente
    if (isTouch) {
      const fallbackMap = [
        { id: "#flux_animation_mb1", idx: "0" },
        { id: "#flux_animation_mb2", idx: "1" },
        { id: "#flux_animation_mb3", idx: "2" },
      ];

      fallbackMap.forEach(({ id, idx }) => {
        if (animByIdx.has(idx)) return;
        const rootEl = pick(id);
        if (!rootEl) return;
        const cont = rootEl.matches?.(".flux_anim_cont[data-flux]")
          ? rootEl
          : rootEl.querySelector(".flux_anim_cont[data-flux]");
        if (cont) animByIdx.set(idx, cont);
      });
    }

    // -----------------------
    // config + builders (come prima)
    // -----------------------
    const cfg = {
      on: {
        start: isTouch ? "top 65%" : "top top", // match con initHeads
        strokeAt: 0.0,
        opAt: 0.8,
        drawDur: 0.8,
        opDur: 0.8,
        ease: "power1.inOut",
        stagger: 0.08,
      },
      loop: {
        enabled: !isTouch, // auto-loop solo desktop
        delay: 0,
        repeatDelay: 0.8,
        shadDur: 0.6,
        bounceDur: 0.5,
        ease: "power1.inOut",
        bounceEase: "back.out(3)",
      },
      off: {
        enabled: !isTouch, // auto-off solo desktop
        start: "bottom 50%",
        opDur: 0.35,
        drawDur: 0.35,
        ease: "power1.inOut",
      },
      __isTouch: isTouch,
    };

    const builders = {
      0: this._buildFlux0?.bind(this),
      1: this._buildFlux1?.bind(this),
      2: this._buildFlux2?.bind(this),
    };

    const forceOffOthers = (activeCont) => {
      if (isTouch) return;
      allConts.forEach((el) => {
        if (el === activeCont) return;
        if (typeof el.__fluxForceOff === "function") el.__fluxForceOff(3);
        else gsap.set(el, { "--cont-op": "0" });
      });
    };

    panels.forEach((step) => {
      const idx = String(+step.dataset.flux || 0);
      const cont = animByIdx.get(idx);
      if (!cont) return;

      if (cont.__fluxFxKill) cont.__fluxFxKill();

      const build = builders[idx];
      if (typeof build !== "function") return;

      const kill = build(step, cont, cfg, forceOffOthers);

      if (typeof kill === "function") {
        cont.__fluxFxKill = kill;
        this._pushCleanup(() => cont.__fluxFxKill && cont.__fluxFxKill());
      }
    });
  },
  /* =========================================================
     FLUX 0 — LOGICA REALE
  ========================================================= */
  _buildFlux0: function (step, cont, cfg, forceOffOthers) {
    const d1 = cont.querySelector(".plaf_data1");
    const d2 = cont.querySelector(".plaf_data2");
    const d3 = cont.querySelector(".plaf_data3");
    if (!d1 || !d2 || !d3) return null;

    const s1 = Array.from(d1.querySelectorAll("svg.hotspot-stroke .stroke"));
    const s2 = Array.from(d2.querySelectorAll("svg.hotspot-stroke .stroke"));
    const s3 = Array.from(d3.querySelectorAll("svg.hotspot-stroke .stroke"));
    const amountEl = cont.querySelector("[data-amount]");

    const linesWrap = cont.querySelector(".flux_anim_lines");
    const lBg = linesWrap
      ? Array.from(linesWrap.querySelectorAll(".flux_line_bot-bg path"))
      : [];
    const lBot = linesWrap
      ? Array.from(linesWrap.querySelectorAll(".flux_line_bot path"))
      : [];
    const lCol = linesWrap
      ? Array.from(linesWrap.querySelectorAll(".flux_line_col path"))
      : [];

    const canDrawLines = !!gsap?.plugins?.drawSVG || !!window.DrawSVGPlugin;
    const lineDir = "fwd"; // cambia a "back" se vuoi invertire

    const setHiddenLines = (paths, dir = "fwd") => {
      const arr = (Array.isArray(paths) ? paths : [paths])
        .flat()
        .filter(Boolean);
      if (!arr.length) return;
      if (canDrawLines) {
        gsap.set(arr, { drawSVG: dir === "back" ? "100% 100%" : "0% 0%" });
      } else {
        arr.forEach((p) => {
          const len = p.getTotalLength?.() || 0;
          if (!len) return;
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        });
      }
    };

    const drawInLinesOnTl = (tlRef, paths, vars, at) => {
      const arr = (Array.isArray(paths) ? paths : [paths])
        .flat()
        .filter(Boolean);
      if (!arr.length) return;
      if (canDrawLines) tlRef.to(arr, { drawSVG: "0% 100%", ...vars }, at);
      else tlRef.to(arr, { strokeDashoffset: 0, ...vars }, at);
    };

    const drawOutLinesOnTl = (tlRef, paths, vars, at, dir = "fwd") => {
      const arr = (Array.isArray(paths) ? paths : [paths])
        .flat()
        .filter(Boolean);
      if (!arr.length) return;

      if (canDrawLines) {
        tlRef.to(
          arr,
          { drawSVG: dir === "back" ? "100% 100%" : "0% 0%", ...vars },
          at
        );
      } else {
        tlRef.to(
          arr,
          { strokeDashoffset: (i, p) => p.getTotalLength?.() || 0, ...vars },
          at
        );
      }
    };

    const resetAll = () => {
      this._syncAndDraw(d1);
      this._syncAndDraw(d2);
      this._syncAndDraw(d3);

      gsap.set(d1, {
        "--op": "0",
        "--op-s": "1",
        "--mix-shad": "100%",
        "--sc-a": "0",
        "--after": "0",
      });
      gsap.set(d2, {
        scale: 1,
        "--op-1": "0",
        "--op-2": "0",
        "--y1": "0",
        "--y2": "50",
        "--op-s": "1",
        "--mix-shad-1": "100%",
        "--mix-shad-2": "100%",
      });
      gsap.set(d3, {
        "--op": "0",
        "--op-s": "1",
        "--mix-shad": "100%",
        "--mix-color": "100%",
        "--after": "0",
      });
      gsap.set(cont, { "--cont-op": "0" });

      this._setHiddenDraw([s1, s2, s3]);
      setHiddenLines(lBg, lineDir);
      setHiddenLines(lBot, lineDir);
      setHiddenLines(lCol, lineDir);

      if (amountEl) amountEl.textContent = "0.00";
      d1.dataset.alert = "true";
    };

    resetAll();

    // =========================
    // TOUCH FLAGS + START ON
    // =========================
    const isTouch = !!cfg?.__isTouch;
    const startOn = cfg?.on?.start || (isTouch ? "top 65%" : "top top");

    // ===== TL ON =====
    const tlOn = gsap.timeline({
      paused: true,
      defaults: { overwrite: "auto" },
    });

    tlOn.add(() => {
      gsap.set(cont, { "--cont-op": "1" });
      this._syncAndDraw(d1);
      this._syncAndDraw(d2);
      this._syncAndDraw(d3);
      this._setHiddenDraw([s1, s2, s3]);
    }, 0);

    this._drawInOnTl(
      tlOn,
      s1,
      { duration: cfg.on.drawDur, ease: cfg.on.ease },
      cfg.on.strokeAt
    );
    this._drawInOnTl(
      tlOn,
      s2,
      { duration: cfg.on.drawDur, ease: cfg.on.ease },
      cfg.on.strokeAt + 0.2
    );
    this._drawInOnTl(
      tlOn,
      s3,
      { duration: cfg.on.drawDur, ease: cfg.on.ease },
      cfg.on.strokeAt + 0.4
    );

    tlOn
      .to(
        d1,
        { "--op": "1", duration: cfg.on.opDur, ease: cfg.on.ease },
        cfg.on.opAt
      )
      .to(
        d1,
        { "--op-s": "0", duration: cfg.on.opDur, ease: cfg.on.ease },
        cfg.on.opAt
      );

    tlOn
      .to(
        d2,
        { "--op-1": "1", duration: cfg.on.opDur, ease: cfg.on.ease },
        cfg.on.opAt + 0.2
      )
      .to(
        d2,
        { "--op-s": "0", duration: cfg.on.opDur, ease: cfg.on.ease },
        cfg.on.opAt
      );

    tlOn
      .to(
        d3,
        { "--op": "1", duration: cfg.on.opDur, ease: cfg.on.ease },
        cfg.on.opAt + 0.4
      )
      .to(
        d3,
        { "--op-s": "0", duration: cfg.on.opDur, ease: cfg.on.ease },
        cfg.on.opAt
      );

    // ===== TL LOOP =====
    let loopDC = null;

    const tlLoop = gsap.timeline({
      paused: true,
      repeat: isTouch ? 0 : -1, //  touch: 1 ciclo (Play)
      repeatDelay: isTouch ? 0 : cfg.loop.repeatDelay,
      defaults: { overwrite: "auto" },
    });

    const tLines = 0.75;
    const durLines = 0.9;
    const afterDur = 0.22;
    const tAfter = tLines + durLines - afterDur;
    const tCol = tLines + durLines + 0.05;

    tlLoop
      .to(
        d1,
        { "--mix-shad": "0%", duration: cfg.loop.shadDur, ease: cfg.loop.ease },
        0
      )
      .to(
        d1,
        {
          "--sc-a": "1",
          duration: cfg.loop.bounceDur,
          ease: cfg.loop.bounceEase,
        },
        0.35
      )
      .to(
        d2,
        {
          "--mix-shad-1": "0%",
          duration: cfg.loop.shadDur,
          ease: cfg.loop.ease,
        },
        0.35
      )
      .to(
        d2,
        {
          scale: 1.1,
          repeat: 1,
          yoyo: true,
          duration: 0.3,
          ease: cfg.loop.ease,
        },
        0.35
      )
      .to(
        d3,
        {
          "--mix-color": "0%",
          duration: cfg.loop.shadDur + 0.3,
          ease: cfg.loop.ease,
        },
        tLines
      )
      .to(
        d3,
        {
          "--mix-shad": "0%",
          duration: cfg.loop.shadDur + 0.3,
          ease: cfg.loop.ease,
        },
        tLines
      )
      .to(
        d1,
        { "--after": "1", duration: afterDur, ease: "power1.out" },
        tAfter
      )
      .to(
        d3,
        { "--after": "1", duration: afterDur, ease: "power1.out" },
        tAfter
      );

    drawInLinesOnTl(
      tlLoop,
      [lBot, lBg],
      { duration: durLines, ease: "power1.inOut", overwrite: "auto" },
      tLines
    );
    drawInLinesOnTl(
      tlLoop,
      lCol,
      { duration: 0.65, ease: "power1.inOut", overwrite: "auto" },
      tCol
    );

    const durCol = 0.65;
    const tResolve = tCol + durCol + 0.1;
    const tFinal = tResolve + 0.2;
    const tEnd = tFinal + 1;

    if (amountEl) {
      const num = { v: 0 };
      tlLoop.to(
        num,
        {
          v: 120,
          duration: 0.8,
          ease: "power1.inOut",
          onUpdate: () => (amountEl.textContent = num.v.toFixed(2)),
        },
        tResolve
      );
    }

    tlLoop.add(() => {
      d1.dataset.alert = "false";
    }, tResolve);

    tlLoop.to(
      d1,
      { "--sc-a": "0", duration: 0.45, ease: "power1.out" },
      tResolve
    );

    const outDir = lineDir === "back" ? "fwd" : "back";
    drawOutLinesOnTl(
      tlLoop,
      [lCol, lBot, lBg],
      { duration: 0.75, ease: "power1.inOut", overwrite: "auto" },
      tResolve,
      outDir
    );

    tlLoop
      .to(
        [d1, d3],
        { "--after": "0", duration: 0.75, ease: "power1.out" },
        tResolve
      )
      .to(
        d2,
        { "--op-1": "0", "--y1": "-50", duration: 0.55, ease: "power1.out" },
        tFinal
      )
      .to(
        d2,
        {
          "--op-2": "1",
          "--y2": "0",
          "--mix-shad-2": "0%",
          duration: 0.75,
          ease: "power1.out",
        },
        tFinal
      )
      .to(
        d3,
        {
          "--mix-color": "100%",
          "--mix-shad": "100%",
          duration: cfg.loop.shadDur + 0.3,
          ease: "power1.out",
        },
        tFinal
      )
      .to(
        d1,
        {
          "--mix-shad": "100%",
          duration: cfg.loop.shadDur + 0.3,
          ease: cfg.loop.ease,
        },
        tEnd
      )
      .to(
        d2,
        {
          "--mix-shad-2": "100%",
          "--mix-shad-1": "100%",
          duration: cfg.loop.shadDur + 0.3,
          ease: cfg.loop.ease,
        },
        tEnd
      );

    if (amountEl) {
      const num = { v: 0 };
      tlLoop
        .to(
          num,
          {
            v: 100,
            duration: 1,
            ease: "power1.inOut",
            onUpdate: () => {
              amountEl.textContent = num.v.toFixed(2);
            },
          },
          tEnd + 1.2
        )
        .to(
          num,
          {
            v: 0,
            duration: 1,
            ease: "power1.inOut",
            onUpdate: () => {
              amountEl.textContent = num.v.toFixed(2);
            },
          },
          tEnd + 3.4
        );
    }

    tlLoop.add(() => {
      d1.dataset.alert = "true";
    }, tEnd + 4);

    tlLoop
      .to(
        d2,
        {
          "--op-2": "0",
          "--y2": "50",
          duration: 0.55,
          ease: "power1.out",
          overwrite: "auto",
        },
        tEnd + 4.5
      )
      .to(
        d2,
        {
          "--op-1": "1",
          "--y1": "0",
          duration: 0.75,
          ease: "power1.out",
          overwrite: "auto",
        },
        tEnd + 4.5
      );

    // ===== TL OFF =====
    const tlOff = gsap.timeline({
      paused: true,
      defaults: { overwrite: "auto" },
    });

    tlOff.to(cont, { "--cont-op": "0", duration: 0.35, ease: "sine.inOut" }, 0);
    tlOff.add(() => resetAll(), ">");

    // ===== FASI =====
    let phase = "idle"; // idle | on | loop | off

    const killLoopDelay = () => {
      if (loopDC) {
        loopDC.kill();
        loopDC = null;
      }
    };

    const fadeOff = (speed = 1) => {
      if (phase === "off" || phase === "idle") return;

      killLoopDelay();
      try {
        tlLoop.pause(0);
      } catch (_) {}
      try {
        tlOn.pause();
      } catch (_) {}

      phase = "off";
      tlOff.timeScale(speed).restart(true);

      tlOff.eventCallback("onComplete", () => {
        phase = "idle";
      });
    };

    //  reset/off sempre disponibile (touch + desktop)
    const resetOffNow = (speed = 1) => {
      killLoopDelay();
      try {
        tlLoop.pause(0);
      } catch (_) {}
      try {
        tlOn.pause(0);
      } catch (_) {}
      try {
        tlOff.pause(0);
      } catch (_) {}

      phase = "off";
      gsap.set(cont, { "--cont-op": "0" });

      tlOff.timeScale(speed).restart(true);
      tlOff.eventCallback("onComplete", () => {
        phase = "idle";
      });
    };
    const forceToOn = () => {
      pendingPlay = false;
      killLoopDelay();

      try {
        tlLoop.pause(0);
      } catch (_) {}
      try {
        tlOn.pause(0);
      } catch (_) {}
      try {
        tlOff.pause(0);
      } catch (_) {}

      resetAll();
      gsap.set(cont, { "--cont-op": "1" });

      phase = "on";
      tlOn.restart(true);

      tlOn.eventCallback("onComplete", () => {
        if (phase !== "on") return;

        // touch: resta “pronto” (idle) dopo ON
        if (isTouch) {
          phase = "idle";
          if (pendingPlay) startPlayOnce();
          return;
        }

        // desktop: auto-loop
        phase = "loop";
        killLoopDelay();
        loopDC = gsap.delayedCall(cfg.loop.delay, () => {
          if (phase === "loop") tlLoop.restart(true);
        });
      });
    };

    // Play “pendente” se clicchi mentre ON sta ancora andando
    let pendingPlay = false;

    const startPlayOnce = () => {
      pendingPlay = false;
      gsap.set(cont, { "--cont-op": "1" });
      tlLoop.restart(true);
    };

    const goOn = () => {
      if (!isTouch) forceOffOthers(cont);
      if (phase === "on" || phase === "loop") return;

      killLoopDelay();
      try {
        tlLoop.pause(0);
      } catch (_) {}
      try {
        tlOff.pause(0);
      } catch (_) {}

      resetAll();
      gsap.set(cont, { "--cont-op": "1" });

      phase = "on";
      tlOn.restart(true);

      tlOn.eventCallback("onComplete", () => {
        if (phase !== "on") return;

        // touch: NON parte loop automaticamente
        if (isTouch) {
          phase = "idle";
          if (pendingPlay) startPlayOnce();
          return;
        }

        // desktop: auto-loop
        phase = "loop";
        killLoopDelay();
        loopDC = gsap.delayedCall(cfg.loop.delay, () => {
          if (phase === "loop") tlLoop.restart(true);
        });
      });
    };

    const goOff = () => fadeOff(1);

    // ===== ScrollTriggers =====
    let stRange = null;
    let stPreOff = null;

    if (isTouch) {
      // touch: SOLO ON (match con head)
      stRange = ScrollTrigger.create({
        trigger: cont,
        start: startOn,
        once: true,
        onEnter: goOn,
        onEnterBack: goOn,
      });
    } else {
      //  desktop: completo
      stRange = ScrollTrigger.create({
        trigger: step,
        start: "top top",
        end: "bottom top",
        onEnter: goOn,
        onEnterBack: goOn,
        onLeave: goOff,
        onLeaveBack: goOff,
      });

      stPreOff = ScrollTrigger.create({
        trigger: step,
        start: cfg.off.start,
        onEnter: goOff,
        onLeaveBack: goOn,
      });
    }

    // ===== API per tool (touch) =====
    cont.__fluxForceOff = (speed = 3) => {
      if (isTouch) {
        // su touch NON spegniamo mai il cont (niente tlOff)
        forceToOn();
        return;
      }
      if (phase === "idle") return;
      fadeOff(speed);
    };

    cont.__fluxPlayOnce = () => {
      // se ON sta andando, accodo; altrimenti parto subito
      if (phase === "on") {
        pendingPlay = true;
        return;
      }
      // se non siamo mai entrati in ON (caso raro), lo faccio partire prima
      if (phase === "idle" && gsap.getProperty(cont, "--cont-op") === "0") {
        pendingPlay = true;
        goOn();
        return;
      }
      startPlayOnce();
    };

    cont.__fluxPause = () => {
      try {
        tlLoop.pause();
      } catch (_) {}
    };
    cont.__fluxResume = () => {
      try {
        tlLoop.resume();
      } catch (_) {}
    };

    // su touch il “reset” deve tornare allo stato ON, non OFF
    cont.__fluxResetOff = () => (isTouch ? forceToOn() : resetOffNow(1));

    // ===== Bind UI tool (touch) =====
    const offs = [];
    let uiState = "idle"; // idle | running | paused
    let progTween = null;
    let autoPaused = false;

    const tools = isTouch ? step.querySelector(".player_tools") : null;
    const btnPlay = tools
      ? tools.querySelector('.player_tools_btn[data-btn="play_pause"]')
      : null;
    const btnReset = tools
      ? tools.querySelector('.player_tools_btn[data-btn="reset"]')
      : null;
    const prog = tools
      ? tools.querySelector(".player_tools_btn_progress")
      : null;

    const iconPlay = btnPlay
      ? btnPlay.querySelector(".icon_cmd:not(.pause)")
      : null;
    const iconPause = btnPlay ? btnPlay.querySelector(".icon_cmd.pause") : null;

    const loopDur = () => Math.max(0.001, tlLoop.duration() || 0.001);

    const setFill = (v) => {
      if (!prog) return;
      gsap.set(prog, { "--fill": v });
      prog.setAttribute(
        "aria-valuenow",
        String(Math.round(parseFloat(v) || 0))
      );
    };

    const killProg = () => {
      if (progTween) {
        progTween.kill();
        progTween = null;
      }
    };

    const uiIdle = () => {
      uiState = "idle";
      if (btnPlay) {
        btnPlay.classList.remove("is-active");
        btnPlay.setAttribute("aria-pressed", "false");
        btnPlay.setAttribute("aria-label", "Avvia animazione");
      }
      if (iconPlay) iconPlay.classList.add("is-active");
      if (iconPause) iconPause.classList.remove("is-active");

      killProg();
      setFill("0%");
    };

    tlLoop.eventCallback("onComplete", () => {
      if (isTouch) uiIdle();
    });

    const uiRunningStart = () => {
      uiState = "running";

      if (btnPlay) {
        btnPlay.classList.add("is-active");
        btnPlay.setAttribute("aria-pressed", "true");
        btnPlay.setAttribute("aria-label", "Pausa animazione");
      }
      if (iconPlay) iconPlay.classList.remove("is-active");
      if (iconPause) iconPause.classList.add("is-active");

      killProg();
      if (prog) {
        setFill("0%");
        progTween = gsap.to(prog, {
          "--fill": "100%",
          duration: loopDur(),
          ease: "none",
          overwrite: "auto",
          onUpdate: () => {
            const raw = gsap.getProperty(prog, "--fill");
            const n = parseFloat(String(raw).replace("%", "")) || 0;
            prog.setAttribute("aria-valuenow", String(Math.round(n)));
          },
        });
      }
    };

    const uiRunningResume = () => {
      uiState = "running";

      if (btnPlay) {
        btnPlay.classList.add("is-active");
        btnPlay.setAttribute("aria-pressed", "true");
        btnPlay.setAttribute("aria-label", "Pausa animazione");
      }
      if (iconPlay) iconPlay.classList.remove("is-active");
      if (iconPause) iconPause.classList.add("is-active");

      // qui NON resettiamo fill e NON ricreiamo tween
      if (progTween) progTween.resume();
    };

    const resetToOn = () => {
      pendingPlay = false;

      // stop loop + progress
      try {
        tlLoop.pause(0);
      } catch (_) {}
      killProg();
      setFill("0%");
      uiIdle();

      // torna allo stato ON (animato)
      // NON usa tlOff su touch
      phase = "idle";
      goOn(); // rifà tlOn (solo ON, niente loop)
    };

    const uiPaused = () => {
      uiState = "paused";
      if (btnPlay) {
        btnPlay.classList.add("is-active");
        btnPlay.setAttribute("aria-pressed", "true");
        btnPlay.setAttribute("aria-label", "Riprendi animazione");
      }
      // quando è in pausa, mostro PLAY (per riprendere)
      if (iconPlay) iconPlay.classList.add("is-active");
      if (iconPause) iconPause.classList.remove("is-active");

      if (progTween) progTween.pause();
    };

    if (isTouch) {
      // init UI
      if (prog) {
        prog.setAttribute("role", "progressbar");
        prog.setAttribute("aria-valuemin", "0");
        prog.setAttribute("aria-valuemax", "100");
        prog.setAttribute("aria-valuenow", "0");
      }
      uiIdle();

      if (!window.pageSpecificListeners) window.pageSpecificListeners = [];

      const bindPage = (el, event, handler) => {
        if (!el) return () => {};
        el.addEventListener(event, handler, { passive: false });
        window.pageSpecificListeners.push({ element: el, event, handler });
        return () => {
          try {
            el.removeEventListener(event, handler, { passive: false });
          } catch (_) {}
        };
      };

      if (btnPlay) {
        const onClick = (e) => {
          e.preventDefault();

          if (uiState === "running") {
            cont.__fluxPause?.();
            uiPaused();
            return;
          }

          if (uiState === "paused") {
            cont.__fluxResume?.();
            uiRunningResume();
            return;
          }

          // idle
          cont.__fluxPlayOnce?.();
          uiRunningStart();
        };

        offs.push(bindPage(btnPlay, "click", onClick));
        const pauseAuto = () => {
          cont.__fluxPause?.();
          if (progTween) progTween.pause();
          uiPaused();
        };

        const resumeAuto = () => {
          cont.__fluxResume?.();
          uiRunningResume(); // già fa progTween.resume() se esiste
        };

        const offAutoPause = this._setupAutoPauseTouch(step, cont, {
          getUiState: () => uiState,
          isAutoPaused: () => autoPaused,
          setAutoPaused: (v) => (autoPaused = !!v),
          pause: pauseAuto,
          resume: resumeAuto,
        });

        offs.push(offAutoPause);
      }

      if (btnReset) {
        const onReset = (e) => {
          e.preventDefault();
          resetToOn();
        };
        offs.push(bindPage(btnReset, "click", onReset));
      }
    }

    // init state (come prima, ma coerente col touch)
    if (ScrollTrigger.isInViewport(step, 0.15)) goOn();
    else {
      gsap.set(cont, { "--cont-op": "0" });
      resetAll();
    }

    // RETURN KILL
    return () => {
      // UI off
      autoPaused = false;
      try {
        offs.forEach((fn) => fn());
      } catch (_) {}
      killProg();

      killLoopDelay();
      this._safeKill(stRange);
      if (stPreOff) this._safeKill(stPreOff);
      this._safeKill(tlOn);
      this._safeKill(tlLoop);
      this._safeKill(tlOff);

      try {
        delete cont.__fluxForceOff;
        delete cont.__fluxPlayOnce;
        delete cont.__fluxPause;
        delete cont.__fluxResume;
        delete cont.__fluxResetOff;
      } catch (_) {}

      gsap.set(cont, { "--cont-op": "0" });
      resetAll();
    };
  },

  /* =========================================================
     FLUX 1 — SOLO OSSATURA (niente selettori/animazioni)
  ========================================================= */
  _buildFlux1: function (step, cont, cfg, forceOffOthers) {
    if (!window.gsap || !window.ScrollTrigger) return null;

    const isTouch = !!cfg?.__isTouch;
    const startOn = cfg?.on?.start || (isTouch ? "top 65%" : "top top");

    // items (al posto di d1/d2/d3)
    const items = Array.from(cont.querySelectorAll(".service_data"));
    if (!items.length) return null;

    // strokes per item
    const strokeGroups = items.map((el) =>
      Array.from(el.querySelectorAll("svg.hotspot-stroke .stroke"))
    );
    const hasDrawSVG = !!gsap?.plugins?.drawSVG || !!window.DrawSVGPlugin;

    const hideStrokes = () => {
      const flat = strokeGroups.flat().filter(Boolean);
      if (!flat.length) return;

      if (typeof this._setHiddenDraw === "function") {
        this._setHiddenDraw(strokeGroups);
        return;
      }

      if (hasDrawSVG) {
        gsap.set(flat, { drawSVG: "0%" });
        return;
      }

      flat.forEach((p) => {
        const len = p.getTotalLength?.() || 0;
        if (!len) return;
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
    };

    const syncAll = () => {
      items.forEach((el) => this._syncAndDraw?.(el));
    };

    const servTabs = Array.from(
      cont.querySelectorAll(".service_data[data-serv]")
    );
    const itemsConts = Array.from(
      cont.querySelectorAll(".service-data_items_cont[data-serv]")
    );

    const tabByKey = new Map(
      servTabs.map((el) => [String(el.dataset.serv), el])
    );
    const contByKey = new Map(
      itemsConts.map((el) => [String(el.dataset.serv), el])
    );

    const order = Array.from(
      new Set([...tabByKey.keys(), ...contByKey.keys()])
    ).sort((a, b) => (+a || 0) - (+b || 0));

    const CLIP_HIDE = "100%";
    const CLIP_SHOW = "0%";

    const resetAll = () => {
      // base state
      gsap.set(cont, { "--cont-op": "0" });

      if (servTabs.length) gsap.set(servTabs, { "--mix-txt": "0%" });

      if (itemsConts.length) {
        gsap.set(itemsConts, { "--clip-t": CLIP_HIDE, "--clip-b": CLIP_SHOW });
      }

      itemsConts.forEach((c) => {
        const its = Array.from(c.querySelectorAll(".serv_data_item"));
        if (!its.length) return;
        gsap.set(its, { "--sd": "0", "--y": "50px" });
      });

      gsap.set(items, { "--op": "0" });
      hideStrokes();
    };

    resetAll();

    // ===== TL ON =====
    const tlOn = gsap.timeline({
      paused: true,
      defaults: { overwrite: "auto" },
    });

    tlOn.add(() => {
      gsap.set(cont, { "--cont-op": "1" });
      syncAll();
      hideStrokes();
    }, 0);

    const groupGap = cfg?.on?.groupGap ?? 0.2;

    strokeGroups.forEach((grp, i) => {
      this._drawInOnTl?.(
        tlOn,
        grp,
        {
          duration: cfg?.on?.drawDur ?? 0.8,
          ease: cfg?.on?.ease ?? "power1.inOut",
          stagger: cfg?.on?.stagger ?? 0.08,
        },
        (cfg?.on?.strokeAt ?? 0) + i * groupGap
      );
    });

    tlOn.to(
      items,
      {
        "--op": "1",
        duration: cfg?.on?.opDur ?? 0.8,
        ease: cfg?.on?.ease ?? "power1.inOut",
        stagger: cfg?.on?.stagger ?? 0.08,
      },
      cfg?.on?.opAt ?? 0.8
    );

    // ===== TL LOOP =====
    let loopDC = null;

    const tlLoop = gsap.timeline({
      paused: true,
      repeat: isTouch ? 0 : -1, // touch: 1 giro (Play)
      repeatDelay: isTouch ? 0 : cfg?.loop?.repeatDelay ?? 0.8,
      defaults: { overwrite: "auto" },
    });

    const killLoopDelay = () => {
      if (loopDC) {
        loopDC.kill();
        loopDC = null;
      }
    };

    // timings
    const tTxt = 0.55;
    const tClipIn = 0.55;
    const tItemsIn = 0.55;
    const tHold = 2.6;
    const tResolve = 0.55;
    const stIn = { each: 0.08, from: "start" };
    const stOut = { each: 0.06, from: "end" };

    order.forEach((key) => {
      const tab = tabByKey.get(key);
      const panel = contByKey.get(key);
      if (!tab || !panel) return;

      const its = Array.from(panel.querySelectorAll(".serv_data_item"));

      tlLoop.set(tab, { "--mix-txt": "0%" }, ">");
      tlLoop.set(panel, { "--clip-t": CLIP_HIDE, "--clip-b": CLIP_SHOW }, "<");
      if (its.length) tlLoop.set(its, { "--sd": "0", "--y": "50px" }, "<");

      tlLoop.to(
        tab,
        { "--mix-txt": "100%", duration: tTxt, ease: "power1.inOut" },
        "<"
      );
      tlLoop.to(
        panel,
        { "--clip-t": CLIP_SHOW, duration: tClipIn, ease: "power1.inOut" },
        "<"
      );

      if (its.length) {
        tlLoop.to(
          its,
          {
            "--sd": "1",
            "--y": "0px",
            duration: tItemsIn,
            ease: "power1.out",
            stagger: stIn,
          },
          "<+=0.12"
        );
      }

      tlLoop.to({}, { duration: tHold }, ">");

      tlLoop.to(
        panel,
        { "--clip-b": CLIP_HIDE, duration: tResolve, ease: "power1.inOut" },
        ">"
      );

      if (its.length) {
        tlLoop.to(
          its,
          {
            "--sd": "0",
            "--y": "-50px",
            duration: 0.35,
            ease: "power1.in",
            stagger: stOut,
          },
          "<"
        );
      }

      tlLoop.to(
        tab,
        { "--mix-txt": "0%", duration: 0.35, ease: "power1.inOut" },
        ">"
      );
      tlLoop.to(
        panel,
        {
          "--clip-t": CLIP_HIDE,
          "--clip-b": CLIP_HIDE,
          duration: 0.35,
          ease: "power1.inOut",
        },
        "<"
      );
    });

    tlLoop.to({}, { duration: 0.15 }, ">");

    // ===== TL OFF (desktop) =====
    const tlOff = gsap.timeline({
      paused: true,
      defaults: { overwrite: "auto" },
    });
    tlOff.to(cont, { "--cont-op": "0", duration: 0.45, ease: "sine.inOut" }, 0);
    tlOff.add(() => resetAll(), ">");

    // ===== FASI =====
    let phase = "idle"; // idle | on | loop | off
    let pendingPlay = false;

    const fadeOff = (speed = 1) => {
      if (phase === "off" || phase === "idle") return;

      killLoopDelay();
      try {
        tlLoop.pause(0);
      } catch (_) {}
      try {
        tlOn.pause();
      } catch (_) {}

      phase = "off";
      tlOff.timeScale(speed).restart(true);
      tlOff.eventCallback("onComplete", () => (phase = "idle"));
    };

    const startPlayOnce = () => {
      pendingPlay = false;
      gsap.set(cont, { "--cont-op": "1" });
      tlLoop.restart(true);
    };

    const goOn = () => {
      if (!isTouch) forceOffOthers?.(cont);
      if (phase === "on" || phase === "loop") return;

      killLoopDelay();
      try {
        tlLoop.pause(0);
      } catch (_) {}
      try {
        tlOff.pause(0);
      } catch (_) {}

      resetAll();
      gsap.set(cont, { "--cont-op": "1" });

      phase = "on";
      tlOn.restart(true);

      tlOn.eventCallback("onComplete", () => {
        if (phase !== "on") return;

        if (isTouch) {
          phase = "idle";
          if (pendingPlay) startPlayOnce();
          return;
        }

        phase = "loop";
        killLoopDelay();
        loopDC = gsap.delayedCall(cfg?.loop?.delay ?? 0, () => {
          if (phase === "loop") tlLoop.restart(true);
        });
      });
    };

    const goOff = () => fadeOff(1);

    // ===== ScrollTriggers =====
    let stRange = null;
    let stPreOff = null;

    if (isTouch) {
      stRange = ScrollTrigger.create({
        trigger: cont,
        start: startOn, // top 65%
        once: true,
        onEnter: goOn,
        onEnterBack: goOn,
      });
    } else {
      stRange = ScrollTrigger.create({
        trigger: step,
        start: "top top",
        end: "bottom top",
        onEnter: goOn,
        onEnterBack: goOn,
        onLeave: goOff,
        onLeaveBack: goOff,
      });

      stPreOff = ScrollTrigger.create({
        trigger: step,
        start: cfg?.off?.start ?? "bottom 45%",
        onEnter: goOff,
        onLeaveBack: goOn,
      });
    }

    // ===== API (allineata a Flux0) =====
    cont.__fluxForceOff = (speed = 2.5) => {
      if (isTouch) return; // touch: niente off automatico
      if (phase === "idle") return;
      fadeOff(speed);
    };

    cont.__fluxPlayOnce = () => {
      if (phase === "on") {
        pendingPlay = true;
        return;
      }
      if (
        phase === "idle" &&
        String(gsap.getProperty(cont, "--cont-op")) === "0"
      ) {
        pendingPlay = true;
        goOn();
        return;
      }
      startPlayOnce();
    };

    cont.__fluxPause = () => {
      try {
        tlLoop.pause();
      } catch (_) {}
    };
    cont.__fluxResume = () => {
      try {
        tlLoop.resume();
      } catch (_) {}
    };

    // ===== UI (touch) =====
    const offs = [];
    let uiState = "idle"; // idle | running | paused
    let progTween = null;

    const tools = isTouch ? step.querySelector(".player_tools") : null;
    const btnPlay = tools
      ? tools.querySelector('.player_tools_btn[data-btn="play_pause"]')
      : null;
    const btnReset = tools
      ? tools.querySelector('.player_tools_btn[data-btn="reset"]')
      : null;
    const prog = tools
      ? tools.querySelector(".player_tools_btn_progress")
      : null;

    const iconPlay = btnPlay
      ? btnPlay.querySelector(".icon_cmd:not(.pause)")
      : null;
    const iconPause = btnPlay ? btnPlay.querySelector(".icon_cmd.pause") : null;

    const loopDur = () => Math.max(0.001, tlLoop.duration() || 0.001);

    const setFill = (v) => {
      if (!prog) return;
      gsap.set(prog, { "--fill": v });
      prog.setAttribute(
        "aria-valuenow",
        String(Math.round(parseFloat(v) || 0))
      );
    };

    const killProg = () => {
      if (progTween) {
        progTween.kill();
        progTween = null;
      }
    };

    const uiIdle = () => {
      uiState = "idle";
      if (btnPlay) {
        btnPlay.classList.remove("is-active");
        btnPlay.setAttribute("aria-pressed", "false");
        btnPlay.setAttribute("aria-label", "Avvia animazione");
      }
      if (iconPlay) iconPlay.classList.add("is-active");
      if (iconPause) iconPause.classList.remove("is-active");

      killProg();
      setFill("0%");
    };

    const uiRunningStart = () => {
      uiState = "running";
      if (btnPlay) {
        btnPlay.classList.add("is-active");
        btnPlay.setAttribute("aria-pressed", "true");
        btnPlay.setAttribute("aria-label", "Pausa animazione");
      }
      if (iconPlay) iconPlay.classList.remove("is-active");
      if (iconPause) iconPause.classList.add("is-active");

      killProg();
      if (prog) {
        setFill("0%");
        progTween = gsap.to(prog, {
          "--fill": "100%",
          duration: loopDur(),
          ease: "none",
          overwrite: "auto",
          onUpdate: () => {
            const raw = gsap.getProperty(prog, "--fill");
            const n = parseFloat(String(raw).replace("%", "")) || 0;
            prog.setAttribute("aria-valuenow", String(Math.round(n)));
          },
        });
      }
    };

    const uiRunningResume = () => {
      uiState = "running";
      if (btnPlay) {
        btnPlay.classList.add("is-active");
        btnPlay.setAttribute("aria-pressed", "true");
        btnPlay.setAttribute("aria-label", "Pausa animazione");
      }
      if (iconPlay) iconPlay.classList.remove("is-active");
      if (iconPause) iconPause.classList.add("is-active");

      if (progTween) progTween.resume();
    };

    const uiPaused = () => {
      uiState = "paused";
      if (btnPlay) {
        btnPlay.classList.add("is-active");
        btnPlay.setAttribute("aria-pressed", "true");
        btnPlay.setAttribute("aria-label", "Riprendi animazione");
      }
      if (iconPlay) iconPlay.classList.add("is-active");
      if (iconPause) iconPause.classList.remove("is-active");

      if (progTween) progTween.pause();
    };

    const resetToOn = () => {
      pendingPlay = false;
      try {
        tlLoop.pause(0);
      } catch (_) {}
      uiIdle();
      phase = "idle";
      goOn(); // torna SOLO ON
    };

    // fine giro (touch): torna play
    tlLoop.eventCallback("onComplete", () => {
      if (isTouch) uiIdle();
    });

    // bind click (touch) + autopause (solo pause)
    if (isTouch) {
      if (prog) {
        prog.setAttribute("role", "progressbar");
        prog.setAttribute("aria-valuemin", "0");
        prog.setAttribute("aria-valuemax", "100");
        prog.setAttribute("aria-valuenow", "0");
      }

      uiIdle();

      if (!window.pageSpecificListeners) window.pageSpecificListeners = [];

      const bindPage = (el, event, handler) => {
        if (!el) return () => {};
        el.addEventListener(event, handler, { passive: false });
        window.pageSpecificListeners.push({ element: el, event, handler });
        return () => {
          try {
            el.removeEventListener(event, handler);
          } catch (_) {}
        };
      };

      if (btnPlay) {
        const onClick = (e) => {
          e.preventDefault();

          if (uiState === "running") {
            cont.__fluxPause?.();
            uiPaused();
            return;
          }

          if (uiState === "paused") {
            cont.__fluxResume?.();
            uiRunningResume();
            return;
          }

          // idle
          cont.__fluxPlayOnce?.();
          uiRunningStart();
        };

        offs.push(bindPage(btnPlay, "click", onClick));

        // ✅ auto-pause quando esce viewport (NO auto-resume)
        const offAutoPause = this._setupAutoPauseTouch(step, cont, {
          getUiState: () => uiState,
          pause: () => {
            cont.__fluxPause?.();
            uiPaused();
          },
        });

        offs.push(offAutoPause);
      }

      if (btnReset) {
        const onReset = (e) => {
          e.preventDefault();
          resetToOn();
        };
        offs.push(bindPage(btnReset, "click", onReset));
      }
    }

    // init state
    if (ScrollTrigger.isInViewport(step, 0.15)) goOn();
    else resetAll();

    return () => {
      try {
        offs.forEach((fn) => fn());
      } catch (_) {}
      killProg();

      killLoopDelay();
      this._safeKill?.(stRange);
      if (stPreOff) this._safeKill?.(stPreOff);
      this._safeKill?.(tlOn);
      this._safeKill?.(tlLoop);
      this._safeKill?.(tlOff);

      try {
        delete cont.__fluxForceOff;
        delete cont.__fluxPlayOnce;
        delete cont.__fluxPause;
        delete cont.__fluxResume;
      } catch (_) {}

      gsap.set(cont, { "--cont-op": "0" });
      resetAll();
    };
  },

  /* =========================================================
     FLUX 2 
  ========================================================= */
  _buildFlux2: function (step, cont, cfg, forceOffOthers) {
    if (!window.gsap || !window.ScrollTrigger) return null;

    const d1 = cont.querySelector(".money_data");
    const d2 = cont.querySelector(".client_data");
    const d3 = cont.querySelector(".transfer_data");
    if (!d1 || !d2 || !d3) return null;

    const s1 = Array.from(d1.querySelectorAll("svg.hotspot-stroke .stroke"));
    const s2 = Array.from(d2.querySelectorAll("svg.hotspot-stroke .stroke"));

    const amountEl = d1.querySelector("[data-amount]");
    const clientWraps = Array.from(
      d2.querySelectorAll(".client_wrapper[data-client]")
    );
    const movers = Array.from(d3.querySelectorAll(".mover[data-client]"));

    // GUIDA motion (unica)
    const motionPath = d3.querySelector("#mp-path");
    if (!motionPath) return null;

    const KEYS = ["1", "2", "3"];
    const isTouch = !!cfg?.__isTouch;
    const startOn = cfg?.on?.start || (isTouch ? "top 65%" : "top top");

    // Plugins
    const hasMP = !!gsap?.plugins?.motionPath || !!window.MotionPathPlugin;
    if (window.MotionPathPlugin) gsap.registerPlugin(window.MotionPathPlugin);

    const hasScramble =
      !!gsap?.plugins?.scrambleText || !!window.ScrambleTextPlugin;
    if (window.ScrambleTextPlugin)
      gsap.registerPlugin(window.ScrambleTextPlugin);

    const hasDrawSVG = !!gsap?.plugins?.drawSVG || !!window.DrawSVGPlugin;

    // ===== mappe data-client =====
    const byKey = (arr) => {
      const m = new Map();
      arr.forEach((el) => {
        const k = String(el?.dataset?.client || "");
        if (k) m.set(k, el);
      });
      return m;
    };

    const clientByKey = byKey(clientWraps);
    const moverByKey = byKey(movers);

    // STROKE da disegnare (3)
    const getStroke = (k) =>
      d3.querySelector(`path.mp-path[data-client="${k}"]`) ||
      d3.querySelector(`.mp-path[data-client="${k}"] path`) ||
      d3.querySelector(`.mp-path[data-client="${k}"] .stroke`) ||
      null;

    const strokeByKey = new Map(KEYS.map((k) => [k, getStroke(k)]));
    const strokeAll = KEYS.map((k) => strokeByKey.get(k)).filter(Boolean);

    // ===== helper draw stroke (DrawSVG o fallback dash) =====
    const _len = (p) => p?.getTotalLength?.() || 0;

    const strokeHide = (els) => {
      const arr = (Array.isArray(els) ? els : [els]).flat().filter(Boolean);
      if (!arr.length) return;

      if (hasDrawSVG) {
        gsap.set(arr, { drawSVG: "0% 0%" });
      } else {
        arr.forEach((p) => {
          const L = _len(p);
          if (!L) return;
          gsap.set(p, { strokeDasharray: L, strokeDashoffset: L });
        });
      }
    };

    const strokeDrawIn = (tl, el, at, dur) => {
      if (!el) return;
      if (hasDrawSVG)
        tl.to(
          el,
          { drawSVG: "0% 100%", duration: dur, ease: "power1.inOut" },
          at
        );
      else
        tl.to(
          el,
          { strokeDashoffset: 0, duration: dur, ease: "power1.inOut" },
          at
        );
    };

    const strokeDrawOutOpp = (tl, el, at, dur) => {
      if (!el) return;
      if (hasDrawSVG) {
        tl.to(
          el,
          { drawSVG: "100% 100%", duration: dur, ease: "power1.inOut" },
          at
        );
      } else {
        const L = _len(el) || 0;
        tl.to(
          el,
          { strokeDashoffset: -L, duration: dur, ease: "power1.inOut" },
          at
        );
      }
    };

    // ===== helper MotionPath (sempre su #mp-path) =====
    const mpSetAtKey = (key, t01 = 0) => {
      if (!hasMP) return;
      const mv = moverByKey.get(String(key));
      if (!mv) return;

      gsap.set(mv, {
        motionPath: {
          path: motionPath,
          align: motionPath,
          alignOrigin: [0.5, 0.5],
          start: t01,
          end: t01,
        },
      });
    };

    const mpSetAllAt0 = () => KEYS.forEach((k) => mpSetAtKey(k, 0));

    // ===== amount + mon vars =====
    const amt = { v: 1300 };
    const fmt = (n) => (Number(n) || 0).toFixed(2);
    const setAmountNow = (n) => {
      if (amountEl) amountEl.textContent = fmt(n);
    };

    const tweenAmountTo = (tl, toVal, at, dur = 0.65) => {
      if (!amountEl) return;

      if (hasScramble) {
        tl.to(
          amountEl,
          {
            duration: dur,
            scrambleText: { text: fmt(toVal), chars: "0123456789." },
            ease: "power1.inOut",
            onComplete: () => {
              amt.v = Number(toVal);
              setAmountNow(amt.v);
            },
          },
          at
        );
      } else {
        tl.to(
          amt,
          {
            v: Number(toVal),
            duration: dur,
            ease: "power1.inOut",
            onUpdate: () => setAmountNow(amt.v),
            onComplete: () => setAmountNow(amt.v),
          },
          at
        );
      }
    };

    const monSetBase = () => {
      gsap.set(d1, {
        "--svg-o1": "0",
        "--svg-y1": "24px",
        "--svg-o2": "0",
        "--svg-y2": "-24px",
        "--svg-o3": "0",
        "--svg-y3": "-24px",
      });
    };

    const monAnimIn = (tl, idx, at, dur = 0.55) => {
      const i = String(idx);
      tl.to(
        d1,
        {
          [`--svg-o${i}`]: 1,
          [`--svg-y${i}`]: "0px",
          duration: dur,
          ease: "power1.out",
        },
        at
      );
    };

    // ===== reset =====
    const resetAll = () => {
      this._syncAndDraw(d1);
      this._syncAndDraw(d2);

      gsap.set(d1, { "--op": "0", "--op-s": "1" });
      gsap.set(d2, { "--op": "0", "--op-s": "1" });
      gsap.set(d3, { "--op": "0" });
      gsap.set(cont, { "--cont-op": "0" });

      KEYS.forEach((k) => {
        const c = clientByKey.get(k);
        if (c) gsap.set(c, { x: "-110%", opacity: 0 });
      });

      movers.forEach((m) =>
        gsap.set(m, { opacity: 0, clearProps: "transform" })
      );
      mpSetAllAt0();

      strokeHide(strokeAll);

      amt.v = 1300;
      setAmountNow(amt.v);
      monSetBase();

      this._setHiddenDraw([s1, s2]);
    };

    resetAll();

    // ===== TL ON =====
    const tlOn = gsap.timeline({
      paused: true,
      defaults: { overwrite: "auto" },
    });

    tlOn.add(() => {
      gsap.set(cont, { "--cont-op": "1" });

      this._syncAndDraw(d1);
      this._syncAndDraw(d2);
      this._setHiddenDraw([s1, s2]);

      strokeHide(strokeAll);
      movers.forEach((m) =>
        gsap.set(m, { opacity: 0, clearProps: "transform" })
      );
      mpSetAllAt0();

      const c1 = clientByKey.get("1");
      const c2 = clientByKey.get("2");
      const c3 = clientByKey.get("3");
      if (c2) gsap.set(c2, { x: "-110%", opacity: 0 });
      if (c3) gsap.set(c3, { x: "-110%", opacity: 0 });
      if (c1) gsap.set(c1, { x: "0%", opacity: 1 });

      amt.v = 1300;
      setAmountNow(amt.v);
      monSetBase();
    }, 0);

    this._drawInOnTl(
      tlOn,
      s1,
      { duration: cfg.on.drawDur, ease: cfg.on.ease },
      cfg.on.strokeAt
    );
    this._drawInOnTl(
      tlOn,
      s2,
      { duration: cfg.on.drawDur, ease: cfg.on.ease },
      cfg.on.strokeAt + 0.2
    );

    tlOn
      .to(
        d1,
        { "--op": "1", duration: cfg.on.opDur, ease: cfg.on.ease },
        cfg.on.opAt
      )
      .to(
        d1,
        { "--op-s": "0", duration: cfg.on.opDur, ease: cfg.on.ease },
        cfg.on.opAt
      );

    tlOn
      .to(
        d2,
        { "--op": "1", duration: cfg.on.opDur, ease: cfg.on.ease },
        cfg.on.opAt + 0.2
      )
      .to(
        d2,
        { "--op-s": "0", duration: cfg.on.opDur, ease: cfg.on.ease },
        cfg.on.opAt
      );

    tlOn.to(
      d3,
      { "--op": "1", duration: cfg.on.opDur, ease: cfg.on.ease },
      cfg.on.opAt + 0.2
    );

    // ===== TL LOOP =====
    let loopDC = null;

    const p = {
      drawDur: 1,
      gap: 0.15,
      moveDur: 1.9,
      outDur: 1,
      amountDur: 0.9,
      monDur: 0.75,
      switchDur: 0.6,
      hold: 0.35,
      endGap: 0.8,
    };

    const baseDelay = isTouch ? 0 : cfg.loop?.repeatDelay ?? 0;
    const tlLoop = gsap.timeline({
      paused: true,
      repeat: isTouch ? 0 : -1,
      repeatDelay: baseDelay + (p.endGap ?? 0),
      defaults: { overwrite: "auto" },
    });

    const stepMoveKey = (key, at, amountTo, monIdx) => {
      const k = String(key);
      const stroke = strokeByKey.get(k);
      const mv = moverByKey.get(k);
      if (!stroke || !mv) return at;

      tlLoop.add(() => {
        strokeHide(strokeAll);
        mpSetAtKey(k, 0);
        gsap.set(mv, { opacity: 0 });
      }, at);

      strokeDrawIn(tlLoop, stroke, at, p.drawDur);

      tlLoop.to(
        mv,
        { opacity: 1, duration: 0.12, ease: "power1.out" },
        at + p.gap
      );

      // motion (se plugin assente, rimane fermo ma non rompe)
      if (hasMP) {
        tlLoop.to(
          mv,
          {
            duration: p.moveDur,
            ease: "none",
            motionPath: {
              path: motionPath,
              align: motionPath,
              alignOrigin: [0.5, 0.5],
              start: 0,
              end: 1,
            },
          },
          at + p.gap
        );
      } else {
        tlLoop.to({}, { duration: p.moveDur }, at + p.gap);
      }

      const tEnd = at + p.gap + p.moveDur;

      tlLoop.to(
        mv,
        { opacity: 0, duration: 0.12, ease: "power1.out" },
        tEnd - 0.08
      );
      strokeDrawOutOpp(tlLoop, stroke, tEnd, p.outDur);

      tweenAmountTo(tlLoop, amountTo, tEnd + 0.02, p.amountDur);
      monAnimIn(tlLoop, monIdx, tEnd + 0.02, p.monDur);

      tlLoop.add(() => mpSetAtKey(k, 0), tEnd + p.outDur + 0.01);

      return tEnd + Math.max(p.amountDur, p.monDur) + p.hold;
    };

    const switchClients = (fromKey, toKey, at) => {
      const from = clientByKey.get(String(fromKey));
      const to = clientByKey.get(String(toKey));
      if (!from || !to) return at;

      tlLoop.set(to, { x: "-110%", opacity: 0 }, at);

      tlLoop.to(
        from,
        { x: "110%", opacity: 0, duration: p.switchDur, ease: "power1.inOut" },
        at
      );
      tlLoop.to(
        to,
        { x: "0%", opacity: 1, duration: p.switchDur, ease: "power1.inOut" },
        at
      );

      return at + p.switchDur;
    };

    tlLoop.add(() => {
      strokeHide(strokeAll);
      movers.forEach((m) =>
        gsap.set(m, { opacity: 0, clearProps: "transform" })
      );
      mpSetAllAt0();

      const c1 = clientByKey.get("1");
      const c2 = clientByKey.get("2");
      const c3 = clientByKey.get("3");
      if (c2) gsap.set(c2, { x: "-110%", opacity: 0 });
      if (c3) gsap.set(c3, { x: "-110%", opacity: 0 });
      if (c1) gsap.set(c1, { x: "0%", opacity: 1 });
    }, 0);

    let t = 0;
    t = stepMoveKey("1", t, 1275.0, 1);
    t = switchClients("1", "2", t);

    t = stepMoveKey("2", t, 1073.0, 2);
    t = switchClients("2", "3", t);

    t = stepMoveKey("3", t, 1023.0, 3);

    tweenAmountTo(tlLoop, 1300.0, t, 0.7);
    tlLoop.to(
      d1,
      {
        "--svg-o1": 0,
        "--svg-y1": "24px",
        "--svg-o2": 0,
        "--svg-y2": "-24px",
        "--svg-o3": 0,
        "--svg-y3": "-24px",
        duration: 0.7,
        ease: "power1.inOut",
      },
      t
    );

    t += 0.75;
    t = switchClients("3", "1", t);

    tlLoop.add(() => {
      strokeHide(strokeAll);
      movers.forEach((m) =>
        gsap.set(m, { opacity: 0, clearProps: "transform" })
      );
      mpSetAllAt0();
    }, t + 0.05);

    // ===== TL OFF (desktop) =====
    const tlOff = gsap.timeline({
      paused: true,
      defaults: { overwrite: "auto" },
    });
    tlOff.to(cont, { "--cont-op": "0", duration: 0.45, ease: "sine.inOut" }, 0);
    tlOff.add(() => resetAll(), ">");

    // ===== FASI =====
    let phase = "idle"; // idle | on | loop | off
    let pendingPlay = false;

    const killLoopDelay = () => {
      if (loopDC) {
        loopDC.kill();
        loopDC = null;
      }
    };

    const fadeOff = (speed = 1) => {
      if (phase === "off" || phase === "idle") return;

      killLoopDelay();
      try {
        tlLoop.pause(0);
      } catch (_) {}
      try {
        tlOn.pause();
      } catch (_) {}

      phase = "off";
      tlOff.timeScale(speed).restart(true);
      tlOff.eventCallback("onComplete", () => (phase = "idle"));
    };

    const startPlayOnce = () => {
      pendingPlay = false;
      gsap.set(cont, { "--cont-op": "1" });
      tlLoop.restart(true);
    };

    const goOn = () => {
      if (!isTouch) forceOffOthers?.(cont);
      if (phase === "on" || phase === "loop") return;

      killLoopDelay();
      try {
        tlLoop.pause(0);
      } catch (_) {}
      try {
        tlOff.pause(0);
      } catch (_) {}

      resetAll();
      gsap.set(cont, { "--cont-op": "1" });

      phase = "on";
      tlOn.restart(true);

      tlOn.eventCallback("onComplete", () => {
        if (phase !== "on") return;

        if (isTouch) {
          phase = "idle";
          if (pendingPlay) startPlayOnce();
          return;
        }

        phase = "loop";
        killLoopDelay();
        loopDC = gsap.delayedCall(cfg.loop?.delay ?? 0, () => {
          if (phase === "loop") tlLoop.restart(true);
        });
      });
    };

    const goOff = () => fadeOff(1);

    // ===== ScrollTriggers =====
    let stRange = null;
    let stPreOff = null;

    if (isTouch) {
      stRange = ScrollTrigger.create({
        trigger: cont,
        start: startOn,
        once: true,
        onEnter: goOn,
        onEnterBack: goOn,
      });
    } else {
      stRange = ScrollTrigger.create({
        trigger: step,
        start: "top top",
        end: "bottom top",
        onEnter: goOn,
        onEnterBack: goOn,
        onLeave: goOff,
        onLeaveBack: goOff,
      });

      stPreOff = ScrollTrigger.create({
        trigger: step,
        start: cfg?.off?.start ?? "bottom 45%",
        onEnter: goOff,
        onLeaveBack: goOn,
      });
    }

    // ===== UI (touch) =====
    const offs = [];
    let uiState = "idle"; // idle | running | paused
    let progTween = null;

    const tools = isTouch ? step.querySelector(".player_tools") : null;
    const btnPlay = tools
      ? tools.querySelector('.player_tools_btn[data-btn="play_pause"]')
      : null;
    const btnReset = tools
      ? tools.querySelector('.player_tools_btn[data-btn="reset"]')
      : null;
    const prog = tools
      ? tools.querySelector(".player_tools_btn_progress")
      : null;

    const iconPlay = btnPlay
      ? btnPlay.querySelector(".icon_cmd:not(.pause)")
      : null;
    const iconPause = btnPlay ? btnPlay.querySelector(".icon_cmd.pause") : null;

    const loopDur = () => Math.max(0.001, tlLoop.duration() || 0.001);

    const setFill = (v) => {
      if (!prog) return;
      gsap.set(prog, { "--fill": v });
      prog.setAttribute(
        "aria-valuenow",
        String(Math.round(parseFloat(v) || 0))
      );
    };

    const killProg = () => {
      if (progTween) {
        progTween.kill();
        progTween = null;
      }
    };

    const uiIdle = () => {
      uiState = "idle";
      if (btnPlay) {
        btnPlay.classList.remove("is-active");
        btnPlay.setAttribute("aria-pressed", "false");
        btnPlay.setAttribute("aria-label", "Avvia animazione");
      }
      if (iconPlay) iconPlay.classList.add("is-active");
      if (iconPause) iconPause.classList.remove("is-active");
      killProg();
      setFill("0%");
    };

    const uiRunningStart = () => {
      uiState = "running";
      if (btnPlay) {
        btnPlay.classList.add("is-active");
        btnPlay.setAttribute("aria-pressed", "true");
        btnPlay.setAttribute("aria-label", "Pausa animazione");
      }
      if (iconPlay) iconPlay.classList.remove("is-active");
      if (iconPause) iconPause.classList.add("is-active");

      killProg();
      if (prog) {
        setFill("0%");
        progTween = gsap.to(prog, {
          "--fill": "100%",
          duration: loopDur(),
          ease: "none",
          overwrite: "auto",
          onUpdate: () => {
            const raw = gsap.getProperty(prog, "--fill");
            const n = parseFloat(String(raw).replace("%", "")) || 0;
            prog.setAttribute("aria-valuenow", String(Math.round(n)));
          },
        });
      }
    };

    const uiRunningResume = () => {
      uiState = "running";
      if (btnPlay) {
        btnPlay.classList.add("is-active");
        btnPlay.setAttribute("aria-pressed", "true");
        btnPlay.setAttribute("aria-label", "Pausa animazione");
      }
      if (iconPlay) iconPlay.classList.remove("is-active");
      if (iconPause) iconPause.classList.add("is-active");
      if (progTween) progTween.resume();
    };

    const uiPaused = () => {
      uiState = "paused";
      if (btnPlay) {
        btnPlay.classList.add("is-active");
        btnPlay.setAttribute("aria-pressed", "true");
        btnPlay.setAttribute("aria-label", "Riprendi animazione");
      }
      if (iconPlay) iconPlay.classList.add("is-active");
      if (iconPause) iconPause.classList.remove("is-active");
      if (progTween) progTween.pause();
    };

    const resetToOn = () => {
      pendingPlay = false;
      try {
        tlLoop.pause(0);
      } catch (_) {}
      uiIdle();
      phase = "idle";
      goOn(); // torna SOLO ON (mai OFF su touch)
    };

    // touch: a fine ciclo torna play
    tlLoop.eventCallback("onComplete", () => {
      if (isTouch) uiIdle();
    });

    // ===== API (touch+desktop) =====
    cont.__fluxForceOff = (speed = 2.5) => {
      if (isTouch) return resetToOn(); // touch: non spegniamo mai
      if (phase === "idle") return;
      fadeOff(speed);
    };

    cont.__fluxPlayOnce = () => {
      if (phase === "on") {
        pendingPlay = true;
        return;
      }
      if (
        phase === "idle" &&
        String(gsap.getProperty(cont, "--cont-op")) === "0"
      ) {
        pendingPlay = true;
        goOn();
        return;
      }
      startPlayOnce();
    };

    cont.__fluxPause = () => {
      try {
        tlLoop.pause();
      } catch (_) {}
    };
    cont.__fluxResume = () => {
      try {
        tlLoop.resume();
      } catch (_) {}
    };
    cont.__fluxResetOn = () => resetToOn();

    // ===== Bind UI (touch) + autopause =====
    if (isTouch) {
      if (prog) {
        prog.setAttribute("role", "progressbar");
        prog.setAttribute("aria-valuemin", "0");
        prog.setAttribute("aria-valuemax", "100");
        prog.setAttribute("aria-valuenow", "0");
      }

      uiIdle();

      if (!window.pageSpecificListeners) window.pageSpecificListeners = [];

      const bindPage = (el, event, handler) => {
        if (!el) return () => {};
        el.addEventListener(event, handler, { passive: false });
        window.pageSpecificListeners.push({ element: el, event, handler });
        return () => {
          try {
            el.removeEventListener(event, handler);
          } catch (_) {}
        };
      };

      if (btnPlay) {
        const onClick = (e) => {
          e.preventDefault();

          if (uiState === "running") {
            cont.__fluxPause?.();
            uiPaused();
            return;
          }

          if (uiState === "paused") {
            cont.__fluxResume?.();
            uiRunningResume();
            return;
          }

          // idle
          cont.__fluxPlayOnce?.();
          uiRunningStart(); // (come flux0) → progress parte e poi la loop parte subito o dopo ON
        };

        offs.push(bindPage(btnPlay, "click", onClick));

        //  auto-pause SOLO (niente auto-resume)
        offs.push(
          this._setupAutoPauseTouch(step, cont, {
            getUiState: () => uiState,
            pause: () => {
              cont.__fluxPause?.();
              uiPaused();
            },
          })
        );
      }

      if (btnReset) {
        const onReset = (e) => {
          e.preventDefault();
          resetToOn();
        };
        offs.push(bindPage(btnReset, "click", onReset));
      }
    }

    // init state
    if (ScrollTrigger.isInViewport(step, 0.15)) goOn();
    else resetAll();

    return () => {
      try {
        offs.forEach((fn) => fn());
      } catch (_) {}
      killProg();
      killLoopDelay();

      this._safeKill?.(stRange);
      if (stPreOff) this._safeKill?.(stPreOff);
      this._safeKill?.(tlOn);
      this._safeKill?.(tlLoop);
      this._safeKill?.(tlOff);

      try {
        delete cont.__fluxForceOff;
        delete cont.__fluxPlayOnce;
        delete cont.__fluxPause;
        delete cont.__fluxResume;
        delete cont.__fluxResetOn;
      } catch (_) {}

      resetAll();
    };
  },
  // ----------------------------------
  // DESTROY
  // ----------------------------------
  destroy: function () {
    if (this._cleanups?.length) {
      for (let i = this._cleanups.length - 1; i >= 0; i--) {
        try {
          this._cleanups[i]();
        } catch (_) {}
      }
      this._cleanups.length = 0;
    }

    this._inited = false;
    this._scope = null;
    this._w = null;
    this._a = null;
    this._panels = null;
  },
};
/** Sezione Numeri e volti da Rapicom home */
window.valueSectionAnimation = window.valueSectionAnimation || {
  // helper BP (usa window.bp se c’è, altrimenti matchMedia)
  bp: function () {
    const is = window.bp?.is;
    if (typeof is !== "function") {
      // se bp non c'è, non blocco nulla: assumo desktop (safe)
      return { lgUp: true, touchDown: false, phoneDown: false };
    }

    return {
      xsOnly: is("xsOnly"),
      smOnly: is("smOnly"),
      mdOnly: is("mdOnly"),
      lgUp: is("lgUp"),
      touchDown: is("touchDown"), // (max-width: 991px)
      phoneDown: is("phoneDown"), // (max-width: 767px)
    };
  },

  // cache section (una sola volta)
  _getSection: function () {
    if (this.__section && document.contains(this.__section))
      return this.__section;
    this.__section = document.querySelector("#value_sec");
    return this.__section;
  },

  // -------------------------------------------------
  // HEADER (solo .section_head)
  // -------------------------------------------------
  header: function () {
    if (!window.gsap || !window.ScrollTrigger) return;

    const section = this._getSection();
    if (!section) return;

    const header = section.querySelector(".section_head");
    if (!header) return;

    // cleanup re-init timeline precedente
    try {
      header.__valueHeaderTl?.kill?.();
      header.__valueHeaderTl = null;
    } catch (_) {}

    // cleanup re-init split precedente
    try {
      header.__splitLines?.revert?.();
      header.__splitLines = null;
    } catch (_) {}

    let lines = [header];

    if (window.SplitText) {
      const sp = SplitText.create(header, { type: "lines", autoSplit: true });
      header.__splitLines = sp;
      lines = sp.lines || [header];
    }

    if (!lines.length) return;

    gsap.set(lines, { opacity: 0, y: 50 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: header,
        start: "top 85%",
        once: true,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
      },
    });

    tl.to(
      lines,
      {
        opacity: 1,
        y: 0,
        stagger: 0.08,
        ease: "power1.inOut",
        duration: 0.6,
        overwrite: "auto",
      },
      0
    );

    header.__valueHeaderTl = tl;
  },

  // -------------------------------------------------
  // VALUES (3 value_wrap dentro data_value_wrap)
  // -------------------------------------------------
  values: function () {
    if (!window.gsap || !window.ScrollTrigger) return;

    const section = this._getSection();
    if (!section) return;

    const valuesWrap = section.querySelector(".data_value_wrap");
    if (!valuesWrap) return;

    const wraps = Array.from(valuesWrap.querySelectorAll(".value_wrap"));
    if (!wraps.length) return;

    // cleanup re-init
    try {
      valuesWrap.__valuesTl?.kill?.();
      valuesWrap.__valuesTl = null;
    } catch (_) {}

    const splitChars = (el) => {
      if (!el) return [];
      if (!window.SplitText) return [el];

      if (el.__splitChars?.chars?.length) return el.__splitChars.chars;

      const sp = SplitText.create(el, { type: "chars", autoSplit: true });
      el.__splitChars = sp;
      return sp.chars || [el];
    };

    const items = wraps
      .map((wrap) => {
        const value =
          wrap.querySelector(".t-value.t-grad") ||
          wrap.querySelector(".t-value");
        const plus = wrap.querySelector(".t-plus");
        const value2 = wrap.querySelector(".t-value-2");

        if (!value) return null;

        return {
          wrap,
          value,
          plus,
          value2,
          chars: splitChars(value),
        };
      })
      .filter(Boolean);

    if (!items.length) return;

    // stato iniziale globale
    gsap.set(valuesWrap, { "--border-o": 0 });

    items.forEach((item) => {
      gsap.set(item.chars, { opacity: 0, y: 20 });
      if (item.plus) {
        gsap.set(item.plus, { scale: 0, transformOrigin: "50% 50%" });
      }
      if (item.value2) {
        gsap.set(item.value2, { opacity: 0 });
      }
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: valuesWrap,
        start: "top 80%",
        once: true,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
      },
    });

    // bordo una sola volta
    tl.to(
      valuesWrap,
      {
        "--border-o": 1,
        duration: 0.35,
        ease: "power1.inOut",
        overwrite: "auto",
      },
      0.15
    );

    // ogni wrap entra in sequenza
    items.forEach((item, i) => {
      const at = i * 0.16;

      tl.to(
        item.chars,
        {
          opacity: 1,
          y: 0,
          stagger: 0.03,
          ease: "power1.inOut",
          duration: 0.55,
        },
        at
      );

      if (item.plus) {
        tl.to(
          item.plus,
          {
            scale: 1,
            duration: 0.35,
            ease: "back.out(1.4)",
          },
          at + 0.42
        );
      }

      if (item.value2) {
        tl.to(
          item.value2,
          {
            opacity: 1,
            duration: 0.35,
            ease: "power1.inOut",
          },
          at + 0.56
        );
      }
    });

    valuesWrap.__valuesTl = tl;
  },
  sliderTracks: function () {
    const bp = this.bp?.() || { phoneDown: false };
    if (!window.gsap || !window.ScrollTrigger) return;

    const section =
      this._getSection?.() || document.querySelector("#value_sec");
    if (!section) return;

    const wrap = section.querySelector(".slider_value_sec");
    if (!wrap) return;

    const top = wrap.querySelector(".slider-value_track.top");
    const bottom = wrap.querySelector(".slider-value_track.bottom");
    if (!top || !bottom) return;

    const phone = bp.phoneDown
      ? wrap.querySelector(".slider-value_track.phone")
      : null;

    // cleanup re-init
    try {
      wrap.__sliderTl?.kill?.();
      wrap.__sliderTl = null;
    } catch (_) {}

    try {
      wrap.__sliderIO?.disconnect?.();
      wrap.__sliderIO = null;
    } catch (_) {}

    // pre-warm immagini slider (anti scatti da lazy/decode)
    if ("IntersectionObserver" in window) {
      const imgs = wrap.querySelectorAll("img");

      const io = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;
          imgs.forEach((img) => {
            try {
              img.loading = "eager";
              img.decoding = "async";
            } catch (_) {}
          });
          io.disconnect();
          if (wrap.__sliderIO === io) wrap.__sliderIO = null;
        },
        { rootMargin: "600px 0px" }
      );

      wrap.__sliderIO = io;
      io.observe(wrap);
    }

    const distFor = (track) => {
      const w = wrap.clientWidth || 0;
      const sw = track?.scrollWidth || 0;
      return Math.max(0, Math.round(sw - w));
    };

    const cache = { dT: 0, dB: 0, dP: 0 };

    gsap.set([top, bottom, phone].filter(Boolean), {
      willChange: "transform",
      force3D: true,
    });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: wrap,
        start: "top 85%",
        end: "bottom 15%",
        scrub: 0.25,
        invalidateOnRefresh: true,
        onRefreshInit: () => {
          cache.dT = distFor(top);
          cache.dB = distFor(bottom);
          cache.dP = phone ? distFor(phone) : 0;

          gsap.set(top, { x: 0 });
          if (phone) gsap.set(phone, { x: 0 });
          gsap.set(bottom, { x: -cache.dB });
        },
      },
    });

    // TOP: 0 -> -dT
    tl.to(top, { x: () => -cache.dT, overwrite: "auto" }, 0);

    // PHONE: stessa direzione del top
    if (phone) {
      tl.to(phone, { x: () => -cache.dP, overwrite: "auto" }, 0);
    }

    // BOTTOM: direzione opposta
    tl.to(bottom, { x: () => -cache.dB + cache.dT, overwrite: "auto" }, 0);

    wrap.__sliderTl = tl;

    // refresh dopo immagini
    const imgs = wrap.querySelectorAll("img");
    let pending = 0;

    imgs.forEach((img) => {
      if (img.complete) return;
      pending++;
      img.addEventListener(
        "load",
        () => {
          pending--;
          if (pending <= 0) ScrollTrigger.refresh();
        },
        { once: true }
      );
    });

    if (!pending) ScrollTrigger.refresh();
  },
  // API
  init: function () {
    this._getSection();
    this.header();
    this.values();
    this.sliderTracks();
  },
};
window.serviceSectionHScroll = window.serviceSectionHScroll || {
  // -------------------------------------------------
  // BP
  // -------------------------------------------------
  bp: function () {
    const is = window.bp?.is;
    if (typeof is !== "function") {
      // safe: desktop
      return { lgUp: true, touchDown: false, phoneDown: false };
    }
    return {
      xsOnly: is("xsOnly"),
      smOnly: is("smOnly"),
      mdOnly: is("mdOnly"),
      lgUp: is("lgUp"),
      touchDown: is("touchDown"), // (max-width: 991px)
      phoneDown: is("phoneDown"), // (max-width: 767px)
    };
  },

  _getSection: function () {
    if (this.__section && document.contains(this.__section))
      return this.__section;
    this.__section = document.querySelector("#service_sec");
    return this.__section;
  },

  reset: function () {
    const section = this._getSection();
    if (!section) return;

    this.wrap = section.querySelector(".h-scroll_wrap");
    this.content = section.querySelector(".h-scroll_content");
    this.trigWrap = section.querySelector(".h-scroll-trig_wrap");

    // triggers (dentro trigWrap)
    this.trigFirst = section.querySelector("#trig_first");
    this.trigSecond = section.querySelector("#trig_second");

    // panels
    this.panelZero = section.querySelector("#panelZero");
    this.panelFirst = section.querySelector("#panelFirst");
    this.panelSecond = section.querySelector("#panelSecond");

    // images (fallback: primo img nel panel)
    this.imgZero =
      section.querySelector("#imgZero") || this.panelZero?.querySelector("img");
    this.imgFirst =
      section.querySelector("#imgFirst") ||
      this.panelFirst?.querySelector("img");
    this.imgSecond =
      section.querySelector("#imgSecond") ||
      this.panelSecond?.querySelector("img");

    if (!this.wrap || !this.content || !this.trigWrap) return;

    this.init();
  },

  // -------------------------------------------------
  // misure
  // -------------------------------------------------
  _getScrollLen: function () {
    const w = this.wrap?.clientWidth || window.innerWidth || 0;
    const sw = this.trigWrap?.scrollWidth || 0;
    return Math.max(0, Math.round(sw - w));
  },

  _setVarScroll: function (scrollLen) {
    // altezza necessaria: lunghezza scroll + viewport
    const needed = Math.max(0, Math.round(scrollLen + window.innerHeight));
    document.documentElement.style.setProperty("--var-scroll", `${needed}px`);
  },

  // -------------------------------------------------
  // core: pin content + move trigWrap
  // -------------------------------------------------
  setupHorizontal: function () {
    if (!window.gsap || !window.ScrollTrigger) return;

    const wrap = this.wrap;
    const content = this.content;
    const trigWrap = this.trigWrap;

    if (!wrap || !content || !trigWrap) return;

    // evita doppio setup
    if (wrap.dataset.hScrollBound === "1") return;
    wrap.dataset.hScrollBound = "1";

    // PREWARM IMMAGINI (come contatti slider)
    if (wrap.dataset.ioBound !== "1" && "IntersectionObserver" in window) {
      wrap.dataset.ioBound = "1";

      const imgs = wrap.querySelectorAll("img");
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;

          imgs.forEach((img) => {
            try {
              img.loading = "eager";
              img.decoding = "async";
            } catch (_) {}
          });

          io.disconnect();
        },
        { rootMargin: "600px 0px" }
      );

      io.observe(wrap);
    }

    // base reset
    gsap.set(trigWrap, { x: 0, willChange: "transform" });

    const cache = { scrollLen: 0 };

    // kill eventuali vecchi ST/TL
    try {
      this.horizontalTL?.scrollTrigger?.kill?.();
    } catch (_) {}
    try {
      this.horizontalTL?.kill?.();
    } catch (_) {}

    // timeline orizzontale
    this.horizontalTL = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: wrap,
        start: "top top",
        end: () => `+=${cache.scrollLen}`, // aggiornata in refreshInit
        scrub: true,
        pin: content,
        invalidateOnRefresh: true,
        onRefreshInit: () => {
          cache.scrollLen = this._getScrollLen();
          this._setVarScroll(cache.scrollLen);

          // reset coerente prima del refresh
          gsap.set(trigWrap, { x: 0 });
        },
      },
    });

    // muoviamo SOLO i trigger/pannelli (trigWrap)
    this.horizontalTL.to(
      trigWrap,
      {
        x: () => -cache.scrollLen,
        overwrite: "auto",
      },
      0
    );

    // refresh dopo load immagini (misure e pin più stabili)
    const imgs = wrap.querySelectorAll("img");
    let pending = 0;

    imgs.forEach((img) => {
      if (img.complete) return;
      pending++;
      img.addEventListener(
        "load",
        () => {
          pending--;
          if (pending <= 0) ScrollTrigger.refresh();
        },
        { once: true }
      );
    });

    if (!pending) ScrollTrigger.refresh();

    // ResizeObserver sul wrap: refresh (debounce)
    if (window.ResizeObserver) {
      if (wrap.__hScrollRO) {
        try {
          wrap.__hScrollRO.disconnect();
        } catch (_) {}
      }
      const ro = new ResizeObserver(() => {
        this.__roCall?.kill?.();
        this.__roCall = gsap.delayedCall(0.12, () => {
          ScrollTrigger.refresh();
        });
      });
      ro.observe(wrap);
      wrap.__hScrollRO = ro;
    }
  },

  // -------------------------------------------------
  // CLIPS: lega --clip-r allo scroll orizzontale
  // -------------------------------------------------
  setupClips: function () {
    if (!window.gsap || !window.ScrollTrigger) return;
    if (!this.horizontalTL) return;

    const trigFirst = this.trigFirst;
    const trigSecond = this.trigSecond;
    const panelFirst = this.panelFirst;
    const panelSecond = this.panelSecond;

    // kill precedenti (se re-init)
    if (Array.isArray(this.__clipTL)) {
      this.__clipTL.forEach((tl) => {
        try {
          tl?.scrollTrigger?.kill?.();
        } catch (_) {}
        try {
          tl?.kill?.();
        } catch (_) {}
      });
    }
    this.__clipTL = [];

    const BASE_FIRST = "95%";
    const BASE_SECOND = "97.5%";
    const MID_SECOND = "95%";

    const resetBase = () => {
      if (panelFirst) gsap.set(panelFirst, { "--clip-r": BASE_FIRST });
      if (panelSecond) gsap.set(panelSecond, { "--clip-r": BASE_SECOND });
    };

    resetBase();

    // TRIG FIRST: panelFirst 95->0 e panelSecond 97.5->95
    if (trigFirst && panelFirst && panelSecond) {
      const tlClip1 = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: trigFirst,
          containerAnimation: this.horizontalTL,
          start: "left left",
          end: "right left",
          scrub: true,
          invalidateOnRefresh: true,
          onRefreshInit: resetBase,
        },
      });

      tlClip1.fromTo(
        panelFirst,
        { "--clip-r": BASE_FIRST },
        { "--clip-r": "0%", overwrite: "auto" },
        0
      );
      tlClip1.fromTo(
        panelSecond,
        { "--clip-r": BASE_SECOND },
        { "--clip-r": MID_SECOND, overwrite: "auto" },
        0
      );

      this.__clipTL.push(tlClip1);
    }

    // TRIG SECOND: panelSecond 95->0 (reverse torna a 95, uniforme)
    if (trigSecond && panelSecond) {
      const tween2 = gsap.fromTo(
        panelSecond,
        { "--clip-r": MID_SECOND },
        {
          "--clip-r": "0%",
          ease: "none",
          overwrite: "auto",
          immediateRender: false,
          scrollTrigger: {
            trigger: trigSecond,
            containerAnimation: this.horizontalTL,
            start: "left left",
            end: "right left",
            scrub: true,
            invalidateOnRefresh: true,
            onRefreshInit: resetBase,
          },
        }
      );

      this.__clipTL.push(tween2);
    }
  },

  // -------------------------------------------------
  // IMAGES: motion legato allo scroll orizzontale (SEPARATO dai clip)
  // -------------------------------------------------
  setupImagesMotion: function () {
    if (!window.gsap || !window.ScrollTrigger) return;
    if (!this.horizontalTL) return;

    const trigFirst = this.trigFirst;
    const trigSecond = this.trigSecond;

    const imgZero = this.imgZero;
    const imgFirst = this.imgFirst;
    const imgSecond = this.imgSecond;

    if (!imgZero || !imgFirst || !imgSecond) return;

    // kill precedenti
    if (Array.isArray(this.__imgTL)) {
      this.__imgTL.forEach((tl) => {
        try {
          tl?.scrollTrigger?.kill?.();
        } catch (_) {}
        try {
          tl?.kill?.();
        } catch (_) {}
      });
    }
    this.__imgTL = [];

    // BASE STATE
    gsap.set([imgZero, imgFirst, imgSecond], {
      transformOrigin: "0% 100%",
      force3D: true,
      willChange: "transform",
    });

    gsap.set(imgZero, { xPercent: 0, yPercent: 0, scale: 1 });
    gsap.set(imgFirst, { xPercent: 100, yPercent: -75, scale: 0.5 });
    gsap.set(imgSecond, { xPercent: 100, yPercent: -25, scale: 0.5 });

    // TRIGGER 1:
    // imgZero out + imgFirst in + imgSecond prende set di imgFirst (iniziale)
    if (trigFirst) {
      const tl1 = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: trigFirst,
          containerAnimation: this.horizontalTL,
          start: "left left",
          end: "right left",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tl1.to(imgZero, { xPercent: -50, scale: 0.6 }, 0);
      tl1.to(imgFirst, { xPercent: 0, yPercent: 0, scale: 1 }, 0);
      tl1.to(imgSecond, { xPercent: 100, yPercent: -75, scale: 0.5 }, 0);

      this.__imgTL.push(tl1);
    }

    // TRIGGER 2:
    // imgFirst si muove come imgZero prima + imgSecond entra
    if (trigSecond) {
      const tl2 = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: trigSecond,
          containerAnimation: this.horizontalTL,
          start: "left left",
          end: "right left",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tl2.to(imgFirst, { xPercent: -50, scale: 0.6 }, 0);
      tl2.to(imgSecond, { xPercent: 0, yPercent: 0, scale: 1 }, 0);

      this.__imgTL.push(tl2);
    }
  },

  init: function () {
    if (!this.bp().lgUp) return;
    this.setupHorizontal();
    this.setupClips();
    this.setupImagesMotion();
  },
};
window.contactSectionAnimation = window.contactSectionAnimation || {
  // -------------------------------------------------
  // BP helper (come gli altri)
  // -------------------------------------------------
  bp: function () {
    const is = window.bp?.is;
    if (typeof is !== "function") {
      // se bp non c'è, non blocco nulla: assumo desktop (safe)
      return { lgUp: true, touchDown: false, phoneDown: false };
    }

    return {
      xsOnly: is("xsOnly"),
      smOnly: is("smOnly"),
      mdOnly: is("mdOnly"),
      lgUp: is("lgUp"),
      touchDown: is("touchDown"), // (max-width: 991px)
      phoneDown: is("phoneDown"), // (max-width: 767px)
    };
  },

  _getSection: function () {
    if (this.__section && document.contains(this.__section))
      return this.__section;
    this.__section = document.querySelector("#contacts_sec");
    return this.__section;
  },

  _splitChars: function (el) {
    if (!el) return [];
    if (!window.SplitText) return [el];
    if (el.__splitChars?.chars?.length) return el.__splitChars.chars;
    const sp = SplitText.create(el, { type: "chars", autoSplit: true });
    el.__splitChars = sp;
    return sp.chars || [el];
  },

  // -------------------------------------------------
  // HEADS: .section_head (sub-h chars + mix)
  // -------------------------------------------------
  heads: function () {
    if (!window.gsap || !window.ScrollTrigger) return;

    const section = this._getSection();
    if (!section) return;

    //  unico header container
    const head = section.querySelector(".contact_item_header");
    if (!head) return;

    if (head.dataset.headBound === "1") return;
    head.dataset.headBound = "1";

    const subH = head.querySelector(".sub-h");
    const h3 = head.querySelector(".h-rap");
    const pars = Array.from(head.querySelectorAll(".par"));
    if (!subH || !h3) return;

    const subHChars = this._splitChars(subH);

    // stato iniziale head
    gsap.set(subHChars, {
      opacity: 0,
      rotateX: 90,
      transformOrigin: "50% 50% -0.5em",
    });
    gsap.set(h3, { "--txt-mix": "0%" });
    if (pars.length) gsap.set(pars, { "--txt-mix": "0%" });

    const tl = gsap.timeline({ paused: true });

    tl.to(
      subHChars,
      {
        opacity: 1,
        rotateX: 0,
        stagger: 0.05,
        ease: "power1.inOut",
        duration: 0.6,
      },
      0
    ).to(h3, { "--txt-mix": "100%", ease: "power1.inOut", duration: 0.6 }, 0.2);

    if (pars.length) {
      tl.to(
        pars,
        {
          "--txt-mix": "100%",
          ease: "power1.inOut",
          duration: 0.6,
          stagger: 0.08,
        },
        0.3
      );
    }

    const st = ScrollTrigger.create({
      trigger: head, // trigger sul container unico
      start: "top 85%",
      once: true,
      onEnter: () => tl.play(0),
      onEnterBack: () => tl.play(0),
    });

    if (ScrollTrigger.isInViewport(head, 0.2)) tl.play(0);

    // opzionale: refs per debug/cleanup
    head.__headST = st;
    head.__headTL = tl;
  },

  // -------------------------------------------------
  // PIXEL MAP (TUO CODICE INVARIATO)
  // -------------------------------------------------
  pixelMap: function () {
    if (!window.gsap || !window.ScrollTrigger) return;

    const section = this._getSection();
    if (!section) return;

    const wrap = section.querySelector(".pixel-map-wrap");
    const srcImg = wrap?.querySelector("img.pixel-map-src");
    if (!wrap || !srcImg) return;

    if (wrap.dataset.pixelMapBound === "1") return;
    wrap.dataset.pixelMapBound = "1";

    // -------- options (override via data-*)
    const opt = {
      gap: parseFloat(wrap.dataset.pixelGap) || (this.bp().phoneDown ? 12 : 10),
      size: parseFloat(wrap.dataset.pixelSize) || (this.bp().phoneDown ? 7 : 6),
      max:
        parseInt(wrap.dataset.pixelMax || "", 10) ||
        (this.bp().phoneDown ? 700 : 1200),
      alpha: parseInt(wrap.dataset.pixelAlpha || "", 10) || 30,
      radius: parseFloat(wrap.dataset.pixelRadius) || 1,
      dprCap: this.bp().phoneDown ? 1.25 : 1.5,

      // più lento di default (override con data-pulse-dur)
      pulseDur: parseFloat(wrap.dataset.pulseDur) || 3.6,
      pulseAmp: parseFloat(wrap.dataset.pulseAmp) || 0.08,

      // flicker più calmo (override con data-flicker-rate)
      flickerRate: parseFloat(wrap.dataset.flickerRate) || 0.65,

      // render fps stabile (override con data-pixel-fps)
      fps: parseFloat(wrap.dataset.pixelFps) || 30,
    };

    opt.gap = Math.max(4, opt.gap);
    opt.size = Math.min(Math.max(1, opt.size), opt.gap);

    // -------- canvas overlay
    const canvas = document.createElement("canvas");
    canvas.className = "pixel-map-canvas";
    wrap.appendChild(canvas);

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const off = document.createElement("canvas");
    const octx = off.getContext("2d", { willReadFrequently: true });

    const state = {
      w: 0,
      h: 0,
      dpr: 1,
      pts: [],
      progress: 0,

      // tempo continuo: niente “riparte”
      time: 0, // 0..1 animato
      timeBase: 0, // accumula cicli

      img: null,
      blobUrl: null,
      pulseTl: null,

      stReveal: null,
      stPulseGate: null,

      ro: null,
      roCall: null,

      // render loop stabile
      raf: 0,
      running: false,
      lastFrame: 0,
    };

    // ----------------------------
    // palette: green -> digital-flow
    // ----------------------------
    const mix = (a, b, t) => a + (b - a) * t;

    const cssVar = (name) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const cssToRgb = (val) => {
      const d = document.createElement("div");
      d.style.color = val;
      document.body.appendChild(d);
      const c = getComputedStyle(d).color; // rgb(r,g,b)
      d.remove();
      const m = c.match(/(\d+),\s*(\d+),\s*(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : [0, 174, 239];
    };

    let RGB_A = null;
    let RGB_B = null;

    const ensurePalette = () => {
      RGB_A = cssToRgb(
        cssVar("--primary-color--liberation-green") || "#00D084"
      );
      RGB_B = cssToRgb(cssVar("--primary-color--digital-flow") || "#00AEEF");
    };

    const fillForT = (t) => {
      const r = Math.round(mix(RGB_A[0], RGB_B[0], t));
      const g = Math.round(mix(RGB_A[1], RGB_B[1], t));
      const b = Math.round(mix(RGB_A[2], RGB_B[2], t));
      return `rgb(${r},${g},${b})`;
    };

    // ----------------------------
    // drawing helpers
    // ----------------------------
    const roundRect = (c, x, y, w, h, r) => {
      if (r <= 0) {
        c.fillRect(x, y, w, h);
        return;
      }
      if (c.roundRect) {
        c.beginPath();
        c.roundRect(x, y, w, h, r);
        c.fill();
        return;
      }
      const rr = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + rr, y);
      c.arcTo(x + w, y, x + w, y + h, rr);
      c.arcTo(x + w, y + h, x, y + h, rr);
      c.arcTo(x, y + h, x, y, rr);
      c.arcTo(x, y, x + w, y, rr);
      c.closePath();
      c.fill();
    };

    const measure = () => {
      const r = wrap.getBoundingClientRect();
      const w = Math.max(0, Math.round(r.width));
      const h = Math.max(0, Math.round(r.height));
      if (!w || !h) return false;

      const dpr = Math.min(opt.dprCap, window.devicePixelRatio || 1);

      state.w = w;
      state.h = h;
      state.dpr = dpr;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      return true;
    };

    // ----------------------------
    // load svg image safely
    // ----------------------------
    const loadSourceImage = async () => {
      const src = srcImg.currentSrc || srcImg.src;
      if (!src) return null;

      try {
        srcImg.decoding = "async";
      } catch (_) {}
      try {
        srcImg.loading = "eager";
      } catch (_) {}

      const isSvg = src.split("?")[0].toLowerCase().endsWith(".svg");

      if (isSvg) {
        try {
          const res = await fetch(src, { mode: "cors" });
          const text = await res.text();
          const blob = new Blob([text], {
            type: "image/svg+xml;charset=utf-8",
          });
          const url = URL.createObjectURL(blob);
          state.blobUrl = url;

          return await new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = reject;
            im.src = url;
          });
        } catch (_) {
          return await new Promise((resolve, reject) => {
            const im = new Image();
            im.crossOrigin = "anonymous";
            im.onload = () => resolve(im);
            im.onerror = reject;
            im.src = src;
          }).catch(() => null);
        }
      }

      return await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = src;
      }).catch(() => null);
    };

    // ----------------------------
    // build points
    // ----------------------------
    const buildPoints = () => {
      if (!state.img || !state.w || !state.h) return;

      ensurePalette();

      const cols = Math.max(2, Math.floor(state.w / opt.gap));
      const rows = Math.max(2, Math.floor(state.h / opt.gap));

      off.width = cols;
      off.height = rows;

      octx.clearRect(0, 0, cols, rows);
      octx.drawImage(state.img, 0, 0, cols, rows);

      const data = octx.getImageData(0, 0, cols, rows).data;

      const pts = [];
      for (let y = 0; y < rows; y++) {
        const ty = y / Math.max(1, rows - 1);
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const a = data[i + 3];
          if (a < opt.alpha) continue;

          pts.push({
            x: x * opt.gap,
            y: y * opt.gap,
            a: a / 255,
            t: ty,
            fill: fillForT(ty),
            k: ty + Math.random() * 0.12,

            seed: Math.random() * 1000,
            ph:
              (x / Math.max(1, cols - 1)) * 2.2 +
              ty * 2.2 +
              Math.random() * 0.8,

            th: 0.4 + Math.random() * 0.12,
            tw: 0.1 + Math.random() * 0.06,
          });
        }
      }

      pts.sort((p1, p2) => p1.k - p2.k);

      if (pts.length > opt.max) {
        const out = [];
        const step = pts.length / opt.max;
        for (let i = 0; i < opt.max; i++) out.push(pts[Math.floor(i * step)]);
        state.pts = out;
      } else {
        state.pts = pts;
      }

      srcImg.style.opacity = "0";
    };

    // ----------------------------
    // render
    // ----------------------------
    const render = (p) => {
      const prog = Math.max(0, Math.min(1, p));
      state.progress = prog;

      ctx.clearRect(0, 0, state.w, state.h);

      const total = state.pts.length || 0;
      if (!total) return;

      const n = Math.floor(total * prog);
      if (n <= 0) return;

      const tau = Math.PI * 2;
      const baseS = 0.92 + 0.08 * prog;

      const t = state.timeBase + state.time;

      // precompute
      const sPulse = tau * t;
      const sFlick = tau * t * opt.flickerRate;

      const smoothstep = (e0, e1, x) => {
        const u = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
        return u * u * (3 - 2 * u);
      };

      const offLevel = 0.1;

      for (let i = 0; i < n; i++) {
        const pt = state.pts[i];

        const pp = 0.5 + 0.5 * Math.sin(sPulse + pt.ph);

        const pulseK = 1 - opt.pulseAmp + opt.pulseAmp * pp;
        let alphaK = 0.75 + 0.25 * pp;

        const ff = 0.5 + 0.5 * Math.sin(sFlick + pt.seed);

        const tw = typeof pt.tw === "number" ? pt.tw : 0.12;
        const on = smoothstep(pt.th - tw, pt.th + tw, ff);

        alphaK *= offLevel + (1 - offLevel) * on;
        alphaK *= 0.9 + 0.25 * ff;

        const s = baseS * pulseK;
        const sz = opt.size * s;

        ctx.globalAlpha = pt.a * Math.min(1, alphaK);
        ctx.fillStyle = pt.fill;

        roundRect(ctx, pt.x, pt.y, sz, sz, opt.radius);
      }

      ctx.globalAlpha = 1;
    };

    const rebuild = () => {
      if (!measure()) return;
      buildPoints();
      render(state.progress || 0);
    };

    let scrolling = false;
    let scrollTO = 0;

    const onScroll = () => {
      scrolling = true;
      clearTimeout(scrollTO);
      scrollTO = setTimeout(() => (scrolling = false), 120);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // ----------------------------
    // render loop stabile (fps)
    // ----------------------------
    const startLoop = () => {
      if (state.running) return;
      state.running = true;
      state.lastFrame = performance.now();

      const frame = (now) => {
        if (!state.running) return;

        const targetFps = scrolling ? 16 : opt.fps; // <— qui il trucco
        const step = 1000 / Math.max(10, targetFps);

        if (now - state.lastFrame >= step) {
          state.lastFrame = now;
          render(state.progress);
        }

        state.raf = requestAnimationFrame(frame);
      };

      state.raf = requestAnimationFrame(frame);
    };

    const stopLoop = () => {
      state.running = false;
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
    };

    // ----------------------------
    // pulse tween (NO onUpdate)
    // ----------------------------
    const ensurePulse = () => {
      if (state.pulseTl) return;

      state.pulseTl = gsap.to(state, {
        time: 1,
        duration: opt.pulseDur,
        ease: "none",
        repeat: -1,
        paused: true,
        onRepeat: () => {
          state.timeBase += 1;
        },
      });
    };

    // ----------------------------
    // ResizeObserver
    // ----------------------------
    if (window.ResizeObserver) {
      state.ro = new ResizeObserver(() => {
        state.roCall?.kill?.();
        state.roCall = gsap.delayedCall(0.1, () => {
          rebuild();
          ScrollTrigger.refresh();
        });
      });
      state.ro.observe(wrap);
    }

    // ----------------------------
    // init async
    // ----------------------------
    (async () => {
      if (!measure()) return;

      if ("IntersectionObserver" in window && wrap.dataset.pixelWarm !== "1") {
        wrap.dataset.pixelWarm = "1";
        const io = new IntersectionObserver(
          (entries) => {
            if (!entries[0]?.isIntersecting) return;
            try {
              srcImg.loading = "eager";
              srcImg.decoding = "async";
            } catch (_) {}
            io.disconnect();
          },
          { rootMargin: "600px 0px" }
        );
        io.observe(wrap);
      }

      state.img = await loadSourceImage();
      if (!state.img) return;

      buildPoints();
      render(0);

      ensurePulse();

      state.stReveal = ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        once: true,
        onEnter: () => {
          rebuild();
          gsap.killTweensOf(state, "progress");

          state.progress = 0;
          render(0);

          gsap.to(state, {
            progress: 1,
            duration: 1.05,
            ease: "power1.inOut",
            overwrite: "auto",
            onUpdate: () => render(state.progress),
            onComplete: () => {
              if (state.stPulseGate?.isActive) {
                state.pulseTl?.play();
                startLoop();
              }
            },
          });
        },
      });

      state.stPulseGate = ScrollTrigger.create({
        trigger: section,
        start: "top 90%",
        end: "bottom 10%",
        onEnter: () => {
          state.pulseTl?.play();
          startLoop();
        },
        onEnterBack: () => {
          state.pulseTl?.play();
          startLoop();
        },
        onLeave: () => {
          state.pulseTl?.pause();
          stopLoop();
        },
        onLeaveBack: () => {
          state.pulseTl?.pause();
          stopLoop();
        },
      });

      if (state.stPulseGate?.isActive) {
        state.pulseTl?.play();
        startLoop();
      } else {
        state.pulseTl?.pause();
        stopLoop();
      }

      ScrollTrigger.refresh();
    })();

    wrap.__pixelMapDestroy = () => {
      try {
        state.roCall?.kill?.();
      } catch (_) {}
      try {
        state.ro && state.ro.disconnect();
      } catch (_) {}

      stopLoop();

      try {
        state.pulseTl && state.pulseTl.kill();
      } catch (_) {}
      try {
        state.stReveal && state.stReveal.kill();
      } catch (_) {}
      try {
        state.stPulseGate && state.stPulseGate.kill();
      } catch (_) {}

      try {
        canvas.remove();
      } catch (_) {}
      srcImg.style.opacity = "";

      if (state.blobUrl) {
        try {
          URL.revokeObjectURL(state.blobUrl);
        } catch (_) {}
        state.blobUrl = null;
      }

      window.removeEventListener("scroll", onScroll);
      delete wrap.dataset.pixelMapBound;
    };
  },

  init: function () {
    this.heads();
    this.pixelMap();
  },
};
window.heroSectionAnimation = window.heroSectionAnimation || {
  bp: function () {
    const is = window.bp?.is;
    if (typeof is !== "function")
      return { lgUp: true, touchDown: false, phoneDown: false };
    return {
      xsOnly: is("xsOnly"),
      smOnly: is("smOnly"),
      mdOnly: is("mdOnly"),
      lgUp: is("lgUp"),
      touchDown: is("touchDown"),
      phoneDown: is("phoneDown"),
    };
  },

  _getSection: function () {
    if (this.__section && document.contains(this.__section))
      return this.__section;
    this.__section = document.querySelector("#hero_sec");
    return this.__section;
  },

  marquee: function () {
    const section = this._getSection();
    if (!section) return;

    const host = section.querySelector(".hero_marquee");
    const wrap = section.querySelector(".hero_marquee_wrapper");
    if (!host || !wrap) return;

    // evita doppio init
    if (wrap.dataset.mqBound === "1") return;
    wrap.dataset.mqBound = "1";

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const opt = {
      // px/sec (override: data-mq-speed="40")
      speed: parseFloat(host.dataset.mqSpeed || "") || 40,
      // left/right (override: data-mq-dir="right")
      dir: (host.dataset.mqDir || "left") === "right" ? 1 : -1,
      // quanto prima “precaricare” per play/pause
      rootMargin: host.dataset.mqMargin || "250px 0px",
      // quanta “coda” vogliamo oltre viewport (px) per evitare vuoti
      bufferPx: parseFloat(host.dataset.mqBuffer || "") || 400,
      // limite sicurezza cloni
      maxClones: parseInt(host.dataset.mqMaxClones || "", 10) || 24,
    };

    const state = {
      x: 0,
      gap: 0,
      raf: 0,
      running: false,
      last: 0,
      ro: null,
      io: null,
      destroyed: false,
      debounce: 0,
    };

    const px = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };

    const readGap = () => {
      const cs = getComputedStyle(wrap);
      const g = cs.columnGap || cs.gap || "0px";
      return px(g);
    };

    const getW = (el) => {
      const r = el.getBoundingClientRect();
      return Math.max(0, r.width || 0);
    };

    const clearClones = () => {
      wrap.querySelectorAll('[data-mq-clone="1"]').forEach((n) => n.remove());
    };

    const getTracks = () =>
      Array.from(wrap.children).filter((n) =>
        n.classList?.contains("hero_marquee_track")
      );

    const sumWidth = (tracks) => {
      const w = tracks.reduce((acc, el) => acc + getW(el), 0);
      return w + Math.max(0, tracks.length - 1) * state.gap;
    };

    const apply = () => {
      wrap.style.transform = `translate3d(${state.x}px,0,0)`;
    };

    // Se contenuto troppo corto, clona finché copre viewport+buffer
    const ensureFill = () => {
      const base = getTracks().filter((n) => n.dataset.mqClone !== "1");
      if (!base.length) return;

      let tracks = getTracks();
      let total = sumWidth(tracks);
      const vw = wrap.getBoundingClientRect().width || window.innerWidth || 0;
      const need = vw + opt.bufferPx;

      let guard = 0;
      while (total < need && tracks.length < opt.maxClones && guard++ < 999) {
        // clono “un giro” di base
        base.forEach((src) => {
          if (tracks.length >= opt.maxClones) return;
          const c = src.cloneNode(true);
          c.dataset.mqClone = "1";
          wrap.appendChild(c);
          tracks.push(c);
        });
        total = sumWidth(tracks);
      }
    };

    // Quando la prima track è uscita tutta, la metto in fondo e compenso x
    const recycleIfNeeded = () => {
      const tracks = getTracks();
      if (tracks.length < 2) return;

      const first = tracks[0];
      const fw = getW(first);
      const threshold = -(fw + state.gap);

      if (opt.dir < 0) {
        // movimento verso sinistra: x scende (negativo)
        // quando wrapper ha traslato oltre la larghezza della prima -> recycle
        if (state.x <= threshold) {
          state.x += fw + state.gap; // compenso per non “saltare”
          wrap.appendChild(first);
        }
      } else {
        // movimento verso destra: x sale (positivo)
        // quando x supera gap+fw (la prima rientra troppo) -> metto l'ultima davanti
        if (state.x >= 0) {
          const last = tracks[tracks.length - 1];
          const lw = getW(last);
          state.x -= lw + state.gap;
          wrap.insertBefore(last, tracks[0]);
        }
      }
    };

    const measure = () => {
      state.gap = readGap();
      clearClones();
      // reset trasformazione prima di misurare
      state.x = 0;
      apply();
      // fill
      ensureFill();
      // safety: trasformazioni stabili
      wrap.style.willChange = "transform";
    };

    const tick = (t) => {
      if (!state.running || state.destroyed) return;
      if (!state.last) state.last = t;

      const dt = Math.min(0.05, (t - state.last) / 1000);
      state.last = t;

      const dx = opt.speed * dt * opt.dir;
      state.x += dx;

      recycleIfNeeded();
      apply();

      state.raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (state.running || state.destroyed) return;
      state.running = true;
      state.last = 0;
      state.raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      state.running = false;
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
    };

    // pause/resume su viewport hero
    if ("IntersectionObserver" in window) {
      state.io = new IntersectionObserver(
        (entries) => {
          const on = !!entries[0]?.isIntersecting;
          if (on) start();
          else stop();
        },
        { rootMargin: opt.rootMargin, threshold: 0.12 }
      );
      state.io.observe(section);
    }

    // resize -> re-measure
    if (window.ResizeObserver) {
      state.ro = new ResizeObserver(() => {
        clearTimeout(state.debounce);
        state.debounce = setTimeout(() => {
          if (state.destroyed) return;
          const was = state.running;
          stop();
          measure();
          if (was) start();
        }, 80);
      });
      state.ro.observe(wrap);
    }

    // init
    measure();
    start();

    // cleanup API
    this.__mqDestroy?.();
    this.__mqDestroy = () => {
      state.destroyed = true;
      stop();
      try {
        state.ro && state.ro.disconnect();
      } catch (_) {}
      try {
        state.io && state.io.disconnect();
      } catch (_) {}
      wrap.style.willChange = "";
      wrap.style.transform = "";
      clearClones();
      delete wrap.dataset.mqBound;
    };
  },

  init: function () {
    this.marquee();
  },

  destroy: function () {
    this.__mqDestroy?.();
  },
};
/** CHI SIAMO */
window.aboutUsAnimation = window.aboutUsAnimation || {
  bp: function () {
    const is = window.bp?.is;
    if (typeof is !== "function") {
      return {
        xsOnly: false,
        smOnly: false,
        mdOnly: false,
        lgUp: true,
        touchDown: false,
        phoneDown: false,
      };
    }

    return {
      xsOnly: is("xsOnly"),
      smOnly: is("smOnly"),
      mdOnly: is("mdOnly"),
      lgUp: is("lgUp"),
      touchDown: is("touchDown"),
      phoneDown: is("phoneDown"),
    };
  },

  destroy: function () {
    this.tl?.scrollTrigger?.kill();
    this.tl?.kill();
    this.tl = null;

    if (this.valueTls?.length) {
      this.valueTls.forEach((tl) => {
        tl?.scrollTrigger?.kill();
        tl?.kill();
      });
    }
    this.valueTls = [];

    document.querySelectorAll("#team_sec .sub-h").forEach((el) => {
      if (el.__splitChars?.revert) {
        el.__splitChars.revert();
      }
      delete el.__splitChars;
    });
  },

  initStoryline: function () {
    const bp = this.bp();
    const isDesktop = !!bp.lgUp;
    const isTouch = !!bp.touchDown;

    if (!isDesktop && !isTouch) return;

    const section = document.getElementById("storyline_sec");
    if (!section) return;

    const storyLine = isDesktop ? section.querySelector(".story_liine") : null;
    const storySteps = isDesktop
      ? gsap.utils.toArray(section.querySelectorAll(".story_step"))
      : [];
    const storyCards = gsap.utils.toArray(
      section.querySelectorAll(".story_card_in")
    );

    if (!storyLine && !storySteps.length && !storyCards.length) return;

    this.tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 60%",
        once: true,
      },
    });

    if (isDesktop && storyLine) {
      this.tl.to(storyLine, {
        scale: 1,
        duration: 1.2,
        ease: "power1.inOut",
      });
    }

    if (isDesktop && storySteps.length) {
      this.tl.to(
        storySteps,
        {
          opacity: 1,
          duration: 0.2,
          ease: "power2.out",
          stagger: 0.4,
        },
        0.05
      );
    }

    if (storyCards.length) {
      this.tl.to(
        storyCards,
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
        },
        isDesktop ? 0 : 0
      );
    }
  },

  initValues: function () {
    const bp = this.bp();
    const isDesktop = !!bp.lgUp;
    const isTouch = !!bp.touchDown;

    if (!isDesktop && !isTouch) return;

    const section = document.getElementById("value_sec");
    if (!section) return;

    const line = section.querySelector(".generic-line");
    const pars = section.querySelector(".par");
    const rows = gsap.utils.toArray(section.querySelectorAll(".value_row"));
    const allCards = gsap.utils.toArray(section.querySelectorAll(".val_card"));

    if (pars) {
      gsap.set(pars, { opacity: 0 });
    }

    if (allCards.length) {
      gsap.set(allCards, { y: 40, opacity: 0 });
    }

    // intro sezione: stessa logica su desktop e touch
    if (line || pars) {
      const valuesIntroTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 60%",
          once: true,
        },
      });

      if (line) {
        valuesIntroTl.to(line, {
          scale: 1,
          duration: 1,
          ease: "power1.inOut",
        });
      }

      if (pars) {
        valuesIntroTl.to(
          pars,
          {
            opacity: 1,
            duration: 0.6,
            ease: "power1.inOut",
          },
          0.6
        );
      }

      this.valueTls.push(valuesIntroTl);
    }

    // desktop: trigger per row
    if (isDesktop) {
      rows.forEach((row) => {
        const cards = gsap.utils.toArray(row.querySelectorAll(".val_card"));
        if (!cards.length) return;

        const rowTl = gsap.timeline({
          scrollTrigger: {
            trigger: row,
            start: "top 70%",
            once: true,
          },
        });

        rowTl.to(cards, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power1.inOut",
          stagger: 0.2,
        });

        this.valueTls.push(rowTl);
      });
    }

    // touch: trigger singolo per card
    if (isTouch) {
      allCards.forEach((card) => {
        const cardTl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            once: true,
          },
        });

        cardTl.to(card, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
        });

        this.valueTls.push(cardTl);
      });
    }
  },
  initMisVis: function () {
    const bp = this.bp();
    if (!bp.lgUp && !bp.touchDown) return;

    const section = document.getElementById("mis_vis_sec");
    if (!section) return;

    const line = section.querySelector(".generic-line");
    const wraps = gsap.utils.toArray(section.querySelectorAll(".mis-vis_wrap"));

    wraps.forEach((wrap) => {
      gsap.set(wrap, { y: 40, opacity: 0 });
    });

    if (!line && !wraps.length) return;

    const misVisTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 60%",
        once: true,
      },
    });

    if (line) {
      misVisTl.to(line, {
        scale: 1,
        duration: 1,
        ease: "power1.inOut",
      });
    }

    if (wraps.length) {
      misVisTl.to(
        wraps,
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.2,
        },
        0.6
      );
    }

    this.valueTls.push(misVisTl);
  },

  _splitChars: function (el) {
    if (!el) return [];
    if (!window.SplitText) return [el];
    if (el.__splitChars?.chars?.length) return el.__splitChars.chars;

    const sp = SplitText.create(el, {
      type: "chars",
      autoSplit: true,
    });

    el.__splitChars = sp;
    return sp.chars || [el];
  },
  initTeam: function () {
    const bp = this.bp();
    const isDesktopLike = !!bp.lgUp || !!bp.touchDown;
    const isPhone = !!bp.phoneDown;

    if (!isDesktopLike && !isPhone) return;

    const section = document.getElementById("team_sec");
    if (!section) return;

    const head = section.querySelector(".team_header_container");
    const headLine = head?.querySelector(".generic-line");
    const headPar = head?.querySelector(".par");
    const cards = gsap.utils.toArray(section.querySelectorAll(".team_card"));

    // stato iniziale header
    if (isDesktopLike && headPar) {
      gsap.set(headPar, { opacity: 0 });
    }

    // intro header sezione
    if (head && (headLine || (isDesktopLike && headPar))) {
      const headTl = gsap.timeline({
        scrollTrigger: {
          trigger: head,
          start: "top 60%",
          once: true,
        },
      });

      if (headLine) {
        headTl.to(headLine, {
          scale: 1,
          duration: 1,
          ease: "power1.inOut",
        });
      }

      if (isDesktopLike && headPar) {
        headTl.to(
          headPar,
          {
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
          },
          0.6
        );
      }

      this.valueTls.push(headTl);
    }

    // cards
    cards.forEach((card) => {
      const hRap = card.querySelector(".h-rap");
      const itemLine = card.querySelector(".team_item_line");
      const subH = card.querySelector(".sub-h");
      const subHChars = subH ? this._splitChars(subH) : [];

      // stato iniziale
      if (isDesktopLike && hRap) {
        gsap.set(hRap, { opacity: 0 });
      }

      if (subHChars.length) {
        gsap.set(subHChars, {
          opacity: 0,
          rotateX: 90,
          transformOrigin: "50% 50% -0.5em",
        });
      }

      if (!hRap && !itemLine && !subHChars.length) return;

      const cardTl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: "top 70%",
          once: true,
        },
      });

      // desktop + touchDown
      if (isDesktopLike && hRap) {
        cardTl.to(hRap, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        });
      }

      if (isDesktopLike && itemLine) {
        cardTl.to(
          itemLine,
          {
            scale: 1,
            duration: 0.8,
            ease: "power1.inOut",
          },
          0
        );
      }

      if (subHChars.length) {
        cardTl.to(
          subHChars,
          {
            opacity: 1,
            rotateX: 0,
            stagger: 0.05,
            ease: "power1.inOut",
            duration: 0.6,
          },
          isDesktopLike ? 0.4 : 0
        );
      }

      this.valueTls.push(cardTl);
    });
  },

  init: function () {
    if (!window.gsap || !window.ScrollTrigger) return;

    this.destroy();
    this.valueTls = [];

    this.initStoryline();
    this.initValues();
    this.initMisVis();
    this.initTeam();
  },
};
/** SERVIZI */
window.servicePageCards = window.servicePageCards || {
  // helper BP (usa window.bp se c’è, altrimenti matchMedia)
  bp: function () {
    const is = window.bp?.is;
    if (typeof is !== "function") {
      // se bp non c'è, non blocco nulla: assumo desktop (safe)
      return { lgUp: true, touchDown: false, phoneDown: false };
    }

    return {
      xsOnly: is("xsOnly"),
      smOnly: is("smOnly"),
      mdOnly: is("mdOnly"),
      lgUp: is("lgUp"),
      touchDown: is("touchDown"), // (max-width: 991px)
      phoneDown: is("phoneDown"), // (max-width: 767px)
    };
  },

  gridCardShellRingInit: function (root) {
    if (!this.bp?.().lgUp) return;
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;

    const scope = root || document;
    const shells = Array.from(scope.querySelectorAll(".grid-card-shell"));
    if (!shells.length) return;

    if (!window.pageSpecificListeners) window.pageSpecificListeners = [];

    shells.forEach((shell) => {
      if (shell.dataset.ringBound === "1") return;
      shell.dataset.ringBound = "1";

      let W = 0,
        H = 0;
      let spot = 0;

      let tx = 0,
        ty = 0;
      let cx = 0,
        cy = 0;

      let raf = 0;
      let inside = false;

      const oTo = gsap.quickTo(shell, "--spot-o", {
        duration: 0.22,
        ease: "power1.out",
      });

      const measure = () => {
        const nw = shell.clientWidth || 0;
        const nh = shell.clientHeight || 0;
        if (!nw || !nh) return;

        // evita “micro flash” da RO se non cambia nulla
        if (nw === W && nh === H && spot) return;

        W = nw;
        H = nh;

        const cs = getComputedStyle(shell);
        const scale = parseFloat(cs.getPropertyValue("--spotScale")) || 1.15;
        const minS = parseFloat(cs.getPropertyValue("--spotMin")) || 360;
        const maxS = parseFloat(cs.getPropertyValue("--spotMax")) || 760;

        const diag = Math.hypot(W, H);
        spot = Math.round(Math.min(maxS, Math.max(minS, diag * scale)));

        shell.style.setProperty("--spot", `${spot}px`);
      };

      const setPos = (x, y) => {
        shell.style.setProperty("--px", `${x.toFixed(1)}px`);
        shell.style.setProperty("--py", `${y.toFixed(1)}px`);
      };

      const tick = () => {
        raf = 0;
        if (!inside) return;

        const k = 0.16; // burro
        cx += (tx - cx) * k;
        cy += (ty - cy) * k;

        setPos(cx, cy);
        raf = requestAnimationFrame(tick);
      };

      const setTargetFromEvent = (e) => {
        const r = shell.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;

        // proiezione sul bordo
        const cx0 = W * 0.5;
        const cy0 = H * 0.5;

        let dx = x - cx0;
        let dy = y - cy0;

        if (dx === 0 && dy === 0) {
          dx = 1;
          dy = -1;
        }

        const sx = Math.abs(dx) / (W * 0.5);
        const sy = Math.abs(dy) / (H * 0.5);
        const t = 1 / Math.max(sx, sy);

        tx = cx0 + dx * t;
        ty = cy0 + dy * t;
      };

      const park = () => {
        // “alto-destra” (puoi cambiare se vuoi)
        setPos(W, 0);
        cx = tx = W;
        cy = ty = 0;
      };

      const onEnter = (e) => {
        inside = true;
        measure();
        setTargetFromEvent(e);

        cx = tx;
        cy = ty; // no scatto
        setPos(cx, cy);

        oTo(1);
        if (!raf) raf = requestAnimationFrame(tick);
      };

      const onMove = (e) => {
        if (!inside) return;
        setTargetFromEvent(e);
        if (!raf) raf = requestAnimationFrame(tick);
      };

      const onLeave = () => {
        inside = false;
        oTo(0);
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        park();
      };

      shell.addEventListener("pointerenter", onEnter, { passive: true });
      shell.addEventListener("pointermove", onMove, { passive: true });
      shell.addEventListener("pointerleave", onLeave, { passive: true });

      window.pageSpecificListeners.push(
        { element: shell, event: "pointerenter", handler: onEnter },
        { element: shell, event: "pointermove", handler: onMove },
        { element: shell, event: "pointerleave", handler: onLeave }
      );

      if (window.ResizeObserver) {
        const ro = new ResizeObserver(measure);
        ro.observe(shell);
        shell.__ringRO = ro;
      }

      // init
      measure();
      park();
      shell.style.setProperty("--spot-o", "0");
    });
  },

  card1LogoMarqueeInit: function (scope) {
    const root = scope || document;
    const hosts = Array.from(root.querySelectorAll(".logo_marquee"));
    if (!hosts.length) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    hosts.forEach((host) => {
      const wrap = host.querySelector(".logo_marquee_wrapper");
      if (!wrap) return;

      // evita doppio init
      if (wrap.dataset.mqBound === "1") return;
      wrap.dataset.mqBound = "1";

      const triggerEl =
        host.closest("#card1-item1, #card1-item2") ||
        host.closest(".grid-card") ||
        host;

      const opt = {
        speed: parseFloat(host.dataset.mqSpeed || "") || 40,
        dir: (host.dataset.mqDir || "left") === "right" ? 1 : -1,
        rootMargin: host.dataset.mqMargin || "250px 0px",
        bufferPx: parseFloat(host.dataset.mqBuffer || "") || 400,
        maxClones: parseInt(host.dataset.mqMaxClones || "", 10) || 24,
      };

      const state = {
        x: 0,
        gap: 0,
        raf: 0,
        running: false,
        last: 0,
        ro: null,
        io: null,
        destroyed: false,
        debounce: 0,
        measured: false,
      };

      const px = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
      };

      const readGap = () => {
        const cs = getComputedStyle(wrap);
        const g = cs.columnGap || cs.gap || "0px";
        return px(g);
      };

      const getW = (el) => {
        const r = el.getBoundingClientRect();
        return Math.max(0, r.width || 0);
      };

      const getTracks = () =>
        Array.from(wrap.children).filter((n) =>
          n.classList?.contains("logo_marquee_track")
        );

      const baseTracks = getTracks().filter((n) => n.dataset.mqClone !== "1");
      if (!baseTracks.length) return;

      const clearClones = () => {
        wrap.querySelectorAll('[data-mq-clone="1"]').forEach((n) => n.remove());
      };

      const restoreBaseOrder = () => {
        baseTracks.forEach((node) => {
          if (node.parentNode === wrap) wrap.appendChild(node);
        });
      };

      const sumWidth = (tracks) => {
        const w = tracks.reduce((acc, el) => acc + getW(el), 0);
        return w + Math.max(0, tracks.length - 1) * state.gap;
      };

      const apply = () => {
        wrap.style.transform = `translate3d(${state.x}px,0,0)`;
      };

      const ensureFill = () => {
        const base = getTracks().filter((n) => n.dataset.mqClone !== "1");
        if (!base.length) return;

        let tracks = getTracks();
        let total = sumWidth(tracks);
        const vw =
          triggerEl.getBoundingClientRect().width || window.innerWidth || 0;
        const need = vw + opt.bufferPx;

        let guard = 0;
        while (total < need && tracks.length < opt.maxClones && guard++ < 999) {
          base.forEach((src) => {
            if (tracks.length >= opt.maxClones) return;
            const c = src.cloneNode(true);
            c.dataset.mqClone = "1";
            wrap.appendChild(c);
            tracks.push(c);
          });
          total = sumWidth(tracks);
        }
      };

      const primeRightDirection = () => {
        if (opt.dir < 0) return;

        const tracks = getTracks();
        if (tracks.length < 2) return;

        const lastTrack = tracks[tracks.length - 1];
        const lw = getW(lastTrack);

        wrap.insertBefore(lastTrack, tracks[0]);
        state.x = -(lw + state.gap);
        apply();
      };

      const recycleIfNeeded = () => {
        const tracks = getTracks();
        if (tracks.length < 2) return;

        const first = tracks[0];
        const fw = getW(first);
        const threshold = -(fw + state.gap);

        if (opt.dir < 0) {
          if (state.x <= threshold) {
            state.x += fw + state.gap;
            wrap.appendChild(first);
          }
        } else {
          if (state.x >= 0) {
            const lastTrack = tracks[tracks.length - 1];
            const lw = getW(lastTrack);
            state.x -= lw + state.gap;
            wrap.insertBefore(lastTrack, tracks[0]);
          }
        }
      };

      const measure = (opts = {}) => {
        const { resetPosition = false } = opts;

        state.gap = readGap();

        clearClones();
        restoreBaseOrder();

        if (resetPosition) {
          state.x = 0;
          apply();
        }

        ensureFill();

        if (opt.dir > 0 && resetPosition) {
          primeRightDirection();
        }

        wrap.style.willChange = "transform";
        apply();
        state.measured = true;
      };

      const tick = (t) => {
        if (!state.running || state.destroyed || !state.measured) return;
        if (!state.last) state.last = t;

        const dt = Math.min(0.05, (t - state.last) / 1000);
        state.last = t;

        state.x += opt.speed * dt * opt.dir;

        recycleIfNeeded();
        apply();

        state.raf = requestAnimationFrame(tick);
      };

      const start = () => {
        if (state.running || state.destroyed || !state.measured) return;
        state.running = true;
        state.last = 0;
        state.raf = requestAnimationFrame(tick);
      };

      const stop = () => {
        state.running = false;
        if (state.raf) cancelAnimationFrame(state.raf);
        state.raf = 0;
      };

      if ("IntersectionObserver" in window) {
        state.io = new IntersectionObserver(
          (entries) => {
            const on = !!entries[0]?.isIntersecting;
            if (on) start();
            else stop();
          },
          {
            rootMargin: opt.rootMargin,
            threshold: 0.12,
          }
        );
        state.io.observe(triggerEl);
      }

      if (window.ResizeObserver) {
        state.ro = new ResizeObserver(() => {
          clearTimeout(state.debounce);
          state.debounce = setTimeout(() => {
            if (state.destroyed) return;
            const was = state.running;
            stop();
            measure({ resetPosition: false });
            if (was) start();
          }, 80);
        });

        // osserva il contenitore stabile, non il wrap che si muove
        state.ro.observe(triggerEl);
      }

      // bootstrap iniziale
      measure({ resetPosition: true });

      // fallback se IO non esiste
      if (!("IntersectionObserver" in window)) {
        start();
      }

      wrap.__mqDestroy = () => {
        state.destroyed = true;
        stop();

        try {
          state.ro && state.ro.disconnect();
        } catch (_) {}

        try {
          state.io && state.io.disconnect();
        } catch (_) {}

        clearTimeout(state.debounce);
        wrap.style.willChange = "";
        wrap.style.transform = "";
        clearClones();
        restoreBaseOrder();
        delete wrap.dataset.mqBound;
      };
    });
  },

  animateServiceCardItems: function (cardsSelector) {
    const bp = this.bp();
    if (!window.gsap || !window.ScrollTrigger) return;

    const section = document.querySelector("#NetCenter");
    if (!section) return;

    const cards = Array.from(section.querySelectorAll(cardsSelector));
    if (!cards.length) return;

    const startCard = bp.phoneDown
      ? "top 65%"
      : bp.touchDown
      ? "top 75%"
      : "top 70%";

    const ease = bp.phoneDown ? "power2.out" : "power1.inOut";

    cards.forEach((card) => {
      const head =
        card.querySelector(".card_header .card_head") ||
        card.querySelector(".card_head");

      const items = gsap.utils.toArray(
        card.querySelectorAll(".card_serv_item")
      );

      if (!head && !items.length) return;

      if (head) {
        gsap.set(head, {
          "--txt-mix": "0%",
          opacity: 0.5,
        });
      }

      if (items.length) {
        gsap.set(items, {
          y: 30,
          opacity: 0,
        });
      }

      // pre-init marquee prima che il card entri davvero in vista
      let mqInited = false;
      ScrollTrigger.create({
        trigger: card,
        start: bp.touchDown ? "top 95%" : "top bottom",
        once: true,
        onEnter: () => {
          if (mqInited) return;
          mqInited = true;
          this.card1LogoMarqueeInit(card);
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: startCard,
          once: true,
        },
      });

      if (head) {
        tl.to(
          head,
          {
            "--txt-mix": "100%",
            opacity: 1,
            duration: 0.6,
            ease: ease,
          },
          0
        );
      }

      if (items.length) {
        tl.to(
          items,
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.08,
          },
          0.15
        );
      }
    });
  },
  // -------------------------------------------------
  // 2) CARD
  // -------------------------------------------------
  card0: function () {
    const bp = this.bp();
    if (!window.gsap || !window.ScrollTrigger) return;

    const section = document.querySelector("#NetCenter");
    if (!section) return;

    const card = section.querySelector("#card0");
    if (!card) return;

    const startCard = bp.phoneDown
      ? "top 65%"
      : bp.touchDown
      ? "top 75%"
      : "top 70%";

    const ease = bp.phoneDown ? "power2.out" : "power1.inOut";

    const head =
      card.querySelector(".card_header .card_head") ||
      card.querySelector(".card_head");

    const btns = gsap.utils.toArray(card.querySelectorAll(".btn-serv-prim"));

    if (!head && !btns.length) return;

    if (head) {
      gsap.set(head, {
        "--txt-mix": "0%",
        opacity: 0.5,
      });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: startCard,
        once: true,
      },
    });

    if (head) {
      tl.to(
        head,
        {
          "--txt-mix": "100%",
          opacity: 1,
          duration: 0.6,
          ease: ease,
        },
        0
      );
    }

    if (btns.length) {
      tl.to(
        btns,
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power1.inOut",
          stagger: 0.05,
        },
        0.18
      );
    }
  },
  card1: function () {
    this.animateServiceCardItems("#card1 #card1-item1, #card1 #card1-item2");
  },
  card2: function () {
    this.animateServiceCardItems("#card2 #card2-item1, #card2 #card2-item2");
  },
  card3: function () {
    this.animateServiceCardItems("#card3 #card3-item1, #card3 #card3-item2");
  },

  // API -------------------------------------------------
  init: function () {
    if (!window.pageSpecificListeners) window.pageSpecificListeners = [];
    this.card0();
    this.card1();
    this.card2();
    this.card3();
    this.gridCardShellRingInit(document.querySelector("#NetCenter"));
  },
};
window.servicePageSections = window.servicePageSections || {
  bp: function () {
    const is = window.bp?.is;
    if (typeof is !== "function") {
      return {
        xsOnly: false,
        smOnly: false,
        mdOnly: false,
        lgUp: true,
        touchDown: false,
        phoneDown: false,
      };
    }

    return {
      xsOnly: is("xsOnly"),
      smOnly: is("smOnly"),
      mdOnly: is("mdOnly"),
      lgUp: is("lgUp"),
      touchDown: is("touchDown"),
      phoneDown: is("phoneDown"),
    };
  },

  _splitWords: function (el) {
    if (!el) return [];
    if (!window.SplitText) return [el];
    if (el.__splitWords?.words?.length) return el.__splitWords.words;

    const sp = SplitText.create(el, {
      type: "words",
      autoSplit: true,
    });

    el.__splitWords = sp;
    return sp.words || [el];
  },

  _start: function () {
    const bp = this.bp();
    return bp.phoneDown ? "top 65%" : bp.touchDown ? "top 75%" : "top 70%";
  },

  destroy: function () {
    if (this._tls?.length) {
      this._tls.forEach((tl) => {
        tl?.scrollTrigger?.kill();
        tl?.kill();
      });
    }
    this._tls = [];

    document.querySelectorAll("#service_sec .h-rap_serv").forEach((el) => {
      if (el.__splitWords?.revert) {
        el.__splitWords.revert();
      }
      delete el.__splitWords;
    });
  },

  allInOne: function () {
    if (!window.gsap || !window.ScrollTrigger) return;

    const section = document.querySelector("#allInOne_sec");
    if (!section) return;

    const wrap = section.querySelector(".all-spec_wrap");
    if (!wrap) return;

    const items = gsap.utils.toArray(wrap.querySelectorAll(".all-spec_item"));
    if (!items.length) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: this._start(),
        once: true,
      },
    });

    tl.to(items, {
      x: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power1.inOut",
      stagger: 0.08,
    });

    this._tls.push(tl);
  },

  serviceHeader: function () {
    if (!window.gsap || !window.ScrollTrigger) return;

    const section = document.querySelector("#service_sec");
    if (!section) return;

    const head = section.querySelector(".section-header");
    if (!head) return;

    const title = head.querySelector(".h-rap_serv");
    const line = head.querySelector(".generic-line");

    if (!title && !line) return;

    const words = title ? this._splitWords(title) : [];

    if (words.length) {
      gsap.set(words, {
        y: 32,
        opacity: 0,
      });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: head,
        start: this._start(),
        once: true,
      },
    });

    if (line) {
      tl.to(
        line,
        {
          scaleX: 1,
          duration: 0.8,
          ease: "power1.inOut",
        },
        0
      );
    }

    if (words.length) {
      tl.to(
        words,
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.06,
        },
        0.12
      );
    }

    this._tls.push(tl);
  },

  init: function () {
    if (!window.gsap || !window.ScrollTrigger) return;

    this.destroy();
    this._tls = [];

    this.allInOne();
    this.serviceHeader();
  },
};
window.mountHomeThreeStatic = function () {
  let tries = 0;
  const MAX = 180;

  function tick() {
    const el = document.querySelector("#canvas-container");
    if (!el) {
      if (tries++ < MAX) requestAnimationFrame(tick);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      if (tries++ < MAX) requestAnimationFrame(tick);
      return;
    }

    const hasCanvas = !!el.querySelector("canvas");

    try {
      if (!hasCanvas) {
        window.SilkFx?.destroy?.();
        window.SilkFx?.init?.({
          container: el,
          deferStart: true,
        });
      }

      window.SilkFx?.resizeNow?.();
    } catch (e) {
      console.error("[mountHomeThreeStatic] init error:", e);
      window.SilkFxLastError = e;
    }
  }

  tick();
};
window.activateHomeThree = function () {
  window.mountHomeThreeStatic?.();

  let tries = 0;
  const MAX = 90;

  function tick() {
    const el = document.querySelector("#canvas-container");
    const hasCanvas = !!el?.querySelector("canvas");

    // Provo comunque a startare: se il motore non è ancora pronto,
    // ci riprovo al frame successivo
    window.SilkFx?.start?.();

    // Se il canvas ancora non c'è, continuo
    if (!hasCanvas) {
      if (tries++ < MAX) requestAnimationFrame(tick);
      return;
    }

    // Se hai uno state affidabile, meglio usarlo
    const st = window.SilkFx?.getState?.();
    const running = !!(
      st &&
      (st.running || st.isRunning || st.active || st.started)
    );

    if (running) return;

    // fallback: continuo a ritentare per un po'
    if (tries++ < MAX) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
};
window.deactivateHomeThree = function () {
  window.SilkFx?.destroy?.();
};
window.backToTopFx = window.backToTopFx || {
  bp: function () {
    const is = window.bp?.is;
    if (typeof is !== "function") {
      return {
        xsOnly: false,
        smOnly: false,
        mdOnly: false,
        lgUp: true,
        touchDown: false,
        phoneDown: false,
      };
    }

    return {
      xsOnly: is("xsOnly"),
      smOnly: is("smOnly"),
      mdOnly: is("mdOnly"),
      lgUp: is("lgUp"),
      touchDown: is("touchDown"),
      phoneDown: is("phoneDown"),
    };
  },

  getTarget: function () {
    const currentContainer =
      document.querySelector('[data-barba="container"]') || document;

    return (
      currentContainer.querySelector("#hero") ||
      currentContainer.querySelector("main") ||
      0
    );
  },

  destroy: function () {
    this.hoverTl?.kill();
    this.hoverTl = null;

    this.scrollDC?.kill();
    this.scrollDC = null;

    const btn = document.getElementById("backTop");
    const icon = btn?.querySelector(".icon-backtop");
    const iconHv = btn?.querySelector(".icon-backtop_hv");

    if (icon && iconHv) {
      gsap.killTweensOf([icon, iconHv]);
      gsap.set(icon, { clearProps: "transform" });
      gsap.set(iconHv, { clearProps: "transform" });
    }
  },

  init: function () {
    if (!window.gsap) return;

    const btn = document.getElementById("backTop");
    if (!btn) return;
    if (btn.dataset.backTopBound === "1") return;

    const icon = btn.querySelector(".icon-backtop");
    const iconHv = btn.querySelector(".icon-backtop_hv");

    if (!icon || !iconHv) return;

    btn.dataset.backTopBound = "1";

    const pressDur = 0.28;

    gsap.set(icon, { scale: 1 });
    gsap.set(iconHv, { scale: 0 });

    this.hoverTl = gsap.timeline({
      paused: true,
      defaults: {
        duration: pressDur,
        ease: "power2.out",
      },
    });

    this.hoverTl.to(icon, { scale: 0 }, 0).to(iconHv, { scale: 1 }, 0);

    const doScrollTop = () => {
      const bp = this.bp();
      const isTouch = !!bp.touchDown;
      const target = this.getTarget();
      const scrollTarget = target || 0;

      if (window.lenisInstance?.instance) {
        window.lenisInstance.scrollTo(scrollTarget, {
          force: true,
          lock: true,
          duration: 1.2,
          onComplete: () => {
            window.lenisInstance?.update?.();
            if (isTouch) this.hoverTl?.reverse();
          },
        });
      } else {
        const top =
          target instanceof HTMLElement
            ? target.getBoundingClientRect().top + window.scrollY
            : 0;

        window.scrollTo({
          top,
          left: 0,
          behavior: "smooth",
        });

        requestAnimationFrame(() => {
          window.lenisInstance?.update?.();
        });

        if (isTouch) {
          gsap.delayedCall(0.35, () => {
            this.hoverTl?.reverse();
          });
        }
      }
    };

    const handleEnter = () => {
      const bp = this.bp();
      if (bp.lgUp) this.hoverTl?.play(0);
    };

    const handleLeave = () => {
      const bp = this.bp();
      if (bp.lgUp) this.hoverTl?.reverse();
    };

    const handlePointerDown = (e) => {
      const bp = this.bp();
      if (!bp.touchDown) return;

      e.preventDefault();

      this.hoverTl?.play(0);

      this.scrollDC?.kill();
      this.scrollDC = gsap.delayedCall(pressDur, () => {
        doScrollTop();
        this.scrollDC = null;
      });
    };

    const handlePointerCancel = () => {
      const bp = this.bp();
      if (!bp.touchDown) return;

      this.scrollDC?.kill();
      this.scrollDC = null;
      this.hoverTl?.reverse();
    };

    const handleClick = (e) => {
      const bp = this.bp();

      if (bp.touchDown) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      doScrollTop();
    };

    btn.addEventListener("mouseenter", handleEnter);
    btn.addEventListener("mouseleave", handleLeave);
    btn.addEventListener("pointerdown", handlePointerDown, { passive: false });
    btn.addEventListener("pointercancel", handlePointerCancel, {
      passive: true,
    });
    btn.addEventListener("click", handleClick);
  },
};


const functionsApi = {
  initBarbaWithGSAP,

  pageTrigger: window.pageTrigger,
  UIanimations: window.UIanimations,
  headerAnimation: window.headerAnimation,

  secondSectionAnimation: window.secondSectionAnimation,
  fluxAnimation: window.fluxAnimation,
  valueSectionAnimation: window.valueSectionAnimation,
  serviceSectionHScroll: window.serviceSectionHScroll,
  contactSectionAnimation: window.contactSectionAnimation,
  heroSectionAnimation: window.heroSectionAnimation,

  aboutUsAnimation: window.aboutUsAnimation,

  servicePageCards: window.servicePageCards,
  servicePageSections: window.servicePageSections,

  mountHomeThreeStatic: window.mountHomeThreeStatic,
  activateHomeThree: window.activateHomeThree,
  deactivateHomeThree: window.deactivateHomeThree,

  backToTopFx: window.backToTopFx,
};

window.RAPIfunctions = window.RAPIfunctions || {};
Object.assign(window.RAPIfunctions, functionsApi);

// serve in modo diretto perché nasce come funzione locale
window.initBarbaWithGSAP = initBarbaWithGSAP;

export default window.RAPIfunctions;

export {
  initBarbaWithGSAP,
};