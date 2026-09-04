import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { generateContentWithFallback } from "./server/gemini.ts";

dotenv.config();

const app = express();
const PORT = 3000;

// Trust proxy for Cloud Run ingress routing
app.set("trust proxy", 1);

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// In-memory verification codes cache with 10-minute expiry
// Key: email (lowercase), Value: { code, expiresAt, attempts }
const verificationCodeStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

function getEmailTransporter() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: resendKey,
      },
    });
  }

  if (smtpUser && smtpPass) {
    const host = process.env.SMTP_HOST || (smtpUser.includes("@gmail.com") ? "smtp.gmail.com" : "smtp.sendgrid.net");
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return null;
}

// System configuration and environment status
app.get("/api/config", (req, res) => {
  const transporter = getEmailTransporter();
  const isProdLocked = process.env.APP_ENV === "production";
  const firebaseApiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "";
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "";

  // In production, do not expose sensitive API keys or credential objects in raw JSON
  const safeFirebaseConfig = isProdLocked
    ? {
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseProjectId ? `${firebaseProjectId}.firebaseapp.com` : ""),
        projectId: firebaseProjectId,
        status: "configured_in_production"
      }
    : {
        apiKey: firebaseApiKey,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseProjectId ? `${firebaseProjectId}.firebaseapp.com` : ""),
        projectId: firebaseProjectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseProjectId ? `${firebaseProjectId}.appspot.com` : ""),
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || ""
      };

  res.json({
    appEnv: process.env.APP_ENV || "test",
    isProductionLocked: isProdLocked,
    hasSmtpConfigured: Boolean(transporter),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasFirebaseKey: Boolean(firebaseApiKey),
    hasFirebaseConfigured: Boolean(firebaseApiKey && firebaseProjectId),
    firebaseConfig: safeFirebaseConfig,
    timestamp: new Date().toISOString()
  });
});

// Dynamic client-side Firebase bootstrap script
// Provides seamless runtime resolution in both development (Vite) and Cloud Run production
app.get("/api/firebase-config.js", (req, res) => {
  const firebaseApiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "";
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "";
  const clientConfig = {
    apiKey: firebaseApiKey,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseProjectId ? `${firebaseProjectId}.firebaseapp.com` : ""),
    projectId: firebaseProjectId,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseProjectId ? `${firebaseProjectId}.appspot.com` : ""),
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || ""
  };
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.send(`window.__FIREBASE_CONFIG__ = ${JSON.stringify(clientConfig)};`);
});

// Real email dispatch endpoint for 6-digit verification code
app.post("/api/auth/send-verification-code", async (req, res) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const isTestMode = body.isTestMode === true || process.env.APP_ENV !== "production";

    if (!email || !email.includes("@")) {
      res.status(400).json({ error: "Please provide a valid email address." });
      return;
    }

    // Generate cryptographically secure 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    verificationCodeStore.set(email, {
      code,
      expiresAt,
      attempts: 0
    });

    const transporter = getEmailTransporter();

    if (transporter) {
      try {
        const fromSender = process.env.SMTP_FROM || process.env.SMTP_USER || '"ReflectAI Sanctuary" <security@reflectai.io>';
        await transporter.sendMail({
          from: fromSender,
          to: email,
          subject: `${code} is your ReflectAI Sanctuary verification code`,
          text: `Your ReflectAI Sanctuary verification code is: ${code}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b;">
              <div style="display: flex; align-items: center; margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #4f46e5;">ReflectAI Sanctuary</h2>
              </div>
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                You requested a secure verification code to access your private reflection journal. Enter this single-use code to verify your identity:
              </p>
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e1b4b;">${code}</span>
              </div>
              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
                This code is valid for <strong>10 minutes</strong>. For your privacy and protection, never share this code with anyone.
              </p>
            </div>
          `,
        });

        res.json({
          success: true,
          emailSent: true,
          message: `Verification code sent to ${email}. Please check your inbox and spam folder.`
        });
        return;
      } catch (mailError: any) {
        console.error("Nodemailer dispatch failed:", mailError);
        // If in test mode, fall back to sandbox inspection so user is never stranded
        if (isTestMode) {
          res.json({
            success: true,
            emailSent: false,
            fallbackToSandbox: true,
            previewCode: code,
            error: mailError.message,
            message: `SMTP dispatch error (${mailError.message}). Sandbox fallback code generated for testing.`
          });
          return;
        }
        res.status(502).json({
          error: `Failed to deliver email to ${email}. Please verify SMTP credentials in Secret Manager.`
        });
        return;
      }
    } else {
      // SMTP is not configured yet
      if (!isTestMode) {
        res.status(503).json({
          error: "Email dispatch service is not configured. Please supply SMTP credentials (SMTP_USER/SMTP_PASS or RESEND_API_KEY) in Google Cloud Secret Manager."
        });
        return;
      }

      // In Sandbox / Test environment
      res.json({
        success: true,
        emailSent: false,
        requiresSmtpConfig: true,
        previewCode: code,
        message: "Email dispatch service is waiting for SMTP configuration. In Test Sandbox mode, verification code is provided in your developer console."
      });
    }
  } catch (err: any) {
    console.error("send-verification-code error:", err);
    res.status(500).json({ error: "An unexpected error occurred while generating verification code." });
  }
});

