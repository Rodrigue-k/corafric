# 🎙️ Corafric

> **La voix de l'Afrique, entraîne l'IA de demain.**  
> *Africa's voice, training tomorrow's AI.*

Corafric is a community-driven, open-source platform designed to collect and validate voice datasets in African languages, starting with **Ewe** (Togo). Our mission is to bridge the massive gap in artificial intelligence models, where African languages are unrepresented, and preserve our rich oral heritage for future generations.

---

## 🚀 The Mission

Most modern AI voice models do not understand African languages. Corafric aims to solve this by building high-quality, open-license (**CC-BY**) voice datasets directly contributed and validated by the communities themselves. 

We enable:
- **Speakers** to record short localized sentences in Ewe and other languages.
- **Validators** to vote on the pronunciation quality of contributions to ensure clean datasets.
- **Developers & Researchers** to download these free datasets and build translation, dictation, and assistant models.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Internationalization (i18n)**: [next-intl](https://next-intl-docs.vercel.app/) (FR & EN support)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: [Neon](https://neon.tech/) (Serverless PostgreSQL)
- **Audio Storage**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (S3-compatible bucket)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 💻 Local Setup & Installation

To run this project locally, make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Clone the repository
```bash
git clone https://github.com/Rodrigue-k/corafric.git
cd corafric
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and configure the keys (refer to Clerk, Neon PostgreSQL, and Cloudflare R2 configurations):
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/contribute
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/contribute

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://your_db_credentials

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=corafric-audio
R2_PUBLIC_URL=https://your_public_bucket_url
```

### 4. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
├── public/                 # Static assets (images, logo, illustrations)
└── src/
    ├── app/                # Next.js App Router Pages
    │   └── [locale]/       # Localized pages (page.tsx, /contribute, /contribuer...)
    ├── components/         # Reusable React UI & Layout Components
    │   ├── layout/         # Navbar, Footer
    │   ├── sections/       # BrandShowcase, Hero etc.
    │   └── ui/             # Buttons, Cards, Badges, AfricaMap SVG
    ├── i18n/               # Internationalization routing & translation files
    │   ├── messages/       # Localized JSON files (fr.json, en.json)
    │   └── routing.ts      # next-intl configuration
    ├── lib/                # Database/R2 client initializations
    └── types/              # TypeScript types and definitions
```

---

## 🤝 How to Contribute

Whether you are a developer, linguist, organization, or simply believe in the project, there are several ways to get involved:

1. **Speak & Validate**: Visit the live website and contribute audio files or validate existing recordings.
2. **Code**: Explore our open issues, submit Pull Requests (PRs), or improve the audio recording workflow.
3. **Outreach**: Share Corafric within your university, local community, or networks.
4. **Partner**: If you represent an NGO, university, or tech company, write to us at `contact@corafric.com` to explore formal partnerships.

### Contribution Guidelines
- Formats code using standard Next.js and Tailwind patterns.
- Ensure all visible texts are added to translation files (`en.json`/`fr.json`) to keep the multi-language support functional.
- Run `npm run build` to verify there are no TypeScript or build warnings before pushing.

---

## 📄 License

Corafric is open-source software licensed under the **MIT License**. Collected voice datasets are published under **Creative Commons Attribution (CC-BY)**.
