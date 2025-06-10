import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Track token usage with timestamps
interface TokenUsage {
  count: number;
  lastReset: number;
}

const tokenUsage: { [key: string]: TokenUsage } = {};

// Reset token usage daily
const DAILY_TOKEN_LIMIT = 100000; // 100k tokens per day
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function getTokenUsage(key: string): TokenUsage {
  const now = Date.now();
  const usage = tokenUsage[key];

  // If no usage record or it's time to reset
  if (!usage || (now - usage.lastReset) >= RESET_INTERVAL) {
    tokenUsage[key] = {
      count: 0,
      lastReset: now,
    };
  }

  return tokenUsage[key];
}

// Proxy endpoint for the OpenAI Responses API
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = req.cookies.get('session_id')?.value;
    const userId = req.cookies.get('user_id')?.value;
    const key = userId || sessionId || 'anonymous';

    // Check if we're approaching rate limits
    const remaining = parseInt(req.headers.get('x-rate-limit-remaining') || '0');
    if (remaining < 5) {
      console.warn(`Rate limit warning: ${remaining} requests remaining for session ${sessionId}`);
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let response;
    if (body.text?.format?.type === 'json_schema') {
      response = await structuredResponse(openai, body);
    } else {
      response = await textResponse(openai, body);
    }

    // Track token usage
    if (response.usage) {
      const usage = getTokenUsage(key);
      usage.count += response.usage.total_tokens;
      
      // Check if approaching daily limit
      if (usage.count > DAILY_TOKEN_LIMIT * 0.9) { // 90% of limit
        console.warn(`Token usage warning: ${usage.count}/${DAILY_TOKEN_LIMIT} tokens used by ${key}`);
      }

      // If over limit, return error
      if (usage.count > DAILY_TOKEN_LIMIT) {
        const resetTime = new Date(usage.lastReset + RESET_INTERVAL).toISOString();
        return NextResponse.json(
          { 
            error: 'Daily token limit exceeded',
            resetTime,
            message: 'You have exceeded your daily token limit. Please try again tomorrow.'
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('responses proxy error', err);
    
    // Handle rate limit errors specifically
    if (err.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}

async function structuredResponse(openai: OpenAI, body: any) {
  try {
    const response = await openai.responses.parse({
      ...(body as any),
      stream: false,
    } as any);

    return response;
  } catch (err: any) {
    console.error('structured response error', err);
    throw err;
  }
}

async function textResponse(openai: OpenAI, body: any) {
  try {
    const response = await openai.responses.create({
      ...(body as any),
      stream: false,
    } as any);

    return response;
  } catch (err: any) {
    console.error('text response error', err);
    throw err;
  }
}
  