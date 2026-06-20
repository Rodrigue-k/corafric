# Prompt Antigravity — Corafric
> À copier-coller tel quel dans Antigravity pour lancer le développement.

---

## CONTEXTE DU PROJET

Tu travailles sur **Corafric** — une plateforme open source de collecte de données vocales et textuelles en langues africaines, commençant par l'Ewe (Togo/Ghana). La mission : fournir les données nécessaires pour entraîner des modèles IA capables de comprendre et parler les langues africaines. C'est un projet communautaire — les contributeurs viennent enregistrer leur voix en lisant des phrases Ewe, et valider les enregistrements des autres.

Le repo est déjà initialisé avec Next.js 15 (App Router), TypeScript, Tailwind CSS.

---

## STACK TECHNIQUE

```
Frontend       → Next.js 15 App Router + TypeScript + Tailwind
Auth           → Clerk (@clerk/nextjs)
Base de données → Neon (PostgreSQL via @neondatabase/serverless)
Storage audio  → Cloudflare R2 (via AWS S3 SDK compatible)
Images         → next/image obligatoire, jamais <img>
Icons          → lucide-react uniquement
Fonts          → next/font/google (Playfair Display + Inter)
```

**Packages à installer en priorité :**
```bash
npm install @clerk/nextjs @neondatabase/serverless @aws-sdk/client-s3 @aws-sdk/s3-request-presigner lucide-react
```

---

## VARIABLES D'ENVIRONNEMENT

