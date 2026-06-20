# Prompt Antigravity — Corafric (Suite)
> À exécuter après le premier prompt. Ne pas mélanger les deux.

---

## AJOUT : INTERNATIONALISATION (i18n)

### Package à installer
```bash
npm install next-intl
```

### Nouvelle structure de fichiers

```
src/
├── i18n/
│   ├── config.ts
│   ├── request.ts
│   └── messages/
│       ├── fr.json
│       └── en.json
├── middleware.ts          # À remplacer — intégrer next-intl + Clerk ensemble
└── app/
    └── [locale]/          # Wrapper toutes les pages existantes dans [locale]
        ├── layout.tsx
        ├── page.tsx
        ├── contribute/
        │   └── page.tsx
        ├── validate/
        │   └── page.tsx
        ├── explore/
        │   └── page.tsx
        ├── sign-in/[[...sign-in]]/
        │   └── page.tsx
        └── sign-up/[[...sign-up]]/
            └── page.tsx
```

### `src/i18n/config.ts`
```typescript
export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';
```

### `src/i18n/request.ts`
```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  return {
    locale: locale ?? routing.defaultLocale,
    messages: (await import(`./messages/${locale ?? routing.defaultLocale}.json`)).default
  };
});
```

### `src/middleware.ts` — Clerk + next-intl combinés
```typescript
import createMiddleware from 'next-intl/middleware';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

const isProtectedRoute = createRouteMatcher([
  '/:locale/contribute(.*)',
  '/:locale/validate(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
  return intlMiddleware(req);
});

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)']
};
```

### `src/i18n/messages/fr.json`
```json
{
  "nav": {
    "contribute": "Contribuer",
    "validate": "Valider",
    "explore": "Explorer",
    "signIn": "Se connecter"
  },
  "landing": {
    "badge": "Open Source · Ewe · Togo",
    "title": "La voix de l'Afrique,\nentraîne l'IA de demain.",
    "subtitle": "Contribue en 2 minutes. Lis une phrase en Ewe, enregistre ta voix. Tu construis l'infrastructure IA africaine.",
    "ctaPrimary": "Commencer à contribuer",
    "ctaSecondary": "Voir le dataset",
    "stats": {
      "recordings": "Enregistrements",
      "speakers": "Locuteurs actifs",
      "hours": "Heures audio"
    },
    "how": {
      "title": "Comment ça marche",
      "step1Title": "Tu lis",
      "step1Desc": "On te propose une phrase en Ewe. Tu la lis à voix haute.",
      "step2Title": "Tu enregistres",
      "step2Desc": "Tu appuies sur le bouton. Ton micro capte ta voix. C'est tout.",
      "step3Title": "Tu construis",
      "step3Desc": "Ta voix rejoint la base de données. L'IA africaine apprend."
    }
  },
  "contribute": {
    "title": "Enregistre ta voix",
    "phraseLabel": "Lis cette phrase à voix haute",
    "startRecording": "Commencer l'enregistrement",
    "stopRecording": "Arrêter",
    "submit": "Soumettre",
    "retry": "Recommencer",
    "skip": "Passer cette phrase",
    "submitting": "Envoi en cours...",
    "success": "Enregistrement soumis !",
    "nextPhrase": "Phrase suivante"
  },
  "validate": {
    "title": "Valider les enregistrements",
    "instruction": "Écoute et dis si la phrase est bien prononcée",
    "play": "Écouter",
    "valid": "Correct",
    "invalid": "Incorrect",
    "sessionCount": "{count} validations cette session"
  },
  "explore": {
    "title": "Explorer le dataset",
    "downloadTitle": "Télécharger le dataset",
    "downloadDesc": "Dataset complet des enregistrements approuvés — libre d'utilisation (CC-BY)",
    "downloadBtn": "Télécharger (ZIP)",
    "leaderboardTitle": "Top contributeurs"
  }
}
```

### `src/i18n/messages/en.json`
```json
{
  "nav": {
    "contribute": "Contribute",
    "validate": "Validate",
    "explore": "Explore",
    "signIn": "Sign in"
  },
  "landing": {
    "badge": "Open Source · Ewe · Togo",
    "title": "Africa's voice,\ntraining tomorrow's AI.",
    "subtitle": "Contribute in 2 minutes. Read a sentence in Ewe, record your voice. You're building Africa's AI infrastructure.",
    "ctaPrimary": "Start contributing",
    "ctaSecondary": "View dataset",
    "stats": {
      "recordings": "Recordings",
      "speakers": "Active speakers",
      "hours": "Audio hours"
    },
    "how": {
      "title": "How it works",
      "step1Title": "You read",
      "step1Desc": "We give you a sentence in Ewe. You read it out loud.",
      "step2Title": "You record",
      "step2Desc": "Press the button. Your mic captures your voice. That's it.",
      "step3Title": "You build",
      "step3Desc": "Your voice joins the dataset. African AI learns."
    }
  },
  "contribute": {
    "title": "Record your voice",
    "phraseLabel": "Read this sentence out loud",
    "startRecording": "Start recording",
    "stopRecording": "Stop",
    "submit": "Submit",
    "retry": "Retry",
    "skip": "Skip this sentence",
    "submitting": "Uploading...",
    "success": "Recording submitted!",
    "nextPhrase": "Next sentence"
  },
  "validate": {
    "title": "Validate recordings",
    "instruction": "Listen and tell us if the sentence is well pronounced",
    "play": "Listen",
    "valid": "Correct",
    "invalid": "Incorrect",
    "sessionCount": "{count} validations this session"
  },
  "explore": {
    "title": "Explore the dataset",
    "downloadTitle": "Download the dataset",
    "downloadDesc": "Full dataset of approved recordings — free to use (CC-BY)",
    "downloadBtn": "Download (ZIP)",
    "leaderboardTitle": "Top contributors"
  }
}
```

### Comment utiliser dans les composants

**Server Component :**
```typescript
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('landing');
  return <h1>{t('title')}</h1>;
}
```

**Client Component :**
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('contribute');
  return <button>{t('startRecording')}</button>;
}
```

### Sélecteur de langue dans la Navbar
Ajouter un toggle FR | EN dans la Navbar.
Utiliser `useRouter` de `next-intl/navigation` pour changer de locale sans reload complet.

---

## RÈGLE DE COMMIT POUR CETTE SUITE

```
feat(i18n): setup next-intl with fr and en locales
feat(i18n): wrap all pages under [locale] dynamic segment  
feat(i18n): add language switcher to navbar
```

Un commit par étape. Vérifier que la navigation fonctionne en FR et EN avant de commiter.