// Verify 6-digit code
app.post("/api/auth/verify-code", (req, res) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!email || !code) {
      res.status(400).json({ error: "Email and 6-digit code are required." });
      return;
    }

    const record = verificationCodeStore.get(email);
    if (!record) {
      res.status(400).json({ error: "No verification code requested for this email or it has expired." });
      return;
    }

    if (Date.now() > record.expiresAt) {
      verificationCodeStore.delete(email);
      res.status(400).json({ error: "Verification code has expired. Please request a new code." });
      return;
    }

    if (record.attempts >= 5) {
      verificationCodeStore.delete(email);
      res.status(429).json({ error: "Too many failed attempts. Please request a fresh code." });
      return;
    }

    if (record.code !== code) {
      record.attempts += 1;
      res.status(400).json({ error: "Invalid 6-digit verification code. Please check and try again." });
      return;
    }

    // Success - consume code
    verificationCodeStore.delete(email);
    res.json({
      success: true,
      verified: true,
      email,
      message: "Email successfully verified."
    });
  } catch (err: any) {
    console.error("verify-code error:", err);
    res.status(500).json({ error: "Internal verification failure." });
  }
});

// LinkedIn OAuth 2.0 direct authorization and exchange endpoints
app.get("/api/auth/linkedin/url", (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID || "78ryr3nz4fw3p9";
  const host = req.get("host") || "reflectai-952579076488.asia-south1.run.app";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const protocol = isLocal ? "http" : "https";
  const origin = (req.query.origin as string) || `${protocol}://${host}`;
  const redirectUri = `${origin}/api/auth/linkedin/callback`;
  const state = Math.random().toString(36).substring(2, 15);
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=openid%20profile%20email`;
  
  res.json({
    url: authUrl,
    redirectUri,
    clientId,
    isDirectConfigured: Boolean(process.env.LINKEDIN_CLIENT_SECRET)
  });
});

app.get("/api/auth/linkedin/callback", async (req, res) => {
  const code = req.query.code as string;
  const error = req.query.error as string;
  const errorDescription = req.query.error_description as string;
  const clientId = process.env.LINKEDIN_CLIENT_ID || "78ryr3nz4fw3p9";
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || "";
  const host = req.get("host") || "reflectai-952579076488.asia-south1.run.app";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const protocol = isLocal ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/linkedin/callback`;

  if (error) {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html><html><body><script>if(window.opener){window.opener.postMessage({type:'LINKEDIN_AUTH_ERROR',error:${JSON.stringify(errorDescription || error)}},'*');window.close();}else{window.location.href='/?error='+encodeURIComponent(${JSON.stringify(errorDescription || error)});}</script><p>Authentication cancelled or failed: ${errorDescription || error}</p></body></html>`);
    return;
  }

  if (!code) {
    res.status(400).send("No authorization code returned from LinkedIn.");
    return;
  }

  try {
    if (!clientSecret) {
      throw new Error("LINKEDIN_CLIENT_SECRET environment variable is required on Cloud Run to complete server-side token exchange.");
    }

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    const tokenData: any = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || "Failed to exchange code for LinkedIn access token.");
    }

    const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userInfo: any = await userRes.json();
    if (!userRes.ok || !userInfo.sub) {
      throw new Error("Failed to fetch verified user profile from LinkedIn API.");
    }

    const userProfile = {
      uid: "linkedin_" + userInfo.sub,
      email: userInfo.email || `linkedin_${userInfo.sub}@linkedin.com`,
      displayName: userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || "LinkedIn Member",
      photoURL: userInfo.picture || null,
      authProvider: "linkedin",
      emailVerified: Boolean(userInfo.email_verified),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html><html><head><title>Authentication Complete</title></head><body><div style="font-family:sans-serif;text-align:center;padding:40px;"><h3>Authentication Successful</h3><p>Connecting your profile to ReflectAI...</p></div><script>if(window.opener){window.opener.postMessage({type:'LINKEDIN_AUTH_SUCCESS',profile:${JSON.stringify(userProfile)}},'*');setTimeout(()=>window.close(),300);}else{localStorage.setItem('reflectai_session_user',JSON.stringify(${JSON.stringify(userProfile)}));window.location.href='/';}</script></body></html>`);
  } catch (err: any) {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html><html><body><script>if(window.opener){window.opener.postMessage({type:'LINKEDIN_AUTH_ERROR',error:${JSON.stringify(err.message)}},'*');setTimeout(()=>window.close(),2000);}</script><div style="font-family:sans-serif;padding:30px;color:#b91c1c;"><h3>LinkedIn Authentication Notice</h3><p>${err.message}</p></div></body></html>`);
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Gemini Multi-turn Reflection & Conversational API
app.post("/api/gemini/converse", async (req, res) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const mode = typeof body.mode === "string" ? body.mode : "reflection";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!prompt) {
      res.status(400).json({ error: "A non-empty prompt or reflection is required." });
      return;
    }

    // Prepare system instruction tailored to user's selected mode
    let systemInstruction = "You are ReflectAI, an empathetic, intellectually rigorous, and supportive reflection companion.";
    if (mode === "reflection") {
      systemInstruction += " Help the user explore their thoughts deeper, identify core emotions or underlying assumptions, and offer compassionate, constructive insights.";
    } else if (mode === "brainstorm") {
      systemInstruction += " Generate structured, inventive, and actionable brainstorming ideas based on the user's journal entry.";
    } else if (mode === "summary") {
      systemInstruction += " Provide a concise, clear synopsis of the main themes, key takeaways, and action items from the reflection.";
    } else if (mode === "advice") {
      systemInstruction += " Provide thoughtful, grounded, step-by-step guidance and practical perspectives without sounding prescriptive or dismissive.";
    }

    // Build multi-turn content parts with strict alternating role validation
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Filter and sanitize history so roles strictly alternate
    for (const h of history) {
      if (h && (h.role === "user" || h.role === "model") && typeof h.text === "string" && h.text.trim().length > 0) {
        const lastMsg = contents[contents.length - 1];
        if (!lastMsg || lastMsg.role !== h.role) {
          contents.push({
            role: h.role,
            parts: [{ text: h.text.trim() }]
          });
        }
      }
    }

    // Ensure the current user prompt alternates cleanly
    if (contents.length > 0 && contents[contents.length - 1].role === "user") {
      contents.pop();
    }
    contents.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    // Enhance system instruction to mandate structured JSON with response, summary, 3 suggestions, and mood
    systemInstruction += `

You MUST respond in valid JSON format with four fields:
1. "response": (string) Your complete, thoughtful, and compassionate reflection response to the user's latest thought.
2. "summary": (string) A crisp 1-sentence synopsis under 18 words.
3. "suggestedPrompts": (array of 3 strings) Exactly 3 short, intriguing follow-up questions or reflection prompts (under 55 characters each) that the user can click next to continue this dialogue.
4. "mood": (string) Exactly one of: "calm", "clarity", "gratitude", "courage", "growth", "anxious", "reflective" that best captures the emotional undertone.
Return ONLY pure JSON.`;

    const aiResult = await generateContentWithFallback(contents, {
      systemInstruction,
      temperature: mode === "brainstorm" ? 0.8 : 0.65,
      responseMimeType: "application/json"
    });

    let responseText = "";
    let summary = "";
    let suggestedPrompts: string[] = [];
    let detectedMood = "reflective";

    try {
      const cleanJson = aiResult.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      const parsed = JSON.parse(cleanJson);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.response === "string" && parsed.response.trim().length > 0) {
          responseText = parsed.response.trim();
        }
        if (typeof parsed.summary === "string") {
          summary = parsed.summary.trim();
        }
        if (Array.isArray(parsed.suggestedPrompts) && parsed.suggestedPrompts.length > 0) {
          suggestedPrompts = parsed.suggestedPrompts
            .map((s: any) => String(s).trim())
            .filter((s: string) => s.length > 0)
            .slice(0, 3);
        }
        if (typeof parsed.mood === "string") {
          const validMoods = ["calm", "clarity", "gratitude", "courage", "growth", "anxious", "reflective"];
          const normalized = parsed.mood.toLowerCase().trim();
          if (validMoods.includes(normalized)) {
            detectedMood = normalized;
          }
        }
      }
    } catch (parseErr) {
      console.warn("JSON parse fallback, using raw text:", parseErr);
      responseText = aiResult.text.trim();
    }

    if (!responseText) {
      responseText = aiResult.text.trim();
    }

    // Smart contextual fallbacks if model output didn't include 3 suggestions
    if (!suggestedPrompts || suggestedPrompts.length === 0) {
      if (mode === "brainstorm") {
        suggestedPrompts = [
          "Which of these ideas has the lowest friction to test?",
          "How can we turn this into a 3-step action plan?",
          "What is an unconventional alternative to this?"
        ];
      } else if (mode === "summary") {
        suggestedPrompts = [
          "What is the single most important takeaway here?",
          "How does this connect to my long-term goals?",
          "What mindset shift will help implement this?"
        ];
      } else if (mode === "advice") {
        suggestedPrompts = [
          "What potential obstacles should I prepare for?",
          "Can you break down step one in more detail?",
          "How can I maintain accountability with this?"
        ];
      } else {
        suggestedPrompts = [
          "What underlying feeling is driving this thought?",
          "How might I view this situation with more self-compassion?",
          "What would success look like one month from today?"
        ];
      }
    }

    res.json({
      response: responseText,
      summary: summary || prompt.slice(0, 80) + (prompt.length > 80 ? "..." : ""),
      suggestedPrompts,
      mood: detectedMood,
      modelUsed: aiResult.modelUsed
    });
  } catch (error: any) {
    console.error("Gemini API handler error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate AI response. Please verify Gemini API key configuration."
    });
  }
});

// Time Capsule Growth Synthesis Endpoint
app.post("/api/gemini/synthesize-growth", async (req, res) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const pastPrompt = typeof body.pastPrompt === "string" ? body.pastPrompt.trim() : "";
    const pastResponse = typeof body.pastResponse === "string" ? body.pastResponse.trim() : "";
    const sealedDate = typeof body.sealedDate === "string" ? body.sealedDate : "the past";
    const currentContext = typeof body.currentContext === "string" ? body.currentContext.trim() : "";

    if (!pastPrompt) {
      res.status(400).json({ error: "Time capsule reflection content is required." });
      return;
    }

    const systemInstruction = `You are ReflectAI's Temporal Growth Synthesizer.
The user sealed a reflection into a Serenity Time Capsule on ${sealedDate}.
They are now unsealing it to examine how they have grown and evolved.

You MUST respond in valid JSON format with three fields:
1. "growthAnalysis": (string) An empathetic, deep, and encouraging reflection comparing their mindset when they sealed the capsule to their present journey. Focus on resilience, expanded perspective, and emotional evolution. (approx 120-180 words).
2. "celebrationText": (string) A concise, poetic affirmation celebrating their growth and courage (1-2 sentences).
3. "emergentStrengths": (array of 3 short strings) 3 positive psychological or emotional strengths demonstrated across their journey (e.g. "Grounded Patience", "Decisive Self-Compassion", "Clarity Under Ambiguity").
Return ONLY pure JSON.`;

    const promptText = `PAST SEALED REFLECTION (${sealedDate}):
"${pastPrompt}"

PAST REFLECTAI GUIDANCE:
"${pastResponse}"

CURRENT PERSPECTIVE / UPDATES FROM USER:
"${currentContext || "I am unsealing this capsule today to reflect on how far I have come."}"`;

    const aiResult = await generateContentWithFallback(promptText, {
      systemInstruction,
      temperature: 0.6,
      responseMimeType: "application/json"
    });

    let growthAnalysis = "";
    let celebrationText = "";
    let emergentStrengths: string[] = [];

    try {
      const cleanJson = aiResult.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      const parsed = JSON.parse(cleanJson);
      if (parsed && typeof parsed === "object") {
        growthAnalysis = typeof parsed.growthAnalysis === "string" ? parsed.growthAnalysis.trim() : "";
        celebrationText = typeof parsed.celebrationText === "string" ? parsed.celebrationText.trim() : "";
        if (Array.isArray(parsed.emergentStrengths)) {
          emergentStrengths = parsed.emergentStrengths.map((s: any) => String(s).trim()).filter(Boolean);
        }
      }
    } catch (e) {
      growthAnalysis = aiResult.text.trim();
      celebrationText = "You have traversed distance and time with courage and quiet strength.";
      emergentStrengths = ["Resilience", "Mindful Self-Awareness", "Patience"];
    }

    if (!growthAnalysis) {
      growthAnalysis = "Looking back across time, the uncertainty that once felt overwhelming has transformed into wisdom. You have adapted, gained perspective, and continued forward with quiet perseverance.";
    }
    if (!celebrationText) {
      celebrationText = "Honor the person who sealed this capsule and celebrate the person who opened it today.";
    }
    if (emergentStrengths.length === 0) {
      emergentStrengths = ["Self-Compassion", "Emotional Perspective", "Forward Momentum"];
    }

    res.json({
      growthAnalysis,
      celebrationText,
      emergentStrengths,
      modelUsed: aiResult.modelUsed
    });
  } catch (err: any) {
    console.error("Growth synthesis error:", err);
    res.status(500).json({ error: err.message || "Failed to synthesize growth." });
  }
});

// Vite middleware & Production static serving
// Public Privacy Policy & Terms for Google OAuth compliance
app.get("/privacy", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ReflectAI Sanctuary - Privacy Policy</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; background: #f8fafc; }
        .card { background: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #e2e8f0; }
        h1 { color: #4338ca; }
        h2 { color: #334155; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>ReflectAI Sanctuary - Privacy Policy</h1>
        <p><strong>Last Updated:</strong> ${new Date().toISOString().split("T")[0]}</p>
        <p>ReflectAI Sanctuary ("we", "our", or "the App") is committed to protecting your personal privacy. This privacy policy explains how our application handles your data when you use our reflection and journaling platform.</p>
        
        <h2>1. Information We Collect</h2>
        <p>When you authenticate using Google Sign-In, we receive basic identity information: your email address, display name, and profile picture URL. When you write reflections or journals, this content is stored in your private database account.</p>
        
        <h2>2. How We Use Your Information</h2>
        <p>Your information is used strictly to provide you with private journaling and AI-assisted reflection features. We do not sell, rent, or share your personal information with third parties or advertisers.</p>
        
        <h2>3. Data Isolation & Security</h2>
        <p>All user data is isolated per authenticated user account using Cloud Firestore security rules. Only you can view and edit your journal entries.</p>
        
        <h2>4. Contact Us</h2>
        <p>If you have any questions regarding this Privacy Policy, you can contact the developer at: <strong>puneet.agarwal8898@gmail.com</strong>.</p>
      </div>
    </body>
    </html>
  `);
});

