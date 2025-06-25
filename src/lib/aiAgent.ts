import { openai, rateLimiter } from './openai';
import { aiQueries } from './aiQueries';

export interface AIResponse {
  message: string;
  data?: any;
  error?: string;
}

export class AIAgent {
  private processingTimeout = 15000; // 15 second timeout
  private isProcessing = false;

  private async analyzeQuery(userMessage: string): Promise<string> {
    // Check rate limiting
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = Math.ceil(rateLimiter.getWaitTime() / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
    }

    try {
      console.log('Analyzing query with OpenAI...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

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

      clearTimeout(timeoutId);
      return response.choices[0]?.message?.content?.trim() || 'general';
    } catch (error: any) {
      console.error('Error analyzing query:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please wait a moment and try again.');
      }
      
      if (error.status === 401) {
        throw new Error('OpenAI API authentication failed. Please check the API key.');
      }
      
      // Fallback to simple keyword matching if OpenAI fails
      const message = userMessage.toLowerCase();
      if (message.includes('cheapest') || message.includes('lowest price')) return 'cheapest_item';
      if (message.includes('expensive') || message.includes('highest price')) return 'expensive_item';
      if (message.includes('pending') || message.includes('orders')) return 'pending_orders';
      if (message.includes('revenue') || message.includes('sales')) return 'revenue';
      if (message.includes('categories') || message.includes('types')) return 'categories';
      if (message.includes('dessert')) return 'category_items|dessert';
      if (message.includes('drink') || message.includes('beverage')) return 'category_items|drink';
      
      return 'general';
    }
  }

  private async generateResponse(userMessage: string, queryResult?: any, queryType?: string): Promise<string> {
    // Check rate limiting
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = Math.ceil(rateLimiter.getWaitTime() / 1000);
      return `I'm currently rate limited. Please wait ${waitTime} seconds before asking another question.`;
    }

    try {
      let systemPrompt = `You are a helpful AI assistant for a restaurant management system. Respond naturally and conversationally in 1-2 sentences.`;
      
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 150,
        temperature: 0.7
      });

      clearTimeout(timeoutId);
      return response.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.';
    } catch (error: any) {
      console.error('Error generating response:', error);
      
      if (error.name === 'AbortError') {
        return 'Request timed out. Please try a simpler question.';
      }
      
      if (error.status === 429) {
        return 'I\'m currently experiencing high demand. Please wait a moment and try again.';
      }
      
      // Fallback responses based on query type and data
      if (queryResult && queryType) {
        switch (queryType) {
          case 'cheapest_item':
            return `The cheapest item on our menu is ${queryResult.name} priced at $${queryResult.price} in the ${queryResult.category} category.`;
          case 'expensive_item':
            return `The most expensive item is ${queryResult.name} at $${queryResult.price} in the ${queryResult.category} category.`;
          case 'pending_orders':
            return `There are currently ${queryResult.count} pending orders.`;
          case 'revenue':
            return `Today's revenue is $${queryResult.revenue.toFixed(2)} from ${queryResult.orderCount} completed orders.`;
          case 'categories':
            return `Our menu categories include: ${queryResult.join(', ')}.`;
          case 'category_items':
            if (queryResult.length > 0) {
              return `Here are the items in that category: ${queryResult.map((item: any) => `${item.name} ($${item.price})`).join(', ')}.`;
            } else {
              return 'No items found in that category.';
            }
          default:
            return 'I found some information but had trouble formatting the response. Please try asking again.';
        }
      }
      
      return 'I apologize, but I encountered an error processing your request. Please try again with a simpler question.';
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
      console.log('Processing user message:', userMessage);
      
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
    // Analyze what type of query this is
    const queryType = await this.analyzeQuery(userMessage);
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

    // Generate natural language response
    const aiResponse = await this.generateResponse(userMessage, queryResult, type);

    return {
      message: aiResponse,
      data: queryResult,
      error: error
    };
  }
}

export const aiAgent = new AIAgent();