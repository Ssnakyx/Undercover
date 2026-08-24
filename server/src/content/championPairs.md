# championPairs.ts — note de pertinence thématique

Une ligne par paire, une phrase justifiant le rapprochement (rôle de jeu, esthétique ou lore).
Sert à l'agent QA pour vérifier la cohérence sans connaître LoL par cœur. La liste couvre les
24 paires imposées par CONTRACT.md §7 + 6 paires ajoutées par l'agent Contenu pour dépasser
confortablement le seuil de 20 (total : 30 paires, toutes `enabled: true`, `isCustom: false`).

1. **garen-darius** — Deux épéistes bruisers de Top lane increvables, incarnant la rivalité Demacia/Noxus.
2. **ashe-sivir** — Deux marksmen "hypercarry" classiques d'ADC, l'une à l'arc, l'autre au boomerang.
3. **katarina-talon** — Deux assassins noxiens mêlée mobiles de Mid lane, spécialistes du burst au couteau/lame.
4. **lux-morgana** — Sœurs de lore (lumière et ténèbres), mages à bouclier/root jouées Mid ou Support.
5. **malphite-ornn** — Deux tanks Top faits de pierre/forge, increvables et lents mais dévastateurs.
6. **caitlyn-missfortune** — Deux tireuses ADC à l'arme à feu incarnant une figure d'autorité (shérif/capitaine).
7. **jinx-vayne** — Deux ADC punitives à distance (armes à feu / arbalète), justicières ou anarchistes selon le camp.
8. **yasuo-yone** — Frères de lore, épéistes liés au vent, jouables Mid ou Top.
9. **vi-jax** — Deux bruisers au corps-à-corps armés de poings/gourdin, tank-fighters de Jungle/Top.
10. **nidalee-rengar** — Chasseuse et prédateur, rivaux de lore littéral (Rengar traque le cougar de Nidalee) en Jungle.
11. **xinzhao-renekton** — Deux bruisers féroces à arme blanche (lance/lames), Jungle ou Top, tempérament brutal.
12. **ezreal-kaisa** — Couple canon dans le lore, deux carries ADC mobiles et technologiques.
13. **annie-zoe** — Deux mages Mid à l'apparence enfantine mais au potentiel destructeur trompeur.
14. **braum-thresh** — Deux supports iconiques au liant physique (bouclier/chaîne), jouant sur l'engage à distance.
15. **soraka-janna** — Deux enchanteresses Support pures, soin et boucliers, protection de la bot lane.
16. **shen-zed** — Deux ninjas d'Ionia rivaux, l'ordre (Kinkou) contre l'ombre, Top vs Mid.
17. **fiora-riven** — Deux duellistes Top à l'épée, thème de l'exil et de l'honneur perdu/retrouvé.
18. **karma-sona** — Deux mages Support spirituelles d'Ionia, l'une par la parole, l'autre par la musique silencieuse.
19. **teemo-heimerdinger** — Deux Yordles bricoleurs de Top lane, spécialistes des pièges/tourelles à zone.
20. **nautilus-illaoi** — Deux colosses liés à l'océan et à la foi de Bilgewater, armés d'ancre/idole géante.
21. **kled-rumble** — Deux petits gabarits féroces pilotant un engin (monture reptilienne / mini-mecha) en Top.
22. **ahri-neeko** — Deux métamorphes charmeuses Mid, séduction et illusion comme outils de combat.
23. **diana-leona** — Rivales de lore explicites, culte lunaire contre culte solaire, Jungle vs Support.
24. **tristana-corki** — Deux artilleurs miniatures ADC/Mid à l'explosif, mobilité aérienne/bondissante.
25. **sett-sion** — Deux tanks bruisers Top réputés increvables, l'un par la rage, l'autre littéralement mort-vivant.
26. **akali-kayn** — Deux assassins mêlée liés à l'ombre, l'une ninja rebelle Mid, l'autre chasseur d'ombre en Jungle.
27. **jhin-varus** — Deux tireurs ADC "maudits", mise en scène macabre pour l'un, vengeance parasitaire pour l'autre.
28. **yuumi-seraphine** — Deux supports à la persona de pop star, l'une IA féline en ligne, l'autre chanteuse de Zaun/Piltover.
29. **pyke-senna** — Bourreaux vengeurs tous deux liés au lore de Thresh (le crochet, la lanterne), exécution des ennemis affaiblis.
30. **camille-irelia** — Deux lames Top très mobiles et disciplinées, ordre/loi (Piltover) contre maîtrise martiale (Ionia).

