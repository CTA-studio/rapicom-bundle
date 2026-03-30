// Funzione BARBA pulizia Triggers e listeners

function cleanUpTriggers() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

function cleanUpPageListeners() {
  if (!Array.isArray(window.pageSpecificListeners)) {
    window.pageSpecificListeners = [];
    return;
  }

  window.pageSpecificListeners.forEach((rec) => {
    try {
      if (typeof rec === "function") {
        rec();
        return;
      }

      const { element, event, handler, options } = rec || {};
      if (element?.removeEventListener && event && handler) {
        element.removeEventListener(event, handler, options);
      }
    } catch (_) {}
  });

  window.pageSpecificListeners = [];
}

// Funzione principale per gestire le azioni specifiche della pagina

function handlePageSpecificActions() {
  const currentPageID = document.documentElement.getAttribute("data-wf-page");

  // Recupera i dati della pagina corrente dalla mappa
  const pageData = window.pageSpecificFunctionsMap[currentPageID];

  if (!pageData) {
    console.warn(
      `Nessuna mappatura trovata per data-wf-page: ${currentPageID}`
    );
    return;
  }

  // Pulizia della pagina precedente
  if (
    window.previousPageID &&
    window.pageSpecificFunctionsMap[window.previousPageID]
  ) {
    const prevPageData = window.pageSpecificFunctionsMap[window.previousPageID];
    const prevFunctionName = prevPageData.name; // Usa il nome della funzione dalla mappa
    if (window.pageFunctions[prevFunctionName]?.cleanup) {
      window.pageFunctions[prevFunctionName].cleanup();
    }
  }

  // Iniezione del JSON-LD, se disponibile
const jsonData = window.jsonPageMap[pageData.jsonKey || currentPageID];
  if (jsonData?.active && jsonData.json) {
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((el) => el.remove());

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = jsonData.json;
    document.head.appendChild(script);
  }

  // Caricamento risorse e esecuzione delle funzioni specifiche
  const currentFunction = window.pageFunctions[pageData.name];

  if (pageData.scripts || pageData.styles) {
    loadResources(pageData)
      .then(() => {
        currentFunction?.execute();
        window.previousPageID = currentPageID; // Aggiorna la pagina corrente
      })
      .catch((error) => {
        console.error(
          `Errore durante il caricamento delle risorse per: ${pageData.name}`,
          error
        );
      });
  } else {
    console.log(`Nessuna risorsa aggiuntiva per: ${pageData.name}`);
    console.log(`Eseguendo funzione specifica per: ${pageData.name}`);
    currentFunction?.execute();
    window.previousPageID = currentPageID; // Aggiorna la pagina corrente
  }
}

// Funzione per caricare script e stili specifici
function loadResources(pageData) {
  const scriptPromises = (pageData.scripts || []).map((src) => loadScript(src));
  const stylePromises = (pageData.styles || []).map((href) => loadCSS(href));

  return Promise.all([...scriptPromises, ...stylePromises]);
}
// Funzione per caricare script dinamicamente
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (error) => {
        console.error(` Errore nel caricamento dello script: ${src}`);
        reject(error);
      };
      document.head.appendChild(script);
    } else {
      resolve();
    }
  });
}

