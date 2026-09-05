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
2. [Application Features](#application-features)
3. [Enhanced Features Built in Sanctuary](#enhanced-features-built-in-sanctuary)
4. [Technologies Used](#technologies-used)
5. [Required Environment Keys & Secrets](#required-environment-keys--secrets)
6. [Local Development Guide (Run Locally)](#local-development-guide-run-locally)
7. [Google Cloud Run Deployment Guide](#google-cloud-run-deployment-guide)
8. [Fast Re-deployment & Git Update Workflow](#fast-re-deployment--git-update-workflow)
9. [Secret Management (Google Cloud Secret Manager)](#secret-management-google-cloud-secret-manager)
10. [Database Security (Cloud Firestore)](#database-security-cloud-firestore)
11. [OAuth 2.0 Provider Setup](#oauth-20-provider-setup)
12. [Recommended License](#recommended-license)
13. [Functional Stability & Verification Walkthrough](#functional-stability--verification-walkthrough)

---

## About the Project

ReflectAI Sanctuary was created to bridge modern cognitive journaling practices with private, conversational artificial intelligence. Unlike generic chat interfaces or unencrypted notes, ReflectAI provides:
- **Private, Zero-Knowledge Storage**: Every entry is stored under strictly isolated user documents in Cloud Firestore that only the authenticated user can access.
- **Calm, Mindful Aesthetics**: 7 human-centric color palettes, dark/light daylight modes, and a gentle cursor wave effect that fosters tranquility.
- **Multi-Turn Thought Exploration**: Continuous conversational trails allowing you to delve deeper into feelings or dilemmas with context-aware suggestion chips.
- **Production Isolation**: A robust dual-environment system that isolates developer simulation tools during testing, while locking the interface into a secure, verified portal in production.
- **Horizontal-Scroll-Free Fluid Responsive Interface**: Fully responsive, mobile-first design with strict horizontal overflow prevention (`overflow-x-hidden`) across all viewports and mobile screens.

---

## Application Features

- **4 Guided Reflection Modes (Auto-Scaling & Responsive)**:
  - 💡 **Brainstorm**: Creative ideas, angles, and exploratory possibilities.
  - 🌿 **Reflection**: Empathetic, introspective analysis, and mindful cognitive reframing.
  - 📝 **Summary**: Distill core essence, concise bullet points, and actionable main takeaways.
  - 🧭 **Advice**: Practical strategies, grounding exercises, compassionate guidance, and clear next steps.
  - *Dynamic Viewport Scaling*: On wide/desktop screens ($\ge 500\text{px}$ container), full text labels display seamlessly; on mobile devices or smaller window sizes ($< 500\text{px}$), tabs dynamically collapse into clean icon-only buttons with rich floating tooltips and ARIA accessibility labels without any awkward wrapping or header collision.
- **Resonant Multi-Turn Thought Exploration & Follow-Up Chips**:
  - Ask follow-up questions to any reflection without losing context.
  - Meaningful, empathetic follow-up chips phrased in the user's authentic first-person voice (e.g., *"How can I set clearer boundaries around my workload and deadlines?"*, *"What small step can I take today to ease this heavy pressure?"*) guide organic conversation.
  - Tactile micro-interactions with amber status indicators, keyboard accessibility, and auto-dismiss upon typing in the composer.
- **Polite Verification Gate**:
  - Unverified email users can freely log in and explore their sanctuary, while politely prompted to verify their account before initiating new AI reflections.
- **Aesthetic Sanctuary Themes**:
  - **Dark Themes**: Midnight Violet, Nordic Slate, Candlelight Amber, Sage Calm.
  - **Daylight Themes**: Warm Paper, Solar Daylight, Daylight Sage.
- **Mobile-First Responsive Design**:
  - Adaptive Mobile View Switcher: Seamlessly toggles between **Reflect & Dialogue** and **History** on compact mobile viewports, maximizing vertical workspace.
  - Consolidated 4-bit mobile header: Single-button enhancements menu (`Wand2`), compact user avatar with status badge, modal trigger, and quick theme toggle.
  - Zero horizontal scrolling across any viewport size, from ultra-compact smartphones (320px+) to 4K ultra-wide monitors.
- **Flexible & Secure Authentication**:
  - **Google Sign-In** via Firebase Auth popup.
  - **LinkedIn Sign-In** via OpenID Connect.
  - **Twitter / X Sign-In** via Firebase Auth popup.
  - **Email & Password** with native Firebase Email Verification links dispatched via Google's infrastructure.
  - **One-Click Test Sandbox Account** for instant development and evaluation.
- **High-Availability AI Fallback Ladder**:
  - Automated retry ladder: `gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`.

---

## Enhanced Features Built in Sanctuary

The sanctuary incorporates specialized, purpose-built mindfulness and introspection capabilities:

1. **Echoes of Mind (Emotional Resonance Map)**:
   - Interactive visual canvas rendering reflections as nodes in mental topology.
   - Categorizes thoughts into 6 emotional mood orbits: *Calm, Clarity, Gratitude, Courage, Growth, and Reflective*.
   - Dynamic resonance links connect emotionally aligned thoughts across time with interactive mood distributions and node inspection drawers.

2. **Sanctuary Voice Mode (5 Natural Soothing Voices & 432Hz Ambient Synthesizer)**:
   - Built-in browser speech recognition transcribing reflections directly into the reflection composer with live status indicators.
   - **5 Natural, Relaxing Voice Profiles** with Indian origin and Sanskrit/Vedic mythological naming, crafted for soothing human-like cadence:
     - 🌸 **Ananya** (Sanskrit: *"Unique & Serene Presence"* — Soft, warm and tranquil melodic cadence for peaceful emotional clarity)
     - ✨ **Tara** (Sanskrit & Vedic: *"Guiding Star of Compassion"* — British English soft cadence for unhurried breathing & restorative presence)
     - 🌊 **Mira** (Sanskrit: *"Ocean of Grace & Mindful Devotion"* — Bright, mindful and uplifting intonation for gratitude and self-compassion)
     - 🌲 **Bodhi** (Sanskrit: *"Awakening, Deep Insight & Stillness"* — Classic British English baritone with measured cadence for centered reflection)
     - 🌌 **Varun** (Vedic Mythology: *"Lord of Cosmic Waters & Deep Peace"* — Deep, warm and resonant bass for evening decompression)
   - **Multi-Harmonic 432Hz Ambient Synthesizer**: Real-time Web Audio API sine-wave generator with gentle low-pass smoothing; includes an interactive **"Listen to 432Hz"** live preview button with animated soundwaves in Settings.

3. **Password-Secured PDF Archive & Download History Tracking**:
   - Download an archival PDF containing all reflections, tags, emotional orbits, and conversational follow-ups.
   - **Document-Level Password Encryption**: Users set an encryption password upon export; files are secured with 128-bit native PDF encryption so only the user can open them.
   - **Privacy-Preserving Formatting**: Omits internal security labels to avoid disclosing security architectures.
   - **Two-Factor Authorization**: Exporting requires confirming the account password and verifying with a 6-digit authenticator code when 2FA is active.
   - **Download History & Password Reveal**: Expandable record list in Settings showing file name, date downloaded, reflection count, and an eye-mask button to view the file password at any time. Stored securely under the user's isolated Firestore `exports` collection.

4. **Two-Factor Authentication (TOTP) with Step-Up Reconfiguration Verification**:
   - Integrates RFC 6238 TOTP compatible with Google Authenticator, 1Password, Authy, and Microsoft Authenticator.
   - **Reconfiguration & Removal Guard**: To reconfigure the QR code or disable 2FA, the user MUST enter their active 6-digit authenticator code first. Prevents session hijackers from altering MFA settings.

5. **Serenity Time Capsule**:
   - Vault mechanism allowing users to seal thoughts for future reflection over designated time horizons: 7 days, 30 days, 90 days, or 365 days.
   - Unsealing protocol powered by Gemini 3.6 Flash that synthesizes personal growth, celebrating emergent strengths and emotional milestones.

6. **Location-Aware Sanctuary Journey**:
   - Anchors reflections in physical space using Google Maps Platform (`@vis.gl/react-google-maps`).
   - Pin device GPS coordinates or pick curated meditative sanctuaries (Kyoto Bamboo Grove, Big Sur Coastline, Lake Louise) using the amber-accented Map Pin action.
   - Filter and explore reflections geographically on an interactive map.

7. **Account Settings, Theme Engine & Data Sovereignty**:
   - 7 handcrafted color schemes (Midnight Violet, Nordic Slate, Candlelight Amber, Sage Calm, Warm Paper, Solar Daylight, Daylight Sage) with an elevated z-index dropdown that never clips behind content.
   - Customize display name, mindful avatar, speech rate, pitch, default voice profile, and test the 432Hz ambient drone.
   - "About Sanctuary", "Privacy Policy", and "Terms of Service" accessible directly from the home screen for non-logged-in visitors as well as logged-in members.
   - Full GDPR-compliant account deletion workflow with complete Firestore interaction and export log wipes.

8. **Canvas Cursor Wave Effect**:
   - Interactive background mathematical fluid ripple tracking cursor and touch movements without layout shifts or horizontal overflow.

---

## Technologies Used

### Frontend
| Technology | Purpose |
| :--- | :--- |
| **React 19** | Core component rendering and modern React hook primitives. |
| **TypeScript 5.8** | Full-stack end-to-end type safety and interface definitions. |
| **Vite 6** | Ultra-fast local development server and optimized build tooling. |
| **Tailwind CSS v4** | Modern styling using fluid utility classes, CSS variables, and zero-overflow containers. |
| **Motion (Framer Motion 12)** | Physics-based animations for cards, drawers, and status indicators. |
| **Lucide React** | Consistent, lightweight SVG icon system. |
| **HTML5 Canvas API** | Lightweight mathematical cursor ripple wave background visualizer. |
| **@vis.gl/react-google-maps** | Interactive map rendering for location-tagged sanctuaries. |

### Backend & AI
| Technology | Purpose |
| :--- | :--- |
| **Node.js 20+ & Express** | Full-stack reverse proxy ensuring API keys are never leaked to client bundles. |
| **@google/genai TypeScript SDK** | Official Google GenAI SDK interfacing with Gemini 3.6 Flash models. |
| **Firebase Auth & Nodemailer** | Secure authentication and notification dispatch engine. |
| **esbuild** | High-speed server bundler compiling TypeScript into a single self-contained `dist/server.cjs`. |

### Cloud & Database
| Technology | Purpose |
| :--- | :--- |
| **Google Cloud Run** | Serverless container runtime hosting both frontend and backend on port `3000`. |
| **Google Cloud Secret Manager** | Hardware-grade key storage for `GEMINI_API_KEY` and mail credentials. |
| **Firebase Authentication** | Identity management supporting Federated OAuth (Google, LinkedIn, Twitter/X). |
| **Cloud Firestore** | Real-time NoSQL document database with owner-enforced security rules. |
| **Google Cloud Build** | Automated container image compilation directly from project source. |

---

## Required Environment Keys & Secrets

To run the application locally or deploy it to Google Cloud Run, the following keys are used:

### Summary of Keys

| Key Name | Location | Required / Optional | Purpose |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-Side / Secret Manager | **Required** | Access to Gemini 3.6 Flash for cognitive reflection, time capsule synthesis, and follow-ups. |
| `APP_ENV` | Server-Side / Cloud Run Env | **Required** | Sets environment: `'test'` (enables developer tools & sandbox) or `'production'` (locks to live mode). |
| `VITE_FIREBASE_API_KEY` | Client-Side / `.env` | **Required** | Firebase Web API key for authentication and Firestore access. |
| `VITE_FIREBASE_PROJECT_ID` | Client-Side / `.env` | **Required** | Firebase project ID. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client-Side / `.env` | **Required** | Firebase Authentication domain (`<project-id>.firebaseapp.com`). |
| `VITE_FIREBASE_STORAGE_BUCKET` | Client-Side / `.env` | Optional | Firebase Storage bucket for avatars/attachments. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Client-Side / `.env` | Optional | Firebase cloud messaging sender ID. |
| `VITE_FIREBASE_APP_ID` | Client-Side / `.env` | Optional | Firebase web application identifier. |
| `VITE_GOOGLE_MAPS_API_KEY` | Client-Side / `.env` | Optional | Google Maps Platform API key for interactive sanctuary maps (falls back gracefully if omitted). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Server-Side / `.env` | Optional | SMTP credentials for automated email dispatch. |
| `RESEND_API_KEY` | Server-Side / `.env` | Optional | Alternative email delivery service API key. |

---

## Local Development Guide (Run Locally)

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

# Optional: SMTP email dispatch configuration for system notifications
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

# Google Maps Platform (Optional)
VITE_GOOGLE_MAPS_API_KEY=""
```

### 5. Start the Development Server
```bash
npm run dev
```

Visit **`http://localhost:3000`** in your browser. The application boots with `tsx server.ts` hosting the Express backend and mounting Vite in middleware mode.

> **💡 Instant Local Testing (Without Firebase Credentials):**
> If you are evaluating the app locally before setting up your own Firebase project, keep `APP_ENV="test"`. The app provides a **One-Click Test Sandbox Account** directly on the landing page, allowing you to immediately explore all UI features, test the 5 soothing voices, try the 432Hz ambient synthesizer, and generate reflections using your `GEMINI_API_KEY`.

### 6. Verify Backend & API Health
To check that the server is operational and Gemini API connectivity is active:
```bash
# Health check endpoint
curl http://localhost:3000/api/health
# Response: {"status":"ok","hasGeminiKey":true,"timestamp":"..."}

# Configuration status (sanitized metadata)
curl http://localhost:3000/api/config
```

### 7. Build and Run Production Locally
Before deploying, you can test the production build on your local machine:
```bash
# 1. Type check with TypeScript compiler
npm run lint

# 2. Build production client bundle with Vite and bundle server.ts with esbuild into dist/server.cjs
npm run build

# 3. Launch the compiled, self-contained CommonJS production server
npm run start
```
Open `http://localhost:3000` to verify the compiled production build.

---

## Google Cloud Run Deployment Guide

Deploying directly to Google Cloud Run gives you a fully managed, auto-scaling, HTTPS-secured instance on Google Cloud infrastructure.

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
Run this single command from your project root. Google Cloud Build will automatically containerize the application, compile the client and server assets, and deploy it to Cloud Run:

```bash
gcloud run deploy reflectai \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars APP_ENV=production,NODE_ENV=production \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300s
```

> **⚠️ Critical Requirement — Port 3000 (`--port 3000`):**
> Google Cloud Run defaults to expecting the container to listen on port `8080` unless told otherwise. ReflectAI Sanctuary's Express server is configured to bind to port `3000` (`app.listen(3000, "0.0.0.0")`). Specifying `--port 3000` informs Cloud Run's ingress proxy to route inbound HTTPS traffic directly to port 3000, ensuring container health probes succeed without timing out.
>
> **Why `--allow-unauthenticated` is standard for public web apps:**
> In Google Cloud Run, `--allow-unauthenticated` controls **Cloud Run IAM ingress** (network layer), allowing public web browsers to reach the website over HTTPS. 
> - **With `--allow-unauthenticated`**: Normal visitors can access the login page and authenticate using Firebase (Google/LinkedIn/Twitter/Email). All data is protected by Firestore Security Rules and server-side secret isolation.
> - **With `--no-allow-unauthenticated`**: Cloud Run blocks all public web traffic. Only callers possessing Google Cloud IAM credentials or Google Cloud Identity-Aware Proxy (IAP) can reach the container.

### Step 5: Authorize Cloud Run Domain in Firebase (Mandatory for Auth)
Once Cloud Run completes deployment, copy your service URL (e.g. `https://reflectai-952579076488.asia-south1.run.app`):
1. Open [Firebase Console](https://console.firebase.google.com/) &rarr; select your project.
2. Navigate to **Authentication** &rarr; **Settings** tab &rarr; **Authorized domains**.
3. Click **Add domain**, enter your Cloud Run host domain (e.g., `reflectai-952579076488.asia-south1.run.app`), and click **Add**.
4. *(Omitting this step causes Firebase OAuth popup providers to fail with an `auth/unauthorized-domain` error).*

### Step 6: Inject Firebase Configuration at Runtime (No Rebuild Required)
ReflectAI Sanctuary includes a dynamic client bootstrap service (`/api/firebase-config.js`) that injects Firebase credentials from Cloud Run environment variables directly at runtime. You can attach your Firebase project keys at any time without rebuilding the container:

```bash
gcloud run services update reflectai \
  --region asia-south1 \
  --update-env-vars FIREBASE_API_KEY="YOUR_FIREBASE_WEB_API_KEY",FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID",FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
```

### Step 7: Add Campaign Challenge Label (Optional)
```bash
gcloud run services update reflectai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-south1
```

---

## Fast Re-deployment & Git Update Workflow

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

# (Optional) Create email service secret for SMTP
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

    // Isolated reflections, interactions, time capsules, and AI responses
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

### 3. Twitter / X Sign-In Setup

Twitter (X) OAuth can be configured seamlessly using Firebase Authentication:

1. Log in to the [X Developer Portal](https://developer.x.com/en/portal/dashboard) (ensure your X account has a verified email and phone number).
2. Create a Project / App (or select your existing App under Projects & Apps).
3. Under **User authentication settings**, click **Set up**:
   - **App permissions**: Select **Read**.
   - **Type of App**: Select **Web App, Automated App or Bot**.
   - **Callback URI / Redirect URL**:
     ```text
     https://<project-id>.firebaseapp.com/__/auth/handler
     ```
   - **Website URL**: Enter your deployed Cloud Run URL (`https://reflectai-952579076488.asia-south1.run.app`).
   - Click **Save**.
4. In your App settings, navigate to the **Keys and tokens** tab:
   - Under **Consumer Keys**, copy (or regenerate) the **API Key** and **API Secret**.
5. Open [Firebase Console &rarr; Authentication &rarr; Sign-in method](https://console.firebase.google.com/):
   - Under **Additional providers**, click **Twitter**.
   - Toggle **Enable**.
   - Paste the **API Key** and **API Secret** from the X Developer Portal.
   - Click **Save**.

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

## Functional Stability & Verification Walkthrough

The following step-by-step test matrix verifies every critical user interaction across all sanctuary features:

| Test Case | Step-by-Step Actions | Expected Result |
| :--- | :--- | :--- |
| **1. Mobile Responsive UI (No Horizontal Scroll)** | Open the app in any mobile viewport (320px to 640px). Scroll in all directions. | Viewport remains strictly fixed with zero horizontal scrolling. Header displays compact 4-bit elements with a consolidated enhancements menu (`Wand2`), avatar, settings, and theme toggles. |
| **2. Production Environment Locking** | Deploy with `APP_ENV=production` or click the `🚀` mode button. | The test sandbox card is removed, the `🧪`/`🚀` switcher is hidden, and the **SSL Encrypted** badge is displayed. |
| **3. Email Sign-Up & Verification Link** | Enter email/password on Sign Up and click **Create Sanctuary Account**. | Account registers in Firebase; Google Firebase dispatches a verification link to your inbox; sanctuary dashboard shows the verification banner until verified. |
| **4. Polite Email Verification Gate** | With an unverified email account, try submitting a reflection in the composer or clicking a suggestion chip. | A polite modal dialog appears explaining that email verification is required to converse with the AI, with buttons to resend the link or confirm verification. |
| **5. AI Reflection & Resonant Follow-Up Chips** | Submit a reflection prompt in the composer. | AI returns an empathetic response with emotional mood categorization; 3 deeply resonant, first-person follow-up questions appear (e.g. "How can I set clearer boundaries?"). Typing in the composer immediately clears the suggestions. |
| **6. Sanctuary Voice Mode (Speech-to-Text)** | Click the microphone icon in the composer, speak a reflection, and click stop. | Browser SpeechRecognition transcribes your words directly into the reflection textarea in real-time. Any microphone permission errors auto-dismiss or dismiss on click without horizontal overflow. |
| **7. Sanctuary Audio Narration & 432Hz Synthesizer** | Click the audio play button on any AI reflection response bubble. In Settings &rarr; Voice, click **Listen to 432Hz**. | Peaceful speech synthesis reads the reflection aloud accompanied by an audible multi-harmonic 432Hz sine-wave ambient healing drone with live soundwave animations. |
| **8. Serenity Time Capsule** | In the composer or header, click **Capsule**, choose 7/30/90/365 days, and seal the active reflection. | The reflection is locked into the Time Capsule Vault. Clicking **Unseal** triggers Gemini 3.6 Flash to analyze personal growth, celebrating emergent strengths. |
| **9. Echoes of Mind (Resonance Map)** | Click **Echoes** in the top navigation or mobile menu. | Interactive visual canvas renders reflections as emotional nodes (Calm, Clarity, Gratitude, Courage, Growth, Reflective) with connecting resonance links and mood statistics. |
| **10. Location-Aware Sanctuary Journey** | Click **Sanctuaries** in header or the amber **Map Pin** in composer. Tag GPS coordinates or select a sanctuary preset (e.g. Kyoto Bamboo Grove, Big Sur). | Physical coordinates and landmark are pinned on the interactive Google Map and attached to the reflection. |
| **11. Account Settings & Profile Update** | Click the Settings icon in the header next to the avatar. Update display name, pick an avatar, adjust voice sliders, and save. | Profile changes reflect across the dashboard immediately and persist to user profile storage. Email address is permanently locked and uneditable. |
| **12. Account Deletion & Firestore Data Wipe** | In Settings &rarr; **Delete Account**, type `DELETE` and click **Permanently Delete My Sanctuary**. | All user interactions, time capsules, and profile documents are wiped clean from Cloud Firestore, and the session is signed out safely with a locked screen blocker during processing. |
| **13. Secret Key Isolation** | Inspect browser network requests to `/api/config` or client source. | The `GEMINI_API_KEY` is completely absent from browser bundles; all generative AI calls proxy securely through server-side `/api/gemini/*` endpoints. |
| **14. 5 Natural Indian Origin / Soothing Voice Profiles** | Open Settings &rarr; Voice & Audio. Click **Sample** on Ananya, Tara, Mira, Bodhi, and Varun. | Each voice plays a soothing, tranquil mindfulness quote with its authentic accent and warm, natural human tone. Selecting a voice sets it as default for all reflection narrations. |
| **15. 4 Reflection Modes Auto-Scaling** | Resize the browser window from wide (desktop/laptop) down to narrow (mobile/tablet). | On wide screens ($\ge 500\text{px}$ container), Brainstorm, Reflection, Summary, and Advice show full text labels. On narrow screens ($< 500\text{px}$), they automatically collapse into icon-only buttons with interactive tooltips without overlapping the title. |
| **16. Mobile View Switcher** | Open the app on a mobile device or narrow viewport ($< 768\text{px}$). Tap the view switcher at the top. | Smoothly toggles between the active reflection dialogue and past reflection history, maximizing vertical reading space. |
| **17. Password-Secured PDF Archive Export** | Open Settings &rarr; Security &rarr; Download PDF Archive. Enter document encryption password, account password, and 2FA code (if enabled), then click **Generate & Encrypt PDF**. | Encrypted PDF downloads locally with 128-bit AES encryption. Opening the PDF prompts the reader for the document password; without it, the document cannot be rendered. Internal security flags are omitted from document headers. |
| **18. Export Download History & Password Masking** | Open Settings &rarr; Security &rarr; expand **Download History**, or view it in the export dialog. | Displays past download events with timestamp, file name, reflection count, and masked password (`••••••••`). Clicking the eye-mask toggle unmasks the password for copy/retrieval. |
| **19. 2FA Step-Up Reconfiguration & Removal Guard** | Enable 2FA. Then in Settings &rarr; Security, click **Reconfigure QR Code** or **Disable 2FA**. | A step-up challenge dialog opens prompting for the current 6-digit authenticator code. Entering an invalid code rejects the action. Only entering a valid 6-digit TOTP token permits reconfiguring the QR secret or disabling 2FA. |
| **20. Public About & Legal Modals from Home Screen** | Sign out. On the landing page, click **About** or **Terms & Privacy** in either the header or the footer. | The About Sanctuary dialog (with FAQs) or the Legal Notice dialog (with Privacy Policy & Terms tabs) opens smoothly for non-logged-in visitors. Modal can be dismissed or navigated without requiring an account. |
| **21. Theme Selector Stacking & Elevated Dropdown** | On Dashboard or Landing Page, click the palette icon to open theme options. | Dropdown displays above all nearby cards, headings, and input areas without clipping behind any underlying elements. |

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.
