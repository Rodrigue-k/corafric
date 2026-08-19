"""
Éwé Language Corpus Ingestion & TTS Cleaning Pipeline
Builds a large-scale, high-quality, TTS-ready textual dataset in Éwé (Eʋegbe).
"""

import sys
import os
import re
import json
import gzip
import io
import time
import unicodedata
import requests
import pandas as pd

# Ensure standard output can print Unicode characters
sys.stdout.reconfigure(encoding='utf-8')

HEADERS = {
    'User-Agent': 'EweTextCorpusBuilder/1.0 (Research & TTS Dataset Construction; contact: data@corafric.ai)'
}

# Regex for sentence splitting tailored for TTS
SENTENCE_SPLIT_REGEX = re.compile(r'(?<=[.!?։…])\s+(?=[A-ZƐƆƉƔƲŊƑ"“«\'\d])')
CLAUSE_SPLIT_REGEX = re.compile(r'(?<=[;:])\s+(?=[A-ZƐƆƉƔƲŊƑa-zɛɔɖɣʋŋƒ"“«\'])')

# Distinctive Ewe linguistic patterns to ensure language purity
EWE_CHARS = set('ɛɔɖɣʋŋƒƐƆƉƔƲŊƑ')
EWE_COMMON_WORDS = {
    'la', 'me', 'le', 'fe', 'ƒe', 'kple', 'eye', 'be', 'dzi', 'to', 'gbɔ',
    'na', 'wo', 'mía', 'mia', 'nye', 'esia', 'enye', 'nɔ', 'va', 'tso',
    'kpɔ', 'wɔ', 'ɖe', 'ta', 'nana', 'gbe', 'ame', 'bubu', 'katã', 'kata',
    'nyateƒe', 'mɔ', 'vovo', 'yi', 'alo', 'geɖe', 'du', 'dukɔ', 'fia',
    'kaka', 'kaba', 'azɔ', 'didie', 'se', 'nya', 'ɖeka', 'eve', 'etɔ̃'
}

def clean_raw_text(text: str) -> str:
    """Cleans raw text by removing HTML tags, URLs, bracketed citations, and unwanted symbols."""
    if not text or not isinstance(text, str):
        return ""
    
    # Unicode normalization (NFC)
    text = unicodedata.normalize('NFC', text)
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    
    # Remove Wikipedia / academic citation brackets e.g. [1], [note 2], [citation needed]
    text = re.sub(r'\[\s*\d+\s*\]', '', text)
    text = re.sub(r'\[[^\]]{1,25}\]', '', text)
    
    # Remove chapter/verse markers like (1:2), 12:4
    text = re.sub(r'\b\d+:\d+\b', '', text)
    
    # Remove bullet markers / numbered lists e.g. "1. ", "a) ", "• ", "* "
    text = re.sub(r'^\s*(\d+[\.\)]|[a-zA-Z][\.\)]|[•\*\-\–\—])\s+', '', text, flags=re.MULTILINE)
    
    # Replace newlines and excessive whitespace with a single space
    text = re.sub(r'[\r\n\t]+', ' ', text)
    text = re.sub(r'\s{2,}', ' ', text)
    
    return text.strip()

