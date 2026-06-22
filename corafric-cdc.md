# Corafric — Cahier des charges complet
*Version 1.0 — Juin 2026*

---

## 1. Contexte et vision

Les langues africaines sont massivement absentes des modèles d'intelligence artificielle. Des outils comme Google Traduction gèrent l'Ewe de manière superficielle et peu fiable. Pourtant, l'Ewe est parlé par environ 5 à 7 millions de personnes au Ghana, au Togo et au Bénin — une communauté linguistique qui traverse trois frontières.

Corafric est né d'un constat simple : les données qui permettraient de construire des outils IA pour les langues africaines n'existent pas en quantité suffisante, ou existent de manière dispersée dans des projets académiques inaccessibles au grand public. Des projets comme Masakhane ou BibleTTS ont produit des datasets de qualité, mais aucun n'a abouti à un produit utilisable. La raison n'est pas technique — c'est un manque de vision produit et de distribution communautaire.

**Corafric n'est pas un projet de recherche. C'est une plateforme de collecte communautaire avec une interface accessible, une validation locale par des locuteurs natifs, et un objectif produit concret : une API voix off commerciale pour les langues africaines.**

L'Ewe est la langue de départ, mais l'architecture est conçue pour s'étendre à d'autres langues africaines.

---

## 2. Objectif long terme

Construire une API voix off commerciale pour les langues africaines — permettant à des créateurs de contenu, des développeurs et des entreprises de générer de l'audio naturel dans des langues comme l'Ewe, le Fon, le Dioula, et d'autres.

---

## 3. Analyse du problème — pourquoi on doit bien procéder

En réfléchissant à la structure des données nécessaires pour entraîner un modèle sur une langue, on réalise qu'il existe une pyramide qu'on ne peut pas sauter :

```
Niveau 4 — Audio
  Voix humaines enregistrant des phrases en contexte.
  Inutile sans les niveaux inférieurs.

Niveau 3 — Phrases en contexte
  Paires de phrases traduites, textes annotés.
  C'est ce qu'on a déjà (30 694 phrases Bible).
  Mais sans les niveaux 1 et 2, le modèle ne comprend
  pas ce qu'il traite.

Niveau 2 — Dictionnaire
  Chaque mot, sa définition, sa catégorie grammaticale,
  ses variantes tonales, ses formes.

Niveau 1 — Phonèmes
  Les sons fondamentaux de la langue.
  L'Ewe est une langue tonale — le ton change le sens.
  Sans cette base, la lecture et la phonétique sont impossibles.
```

**Conclusion de cette analyse :** on a commencé par le niveau 3. Ce n'est pas une erreur — ces données restent valables. Mais il faut construire les niveaux 1 et 2 avant de passer au niveau 4 (audio).

---

## 4. Ressources existantes identifiées

Des travaux académiques existent déjà sur l'Ewe. Ils ne sont pas des concurrents — ils sont des bases de départ qu'on va enrichir, valider localement, et rendre accessibles via une interface grand public.

| Ressource | Source | Volume | Licence | Statut |
|---|---|---|---|---|
| Paires FR ↔ Ewe | Masakhane MAFAND (GitHub) | ~23 000 phrases | CC-BY-4.0-NC | ✅ disponible |
| Données NER Ewe | MasakhaNER 2.0 (HuggingFace) | ~5 000 lignes annotées | AFL-3.0 | ✅ disponible |
| Audio studio Ewe | BibleTTS | jusqu'à 80h / 48kHz | CC-BY-SA | ✅ disponible |
| Dictionnaire (variété Togo) | Dzablu-Kumah wordlist | partiel | à vérifier | ⚠️ vérifier accès |
| Dictionnaire en ligne | Glosbe Ewe-Français | variable | à vérifier | ⚠️ vérifier accès |
| Corpus ASR 1130h | ICNLSP 2025 (académique) | 1130h audio | à négocier | ⚠️ contacter auteurs |

**Note importante :** certaines URLs peuvent retourner des 404. Vérifier chaque ressource manuellement avant de planifier l'import.

---

## 5. Roadmap par phases

### Phase 0 — Fondation linguistique
*Objectif : avoir les bases de la langue avant toute collecte audio*

- Importer les ressources existantes (MAFAND, MasakhaNER) dans la DB Neon
- Dédupliquer contre les 30 694 phrases Bible déjà importées (hash SHA256)
- Construire la table `words` : dictionnaire Ewe mot par mot avec définition, catégorie grammaticale, ton
- Construire la table `phonemes` : les 27 caractères de l'alphabet Ewe + notations IPA + marques tonales
- Documenter les règles phonétiques de base (pour TTS rule-based)

