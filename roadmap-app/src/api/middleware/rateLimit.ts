import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

/**
 * Get rate limit key from request
 */
const getRateLimitKey = (req: Request): string => {
  // Use user ID if authenticated, otherwise use IP address
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  if (req.apiKey) {
    return `api-key:${req.apiKey}`;
  }
  return `ip:${req.ip}`;
};

/**
 * Get rate limit tier based on user tier or API key
 */
const getRateLimitTier = (req: Request): 'free' | 'premium' | 'enterprise' | 'anonymous' => {
  if (req.user?.tier === 'enterprise') return 'enterprise';
  if (req.user?.tier === 'premium') return 'premium';
  if (req.user?.tier === 'free') return 'free';
  if (req.apiKey) return 'premium'; // API keys get premium limits
  return 'anonymous';
};

/**
 * Rate limit config by tier
 * Requests per hour
 */
const RATE_LIMITS = {
  enterprise: 10000,
  premium: 5000,
  free: 1000,
  anonymous: 100
};

/**
 * Custom rate limit middleware
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = getRateLimitKey(req);
  const tier = getRateLimitTier(req);
  const limit = RATE_LIMITS[tier];
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Reset window
    entry = {
      count: 0,
      resetTime: now + 3600000 // 1 hour window
    };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  // Set rate limit headers
  const remaining = Math.max(0, limit - entry.count);
  const resetTime = Math.ceil((entry.resetTime - now) / 1000);

  res.set('X-RateLimit-Limit', String(limit));
  res.set('X-RateLimit-Remaining', String(remaining));
  res.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));
  res.set('X-RateLimit-Tier', tier);

  // Check if limit exceeded
  if (entry.count > limit) {
    res.status(429).set('Retry-After', String(resetTime)).json({
      error: 'Too Many Requests',
      message: `Rate limit of ${limit} requests per hour exceeded for ${tier} tier`,
      retryAfter: resetTime,
      resetTime: new Date(entry.resetTime).toISOString()
    });
    return;
  }

  next();
};

/**
 * Express rate limiter for stricter control (optional, can be used for specific routes)
 */
export const createEndpointLimiter = (windowMs: number = 900000, maxRequests: number = 100) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit'
      });
    }
  });
};

/**
 * Specific limiters for different endpoints
 */
export const loginLimiter = createEndpointLimiter(900000, 5); // 5 requests per 15 minutes
export const signupLimiter = createEndpointLimiter(3600000, 3); // 3 requests per hour
export const apiKeyLimiter = createEndpointLimiter(3600000, 10); // 10 requests per hour
