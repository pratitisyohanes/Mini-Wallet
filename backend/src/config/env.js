import 'dotenv/config';

const REQUIRED_VARIABLES = ['DATABASE_URL', 'JWT_SECRET'];

for (const name of REQUIRED_VARIABLES) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const isProduction = process.env.NODE_ENV === 'production';

const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const midtransServerKey = process.env.MIDTRANS_SERVER_KEY?.trim() || null;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction,
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  corsOrigins,
  /** Public URL of the frontend. Midtrans sends the user back here after paying. */
  appUrl: (process.env.APP_URL ?? corsOrigins[0]).replace(/\/+$/, ''),
  midtrans: {
    serverKey: midtransServerKey,
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    enabled: Boolean(midtransServerKey),
  },
  // Instant top-up without payment is a demo feature. Once real payments are configured in
  // production it is switched off, unless ALLOW_DIRECT_TOPUP=true turns it back on.
  allowDirectTopUp: process.env.ALLOW_DIRECT_TOPUP
    ? process.env.ALLOW_DIRECT_TOPUP === 'true'
    : !(isProduction && midtransServerKey),
  cookieSameSite: process.env.COOKIE_SAME_SITE ?? 'lax',
  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction,
};