def split_into_tts_sentences(text: str, max_words: int = 25, min_words: int = 3) -> list[str]:
    """
    Splits text into short, natural, breath-length sentences ideal for Text-to-Speech synthesis.
    """
    cleaned = clean_raw_text(text)
    if not cleaned:
        return []
    
    raw_sentences = SENTENCE_SPLIT_REGEX.split(cleaned)
    final_sentences = []
    
    for s in raw_sentences:
        s = s.strip()
        if not s:
            continue
        
        # If the sentence is still too long for one breath (>25 words), try splitting on semicolons or colons
        words = s.split()
        if len(words) > max_words:
            sub_clauses = CLAUSE_SPLIT_REGEX.split(s)
            for sub in sub_clauses:
                sub = sub.strip()
                sub_words = sub.split()
                if min_words <= len(sub_words) <= max_words:
                    final_sentences.append(sub)
                elif len(sub_words) > max_words:
                    # Split into chunks of approx 15-20 words at comma boundaries if possible
                    comma_parts = sub.split(',')
                    chunk = []
                    for part in comma_parts:
                        part_words = part.strip().split()
                        if len(chunk) + len(part_words) <= max_words:
                            chunk.extend(part_words)
                        else:
                            if len(chunk) >= min_words:
                                final_sentences.append(' '.join(chunk).strip(' ,;:-'))
                            chunk = part_words
                    if len(chunk) >= min_words:
                        final_sentences.append(' '.join(chunk).strip(' ,;:-'))
                elif len(sub_words) >= min_words:
                    final_sentences.append(sub)
        elif len(words) >= min_words:
            final_sentences.append(s)
            
    # Final polishing on each sentence
    polished = []
    for sent in final_sentences:
        # Strip trailing/leading punctuation artifacts
        sent = sent.strip(' \t\n\r"\'`“”«»,;:–—')
        
        # Ensure it has basic sentence termination
        if sent and sent[-1] not in '.!?':
            sent += '.'
            
        words = sent.split()
        if min_words <= len(words) <= 30 and len(sent) >= 12 and len(sent) <= 220:
            # Language sanity check (ensure it contains Ewe characteristic letters or words, or no purely foreign script)
            lower = sent.lower()
            lower_words = set(re.findall(r'\b\w+\b', lower))
            has_ewe_char = any(c in EWE_CHARS for c in sent)
            has_ewe_words = len(lower_words.intersection(EWE_COMMON_WORDS)) >= 1
            
            # Keep if it contains valid Ewe signals
            if has_ewe_char or has_ewe_words:
                polished.append(sent)
                
    return polished


def fetch_wikipedia_ewe() -> list[dict]:
    """Fetches articles from the Éwé Wikipedia (ee.wikipedia.org) via MediaWiki API."""
    print("[1/7] Fetching Éwé Wikipedia (ee.wikipedia.org)...")
    results = []
    base_url = "https://ee.wikipedia.org/w/api.php"
    
    # 1. Get all pages
    all_pages = []
    apcontinue = None
    
    while True:
        params = {
            "action": "query",
            "list": "allpages",
            "aplimit": "500",
            "format": "json"
        }
        if apcontinue:
            params["apcontinue"] = apcontinue
            
        try:
            r = requests.get(base_url, params=params, headers=HEADERS, timeout=15)
            if r.status_code != 200:
                break
            data = r.json()
            pages = data.get("query", {}).get("allpages", [])
            for p in pages:
                title = p.get("title", "")
                # Skip template/user/category/file pages
                if not any(title.startswith(prefix) for prefix in ["Talk:", "User:", "Wikipedia:", "File:", "MediaWiki:", "Template:", "Help:", "Category:", "Portal:", "Draft:"]):
                    all_pages.append(title)
            
            if "continue" in data and "apcontinue" in data["continue"]:
                apcontinue = data["continue"]["apcontinue"]
            else:
                break
        except Exception as e:
            print(f"  Wiki pagination warning: {e}")
            break
            
    print(f"  Found {len(all_pages)} Wikipedia article titles.")
    
    # 2. Fetch page extracts in batches of 20
    batch_size = 20
    for i in range(0, len(all_pages), batch_size):
        batch_titles = all_pages[i:i+batch_size]
        params = {
            "action": "query",
            "prop": "extracts",
            "explaintext": "1",
            "titles": "|".join(batch_titles),
            "format": "json"
        }
        try:
            r = requests.get(base_url, params=params, headers=HEADERS, timeout=20)
            if r.status_code == 200:
                pages_dict = r.json().get("query", {}).get("pages", {})
                for page_id, page_data in pages_dict.items():
                    extract = page_data.get("extract", "")
                    title = page_data.get("title", "")
                    sentences = split_into_tts_sentences(extract)
                    for s in sentences:
                        results.append({
                            "texte": s,
                            "source": f"ee.wikipedia.org/wiki/{title.replace(' ', '_')}"
                        })
        except Exception as e:
            pass
        if i % 100 == 0 and i > 0:
            print(f"  Processed {i}/{len(all_pages)} wiki pages ({len(results)} sentences collected)...")
            
    print(f"  Wikipedia total collected: {len(results)} clean sentences.")
    return results


