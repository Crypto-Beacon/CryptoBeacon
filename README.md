# CryptoBeacon

CryptoBeacon is a comprehensive cryptocurrency tracking and analysis application. It features a modern React frontend and a robust Python FastAPI backend, offering real-time market data, portfolio management, and AI-powered insights.

## Features

*   **Real-time Market Data**: Live prices and trends for top cryptocurrencies.
*   **Portfolio Management**: Track your crypto assets, view profit/loss, and manage your watchlist.
*   **AI Insights**: Get market predictions and news summaries powered by Prophet and Google Gemini.
*   **Secure Authentication**: User registration and login with JWT and email verification.
*   **Interactive Charts**: Visualizations for price history and future predictions.

## Tech Stack

*   **Frontend**: React, Vite, Tailwind CSS, Lucide React, Recharts
*   **Backend**: Python, FastAPI, Motor (MongoDB), Pydantic
*   **AI/ML**: Prophet, TensorFlow, XGBoost, Google Generative AI
*   **Database**: MongoDB

## Setup Instructions

### Prerequisites

*   [Node.js (v16+)](https://nodejs.org/)
*   [Python (v3.9+)](https://www.python.org/downloads/)
*   [MongoDB (running locally or cloud)](https://www.mongodb.com/try/download/community)

### Quick Start (Windows)

1.  **Backend**: Run `start_backend.bat` in the root directory.
2.  **Frontend**: Run `start_frontend.bat` in the root directory.

### Manual Setup

#### Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Set up environment variables:
    *   Copy `.env.example` to `.env`.
    *   Update values in `.env` (MongoDB URI, API keys, Secret Key).
5.  Start the server:
    ```bash
    python -m uvicorn app.main:app --reload
    ```
    The API will be available at `http://localhost:8000`.

#### Frontend

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Environment Variables

Check `backend/.env.example` for the required environment variables for the backend.
