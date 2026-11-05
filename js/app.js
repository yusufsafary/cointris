
const CONFIG = {
  token: "0x110F2e9039996469C2a06f32eD0128f5F277261F",
  mint: "0xE97c8944D638e5F65D595f2dEe2f1aC211235dD0",
  rpcs: [
    "https://bsc-dataseed1.binance.org",
    "https://bsc-dataseed-public.bnbchain.org",
    "https://bsc-mainnet.public.blastapi.io",
    "https://bsc-rpc.publicnode.com"
  ]
};
const SEL = { totalUnits: "0x6d86acc4", epoch: "0x76671808", rateNow: "0xb54db978", freeRate: "0xfee22537", pool: "0x96365d44", open: "0x24bbd049" };
function rpcCall(to, data) {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] });
  const tries = CONFIG.rpcs.map((u) => fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(5000) })
    .then((r) => r.json()).then((j) => { if (!j.result) throw new Error("no result"); return BigInt(j.result); }));
  return Promise.any(tries);
}
const fmt = (n) => n.toLocaleString("en-US");
const fmtT = (wei) => fmt(wei / 10n ** 18n);
let unitsShown = null;
function tweenUnits(to) {
  const el = document.getElementById("bUnits");
  if (!el) return;
  const target = Number(to);
  const from = unitsShown === null ? target : unitsShown;
  unitsShown = target;
  if (from === target) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 650;
  (function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = fmt(BigInt(Math.round(from + (target - from) * p)));
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}
async function board() {
  try {
    const [units, epoch, rate, free, pool, open] = await Promise.all([
      rpcCall(CONFIG.mint, SEL.totalUnits), rpcCall(CONFIG.mint, SEL.epoch),
      rpcCall(CONFIG.mint, SEL.rateNow), rpcCall(CONFIG.mint, SEL.freeRate),
      rpcCall(CONFIG.mint, SEL.pool), rpcCall(CONFIG.mint, SEL.open)
    ]);
    window.CT = { rate: Number(rate), free: Number(free), units: Number(units) };
    document.dispatchEvent(new Event("ct:board"));
    tweenUnits(units);
    document.getElementById("bUnits").dataset.v = units.toString();
    document.getElementById("bEpoch").textContent = (epoch + 1n).toString() + " / 11";
    document.getElementById("bRate").textContent = fmt(rate) + " TRIS";
    document.getElementById("bFree").textContent = fmt(free) + " TRIS";
    document.getElementById("bPool").textContent = fmtT(pool) + " TRIS";
    const inEpoch = units % 150000n;
    document.getElementById("bBar").style.width = (Number(inEpoch) / 150000 * 100).toFixed(2) + "%";
    document.getElementById("bBarNote").textContent = fmt(inEpoch) + " / 150,000";
  } catch (e) { /* board tetap pada nilai awal */ }
}
board();
setInterval(board, 60000);
async function scores() {
  try {
    const r = await fetch("/leaderboard.json", { cache: "no-store" });
    if (!r.ok) return;
    const j = await r.json();
    if (!j.entries || !j.entries.length) return;
    const short = (w) => w.slice(0, 6) + "…" + w.slice(-4);
    document.getElementById("scoresBody").innerHTML = j.entries.slice(0, 10).map((e, i) =>
      `<tr><td class="rk">${i + 1}</td><td>${short(e.wallet)}</td><td class="num">${fmt(BigInt(e.units))}</td><td class="num">${fmt(BigInt(e.tris))} TRIS</td></tr>`).join("");
    document.getElementById("scoresTable").style.display = "";
    const em = document.getElementById("scoresEmpty");
    if (em) em.style.display = "none";
    const d = new Date(j.updatedAt);
    document.getElementById("scoresNote").textContent = "Top " + Math.min(10, j.entries.length) + " of " + j.totalWallets + " stackers · updated " + d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
  } catch (e) { /* papan tetap pada keadaan awal */ }
}
scores();
async function live() {
  try {
    const r = await fetch("/livemints.json", { cache: "no-store" });
    const j = await r.json();
    const box = document.getElementById("liveRows");
    if (!box) return;
    const zh = document.body.classList.contains("lang-zh");
    const feed = (j && j.feed) || [];
    if (!feed.length) {
      box.innerHTML = '<div class="emptyblock">' + (zh ? "暂无掉落 · 首批方块将在开启时落地" : "NO DROPS YET · FIRST BLOCKS LAND AT LAUNCH") + "</div>";
      return;
    }
    const short = (a) => a.slice(0, 6) + "…" + a.slice(-4);
    box.innerHTML = feed.slice(0, 12).map(function (e, i) {
      const time = new Date(e.ts * 1000).toISOString().slice(11, 19);
      const kind = e.kind === "free"
        ? '<span class="lk-free">' + (zh ? "免费掉落" : "FREE DROP") + " ×" + e.units + "</span>"
        : '<span class="lk-paid">' + (zh ? "锁定掉落" : "LOCK DROP") + " ×" + e.units + "</span>";
      return '<div class="liverow" style="animation-delay:' + i * 55 + 'ms"><span class="lt">' + time + ' UTC</span><span class="lw">' + short(e.wallet) + "</span>" + kind + '<span class="ltr">+' + Number(e.tris).toLocaleString("en-US") + " TRIS</span></div>";
    }).join("");
  } catch (e) { /* feed tetap pada keadaan awal */ }
}
live();
setInterval(live, 30000);
function calc() {
  const slider = document.getElementById("calcUnits");
  if (!slider) return;
  const q = Number(slider.value);
  const rate = (window.CT && window.CT.rate) || 20000;
  document.getElementById("calcQ").textContent = q;
  document.getElementById("calcLock").textContent = (q * 0.002).toFixed(3) + " BNB";
  document.getElementById("calcReward").textContent = (q * rate).toLocaleString("en-US") + " TRIS";
  document.getElementById("calcFee").textContent = "±$" + (q * 0.09).toFixed(2);
}
const calcSlider = document.getElementById("calcUnits");
if (calcSlider) { calcSlider.addEventListener("input", calc); calc(); }
document.addEventListener("ct:board", calc);
