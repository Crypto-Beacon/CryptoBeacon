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

1.  **Environment Setup**:
    *   Navigate to the `backend` directory.
    *   Copy `.env.example` to `.env` and configure your variables (MongoDB URI, API keys, etc.).
    *   Ensure you have installed the backend dependencies: `pip install -r requirements.txt` (inside a virtual environment if preferred).

2.  **Run the Application**:
    *   **Backend**: Double-click or run `start_backend.bat` in the root directory.
    *   **Frontend**: Double-click or run `start_frontend.bat` in the root directory.


## Environment Variables

Check `backend/.env.example` for the required environment variables for the backend.
