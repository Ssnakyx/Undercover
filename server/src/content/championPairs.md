# championPairs.ts — note de pertinence thématique

Une ligne par paire, une phrase justifiant le rapprochement (rôle de jeu, esthétique ou lore).
Sert à l'agent QA pour vérifier la cohérence sans connaître LoL par cœur. La liste couvre les
24 paires imposées par CONTRACT.md §7 + 6 paires ajoutées par l'agent Contenu pour dépasser
confortablement le seuil de 20, plus 15 paires supplémentaires ajoutées ensuite pour varier
davantage les parties, plus 7 paires ajoutées ensuite pour élargir l'écart de difficulté entre
paires très proches (undercover difficile à repérer) et paires plus éloignées (undercover plus
repérable), plus 10 paires ajoutées (5 difficiles, 5 moyennes) pour renforcer encore la
difficulté, plus 22 paires ajoutées enfin (11 difficiles, 11 moyennes) qui couvrent tout le
reste du roster Data Dragon utilisé comme base — total : 84 paires, tous les champions du
dataset `champions.ts` apparaissent dans au moins une paire. Liste fixe en code, pas de champ
`enabled`/`isCustom` (voir §7 du contrat).

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
31. **warwick-volibear** — Deux bêtes féroces de Jungle increvables, le loup enragé contre l'ours tonnerre.
32. **blitzcrank-alistar** — Deux supports Tank increvables spécialistes de l'engage explosif (crochet / charge).
33. **lulu-nami** — Deux enchanteresses Support pures, l'une fantaisiste, l'autre océanique, protection de la bot lane.
34. **twistedfate-graves** — Rivaux de lore explicites de Bilgewater, cartes truquées contre fusil à pompe.
35. **draven-lucian** — Deux carries ADC flamboyants et tape-à-l'œil de la bot lane.
36. **ekko-leblanc** — Deux manipulateurs Mid de la réalité, l'un du temps, l'autre de l'illusion/du mirage.
37. **elise-evelynn** — Deux séductrices de Jungle dissimulant une véritable forme monstrueuse sous une apparence trompeuse.
38. **sylas-aatrox** — Deux anciens prisonniers devenus des armes vivantes, l'un enchaîné, l'autre scellé.
39. **rakan-xayah** — Couple canon dans le lore, danseurs emplumés vastaya jouables Support ou ADC.
40. **aphelios-samira** — Deux tireurs ADC flamboyants à l'arsenal spectaculaire et changeant.
41. **masteryi-tryndamere** — Deux épéistes solo-carry increvables, dominants en fin de partie, Jungle ou Top.
42. **leesin-khazix** — Deux prédateurs mobiles et insaisissables de la Jungle, moine contre chasseur du Néant.
43. **veigar-ziggs** — Deux petits mages Mid à l'apparence inoffensive mais au burst dévastateur.
44. **poppy-gnar** — Deux petits gabarits Top redoutables au combat rapproché, marteau contre boomerang.
45. **kassadin-malzahar** — Deux mages Mid liés au Néant, l'un le fuyant, l'autre le vénérant.
46. **nasus-renekton** — Frères Ascendus égyptiens du même culte déchu de Shurima, Top lane. *(paire très proche, difficulté haute)*
47. **karthus-mordekaiser** — Deux seigneurs blindés/spectraux de la mort, obsédés par le contrôle des âmes. *(paire très proche, difficulté haute)*
48. **xerath-velkoz** — Deux artilleurs mages à très longue portée, énergie pure dévastatrice. *(paire très proche, difficulté haute)*
49. **anivia-lissandra** — Deux maîtresses de la glace du Freljord, contrôle de zone par le gel. *(paire très proche, difficulté haute)*
50. **amumu-zac** — Deux tanks Jungle increvables à l'apparence radicalement différente (momie triste chétive contre gelée massive). *(paire éloignée, difficulté basse)*
51. **singed-drmundo** — Deux chimistes fous de Zaun, styles de combat opposés (kite/fuite contre brawl frontal). *(paire éloignée, difficulté basse)*
52. **taric-galio** — Deux gardiens protecteurs à l'esthétique opposée, gemme scintillante contre gargouille de pierre. *(paire éloignée, difficulté basse)*
53. **chogath-kogmaw** — Deux monstres du Néant emblématiques et dévoreurs. *(difficulté haute)*
54. **rammus-skarner** — Deux tanks blindés de la Faille à la carapace increvable. *(difficulté haute)*
55. **fiddlesticks-shaco** — Deux terreurs de la jungle à l'humour glaçant, maîtres de la peur. *(difficulté haute)*
56. **jayce-urgot** — Deux rivaux augmentés par la machine, tension Piltover/Zaun. *(difficulté haute)*
57. **vladimir-swain** — Deux membres du Haut Commandement noxien, magie du sang. *(difficulté haute)*
58. **qiyana-taliyah** — Deux jeunes prodiges élémentaires maîtresses du terrain rocheux. *(difficulté moyenne)*
59. **trundle-sejuani** — Deux seigneurs de guerre bruts du Freljord. *(difficulté moyenne)*
60. **kindred-zilean** — Deux figures liées à la mort et au temps, gardiens du destin des âmes. *(difficulté moyenne)*
61. **gragas-olaf** — Deux guerriers indisciplinés du Freljord, force brute sans limites. *(difficulté moyenne)*
62. **bard-ivern** — Deux errants excentriques et bienveillants, hors des conventions. *(difficulté moyenne)*
63. **aurelionsol-shyvana** — Deux dragons de Runeterra, céleste contre sang-mêlé. *(difficulté haute)*
64. **azir-xerath** — Deux anciens souverains/mages shurimans ramenés par la magie. *(difficulté haute)*
65. **brand-cassiopeia** — Deux victimes de malédictions les ayant transformées en monstres. *(difficulté haute)*
66. **kalista-thresh** — Un esprit vengeur et son bourreau, liés pour l'éternité par la trahison. *(difficulté haute)*
67. **kennen-zed** — Deux ninjas rapides d'Ionia maniant des pouvoirs surnaturels. *(difficulté haute)*
68. **nocturne-warwick** — Deux cauchemars de la jungle se nourrissant de peur et de sang. *(difficulté haute)*
69. **orianna-viktor** — Deux êtres mêlant chair et mécanique de Piltover-Zaun. *(difficulté haute)*
70. **kayle-morgana** — Deux sœurs déchues, l'une angélique, l'autre vengeresse. *(difficulté haute)*
71. **jarvaniv-pantheon** — Deux guerriers disciplinés à la lance, meneurs infaillibles au combat. *(difficulté haute)*
72. **udyr-ornn** — Deux divinités et esprits ancestraux du Freljord. *(difficulté haute)*
73. **yorick-karthus** — Deux figures macabres maîtrisant la mort et les morts-vivants. *(difficulté haute)*
74. **fizz-gangplank** — Deux figures espiègles et redoutables des mers de Bilgewater. *(difficulté moyenne)*
75. **hecarim-nunu** — Deux duos cavalier/monture emblématiques, spectral contre neige. *(difficulté moyenne)*
76. **lillia-ivern** — Deux esprits doux protecteurs de la forêt, à l'opposé des junglers brutaux. *(difficulté moyenne)*
77. **maokai-zyra** — Deux manifestations végétales vengeresses de la nature. *(difficulté moyenne)*
78. **wukong-xinzhao** — Deux guerriers agiles à l'arme de mêlée, showmen du combat. *(difficulté moyenne)*
79. **quinn-vayne** — Deux justiciers solitaires traquant leurs cibles sans relâche. *(difficulté moyenne)*
80. **reksai-skarner** — Deux prédateurs souterrains émergeant brusquement du sol. *(difficulté moyenne)*
81. **ryze-kassadin** — Deux mages vétérans protégeant Runeterra de menaces cosmiques. *(difficulté moyenne)*
82. **tahmkench-illaoi** — Deux figures monstrueuses et imposantes liées aux eaux et à la foi de Bilgewater. *(difficulté moyenne)*
83. **twitch-singed** — Deux figures toxiques de Zaun, rat des égouts contre chimiste fou. *(difficulté moyenne)*
84. **syndra-zoe** — Deux prodiges de la magie à l'apparence trompeusement juvénile. *(difficulté moyenne)*

