import { openai } from './openai';
import { aiQueries } from './aiQueries';

export interface AIResponse {
  message: string;
  data?: any;
  error?: string;
}

export class AIAgent {
  private async analyzeQuery(userMessage: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for a restaurant management system. Analyze the user's question and determine what type of query they need. 

Available query types:
- "cheapest_item" - for questions about the cheapest menu item
- "expensive_item" - for questions about the most expensive menu item  
- "category_items" - for questions about items in a specific category (extract the category name)
- "pending_orders" - for questions about pending orders
- "revenue" - for questions about today's sales/revenue
- "categories" - for questions about available menu categories
- "general" - for general restaurant questions that don't need database queries

Respond with ONLY the query type (and category name if applicable, separated by |). Examples:
- "What's the cheapest item?" → "cheapest_item"
- "Show me desserts" → "category_items|dessert"
- "How many pending orders?" → "pending_orders"
- "What's today's revenue?" → "revenue"
- "What categories do you have?" → "categories"
- "How are you?" → "general"`
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      });

      return response.choices[0]?.message?.content?.trim() || 'general';
    } catch (error) {
      console.error('Error analyzing query:', error);
      return 'general';
    }
  }

  private async generateResponse(userMessage: string, queryResult?: any, queryType?: string): Promise<string> {
    try {
      let systemPrompt = `You are a helpful AI assistant for a restaurant management system. Respond naturally and conversationally.`;
      
      if (queryResult && queryType) {
        systemPrompt += ` The user asked: "${userMessage}". Based on the database query results, provide a natural, helpful response.`;
      }

      const messages: any[] = [
        {
          role: "system",
          content: systemPrompt
        }
      ];

      if (queryResult) {
        messages.push({
          role: "user",
          content: `User question: "${userMessage}"\n\nDatabase results: ${JSON.stringify(queryResult)}\n\nPlease provide a natural response based on this data.`
        });
      } else {
        messages.push({
          role: "user",
          content: userMessage
        });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 200,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.';
    } catch (error) {
      console.error('Error generating response:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }

  async processMessage(userMessage: string): Promise<AIResponse> {
    try {
      console.log('Processing user message:', userMessage);
      
      // Analyze what type of query this is
      const queryType = await this.analyzeQuery(userMessage);
      console.log('Detected query type:', queryType);

      let queryResult = null;
      let error = null;

      // Execute the appropriate database query
      const [type, category] = queryType.split('|');
      
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

      // Generate natural language response
      const aiResponse = await this.generateResponse(userMessage, queryResult, type);

      return {
        message: aiResponse,
        data: queryResult,
        error: error
      };

    } catch (error) {
      console.error('Error in processMessage:', error);
      return {
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        error: 'Processing error'
      };
    }
  }
}

export const aiAgent = new AIAgent();