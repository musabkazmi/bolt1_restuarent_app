import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  message: string;
  queryType?: string;
  queryResult?: any;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, queryType, queryResult }: ChatRequest = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let response: string

    if (queryType === 'analyze') {
      // Analyze the query to determine type
      response = await analyzeQuery(message, openaiApiKey)
    } else {
      // Generate response based on query result
      response = await generateResponse(message, queryResult, queryType, openaiApiKey)
    }

    return new Response(
      JSON.stringify({ response }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in AI chat function:', error)
    
    let errorMessage = 'An unexpected error occurred'
    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try a simpler question.'
      } else if (error.message.includes('401')) {
        errorMessage = 'Authentication error. Please try again.'
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function analyzeQuery(userMessage: string, apiKey: string): Promise<string> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
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
      })
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content?.trim() || 'general'

  } catch (error) {
    console.error('Error analyzing query:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    
    // Fallback to simple keyword matching
    const message = userMessage.toLowerCase()
    if (message.includes('cheapest') || message.includes('lowest price')) return 'cheapest_item'
    if (message.includes('expensive') || message.includes('highest price')) return 'expensive_item'
    if (message.includes('pending') || message.includes('orders')) return 'pending_orders'
    if (message.includes('revenue') || message.includes('sales')) return 'revenue'
    if (message.includes('categories') || message.includes('types')) return 'categories'
    if (message.includes('dessert')) return 'category_items|dessert'
    if (message.includes('drink') || message.includes('beverage')) return 'category_items|drink'
    
    return 'general'
  }
}

async function generateResponse(userMessage: string, queryResult: any, queryType: string, apiKey: string): Promise<string> {
  try {
    let systemPrompt = `You are a helpful AI assistant for a restaurant management system. Respond naturally and conversationally in 1-2 sentences.`
    
    if (queryResult && queryType) {
      systemPrompt += ` The user asked: "${userMessage}". Based on the database query results, provide a natural, helpful response.`
    }

    const messages: OpenAIMessage[] = [
      {
        role: "system",
        content: systemPrompt
      }
    ]

    if (queryResult) {
      messages.push({
        role: "user",
        content: `User question: "${userMessage}"\n\nDatabase results: ${JSON.stringify(queryResult)}\n\nPlease provide a natural response based on this data.`
      })
    } else {
      messages.push({
        role: "user",
        content: userMessage
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4",
        messages,
        max_tokens: 150,
        temperature: 0.7
      })
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.'

  } catch (error) {
    console.error('Error generating response:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return 'Request timed out. Please try a simpler question.'
    }
    
    // Fallback responses based on query type and data
    if (queryResult && queryType) {
      switch (queryType) {
        case 'cheapest_item':
          return `The cheapest item on our menu is ${queryResult.name} priced at $${queryResult.price} in the ${queryResult.category} category.`
        case 'expensive_item':
          return `The most expensive item is ${queryResult.name} at $${queryResult.price} in the ${queryResult.category} category.`
        case 'pending_orders':
          return `There are currently ${queryResult.count} pending orders.`
        case 'revenue':
          return `Today's revenue is $${queryResult.revenue.toFixed(2)} from ${queryResult.orderCount} completed orders.`
        case 'categories':
          return `Our menu categories include: ${queryResult.join(', ')}.`
        case 'category_items':
          if (queryResult.length > 0) {
            return `Here are the items in that category: ${queryResult.map((item: any) => `${item.name} ($${item.price})`).join(', ')}.`
          } else {
            return 'No items found in that category.'
          }
        default:
          return 'I found some information but had trouble formatting the response. Please try asking again.'
      }
    }
    
    return 'I apologize, but I encountered an error processing your request. Please try again with a simpler question.'
  }
}