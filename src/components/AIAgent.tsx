import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Mic, Image, Sparkles, Database, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Message } from '../lib/supabase';
import { aiAgent } from '../lib/aiAgent';

export default function AIAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingAI, setProcessingAI] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
            content: `Hello ${user.name}! I'm your AI assistant powered by OpenAI. I can help you with:\n\n🍽️ Menu questions (cheapest/most expensive items, categories)\n📊 Restaurant analytics (pending orders, revenue)\n💡 General restaurant management questions\n\nTry asking: "What's the cheapest item on the menu?"`,
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
    if (!inputValue.trim() || !user || processingAI) return;

    const userMessageContent = inputValue;
    setInputValue('');
    setIsTyping(true);
    setProcessingAI(true);

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

    try {
      // Process message with AI agent
      console.log('Sending message to AI agent:', userMessageContent);
      const aiResponse = await aiAgent.processMessage(userMessageContent);
      
      console.log('AI response received:', aiResponse);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        user_id: user.id,
        content: aiResponse.message,
        type: 'assistant',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Save bot message to database
      await saveMessage(aiResponse.message, 'assistant');
      
    } catch (error) {
      console.error('Error processing AI message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        user_id: user.id,
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        type: 'assistant',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage.content, 'assistant');
    } finally {
      setIsTyping(false);
      setProcessingAI(false);
    }
  };

  const quickQuestions = [
    "What's the cheapest item on the menu?",
    "What's the most expensive item?",
    "How many pending orders are there?",
    "What's today's revenue?",
    "What categories do you have?",
    "Show me desserts"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading AI assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className={`bg-gradient-to-r ${getRoleColor(user?.role || '')} text-white p-6 rounded-t-xl`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-lg">
            <div className="relative">
              <Bot className="w-6 h-6" />
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="opacity-90 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Powered by OpenAI • Connected to your restaurant data
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border-x border-gray-200 overflow-hidden flex flex-col">
        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Try these questions:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-left p-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              )}
              
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? `bg-gradient-to-r ${getRoleColor(user?.role || '')} text-white`
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  {processingAI && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Database className="w-3 h-3" />
                      <span>Querying database...</span>
                    </div>
                  )}
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <button
              type="button"
              className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 transition-colors"
              title="Voice input (coming soon)"
            >
              <Mic className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 transition-colors"
              title="Image upload (coming soon)"
            >
              <Image className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me about your menu, orders, revenue..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={processingAI}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || processingAI}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                  inputValue.trim() && !processingAI
                    ? `bg-gradient-to-r ${getRoleColor(user?.role || '')} text-white hover:shadow-lg`
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {processingAI ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            AI powered by OpenAI • Connected to your restaurant database
          </div>
        </div>
      </div>
    </div>
  );
}