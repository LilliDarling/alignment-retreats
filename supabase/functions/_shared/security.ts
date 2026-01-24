// Shared security utilities for edge functions

/**
 * Rate limiting using in-memory storage with sliding window
 * Note: In production, consider using Redis or Supabase for distributed rate limiting
 */
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now - record.windowStart > config.windowMs) {
    // New window
    rateLimitStore.set(identifier, { count: 1, windowStart: now });
    return { 
      allowed: true, 
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs 
    };
  }

  if (record.count >= config.maxRequests) {
    const resetIn = config.windowMs - (now - record.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }

  record.count++;
  return { 
    allowed: true, 
    remaining: config.maxRequests - record.count,
    resetIn: config.windowMs - (now - record.windowStart)
  };
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimitStore(maxAge: number = 300000): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.windowStart > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Validate UUID format to prevent injection
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Validate URL to prevent open redirect attacks
 */
export function isValidReturnUrl(url: string, allowedOrigins: string[]): boolean {
  try {
    const parsed = new URL(url);
    return allowedOrigins.some(origin => 
      parsed.origin === origin || 
      parsed.hostname.endsWith(`.${new URL(origin).hostname}`)
    );
  } catch {
    return false;
  }
}

/**
 * Sanitize amount to prevent manipulation
 */
export function validateAmount(amount: unknown): number | null {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return null;
  if (amount <= 0 || amount > 1000000) return null; // Max $1M
  return Math.round(amount * 100) / 100; // Round to 2 decimal places
}

/**
 * Create audit log entry
 */
export interface AuditLogEntry {
  action: string;
  user_id?: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}

export function createAuditLog(entry: Omit<AuditLogEntry, 'timestamp'>): AuditLogEntry {
  return {
    ...entry,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         req.headers.get("x-real-ip") ||
         "unknown";
}

/**
 * Security response headers
 */
export const securityHeaders = {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Pragma": "no-cache",
};
