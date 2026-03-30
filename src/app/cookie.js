"use strict";

// Configurazione di base
const cookieConfig = {
  mode: "opt-in",
  cookieMaxAge: 180,
  debugMode: false,
  consentMode: true,
  categories: {
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
    uncategorized: false,
  },
};

// Inizializza Google Consent Mode V2 con le impostazioni predefinite
window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
window.gtag = gtag;

gtag("consent", "default", {
  ad_storage: "denied",
  analytics_storage: "denied",
  functionality_storage: "denied",
  ad_personalization: "denied",
  ad_user_data: "denied",
  security_storage: "denied",
  personalization_storage: "denied",
  wait_for_update: 500,
});

// Modulo cookie
window.cookieManager = window.cookieManager || {
  setCookie: (name, value, days) => {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 86400000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `${name}=${
      value || ""
    }${expires}; path=/; SameSite=None; Secure`;
  },
  getCookie: (name) => {
    const nameEQ = `${name}=`;
    return (
      document.cookie
        .split("; ")
        .find((c) => c.indexOf(nameEQ) === 0)
        ?.substring(nameEQ.length) || null
    );
  },
  eraseCookie: (name) => {
    document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=None; Secure`;
  },
  clearAllCookies: () => {
    document.cookie.split("; ").forEach((cookie) => {
      const name = cookie.split("=")[0];
      document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=None; Secure`;
    });
  },
  clearTrackingCookies: () => {
    const trackingCookies = ["_ga", "_gid", "_gat", "_gac_", "_gtm", "_gcl_au"];
    const domain = window.location.hostname.split(".").slice(-2).join(".");
    trackingCookies.forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=None; Secure`;
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=None; Secure`;
    });
  },
};
const cookieManager = window.cookieManager;
const resetCookies = () => {
  cookieManager.clearAllCookies();
  cookieManager.clearTrackingCookies();
  closeCookiePreferences();
  setTimeout(() => location.reload(), 100);
};

window.resetCookies = resetCookies;

const resetButton = document.querySelector("[cta='reset']");
if (resetButton) resetButton.addEventListener("click", resetCookies);

// UI Manager
window.uiManager = window.uiManager || {
  showBanner: () => animateBanner(),
  hideBanner: () => animateBannerClose(),
  closeBannerWithoutConsent: () => animateBannerClose(),
  handlePreferences: () => {
    cookiePreferences();
    const saved = JSON.parse(cookieManager.getCookie("cta")) || {};
    window.toggleCheckboxAnimation?.(
      "#cookie-marketing",
      "marketing",
      "marketing",
      "marketing",
      saved.marketing,
      true,
    );
    window.toggleCheckboxAnimation?.(
      "#cookie-analytics",
      "analytics",
      "analytics",
      "analytics",
      saved.analytics,
      true,
    );
    window.toggleCheckboxAnimation?.(
      "#cookie-personalization",
      "personalization",
      "personalization",
      "personalization",
      saved.personalization,
      true,
    );
  },
};
const uiManager = window.uiManager;
// Init post-load
window.addEventListener("load", () => {
  const raw = cookieManager.getCookie("cta");

  if (!raw) {
    // Nessun consenso ancora dato → mostra banner subito dopo load (idle)
    window.safeRequestIdleCallback(() => {
      uiManager.showBanner();
    });
  } else {
    // Consenso già dato → aspetta un po' prima di attivare GTM e script
    setTimeout(() => {
      window.safeRequestIdleCallback(() => {
        const saved = JSON.parse(raw) || {};

        gtag("consent", "update", {
          ad_storage: saved.marketing ? "granted" : "denied",
          analytics_storage: saved.analytics ? "granted" : "denied",
          functionality_storage: saved.personalization ? "granted" : "denied",
          ad_personalization: saved.marketing ? "granted" : "denied",
          ad_user_data: saved.marketing ? "granted" : "denied",
          security_storage: saved.essential ? "granted" : "denied",
          personalization_storage: saved.personalization ? "granted" : "denied",
        });

        if (saved.analytics || saved.marketing) activateScripts();
      });
    }, 4000); // aumentare/diminuire leggermente, ma 4s è un buon equilibrio
  }
});

// Consent Manager
const consentManager = {
  allowAll: () => {
    const allTrue = {
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
    };
    gtag(
      "consent",
      "update",
      Object.fromEntries(
        Object.keys(allTrue).map((k) => [k + "_storage", "granted"]),
      ),
    );
    cookieManager.setCookie(
      "cta",
      JSON.stringify(allTrue),
      cookieConfig.cookieMaxAge,
    );
    gtmManager.fireGTMEvent("allCookiesAccepted");
    activateScripts();
    uiManager.hideBanner();
    closeCookiePreferences();
  },
  denyAll: () => {
    const defaults = {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
    };
    gtag(
      "consent",
      "update",
      Object.fromEntries(
        Object.keys(defaults).map((k) => [
          k + "_storage",
          defaults[k] ? "granted" : "denied",
        ]),
      ),
    );
    cookieManager.setCookie(
      "cta",
      JSON.stringify(defaults),
      cookieConfig.cookieMaxAge,
    );
    cookieManager.clearTrackingCookies();
    gtmManager.fireGTMEvent("allCookiesDenied");
    uiManager.hideBanner();
    closeCookiePreferences();
  },
  handleFormSubmit: (e) => {
    e.preventDefault();
    const c = (id) => document.querySelector(id)?.checked || false;
    const consents = {
      essential: true,
      analytics: c("#cookie-analytics"),
      marketing: c("#cookie-marketing"),
      personalization: c("#cookie-personalization"),
    };
    cookieManager.setCookie(
      "cta",
      JSON.stringify(consents),
      cookieConfig.cookieMaxAge,
    );
    gtag(
      "consent",
      "update",
      Object.fromEntries(
        Object.keys(consents).map((k) => [
          k + "_storage",
          consents[k] ? "granted" : "denied",
        ]),
      ),
    );
    if (consents.analytics || consents.marketing) activateScripts();
    gtmManager.updateConsentMode(consents);
    closeCookiePreferences();
  },
};

