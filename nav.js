(function () {
  // ---- Keyboard shortcuts: 1/2/3 (and option+1/2/3) switch page ----
  var pages = {
    Digit1: "index.html",
    Digit2: "oppskrifter.html",
    Digit3: "handleliste.html",
    Numpad1: "index.html",
    Numpad2: "oppskrifter.html",
    Numpad3: "handleliste.html",
  };

  // "index" | "oppskrifter" | "handleliste" — works for both file:// and the
  // deployed clean URLs (/oppskrifter without .html).
  function pageKey() {
    var name = location.pathname.split("/").pop() || "index.html";
    return name.replace(/\.html$/, "") || "index";
  }

  window.addEventListener(
    "keydown",
    function (e) {
      if (e.metaKey || e.ctrlKey) return;
      var page = pages[e.code];
      if (!page) return;
      // Plain digits are ignored while typing in a field; option+digit always works.
      if (!e.altKey) {
        var t = e.target;
        if (t && (t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
        if (t && t.tagName === "INPUT" && t.type !== "checkbox" && t.type !== "radio" && t.type !== "button") return;
      }
      if (pageKey() === page.replace(/\.html$/, "")) return;
      e.preventDefault();
      location.href = page;
    },
    true
  );

  // ---- Floating anchor menu ----
  var tocLinks = [];

  function textOf(h) {
    var clone = h.cloneNode(true);
    var sub = clone.querySelector(".vendor-sub");
    if (sub) sub.parentNode.removeChild(sub);
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function slugify(t) {
    return (
      t
        .toLowerCase()
        .replace(/æ/g, "ae")
        .replace(/ø/g, "o")
        .replace(/å/g, "a")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "del"
    );
  }

  function collectTargets() {
    var targets = [];
    var dishes = document.querySelectorAll("main section.dish");
    if (dishes.length) {
      Array.prototype.forEach.call(dishes, function (sec) {
        var h = sec.querySelector("h2");
        if (h) targets.push({ el: sec, label: textOf(h), sub: false });
      });
      return targets;
    }
    if (document.getElementById("shopping-groups")) {
      Array.prototype.forEach.call(
        document.querySelectorAll("#shopping-groups .shopping-group"),
        function (g) {
          var h = g.querySelector("h3");
          if (h) targets.push({ el: g, label: textOf(h), sub: false });
        }
      );
      return targets;
    }
    Array.prototype.forEach.call(
      document.querySelectorAll("main h2, main section.workflow > h3"),
      function (h) {
        targets.push({ el: h, label: textOf(h), sub: h.tagName === "H3" });
      }
    );
    return targets;
  }

  function buildToc() {
    var old = document.querySelector(".page-toc");
    if (old) old.parentNode.removeChild(old);
    tocLinks = [];
    var targets = collectTargets();
    if (targets.length < 2) return;

    var nav = document.createElement("nav");
    nav.className = "page-toc";
    nav.setAttribute("aria-label", "Innhold på siden");
    var title = document.createElement("div");
    title.className = "page-toc-title";
    title.textContent = "Innhold";
    nav.appendChild(title);

    targets.forEach(function (t) {
      if (!t.el.id) {
        var base = slugify(t.label);
        var id = base;
        var n = 2;
        while (document.getElementById(id)) id = base + "-" + n++;
        t.el.id = id;
      }
      var a = document.createElement("a");
      a.href = "#" + t.el.id;
      a.textContent = t.label;
      a.title = t.label;
      if (t.sub) a.className = "toc-sub";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        t.el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#" + t.el.id);
      });
      nav.appendChild(a);
      tocLinks.push({ a: a, el: t.el });
    });
    document.body.appendChild(nav);
    updateActive();
  }

  function updateActive() {
    if (!tocLinks.length) return;
    var line = window.innerHeight * 0.25;
    var active = null;
    for (var i = 0; i < tocLinks.length; i++) {
      if (tocLinks[i].el.getBoundingClientRect().top <= line) active = tocLinks[i];
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      active = tocLinks[tocLinks.length - 1];
    }
    if (!active) active = tocLinks[0];
    tocLinks.forEach(function (l) {
      l.a.classList.toggle("active", l === active);
    });
  }

  // The shopping list re-renders its groups when the view toggle changes.
  var groupsEl = document.getElementById("shopping-groups");
  if (groupsEl && window.MutationObserver) {
    var rebuildScheduled = false;
    new MutationObserver(function () {
      if (rebuildScheduled) return;
      rebuildScheduled = true;
      requestAnimationFrame(function () {
        rebuildScheduled = false;
        buildToc();
      });
    }).observe(groupsEl, { childList: true });
  }

  // ---- Scroll memory per page + scrollspy ----
  // Guarded storage access: keep the rest of the script alive even where
  // sessionStorage is unavailable (e.g. storage-blocking privacy modes).
  function loadScroll(k) {
    try { return sessionStorage.getItem(k); } catch (e) { return null; }
  }
  function saveScroll(k, v) {
    try { sessionStorage.setItem(k, v); } catch (e) {}
  }
  var scrollKey = "scroll:" + pageKey();
  var saved = loadScroll(scrollKey);
  if (saved && !location.hash) window.scrollTo(0, parseInt(saved, 10));

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        saveScroll(scrollKey, String(Math.round(window.scrollY)));
        updateActive();
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", updateActive);

  buildToc();
})();
