"""
Translate Mock Test JSON from English to Assamese using Google Gemini API.

Prerequisites:
    pip install google-genai

Usage:
    1. Set your Gemini API key (get one free at https://aistudio.google.com/apikey)
    2. Run: python translate_json.py <input_file.json>
    
    Example: python translate_json.py public/data/Mock_Test_3_mock.json

Output:
    Creates a new file with '_as' suffix, e.g. Mock_Test_3_mock_as.json
"""

import json
import sys
import os
import time
import re
from google import genai
from google.genai import errors as genai_errors

# ──────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyDz42u8MKR58IeM93mDzZK1hxH990IUkaY")

# Models to try in order (falls back to next if quota exhausted)
# Each model has its own separate quota on the free tier
MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]

# Fields to translate in each question object
TRANSLATABLE_FIELDS = [
    "question_text",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "explanation",
]

# Fields to translate in the mock_test metadata
META_TRANSLATABLE_FIELDS = [
    "title",
    "description",
    "pattern",
]

# How many questions to send per API call (batching saves quota)
BATCH_SIZE = 5

# Retry settings
MAX_RETRIES = 5
INITIAL_WAIT = 30  # seconds — matches the API's suggested retry delay

# ──────────────────────────────────────────────
# PROGRESS TRACKING (resume on crash)
# ──────────────────────────────────────────────

def get_progress_path(input_path):
    base, _ = os.path.splitext(input_path)
    return f"{base}_as_progress.json"


def save_progress(input_path, data, last_completed_batch):
    """Save current progress so we can resume after a crash."""
    progress_path = get_progress_path(input_path)
    progress = {
        "last_completed_batch": last_completed_batch,
        "data": data,
    }
    with open(progress_path, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)
    print(f"    💾 Progress saved (batch {last_completed_batch})")


