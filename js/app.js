
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
async function board() {
  try {
    const [units, epoch, rate, free, pool, open] = await Promise.all([
      rpcCall(CONFIG.mint, SEL.totalUnits), rpcCall(CONFIG.mint, SEL.epoch),
      rpcCall(CONFIG.mint, SEL.rateNow), rpcCall(CONFIG.mint, SEL.freeRate),
      rpcCall(CONFIG.mint, SEL.pool), rpcCall(CONFIG.mint, SEL.open)
    ]);
    if (open === 1n) {
      const pill = document.getElementById("cdPill");
      const pt = document.getElementById("cdPillT");
      if (pill) pill.classList.add("live");
      if (pt) pt.textContent = "MINT IS LIVE";
    }
    document.getElementById("bUnits").textContent = fmt(units);
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
const OPEN_AT = Date.UTC(2026, 10, 5, 11, 0, 0);
function tick() {
  const h = document.getElementById("cdH"), m = document.getElementById("cdM"), s = document.getElementById("cdS");
  if (!h) return;
  let d = Math.max(0, OPEN_AT - Date.now());
  h.textContent = String(Math.floor(d / 3600000)).padStart(2, "0");
  m.textContent = String(Math.floor(d % 3600000 / 60000)).padStart(2, "0");
  s.textContent = String(Math.floor(d % 60000 / 1000)).padStart(2, "0");
}
tick();
setInterval(tick, 1000);