**Critère de passage à la Phase 1 :**
Dictionnaire avec ≥ 2 000 mots validés par au moins un locuteur natif de confiance. Alphabet Ewe complet documenté.

---

### Phase 1 — Plateforme de démonstration
*Objectif : avoir quelque chose à montrer avant de demander aux gens de contribuer*

- Mini-traducteur Ewe ↔ Français intégré au site (basé sur les paires existantes)
- Lecture phonétique rule-based des mots du dictionnaire (bouton écouter)
- Page /contribuer opérationnelle avec licence de contribution claire (CC0 ou équivalent)
- Pitch auprès des étudiants universitaires (Togo, Ghana, Bénin) pour recruter les premiers contributeurs

**Pourquoi cette phase est critique :** au lieu de dire "on collecte des données pour faire quelque chose un jour", on montre quelque chose qui fonctionne maintenant. Même imparfait. C'est l'argument de pitch — "regarde ce qu'on a déjà avec les données existantes, imagine ce que ça devient avec ta contribution."

**Critère de passage à la Phase 2 :**
Mini-traducteur déployé en production. Au moins 50 contributeurs inscrits. Pitch étudiant réalisé dans au moins une université.

---

### Phase 2 — Collecte communautaire
*Objectif : accumuler des données audio de qualité*

- Interface d'enregistrement vocal (phrase affichée → utilisateur lit → soumet l'audio)
- Système de validation : chaque audio validé par deux autres locuteurs natifs avant d'être intégré au dataset
- Gamification légère : compteur de phrases enregistrées, badge premier enregistrement, leaderboard
- Bot WhatsApp pour contribution vocale (Green API, déjà connu) — à construire quand le web fonctionne
- Pipeline collecteurs terrain : photo de texte → OCR Gemini → Google Sheet → import DB

**Protection des voix :**
- Licence explicite acceptée avant la première contribution ("Je cède mes enregistrements à Corafric sous CC0 pour usage IA uniquement")
- Les fichiers audio bruts ne sont jamais téléchargeables publiquement
- Seuls les modèles entraînés sur ces données sont distribués

**Critère de passage à la Phase 3 :**
≥ 100 heures d'audio validé. ≥ 500 contributeurs uniques. Couverture de l'alphabet phonétique Ewe ≥ 80%.

---

### Phase 3 — Modèles IA
*Objectif : transformer les données en intelligence*

- Fine-tuning d'un modèle de traduction Ewe ↔ Français sur nos données validées
- TTS neuronal Ewe entraîné sur l'audio collecté (remplace le rule-based)
- ASR (reconnaissance vocale automatique) Ewe
- Comparaison avec Google Traduction — montrer la différence de qualité

**Critère de passage à la Phase 4 :**
Modèle de traduction avec BLEU score supérieur aux modèles existants sur un benchmark Ewe standard. TTS avec évaluation qualitative positive par panel de locuteurs natifs.

---

### Phase 4 — API commerciale
*Objectif : monétiser et financer la suite*

- **Intégration Télécom (SVI)** : Déploiement du modèle TTS Ewe pour les Serveurs Vocaux Interactifs (ciblage des utilisateurs Mobile Money et support client rural).
- **Chatbots Financiers** : API de traduction et d'analyse d'intention Ewe ↔ Français pour les services transactionnels WhatsApp.
- **Génération Médias** : Outils de doublage automatisé pour la publicité et la communication locale.
- API traduction pour développeurs
- Extension à d'autres langues africaines (Fon, Dioula, etc.)
- Modèle freemium : usage communautaire gratuit, usage commercial payant

---

## 7. Ce qui différencie Corafric des projets existants

Les projets académiques (Masakhane, BibleTTS, etc.) ont produit des données mais n'ont pas abouti à des produits utilisables. Les raisons :

1. Pas d'interface accessible au grand public
2. Validation par des annotateurs distants, sans ancrage local
3. Aucun produit visible montrant l'utilité des données
4. Pas de communauté — juste des contributeurs anonymes

Corafric apporte ce qui manque : **une interface, une validation communautaire locale, un produit démonstration visible dès le lancement, et une stratégie de distribution terrain.**

---

## 8. Résumé des critères de passage entre phases

| Transition | Condition minimale |
|---|---|
| Phase 0 → 1 | ≥ 2 000 mots dictionnaire validés + alphabet documenté |
| Phase 1 → 2 | Mini-traducteur en prod + 50 contributeurs inscrits |
| Phase 2 → 3 | ≥ 100h audio validé + 500 contributeurs uniques |
| Phase 3 → 4 | Modèles performants + évaluation qualitative positive |
