# 🎤 CYPHER AI — The Street-Smart English Conversational & CEFR Assessment Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?style=flat&logo=Vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat&logo=Python&logoColor=white)](https://www.python.org)
[![Groq](https://img.shields.io/badge/LLM-Llama_3.3_70B-f55036.svg?style=flat)](https://groq.com)
[![Whisper](https://img.shields.io/badge/STT-Whisper_Large_v3-00A67E.svg?style=flat)](https://openai.com/research/whisper)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> *"Spit your English. Own the room. Get graded."*

**CYPHER** is an interactive, full-stack AI platform designed to help English learners practice realistic, high-stakes conversational scenarios (tech interviews, behavioral questions, university defenses, salary negotiations, everyday street banter) with natural voice dialogue, speech-to-text, and Cambridge/CEFR-aligned proficiency grading.

---

## 🌟 Key Features

1. **Realistic Scenarios & Dynamic Personas:**
   - **Software Engineer Job Interview**: Lead Engineering Manager Sarah Chen tests system design, past projects, and STAR method answers.
   - **Behavioral & HR Interview**: David Miller probes teamwork, conflicts, and motivations.
   - **University Seminar & Thesis Defense**: Prof. Julian Vance engages in scholarly academic dialogue.
   - **College Office & Campus Life**: Friendly international student advisory.
   - **Coffee Shop & Casual Small Talk**: Street-smart, idiom-rich everyday English.
   - **Salary & Offer Negotiation**: Managing Director Arthur Sterling tests diplomatic persuasion.

2. **Multimodal Interaction (Speak or Write):**
   - **Voice In (Speech-to-Text)**: In-browser recording transcribed via Whisper-large-v3 cloud accuracy.
   - **Voice Out (Text-to-Speech)**: Microsoft Edge-TTS neural voices (US Male, US Female, British Male, British Female) for crystal-clear human cadence.
   - **Adaptive Difficulty Levels**: Choose between **Beginner**, **Intermediate**, and **Advanced** for tailored vocabulary and question depth.

3. **Official CEFR Assessment & Feedback Engine:**
   - Evaluates **CEFR Level** (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`).
   - Generates an **Overall Score (0-100)** and Executive Summary.
   - Scores 4 Core Pillars:
     - **Grammar & Accuracy**
     - **Vocabulary Range & Sophistication**
     - **Fluency & Coherence**
     - **Task & Scenario Completion**
   - **Mistakes Breakdown & Upgrades**: Compares *"What you said"* vs *"Better, native way to phrase it"*.
   - **Actionable Drills**: 3 targeted exercises for your next session.

4. **User Auth & Practice Dashboard:**
   - Secure account registration & login with password hashing.
   - Private personal panel tracking completed practice rooms, scores, and historical CEFR reports.

5. **100% Free & Zero-Hardware Overhead:**
   - Runs open-source models (**Llama 3.3 70B / Llama 3.1 8B**, **Whisper**, **Edge-TTS**).
   - Compatible with free **Groq Cloud API** or a **Google Colab Free T4 GPU** notebook (`colab/cypher_colab_backend.ipynb`).

---

## 🏗️ Architecture

```
Cypher/
├── backend/
│   ├── config.py                 # App settings & environment loader
│   ├── main.py                   # FastAPI application & API endpoints
│   ├── scenarios.py              # Catalog of roleplay scenarios & system prompts
│   ├── services/
│   │   ├── ai_service.py         # LLM connector (Groq / Colab fallback)
│   │   ├── audio_service.py      # Edge-TTS neural speech & Whisper STT
│   │   ├── assessment_service.py # CEFR evaluation engine & JSON parser
│   │   └── auth_service.py       # Authentication & practice history SQLite store
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # The Cypher Booth, Stage, & Assessment Dashboard
│   │   ├── index.css             # Obsidian dark theme, soundwaves, neon accents
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── colab/
│   └── cypher_colab_backend.ipynb # Free T4 GPU notebook with Cloudflare Tunnel
├── start_all.bat                 # One-click Windows launcher
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/drewcanflyy/Cypher.git
cd Cypher
```

### 2. Setup Backend
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```
*(Add your free Groq API key in `.env` if desired, or configure it directly in the frontend UI settings)*.

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Or Launch Everything in One Click (Windows):
Double-click `start_all.bat` or run:
```powershell
.\start_all.bat
```

Open your browser at **`http://localhost:5173`**.

---

## ⚙️ AI Engine Options

1. **Option A: Free Groq Cloud (Recommended — Ultra Fast):**
   - Grab a free key in 30 seconds at [console.groq.com](https://console.groq.com).
   - Paste it in `backend/.env` as `GROQ_API_KEY=...` or in the in-app **Settings** modal.
   - Powered by **Llama-3.3-70B-Versatile** & **Whisper-large-v3**.

2. **Option B: Google Colab Free T4 GPU:**
   - Open `colab/cypher_colab_backend.ipynb` in Google Colab.
   - Run all cells with T4 GPU enabled.
   - Copy the public `https://....trycloudflare.com` URL into CYPHER's Settings modal.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