// Funzione per caricare un file CSS dinamicamente
function loadCSS(href) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = () => {
        //console.log(`CSS caricato: ${href}`);
        resolve();
      };
      link.onerror = (error) => {
        console.error(`Errore nel caricamento del CSS: ${href}`);
        reject(error);
      };
      document.head.appendChild(link);
    } else {
      console.log(`CSS già presente: ${href}`);
      resolve();
    }
  });
}
// Aggiorniamo tutte le META dopo le transizioni
function updatePageMetaAndInteractions(newPageHTML) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(newPageHTML, "text/html");

  // 1. Titolo
  const newTitle = doc.querySelector("title");
  if (newTitle) document.title = newTitle.textContent;

  // 2. data-wf-page
  const newDataWfPage = doc.documentElement.getAttribute("data-wf-page");
  if (newDataWfPage) {
    document.documentElement.setAttribute("data-wf-page", newDataWfPage);
  }

  // 3. Meta description
  updateOrCreateMetaFromDoc(doc, "name", "description");

  // 4. Meta standard social
  const socialMetaProps = [
    "og:title",
    "og:description",
    "og:image",
    "og:url",
    "og:locale",
    "twitter:title",
    "twitter:description",
    "twitter:image",
  ];
  socialMetaProps.forEach((prop) => {
    updateOrCreateMetaFromDoc(doc, "property", prop);
  });

  // 5. Meta extra SEO
  updateOrCreateMetaFromDoc(doc, "name", "image");
  updateOrCreateMetaFromDoc(doc, "itemprop", "image");
  updateOrCreateMetaFromDoc(doc, "name", "url");
  updateOrCreateMetaFromDoc(doc, "name", "robots");

  // 6. <link rel="image_src">
  updateOrCreateLinkFromDoc(doc, "image_src");

  // 7. <link rel="canonical">
  updateOrCreateLinkFromDoc(doc, "canonical");

  // 8. <meta property="og:locale:alternate"> (tutti, se presenti)
  const alternateLocales = doc.querySelectorAll(
    'meta[property="og:locale:alternate"]'
  );

  document
    .querySelectorAll('meta[property="og:locale:alternate"]')
    .forEach((el) => el.remove());
  alternateLocales.forEach((meta) => {
    const clone = meta.cloneNode(true);
    document.head.appendChild(clone);
  });

  // 9. Interazioni Webflow
  restartWebflowInteractions();
}
// Meta tag: aggiorna o crea
function updateOrCreateMetaFromDoc(doc, attrType, attrValue) {
  const newMeta = doc.querySelector(`meta[${attrType}="${attrValue}"]`);
  if (newMeta) {
    let existing = document.head.querySelector(
      `meta[${attrType}="${attrValue}"]`
    );
    if (!existing) {
      existing = document.createElement("meta");
      existing.setAttribute(attrType, attrValue);
      document.head.appendChild(existing);
    }
    existing.setAttribute("content", newMeta.getAttribute("content"));
  }
}
// Link tag: aggiorna o crea
function updateOrCreateLinkFromDoc(doc, relValue) {
  const newLink = doc.querySelector(`link[rel="${relValue}"]`);
  if (newLink) {
    let existing = document.head.querySelector(`link[rel="${relValue}"]`);
    if (!existing) {
      existing = document.createElement("link");
      existing.setAttribute("rel", relValue);
      document.head.appendChild(existing);
    }
    existing.setAttribute("href", newLink.getAttribute("href"));
  }
}

function updateCmsMetaTags(doc) {
  const cmsMetaProps = [
    "og:url",
    "fb:app_id",
    "article:author",
    "article:published_time",
  ];

  cmsMetaProps.forEach((prop) => {
    const newMeta = doc.querySelector(`meta[property="${prop}"]`);
    if (newMeta && newMeta.getAttribute("content")) {
      let existingMeta = document.head.querySelector(
        `meta[property="${prop}"]`
      );
      if (!existingMeta) {
        existingMeta = document.createElement("meta");
        existingMeta.setAttribute("property", prop);
        document.head.appendChild(existingMeta);
      }
      existingMeta.setAttribute("content", newMeta.getAttribute("content"));
    }
  });
}

function restartWebflowInteractions() {
  try {
    if (typeof Webflow !== "undefined") {
      Webflow.destroy();

      // Forza il riavvio asincrono
      setTimeout(() => {
        requestAnimationFrame(() => {
          Webflow.ready();
        });
      }, 100);
    } else {
      console.warn("Webflow non è definito.");
    }
  } catch (error) {
    console.error("Errore nel riavvio delle interazioni Webflow:", error);
  }
}

function trackPageView() {
  if (window.dataLayer) {
    window.dataLayer.push({
      event: "page_view",
      page_path: window.location.pathname,
      page_title: document.title,
    });
  } else {
    console.warn("Data Layer non è disponibile.");
  }
}

//Funzioni per lo Scroll

const body = document.querySelector("body");

function blockScroll() {
  if (!body) return;
  if (body.getAttribute("data-lock") === "true") return;
  body.setAttribute("data-lock", "true");
}

function unblockScroll() {
  if (!body) return;
  if (body.getAttribute("data-lock") !== "true") return;
  body.setAttribute("data-lock", "false");
}

// Variabili globali per la gestione della posizione dello scroll
let scrollPosition = { top: 0, left: 0 };
function getScrollContainers() {
  return document.querySelectorAll("[data-scroll-container]");
}

