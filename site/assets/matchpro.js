/* Script commun à toutes les pages MatchPro (chargé en bas de chaque page).
   ============================================================
   RÉGLAGES
   ============================================================ */
const CONFIG = {
  clientId: "matchpro-nettoyage",          // étiquette de chaque lead dans le Google Sheet (preuve d'origine — ne pas supprimer)
  endpoint: "https://script.google.com/macros/s/AKfycbxP7l9-11du58j2TsOAwPCJ99KMNM6NDnI3S_6RwYIizOhHg8Ll2x_xF5KMZO6Q55W1yg/exec",
  cantons: { VD: "Vaud", GE: "Genève", FR: "Fribourg", VS: "Valais", NE: "Neuchâtel", JU: "Jura" },
  option: { name: "vitres", label: "Ajouter le nettoyage des vitres", detail: "Fenêtres, cadres et stores, dans la même intervention." },
  services: {
    "fin-de-bail": { label: "Fin de bail",         taille: "pieces",  frequence: false, option: true, dateLabel: "Date de l'état des lieux" },
    "chantier":    { label: "Fin de chantier",     taille: "surface", frequence: false, option: true, dateLabel: "Date de fin des travaux" },
    "bureaux":     { label: "Bureaux & immeubles", taille: "surface", frequence: true,  option: true, dateLabel: "Date souhaitée (début)" }
  }
};

/* ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function track(event, data) { (window.dataLayer = window.dataLayer || []).push({ event, ...data }); }

$("#year").textContent = new Date().getFullYear();
$("#demoBanner").classList.toggle("show", !CONFIG.endpoint);

/* ---------- Provenance de la visite ----------
   Page d'arrivée, site d'origine et paramètres utm/gclid gardés pendant la visite,
   pour être joints à la demande même si le visiteur change de page avant d'envoyer. */
const TRACE_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "gclid"];
let trace = {};
try { trace = JSON.parse(sessionStorage.getItem("matchpro_provenance")) || {}; } catch (x) { trace = {}; }
if (!trace.page || TRACE_KEYS.some(k => params.get(k))) {
  const ref = document.referrer && !document.referrer.startsWith(location.origin + "/") ? document.referrer : "";
  trace = { page: location.origin + location.pathname, referrer: ref };
  TRACE_KEYS.forEach(k => { trace[k] = params.get(k) || ""; });
  try { sessionStorage.setItem("matchpro_provenance", JSON.stringify(trace)); } catch (x) { /* stockage bloqué : valeur gardée en mémoire */ }
}

/* ---------- Menu mobile ---------- */
const menuBtn = $("#menuBtn"), mobileMenu = $("#mobileMenu");
const ICON_MENU = menuBtn.innerHTML;
const ICON_CLOSE = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
function setMenu(open) {
  mobileMenu.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  menuBtn.innerHTML = open ? ICON_CLOSE : ICON_MENU;
}
menuBtn.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("open")));
mobileMenu.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && mobileMenu.classList.contains("open")) { setMenu(false); menuBtn.focus(); } });
window.addEventListener("pageshow", () => setMenu(false));

