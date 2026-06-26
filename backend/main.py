from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pyphen
import asyncio
from typing import List, Optional
import os
import re
import google.generativeai as genai
from dotenv import load_dotenv

# Load env variables from backend/.env
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path=dotenv_path)

app = FastAPI(title="BelongED Backend", description="API for OCR Text Processing, Syllabification, and AI Tutoring")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Pyphen for basic English syllabification
# Note: For localized Filipino/Bisaya, we would initialize custom regex or logic here.
dic = pyphen.Pyphen(lang='en')

# Global cache for best model name
# Helper to perform content generation with automatic model fallback (robust to quota 429 errors or model not found 404 errors)
async def generate_content_with_fallback(prompt_or_contents, system_instruction=None, json_mode=False):
    """
    Attempts to generate content using the preferred Gemini models in order.
    If a model fails due to quota limits, not found, or other API issues,
    it automatically falls back to the next model.
    """
    current_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not current_api_key:
        raise Exception("Gemini API Key not found in backend/.env")
        
    genai.configure(api_key=current_api_key.strip())
    
    # We will try the models in this order
    models_to_try = [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ]
    
    # Query available models to filter out ones not supported by the API key
    try:
        loop = asyncio.get_event_loop()
        available_models = await loop.run_in_executor(None, lambda: [m.name for m in genai.list_models()])
        available_names = [m.replace("models/", "") for m in available_models]
        # Filter models_to_try to only those available
        filtered_models = [m for m in models_to_try if m in available_names]
        # If filtering succeeded and found some models, use them. Otherwise keep the default list.
        if filtered_models:
            models_to_try = filtered_models
    except Exception as e:
        print(f"Warning: Could not list models from Gemini API ({e}). Using default fallback list.")

    last_error = None
    loop = asyncio.get_event_loop()
    
    for model_name in models_to_try:
        try:
            print(f"Attempting Gemini request using model: {model_name}")
            
            # Configure generation config
            config = {}
            if json_mode:
                config["response_mime_type"] = "application/json"
                
            # Create model
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=config if json_mode else None,
                system_instruction=system_instruction
            )
            
            # Generate response
            response = await loop.run_in_executor(
                None,
                lambda: model.generate_content(prompt_or_contents)
            )
            
            # If successful, return the response
            print(f"Successfully generated content using: {model_name}")
            return response
            
        except Exception as e:
            last_error = e
            print(f"Model {model_name} failed: {e}. Trying next model...")
            continue
            
    # If all models failed, raise the last exception
    raise last_error

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("BelongED Backend starting up...")
    print("Checking Gemini AI Connection...")
    
    current_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not current_api_key:
        print("ERROR: Gemini API Key not found in backend/.env or environment variables.")
        print("Please check your GEMINI_API_KEY setting.")
        print("="*60 + "\n")
        return

    try:
        api_key_stripped = current_api_key.strip()
        genai.configure(api_key=api_key_stripped)
        
        # Verify connection by listing models (does not consume generate_content quota)
        loop = asyncio.get_event_loop()
        available_models = await loop.run_in_executor(None, lambda: [m.name for m in genai.list_models()])
        print(f"Gemini AI Connection Successful! Found {len(available_models)} available models.")
    except Exception as e:
        print("Gemini AI Connection Failed!")
        print(f"Error details: {e}")
        print("Please verify your API key and network connection.")
    print("="*60 + "\n")

# ---------------------------------------------------------------------------------
# Pydantic Models for Data Contracts
# ---------------------------------------------------------------------------------

class SummaryPoint(BaseModel):
    full_sentence: str
    syllabified_words: List[List[str]]

class Flashcard(BaseModel):
    term: str
    definition: str

class ReviewMaterialResponse(BaseModel):
    document_title: str
    raw_text: str
    raw_text_fil: str
    review_points: List[SummaryPoint]
    review_points_fil: List[SummaryPoint]
    flashcards: List[Flashcard]
    flashcards_fil: List[Flashcard]

class OCRRequest(BaseModel):
    raw_text: str

