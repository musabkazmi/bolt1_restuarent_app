import { aiQueries } from './aiQueries';

export interface AIResponse {
  message: string;
  data?: any;
  error?: string;
}

export class AIAgent {
  private processingTimeout = 15000; // 15 second timeout
  private isProcessing = false;

  private async callBackendAI(message: string, queryType: string = 'analyze', queryResult?: any): Promise<string> {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          queryType,
          queryResult
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backend API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response || 'No response received from AI service';

    } catch (error: any) {
      console.error('Error calling backend AI:', error);
      
      if (error.message?.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      if (error.message?.includes('timeout')) {
        throw new Error('Request timed out. Please try a simpler question.');
      }
      
      throw new Error('AI service temporarily unavailable. Please try again.');
    }
  }

  async processMessage(userMessage: string): Promise<AIResponse> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      return {
        message: 'I\'m still processing your previous question. Please wait a moment.',
        error: 'Already processing'
      };
    }

    this.isProcessing = true;
    
    try {
      console.log('Processing user message with backend AI:', userMessage);
      
      // Set overall timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Processing timeout')), this.processingTimeout);
      });

      const processingPromise = this.processMessageInternal(userMessage);
      
      const result = await Promise.race([processingPromise, timeoutPromise]);
      return result;

    } catch (error: any) {
      console.error('Error in processMessage:', error);
      
      if (error.message === 'Processing timeout') {
        return {
          message: 'Sorry, that took too long to process. Please try a simpler question.',
          error: 'Timeout'
        };
      }
      
      return {
        message: error.message || 'I apologize, but I encountered an error. Please try again.',
        error: 'Processing error'
      };
    } finally {
      this.isProcessing = false;
    }
  }

  private async processMessageInternal(userMessage: string): Promise<AIResponse> {
    // Analyze what type of query this is using backend AI
    const queryType = await this.callBackendAI(userMessage, 'analyze');
    console.log('Detected query type:', queryType);

    let queryResult = null;
    let error = null;

    // Execute the appropriate database query
    const [type, category] = queryType.split('|');
    
    try {
      switch (type) {
        case 'cheapest_item':
          const cheapestResult = await aiQueries.getCheapestMenuItem();
          if (cheapestResult.success) {
            queryResult = cheapestResult.data;
          } else {
            error = cheapestResult.error;
          }
          break;

        case 'expensive_item':
          const expensiveResult = await aiQueries.getMostExpensiveMenuItem();
          if (expensiveResult.success) {
            queryResult = expensiveResult.data;
          } else {
            error = expensiveResult.error;
          }
          break;

        case 'category_items':
          if (category) {
            const categoryResult = await aiQueries.getMenuItemsByCategory(category);
            if (categoryResult.success) {
              queryResult = categoryResult.data;
            } else {
              error = categoryResult.error;
            }
          }
          break;

        case 'pending_orders':
          const pendingResult = await aiQueries.getPendingOrdersCount();
          if (pendingResult.success) {
            queryResult = pendingResult.data;
          } else {
            error = pendingResult.error;
          }
          break;

        case 'revenue':
          const revenueResult = await aiQueries.getTodayRevenue();
          if (revenueResult.success) {
            queryResult = revenueResult.data;
          } else {
            error = revenueResult.error;
          }
          break;

        case 'categories':
          const categoriesResult = await aiQueries.getMenuCategories();
          if (categoriesResult.success) {
            queryResult = categoriesResult.data;
          } else {
            error = categoriesResult.error;
          }
          break;

        default:
          // For general queries, no database query needed
          break;
      }
    } catch (dbError: any) {
      console.error('Database query error:', dbError);
      error = 'Database query failed';
    }

    // Generate natural language response using backend AI
    const aiResponse = await this.callBackendAI(userMessage, type, queryResult);

    return {
      message: aiResponse,
      data: queryResult,
      error: error
    };
  }
}

export const aiAgent = new AIAgent();