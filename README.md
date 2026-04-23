# TutorFlow

TutorFlow is an all-in-one platform designed specifically for independent tutors and small coaching centers. It streamlines the day-to-day administrative burdens so that educators can focus on what matters most: teaching.

## 🚀 Problem Statement

Independent tutors and small coaching centers often struggle with the administrative overhead of managing their classes. From tracking student attendance to managing fee collections and generating receipts, they typically rely on manual ledgers or scattered spreadsheets. This manual approach leads to errors, delayed payments, and significant wasted time. Furthermore, planning lessons and organizing curriculums can be a tedious and time-consuming process.

**TutorFlow** solves this by providing a centralized platform to seamlessly manage students, track fees, generate reports, and even assist in lesson planning using AI.

## ✨ Features

- **Dashboard**: Get a quick overview of your coaching center's performance, revenue, and upcoming batches.
- **Batch Management**: Easily organize students into different batches based on subjects, grades, or timings.
- **Fee Tracking**: Keep track of paid and pending fees. Generate professional fee receipts instantly.
- **Reporting**: Export detailed Excel reports to monitor financial health and student enrollment.
- **Smart Lesson Copilot**: Leverage AI (powered by Gemini) to generate comprehensive lesson plans, interactive slides, and diagrams based on the curriculum, class, and desired teaching style.

## 🛠️ Tech Stack

### Frontend
- **React (Vite)**: Fast, modern UI development.
- **Tailwind CSS**: Beautiful, responsive styling.
- **React Router**: Seamless client-side navigation.
- **PPTXGenJS / JSPDF**: Dynamic exports for presentations and PDF receipts.

### Backend
- **FastAPI**: High-performance Python backend.
- **MongoDB (Motor)**: Flexible NoSQL database for structured storage.
- **JWT Authentication**: Secure user login and data protection.
- **Gemini API**: AI-powered lesson generation.

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- MongoDB instance (local or Atlas)
- Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Fee manage"
   ```

2. **Backend Setup**
   ```bash
   cd server
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On Linux/Mac:
   # source .venv/bin/activate
   
   pip install -r requirements.txt
   
   # Setup environment variables
   cp .env.example .env
   # Edit .env with your MongoDB URL and Gemini API Key
   
   # Run the server
   uvicorn app.main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   
   # Run the development server
   npm run dev
   ```

## 📄 License
This project is licensed under the MIT License.
