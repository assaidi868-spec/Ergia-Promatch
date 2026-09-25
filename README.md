# MatchPro

Landing page de mise en relation pour le nettoyage en Suisse romande.

- `site/` : ce qui est publié (voir `netlify.toml`) :
  - `index.html` : la landing (page d'accueil, seul formulaire du site) ;
  - `nettoyage-fin-de-bail/`, `nettoyage-fin-de-chantier/`, `nettoyage-bureaux/` : pages service pour le référencement,
    dans le style de la landing (`assets/matchpro.css` = copie de ses styles + ajouts). Leurs boutons ouvrent la landing
    avec le service choisi (`../?service=…#devis`). En-tête et pied de page recopiés dans chaque page ;
  - `matchpro-partage.png`, `sitemap.xml`, `robots.txt` ;
  - `assets/npa-romandie.json` : NPA → localité et canton (Suisse romande) pour compléter le champ « NPA et localité »
    du formulaire. Données de La Poste suisse via le paquet npm `switzerland-postal-codes` 5.0.1
    (licence MIT, © 2021 William Belle).
- Réglages : objet `CONFIG` en bas de `site/index.html`.
- **Après chaque modification de `CONFIG`, relancer `node outils/pre-rendu.js`** : il réécrit dans le HTML le contenu
  construit par le script (services, prix, FAQ, zone…), pour Google et pour l'affichage sans JavaScript.
- Domaine provisoire `https://matchpro.ch` : s'il change, le remplacer dans toutes les pages de `site/`, `site/sitemap.xml` et `site/robots.txt`.