Créer `.env.local` avec ces clés (valeurs vides, l'utilisateur les remplira) :
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/contribute
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/contribute

# Neon
DATABASE_URL=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=corafric-audio
R2_PUBLIC_URL=
```

---

## DESIGN SYSTEM — OBLIGATOIRE

### Couleurs (à définir dans globals.css comme variables CSS)
```css
:root {
  --primary: #B84A2A;
  --primary-hover: #D4622F;
  --primary-tint: #FDF0EB;
  --accent: #D4A017;
  --background: #F7F3EE;
  --foreground: #1A1A2E;
  --text-muted: #5C3D2E;
  --border: #E8E0D8;
  --card: #FFFFFF;
}
```

### Typographie
```css
/* Dans globals.css */
/* Display (titres, hero) : Playfair Display */
/* Body (contenu) : Inter */
```

Échelle typographique :
- `.text-display` → Playfair Display, 48px, font-weight 700
- `.text-h1` → Playfair Display, 36px, font-weight 600
- `.text-h2` → Inter, 24px, font-weight 600
- `.text-h3` → Inter, 20px, font-weight 500
- `.text-body` → Inter, 15px, font-weight 400
- `.text-caption` → Inter, 12px, font-weight 400
- `.text-label` → Inter, 11px, font-weight 500, uppercase, letter-spacing 0.08em

---

## PHILOSOPHIE DESIGN — NON NÉGOCIABLE

**Ces règles s'appliquent sur CHAQUE page, CHAQUE section :**

1. **Zéro fond uni** sur les sections importantes. Utiliser des formes SVG géométriques intégrées directement dans le JSX pour créer de la profondeur et du mouvement visuel.

2. **Zéro grille d'icônes colorées génériques.** Pas de section "nos features" avec 6 icônes multicolores. Si on montre des features, c'est via du texte fort ou des éléments visuels intentionnels.

3. **Assets intentionnels** : deux fichiers sont déjà dans `/public/images/` :
   - `hero-person.webp` → photo d'un jeune homme africain qui parle dans son téléphone (background déjà supprimé, PNG transparent)
   - `logo.svg` → logo mark de Corafric (barres de waveform en silhouette africaine)
   Ces assets DOIVENT apparaître dans les bonnes sections, pas des placeholders.

4. **Animations identitaires** : L'animation signature de Corafric est une **pulsation de waveform** — les barres du logo qui montent et descendent légèrement en boucle. Utiliser CSS keyframes, pas de lib externe.

5. **Micro-interactions** : Tous les boutons et éléments cliquables ont un hover state fluide (150ms ease).

6. **Formes SVG de fond** : Les formes géométriques de fond (rectangles inclinés, cercles partiels, lignes diagonales) sont générées directement en JSX/SVG dans le code — pas des images.

7. **Niveau de référence visuel** : getscale.africa. Ce n'est pas une instruction de copier, c'est l'étalon de qualité visuelle attendu.

---

## STRUCTURE DES FICHIERS À CRÉER

```
src/
├── app/
│   ├── layout.tsx                    # Layout global avec Clerk + fonts
│   ├── globals.css                   # Variables CSS + base styles
│   ├── page.tsx                      # Landing page (/)
│   ├── contribute/
│   │   └── page.tsx                  # Page d'enregistrement vocal
│   ├── validate/
│   │   └── page.tsx                  # Page de validation
│   ├── explore/
│   │   └── page.tsx                  # Stats + leaderboard + dataset
│   ├── sign-in/[[...sign-in]]/
│   │   └── page.tsx                  # Page auth Clerk
│   └── sign-up/[[...sign-up]]/
│       └── page.tsx                  # Page auth Clerk
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx                # Variants: primary, secondary, ghost
│   │   ├── Badge.tsx                 # Variants: default, success, warning
│   │   └── Card.tsx                  # Composant carte générique
│   ├── layout/
│   │   ├── Navbar.tsx                # Navigation avec logo + auth
│   │   └── Footer.tsx                # Footer simple
│   ├── recording/
│   │   ├── RecordingStudio.tsx       # Interface d'enregistrement complète
│   │   ├── AudioVisualizer.tsx       # Waveform en temps réel (canvas/SVG)
│   │   └── SentenceDisplay.tsx       # Affichage phrase à lire
│   └── validation/
│       ├── ValidationCard.tsx        # Carte écoute + vote
│       └── ValidationControls.tsx    # Boutons valid/invalid
│
├── lib/
│   ├── db.ts                         # Client Neon
│   ├── r2.ts                         # Client Cloudflare R2
│   └── utils.ts                      # Helpers généraux
│
└── types/
    └── index.ts                      # Types TypeScript globaux
```

---

## SCHÉMA BASE DE DONNÉES

Créer `src/lib/schema.sql` avec ce contenu (à exécuter manuellement sur Neon) :

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  country TEXT,
  native_language TEXT DEFAULT 'ewe',
  total_contributions INTEGER DEFAULT 0,
  total_validations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ewe',
  source TEXT DEFAULT 'system',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence_id UUID REFERENCES sentences(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  audio_url TEXT NOT NULL,
  duration_ms INTEGER,
  file_size_bytes INTEGER,
  status TEXT DEFAULT 'pending',
  validation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  is_valid BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recording_id, user_id)
);
```

---

## PAGE 1 — LANDING PAGE (`/`)

### Structure de la page

**Section Hero :**
- Fond non uni : formes SVG géométriques inclinées en couleur `--primary` à très faible opacité (5-8%) dans le coin supérieur droit
- Colonne gauche : badge "Open Source · Ewe · Togo", titre display en Playfair Display, sous-titre en Inter, deux boutons CTA (Contribuer → primary, Voir le dataset → secondary)
- Colonne droite : `hero-person.webp` chargé avec `next/image`, absolute positioned avec des éléments flottants autour (carte stats avec le nombre d'enregistrements, badge langue, etc.)
- La photo doit dépasser visuellement les limites de sa colonne — elle doit être vivante, pas enfermée dans un container

**Section Stats :**
- Fond légèrement différent (couleur `--primary-tint` à 30% sur le background)
- 3 grands compteurs : Enregistrements collectés / Locuteurs actifs / Heures audio
- Pas d'icônes — juste des grands chiffres en Playfair Display avec des labels en Inter caption

**Section Comment ça marche :**
- Fond avec une forme SVG diagonale en arrière-plan
- 3 étapes numérotées en grand (01, 02, 03) avec texte. PAS d'icônes colorées.
- Design horizontal sur desktop, vertical sur mobile

**Section Pourquoi c'est important :**
- Texte éditorial fort, une ou deux phrases en grand, le reste en body
- Optionnel : citation mise en valeur visuellement

**CTA Final :**
- Fond plein `--foreground` (dark) avec texte blanc
- Un titre et deux boutons

---

## PAGE 2 — CONTRIBUTE (`/contribute`)

Cette page nécessite d'être connecté (rediriger vers /sign-in si non authentifié via Clerk middleware).

### Layout
- Navbar + contenu centré max-w-2xl
- Pas de sidebar

### Composant RecordingStudio
Logique complète :

**États de la machine :**
```
idle → recording → recorded → submitting → submitted → idle (phrase suivante)
```

**État `idle` :**
- Affiche la phrase en Ewe en grand (Playfair Display, 26px)
- Sa traduction française en dessous en gris
- Bouton "Commencer l'enregistrement" (primary, avec icône microphone de lucide-react)
- Lien "Passer cette phrase" (ghost, petit)

**État `recording` :**
- La phrase reste affichée
- Visualiseur audio en temps réel : barres verticales animées qui réagissent au micro (utiliser Web Audio API + requestAnimationFrame)
- Les barres doivent reprendre l'esthétique du logo (même forme, même couleur)
- Timer qui compte les secondes
- Bouton "Arrêter" (rouge, pulsant)

**État `recorded` :**
- Player audio pour réécouter
- Bouton "Soumettre" (primary)
- Bouton "Recommencer" (secondary)

**État `submitting` :**
- Spinner + "Envoi en cours..."

**État `submitted` :**
- Message de succès + animation
- "Phrase suivante →" auto-trigger après 1.5s

### API Calls nécessaires
- `GET /api/sentences/next` → récupère une phrase non encore enregistrée par cet user
- `POST /api/recordings/upload` → upload audio vers R2 + save en DB

---

## PAGE 3 — VALIDATE (`/validate`)

Nécessite d'être connecté.

### Logique
- Récupère un enregistrement `pending` que l'utilisateur n'a pas encore validé et qu'il n'a pas lui-même créé
- Affiche la phrase correspondante
- Lecteur audio simple (bouton play)
- Deux boutons : ✓ Correct / ✗ Incorrect
- Après validation → slide vers l'enregistrement suivant (transition fluide, pas un reload)
- Compteur de validations faites dans la session

### API Calls
- `GET /api/recordings/next` → enregistrement à valider
- `POST /api/validations` → soumettre validation

---

## PAGE 4 — EXPLORE (`/explore`)

Page publique, pas de login requis.

### Sections
1. **Compteurs globaux** (même style que landing stats)
2. **Leaderboard** : top 10 contributeurs avec username, nombre de contributions, badges
3. **Télécharger le dataset** : bouton qui trigger le download d'un ZIP (pour MVP, juste afficher les infos + lien qui sera actif plus tard)
4. **Langues disponibles** : pour MVP juste Ewe, mais prévoir visuellement de l'espace pour futures langues

---

## COMPOSANTS UI

### Button.tsx
```typescript
// Variants: 'primary' | 'secondary' | 'ghost' | 'destructive'
// Sizes: 'sm' | 'md' | 'lg'
// Props: variant, size, loading (boolean), disabled, onClick, children
// Loading state : spinner inline + text "Chargement..."
// Toujours utiliser cursor-not-allowed sur disabled
```

### Badge.tsx
```typescript
// Variants: 'default' | 'success' | 'warning' | 'outline'
// Couleurs basées sur les variables CSS
```

### Navbar.tsx
```typescript
// Logo : logo.svg + texte "Corafric" en Playfair Display
// Links : Contribuer / Valider / Explorer
// Auth : UserButton de Clerk si connecté, sinon bouton "Se connecter"
// Fond : blanc avec border-bottom subtil
// Sticky en haut
```

---

## API ROUTES

### `src/app/api/sentences/next/route.ts`
```typescript
// GET - Retourne une phrase que l'user n'a pas encore enregistrée
// Header requis : Clerk auth
// Query params : language (default: 'ewe')
// Response : { id, text, language, source }
```

### `src/app/api/recordings/upload/route.ts`
```typescript
// POST - Upload audio vers R2 + save en DB
// Body : FormData avec 'audio' (Blob) + 'sentenceId' (string)
// Processus : 
//   1. Vérifier auth Clerk
//   2. Upload le fichier vers R2 avec un nom unique (uuid + .webm)
//   3. Sauvegarder les métadonnées en DB (url R2, durée, taille)
//   4. Incrémenter total_contributions de l'user
// Response : { success, recordingId }
```

### `src/app/api/recordings/next/route.ts`
```typescript
// GET - Retourne un enregistrement pending à valider
// Conditions :
//   - status = 'pending'
//   - user_id != current user
//   - Pas déjà validé par current user (pas dans table validations)
// Response : { id, audioUrl, sentence: { text, language } }
```

### `src/app/api/validations/route.ts`
```typescript
// POST - Soumettre une validation
// Body : { recordingId, isValid }
// Processus :
//   1. Insérer en DB
//   2. Compter les validations positives/négatives pour ce recording
//   3. Si >= 3 positives : status → 'approved'
//   4. Si >= 2 négatives : status → 'rejected'
//   5. Incrémenter total_validations de l'user
// Response : { success }
```

### `src/app/api/stats/route.ts`
```typescript
// GET - Statistiques globales pour la landing et explore
// Response : { 
//   totalRecordings, 
//   approvedRecordings,
//   totalUsers, 
//   totalHours (calculé depuis duration_ms),
//   totalSentences
// }
// Cache : revalidate toutes les 60 secondes (Next.js cache)
```

---

## RÈGLES DE COMMITS — OBLIGATOIRE

**Ne jamais commiter du code non fonctionnel.**

Format de commit : `feat(scope): description courte`

Scopes autorisés : `layout`, `landing`, `contribute`, `validate`, `explore`, `api`, `db`, `auth`, `ui`, `config`

**Avant chaque commit, vérifier :**
- [ ] `npm run build` passe sans erreur
- [ ] Aucune erreur TypeScript
- [ ] La page concernée s'affiche sans erreur console
- [ ] Les imports sont propres (pas d'unused imports)

**Ordre des commits attendu :**
1. `feat(config): setup env, fonts, globals.css, CSS variables`
2. `feat(layout): navbar et footer`
3. `feat(ui): Button, Badge, Card components`
4. `feat(db): client Neon + schema SQL`
5. `feat(api): route stats`
6. `feat(landing): page complète avec hero, stats, how-it-works`
7. `feat(auth): pages sign-in et sign-up Clerk`
8. `feat(api): routes sentences et recordings`
9. `feat(contribute): RecordingStudio complet`
10. `feat(validate): ValidationCard complet`
11. `feat(explore): page stats et leaderboard`

---

## PRIORITÉ D'EXÉCUTION

Commencer dans cet ordre strict :

1. **Config** → globals.css avec variables CSS + fonts + Clerk middleware
2. **Layout** → Navbar + Footer
3. **UI Components** → Button, Badge, Card
4. **Landing page** → Page complète, assets intégrés
5. **Auth pages** → Sign-in / Sign-up Clerk
6. **API routes** → Dans l'ordre du schéma
7. **Contribute** → RecordingStudio
8. **Validate** → ValidationCard
9. **Explore** → Stats + Leaderboard

**Ne pas passer à l'étape suivante si l'étape précédente n'est pas fonctionnelle et committée.**

---

## NOTES FINALES

- Toujours utiliser `next/image` pour les images, avec `priority` prop sur le hero
- Le fichier `public/images/hero-person.webp` existe déjà — l'utiliser directement
- Le fichier `public/images/logo.svg` existe déjà — l'utiliser dans Navbar et partout où le logo apparaît
- Responsive obligatoire : mobile-first, breakpoints sm/md/lg/xl
- `'use client'` uniquement quand nécessaire (hooks, events, Web API)
- Server Components par défaut pour tout le reste
- Pas de `any` en TypeScript — typer correctement tout ce qu'on reçoit de la DB et des APIs
