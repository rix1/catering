(function () {
  var pages = { 1: "index.html", 2: "oppskrifter.html", 3: "handleliste.html" };

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
    if (t && t.tagName === "INPUT" && t.type !== "checkbox" && t.type !== "radio" && t.type !== "button") return;
    var page = pages[e.key];
    if (!page) return;
    var current = location.pathname.split("/").pop() || "index.html";
    if (current !== page) location.href = page;
  });
})();
