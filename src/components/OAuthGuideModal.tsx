import React from 'react';
import { X, ExternalLink, Key, CheckCircle, ShieldCheck } from 'lucide-react';

interface OAuthGuideModalProps {
  isOpen: boolean;
  provider: 'google' | 'linkedin' | 'facebook' | null;
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

  const getProviderDetails = () => {
    switch (provider) {
      case 'google':
        return {
          title: 'Google OAuth 2.0 Credentials Setup',
          color: '#4285F4',
          steps: [
            {
              step: '1. Open Firebase Console',
              desc: 'Go to the Firebase Console (console.firebase.google.com) and open your project.',
              link: 'https://console.firebase.google.com'
            },
            {
              step: '2. Enable Google Sign-In',
              desc: 'Navigate to Build > Authentication > Sign-in method tab. Click "Add new provider", select "Google", and toggle "Enable". Set your support email.'
            },
            {
              step: '3. Authorize Production Domain',
              desc: 'Under Authentication > Settings > Authorized domains, add your Cloud Run or production domain.'
            },
            {
              step: '4. Set API Keys in Environment',
              desc: 'Ensure VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID are configured in your project settings / environment variables.'
            }
          ]
        };
      case 'linkedin':
        return {
          title: 'LinkedIn OAuth 2.0 Setup Guide',
          color: '#0A66C2',
          steps: [
            {
              step: '1. Create App on LinkedIn Developer Portal',
              desc: 'Go to the LinkedIn Developers Portal (linkedin.com/developers) and create a new App.',
              link: 'https://www.linkedin.com/developers/apps'
            },
            {
              step: '2. Enable "Sign In with LinkedIn using OpenID Connect"',
              desc: 'Under Products tab, request access to "Sign In with LinkedIn using OpenID Connect".'
            },
            {
              step: '3. Add Authorized Redirect URL',
              desc: 'In Firebase Console > Authentication > Sign-in method > LinkedIn, copy the OAuth redirect URL (e.g., https://<project>.firebaseapp.com/__/auth/handler) and paste it into the LinkedIn App OAuth 2.0 settings.'
            },
            {
              step: '4. Save Client ID & Secret in Firebase',
              desc: 'Copy the LinkedIn Client ID and Client Secret into your Firebase Console under Authentication > Sign-in method > LinkedIn.'
            }
          ]
        };
      case 'facebook':
        return {
          title: 'Meta / Facebook Login Setup Guide',
          color: '#1877F2',
          steps: [
            {
              step: '1. Create App on Meta for Developers',
              desc: 'Navigate to Meta for Developers (developers.facebook.com) and click "Create App" (type: Consumer or Business).',
              link: 'https://developers.facebook.com/apps'
            },
            {
              step: '2. Add Facebook Login Product',
              desc: 'Select "Add Product" and set up "Facebook Login for Web".'
            },
            {
              step: '3. Configure Valid OAuth Redirect URIs',
              desc: 'In Firebase Console > Authentication > Sign-in method > Facebook, copy the OAuth redirect URI and paste it into Facebook Login > Settings > Valid OAuth Redirect URIs.'
            },
            {
              step: '4. Enter App ID and App Secret into Firebase',
              desc: 'From Facebook App Settings > Basic, copy the App ID and App Secret, then paste them into Firebase Authentication.'
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
