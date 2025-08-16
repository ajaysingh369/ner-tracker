const LOCALE_VERSION = "4";

const I18N = (() => {
    let dict = {};
    let lang = "en";
    let _resolveReady;
    const readyPromise = new Promise((res) => (_resolveReady = res));
    const CACHE = new Map();
  
    // Merge en + selected locale so missing keys fall back cleanly
    async function load(langCode) {
      const target = langCode || detect();
  
      const base = await loadJSON("/locales/en.json");
      let merged = { ...base };
  
      if (target !== "en") {
        try {
          const loc = await loadJSON(`/locales/${target}.json`);
          merged = { ...base, ...loc };
        } catch (e) {
          console.warn("[i18n] Failed to load", target, e);
        }
      }
  
      dict = merged;
      lang = target;
      document.documentElement.lang = lang;
      localStorage.setItem("lang", lang);
  
      translateDOM();
      _resolveReady?.(); // resolve only once
    }
  
    async function init() {
      // call this once on boot
      await load();
    }
  
    function detect() {
      const saved = localStorage.getItem("lang");
      if (saved) return saved;
      const n = (navigator.language || "en").toLowerCase();
      return n.startsWith("hi") ? "hi" : "en";
    }
  
    async function loadJSON(url) {
        const vurl = `${url}?v=${LOCALE_VERSION}`;
        // First request: avoid stale SW/browser cache
        const res = await fetch(vurl, { cache: "no-store" });
        if (!res.ok) throw new Error(res.status + " " + vurl);
        const json = await res.json();
        return json;

    //   if (CACHE.has(url)) return CACHE.get(url);
    //   const res = await fetch(url, { cache: "force-cache" });
    //   if (!res.ok) throw new Error(res.status + " " + url);
    //   const json = await res.json();
    //   CACHE.set(url, json);
    //   return json;
    }
  
    function t(key, vars) {
      let s = dict[key];
      if (!s) {
        console.warn("[i18n] Missing key:", key);
        return key; // visible during dev if you forgot to add it
      }
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(new RegExp(`{${k}}`, "g"), v);
        }
      }
      return s;
    }
  
    function translateDOM(root = document) {
      root.querySelectorAll("[data-i18n]").forEach((el) => {
        el.textContent = t(el.dataset.i18n);
      });
      root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
        try {
          const map = JSON.parse(el.dataset.i18nAttr);
          for (const [attr, key] of Object.entries(map)) {
            el.setAttribute(attr, t(key));
          }
        } catch (e) {
          console.warn("[i18n] Bad data-i18n-attr JSON:", el, e);
        }
      });
    }
  
    function whenReady() {
      return readyPromise;
    }
  
    function current() {
      return lang;
    }
  
    // Locale-aware formatters
    function dateFormatter(opts) {
      return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-US", opts);
    }
    function numberFormatter(opts) {
      return new Intl.NumberFormat(lang === "hi" ? "hi-IN" : "en-US", opts);
    }
  
    return { init, load, t, translateDOM, whenReady, current, dateFormatter, numberFormatter };
  })();
  