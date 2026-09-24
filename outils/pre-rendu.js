/*
 * PRÉ-RENDU de site/index.html
 * ----------------------------
 * La landing construit une partie de son contenu depuis l'objet CONFIG (services, prix, FAQ, zone…).
 * Pour que Google et les visiteurs sans JavaScript voient ce contenu, on l'écrit aussi en dur dans le HTML :
 * ce script ouvre la page dans Chromium, laisse le script s'exécuter, puis réenregistre le HTML obtenu.
 * Le script de la page reste « répétable » : relancé sur une page déjà pré-rendue, il ne duplique rien.
 *
 * À relancer après CHAQUE modification de CONFIG :   node outils/pre-rendu.js
 * (nécessite Node.js et Playwright ; dans les sessions Claude Code, Chromium est déjà installé.)
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { ({ chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"))); }

const FICHIER = path.join(__dirname, "..", "site", "index.html");
const CHROME = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(p => fs.existsSync(p));

(async () => {
  const navigateur = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
  const page = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route(/^https?:/, r => r.abort());               // aucune ressource externe (polices) : inutile ici
  await page.goto("file://" + FICHIER);                        // sans ?service= : version générale
  const html = await page.evaluate(() => {
    document.getElementById("mobileBar").classList.remove("hide");   // état lié au défilement, pas au contenu
    return "<!DOCTYPE html>\n" + document.documentElement.outerHTML + "\n";
  });
  await navigateur.close();
  fs.writeFileSync(FICHIER, html);
  console.log("Pré-rendu enregistré :", FICHIER);
})();
