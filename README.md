# ReflectAI Sanctuary — Private Journal & AI Reflection Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-3.6_Flash-8e24aa.svg)](https://ai.google.dev/)
[![Google Cloud Run](https://img.shields.io/badge/Google_Cloud-Cloud_Run-4285F4.svg)](https://cloud.google.com/run)
[![Cloud Firestore](https://img.shields.io/badge/Firebase-Cloud_Firestore-FFCA28.svg)](https://firebase.google.com/docs/firestore)

ReflectAI Sanctuary is a secure, distraction-free digital journal and guided mindfulness companion. Powered by **Gemini 3.6 Flash** and **Google Cloud Firestore**, it provides private cognitive reframing, empathetic conversational reflection, brainstorming, and structured summaries within an encrypted, user-owned sanctuary.

---

## Table of Contents
1. [About the Project](#about-the-project)
2. [Key Features](#key-features)
3. [Technologies Used](#technologies-used)
4. [Recommended License](#recommended-license)
5. [Local Development Guide](#local-development-guide)
6. [Cloud Run Deployment Guide](#cloud-run-deployment-guide)
7. [Secret Management (Google Cloud Secret Manager)](#secret-management-google-cloud-secret-manager)
8. [Database Security (Cloud Firestore)](#database-security-cloud-firestore)
9. [OAuth 2.0 Provider Setup](#oauth-20-provider-setup)
10. [Functional Stability & Verification Walkthrough](#functional-stability--verification-walkthrough)

---

## About the Project

ReflectAI Sanctuary was created to bridge modern cognitive journaling practices with private, conversational artificial intelligence. Unlike generic chat interfaces or unencrypted notes, ReflectAI provides:
- **Private, Zero-Knowledge Storage**: Every entry is stored under strictly isolated user documents in Cloud Firestore that only the authenticated user can access.
- **Calm, Mindful Aesthetics**: 7 human-centric color palettes, dark/light daylight modes, and a gentle cursor wave effect that fosters tranquility.
- **Multi-Turn Thought Exploration**: Continuous conversational trails allowing you to delve deeper into feelings or dilemmas with context-aware suggestion chips.
- **Production Isolation**: A robust dual-environment system that isolates developer simulation tools during testing, while locking the interface into a secure, verified portal in production.

---

## Key Features

- **4 Guided Reflection Archetypes**:
  - 🌿 **Deep Reflection**: Empathetic, introspective analysis and gentle cognitive reframing.
  - 💡 **Creative Brainstorm**: Expansive ideation, exploratory prompts, and innovative avenues.
  - 📝 **Structured Summary**: Concise bullet points, core takeaways, and actionable next steps.
  - 🧭 **Compassionate Guidance**: Practical strategies, grounding exercises, and thoughtful encouragement.
- **Multi-Turn Conversation Trails**:
  - Ask follow-up questions to any reflection without losing context.
  - Dynamic AI suggestion chips provide immediate starting points for deeper introspection.
  - Typing in the composer automatically clears chips to keep the workspace clean.
- **Aesthetic Sanctuary Themes**:
  - **Dark Themes**: Midnight Violet, Nordic Slate, Candlelight Amber, Sage Calm.
  - **Daylight Themes**: Warm Paper, Solar Daylight, Daylight Sage.
- **Mobile-First Responsive Design**:
  - Streamlined icon-only controls on mobile viewports for compact screen fit.
  - Expansive multi-column split layout on desktop with collapsible reflection history.
- **Flexible & Secure Authentication**:
  - **Google Sign-In** via Firebase Auth popup.
  - **LinkedIn Sign-In** via OpenID Connect.
  - **Meta / Facebook Login**.
  - **Email & Password** with 6-digit cryptographic verification codes dispatched via email.
  - **One-Click Test Sandbox Account** for instant development and evaluation.
- **High-Availability AI Fallback Ladder**:
  - Automated retry ladder: `gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`.

---

## Technologies Used

### Frontend
| Technology | Purpose |
| :--- | :--- |
| **React 19** | Core component rendering and modern React hook primitives. |
| **TypeScript 5.8** | Full-stack end-to-end type safety and interface definitions. |
| **Vite 6** | Ultra-fast local development server and optimized build tooling. |
| **Tailwind CSS v4** | Next-generation CSS styling using custom theme properties and fluid utility classes. |
| **Motion (Framer Motion 12)** | Physics-based animations for cards, drawers, and status indicators. |
| **Lucide React** | Consistent, lightweight SVG icon system. |
| **HTML5 Canvas API** | Lightweight mathematical cursor ripple wave background visualizer. |

### Backend & AI
| Technology | Purpose |
| :--- | :--- |
| **Node.js 20+ & Express** | Full-stack reverse proxy ensuring API keys are never leaked to client bundles. |
| **@google/genai TypeScript SDK** | Official Google GenAI SDK interfacing with Gemini 3.6 Flash models. |
| **Nodemailer** | Secure SMTP email dispatch engine for 6-digit verification codes. |
| **esbuild** | High-speed server bundler compiling TypeScript into a single self-contained `dist/server.cjs`. |

### Cloud & Database
| Technology | Purpose |
| :--- | :--- |
| **Google Cloud Run** | Serverless container runtime hosting both frontend and backend on port `3000`. |
| **Google Cloud Secret Manager** | Hardware-grade key storage for `GEMINI_API_KEY` and mail credentials. |
| **Firebase Authentication** | Identity management supporting Federated OAuth (Google, LinkedIn, Facebook). |
| **Cloud Firestore** | Real-time NoSQL document database with owner-enforced security rules. |
| **Google Cloud Build** | Automated container image compilation directly from project source. |

---

## Recommended License

For this application, the **MIT License** is strongly recommended.

### Why the MIT License?
1. **Developer-Friendly & Permissive**: Anyone can run, fork, modify, commercialize, or integrate the application with minimal legal friction.
2. **Standard for Modern Web Apps**: Recognized globally by open-source communities, corporate engineering teams, and cloud platforms.
3. **Comprehensive Liability Protection**: Contains an explicit disclaimer stating that the software is provided "AS IS", shielding the author from liability or warranty claims.
4. **Simple & Understandable**: Fits in a single short page without complicated patent clauses or restrictive copyleft requirements (like GPL).

The repository includes the full MIT license in the [LICENSE](./LICENSE) file.

---

## Local Development Guide

Follow these steps to run ReflectAI Sanctuary on your local workstation:

### 1. Prerequisites
- **Node.js**: v20.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v10.0.0 or higher (packaged with Node.js)
- **Git**: Installed and configured

### 2. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/reflectai-sanctuary.git
cd reflectai-sanctuary
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create your local `.env` configuration file from the template:
```bash
cp .env.example .env
```

Open `.env` and fill in your keys:
```env
# Required for Gemini AI reflection generation
GEMINI_API_KEY="AIzaSy..."

# Environment Mode: 'test' enables developer tools; 'production' locks to live mode
APP_ENV="test"

# Optional: Email dispatch configuration for 6-digit confirmation codes
# If not configured, verification codes are logged directly to the server console
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-app-password"
SMTP_FROM="ReflectAI Sanctuary <no-reply@reflectai.io>"

# Firebase Client Configuration (From Firebase Console)
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef"
```

### 5. Start the Development Server
```bash
npm run dev
```

Visit **`http://localhost:3000`** in your browser. The application is immediately available.

### 6. Verification Commands
```bash
# Type check with TypeScript compiler
npm run lint

# Build production bundle and bundle server with esbuild
npm run build

# Run production build locally
npm run start
```

---

## Cloud Run Deployment Guide

Deploying directly to Google Cloud Run gives you a fully managed, auto-scaling, HTTPS-secured instance.

### Step 1: Install & Initialize Google Cloud CLI
```bash
# Log in to Google Cloud
gcloud auth login

# Set your active Google Cloud project
gcloud config set project YOUR_PROJECT_ID
```

### Step 2: Enable Required Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com
```

### Step 3: Grant Required IAM Roles to the Compute Service Account
Google Cloud Build uses the default Compute Engine service account for builds from source. Run this block once to grant the required permissions:

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUM=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SA="${PROJECT_NUM}-compute@developer.gserviceaccount.com"

# Grant storage access (to read source code tarball)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/storage.admin"

# Grant Artifact Registry writer (to store built images)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/artifactregistry.writer"

# Grant Cloud Build builder role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/cloudbuild.builds.builder"

# Grant Logging log writer (to stream build logs)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/logging.logWriter"

# Grant Secret Manager accessor (to read GEMINI_API_KEY)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/secretmanager.secretAccessor"
```

*(Alternatively, run the included helper script: `./setup-iam.sh`)*

### Step 4: Deploy to Cloud Run
Run this single command from your project root. Google Cloud Build will automatically containerize the application and deploy it to Cloud Run:

```bash
gcloud run deploy reflectai \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars APP_ENV=production,NODE_ENV=production \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

> **Why `--allow-unauthenticated` is standard for public web apps:**
> In Google Cloud Run, `--allow-unauthenticated` controls **Cloud Run IAM ingress** (network layer), allowing public web browsers to reach the website over HTTPS. 
> - **With `--allow-unauthenticated`**: Normal visitors can access the login page and authenticate using Firebase (Google/LinkedIn/Facebook/Email). All data is protected by Firestore Security Rules and server-side secret isolation.
> - **With `--no-allow-unauthenticated`**: Cloud Run blocks all public web traffic. Only callers possessing Google Cloud IAM credentials or Google Cloud Identity-Aware Proxy (IAP) can reach the container. (Use this option only if building an internal enterprise tool restricted to corporate employees).

### Step 4: (Optional) Injecting Firebase Configuration at Runtime
You can pass your Firebase project keys directly via Cloud Run environment variables without rebuilding the container:

```bash
gcloud run services update reflectai \
  --region asia-south1 \
  --update-env-vars FIREBASE_API_KEY=YOUR_FIREBASE_WEB_API_KEY,FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
```

### Step 5: Add Campaign Challenge Label
```bash
gcloud run services update reflectai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-south1
```

---

## 7. Fast Re-deployment & Git Update Workflow

### How Cloud Run Preserves Your Secrets & Configuration
> **Important Concept**: In Google Cloud Run, your secrets (from Secret Manager) and environment variables are attached to the **Cloud Run Service Definition**. 
> When you deploy new code with `gcloud run deploy reflectai --source .`, Cloud Run **automatically preserves all previously configured secrets and environment variables**. You do **not** need to re-type them!

### Updating Code in Google Cloud Shell from GitHub
When you have pushed changes to GitHub and want to update Cloud Shell:

```bash
# 1. Navigate to your cloned repository directory in Cloud Shell
cd ~/reflectai   # (or your repo folder name)

# 2. Pull latest commits from GitHub
git pull origin main

# (Optional) If you have any conflicting local edits in Cloud Shell and want to force match GitHub:
# git fetch origin && git reset --hard origin/main
```

### One-Command Redeploy (Preserving All Secrets & Variables)
Once code is updated in Cloud Shell, run:

```bash
# Deploy new code (Cloud Run keeps all existing env vars & secrets automatically!)
gcloud run deploy reflectai \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated
```

Or make the included script executable and run it:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Secret Management (Google Cloud Secret Manager)

To adhere to enterprise security standards, never commit secrets to source control. Use Google Cloud Secret Manager:

### 1. Create the Secrets
```bash
# Create and populate GEMINI_API_KEY
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# (Optional) Create email service secret for SMTP or Resend
gcloud secrets create SMTP_PASS --replication-policy="automatic"
echo -n "YOUR_EMAIL_APP_PASSWORD" | gcloud secrets versions add SMTP_PASS --data-file=-
```

### 2. Grant Cloud Run Access to Secret Manager
Cloud Run executes under the Compute Engine default service account. Grant it permission to decrypt and read secrets:

```bash
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Database Security (Cloud Firestore)

Deploy the following owner-bound Firestore security rules to prevent any cross-user data exposure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Isolated user profiles
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Isolated reflections, interactions, and AI responses
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Explicit deny for all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy the rules via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## OAuth 2.0 Provider Setup

### 1. Google Sign-In
1. Open [Firebase Console](https://console.firebase.google.com) &rarr; **Authentication** &rarr; **Sign-in method**.
2. Enable **Google**, specify your project support email, and save.
3. Under **Authentication** &rarr; **Settings** &rarr; **Authorized domains**, add your Cloud Run domain (`your-service.run.app`).

### 2. LinkedIn Sign-In
1. Go to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) and create an application.
2. In the **Products** tab, request **Sign In with LinkedIn using OpenID Connect**.
3. In Firebase Console &rarr; **Authentication** &rarr; **Sign-in method** &rarr; **LinkedIn**, copy the redirect URI:
   `https://<project-id>.firebaseapp.com/__/auth/handler`
4. In LinkedIn App Settings &rarr; **Auth** &rarr; **OAuth 2.0 settings**, add the redirect URI.
5. Copy your LinkedIn **Client ID** and **Client Secret** into Firebase.

### 3. Meta / Facebook Login
1. Open [Meta for Developers](https://developers.facebook.com/apps) and create an app.
2. Add the **Facebook Login for Web** product.
3. In Firebase Console &rarr; **Facebook**, copy the OAuth redirect URL and paste it under **Valid OAuth Redirect URIs** in Meta Console.
4. Copy your **App ID** and **App Secret** into Firebase.

---

## Functional Stability & Verification Walkthrough

The following step-by-step test matrix verifies every critical user interaction:

| Test Case | Step-by-Step Actions | Expected Result |
| :--- | :--- | :--- |
| **1. Mobile Responsive UI** | Open the app in a mobile viewport (<640px). | The header shows compact icons (`🧪`/`🚀`, `Sun`/`Moon`, Palette dot) without horizontal overflow or text wrapping. |
| **2. Production Environment Locking** | Deploy with `APP_ENV=production` or click the `🚀` mode button. | The test sandbox card is removed, the `🧪`/`🚀` switcher is hidden, and the **SSL Encrypted** badge is displayed. |
| **3. Email Sign-Up & 6-Digit Code** | Enter email/password on Sign Up and click **Verify & Create Account**. | Transitions to 6-digit code entry; upon typing the 6 digits, account activates and navigates into the dashboard. |
| **4. AI Reflection & Follow-Up Chips** | Submit a reflection prompt in the composer. | AI streams a thoughtful response; 3 intelligent follow-up suggestions appear. Typing in composer clears suggestions. |
| **5. Permanent Reflection Deletion** | Click the trash icon on a past reflection in the sidebar and confirm deletion. | The entry is removed from Firestore and disappears with a smooth exit animation. |
| **6. Secret Key Isolation** | Inspect browser network requests to `/api/config` or client source. | The `GEMINI_API_KEY` is completely absent from browser bundles; API calls proxy securely through `/api/converse`. |

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.