# ---------------------------------------------------------------------------------
# Business Logic & Pipelines
# ---------------------------------------------------------------------------------

def syllabify_sentence(sentence: str) -> List[List[str]]:
    """
    Splits a sentence into words, then splits each word into syllables.
    """
    words = sentence.split()
    syllabified = []
    
    for word in words:
        # Pyphen inserts hyphens, we split by hyphen to get the syllable array
        # Fallback to the whole word if pyphen returns empty
        hyphenated = dic.inserted(word)
        if hyphenated:
            syllables = hyphenated.split('-')
            syllabified.append(syllables)
        else:
            syllabified.append([word])
            
    return syllabified

import json

async def generate_learning_material(raw_text: str) -> dict:
    """
    Calls Gemini API to process raw text and generate structured learning materials 
    (summaries, translations, flashcards).
    """
    current_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not current_api_key:
        raise Exception("Gemini API Key not found")
        
    genai.configure(api_key=current_api_key.strip())
    
    prompt = f"""
    You are an expert AI tutor. Take the following raw text and generate a structured JSON response.
    The response must contain the following keys exactly:
    - "document_title": A suitable title for the text.
    - "raw_text": The cleaned up version of the original raw text in English.
    - "raw_text_fil": The translation of the raw text in conversational Tagalog/Filipino.
    - "review_points": A list of strings, each being a short, easy-to-read summary sentence in English.
    - "review_points_fil": A list of strings, each being the Tagalog/Filipino translation of the review points.
    - "flashcards": A list of objects with "term" and "definition" keys in English, covering key concepts.
    - "flashcards_fil": A list of objects with "term" and "definition" keys in Tagalog/Filipino, covering key concepts.
    
    Ensure the translations are natural and accurate. Provide the response as pure JSON without Markdown formatting.
    
    Raw text:
    {raw_text}
    """
    response = await generate_content_with_fallback(prompt, json_mode=True)
    
    try:
        return json.loads(response.text)
    except Exception as e:
        print("JSON parse error:", e)
        return {
            "document_title": "Error extracting document",
            "raw_text": raw_text,
            "raw_text_fil": "Hindi ma-proseso ang dokumento",
            "review_points": ["Could not summarize"],
            "review_points_fil": ["Hindi ma-summarize"],
            "flashcards": [],
        }

async def generate_learning_material_from_file(file_content: bytes, mime_type: str) -> dict:
    """
    Calls Gemini API to process an uploaded file and generate structured learning materials.
    """
    current_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not current_api_key:
        raise Exception("Gemini API Key not found")
        
    genai.configure(api_key=current_api_key.strip())
    
    prompt = """
    You are an expert AI tutor. Take the following document/image and extract its text.
    Then generate a structured JSON response. The response must contain the following keys exactly:
    - "document_title": A suitable title for the text.
    - "raw_text": The cleaned up version of the original raw text in English.
    - "raw_text_fil": The translation of the raw text in conversational Tagalog/Filipino.
    - "review_points": A list of strings, each being a short, easy-to-read summary sentence in English.
    - "review_points_fil": A list of strings, each being the Tagalog/Filipino translation of the review points.
    - "flashcards": A list of objects with "term" and "definition" keys in English, covering key concepts.
    - "flashcards_fil": A list of objects with "term" and "definition" keys in Tagalog/Filipino, covering key concepts.
    
    Ensure the translations are natural and accurate. Provide the response as pure JSON without Markdown formatting.
    """
    contents = [
        {"mime_type": mime_type, "data": file_content},
        prompt
    ]
    response = await generate_content_with_fallback(contents, json_mode=True)
    
    try:
        return json.loads(response.text)
    except Exception as e:
        print("JSON parse error:", e)
        return {
            "document_title": "Error extracting document",
            "raw_text": "Could not parse document",
            "raw_text_fil": "Hindi ma-proseso ang dokumento",
            "review_points": ["Could not summarize"],
            "review_points_fil": ["Hindi ma-summarize"],
            "flashcards": [],
            "flashcards_fil": []
        }

