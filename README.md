# FinQuest - Student Financial Management App

A full-stack web application that helps students manage personal finances with gamified goals, bank transaction insights, AI-driven recommendations, and interactive "what-if" simulations.

## Features

- **Account Management**: User registration/login with Firebase Authentication
- **Bank Integration**: Secure Plaid sandbox integration for transaction history
- **Goal Management**: Create and track financial goals with progress visualization
- **AI Recommendations**: Gemini API-powered insights and saving strategies
- **What-if Simulations**: Interactive scenarios to test spending changes
- **Gamification**: Garden-themed progress tracking with animations
- **Dynamic Visualizations**: Real-time charts and spending analytics

## Tech Stack

- **Frontend**: React + Tailwind CSS + Firebase Hosting
- **Backend**: FastAPI (Python) + Gemini API + Plaid SDK + Firestore
- **AI & Visualization**: LangChain + Gemini API + Plotly
- **Cloud**: Google Cloud Run + Firebase + Cloud Build

## Project Structure

```
FinQuest/
├── frontend/          # React application
├── backend/           # FastAPI application
├── docker/            # Docker configurations
├── docs/              # Documentation
└── deployment/        # Cloud deployment configs
```

## Quick Start

1. Clone the repository
2. Set up environment variables (see docs/setup.md)
3. Install dependencies: `npm install` (frontend) and `pip install -r requirements.txt` (backend)
4. Run development servers: `npm start` (frontend) and `uvicorn main:app --reload` (backend)

## Deployment

See `docs/deployment.md` for detailed deployment instructions to Google Cloud Run and Firebase.

## License

MIT License