function saveScrollPosition() {
  scrollPosition.top = window.scrollY || document.documentElement.scrollTop;
  scrollPosition.left = window.scrollX || document.documentElement.scrollLeft;
}

function restoreScrollPosition() {
  window.scrollTo(scrollPosition.left, scrollPosition.top);
}

// Funzione per bloccare lo scroll
function handleBlockScroll() {
  document.documentElement.classList.add("no-scroll"); // Cambiato da body a html
  getScrollContainers().forEach((container) => {
    container.classList.add("scrollable");
  });
  lenisInstance.stop();
}

// Funzione per sbloccare lo scroll
function handleUnblockScroll() {
  document.documentElement.classList.remove("no-scroll"); // Cambiato da body a html
  getScrollContainers().forEach((container) => {
    container.classList.remove("scrollable");
  });
  lenisInstance.start();
}

// Funzione per alternare lo stato dello scroll
function handleToggleScroll() {
  if (document.documentElement.classList.contains("no-scroll")) {
    handleUnblockScroll();
  } else {
    handleBlockScroll();
  }
}

// Inizializza i pulsanti di controllo dello scroll
function initializeScrollControlButtons() {
  const blockScrollButtons = document.querySelectorAll("[data-block-scroll]");
  const unblockScrollButtons = document.querySelectorAll(
    "[data-unblock-scroll]"
  );
  const toggleScrollButtons = document.querySelectorAll("[data-toggle-scroll]");

  blockScrollButtons.forEach((button) =>
    button.addEventListener("click", handleBlockScroll)
  );

  unblockScrollButtons.forEach((button) =>
    button.addEventListener("click", handleUnblockScroll)
  );

  toggleScrollButtons.forEach((button) =>
    button.addEventListener("click", handleToggleScroll)
  );
}

window.lenisInstance = window.lenisInstance || {
  instance: null,
  isStopped: false,

  initialize() {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }

    this.instance = new Lenis({
      restoreScrollPosition: false,
      duration: 1.5,
      orientation: "vertical",
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      infinite: false,
    });

    // aggiorna ScrollTrigger solo quando Lenis emette scroll
    this.instance.on("scroll", ScrollTrigger.update);

    // usa il ticker GSAP, come da integrazione ufficiale
    this._lenisTick = (time) => {
      this.instance.raf(time * 1000);
    };

    gsap.ticker.add(this._lenisTick);
    gsap.ticker.lagSmoothing(0);

    setTimeout(() => {
      this.update();
    }, 300);
  },

  stop() {
    if (this.instance && !this.isStopped) {
      this.instance.stop();
      this.isStopped = true;
    }
  },

  start() {
    if (this.instance && this.isStopped) {
      this.instance.start();
      this.isStopped = false;
    }
  },

  update() {
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh(); // Forza un refresh completo
    }

    if (this.instance) {
      this.instance.raf(performance.now());
    }
  },

  scrollTo(target, options = {}) {
    if (this.instance) {
      this.instance.scrollTo(target, options);
    } else {
      window.scrollTo({
        top: target,
        left: 0,
        behavior: options.immediate ? "instant" : "smooth",
      });
    }
  },

  forceScrollToTop() {
    if (!this.instance) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    this.instance.scrollTo(0, {
      immediate: true,
      force: true,
      lock: true,
    });
  },
};
const lenisInstance = window.lenisInstance;
// Funzione Generazione griglie Responsive dinamiche

