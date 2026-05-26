const isProduction = process.env.NODE_ENV === 'production';

export function getPort() {
  const rawPort = process.env.PORT || '4000';
  const port = Number.parseInt(rawPort, 10);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return port;
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret && isProduction) {
    throw new Error('JWT_SECRET must be set in production.');
  }

  return secret || 'dev-secret';
}

export function getAllowedOrigins() {
  const configuredOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins.length === 0 && isProduction) {
    throw new Error('FRONTEND_URL must be set in production.');
  }

  return isProduction ? configuredOrigins : ['http://localhost:3000', ...configuredOrigins];
}

export function isOriginAllowed(origin: string | undefined, allowedOrigins = getAllowedOrigins()) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';
  if (allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
    return true;
  }

  return !isProduction && /^https?:\/\/localhost(:\d+)?$/i.test(origin);
}

export function validateRequiredEnv() {
  if (isProduction && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set in production.');
  }

  getJwtSecret();
  getAllowedOrigins();
}