## Validation croisée — tags de rôle officiels Riot (Data Dragon)

Vérification automatique de la cohérence de chaque paire à partir des tags de rôle officiels
(Fighter/Tank/Mage/Marksman/Assassin/Support), issus du fichier de données fourni par
l'utilisateur (champions.ts, dataset Data Dragon — utilisé uniquement pour ces tags courts,
aucune icône ni texte de lore Riot n'est utilisé dans le jeu, conformément à CONTRACT.md §0).
27 des 30 paires initiales partagent au moins un tag de rôle officiel (3 exceptions justifiées
par un lien de lore explicite plutôt que mécanique) ; parmi les 15 paires ajoutées ensuite,
12 partagent un tag et 3 sont également des liens de lore explicites (colonne "Rôle commun").
Parmi les 7 paires 46-52 (ajoutées pour la difficulté), 5 partagent un tag officiel et 2 sont
des liens de lore explicites. Parmi les 10 paires 53-62, 7 partagent un tag officiel et 3 sont
des liens de lore explicites (fiddlesticks-shaco, qiyana-taliyah, kindred-zilean). Parmi les 22
dernières paires (63-84, qui couvrent le reste du roster), 17 partagent un tag officiel et 5
sont des liens de lore explicites (aurelionsol-shyvana, kalista-thresh, kennen-zed,
yorick-karthus, twitch-singed).

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
| warwick-volibear | Fighter, Tank | Fighter, Tank | Fighter, Tank |
| blitzcrank-alistar | Tank, Fighter | Tank, Support | Tank |
| lulu-nami | Support, Mage | Support, Mage | Support, Mage |
| twistedfate-graves | Mage | Marksman | _aucun (lien par lore : rivaux de Bilgewater)_ |
| draven-lucian | Marksman | Marksman | Marksman |
| ekko-leblanc | Assassin, Fighter | Assassin, Mage | Assassin |
| elise-evelynn | Mage, Fighter | Assassin, Mage | Mage |
| sylas-aatrox | Mage, Assassin | Fighter, Tank | _aucun (lien par lore : prisonniers devenus armes vivantes)_ |
| rakan-xayah | Support | Marksman | _aucun (lien par lore : couple canon vastaya)_ |
| aphelios-samira | Marksman | Marksman | Marksman |
| masteryi-tryndamere | Assassin, Fighter | Fighter, Assassin | Assassin, Fighter |
| leesin-khazix | Fighter, Assassin | Assassin | Assassin |
| veigar-ziggs | Mage | Mage | Mage |
| poppy-gnar | Tank, Fighter | Fighter, Tank | Tank, Fighter |
| kassadin-malzahar | Assassin, Mage | Mage, Assassin | Assassin, Mage |
| nasus-renekton | Fighter, Tank | Fighter, Tank | Fighter, Tank |
| karthus-mordekaiser | Mage | Fighter | _aucun (lien par lore : seigneurs de la mort/du Néant)_ |
| xerath-velkoz | Mage | Mage | Mage |
| anivia-lissandra | Mage, Support | Mage | Mage |
| amumu-zac | Tank, Mage | Tank, Fighter | Tank |
| singed-drmundo | Tank, Fighter | Fighter, Tank | Fighter, Tank |
| taric-galio | Support, Fighter | Tank, Mage | _aucun (lien par lore : gardiens protecteurs)_ |
| chogath-kogmaw | Tank, Mage | Marksman, Mage | Mage |
| rammus-skarner | Tank, Fighter | Fighter, Tank | Tank, Fighter |
| fiddlesticks-shaco | Mage, Support | Assassin | _aucun (lien par lore : terreurs de la jungle)_ |
| jayce-urgot | Fighter, Marksman | Fighter, Tank | Fighter |
| vladimir-swain | Mage | Mage, Fighter | Mage |
| qiyana-taliyah | Assassin, Fighter | Mage, Support | _aucun (lien par lore : maîtresses du terrain)_ |
| trundle-sejuani | Fighter, Tank | Tank, Fighter | Fighter, Tank |
| kindred-zilean | Marksman | Support, Mage | _aucun (lien par lore : mort et temps)_ |
| gragas-olaf | Fighter, Mage | Fighter, Tank | Fighter |
| bard-ivern | Support, Mage | Support, Mage | Support, Mage |
| aurelionsol-shyvana | Mage | Fighter, Tank | _aucun (lien par lore : dragons de Runeterra)_ |
| azir-xerath | Mage, Marksman | Mage | Mage |
| brand-cassiopeia | Mage | Mage | Mage |
| kalista-thresh | Marksman | Support, Fighter | _aucun (lien par lore : la vengeresse et son bourreau)_ |
| kennen-zed | Mage, Marksman | Assassin | _aucun (lien par lore : ninjas d'Ionia)_ |
| nocturne-warwick | Assassin, Fighter | Fighter, Tank | Fighter |
| orianna-viktor | Mage, Support | Mage | Mage |
| kayle-morgana | Fighter, Support | Mage, Support | Support |
| jarvaniv-pantheon | Tank, Fighter | Fighter, Assassin | Fighter |
| udyr-ornn | Fighter, Tank | Tank, Fighter | Fighter, Tank |
| yorick-karthus | Fighter, Tank | Mage | _aucun (lien par lore : figures macabres de la mort)_ |
| fizz-gangplank | Assassin, Fighter | Fighter | Fighter |
| hecarim-nunu | Fighter, Tank | Tank, Fighter | Fighter, Tank |
| lillia-ivern | Fighter, Mage | Support, Mage | Mage |
| maokai-zyra | Tank, Mage | Mage, Support | Mage |
| wukong-xinzhao | Fighter, Tank | Fighter, Assassin | Fighter |
| quinn-vayne | Marksman, Assassin | Marksman, Assassin | Marksman, Assassin |
| reksai-skarner | Fighter | Fighter, Tank | Fighter |
| ryze-kassadin | Mage, Fighter | Assassin, Mage | Mage |
| tahmkench-illaoi | Support, Tank | Fighter, Tank | Tank |
| twitch-singed | Marksman, Assassin | Tank, Fighter | _aucun (lien par lore : figures toxiques de Zaun)_ |
| syndra-zoe | Mage, Support | Mage, Support | Mage, Support |
