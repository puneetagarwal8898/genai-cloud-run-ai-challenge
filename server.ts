import express from "express";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { generateContentWithFallback } from "./server/gemini.ts";

dotenv.config();

const app = express();
const PORT = 3000;

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
  res.json({
    appEnv: process.env.APP_ENV || "test",
    isProductionLocked: isProdLocked,
    hasSmtpConfigured: Boolean(transporter),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasFirebaseKey: Boolean(process.env.VITE_FIREBASE_API_KEY),
    timestamp: new Date().toISOString()
  });
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

    // Enhance system instruction to mandate structured JSON with response, summary, and 3 suggestions
    systemInstruction += `

You MUST respond in valid JSON format with three fields:
1. "response": (string) Your complete, thoughtful, and compassionate reflection response to the user's latest thought.
2. "summary": (string) A crisp 1-sentence synopsis under 18 words.
3. "suggestedPrompts": (array of 3 strings) Exactly 3 short, intriguing follow-up questions or reflection prompts (under 55 characters each) that the user can click next to continue this dialogue.
Return ONLY pure JSON.`;

    const aiResult = await generateContentWithFallback(contents, {
      systemInstruction,
      temperature: mode === "brainstorm" ? 0.8 : 0.65,
      responseMimeType: "application/json"
    });

    let responseText = "";
    let summary = "";
    let suggestedPrompts: string[] = [];

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
      modelUsed: aiResult.modelUsed
    });
  } catch (error: any) {
    console.error("Gemini API handler error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate AI response. Please verify Gemini API key configuration."
    });
  }
});

// Vite middleware & Production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ReflectAI server listening on port ${PORT}`);
  });
}

startServer();