["[cta='allow']", "[cta='deny']"].forEach((sel) => {
  document.querySelectorAll(sel).forEach((b) => {
    b.addEventListener(
      "click",
      sel.includes("allow") ? consentManager.allowAll : consentManager.denyAll,
    );
  });
});

document.querySelectorAll("[cta='open-preferences']").forEach((b) => {
  b.addEventListener("click", () => {
    uiManager.closeBannerWithoutConsent();
    uiManager.handlePreferences();
  });
});

const preferencesForm = document.querySelector(
  "#wf-form-Cookie-Preferences-form",
);
if (preferencesForm)
  preferencesForm.addEventListener("submit", consentManager.handleFormSubmit);

document
  .querySelector("#preferences-close")
  ?.addEventListener("click", closeCookiePreferences);
document.querySelector("[cta='submit']")?.addEventListener("click", (e) => {
  e.preventDefault();
  consentManager.handleFormSubmit(e);
});
document
  .querySelector("#banner-close")
  ?.addEventListener("click", uiManager.closeBannerWithoutConsent);

const gtmManager = {
  fireGTMEvent: (event) => {
    window.dataLayer.push({ event });
    if (cookieConfig.debugMode) console.log(`Evento GTM ${event} inviato.`);
  },
  updateConsentMode: (c) => {
    if (!cookieConfig.consentMode || !window.gtag) return;
    gtag(
      "consent",
      "update",
      Object.fromEntries(
        Object.keys(c).map((k) => [
          k + "_storage",
          c[k] ? "granted" : "denied",
        ]),
      ),
    );
  },
};

function activateScripts() {
  document.querySelectorAll('script[cta="activate"]').forEach((script) => {
    script.removeAttribute("type");
    if (script.src) {
      const s = document.createElement("script");
      s.async = true;
      s.src = script.src;
      document.head.appendChild(s);
    } else {
      eval(script.innerText);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const toggleCheckboxAnimation = (
    id,
    attr,
    toggleAttr,
    category,
    checked,
    skipAnim = false,
  ) => {
    const box = document.querySelector(id);
    const container = document.querySelector(`[cta-checkbox='${attr}']`);
    const toggle = container?.querySelector(`[cta-toggle='${toggleAttr}']`);
    if (!box || !container || !toggle) return;

    box.checked = checked;
    if (skipAnim) {
      gsap.set(toggle, {
        x: checked ? 20 : 0,
        backgroundColor: checked ? "#f9f9f7" : "",
      });
      gsap.set(container, {
        backgroundColor: checked ? "#00d37f" : "",
      });
    } else {
      gsap.to(toggle, {
        x: checked ? 20 : 0,
        backgroundColor: checked ? "#f9f9f7" : "",
        duration: 0.3,
        ease: "power2.inOut",
      });
      gsap.to(container, {
        backgroundColor: checked ? "#00d37f" : "",
        duration: 0.3,
        ease: "power2.inOut",
      });
    }

    if (!box.dataset.listenerAttached) {
      box.addEventListener("click", () => {
        const state = box.checked;
        gsap.to(toggle, {
          x: state ? 20 : 0,
          backgroundColor: state ? "#f9f9f7" : "",
          duration: 0.3,
          ease: "power2.inOut",
        });
        gsap.to(container, {
          backgroundColor: state ? "#00d37f" : "",
          duration: 0.3,
          ease: "power2.inOut",
        });

        const current = JSON.parse(cookieManager.getCookie("cta")) || {};
        current[category] = state;
        cookieManager.setCookie(
          "cta",
          JSON.stringify(current),
          cookieConfig.cookieMaxAge,
        );
        gtag(
          "consent",
          "update",
          Object.fromEntries(
            Object.keys(current).map((k) => [
              k + "_storage",
              current[k] ? "granted" : "denied",
            ]),
          ),
        );
      });
      box.dataset.listenerAttached = "true";
    }
  };

  window.toggleCheckboxAnimation = toggleCheckboxAnimation;
});

function animateBanner() {
  const container = document.getElementById("rap-cookie-wrap");
  const banner = document.getElementById("banner-cookie");
  if (!banner || !container) return;
  container.classList.add("is-active");
  gsap.to(banner, { y: 0, duration: 0.6, delay: 1.2, ease: "power2.inOut" });
}

function animateBannerClose() {
  const container = document.getElementById("rap-cookie-wrap");
  const banner = document.getElementById("banner-cookie");
  if (!banner || !container) return;

  gsap.to(banner, {
    yPercent: 110,
    duration: 0.5,
    ease: "power2.inOut",
    onComplete: container.classList.remove("is-active"),
  });
}

function cookiePreferences() {
  const preferences = document.querySelector("#cookie-preferences");
  if (preferences) {
    preferences.style.display = "flex";
    gsap.to(preferences, { opacity: 1, duration: 0.5, ease: "power2.inOut" });
  }
}

function closeCookiePreferences() {
  const preferences = document.querySelector("#cookie-preferences");
  if (preferences) {
    gsap.to(preferences, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => (preferences.style.display = "none"),
    });
  }
}


const cookieApi = {
  cookieManager: window.cookieManager,
  uiManager: window.uiManager,
};

window.RAPIcookie = window.RAPIcookie || {};
Object.assign(window.RAPIcookie, cookieApi);

export default window.RAPIcookie;
export { cookieManager, uiManager };