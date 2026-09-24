# MatchPro

Landing page de mise en relation pour le nettoyage en Suisse romande.

- `site/` : ce qui est publié (voir `netlify.toml`) : `index.html` (la landing), `matchpro-partage.png`, `sitemap.xml`, `robots.txt`.
- Réglages : objet `CONFIG` en bas de `site/index.html`.
- **Après chaque modification de `CONFIG`, relancer `node outils/pre-rendu.js`** : il réécrit dans le HTML le contenu
  construit par le script (services, prix, FAQ, zone…), pour Google et pour l'affichage sans JavaScript.
- Domaine provisoire `https://matchpro.ch` : s'il change, le remplacer dans `site/index.html`, `site/sitemap.xml` et `site/robots.txt`.
