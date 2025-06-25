import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true // Note: In production, this should be handled server-side
});

export { openai };