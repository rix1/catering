(function () {
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

  // Remember scroll position per page while hopping between them.
  var scrollKey = "scroll:" + pageKey();
  var saved = sessionStorage.getItem(scrollKey);
  if (saved && !location.hash) window.scrollTo(0, parseInt(saved, 10));
  window.addEventListener(
    "scroll",
    function () {
      sessionStorage.setItem(scrollKey, String(Math.round(window.scrollY)));
    },
    { passive: true }
  );
})();
