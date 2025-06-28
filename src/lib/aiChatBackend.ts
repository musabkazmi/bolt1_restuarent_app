export interface AIChatRequest {
  message: string;
}

export interface AIChatResponse {
  answer: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

export class AIChatBackend {
  private apiUrl = 'https://bolt-ai-sql-backend.onrender.com/ai/chat';

  async sendMessage(message: string): Promise<AIChatResponse> {
    try {
      console.log('Sending message to AI Chat Backend:', message);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific quota errors
        if (response.status === 429) {
          if (errorData.error?.message?.includes('quota') || errorData.error?.code === 'insufficient_quota') {
            throw new Error('The AI service has reached its usage limit. Please try again later or contact support.');
          }
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        
        throw new Error(errorData.error?.message || errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('AI Chat Backend response:', data);

      return {
        answer: data.answer || 'No response received',
        error: data.error
      };

    } catch (error: any) {
      console.error('Error calling AI Chat Backend:', error);
      
      return {
        answer: '',
        error: error.message || 'Failed to connect to AI Chat Backend'
      };
    }
  }
}

export const aiChatBackend = new AIChatBackend();