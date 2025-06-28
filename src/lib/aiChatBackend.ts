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
  private clearUrl = 'https://bolt-ai-sql-backend.onrender.com/ai/clear';

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
        
        if (response.status === 500) {
          throw new Error('Internal server error. Please try again in a moment.');
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
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          answer: '',
          error: 'Network error. Please check your connection and try again.'
        };
      }
      
      return {
        answer: '',
        error: error.message || 'Failed to connect to AI Chat Backend'
      };
    }
  }

  async clearChat(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Clearing AI chat session...');

      const response = await fetch(this.clearUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Clear API error: ${response.status}`);
      }

      console.log('AI chat session cleared successfully');
      return { success: true };

    } catch (error: any) {
      console.error('Error clearing AI chat session:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to clear chat session'
      };
    }
  }
}

export const aiChatBackend = new AIChatBackend();