def load_progress(input_path):
    """Load saved progress if it exists."""
    progress_path = get_progress_path(input_path)
    if os.path.exists(progress_path):
        with open(progress_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def clear_progress(input_path):
    """Remove progress file after successful completion."""
    progress_path = get_progress_path(input_path)
    if os.path.exists(progress_path):
        os.remove(progress_path)


# ──────────────────────────────────────────────
# TRANSLATION LOGIC
# ──────────────────────────────────────────────

current_model_index = 0

def create_client():
    """Create a Gemini API client."""
    client = genai.Client(api_key=GEMINI_API_KEY)
    return client


def get_current_model():
    return MODELS[current_model_index]


def switch_to_next_model():
    """Try the next model in the fallback list."""
    global current_model_index
    if current_model_index < len(MODELS) - 1:
        current_model_index += 1
        print(f"  🔄 Switching to model: {MODELS[current_model_index]}")
        return True
    return False


def call_gemini_with_retry(client, prompt):
    """Call Gemini API with automatic retry on rate limit (429) errors."""
    global current_model_index

    for attempt in range(MAX_RETRIES):
        model = get_current_model()
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )
            return response

        except genai_errors.ClientError as e:
            error_str = str(e)

            # Model not found or not available — try next model
            if "404" in error_str or "NOT_FOUND" in error_str:
                print(f"  ⚠ Model {model} not available.")
                if switch_to_next_model():
                    continue
                else:
                    print(f"  ✗ No available models found.")
                    sys.exit(1)

            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                # Extract retry delay from error message if available
                delay_match = re.search(r'retryDelay.*?(\d+)', error_str)
                wait_time = int(delay_match.group(1)) + 5 if delay_match else INITIAL_WAIT * (attempt + 1)

                # Check if it's a daily quota issue (limit: 0 means fully exhausted for the day)
                if "limit: 0" in error_str:
                    print(f"  ⚠ Daily quota exhausted for {model}.")
                    if switch_to_next_model():
                        continue  # Try immediately with new model
                    else:
                        print(f"  ✗ All models exhausted. Please wait until tomorrow or upgrade your API plan.")
                        print(f"    Upgrade at: https://ai.google.dev/pricing")
                        sys.exit(1)

                # Per-minute rate limit — just wait and retry
                print(f"  ⏳ Rate limited (attempt {attempt + 1}/{MAX_RETRIES}). Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise  # Non-rate-limit error, re-raise

    print(f"  ✗ Failed after {MAX_RETRIES} retries. Exiting.")
    sys.exit(1)


def translate_batch(client, texts: list[str]) -> list[str]:
    """
    Translate a batch of English texts to Assamese using Gemini.
    Returns a list of translated strings in the same order.
    """
    if not texts:
        return []

    # Build a numbered list for the prompt
    numbered = "\n".join(f"[{i}] {t}" for i, t in enumerate(texts))

    prompt = f"""You are a professional English-to-Assamese translator for educational content.

TASK: Translate each numbered English text below into Assamese (অসমীয়া).

RULES:
1. Return ONLY a valid JSON array of strings, in the same order as the input.
2. Preserve ALL LaTeX/math expressions exactly as-is (anything between $ signs or with backslashes like \\frac, \\text, etc.).
3. Preserve proper nouns, abbreviations (DNA, NCERT, USA, etc.), and technical terms that are commonly used in English even in Assamese contexts.
4. Keep numbers, dates, and units unchanged.
5. If a text is empty (""), return an empty string.
6. Do NOT add any explanation, markdown formatting, or extra text — just the JSON array.

INPUT TEXTS:
{numbered}

OUTPUT (JSON array of {len(texts)} Assamese strings):"""

    response = call_gemini_with_retry(client, prompt)

    # Parse the response
    raw = response.text.strip()

    # Remove markdown code fences if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1]).strip()

    try:
        translated = json.loads(raw)
        if len(translated) != len(texts):
            print(f"  ⚠ Expected {len(texts)} translations, got {len(translated)}. Retrying individually...")
            return translate_individually(client, texts)
        return translated
    except json.JSONDecodeError as e:
        print(f"  ⚠ Failed to parse batch response. Retrying individually...")
        print(f"    Raw response: {raw[:200]}...")
        return translate_individually(client, texts)


def translate_individually(client, texts: list[str]) -> list[str]:
    """Fallback: translate one text at a time."""
    results = []
    for text in texts:
        if not text.strip():
            results.append("")
            continue
        try:
            translated = translate_batch(client, [text])
            results.append(translated[0] if translated else text)
            time.sleep(4)  # Generous rate limiting for individual calls
        except Exception as e:
            print(f"    ✗ Failed to translate: {text[:50]}... Error: {e}")
            results.append(text)  # Keep original on failure
    return results


def translate_metadata(client, meta: dict) -> dict:
    """Translate the mock_test metadata fields."""
    texts_to_translate = []
    field_keys = []

    for field in META_TRANSLATABLE_FIELDS:
        if field in meta and meta[field]:
            texts_to_translate.append(str(meta[field]))
            field_keys.append(field)

    if not texts_to_translate:
        return meta

    print(f"  Translating metadata ({len(texts_to_translate)} fields)...")
    translated = translate_batch(client, texts_to_translate)

    translated_meta = meta.copy()
    for key, value in zip(field_keys, translated):
        translated_meta[key] = value

    return translated_meta


def translate_questions(client, questions: list[dict], input_path: str, data: dict, start_batch: int = 0) -> list[dict]:
    """Translate all questions in batches, with progress saving."""
    total = len(questions)

    # If resuming, keep already-translated questions
    if start_batch > 0:
        translated_questions = questions[:start_batch * BATCH_SIZE]
        print(f"  📂 Resuming from batch {start_batch + 1} (questions {start_batch * BATCH_SIZE + 1}+)")
    else:
        translated_questions = []

    for batch_start in range(start_batch * BATCH_SIZE, total, BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, total)
        batch = questions[batch_start:batch_end]
        batch_num = batch_start // BATCH_SIZE

        print(f"  Translating questions {batch_start + 1}–{batch_end} of {total}...")

        # Collect all translatable texts from this batch
        texts_to_translate = []
        field_map = []

        for q_idx, question in enumerate(batch):
            for field in TRANSLATABLE_FIELDS:
                if field in question:
                    texts_to_translate.append(str(question[field]))
                    field_map.append((q_idx, field))

        # Translate the batch
        translated_texts = translate_batch(client, texts_to_translate)

        # Reassemble questions
        batch_translated = [q.copy() for q in batch]
        for (q_idx, field), translated_text in zip(field_map, translated_texts):
            batch_translated[q_idx][field] = translated_text

        translated_questions.extend(batch_translated)

        # Save progress after each batch
        progress_data = data.copy()
        progress_data["questions"] = translated_questions + questions[batch_end:]
        save_progress(input_path, progress_data, batch_num + 1)

        # Rate limiting between batches
        if batch_end < total:
            time.sleep(4)

    return translated_questions


def translate_json_file(input_path: str):
    """Main function to translate a mock test JSON file."""
    base, ext = os.path.splitext(input_path)
    output_path = f"{base}_as{ext}"

    print(f"═══════════════════════════════════════════")
    print(f"  Mock Test JSON Translator (EN → অসমীয়া)")
    print(f"═══════════════════════════════════════════")
    print(f"  Input:  {input_path}")
    print(f"  Output: {output_path}")
    print(f"  Model:  {get_current_model()} (with fallbacks)")
    print()

    # Check for saved progress
    progress = load_progress(input_path)
    start_batch = 0
    meta_done = False

    if progress:
        print(f"  📂 Found saved progress! Resuming from batch {progress['last_completed_batch'] + 1}...")
        data = progress["data"]
        start_batch = progress["last_completed_batch"]
        meta_done = True  # Metadata was already translated
        print()
    else:
        with open(input_path, "r", encoding="utf-8") as f:
            data = json.load(f)

    client = create_client()

    # Translate metadata
    if "mock_test" in data and not meta_done:
        print("📋 Translating test metadata...")
        data["mock_test"] = translate_metadata(client, data["mock_test"])
        print("  ✓ Metadata done.\n")

    # Translate questions
    if "questions" in data:
        print(f"📝 Translating {len(data['questions'])} questions...")
        data["questions"] = translate_questions(client, data["questions"], input_path, data, start_batch)
        print(f"  ✓ All questions translated.\n")

    # Save output
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Clean up progress file
    clear_progress(input_path)

    print(f"✅ Saved translated file: {output_path}")
    print(f"   File size: {os.path.getsize(output_path):,} bytes")


# ──────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python translate_json.py <input_file.json>")
        print("Example: python translate_json.py public/data/Mock_Test_3_mock.json")
        sys.exit(1)

    input_file = sys.argv[1]

    if not os.path.exists(input_file):
        print(f"Error: File not found: {input_file}")
        sys.exit(1)

    if GEMINI_API_KEY == "YOUR_API_KEY_HERE":
        print("═══════════════════════════════════════════════════════════")
        print("  ⚠  No API key found!")
        print("  Get a FREE Gemini API key at: https://aistudio.google.com/apikey")
        print()
        print("  Then either:")
        print("    1. Set environment variable:  set GEMINI_API_KEY=your_key_here")
        print("    2. Or edit this script and replace YOUR_API_KEY_HERE")
        print("═══════════════════════════════════════════════════════════")
        sys.exit(1)

    translate_json_file(input_file)
