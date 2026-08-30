const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
  if (dbUrlMatch) {
    process.env.DATABASE_URL = dbUrlMatch[1].trim();
  }
}

// Curated offline Ewe - French - English dictionary dataset (High quality & instant seed)
const EWE_DICTIONARY_DATASET = [
  // 1. Salutations & Essentiels
  { ewe: "ŋdi na wò", fr: "bonjour (matin)", en: "good morning", def: "Salutation du matin adressée à une personne." },
  { ewe: "ŋdɔ na wò", fr: "bonjour (après-midi)", en: "good afternoon", def: "Salutation de milieu de journée." },
  { ewe: "fiẽ na wò", fr: "bonsoir", en: "good evening", def: "Salutation du soir." },
  { ewe: "za na wò", fr: "bonne nuit", en: "good night", def: "Vœu adressé avant de dormir." },
  { ewe: "akpe na wò", fr: "merci", en: "thank you", def: "Expression de gratitude." },
  { ewe: "akpe kaka", fr: "merci beaucoup", en: "thank you very much", def: "Remerciement chaleureux et appuyé." },
  { ewe: "taflatse", fr: "s'il te plaît / pardon", en: "please / excuse me", def: "Formule de politesse ou d'excuse." },
  { ewe: "ɛ̃", fr: "oui", en: "yes", def: "Affirmation." },
  { ewe: "ao", fr: "non", en: "no", def: "Négation." },
  { ewe: "efoa?", fr: "comment vas-tu ?", en: "how are you?", def: "Demande de nouvelles au singulier." },
  { ewe: "mifoa?", fr: "comment allez-vous ?", en: "how are you (plural)?", def: "Demande de nouvelles au pluriel." },
  { ewe: "mefo", fr: "je vais bien", en: "I am fine", def: "Réponse affirmative pour la santé." },
  { ewe: "mia dogo", fr: "au revoir", en: "goodbye", def: "Formule de séparation provisoire." },
  { ewe: "hede nyuie", fr: "bon voyage / bonne route", en: "safe travels", def: "Vœu pour un voyageur." },
  { ewe: "nɔ anyi nyuie", fr: "reste en paix / au revoir", en: "stay well", def: "Formule adressée à celui qui reste." },

  // 2. Famille & Personnes
  { ewe: "ŋutsu", fr: "homme", en: "man", def: "Être humain mâle adulte." },
  { ewe: "nyɔnu", fr: "femme", en: "woman", def: "Être humain femelle adulte." },
  { ewe: "ɖevi", fr: "enfant", en: "child", def: "Jeune garçon ou jeune fille." },
  { ewe: "tɔ", fr: "père", en: "father", def: "Parent masculin." },
  { ewe: "nɔ", fr: "mère", en: "mother", def: "Parent féminin." },
  { ewe: "noviŋutsu", fr: "frère", en: "brother", def: "Frère de même sang ou de communauté." },
  { ewe: "novinyɔnu", fr: "sœur", en: "sister", def: "Sœur de même sang ou de communauté." },
  { ewe: "vinyɔnu", fr: "fille", en: "daughter", def: "Enfant de sexe féminin." },
  { ewe: "viŋutsu", fr: "fils", en: "son", def: "Enfant de sexe masculin." },
  { ewe: "xɔ̃", fr: "ami", en: "friend", def: "Compagnon de confiance." },
  { ewe: "srɔ̃ŋutsu", fr: "mari / époux", en: "husband", def: "Homme uni par le mariage." },
  { ewe: "srɔ̃nyɔnu", fr: "épouse / femme", en: "wife", def: "Femme unie par le mariage." },
  { ewe: "tɔgbui", fr: "grand-père / ancêtre", en: "grandfather / elder", def: "Aïeul ou titre de respect." },
  { ewe: "mama", fr: "grand-mère", en: "grandmother", def: "Aïeule respectée." },
  { ewe: "ame", fr: "personne / être humain", en: "person / human", def: "Individu humain." },
  { ewe: "amewo", fr: "gens / personnes", en: "people", def: "Groupe d'individus." },
  { ewe: "ɖevivi", fr: "bébé / nourrisson", en: "baby / infant", def: "Très jeune enfant." },
  { ewe: "fia", fr: "roi / chef traditionnel", en: "king / chief", def: "Dignitaire ou souverain d'une localité." },
  { ewe: "nunɔla", fr: "prêtre / chef religieux", en: "priest / spiritual leader", def: "Guide spirituel." },
  { ewe: "nufiala", fr: "enseignant / maître", en: "teacher", def: "Personne qui transmet le savoir." },

  // 3. Corps Humain (Anatomie)
  { ewe: "ta", fr: "tête", en: "head", def: "Partie supérieure du corps." },
  { ewe: "mo", fr: "visage / face", en: "face", def: "Face avant de la tête." },
  { ewe: "ŋku", fr: "œil", en: "eye", def: "Organe de la vue." },
  { ewe: "to", fr: "oreille", en: "ear", def: "Organe de l'ouïe." },
  { ewe: "ŋɔti", fr: "nez", en: "nose", def: "Organe de l'odorat et respiration." },
  { ewe: "nu", fr: "bouche", en: "mouth", def: "Cavité buccale." },
  { ewe: "aɖe", fr: "langue", en: "tongue", def: "Organe du goût et de la parole." },
  { ewe: "aɖu", fr: "dent", en: "tooth", def: "Organe dur servant à mâcher." },
  { ewe: "kɔ", fr: "cou", en: "neck", def: "Partie reliant la tête au tronc." },
  { ewe: "asi", fr: "main / bras", en: "hand / arm", def: "Membre supérieur." },
  { ewe: "asibidɛ", fr: "doigt", en: "finger", def: "Extrémité de la main." },
  { ewe: "afɔ", fr: "pied / jambe", en: "foot / leg", def: "Membre inférieur." },
  { ewe: "afɔbidɛ", fr: "orteil", en: "toe", def: "Extrémité du pied." },
  { ewe: "dɔme", fr: "ventre / estomac", en: "stomach / belly", def: "Abdomen." },
  { ewe: "dzi", fr: "cœur", en: "heart", def: "Organe vital de la circulation." },
  { ewe: "ʋu", fr: "sang", en: "blood", def: "Liquide vital rouge." },
  { ewe: "ŋutilã", fr: "corps / chair", en: "body / flesh", def: "Structure physique humaine." },
  { ewe: "ƒu", fr: "os", en: "bone", def: "Partie rigide du squelette." },
  { ewe: "gbɔgbɔ", fr: "souffle / esprit", en: "breath / spirit", def: "Respiration ou principe vital." },

  // 4. Nature, Éléments & Animaux
  { ewe: "tsi", fr: "eau / pluie", en: "water / rain", def: "Liquide indispensable à la vie." },
  { ewe: "dzo", fr: "feu", en: "fire", def: "Élément produisant chaleur et lumière." },
  { ewe: "anyi", fr: "terre / sol", en: "earth / ground", def: "Surface du sol ou planète." },
  { ewe: "ya", fr: "air / vent", en: "air / wind", def: "Atmosphère ou brise." },
  { ewe: "ɣe", fr: "soleil", en: "sun", def: "Astre du jour." },
  { ewe: "ɣleti", fr: "lune / mois", en: "moon / month", def: "Astre de la nuit ou division du calendrier." },
  { ewe: "ɣletivi", fr: "étoile", en: "star", def: "Point lumineux dans le ciel nocturne." },
  { ewe: "dziƒo", fr: "ciel / paradis", en: "sky / heaven", def: "Voûte céleste." },
  { ewe: "tɔsisi", fr: "rivière / fleuve", en: "river", def: "Cours d'eau naturel." },
  { ewe: "ƒu", fr: "mer / océan", en: "sea / ocean", def: "Grande étendue d'eau salée." },
  { ewe: "to", fr: "montagne / colline", en: "mountain / hill", def: "Élévation naturelle de terrain." },
  { ewe: "ave", fr: "forêt / bois", en: "forest", def: "Grande étendue couverte d'arbres." },
  { ewe: "ati", fr: "arbre / bois", en: "tree / wood", def: "Végétal ligneux." },
  { ewe: "agbe", fr: "vie", en: "life", def: "Existence animée." },
  { ewe: "kpe", fr: "pierre / rocher", en: "stone / rock", def: "Matière minérale solide." },
  { ewe: "ke", fr: "sable", en: "sand", def: "Petits grains minéraux." },
  { ewe: "avũ", fr: "chien", en: "dog", def: "Animal domestique fidèle." },
  { ewe: "dadi", fr: "chat", en: "cat", def: "Petit félin domestique." },
  { ewe: "nyi", fr: "vache / bœuf", en: "cow / cattle", def: "Bovidé élevé pour le lait et la viande." },
  { ewe: "gbɔ̃", fr: "chèvre", en: "goat", def: "Caprin domestique." },
  { ewe: "alẽ", fr: "mouton", en: "sheep", def: "Ovin élevé pour sa laine ou sa chair." },
  { ewe: "koklo", fr: "poule / poulet", en: "chicken", def: "Volaille de basse-cour." },
  { ewe: "koklotsu", fr: "coq", en: "rooster", def: "Mâle de la poule." },
  { ewe: "xe", fr: "oiseau", en: "bird", def: "Animal pourvu de plumes et d'ailes." },
  { ewe: "tɔmelã", fr: "poisson", en: "fish", def: "Animal aquatique." },
  { ewe: "da", fr: "serpent", en: "snake", def: "Reptile sans pattes." },
  { ewe: "to", fr: "buffle", en: "buffalo", def: "Grand bovidé sauvage." },

  // 5. Nourriture & Maison
  { ewe: "nuɖuɖu", fr: "nourriture / repas", en: "food / meal", def: "Substance pour se nourrir." },
  { ewe: "abolo", fr: "pain de maïs cuit à la vapeur", en: "steamed corn cake", def: "Mets traditionnel togolais." },
  { ewe: "akple", fr: "pâte de maïs (akple)", en: "corn flour dough (akple)", def: "Aliment de base traditionnel." },
  { ewe: "agbeli", fr: "manioc", en: "cassava", def: "Tubercule nourricier." },
  { ewe: "te", fr: "igname", en: "yam", def: "Tubercule cultivé en Afrique de l'Ouest." },
  { ewe: "bli", fr: "maïs", en: "corn / maize", def: "Céréale principale." },
  { ewe: "mɔlu", fr: "riz", en: "rice", def: "Céréale consommée bouillie." },
  { ewe: "dzeke", fr: "sel", en: "salt", def: "Assaisonnement minéral." },
  { ewe: "sukli", fr: "sucre", en: "sugar", def: "Substance douce au goût." },
  { ewe: "ami", fr: "huile", en: "oil", def: "Corps gras pour la cuisson." },
  { ewe: "lã", fr: "viande", en: "meat", def: "Chair d'animal pour l'alimentation." },
  { ewe: "azi", fr: "arachide", en: "peanut / groundnut", def: "Légumineuse oléagineuse." },
  { ewe: "ayra", fr: "haricot / niébé", en: "beans", def: "Légume sec riche en protéines." },
  { ewe: "xɔ", fr: "chambre / maison", en: "room / house", def: "Bâtiment servant d'habitation." },
  { ewe: "aƒe", fr: "foyer / domicile", en: "home / household", def: "Lieu de vie familial." },
  { ewe: "ʋɔtru", fr: "porte", en: "door", def: "Ouverture pour entrer dans un bâtiment." },
  { ewe: "fesre", fr: "fenêtre", en: "window", def: "Ouverture pour l'aération et la lumière." },
  { ewe: "aba", fr: "lit / natte", en: "bed / mat", def: "Support pour dormir." },
  { ewe: "kplɔ", fr: "table", en: "table", def: "Meuble à surface plane." },
  { ewe: "zikpui", fr: "chaise / siège", en: "chair / seat", def: "Meuble pour s'asseoir." },
  { ewe: "ga", fr: "argent / monnaie / fer", en: "money / metal", def: "Moyen d'échange ou matière métallique." },
  { ewe: "agbalẽ", fr: "livre / papier / lettre", en: "book / paper", def: "Document écrit." },
  { ewe: "avu", fr: "tissu / pagne", en: "cloth / fabric", def: "Étoffe traditionnelle." },
  { ewe: "afɔkpa", fr: "chaussure / sandale", en: "shoe / sandal", def: "Protection pour le pied." },

  // 6. Lieux, Temps & Société
  { ewe: "asi", fr: "marché", en: "market", def: "Lieu d'échange commercial." },
  { ewe: "mɔ", fr: "chemin / route / voyage", en: "road / path / way", def: "Voie de circulation." },
  { ewe: "du", fr: "ville / village / cité", en: "town / village", def: "Agglomération d'habitants." },
  { ewe: "dukɔ", fr: "pays / nation / peuple", en: "country / nation", def: "Territoire d'une communauté souveraine." },
  { ewe: "sukulu", fr: "école", en: "school", def: "Établissement d'enseignement." },
  { ewe: "kɔdzi", fr: "hôpital / dispensaire", en: "hospital", def: "Établissement de soins de santé." },
  { ewe: "ŋkeke", fr: "jour / journée", en: "day", def: "Période de 24 heures." },
  { ewe: "zã", fr: "nuit", en: "night", def: "Période d'obscurité." },
  { ewe: "egbe", fr: "aujourd'hui", en: "today", def: "Ce jour même." },
  { ewe: "etsɔ", fr: "demain / hier", en: "tomorrow / yesterday", def: "Jour suivant ou précédent selon le contexte." },
  { ewe: "nyitsɔ", fr: "avant-hier", en: "day before yesterday", def: "Deux jours avant aujourd'hui." },
  { ewe: "ƒe", fr: "année", en: "year", def: "Cycle de 12 mois." },
  { ewe: "kɔsiɖa", fr: "semaine / dimanche", en: "week / Sunday", def: "Période de 7 jours." },
  { ewe: "ga", fr: "heure", en: "hour / time", def: "Unité de mesure du temps." },

  // 7. Nombres & Chiffres
  { ewe: "ɖeka", fr: "un (1)", en: "one", def: "Premier nombre cardinal." },
  { ewe: "eve", fr: "deux (2)", en: "two", def: "Deuxième nombre cardinal." },
  { ewe: "etɔ̃", fr: "trois (3)", en: "three", def: "Troisième nombre cardinal." },
  { ewe: "ene", fr: "quatre (4)", en: "four", def: "Quatrième nombre cardinal." },
  { ewe: "atɔ̃", fr: "cinq (5)", en: "five", def: "Cinquième nombre cardinal." },
  { ewe: "ade", fr: "six (6)", en: "six", def: "Sixième nombre cardinal." },
  { ewe: "adre", fr: "sept (7)", en: "seven", def: "Septième nombre cardinal." },
  { ewe: "enyi", fr: "huit (8)", en: "eight", def: "Huitième nombre cardinal." },
  { ewe: "asieke", fr: "neuf (9)", en: "nine", def: "Neuvième nombre cardinal." },
  { ewe: "ewo", fr: "dix (10)", en: "ten", def: "Dixième nombre cardinal." },
  { ewe: "blaeve", fr: "vingt (20)", en: "twenty", def: "Nombre valant deux dizaines." },
  { ewe: "alafa", fr: "cent (100)", en: "hundred", def: "Nombre valant dix dizaines." },
  { ewe: "akpe", fr: "mille (1000)", en: "thousand", def: "Dix centaines." },

  // 8. Verbes d'Action essentiels
  { ewe: "ɖu", fr: "manger", en: "to eat", def: "Consommer de la nourriture." },
  { ewe: "no", fr: "boire", en: "to drink", def: "Avaler un liquide." },
  { ewe: "dɔ alɔ̃", fr: "dormir", en: "to sleep", def: "Se reposer dans le sommeil." },
  { ewe: "nyɔ", fr: "se réveiller / être bon", en: "to wake up / to be good", def: "Sortir du sommeil ou posséder la bonté." },
  { ewe: "kpɔ", fr: "voir / regarder", en: "to see / to look", def: "Percevoir par la vue." },
  { ewe: "se", fr: "entendre / comprendre", en: "to hear / to understand", def: "Percevoir par l'ouïe." },
  { ewe: "ƒo nu", fr: "parler / discuter", en: "to speak", def: "Exprimer par la parole." },
  { ewe: "ɖo to", fr: "écouter attentivement", en: "to listen", def: "Prêter attention aux sons." },
  { ewe: "zɔ", fr: "marcher", en: "to walk", def: "Se déplacer à pied." },
  { ewe: "ƒu du", fr: "courir", en: "to run", def: "Se déplacer rapidement à pied." },
  { ewe: "va", fr: "venir", en: "to come", def: "Se diriger vers ici." },
  { ewe: "yi", fr: "aller / partir", en: "to go", def: "Se déplacer vers un lieu." },
  { ewe: "nɔ anyi", fr: "s'asseoir / rester", en: "to sit / to stay", def: "Prendre place sur un siège." },
  { ewe: "tsi tre", fr: "se lever / se tenir debout", en: "to stand up", def: "Prendre la position verticale." },
  { ewe: "na", fr: "donner / offrir", en: "to give", def: "Transmettre quelque chose à quelqu'un." },
  { ewe: "xɔ", fr: "recevoir / accepter", en: "to receive / to take", def: "Prendre ce qui est offert." },
  { ewe: "ƒle", fr: "acheter", en: "to buy", def: "Acquérir contre paiement." },
  { ewe: "dzra", fr: "vendre", en: "to sell", def: "Céder un bien contre de l'argent." },
  { ewe: "wɔ dɔ", fr: "travailler", en: "to work", def: "Exercer une activité professionnelle ou utile." },
  { ewe: "fe", fr: "jouer / s'amuser", en: "to play", def: "Pratiquer un jeu ou divertissement." },
  { ewe: "lɔ̃", fr: "aimer / chérir", en: "to love", def: "Éprouver de l'affection profonde." },
  { ewe: "kpe ɖe eŋu", fr: "aider / secourir", en: "to help", def: "Prêter main forte." },
  { ewe: "srɔ̃ nu", fr: "apprendre / étudier", en: "to learn / to study", def: "Acquérir des connaissances." },
  { ewe: "fia nu", fr: "enseigner", en: "to teach", def: "Transmettre un savoir." },
  { ewe: "ŋlɔ", fr: "écrire", en: "to write", def: "Tracer des signes sur un support." },
  { ewe: "xlẽ", fr: "lire / compter", en: "to read / to count", def: "Déchiffrer un texte ou énumérer." },
  { ewe: "ɖa nu", fr: "cuisiner", en: "to cook", def: "Préparer un repas au feu." },
  { ewe: "nya nu", fr: "laver / nettoyer", en: "to wash", def: "Nettoyer à l'eau." },
  { ewe: "bu tame", fr: "penser / réfléchir", en: "to think / to ponder", def: "Faire usage de sa réflexion." },
  { ewe: "nya", fr: "savoir / connaître", en: "to know", def: "Avoir conscience ou connaissance." },

  // 9. Adjectifs, Couleurs & Qualités
  { ewe: "nyuie", fr: "bon / bien / beau", en: "good / fine", def: "Qui possède des qualités positives." },
  { ewe: "vɔ̃ɖi", fr: "mauvais / méchant", en: "bad / evil", def: "Contraire de bon." },
  { ewe: "gã", fr: "grand / vaste / important", en: "big / large / great", def: "De taille ou valeur élevée." },
  { ewe: "sue", fr: "petit / modeste", en: "small / tiny", def: "De dimension réduite." },
  { ewe: "xɔ dzo", fr: "chaud", en: "hot", def: "Ayant une température élevée." },
  { ewe: "fa", fr: "froid / frais / calme", en: "cold / cool / peaceful", def: "De température basse ou d'humeur paisible." },
  { ewe: "yeye", fr: "nouveau / neuf", en: "new / fresh", def: "Récent dans le temps." },
  { ewe: "xoxo", fr: "ancien / vieux", en: "old / ancient", def: "Existant depuis longtemps." },
  { ewe: "kpla", fr: "fort / puissant / robuste", en: "strong / powerful", def: "Doté d'une grande force." },
  { ewe: "gbɔdzɔ", fr: "faible / fatigué", en: "weak", def: "Manquant de force physique." },
  { ewe: "kɔ", fr: "propre / saint", en: "clean / pure / holy", def: "Dépourvu de souillure." },
  { ewe: "ɖi ƒo", fr: "sale / souillé", en: "dirty", def: "Taché ou impur." },
  { ewe: "dzo", fr: "rouge", en: "red", def: "Couleur écarlate ou sang." },
  { ewe: "yibɔ", fr: "noir", en: "black", def: "Couleur sombre." },
  { ewe: "ɣi", fr: "blanc", en: "white", def: "Couleur claire et lumineuse." },
  { ewe: "blɔ", fr: "bleu", en: "blue", def: "Couleur du ciel ou de la mer." },
  { ewe: "gbemumu", fr: "vert", en: "green", def: "Couleur des herbes et des feuilles." },
  { ewe: "angba", fr: "jaune", en: "yellow", def: "Couleur or ou solaire." },
  { ewe: "kaba", fr: "vite / rapidement", en: "fast / quickly", def: "Avec célérité." },
  { ewe: "blewu", fr: "doucement / lentement", en: "slowly / gently", def: "Avec calme et modération." },
  { ewe: "vevie", fr: "important / précieux / urgent", en: "important / vital", def: "De grande valeur ou priorité." },
  { ewe: "nyateƒe", fr: "vérité", en: "truth", def: "Conformité à la réalité." },
  { ewe: "aʋatso", fr: "mensonge", en: "lie", def: "Affirmation contraire à la vérité." },
  { ewe: "dzidzɔ", fr: "joie / bonheur", en: "joy / happiness", def: "État de grande satisfaction." },
  { ewe: "vevesese", fr: "douleur / tristesse", en: "pain / sadness", def: "Souffrance physique ou morale." },
  { ewe: "ŋutifafa", fr: "paix / sérénité", en: "peace", def: "Absence de conflit et tranquillité." }
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  console.log("=== Corafric Offline Curated Dictionary Seeder ===");
  console.log(`Starting insertion of ${EWE_DICTIONARY_DATASET.length} high-quality curated terms...`);

  let inserted = 0;
  for (const item of EWE_DICTIONARY_DATASET) {
    try {
      const eweWord = item.ewe.toLowerCase().trim();
      const frWord = item.fr.toLowerCase().trim();
      const enWord = item.en.toLowerCase().trim();
      const def = item.def || null;

      await sql`
        INSERT INTO dictionary_words (
          word_ewe, word_fr, word_en, definition, audio_url, sources, confidence_score
        ) VALUES (
          ${eweWord}, 
          ${frWord}, 
          ${enWord}, 
          ${def},
          NULL, 
          '["lexique-national", "corafric-curated"]'::jsonb, 
          5
        )
        ON CONFLICT (word_ewe, COALESCE(word_fr, '')) DO UPDATE SET 
          word_en = EXCLUDED.word_en,
          definition = COALESCE(dictionary_words.definition, EXCLUDED.definition),
          sources = '["lexique-national", "corafric-curated"]'::jsonb,
          confidence_score = 5
      `;
      inserted++;
      console.log(`[+] Seeded [${inserted}/${EWE_DICTIONARY_DATASET.length}]: "${eweWord}" -> FR: "${frWord}" | EN: "${enWord}"`);
    } catch (err) {
      console.error(`[!] Error seeding "${item.ewe}":`, err.message);
    }
  }

  const total = await sql`SELECT COUNT(*) FROM dictionary_words WHERE word_fr IS NOT NULL`;
  console.log(`\n✅ Curated offline dictionary seeding complete! Total words available in dictionary: ${total[0].count}`);
}

seed();
