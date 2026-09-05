import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

/**
 * Generates a cryptographically secure Base32 secret for TOTP 2FA.
 */
export function generateTotpSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

/**
 * Generates standard RFC 6238 otpauth URI compatible with Google Authenticator,
 * Microsoft Authenticator, 1Password, Authy, Apple Passwords.
 */
export function generateTotpUri(email: string, secretBase32: string): string {
  const label = email || 'Mindful Reflector';
  const totp = new OTPAuth.TOTP({
    issuer: 'ReflectAI',
    label,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32)
  });
  return totp.toString();
}

/**
 * Validates a 6-digit TOTP code with a ±1 window (covering ±30 seconds clock skew).
 */
export function verifyTotpToken(secretBase32: string, token: string): boolean {
  if (!secretBase32 || !token) return false;
  const cleanToken = token.replace(/\s+/g, '').trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'ReflectAI',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32)
    });

    const delta = totp.validate({ token: cleanToken, window: 1 });
    return delta !== null;
  } catch (err) {
    console.error('TOTP token verification error:', err);
    return false;
  }
}

/**
 * Generates an SVG or data URL QR code representation for the authenticator app scan.
 */
export async function generateQrCodeDataUrl(otpauthUri: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauthUri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 220,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('QR code generation error:', err);
    throw err;
  }
}