window.grid = window.grid || {
  getViewportHeight: function () {
    return (
      window.visualViewport?.height || document.documentElement.clientHeight
    );
  },

  generatePatternGrid: function (
    containerSelector = "#pattern-grid",
    breakpoints = { mobile: 5, tablet: 7, desktop: 11 },
    callback
  ) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const vw = window.innerWidth;
    const vh = this.getViewportHeight();

    let cols =
      vw < 768
        ? breakpoints.mobile
        : vw < 1024
        ? breakpoints.tablet
        : breakpoints.desktop;

    const squareSize = Math.ceil(vw / cols);
    const rows = Math.ceil(vh / squareSize);
    const overdraw = 1;

    container.style.width = `${cols * squareSize}px`;
    container.style.height = `${rows * squareSize}px`;

    // layer dedicato SOLO ai quadrati
    let squaresLayer = container.querySelector(".grid-squares-layer");
    if (!squaresLayer) {
      squaresLayer = document.createElement("div");
      squaresLayer.className = "grid-squares-layer";
      container.prepend(squaresLayer);
    }

    squaresLayer.style.width = "100%";
    squaresLayer.style.height = "100%";
    squaresLayer.innerHTML = "";

    const fragment = document.createDocumentFragment();

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const square = document.createElement("div");
        square.classList.add("grid-square");
        square.style.width = `${squareSize + overdraw * 2}px`;
        square.style.height = `${squareSize + overdraw * 2}px`;
        square.style.left = `${x * squareSize - overdraw}px`;
        square.style.top = `${y * squareSize - overdraw}px`;
        fragment.appendChild(square);
      }
    }

    squaresLayer.appendChild(fragment);

    if (typeof callback === "function") callback();

    console.log(`Griglia: ${cols}×${rows} quadrati generati`);
  },

  rebuildNavAndReconnect: function () {
    this.generatePatternGrid("#pattern-grid", undefined, () => {
      if (window.headerAnimation?.initNav) {
        window.headerAnimation.initNav();
      }
    });
  },

  resize: function () {
    let lastWidth = window.innerWidth;

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (currentWidth === lastWidth) return;
      lastWidth = currentWidth;

      const nav = document.getElementById("nav");
      const navVisible = nav && getComputedStyle(nav)?.visibility === "visible";

      if (window.isAnimating || navVisible) return;

      this.rebuildNavAndReconnect();
    };

    window.addEventListener("resize", debounce(handleResize, 250));

    if (
      window.visualViewport &&
      window.innerWidth < 1024 &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0)
    ) {
      window.visualViewport.addEventListener(
        "resize",
        debounce(() => {
          const navVisible =
            getComputedStyle(document.getElementById("nav"))?.visibility ===
            "visible";
          if (window.isAnimating || navVisible) return;
          console.log("visualViewport resized");
          this.rebuildNavAndReconnect();
        }, 250)
      );
    }

    window.addEventListener("orientationchange", () => {
      const safeRebuild = debounce(() => {
        const navVisible =
          getComputedStyle(document.getElementById("nav"))?.visibility ===
          "visible";
        if (window.isAnimating || navVisible) return;
        this.rebuildNavAndReconnect();
      }, 250);

      safeRebuild();
    });
  },

  init: function () {
    this.generatePatternGrid();
    this.resize();
  },
};


const coreApi = {
  cleanUpTriggers,
  cleanUpPageListeners,
  handlePageSpecificActions,
  loadResources,
  loadScript,
  loadCSS,
  updatePageMetaAndInteractions,
  updateOrCreateMetaFromDoc,
  updateOrCreateLinkFromDoc,
  updateCmsMetaTags,
  restartWebflowInteractions,
  trackPageView,
  blockScroll,
  unblockScroll,
  saveScrollPosition,
  restoreScrollPosition,
  handleBlockScroll,
  handleUnblockScroll,
  handleToggleScroll,
  initializeScrollControlButtons,
  lenisInstance,
  grid: window.grid,
};

window.RAPIcore = window.RAPIcore || {};
Object.assign(window.RAPIcore, coreApi);

Object.assign(window, {
  cleanUpTriggers,
  cleanUpPageListeners,
  handlePageSpecificActions,
  loadResources,
  loadScript,
  loadCSS,
  updatePageMetaAndInteractions,
  updateOrCreateMetaFromDoc,
  updateOrCreateLinkFromDoc,
  updateCmsMetaTags,
  restartWebflowInteractions,
  trackPageView,
  blockScroll,
  unblockScroll,
  saveScrollPosition,
  restoreScrollPosition,
  handleBlockScroll,
  handleUnblockScroll,
  handleToggleScroll,
  initializeScrollControlButtons,
  lenisInstance,
});

export default window.RAPIcore;

export {
  cleanUpTriggers,
  cleanUpPageListeners,
  handlePageSpecificActions,
  loadResources,
  loadScript,
  loadCSS,
  updatePageMetaAndInteractions,
  updateOrCreateMetaFromDoc,
  updateOrCreateLinkFromDoc,
  updateCmsMetaTags,
  restartWebflowInteractions,
  trackPageView,
  blockScroll,
  unblockScroll,
  saveScrollPosition,
  restoreScrollPosition,
  handleBlockScroll,
  handleUnblockScroll,
  handleToggleScroll,
  initializeScrollControlButtons,
  lenisInstance,
};