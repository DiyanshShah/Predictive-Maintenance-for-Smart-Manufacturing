# Deployment Guide

This guide provides step-by-step instructions for deploying the Predictive Maintenance application to production. The frontend is deployed to [Netlify](https://www.netlify.com/) and the backend is deployed to [Render](https://render.com/).

## Prerequisites

Before you begin, make sure you have the following:

- A [GitHub](https://github.com/) account.
- [Node.js](https://nodejs.org/en/) (v14 or later) installed on your local machine.
- [Python](https://www.python.org/) (v3.8 or later) installed on your local machine.
- [Git](https://git-scm.com/) installed on your local machine.

## Backend Deployment (Render)

We will deploy the FastAPI backend as a Web Service on Render.

### Step 1: Fork and Clone the Repository

1.  **Fork the repository** to your own GitHub account.
2.  **Clone your forked repository** to your local machine:
    ```bash
    git clone https://github.com/YOUR_USERNAME/predictive-maintenance.git
    cd predictive-maintenance
    ```

### Step 2: Create a New Web Service on Render

1.  Go to the [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
2.  Choose **Build and deploy from a Git repository** and connect your GitHub account if you haven't already.
3.  Select your forked repository (`predictive-maintenance`).
4.  Fill in the service details:
    -   **Name**: `predictive-maintenance-api` (or any name you prefer).
    -   **Region**: Choose a region close to you.
    -   **Branch**: `main` (or your default branch).
    -   **Root Directory**: `backend` (This is important, as it tells Render to look in the `backend` directory).
    -   **Runtime**: `Python 3`.
    -   **Build Command**: `pip install -r requirements.txt`.
    -   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

### Step 3: Add Environment Variables

1.  Scroll down to the **Environment** section.
2.  Add the following environment variables:
    -   **`SECRET_KEY`**: A long, random string for signing JWTs. You can generate one with `openssl rand -hex 32` in your terminal.
    -   **`DATABASE_URL`**: The connection string for your database. If you are using a Render PostgreSQL database, you can create one and Render will provide the connection string. For example: `postgresql://user:password@host:port/dbname`.

### Step 4: Deploy

1.  Click **Create Web Service**.
2.  Render will start building and deploying your backend. You can monitor the progress in the logs.
3.  Once the deployment is complete, your API will be available at the URL provided by Render (e.g., `https://predictive-maintenance-api.onrender.com`). Copy this URL for the next section.

## Frontend Deployment (Netlify)

We will deploy the React frontend as a static site on Netlify.

### Step 1: Create a New Site on Netlify

1.  Go to your [Netlify dashboard](https://app.netlify.com/) and click **Add new site** > **Import an existing project**.
2.  Connect to your Git provider (GitHub) and select your forked repository.

### Step 2: Configure Build Settings

1.  Netlify will automatically detect that you have a React project.
2.  Verify the following build settings:
    -   **Base directory**: Not set (leave blank).
    -   **Build command**: `npm run build`.
    -   **Publish directory**: `build`.

### Step 3: Add Environment Variables

1.  Before deploying, go to **Site settings** > **Build & deploy** > **Environment**.
2.  Add the following environment variable:
    -   **`REACT_APP_API_URL`**: The URL of your deployed backend on Render (e.g., `https://predictive-maintenance-api.onrender.com/api`). Make sure to add `/api` at the end of the URL.

### Step 4: Deploy

1.  Go back to the deploys section and trigger a new deploy, or push a small change to your repository to trigger a new build.
2.  Netlify will build and deploy your frontend.
3.  Once the deployment is complete, you can access your live site at the URL provided by Netlify.

---

You have now successfully deployed the Predictive Maintenance application!
