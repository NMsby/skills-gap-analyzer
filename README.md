# 🔍 AI-Powered Skills Gap Analyzer

> 📍 Built at the "AI: The Future of Work" Hackathon by Impact Africa Network  
> 🧠 Powered by Mistral AI | 🌍 Focused on Africa | ⏱️ Built in under 18 hours

---

## 🚀 Project Summary

**The AI-Powered Skills Gap Analyzer** is a real-time, web-based platform that helps individuals and companies:
- Upload CVs/resumes
- Extract current skills
- Compare against real-time job market demands
- Identify missing skills
- Generate a personalized or team-based learning path

We use cutting-edge **Mistral AI** to power OCR, web job search, skill analysis, and reasoning. This solution addresses Kenya’s rising youth unemployment and helps employers bridge the talent gap in tech and business roles.

---

## 🧠 Core Features

### 👤 For Individuals
- Upload your CV (PDF/image)
- AI extracts your current skills
- Live scan of jobs in Kenya and globally
- Gap analysis vs market needs
- AI-generated learning roadmap (free/paid resources)

### 🏢 For Companies
- Upload multiple team CVs
- Analyze collective team skills
- Identify workforce gaps
- Get upskilling recommendations for teams
- Dashboard with charts, matrix, and exportable reports

---

## 💡 Why It Matters

Kenya and Africa face:
- Youth unemployment crisis
- Skills mismatch in fast-growing tech markets
- Companies unsure how to train staff

Our tool bridges this with real-time AI intelligence:
> "We’re building Africa’s real-time career co-pilot."

---

## ⚙️ Tech Stack

### Frontend
- HTML5 + Vanilla JavaScript + Tailwind CSS
- Chart.js for data visualization
- File upload with HTML5 API

### Backend
- Node.js + Express.js
- Multer for file handling
- Axios for API calls
- dotenv for secure API config

### Mistral AI Integration
- `mistral-ocr-2503`: Extract text from CVs
- `mistral-web-search`: Job market scanning
- `mistral-medium-2505`: Skills comparison + learning path
- `mistral-agents`: Reasoning and workflow orchestration

---

## 🧪 Demo Instructions

### 1. Clone and Install
```bash
git clone https://github.com/your-repo/skills-gap-analyzer.git
cd skills-gap-analyzer
npm install
skills-gap-analyzer/
├── server.js
├── .env
├── package.json
├── public/
│   ├── index.html         # Employee dashboard
│   ├── company.html       # Company dashboard (optional)
│   ├── script.js          # Handles UI logic
│   ├── styles.css         # Tailwind styles
│   └── uploads/           # Temporary file storage
├── src/
│   ├── mistral-client.js
│   ├── cv-parser.js
│   ├── job-scraper.js
│   ├── skills-analyzer.js
│   ├── company-analyzer.js
│   └── utils.js
├── demo-data/
│   ├── sample-cvs/
│   └── sample-jobs.json