/* ---------- Formulaire de devis (présent sur toutes les pages sauf les mentions légales) ---------- */
const leadForm = $("#leadForm");
if (leadForm) {
  const TAILLE = {
    pieces:  { label: "Taille de l'appartement / la maison", type: "select", options: ["1 – 1.5 pièce", "2 – 2.5 pièces", "3 – 3.5 pièces", "4 – 4.5 pièces", "5 pièces et plus"] },
    surface: { label: "Surface approximative (m²)", type: "number", placeholder: "ex. 120" }
  };
  let renderedFor = null;
  function renderDetails(key) {
    if (renderedFor === key) return;
    renderedFor = key;
    const s = CONFIG.services[key], t = TAILLE[s.taille];
    let h = `<div class="field"><label for="taille">${t.label}</label>`;
    h += t.type === "select"
      ? `<select id="taille" name="taille" required><option value="" disabled selected>Choisir…</option>${t.options.map(o => `<option>${o}</option>`).join("")}</select>`
      : `<input type="number" id="taille" name="taille" min="1" max="100000" inputmode="numeric" placeholder="${t.placeholder}" required>`;
    h += `</div><div class="row-2">`;
    if (s.frequence) {
      h += `<div class="field"><label for="frequence">Fréquence</label><select id="frequence" name="frequence" required>
        <option value="" disabled selected>Choisir…</option><option value="ponctuel">Une seule fois</option>
        <option value="hebdomadaire">Chaque semaine</option><option value="bimensuel">Toutes les 2 semaines</option><option value="mensuel">Chaque mois</option></select></div>`;
    }
    h += `<div class="field" ${s.frequence ? "" : 'style="grid-column:1/-1"'}><label for="date">${s.dateLabel}</label><input type="date" id="date" name="date" required></div></div>`;
    const o = CONFIG.option;
    if (o && s.option) h += `<label class="addon"><input type="checkbox" id="${o.name}" name="${o.name}" value="oui"><span><strong>${esc(o.label)}</strong><small>${esc(o.detail)}</small></span></label>`;
    $("#detailFields").innerHTML = h;
    $("#date").min = new Date().toISOString().slice(0, 10);
  }

  /* Étapes */
  const NAMES = ["Votre besoin", "Détails", "Coordonnées"];
  let current = 1;
  function goTo(n) {
    current = n;
    $$("fieldset.pane").forEach(f => { f.hidden = Number(f.dataset.step) !== n; });
    $("#stepLabel").textContent = `Étape ${n} sur 3`;
    $("#stepName").textContent = NAMES[n - 1];
    $("#progressFill").style.width = (n / 3 * 100) + "%";
    track("form_step", { step: n });
  }
  function validPane(n) {
    const pane = $(`fieldset[data-step="${n}"]`);
    const loc = $("#localite");
    loc.setCustomValidity(n === 1 && loc.value && !/^\s*\d{4}\b/.test(loc.value) ? "Indiquez le NPA à 4 chiffres, ex. 1004 Lausanne" : "");
    if (n === 3) {
      const tel = $("#tel"), t = tel.value.replace(/[\s.\-()/]/g, "");
      tel.setCustomValidity(t && !/^(\+41|0041|0)[1-9]\d{8}$/.test(t) ? "Numéro suisse attendu, ex. 079 123 45 67" : "");
    }
    for (const el of $$("input, select, textarea", pane)) {
      if (!el.checkValidity()) { el.reportValidity(); return false; }
    }
    return true;
  }
  const toForm = () => $("#devis").scrollIntoView({ behavior: "smooth", block: "start" });
  $$("[data-next]").forEach(b => b.addEventListener("click", () => {
    if (!validPane(current)) return;
    if (current === 1) renderDetails($('input[name="service"]:checked').value);
    goTo(current + 1); toForm();
  }));
  $$("[data-prev]").forEach(b => b.addEventListener("click", () => { goTo(current - 1); toForm(); }));

  /* Score du lead (envoyé, jamais affiché) — mêmes règles que le site ERGIA */
  function scoreLead(d) {
    let s = 0;
    if (d.date) {
      const days = (new Date(d.date) - new Date()) / 864e5;
      s += days <= 7 ? 35 : days <= 30 ? 25 : days <= 90 ? 10 : 0;
    }
    if (["regie", "entreprise", "pro-batiment"].includes(d.profil)) s += 20;
    if (d.frequence && d.frequence !== "ponctuel") s += 20;
    if (d.email) s += 10;
    if ((d.commentaire || "").trim().length > 15) s += 10;
    if (d.taille) s += 5;
    if (CONFIG.option && d[CONFIG.option.name]) s += 5;
    return { score: s, niveau: s >= 55 ? "chaud" : s >= 30 ? "tiede" : "froid" };
  }

  /* Envoi */
  async function envoyerLead(url, payload) {
    const body = JSON.stringify(payload);
    if (/script\.google(usercontent)?\.com/.test(url)) {
      await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body });
      return;
    }
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body });
    if (!r.ok) throw new Error("HTTP " + r.status);
  }
  leadForm.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validPane(3)) return;
    const d = Object.fromEntries(new FormData(e.target).entries());
    if (d.website) return;
    delete d.website;
    const payload = {
      ...d,
      service_label: CONFIG.services[d.service].label,
      ...(CONFIG.option ? { [CONFIG.option.name]: d[CONFIG.option.name] ? "oui" : "non" } : {}),
      canton_label: CONFIG.cantons[d.canton],
      ...scoreLead(d),
      client_id: CONFIG.clientId,
      page: trace.page,
      utm_source: trace.utm_source, utm_medium: trace.utm_medium,
      utm_campaign: trace.utm_campaign, utm_term: trace.utm_term,
      gclid: trace.gclid, referrer: trace.referrer,
      envoye_le: new Date().toISOString()
    };
    const btn = $("#submitBtn"), err = $("#formError");
    btn.disabled = true; btn.textContent = "Envoi…"; err.classList.remove("show");
    try {
      if (CONFIG.endpoint) await envoyerLead(CONFIG.endpoint, payload);
      else console.warn("[MODE DÉMO] Demande non envoyée :", payload);
      track("lead_submit", { service: d.service, canton: d.canton, lead_score: payload.score, lead_niveau: payload.niveau });
      $("#formPane").hidden = true;
      $("#successText").textContent = `Merci ${d.nom.split(" ")[0]}. Votre demande est transmise à une entreprise de nettoyage partenaire, qui vous recontacte au ${d.tel}.`;
      $("#successPane").classList.add("show");
      toForm();
    } catch (x) {
      err.textContent = "L'envoi a échoué. Réessayez dans un instant.";
      err.classList.add("show");
      btn.disabled = false; btn.textContent = "Recevoir mon devis";
    }
  });

  /* Service présélectionné : service de la page (data-service sur le formulaire), ?service= ou #devis-… */
  const ALIAS = { "fin-de-chantier": "chantier", "bureau": "bureaux" };
  function choisir(key) {
    key = ALIAS[key] || key;
    const r = document.getElementById("s-" + key);
    if (r) { r.checked = true; if (current !== 1 && !$("#successPane").classList.contains("show")) goTo(1); }
    return !!r;
  }
  function depuisAncre() {
    const m = /^#devis-(.+)$/.exec(decodeURIComponent(location.hash));
    if (m && choisir(m[1])) requestAnimationFrame(toForm);
  }
  goTo(1);
  if (leadForm.dataset.service) choisir(leadForm.dataset.service);
  if (params.get("service")) choisir(params.get("service"));
  depuisAncre();
  window.addEventListener("hashchange", depuisAncre);

  /* Barre mobile : masquée quand le formulaire est visible */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => $("#mobileBar").classList.toggle("hide", en.isIntersecting), { threshold: 0.1 }).observe($("#devis"));
  }
}