## Validation croisée — tags de rôle officiels Riot (Data Dragon)

Vérification automatique de la cohérence de chaque paire à partir des tags de rôle officiels
(Fighter/Tank/Mage/Marksman/Assassin/Support), issus du fichier de données fourni par
l'utilisateur (champions.ts, dataset Data Dragon — utilisé uniquement pour ces tags courts,
aucune icône ni texte de lore Riot n'est utilisé dans le jeu, conformément à CONTRACT.md §0).
27 des 30 paires partagent au moins un tag de rôle officiel ; les 3 exceptions sont justifiées
par un lien de lore explicite plutôt que mécanique (colonne "Rôle commun").

| Paire | Tags champA | Tags champB | Rôle commun |
|---|---|---|---|
| garen-darius | Fighter, Tank | Fighter, Tank | Fighter, Tank |
| ashe-sivir | Marksman, Support | Marksman | Marksman |
| katarina-talon | Assassin, Mage | Assassin | Assassin |
| lux-morgana | Mage, Support | Mage, Support | Mage, Support |
| malphite-ornn | Tank, Fighter | Tank, Fighter | Tank, Fighter |
| caitlyn-missfortune | Marksman | Marksman | Marksman |
| jinx-vayne | Marksman | Marksman, Assassin | Marksman |
| yasuo-yone | Fighter, Assassin | Assassin, Fighter | Fighter, Assassin |
| vi-jax | Fighter, Assassin | Fighter, Assassin | Fighter, Assassin |
| nidalee-rengar | Assassin, Mage | Assassin, Fighter | Assassin |
| xinzhao-renekton | Fighter, Assassin | Fighter, Tank | Fighter |
| ezreal-kaisa | Marksman, Mage | Marksman | Marksman |
| annie-zoe | Mage | Mage, Support | Mage |
| braum-thresh | Support, Tank | Support, Fighter | Support |
| soraka-janna | Support, Mage | Support, Mage | Support, Mage |
| shen-zed | Tank | Assassin | _aucun (lien par lore : rivaux d'Ionia)_ |
| fiora-riven | Fighter, Assassin | Fighter, Assassin | Fighter, Assassin |
| karma-sona | Mage, Support | Support, Mage | Mage, Support |
| teemo-heimerdinger | Marksman, Assassin | Mage, Support | _aucun (lien par lore : Yordles bricoleurs à pièges)_ |
| nautilus-illaoi | Tank, Fighter | Fighter, Tank | Tank, Fighter |
| kled-rumble | Fighter, Tank | Fighter, Mage | Fighter |
| ahri-neeko | Mage, Assassin | Mage, Support | Mage |
| diana-leona | Fighter, Mage | Tank, Support | _aucun (lien par lore : lune contre soleil)_ |
| tristana-corki | Marksman, Assassin | Marksman | Marksman |
| sett-sion | Fighter, Tank | Tank, Fighter | Fighter, Tank |
| akali-kayn | Assassin | Fighter, Assassin | Assassin |
| jhin-varus | Marksman, Mage | Marksman, Mage | Marksman, Mage |
| yuumi-seraphine | Support, Mage | Mage, Support | Support, Mage |
| pyke-senna | Support, Assassin | Marksman, Support | Support |
| camille-irelia | Fighter, Tank | Fighter, Assassin | Fighter |
