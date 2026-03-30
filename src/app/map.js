// src/app/map.js

// --------------------------------------------------
// Global bootstrap
// --------------------------------------------------
if (typeof window.previousPageID === "undefined") {
  window.previousPageID = null;
}

window.pageSpecificListeners = window.pageSpecificListeners || [];
window.pageSpecificFunctionsMap = window.pageSpecificFunctionsMap || {};
window.jsonPageMap = window.jsonPageMap || {};
window.pageFunctions = window.pageFunctions || {};

window.safeRequestIdleCallback =
  window.safeRequestIdleCallback ||
  function (cb) {
    setTimeout(cb, 50);
  };

// --------------------------------------------------
// Stable references
// --------------------------------------------------
const pageSpecificListeners = window.pageSpecificListeners;
const pageSpecificFunctionsMap = window.pageSpecificFunctionsMap;
const jsonPageMap = window.jsonPageMap;
const pageFunctions = window.pageFunctions;
const safeRequestIdleCallback = window.safeRequestIdleCallback;

// --------------------------------------------------
// RAPImap
// --------------------------------------------------
const RAPImap = window.RAPImap || {};

Object.defineProperty(RAPImap, "previousPageID", {
  get() {
    return window.previousPageID;
  },
  set(value) {
    window.previousPageID = value;
  },
  configurable: true,
});

RAPImap.pageSpecificListeners = pageSpecificListeners;
RAPImap.pageSpecificFunctionsMap = pageSpecificFunctionsMap;
RAPImap.jsonPageMap = jsonPageMap;
RAPImap.pageFunctions = pageFunctions;
RAPImap.safeRequestIdleCallback = safeRequestIdleCallback;

window.RAPImap = RAPImap;

// --------------------------------------------------
// Page map
// --------------------------------------------------
Object.assign(pageSpecificFunctionsMap, {
  "68495c862118366c67fc2cad": {
    name: "home",
    jsonKey: "",
    scripts: [],
    styles: [],
  },
  "69c187a7a72fc802fff1c0c0": {
    name: "servizi",
    jsonKey: "",
    scripts: [],
    styles: [],
  },
  "69afe57b7935bbe862287e12": {
    name: "chiSiamo",
    jsonKey: "",
    scripts: [],
    styles: [],
  },
  "69b011a2a1832ebdf65472ec": {
    name: "contatti",
    jsonKey: "",
    scripts: [],
    styles: [],
  },
  "69b2e6f9dd58a9d528cdd2ae": {
    name: "quattroZeroQuattro",
    jsonKey: "",
    scripts: [],
    styles: [],
  },
});

// --------------------------------------------------
// JSON-LD map
// --------------------------------------------------
Object.assign(jsonPageMap, {
  "68495c862118366c67fc2cad": {
    active: true,
    json: `...`,
  },
  "69c187a7a72fc802fff1c0c0": {
    active: true,
    json: `...`,
  },
  "69afe57b7935bbe862287e12": {
    active: true,
    json: `...`,
  },
  "69b011a2a1832ebdf65472ec": {
    active: true,
    json: `...`,
  },
});

