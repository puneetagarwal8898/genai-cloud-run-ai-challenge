import React from 'react';
import { X, ExternalLink, Key, CheckCircle, ShieldCheck } from 'lucide-react';

interface OAuthGuideModalProps {
  isOpen: boolean;
  provider: 'google' | 'linkedin' | 'twitter' | null;
  onClose: () => void;
  onContinueAsTestProfile?: () => void;
  isTestMode: boolean;
}

export const OAuthGuideModal: React.FC<OAuthGuideModalProps> = ({
  isOpen,
  provider,
  onClose,
  onContinueAsTestProfile,
  isTestMode
}) => {
  if (!isOpen || !provider) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your-app-domain.run.app';

  const getProviderDetails = () => {
    switch (provider) {
      case 'google':
        return {
          title: 'Google OAuth 2.0 Credentials Setup',
          color: '#4285F4',
          steps: [
            {
              step: '1. Open Firebase Console',
              desc: 'Go to the Firebase Console (console.firebase.google.com) and select your Firebase project.',
              link: 'https://console.firebase.google.com'
            },
            {
              step: '2. Enable Google Sign-In Provider',
              desc: 'Navigate to Build > Authentication > Sign-in method. Click "Add new provider" (or select Google), toggle "Enable", select your Project support email, and click "Save".'
            },
            {
              step: '3. Authorize This Domain in Firebase',
              desc: `Go to Authentication > Settings > Authorized domains. Click "Add domain" and add your current application domain: ${currentHost}`
            },
            {
              step: '4. Get Firebase Web API Key & Project ID',
              desc: 'Go to Project Settings (gear icon) > General. Under "Your apps", register a Web app (or view your existing web app) and copy the Web API Key (starts with AIzaSy...) and Project ID.'
            },
            {
              step: '5. Configure Secrets & Verify API Restrictions',
              desc: 'In AI Studio Settings > Secrets (or Cloud Run environment variables), configure FIREBASE_API_KEY (or VITE_FIREBASE_API_KEY) and FIREBASE_PROJECT_ID. If your API key has Google Cloud API restrictions, ensure "Identity Toolkit API" and "Token Service API" are allowed.'
            }
          ]
        };
      case 'linkedin':
        return {
          title: 'LinkedIn OAuth 2.0 Setup Guide',
          color: '#0A66C2',
          steps: [
            {
              step: '1. Create / Open App on LinkedIn Developer Portal',
              desc: 'Go to the LinkedIn Developers Portal (linkedin.com/developers/apps), create an app (or open existing), and link it to your LinkedIn company page.',
              link: 'https://www.linkedin.com/developers/apps'
            },
            {
              step: '2. Enable "Sign In with LinkedIn using OpenID Connect"',
              desc: 'In your LinkedIn app under the "Products" tab, find "Sign In with LinkedIn using OpenID Connect" and click "Request Access". It is granted instantly.'
            },
            {
              step: '3. Add Authorized Redirect URLs in LinkedIn',
              desc: `Go to the "Auth" tab in your LinkedIn app. Under "OAuth 2.0 settings" > "Authorized redirect URLs for your app", add:\nhttps://${currentHost}/api/auth/linkedin/callback`
            },
            {
              step: '4. Direct Token Exchange (Resolves Firebase Upstream Incompatibility)',
              desc: `Why Firebase fails: Firebase Identity Platform sends secrets in HTTP Basic Authorization headers, but LinkedIn mandates them in the application/x-www-form-urlencoded POST body, causing a persistent 'invalid-credential' error even when keys are 100% correct.\n\nTo activate the direct server-side integration, update your Cloud Run environment variables:\ngcloud run services update reflectai --update-env-vars LINKEDIN_CLIENT_ID="78ryr3nz4fw3p9",LINKEDIN_CLIENT_SECRET="YOUR_LINKEDIN_SECRET" --region=asia-south1`
            }
          ]
        };
      case 'twitter':
        return {
          title: 'Twitter / X OAuth Setup Guide',
          color: '#0F1419',
          steps: [
            {
              step: '1. Open Developer Portal on X (developer.x.com)',
              desc: 'Log in to developer.x.com/portal with your X account (ensure your account has a verified email and mobile phone number).',
              link: 'https://developer.x.com/en/portal/dashboard'
            },
            {
              step: '2. Configure User Authentication Settings',
              desc: 'In your App Settings under "User authentication settings", click "Set up". Enable OAuth 1.0a and select Type of App: "Web App, Automated App or Bot". App permissions: "Read".'
            },
            {
              step: '3. Add Callback URI / Redirect URL',
              desc: `Under "Callback URI / Redirect URL", enter: https://genai-cohort3-ideathon.firebaseapp.com/__/auth/handler. For Website URL, enter: https://${currentHost} then click Save.`
            },
            {
              step: '4. Copy API Key & API Secret',
              desc: 'Under the "Keys and tokens" tab, regenerate or copy the "API Key (Consumer Key)" and "API Secret (Consumer Secret)".'
            },
            {
              step: '5. Enable Twitter in Firebase Console',
              desc: 'Open Firebase Console > Authentication > Sign-in method, click Twitter, toggle Enable, paste your API Key & API Secret, and click Save.',
              link: 'https://console.firebase.google.com/project/genai-cohort3-ideathon/authentication/providers'
            }
          ]
        };
    }
  };

  const details = getProviderDetails();

  return (
    <div
      id="oauth-guide-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="oauth-guide-modal-content"
        className="w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl overflow-hidden relative"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: details.color }}
            >
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold">{details.title}</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Production OAuth Provider Configuration
              </p>
            </div>
          </div>
          <button
            id="close-oauth-guide-btn"
            onClick={onClose}
            className="p-1 rounded-lg hover:opacity-75 transition cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {details.steps.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-xl border text-xs"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-color)'
              }}
            >
              <div className="flex items-center justify-between font-semibold mb-1">
                <span>{item.step}</span>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:underline text-[11px]"
                    style={{ color: 'var(--accent)' }}
                  >
                    Open Console <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2" style={{ borderColor: 'var(--border-color)' }}>
          {isTestMode && onContinueAsTestProfile ? (
            <button
              id="continue-as-test-profile-btn"
              type="button"
              onClick={() => {
                onContinueAsTestProfile();
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium text-white transition flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 shadow-xs"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 10px var(--accent-glow)'
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Continue with Test {provider.toUpperCase()} Identity</span>
            </button>
          ) : (
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Configure secrets in Google Cloud / Firebase Console
            </span>
          )}

          <button
            id="close-oauth-guide-footer-btn"
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-3 py-1.5 rounded-lg border text-xs cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
