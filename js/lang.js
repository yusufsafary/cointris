
(function () {
  const saved = localStorage.getItem("ct-lang") || "en";
  function apply(l) {
    document.body.classList.toggle("lang-zh", l === "zh");
    document.body.classList.toggle("lang-en", l !== "zh");
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
    const b = document.getElementById("langBtn");
    if (b) b.textContent = l === "zh" ? "EN" : "中文";
    localStorage.setItem("ct-lang", l);
  }
  window.ctLang = apply;
  document.addEventListener("DOMContentLoaded", () => apply(saved));
})();
