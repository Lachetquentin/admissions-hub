---
description: Separate branch — merge every duplicated piece of logic in src/ into a single function
---

Sur une branche à part, la même logique n'existe plus à deux endroits dans `src/`. Regroupe chaque doublon dans une seule fonction. `npm test` sort à 0 après chaque regroupement. Arrête-toi après 20 tours. $ARGUMENTS