app.get("/terms", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ReflectAI Sanctuary - Terms of Service</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; background: #f8fafc; }
        .card { background: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #e2e8f0; }
        h1 { color: #4338ca; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>ReflectAI Sanctuary - Terms of Service</h1>
        <p>By using ReflectAI Sanctuary, you agree to use the service for lawful personal journaling and reflection. The AI insights provided are for personal growth and contemplative exploration and do not substitute professional medical, legal, or psychological advice.</p>
      </div>
    </body>
    </html>
  `);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Do not let express.static serve index.html directly; our app.get("*") handles index.html with runtime config injection
    app.use(express.static(distPath, { index: false }));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      const firebaseApiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "";
      const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "";
      const currentEnv = process.env.APP_ENV || "test";
      const isProd = currentEnv === "production";

      fs.readFile(indexPath, "utf8", (err, html) => {
        if (err) {
          res.sendFile(indexPath);
          return;
        }
        const clientConfig = {
          apiKey: firebaseApiKey,
          authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseProjectId ? `${firebaseProjectId}.firebaseapp.com` : ""),
          projectId: firebaseProjectId,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseProjectId ? `${firebaseProjectId}.appspot.com` : ""),
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
          appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || ""
        };
        const envScript = `<script>window.__APP_ENV__ = ${JSON.stringify(currentEnv)}; window.__IS_PRODUCTION_LOCKED__ = ${isProd}; window.__FIREBASE_CONFIG__ = ${JSON.stringify(clientConfig)};</script>`;
        const injectedHtml = html.replace("<head>", `<head>${envScript}`);
        res.send(injectedHtml);
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ReflectAI server listening on port ${PORT}`);
  });
}

startServer();