# ---------------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    history: List[ChatMessage]
    available_materials: Optional[List[dict]] = None
    current_material: Optional[dict] = None

class ChatResponse(BaseModel):
    reply: str

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Handles conversational chatbot requests, routing history to Gemini 3.1 Flash Lite
    using the API key configured in backend/.env.
    """
    try:
        # Load API key dynamically
        current_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not current_api_key:
            raise HTTPException(status_code=500, detail="Gemini API Key not found in backend/.env")
        
        current_api_key = current_api_key.strip()
        genai.configure(api_key=current_api_key)
        
        # Configure model parameters and system prompt based on BelongED goals
        system_prompt = (
            "You are BelongED — a friendly, warm, and highly adaptive AI learning companion built into the BelongED mobile app. "
            "BelongED is an inclusive education app designed for every Filipino learner, especially Persons with Disabilities (PWDs) and those who learn differently.\n\n"
            "THE BELONGED APP MISSION:\n"
            "BelongED turns any textbook page, scanned document, or photo into personalized, accessible study materials — "
            "generating syllabified reading cards, bilingual flashcards (English & Filipino/Tagalog), active recall quizzes, and AI-powered study support. "
            "The goal is to make quality education accessible to every learner regardless of their disability or learning style.\n\n"
            "CURRENT PWD SUPPORT (based on existing app features):\n"
            "- Dyslexia: Color-coded syllable splitting breaks words into readable chunks. Adjustable fonts including OpenDyslexic and Atkinson Hyperlegible. "
            "Custom letter spacing and line height. Text-to-Speech with word-by-word highlighting. Multiple reading color themes.\n"
            "- ADHD: Immersive Focus Mode reading ruler that dims surrounding text for single-line focus. "
            "Bite-sized flashcard learning. Daily streak system and analytics for motivation. Active recall with mic and typing modes.\n"
            "- Autism Spectrum: Structured, consistent, and predictable UI layout. Calm, carefully chosen color themes (Cream, Dark, Sage, Pastel). "
            "Clear step-by-step study flow: Import → Review → Flashcards. No sudden changes or chaotic interfaces.\n"
            "- Low Vision: Scalable font sizes up to 32px. Full high-contrast dark mode. Complete Text-to-Speech audio playback of all study content.\n\n"
            "FILIPINO & MULTILINGUAL SUPPORT:\n"
            "- Respond in the language the student uses: English, Tagalog, Taglish, Bisaya/Cebuano, Ilocano, etc.\n"
            "- Use warm, encouraging Filipino expressions (e.g., 'Kaya mo yan!', 'Laban!', 'Padayon', 'Kaibigan'). Keep the tone like a supportive Kuya or Ate.\n\n"
            "YOUR RULES AS BELONGED:\n"
            "1. Always be patient, kind, and celebrate every small win as a big achievement.\n"
            "2. Keep explanations short, clear, and structured — use bullet points and short paragraphs.\n"
            "3. Offer to explain, summarize, quiz, or translate any topic the student is studying.\n"
            "4. When asked about the app, explain it accurately based on the mission and features above.\n"
            "5. Never call yourself 'AI Tutor' — you are BelongED."
        )

        # Dynamic injection of study context
        if request.available_materials:
            system_prompt += "\n\nUSER'S LIBRARY OF STUDY MATERIALS:\n"
            for idx, mat in enumerate(request.available_materials):
                title = mat.get("title") or mat.get("document_title") or "Untitled Document"
                mat_id = mat.get("id") or "N/A"
                summary = mat.get("summary_snippet") or "No description available."
                system_prompt += f"{idx+1}. Title: \"{title}\" (ID: {mat_id})\n"
                system_prompt += f"   Summary: {summary}\n"
            system_prompt += (
                "\nWhen the user asks what study cards, documents, or learning materials they have in their library, "
                "nicely list these titles and offer to help them study or summarize them."
            )

        if request.current_material:
            curr_title = request.current_material.get("document_title") or "Selected Document"
            curr_points = request.current_material.get("review_points") or []
            
            system_prompt += f"\n\nCURRENT ACTIVE STUDY MATERIAL (User is reading/viewing this right now):\n"
            system_prompt += f"Title: \"{curr_title}\"\n"
            
            if curr_points:
                system_prompt += "Summary Points from this material:\n"
                # Pull the full sentences from the summary points
                for p in curr_points[:5]:
                    sentence = p.get("full_sentence") if isinstance(p, dict) else str(p)
                    system_prompt += f"- {sentence}\n"
            
            system_prompt += (
                "\nIf the user asks questions or wants explanations/quizzes about this specific active material, "
                "use the summary points above to guide your responses. Help them learn these concepts in a simple and friendly way."
            )

        # Format the chat history for Gemini API
        contents = []
        for msg in request.history:
            contents.append({
                "role": msg.role,
                "parts": [{"text": msg.text}]
            })
            
        response = await generate_content_with_fallback(contents, system_instruction=system_prompt)
        
        reply = response.text if response.text else "I'm sorry, I couldn't generate a response."
        
        return ChatResponse(reply=reply)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/generate-review", response_model=ReviewMaterialResponse)
async def generate_review_material(request: OCRRequest):
    """
    Ingests messy OCR text, utilizes Gemini to generate a structured JSON payload
    with translations and flashcards, and syllabifies the points.
    """
    try:
        data = await generate_learning_material(request.raw_text)
        
        # Step 2: Process sentences through the Syllabification Engine
        review_points = []
        for sentence in data.get("review_points", []):
            syllables_array = syllabify_sentence(sentence)
            review_points.append(
                SummaryPoint(
                    full_sentence=sentence,
                    syllabified_words=syllables_array
                )
            )
            
        review_points_fil = []
        for sentence in data.get("review_points_fil", []):
            syllables_array = syllabify_sentence(sentence)
            review_points_fil.append(
                SummaryPoint(
                    full_sentence=sentence,
                    syllabified_words=syllables_array
                )
            )
            
        flashcards = [Flashcard(**fc) for fc in data.get("flashcards", [])]
        flashcards_fil = [Flashcard(**fc) for fc in data.get("flashcards_fil", [])]
            
        # Step 3: Return the exact JSON blueprint required by the frontend contract
        return ReviewMaterialResponse(
            document_title=data.get("document_title", "Document"),
            raw_text=data.get("raw_text", request.raw_text),
            raw_text_fil=data.get("raw_text_fil", "Translation unavailable"),
            review_points=review_points,
            review_points_fil=review_points_fil,
            flashcards=flashcards,
            flashcards_fil=flashcards_fil
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/generate-review-file", response_model=ReviewMaterialResponse)
async def generate_review_material_from_file(file: UploadFile = File(...)):
    """
    Ingests an uploaded file (image or document), utilizes Gemini to extract text and generate a structured JSON payload.
    """
    try:
        content = await file.read()
        mime_type = file.content_type or "image/jpeg"
        
        data = await generate_learning_material_from_file(content, mime_type)
        
        # Process sentences through the Syllabification Engine
        review_points = []
        for sentence in data.get("review_points", []):
            syllables_array = syllabify_sentence(sentence)
            review_points.append(SummaryPoint(full_sentence=sentence, syllabified_words=syllables_array))
            
        review_points_fil = []
        for sentence in data.get("review_points_fil", []):
            syllables_array = syllabify_sentence(sentence)
            review_points_fil.append(SummaryPoint(full_sentence=sentence, syllabified_words=syllables_array))
            
        flashcards = [Flashcard(**fc) for fc in data.get("flashcards", [])]
        flashcards_fil = [Flashcard(**fc) for fc in data.get("flashcards_fil", [])]
            
        return ReviewMaterialResponse(
            document_title=data.get("document_title", "Imported Document"),
            raw_text=data.get("raw_text", "No text extracted"),
            raw_text_fil=data.get("raw_text_fil", "Translation unavailable"),
            review_points=review_points,
            review_points_fil=review_points_fil,
            flashcards=flashcards,
            flashcards_fil=flashcards_fil
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TranscribeResponse(BaseModel):
    transcript: str

@app.post("/api/v1/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Accepts an audio file and uses Gemini's multimodal API to transcribe speech to text.
    This allows the Active Recall mic feature to check spoken answers.
    """
    try:
        current_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not current_api_key:
            raise HTTPException(status_code=500, detail="Gemini API Key not found")

        genai.configure(api_key=current_api_key.strip())

        content = await file.read()
        mime_type = file.content_type or "audio/m4a"

        prompt = (
            "This is an audio recording of a student speaking an answer to a flashcard. "
            "Please transcribe ONLY what was said, verbatim, in plain text. "
            "Do not add punctuation, labels, or any extra text. Just the spoken words."
        )

        contents = [{"mime_type": mime_type, "data": content}, prompt]
        response = await generate_content_with_fallback(contents)

        transcript = response.text.strip() if response.text else ""
        return TranscribeResponse(transcript=transcript)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ValidateAnswerRequest(BaseModel):
    spoken: str
    expected: str
    definition: str = ""

