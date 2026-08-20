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

  // ---- Anchor menu: fixed sidebar on wide screens, floating button otherwise ----
  var tocLinks = [];
  var fab = null;

  function textOf(h) {
    var clone = h.cloneNode(true);
    Array.prototype.forEach.call(
      clone.querySelectorAll(".vendor-sub, .group-meta"),
      function (n) {
        n.parentNode.removeChild(n);
      }
    );
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

  function makeAnchor(t, beforeScroll) {
    var a = document.createElement("a");
    a.href = "#" + t.el.id;
    a.textContent = t.label;
    a.title = t.label;
    if (t.sub) a.className = "toc-sub";
    a.addEventListener("click", function (e) {
      e.preventDefault();
      if (beforeScroll) beforeScroll();
      t.el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", "#" + t.el.id);
    });
    return a;
  }

  function ensureFab() {
    if (fab) return fab;

    var root = document.createElement("div");
    root.className = "toc-fab";

    var backdrop = document.createElement("div");
    backdrop.className = "toc-fab-backdrop";

    var panel = document.createElement("nav");
    panel.className = "toc-fab-panel";
    panel.id = "toc-fab-panel";
    panel.setAttribute("aria-label", "Innhold på siden");

    var pagesRow = document.createElement("div");
    pagesRow.className = "toc-fab-pages";
    [
      ["index.html", "Plan"],
      ["oppskrifter.html", "Oppskrifter"],
      ["handleliste.html", "Handleliste"],
    ].forEach(function (p) {
      var a = document.createElement("a");
      a.href = p[0];
      a.textContent = p[1];
      if (pageKey() === p[0].replace(/\.html$/, "")) a.setAttribute("aria-current", "page");
      pagesRow.appendChild(a);
    });

    var title = document.createElement("div");
    title.className = "page-toc-title";
    title.textContent = "Innhold";

    var list = document.createElement("div");
    list.className = "toc-fab-list";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toc-fab-btn";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "toc-fab-panel");
    btn.setAttribute("aria-label", "Innhold på siden");
    btn.innerHTML = '<span class="toc-fab-icon" aria-hidden="true"><i></i><i></i><i></i></span>';

    function setOpen(open) {
      root.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.documentElement.classList.toggle("toc-fab-lock", open);
      if (open) {
        // Center the current section in the list so long pages open "where you are".
        var active = list.querySelector("a.active");
        if (active) list.scrollTop = active.offsetTop - (list.clientHeight - active.offsetHeight) / 2;
      }
    }

    btn.addEventListener("click", function () {
      setOpen(!root.classList.contains("open"));
    });
    backdrop.addEventListener("click", function () {
      setOpen(false);
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("open")) setOpen(false);
    });

    panel.appendChild(pagesRow);
    panel.appendChild(title);
    panel.appendChild(list);
    root.appendChild(backdrop);
    root.appendChild(panel);
    root.appendChild(btn);
    document.body.appendChild(root);

    fab = {
      root: root,
      list: list,
      close: function () {
        setOpen(false);
      },
    };
    return fab;
  }

  function buildToc() {
    var old = document.querySelector(".page-toc");
    if (old) old.parentNode.removeChild(old);
    tocLinks = [];
    var targets = collectTargets();
    if (targets.length < 2) {
      if (fab) fab.root.style.display = "none";
      return;
    }

    var nav = document.createElement("nav");
    nav.className = "page-toc";
    nav.setAttribute("aria-label", "Innhold på siden");
    var title = document.createElement("div");
    title.className = "page-toc-title";
    title.textContent = "Innhold";
    nav.appendChild(title);

    var f = ensureFab();
    f.root.style.display = "";
    while (f.list.firstChild) f.list.removeChild(f.list.firstChild);

    targets.forEach(function (t) {
      if (!t.el.id) {
        var base = slugify(t.label);
        var id = base;
        var n = 2;
        while (document.getElementById(id)) id = base + "-" + n++;
        t.el.id = id;
      }
      var sideA = makeAnchor(t);
      nav.appendChild(sideA);
      var fabA = makeAnchor(t, f.close);
      f.list.appendChild(fabA);
      tocLinks.push({ el: t.el, links: [sideA, fabA] });
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
      l.links.forEach(function (a) {
        a.classList.toggle("active", l === active);
      });
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
