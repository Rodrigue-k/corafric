# Corafric

> **La voix de l'Afrique, entraîne l'IA de demain.**  
> *Africa's voice, training tomorrow's AI.*

Corafric is a community-driven, open-source platform designed to collect and validate voice datasets in African languages, beginning with **Ewe** (Togo). Our mission is to bridge the massive gap in artificial intelligence models where African languages are unrepresented, preserving our rich oral heritage for future generations.

---

## The Mission

Most modern AI voice models do not understand African languages. Corafric aims to solve this by building high-quality, open-license (**CC-BY**) voice datasets directly contributed and validated by the communities themselves. 

We enable:
* **Speakers** to record short localized sentences in Ewe and other languages.
* **Validators** to vote on pronunciation quality to ensure clean datasets.
* **Developers & Researchers** to download these free datasets and build translation, dictation, and assistant models.

---

## Design Philosophy & Identity

Unlike typical utility platforms, Corafric is built with a strong focus on editorial aesthetic, warmth, and premium design, drawing inspiration from contemporary premium African web designs. 

Our core identity guidelines:
* **Typography**: Playfair Display (Serif) for display headers to convey heritage and trust, paired with Inter (Sans-serif) for clean, readable body copy.
* **Color System**: Warm off-white background (`#F7F3EE`), balanced with terracotta (`#B84A2A`) and subtle gold (`#D4A017`) accents.
* **Layout Structure**: Zéro generic flat background color blocks. We use overlapping geometric shapes, depth, and vertical splits to create a dynamic, premium space.
* **Minimalism**: Zéro generic icon grids or redundant badges/capsules. Every visual element is intentional and spacious.

---

## Tech Stack

* **Framework**: Next.js 15 (App Router, Turbopack)
* **Language**: TypeScript
- **Styling**: Tailwind CSS
* **Localization**: next-intl (Bilingual French & English support)
* **Authentication**: Clerk
* **Database**: Neon (Serverless PostgreSQL)
* **Audio Storage**: Cloudflare R2 (S3-compatible bucket)
* **Deployment**: Vercel

---

## Local Setup & Installation

Make sure you have Node.js installed locally.

### 1. Clone the repository
```bash
git clone https://github.com/Rodrigue-k/corafric.git
cd /corafric
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add the following keys:
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

### 4. Run the development server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## How to Contribute

We welcome contributions from developers, linguists, designers, and organizations.

1. **Record & Validate**: Visit the website to contribute audio files or validate existing recordings.
2. **Code**: Explore our open issues on GitHub, submit Pull Requests (PRs), or improve the audio recording pipeline.
3. **Design**: Help us maintain the premium look by adhering strictly to our editorial layout constraints.
4. **Outreach**: Spread the word about Corafric within your university, local community, or networks.

*Contact us at `contact@corafric.com` to explore formal partnerships.*

---

## License

Corafric is open-source software licensed under the **MIT License**. Collected voice datasets are published under **Creative Commons Attribution (CC-BY)**.