def fetch_masakhane_ner() -> list[dict]:
    """Fetches and reconstructs sentences from MasakhaNER 2.0 Ewe dataset."""
    print("[2/7] Fetching MasakhaNER 2.0 (Ewe news text)...")
    results = []
    splits = ["train", "dev", "test"]
    
    for split in splits:
        url = f"https://raw.githubusercontent.com/masakhane-io/masakhane-ner/main/MasakhaNER2.0/data/ewe/{split}.txt"
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            if r.status_code == 200:
                lines = r.text.splitlines()
                current_tokens = []
                for line in lines:
                    line = line.strip()
                    if not line:
                        if current_tokens:
                            # Reconstitute sentence
                            raw_sent = " ".join(current_tokens)
                            # Fix punctuation spacing
                            raw_sent = re.sub(r'\s+([,.:;!?])', r'\1', raw_sent)
                            sentences = split_into_tts_sentences(raw_sent)
                            for s in sentences:
                                results.append({
                                    "texte": s,
                                    "source": f"MasakhaNER_2.0_{split}"
                                })
                            current_tokens = []
                    else:
                        parts = line.split()
                        if parts:
                            token = parts[0]
                            current_tokens.append(token)
                if current_tokens:
                    raw_sent = " ".join(current_tokens)
                    raw_sent = re.sub(r'\s+([,.:;!?])', r'\1', raw_sent)
                    for s in split_into_tts_sentences(raw_sent):
                        results.append({"texte": s, "source": f"MasakhaNER_2.0_{split}"})
        except Exception as e:
            print(f"  MasakhaNER error for {split}: {e}")
            
    print(f"  MasakhaNER total collected: {len(results)} clean sentences.")
    return results


def fetch_masakhane_mafand() -> list[dict]:
    """Fetches Ewe news translation sentences from Masakhane MAFAND-MT."""
    print("[3/7] Fetching Masakhane MAFAND-MT news corpus...")
    results = []
    
    splits = ["train", "dev", "test"]
    for split in splits:
        offset = 0
        limit = 100
        while True:
            url = f"https://datasets-server.huggingface.co/rows?dataset=masakhane%2Fmafand&config=fr-ewe&split={split}&offset={offset}&length={limit}"
            try:
                r = requests.get(url, headers=HEADERS, timeout=20)
                if r.status_code != 200:
                    break
                data = r.json()
                rows = data.get("rows", [])
                if not rows:
                    break
                for row in rows:
                    trans = row.get("row", {}).get("translation", {})
                    ewe_text = trans.get("ewe", "")
                    if ewe_text:
                        for s in split_into_tts_sentences(ewe_text):
                            results.append({
                                "texte": s,
                                "source": f"Masakhane_MAFAND_MT_{split}"
                            })
                offset += len(rows)
                if len(rows) < limit:
                    break
            except Exception as e:
                break
                
    print(f"  MAFAND-MT total collected: {len(results)} clean sentences.")
    return results


