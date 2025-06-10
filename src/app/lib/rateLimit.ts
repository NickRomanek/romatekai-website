interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowEnd = now + this.config.windowMs;

    if (!this.store[key] || this.store[key].resetTime < now) {
      // New window
      this.store[key] = {
        count: 1,
        resetTime: windowEnd,
      };
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: windowEnd,
      };
    }

    if (this.store[key].count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.store[key].resetTime,
      };
    }

    this.store[key].count += 1;
    return {
      allowed: true,
      remaining: this.config.maxRequests - this.store[key].count,
      resetTime: this.store[key].resetTime,
    };
  }
}

// Create rate limiters for different types of limits
export const sessionLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 50 requests per hour per session
});

export const ipLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100, // 100 requests per hour per IP
});

export const userLimiter = new RateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 200, // 200 requests per day per user
}); 