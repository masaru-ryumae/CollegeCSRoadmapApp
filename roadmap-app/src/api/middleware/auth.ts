import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        tier: 'free' | 'premium' | 'enterprise';
        iat?: number;
        exp?: number;
      };
      apiKey?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const VALID_API_KEYS = new Set(
  (process.env.VALID_API_KEYS || '').split(',').filter(Boolean)
);

/**
 * Verify JWT token from Authorization header
 */
export const verifyJWT = (token: string): any => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Generate JWT token
 */
export const generateJWT = (userId: string, email: string, tier: 'free' | 'premium' | 'enterprise'): string => {
  return jwt.sign(
    { id: userId, email, tier },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * Middleware: Authenticate using JWT or API Key
 * Supports both Authorization: Bearer <token> and X-API-Key: <key>
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'];

  // Try JWT first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = verifyJWT(token);
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired JWT token'
      });
    }
  }

  // Try API Key
  if (apiKeyHeader && typeof apiKeyHeader === 'string') {
    if (VALID_API_KEYS.has(apiKeyHeader)) {
      // For API key auth, we don't have user info, but mark as authenticated
      req.apiKey = apiKeyHeader;
      return next();
    }
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }

  // No authentication provided
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Missing Authorization header or X-API-Key'
  });
};

/**
 * Middleware: Optional authentication - continues even if auth fails
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = verifyJWT(token);
      req.user = decoded;
    } catch (error) {
      // Silently ignore JWT errors in optional auth
    }
  }

  if (apiKeyHeader && typeof apiKeyHeader === 'string') {
    if (VALID_API_KEYS.has(apiKeyHeader)) {
      req.apiKey = apiKeyHeader;
    }
  }

  next();
};

/**
 * Middleware: Require premium tier or higher
 */
export const requirePremium = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.tier !== 'premium' && req.user.tier !== 'enterprise') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Premium subscription required for this feature'
    });
  }

  next();
};

/**
 * Middleware: Require enterprise tier
 */
export const requireEnterprise = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.tier !== 'enterprise') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Enterprise subscription required for this feature'
    });
  }

  next();
};

/**
 * OAuth2 flow helpers
 */
export const oauth2Providers = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/v1/auth/google/callback'
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3001/api/v1/auth/github/callback'
  }
};
