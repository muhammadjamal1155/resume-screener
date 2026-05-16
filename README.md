# AI Recruitment Intelligence System

A full-stack, AI-powered Applicant Tracking System (ATS) and resume screener that helps recruiters automate candidate ranking. Using advanced Natural Language Processing (NLP) and Machine Learning, the system evaluates resumes against a given job description and required skills, delivering a weighted match score based on semantic similarity, skill overlap, and an ML-based probability predictor.

## 🌟 Key Features

- 📄 **Multi-Format Resume Parsing:** Supports uploading and parsing PDF and DOCX files.
- 🧠 **Smart Text Embeddings:** Uses `sentence-transformers` (`all-MiniLM-L6-v2`) for rich semantic analysis to compute the distance between the job description and candidate profiles.
- 🎯 **Targeted Skill Matching:** Compares user-defined required skills against the extracted resume content to generate a skill match score.
- 📈 **Machine Learning Predictor:** Evaluates candidates using a trained classification model (Logistic Regression via `scikit-learn`).
- 📊 **Unified Ranking Equation:** Ranks candidates by aggregating three critical metrics:
  ```text
  Final Score = (Semantic Score * 0.4) + (Skill Match Score * 0.2) + (ML Probability * 0.4)
  ```
- 🖥️ **Modern Frontend Interface:** Built with React, Vite, components from `shadcn/ui`, and Tailwind CSS for a sleek and responsive user experience.
- ⚡ **High-Performance Backend:** Powered by Python and FastAPI.

## 🛠️ Technology Stack

**Backend (Python)**
- **Framework:** FastAPI, Uvicorn (ASGI server)
- **Data & ML:** Pandas, NumPy, scikit-learn, joblib
- **NLP:** Sentence-Transformers (`all-MiniLM-L6-v2`)
- **Document Parsing:** PyMuPDF, pdfplumber, python-docx

**Frontend (JavaScript)**
- **Framework:** React, Vite
- **Styling:** Tailwind CSS, PostCSS
- **UI Components:** shadcn/ui (Radix UI primitives)

## 📂 Project Structure

```
.
├── api/             # FastAPI routers, endpoints, and Pydantic schemas
├── database/        # Database configuration and connection scripts
├── frontend/        # React + Vite frontend application
├── models/          # ML pipelines, model training scripts, and serialized models (.pkl)
├── services/        # Core business logic (NLP, embeddings, ranking, PDF parsing)
├── uploads/         # Temporary storage directory for uploaded resumes
├── app.py / main.py # FastAPI application entry points
└── requirements.txt # Python dependencies
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.9+**
- **Node.js** (v16+)
- **npm** or **yarn**

### 1. Backend Setup

1. Open a terminal in the root of the project directory.
2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```
3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will be running at `http://localhost:8000`. You can access the interactive API docs at `http://localhost:8000/docs`.*

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the necessary Node packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will typically be accessible at `http://localhost:5173`.*

## 🤝 Usage

1. Open the frontend web URL in your browser.
2. Enter the Job Description in the provided text area.
3. List the required technical or soft skills.
4. Upload one or multiple resumes (.pdf or .docx).
5. Click **Evaluate Candidates**. The system will parse the documents, run them through the NLP and ML pipelines, and display a ranked leaderboard of the mostly highly qualified applicants.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
