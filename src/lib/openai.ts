import OpenAI from 'openai';

// Hardcode the OpenAI API key for deployment reliability
const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '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';

if (!apiKey) {
  console.warn('OpenAI API key not found - AI features will be disabled');
}

export const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
  timeout: 10000, // 10 second timeout
  maxRetries: 2, // Limit retries
});

// Rate limiting helper
class RateLimiter {
  private requests: number[] = [];
  private maxRequests = 5; // Max 5 requests
  private timeWindow = 60000; // Per minute

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old requests outside time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  getWaitTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.timeWindow - (Date.now() - oldestRequest));
  }
}

export const rateLimiter = new RateLimiter();