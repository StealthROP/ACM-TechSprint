# ACM-TechSprint - ALOA

## BelongED - Different Minds. Equal Opportunities. Learning Beyond Differences.

### Accenture Project Case: AI-Powered Study Companion for Filipino Learners

## Members:

Christian Joshua Dela Cruz

Mike Angelo Salamat

Lucky Bulaqueña

Jonie Aguihap

---

## AI Tools and Usage

Antigravity: Used for code generation and correction.

Gemini: Used for code generation and idea clarification.

ChatGPT: Used for editorial assistance to improve clarity, flow, and grammar.

## What we will develop?

We are creating an AI-powered inclusive learning assistant designed to bridge the gap between traditional education systems and the diverse ways students learn. The platform provides personalized academic support for students with different learning needs, including those with dyslexia, autism, ADHD, and other learning differences, while still being beneficial for every learner. By combining artificial intelligence, accessibility tools, gamification, and adaptive learning, the system transforms educational content into a more understandable, engaging, and personalized experience. Instead of forcing students to adapt to a single learning method, our platform adapts to the student by adjusting reading formats, learning pace, communication style, and study environment based on their individual needs.

We are building a learning ecosystem where every student has the opportunity to succeed regardless of their learning style, location, language, dialect, or access to technology. The platform is designed to support communities with limited internet connectivity through offline learning capabilities and local network sharing while providing multilingual support for learners across the Philippines. Through AI tutoring, accessibility profiles, progress tracking, behavioral learning assessments, and interactive features, our goal is to create an inclusive educational environment where differences are recognized, supported, and transformed into strengths. **We believe that learning should have no barriers — every mind deserves the opportunity to learn, grow, and thrive.**

## What we developed in the Day 1 checkpoint?

Today, we made significant progress in developing our **AI Learning Companion prototype** by successfully implementing several core learning and accessibility features that support a more personalized and inclusive study experience. The current prototype now includes a **Scan or Import Textbook feature**, allowing users to bring their learning materials into the system for easier access and processing. We also developed the **Study Cards Library** and **Flashcard system** to help students organize their notes, review important concepts, and strengthen their memory through interactive studying. The **Progress Bar feature** was added to track learning activities and provide students with a visual representation of their progress and achievements. Additionally, we integrated **Text-to-Speech functionality** to support auditory learning and improve accessibility for students who benefit from listening while studying. The application now includes customizable **UI/UX settings** and working system settings, allowing users to personalize their learning environment based on their preferences. Lastly, we implemented an interactive **Text Highlighter feature** that improves focus and reading comprehension by allowing important information to be emphasized. These completed features establish the foundation of our AI Learning Companion by combining accessibility, personalization, and modern learning tools to create a more effective educational experience for all types of learners.

---

# BelongED: System Setup & Installation Guide

This guide provides step-by-step instructions to set up and run BelongED, an AI-powered inclusive learning companion, on your local machine.

There are two ways to set up BelongED:

Install the APK – Download and install the provided .apk file from this repository.

Run the project locally – Set up and run the project on your own machine. This option requires a more advanced configuration process.

## Method 1: Install the .apk

You can find here [] and install the .apk the hash is [].

## Method 2: Run the project locally

**Pre-requisites**

Before starting, make sure you have the following installed:

- Node.js (v18.x or v20.x recommended)

- Python (v3.9 or higher)

- npm (comes with Node.js)

- Expo Go app (install on your mobile device from the App Store or Google Play Store for testing)


## 1. Backend Setup (FastAPI)

The backend handles:

- OCR for documents and images
- Text processing (including syllable splitting)
- Audio transcription
- AI-powered conversational tutor using Gemini

### Step 1: Navigate to backend folder

`cd backend`

### Step 2: Create a virtual environment (recommended)

**Windows (PowerShell):**

`python -m venv venv`

`.\venv\Scripts\Activate.ps1`

**macOS / Linux:**

`python3 -m venv venv`

`source venv/bin/activate`

### Step 3: Install dependencies

`pip install -r requirements.txt`

### Step 4: Configure environment variables

Create a .env file inside the backend/ directory:

Windows (PowerShell):

`New-Item .env`

macOS / Linux / Git Bash:

`touch .env`

Add your Gemini API key:

`GEMINI_API_KEY=your_google_gemini_api_key_here`

### Step 5: Run the backend server

`python main.py`

The backend will run at:

👉 http://localhost:8000

API documentation is available at:

👉 http://localhost:8000/docs

## 2. Frontend Setup (React Native + Expo)

The frontend is built with React Native and Expo, providing a mobile-first and accessible interface.

### Step 1: Navigate to frontend folder

`cd ../frontend`

### Step 2: Install dependencies

`npm install`

### Step 3: Start the Expo server

`npm run start`

This will open the Expo developer tools and generate a QR code.

### Step 4: Run the app

You can run the app in multiple ways:

📱 Physical device (recommended):

- Scan the QR code using the Expo Go app (Android) or Camera app (iOS)

🌐 Web browser:

- Press w in the terminal

🤖 Android emulator:

- Press a (requires Android Studio setup)

🍎 iOS simulator (macOS only):

- Press i (requires Xcode)

## 3. Connecting Frontend & Backend

When using a physical device, localhost will not work. You must expose your backend to your device.

### Option A: Local Tunneling (Recommended)

Use localtunnel:

`npx localtunnel --port 8000`

You will receive a public URL like:

`https://curly-worms-walk.loca.lt`

Update the app:

1. Open BelongED app

2. Go to Settings (gear icon)

3. Scroll to Backend API Settings

4. Paste the tunnel URL

5. Click Save

### Option B: Local Network (Same Wi-Fi)

If your phone and computer are on the same Wi-Fi network:

1. Find your computer’s local IP address (e.g., 192.168.1.50)

2. Set the API URL in the app to:

`http://192.168.1.50:8000`

## ✅ Done!

Once both frontend and backend are running and connected, BelongED is ready to use.