class ValidateAnswerResponse(BaseModel):
    is_correct: bool
    score: float
    feedback: str

def fuzzy_match(a: str, b: str) -> float:
    """
    Returns a similarity score between 0.0 and 1.0 comparing two strings.
    Uses a simple character-level Longest Common Subsequence ratio.
    """
    a = re.sub(r'[^a-z0-9\s]', '', a.lower().strip())
    b = re.sub(r'[^a-z0-9\s]', '', b.lower().strip())

    if not a or not b:
        return 0.0
    if a == b:
        return 1.0

    # Check if key words in expected appear in spoken
    expected_words = set(b.split())
    spoken_words = set(a.split())

    # Remove very short stop words from matching
    stop_words = {'a', 'an', 'the', 'is', 'it', 'in', 'of', 'and', 'or', 'to', 'for', 'on'}
    expected_key = expected_words - stop_words or expected_words
    spoken_key = spoken_words - stop_words or spoken_words

    matches = len(expected_key.intersection(spoken_key))
    score = matches / max(len(expected_key), 1)
    return score

@app.post("/api/v1/validate-answer", response_model=ValidateAnswerResponse)
async def validate_answer(request: ValidateAnswerRequest):
    """
    Compares a spoken/typed answer against the expected answer using fuzzy matching.
    Returns a score, whether the answer is correct, and an AI-generated explanation.
    """
    score = fuzzy_match(request.spoken, request.expected)
    is_correct = score >= 0.6  # 60% word overlap is considered correct

    feedback = ""
    try:
        current_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if current_api_key:
            genai.configure(api_key=current_api_key.strip())
            prompt = (
                f"A student is learning a concept in a quiz.\n"
                f"Target Concept: {request.expected}\n"
                f"Definition: {request.definition}\n"
                f"Student's Answer: {request.spoken}\n\n"
                f"The system determined the student's answer is {'Correct' if is_correct else 'Incorrect'} "
                f"(Similarity Score: {int(score * 100)}%).\n"
                f"In 1 to 2 short, encouraging sentences suitable for a neurodivergent learner, explain why their "
                f"answer was correct, close, or incorrect, and briefly reinforce the concept."
            )
            response = await generate_content_with_fallback(prompt)
            if response and response.text:
                feedback = response.text.strip()
    except Exception as e:
        print(f"Gemini API feedback generation failed: {e}")

    # Fallback feedback if AI fails
    if not feedback:
        if score >= 0.9:
            feedback = "Perfect answer! 🎉"
        elif score >= 0.6:
            feedback = f"Correct! Good job. ({int(score*100)}% match)"
        elif score >= 0.3:
            feedback = f"Almost! You got {int(score*100)}% of the key words."
        else:
            feedback = "Incorrect. The answer didn't match."

    return ValidateAnswerResponse(is_correct=is_correct, score=score, feedback=feedback)


# Run locally for testing:
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