// --------------------------------------------------
// Page functions
// --------------------------------------------------
Object.assign(pageFunctions, {
  home: {
    execute() {
      const fromBarba = !!window.isBarbaTransition;
      const bootSource = window.__homeBootSource || "direct";

      if (window.__homeThreeStartDC) {
        window.__homeThreeStartDC.kill();
        window.__homeThreeStartDC = null;
      }

      if (window.__homeLateBootDC) {
        window.__homeLateBootDC.kill();
        window.__homeLateBootDC = null;
      }

      const profiles = {
        direct: { threeDelay: 0.2, lateDelay: 0.12 },
        button: { threeDelay: 0.55, lateDelay: 0.12 },
        menu: { threeDelay: 0.3, lateDelay: 1.5 },
      };

      const profile = profiles[bootSource] || profiles.direct;

      const initCore = () => {
        if (!fromBarba) {
          unblockScroll?.();
        }
        window.heroSectionAnimation?.init();
        window.UIanimations?.init();
        window.secondSectionAnimation?.init();
      };

      const initThree = () => {
        window.activateHomeThree?.();
        window.__homeThreeStartDC = null;
      };

      const initLate = () => {
        window.fluxAnimation?.init();
        window.valueSectionAnimation?.init();
        window.serviceSectionHScroll?.reset?.();
        window.contactSectionAnimation?.init();
        window.__homeLateBootDC = null;
      };

      window.bp?.applyRemovals?.();
      window.mountHomeThreeStatic?.();
      initCore();

      window.__homeThreeStartDC = gsap.delayedCall(profile.threeDelay, initThree);
      window.__homeLateBootDC = gsap.delayedCall(profile.lateDelay, initLate);

      window.__homeBootSource = null;
    },

    cleanup() {
      if (window.__homeThreeStartDC) {
        window.__homeThreeStartDC.kill();
        window.__homeThreeStartDC = null;
      }

      if (window.__homeLateBootDC) {
        window.__homeLateBootDC.kill();
        window.__homeLateBootDC = null;
      }

      window.__homeBootSource = null;
      window.deactivateHomeThree?.();

      cleanUpTriggers();
      cleanUpPageListeners();
    },
  },

  servizi: {
    execute: function () {
      const fromBarba = !!window.isBarbaTransition;
      const bootSource = window.__servicesBootSource || "direct";

      if (window.__servicesBootDC) {
        window.__servicesBootDC.kill();
        window.__servicesBootDC = null;
      }

      if (window.__servicesLateBootDC) {
        window.__servicesLateBootDC.kill();
        window.__servicesLateBootDC = null;
      }

      const profiles = {
        direct: {
          lateDelay: 0.12,
        },
        button: {
          lateDelay: 0.12,
        },
        menu: {
          lateDelay: 1,
        },
      };

      const profile = profiles[bootSource] || profiles.direct;

      const initCore = () => {
        if (!fromBarba) {
          unblockScroll?.();
        }
        window.heroSectionAnimation?.init();
        window.servicePageCards?.init();
      };

      const initLate = () => {
        window.servicePageSections?.init();
        window.UIanimations?.init();
        window.contactSectionAnimation?.init();
        window.valueSectionAnimation.init();
        window.__servicesBootDC = null;
        window.__servicesLateBootDC = null;
      };

      // solo core subito
      window.bp?.applyRemovals?.();
      initCore();

      if (fromBarba) {
        window.__servicesBootDC = gsap.delayedCall(profile.lateDelay, () => {
          initLate();
          window.__servicesBootDC = null;
        });
      } else {
        window.__servicesLateBootDC = gsap.delayedCall(
          profile.lateDelay,
          () => {
            initLate();
            window.__servicesLateBootDC = null;
          }
        );
      }

      window.__servicesBootSource = null;
    },

    cleanup: function () {
      if (window.__servicesBootDC) {
        window.__servicesBootDC.kill();
        window.__servicesBootDC = null;
      }

      if (window.__servicesLateBootDC) {
        window.__servicesLateBootDC.kill();
        window.__servicesLateBootDC = null;
      }

      window.__servicesBootSource = null;

      window.servicePageCards?.destroy?.();
      window.servicePageSections?.destroy?.();

      cleanUpTriggers();
      cleanUpPageListeners();
    },
  },

  chiSiamo: {
    execute() {
      const fromBarba = !!window.isBarbaTransition;
      if (!fromBarba) {
        unblockScroll?.();
      }
      window.bp?.applyRemovals?.();
      window.aboutUsAnimation?.init();
      window.UIanimations?.init();
      window.contactSectionAnimation?.init();
    },
    cleanup() {
      cleanUpTriggers();
      cleanUpPageListeners();
    },
  },

  contatti: {
    execute() {
      const fromBarba = !!window.isBarbaTransition;
      if (!fromBarba) {
        unblockScroll?.();
      }
    },
    cleanup() {
      cleanUpTriggers();
      cleanUpPageListeners();
    },
  },

  quattroZeroQuattro: {
    execute() {
      const fromBarba = !!window.isBarbaTransition;
      if (!fromBarba) {
        unblockScroll?.();
      }
      window.UIanimations?.init();
    },
    cleanup() {
      cleanUpTriggers();
      cleanUpPageListeners();
    },
  },
});

// --------------------------------------------------
// Breakpoints
// --------------------------------------------------
(function () {
  if (window.bp) return;

  const queries = {
    xsMax: "(max-width: 479px)",
    smMin: "(min-width: 480px)",
    mdMin: "(min-width: 768px)",
    xsOnly: "(max-width: 479px)",
    smOnly: "(min-width: 480px) and (max-width: 767px)",
    mdOnly: "(min-width: 768px) and (max-width: 991px)",
    lgUp: "(min-width: 992px)",
    touchDown: "(max-width: 991px)",
    phoneDown: "(max-width: 767px)",
  };

  let mm = null;
  const flags = {};
  let initialized = false;
  let hasRemovedTouch = false;
  let hasRemovedPhone = false;

  function seed() {
    for (const [k, q] of Object.entries(queries)) {
      try {
        flags[k] = window.matchMedia(q).matches;
      } catch {
        flags[k] = false;
      }
    }
  }

  function applyRemovalsOnce() {
    if (flags.touchDown && !hasRemovedTouch) {
      document.querySelectorAll("[data-remove]").forEach((el) => el.remove());
      hasRemovedTouch = true;
    }

    if (flags.phoneDown && !hasRemovedPhone) {
      document.querySelectorAll("[data-remove-phone]").forEach((el) => el.remove());
      hasRemovedPhone = true;
    }
  }

  function applyRemovals() {
    if (flags.touchDown) {
      document.querySelectorAll("[data-remove]").forEach((el) => el.remove());
    }

    if (flags.phoneDown) {
      document.querySelectorAll("[data-remove-phone]").forEach((el) => el.remove());
    }
  }

  function init() {
    if (initialized) return;

    if (!window.gsap) {
      console.warn("[bp] GSAP non trovato; inizializza GSAP prima di bp.init()");
      return;
    }

    seed();

    mm = gsap.matchMedia();
    mm.add(queries, (ctx) => {
      for (const k in queries) flags[k] = !!ctx.conditions[k];

      document.dispatchEvent(
        new CustomEvent("breakpoints:change", { detail: { ...flags } })
      );
    });

    initialized = true;
  }

  function destroy() {
    mm?.revert();
    mm = null;
    initialized = false;
  }

  function is(key) {
    return !!flags[key];
  }

  function use(map, cb) {
    return mm?.add(map, cb);
  }

  function get() {
    return { ...flags };
  }

  function onChange(fn) {
    const h = (e) => fn(e.detail);
    document.addEventListener("breakpoints:change", h);
    return () => document.removeEventListener("breakpoints:change", h);
  }

  window.bp = {
    init,
    destroy,
    is,
    use,
    get,
    onChange,
    queries,
    applyRemovalsOnce,
    applyRemovals,
  };
})();

export default RAPImap;
export {
  RAPImap,
  pageSpecificListeners,
  pageSpecificFunctionsMap,
  jsonPageMap,
  pageFunctions,
};