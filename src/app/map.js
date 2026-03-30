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
    json: `{
      "@context": "https://schema.org",
      "@type": "HomePage",
      "@id": "https://rapicom.it/#webpage",
      "url": "https://rapicom.it",
      "name": "Servizi e pagamenti digitali per esercenti e punti vendita | Rapicom",
      "description": "Offri ricariche, pagamenti, gift card, ticketing e welfare aziendale nel tuo punto vendita. Rapicom è il partner digitale per esercenti e aziende.",
      "isPartOf": {
        "@id": "https://rapicom.it/#website"
      },
      "about": {
        "@id": "https://rapicom.it/#organization"
      },
      "inLanguage": "it-IT"
    }`,
  },
  "69c187a7a72fc802fff1c0c0": {
    active: true,
    json: `{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": "https://rapicom.it/servizi/#webpage",
          "url": "https://rapicom.it/servizi",
          "name": "Servizi digitali per esercenti e punti vendita | Rapicom",
          "description": "Scopri i servizi Rapicom per esercenti, punti vendita e aziende: pagamenti, telefonia, wallet, welfare, mobilità, acquisti e soluzioni dedicate.",
          "isPartOf": {
            "@id": "https://rapicom.it/#website"
          },
          "about": {
            "@id": "https://rapicom.it/#organization"
          },
          "inLanguage": "it-IT"
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://rapicom.it/servizi/#breadcrumb",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://rapicom.it"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Servizi",
              "item": "https://rapicom.it/servizi"
            }
          ]
        },
        {
          "@type": "ItemList",
          "@id": "https://rapicom.it/servizi/#services",
          "name": "Servizi digitali Rapicom",
          "description": "Categorie di servizi digitali disponibili sulla piattaforma Net Center per esercenti, punti vendita e aziende.",
          "url": "https://rapicom.it/servizi",
          "numberOfItems": 8,
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "item": {
                "@type": "Service",
                "name": "Pagamenti",
                "provider": {
                  "@id": "https://rapicom.it/#organization"
                },
                "areaServed": {
                  "@type": "Country",
                  "name": "Italy"
                }
              }
            },
            {
              "@type": "ListItem",
              "position": 2,
              "item": {
                "@type": "Service",
                "name": "Telefonia",
                "provider": {
                  "@id": "https://rapicom.it/#organization"
                },
                "areaServed": {
                  "@type": "Country",
                  "name": "Italy"
                }
              }
            },
            {
              "@type": "ListItem",
              "position": 3,
              "item": {
                "@type": "Service",
                "name": "Betting e giochi",
                "provider": {
                  "@id": "https://rapicom.it/#organization"
                },
                "areaServed": {
                  "@type": "Country",
                  "name": "Italy"
                }
              }
            },
            {
              "@type": "ListItem",
              "position": 4,
              "item": {
                "@type": "Service",
                "name": "Wallet",
                "provider": {
                  "@id": "https://rapicom.it/#organization"
                },
                "areaServed": {
                  "@type": "Country",
                  "name": "Italy"
                }
              }
            },
            {
              "@type": "ListItem",
              "position": 5,
              "item": {
                "@type": "Service",
                "name": "Cripto",
                "provider": {
                  "@id": "https://rapicom.it/#organization"
                },
                "areaServed": {
                  "@type": "Country",
                  "name": "Italy"
                }
              }
            },
            {
              "@type": "ListItem",
              "position": 6,
              "item": {
                "@type": "Service",
                "name": "Mobilità",
                "provider": {
                  "@id": "https://rapicom.it/#organization"
                },
                "areaServed": {
                  "@type": "Country",
                  "name": "Italy"
                }
              }
            },
            {
              "@type": "ListItem",
              "position": 7,
              "item": {
                "@type": "Service",
                "name": "Acquisti",
                "provider": {
                  "@id": "https://rapicom.it/#organization"
                },
                "areaServed": {
                  "@type": "Country",
                  "name": "Italy"
                }
              }
            },
            {
              "@type": "ListItem",
              "position": 8,
              "item": {
                "@type": "Service",
                "name": "Welfare",
                "provider": {
                  "@id": "https://rapicom.it/#organization"
                },
                "areaServed": {
                  "@type": "Country",
                  "name": "Italy"
                }
              }
            }
          ]
        }
      ]
    }`,
  },
  "69afe57b7935bbe862287e12": {
    active: true,
    json: `{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AboutPage",
          "@id": "https://rapicom.it/chi-siamo/#webpage",
          "url": "https://rapicom.it/chi-siamo",
          "name": "Chi siamo | Da oltre 20 anni al fianco del tuo business | Rapicom",
          "description": "Dal 2004 Rapicom sviluppa servizi e soluzioni digitali per esercenti, punti vendita e aziende. Scopri la nostra storia e la visione che guida il nostro lavoro.",
          "isPartOf": {
            "@id": "https://rapicom.it/#website"
          },
          "about": {
            "@id": "https://rapicom.it/#organization"
          },
          "inLanguage": "it-IT"
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://rapicom.it/chi-siamo/#breadcrumb",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://rapicom.it"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Chi siamo",
              "item": "https://rapicom.it/chi-siamo"
            }
          ]
        }
      ]
    }
    `,
  },
  "69b011a2a1832ebdf65472ec": {
    active: true,
    json: `{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ContactPage",
          "@id": "https://rapicom.it/contatti/#webpage",
          "url": "https://rapicom.it/contatti",
          "name": "Contatti | Rapicom",
          "description": "Contatta Rapicom per informazioni sui servizi digitali per esercenti, punti vendita e aziende.",
          "isPartOf": {
            "@id": "https://rapicom.it/#website"
          },
          "about": {
            "@id": "https://rapicom.it/#organization"
          },
          "inLanguage": "it-IT"
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://rapicom.it/contatti/#breadcrumb",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://rapicom.it"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Contatti",
              "item": "https://rapicom.it/contatti"
            }
          ]
        }
      ]
    }`,
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