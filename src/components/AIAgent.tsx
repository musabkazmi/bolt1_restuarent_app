import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Mic, Image } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Message } from '../lib/supabase';

export default function AIAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
      } else {
        setMessages(data || []);
        
        // Add welcome message if no messages exist
        if (!data || data.length === 0) {
          const welcomeMessage: Message = {
            id: 'welcome',
            user_id: user.id,
            content: `Hello ${user.name}! I'm your AI assistant. I can help you with orders, menu questions, restaurant information, and more. How can I assist you today?`,
            type: 'assistant',
            created_at: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMessage = async (content: string, type: 'user' | 'assistant') => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            user_id: user.id,
            content,
            type,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
      } else {
        return data;
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      manager: 'from-blue-500 to-blue-600',
      waiter: 'from-green-500 to-green-600',
      kitchen: 'from-orange-500 to-orange-600',
      customer: 'from-purple-500 to-purple-600'
    };
    return colors[role as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    const userMessageContent = inputValue;
    setInputValue('');
    setIsTyping(true);

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      user_id: user.id,
      content: userMessageContent,
      type: 'user',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    // Save user message to database
    await saveMessage(userMessageContent, 'user');

    // Simulate AI response
    setTimeout(async () => {
      const botResponse = getBotResponse(userMessageContent, user.role);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        user_id: user.id,
        content: botResponse,
        type: 'assistant',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Save bot message to database
      await saveMessage(botResponse, 'assistant');
      
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (input: string, role: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('menu') || lowerInput.includes('food')) {
      return "I can help you with our menu! We have delicious options including Margherita Pizza ($18.99), Caesar Salad ($12.99), Grilled Salmon ($24.99), and more. Would you like me to show you a specific category or help you place an order?";
    }
    
    if (lowerInput.includes('order') && role === 'customer') {
      return "I'd be happy to help you place an order! You can tell me what items you'd like, and I'll add them to your cart. What would you like to order today?";
    }
    
    if (lowerInput.includes('table') && role === 'waiter') {
      return "I can help you manage tables! Currently, you have tables 3 and 5 occupied. Would you like me to help you take a new order, check table status, or assist with something else?";
    }
    
    if (lowerInput.includes('kitchen') || lowerInput.includes('cooking')) {
      return "For kitchen operations, I can help you track pending orders, manage cooking times, and check inventory levels. What specific assistance do you need?";
    }
    
    if (lowerInput.includes('report') && role === 'manager') {
      return "I can help you with various reports! Today's revenue is $2,450.50 with 24 orders completed. Would you like detailed sales analytics, staff performance reports, or inventory summaries?";
    }
    
    return "I understand you're asking about: \"" + input + "\". As your AI assistant, I can help with menu information, order management, table service, kitchen operations, and restaurant analytics. Could you be more specific about what you need help with?";
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className={`bg-gradient-to-r ${getRoleColor(user?.role || '')} text-white p-6 rounded-t-xl`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-lg">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="opacity-90">Your intelligent restaurant companion</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border-x border-gray-200 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-gray-600" />
                </div>
              )}
              
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? `bg-gradient-to-r ${getRoleColor(user?.role || '')} text-white`
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>

              {message.type === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-gray-600" />
              </div>
              <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <button
              type="button"
              className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Image className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about the restaurant..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                  inputValue.trim()
                    ? `bg-gradient-to-r ${getRoleColor(user?.role || '')} text-white hover:shadow-lg`
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}