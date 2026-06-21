# Prompt Antigravity — Page `/contribuer` — Corafric

## Contexte du projet

Corafric est une plateforme open source de collecte de données vocales en langues africaines, commençant par l'Ewe. L'objectif long terme est de construire une API voix off commerciale pour les langues africaines. Le projet est communautaire, porté par une conviction : les langues africaines sont massivement absentes des modèles d'IA. Cette page s'adresse à ceux qui veulent aider le projet à grandir — pas nécessairement en enregistrant leur voix, mais en contribuant autrement.

## Stack

- Next.js 15 App Router + TypeScript + Tailwind
- next-intl (i18n FR + EN)
- Fichier à créer : `app/[locale]/contribuer/page.tsx`
- Composants dans `components/contribuer/`

---

## Design System (à respecter strictement)

```
Couleurs :
  --color-primary:   #B84A2A  (terracotta)
  --color-accent:    #D4A017  (or)
  --color-bg:        #F7F3EE  (fond chaud off-white)
  --color-text:      #1A1A2E  (texte foncé)
  --color-text-mute: #6B6B7B  (texte secondaire)

Typographie :
  Display : Playfair Display (serif) — titres, accroches
  Body    : Inter (sans-serif) — tout le reste

Qualité de référence : getscale.africa
```

---

## Philosophie design (NON NÉGOCIABLE)

1. **Zéro fond plat uni** — utiliser des formes géométriques, des angles, des chevauchements, de la profondeur
2. **Zéro grille d'icônes colorées génériques**
3. **Assets intentionnels** — `contribute-person.webp` est l'image principale, elle prend toute la hauteur de la page à droite
4. **Transitions identitaires** — pas de fade-in génériques, les révélations doivent avoir du caractère
5. **SVG simples et formes géométriques** générés directement en code
6. **Benchmark qualité** : getscale.africa

---

## Asset disponible

```
/public/images/contribute-person.webp

Description : Femme africaine début vingtaine, peau foncée, 
cheveux naturels relevés, lunettes à montures transparentes, 
tenue élégante professionnelle (blazer ton chaud), 
posture debout confiante, plein corps jusqu'aux pieds, 
fond blanc supprimé (transparent), image portrait vertical 2:3.
```

---

## Logique de la page — ce qu'elle dit et à qui

La home s'adresse aux **locuteurs** : "Enregistre ta voix."
Cette page s'adresse à un profil différent : **développeurs, organisations, partenaires, personnes qui croient au projet mais ne parlent pas Ewe**.

La page doit répondre à une seule question : **"Comment puis-je aider Corafric à grandir ?"**

Elle ne parle **pas de dons financiers** pour l'instant — le projet n'a pas encore la crédibilité de chiffres concrets à montrer.

---

## Structure de la page

### SECTION 1 — Hero split (toute la hauteur du viewport)

**Layout : deux colonnes**
- Colonne gauche (55%) : texte + CTA
- Colonne droite (45%) : `contribute-person.webp` en plein pied, image qui longe toute la hauteur de la page

**Texte gauche :**
- Eyebrow tag (petite étiquette) : `Rejoindre le mouvement` (terracotta, uppercase, petit)
- Titre Playfair Display grand format :
  ```
  Les langues africaines
  méritent d'exister
  dans l'IA.
  ```
- Sous-titre Inter :
  ```
  Corafric est un projet communautaire ouvert.
  Il grandit grâce à des gens comme vous —
  développeurs, chercheurs, organisations, passionnés.
  ```
- Pas de CTA ici — le scroll vers les 3 piliers suffit
- Élément décoratif : une forme géométrique angulaire en terracotta très léger derrière le texte, pas un fond uni

**Image droite :**
- `contribute-person.webp` en `object-fit: contain`, collée en bas de la section
- Aucune découpe, aucun cadre — l'image flotte sur le fond
- Léger élément géométrique doré (#D4A017 à 10% opacité) en arrière-plan de l'image

---

### SECTION 2 — Les 3 façons de contribuer

**Layout : 3 cartes horizontales (ou empilées sur mobile)**

Pas d'icônes colorées génériques. Chaque carte a :
- Un numéro typographique grand format en Playfair Display (01 / 02 / 03) en terracotta très léger comme fond de carte
- Un titre court en Playfair Display
- Une description courte en Inter
- Un CTA texte avec flèche

**Carte 01 — Enregistrer sa voix**
```
Titre    : Vous parlez Ewe ou une langue locale ?
Desc     : La contribution la plus précieuse. Chaque phrase 
           enregistrée est un fragment de mémoire linguistique 
           préservé pour les générations futures.
CTA      : Commencer à contribuer →  (lien vers /enregistrer)
```

**Carte 02 — Contribuer au code**
```
Titre    : Vous êtes développeur ?
Desc     : Corafric est open source. Backend, frontend, pipeline 
           audio, modèles de validation — il y a de la place 
           pour toutes les spécialités.
CTA      : Voir le dépôt GitHub →  (lien externe GitHub)
```

**Carte 03 — Faire connaître le projet**
```
Titre    : Vous croyez à ce projet ?
Desc     : Parlez de Corafric autour de vous — dans votre université, 
           votre réseau, votre communauté. La visibilité est 
           une forme de contribution réelle.
CTA      : Partager le projet →  (lien vers page partage ou réseau)
```

---

### SECTION 3 — Pourquoi ce projet existe (bloc manifeste)

**Layout : texte centré, pleine largeur, fond légèrement différent (une nuance plus sombre de #F7F3EE ou une texture géométrique subtile)**

```
Titre Playfair Display :
"Les modèles d'IA les plus puissants du monde
ne comprennent pas l'Ewe. Ni le Dioula. Ni le Fon."

Texte Inter :
Corafric ne résoudra pas ce problème seul.
Mais il pose la première pierre : des données,
collectées par les communautés elles-mêmes,
pour des outils qui leur ressemblent.
```

Élément visuel : une ligne horizontale en dégradé terracotta → or, pas un simple `<hr>`

---

### SECTION 4 — Contact partenariats (footer de page)

**Layout simple, sobre**

```
Titre : Vous représentez une organisation ?
Texte : Universités, ONG, institutions culturelles, 
        entreprises tech — contactez-nous pour 
        discuter d'un partenariat formel.
CTA   : Écrire à l'équipe →  (mailto: contact@corafric.com)
```

---

## Comportement responsive

- Mobile : colonne image disparaît du hero, texte prend toute la largeur
- Les 3 cartes s'empilent verticalement
- Tout le reste s'adapte naturellement

---

## i18n

Toutes les chaînes de texte dans les fichiers de traduction next-intl :
- `messages/fr.json` → clé `contribuer.*`
- `messages/en.json` → clé `contribuer.*`

Ne pas hardcoder le moindre texte visible dans les composants.

---

## Ce qu'il NE faut PAS faire

- Pas de section dons / financement
- Pas d'icônes colorées en grille (Heroicons basiques sur fond coloré)
- Pas de fond plat uni sur toute une section sans relief
- Pas de `numbered steps` si ce n'est pas une séquence réelle
- Pas de texte générique type "Rejoignez notre communauté !" sans substance

---

## Résultat attendu

Une page élégante, africaine dans son identité, professionnelle dans son exécution. Quand un développeur sénégalais ou un chercheur en linguistique à Paris atterrit sur cette page, il doit sentir que ce projet est sérieux, ouvert, et que sa contribution a de la valeur.