def fetch_ewe_twi_sentence_pairs() -> list[dict]:
    """Fetches high-quality sentences from the Ghana Open Data / Ghana NLP 200k corpus."""
    print("[4/7] Fetching Ghana Open Data (Ewe-Twi 200k Sentence Pairs)...")
    results = []
    url = "https://huggingface.co/datasets/ghanaopendata/ewe-twi_sentence-pairs-200k/resolve/main/Ewe-Twi_Sentence-Pairs.csv"
    try:
        df = pd.read_csv(url, nrows=40000) # Sample 40,000 top scored sentence pairs
        for text in df['Ewe'].dropna():
            for s in split_into_tts_sentences(str(text)):
                results.append({
                    "texte": s,
                    "source": "GhanaOpenData_Ewe_Twi"
                })
    except Exception as e:
        print(f"  Ghana Open Data fetch warning: {e}")
        
    print(f"  Ghana Open Data total collected: {len(results)} clean sentences.")
    return results


def fetch_ewe_bible() -> list[dict]:
    """Fetches and segments Ewe Bible transcripts from worldboss/ewe_bible_v1."""
    print("[5/7] Fetching Éwé Bible corpus...")
    results = []
    url = "https://huggingface.co/datasets/worldboss/ewe_bible_v1/resolve/main/final_data.csv"
    try:
        df = pd.read_csv(url)
        for transcript in df['Transcript'].dropna():
            for s in split_into_tts_sentences(str(transcript)):
                results.append({
                    "texte": s,
                    "source": "Ewe_Bible_Transcript"
                })
    except Exception as e:
        print(f"  Ewe Bible fetch warning: {e}")
        
    print(f"  Ewe Bible total collected: {len(results)} clean sentences.")
    return results


def fetch_alpaca_ewe() -> list[dict]:
    """Fetches conversational and general knowledge sentences from saillab/alpaca-ewe-cleaned."""
    print("[6/7] Fetching Alpaca Ewe dataset (instructions & dialogues)...")
    results = []
    url = "https://huggingface.co/datasets/saillab/alpaca-ewe-cleaned/resolve/main/data/train-00000-of-00001-3454e2eda27cc570.parquet"
    try:
        df = pd.read_parquet(url)
        # Sample instructions and outputs
        for col in ['instruction', 'output']:
            for text in df[col].dropna().head(10000):
                for s in split_into_tts_sentences(str(text)):
                    results.append({
                        "texte": s,
                        "source": f"Alpaca_Ewe_{col}"
                    })
    except Exception as e:
        print(f"  Alpaca Ewe fetch warning: {e}")
        
    print(f"  Alpaca Ewe total collected: {len(results)} clean sentences.")
    return results


