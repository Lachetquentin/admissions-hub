---
description: Separate branch — remove package.json dependencies that are not used anywhere
---

Sur une branche à part, chaque paquet de `package.json` est utilisé quelque part. Retire les autres un par un. `npm test` et le build sortent à 0 après chaque retrait. Montre-moi la liste finale. $ARGUMENTS
