from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pyphen
import asyncio
from typing import List
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load env variables from backend/.env
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path=dotenv_path)

app = FastAPI(title="Review Material Generator", description="API for OCR Text Processing and Syllabification")

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

# ---------------------------------------------------------------------------------
# Pydantic Models for Data Contracts
# ---------------------------------------------------------------------------------

class SummaryPoint(BaseModel):
    full_sentence: str
    syllabified_words: List[List[str]]

class ReviewMaterialResponse(BaseModel):
    document_title: str
    summary_points: List[SummaryPoint]

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

async def antigravity_summarize(text: str) -> List[str]:
    """
    Mock integration with Google Antigravity SDK to extract summary sentences.
    In production, this would call the SDK to process the unstructured text.
    """
    # Simulate network call to AI orchestrator
    await asyncio.sleep(0.5)
    
    # Mock summary extraction
    return [
        "This is the first summarized point from the text.",
        "Here is another important concept to learn."
    ]

# ---------------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    history: List[ChatMessage]

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
        
        # Configure model parameters
        model = genai.GenerativeModel(
            model_name="gemini-3.5-flash",
            system_instruction="You are a friendly, encouraging AI Study Companion and Tutor named 'AI Tutor'. Your user is Alex, a student who might have reading challenges like dyslexia or ADHD. Keep your responses structured, clear, and highly encouraging. Use simple analogies where possible, and avoid wall-of-text responses by using short paragraphs, bullet points, or bold headers. Keep answers brief and engaging."
        )
        
        # Format the chat history for Gemini API
        contents = []
        for msg in request.history:
            contents.append({
                "role": msg.role,
                "parts": [{"text": msg.text}]
            })
            
        # Run content generation in thread pool to prevent blocking event loop
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, 
            lambda: model.generate_content(contents)
        )
        
        reply = response.text if response.text else "I'm sorry, I couldn't generate a response."
        
        return ChatResponse(reply=reply)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/generate-review", response_model=ReviewMaterialResponse)
async def generate_review_material(request: OCRRequest):
    """
    Ingests messy OCR text, utilizes Antigravity to summarize it,
    and returns a syllabified structured JSON payload for the frontend.
    """
    try:
        # Step 1: Orchestrate AI summary extraction using Antigravity
        summary_sentences = await antigravity_summarize(request.raw_text)
        
        # Step 2: Process sentences through the Syllabification Engine
        summary_points = []
        for sentence in summary_sentences:
            syllables_array = syllabify_sentence(sentence)
            summary_points.append(
                SummaryPoint(
                    full_sentence=sentence,
                    syllabified_words=syllables_array
                )
            )
            
        # Step 3: Return the exact JSON blueprint required by the frontend contract
        return ReviewMaterialResponse(
            document_title="Extracted Document Title", # Could also be generated by Antigravity
            summary_points=summary_points
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run locally for testing:
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