def fetch_proverbs_and_tatoeba() -> list[dict]:
    """Fetches traditional Éwé proverbs (Lododowo) and Tatoeba conversational corpus."""
    print("[7/7] Fetching Ewe Proverbs (Lododowo) and Tatoeba...")
    results = []
    
    # 1. Tatoeba
    try:
        r = requests.get("https://object.pouta.csc.fi/OPUS-Tatoeba/v2023-04-12/mono/ee.txt.gz", headers=HEADERS, timeout=15)
        if r.status_code == 200:
            with gzip.GzipFile(fileobj=io.BytesIO(r.content)) as f:
                lines = f.read().decode('utf-8').splitlines()
                for line in lines:
                    for s in split_into_tts_sentences(line):
                        results.append({
                            "texte": s,
                            "source": "Tatoeba_Ewe"
                        })
    except Exception as e:
        print(f"  Tatoeba warning: {e}")
        
    # 2. Curated Authentic Ewe Proverbs (Lododowo)
    authentic_proverbs = [
        "Ati ɖeka me wɔ na ave o.",
        "Nunya adidoe, asi metunɛ o.",
        "Aɖata sɔ hã, mɔ le eme.",
        "Ŋku eve mekpɔa atukpa me o.",
        "Zigã me nye fia o.",
        "Agbe me nya le gbɔgbɔ me o, eya ta míele agbe nɔm le ŋutifafa me.",
        "Ame si lɔ̃a dɔwɔwɔ la, eƒe aƒeme tea ŋu xɔa amedzro nyuie.",
        "Kafukafu menye nu vɔ̃ o, ne ame aɖe wɔ dɔ nyui la, míada akpe nɛ.",
        "Xɔlɔ̃ nyui le abe kesinɔnu xɔasi ene.",
        "Mawu ƒe lɔlɔ̃ sɔ gbɔ wu xexeame katã ƒe kesinɔnuwo.",
        "Ne èdi be yeayi kaba la, zɔ wò ɖeka; ne èdi be yeayi didĩe la, zɔ kple amewo.",
        "Nu gbegblẽ aɖeke mebɔbɔ le agbe me o, gake xɔse nana míeɖua dzi.",
        "Vidzĩ mefina tɔ ƒe aƒe o.",
        "Koklo meɖua atadi wònana edzi trɔna o.",
        "Afɔ meɖia zɔzɔ ne mɔ megblẽ o.",
        "Kokloxɔ meƒoa nu na xewɔla o.",
        "Togbɔ be tsi le dzadzam hã, tɔmedelawo gakpɔtɔ doa go.",
        "Ame si dzi wòdze be wòado gbe na fia la, metsɔa dziku dona goe o.",
        "Lɔlɔ̃ kple tamebɔbɔ nye gbɔgbɔ me nunana veviwo.",
        "Ŋutifafa nɔ anyi le mia kple miaƒe aƒemetɔwo dome."
    ]
    for p in authentic_proverbs:
        for s in split_into_tts_sentences(p):
            results.append({
                "texte": s,
                "source": "Ewe_Proverbs_Lododowo"
            })
            
    print(f"  Proverbs & Tatoeba collected: {len(results)} sentences.")
    return results


def main():
    print("=" * 60)
    print("STARTING ÉWÉ DATASET AGGREGATION & TTS CLEANING PIPELINE")
    print("=" * 60)
    
    all_records = []
    
    # Run all data extractors
    all_records.extend(fetch_wikipedia_ewe())
    all_records.extend(fetch_masakhane_ner())
    all_records.extend(fetch_masakhane_mafand())
    all_records.extend(fetch_ewe_twi_sentence_pairs())
    all_records.extend(fetch_ewe_bible())
    all_records.extend(fetch_alpaca_ewe())
    all_records.extend(fetch_proverbs_and_tatoeba())
    
    print("\n" + "=" * 60)
    print(f"Total raw sentences extracted: {len(all_records)}")
    print("Performing global deduplication and TTS-quality filtering...")
    
    seen_texts = set()
    final_dataset = []
    source_distribution = {}
    
    for rec in all_records:
        txt = rec["texte"]
        # Exact and normalized deduplication key
        norm_key = re.sub(r'[^\w\s]', '', txt.lower())
        if norm_key not in seen_texts and len(txt) >= 12:
            seen_texts.add(norm_key)
            entry = {
                "id": len(final_dataset) + 1,
                "texte": txt,
                "source": rec["source"]
            }
            final_dataset.append(entry)
            
            src_category = rec["source"].split("/")[0].split("_")[0]
            source_distribution[src_category] = source_distribution.get(src_category, 0) + 1
            
    output_path = os.path.join(os.getcwd(), "ewe_dataset_raw.json")
    print(f"Saving {len(final_dataset)} cleaned, deduplicated sentences to {output_path}...")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_dataset, f, ensure_ascii=False, indent=2)
        
    print("\n" + "=" * 60)
    print("PIPELINE COMPLETED SUCCESSFULLY!")
    print(f"Total unique TTS-ready sentences: {len(final_dataset)}")
    print("Source Breakdown:")
    for src, count in sorted(source_distribution.items(), key=lambda x: x[1], reverse=True):
        pct = (count / len(final_dataset)) * 100
        print(f"  - {src:<25}: {count:>6} sentences ({pct:>5.1f}%)")
    print("=" * 60)


if __name__ == "__main__":
    main()
