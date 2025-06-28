import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Mic, Image, Sparkles, Database, Brain, AlertTriangle, Clock, Table, Code } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { queryAIBackend, QueryAIBackendResponse } from '../lib/queryAIBackend';

export default function AIAgent() {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingQueryAI, setProcessingQueryAI] = useState(false);
  const [error, setError] = useState<string>('');
  const [queryAIResult, setQueryAIResult] = useState<QueryAIBackendResponse | null>(null);
  const { user } = useAuth();

  const getRoleColor = (role: string) => {
    const colors = {
      manager: 'from-blue-500 to-blue-600',
      waiter: 'from-green-500 to-green-600',
      kitchen: 'from-orange-500 to-orange-600',
      customer: 'from-purple-500 to-purple-600'
    };
    return colors[role as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const handleQueryAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || processingQueryAI) return;

    const query = inputValue.trim();
    setProcessingQueryAI(true);
    setError('');
    setQueryAIResult(null);

    try {
      console.log('Sending query to QueryAI Backend:', query);
      const result = await queryAIBackend.query(query);
      
      console.log('QueryAI Backend response:', result);
      setQueryAIResult(result);
      
      if (result.error) {
        setError(result.error);
      }
      
    } catch (error: any) {
      console.error('Error querying QueryAI Backend:', error);
      setError('Failed to connect to QueryAI Backend');
    } finally {
      setProcessingQueryAI(false);
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
    if (processingQueryAI) return;
    setInputValue(question);
  };

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) {
      return <p className="text-gray-500 text-center py-4">No results found</p>;
    }

    const columns = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  {column.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column} className="px-4 py-2 text-sm text-gray-900 border-b">
                    {typeof row[column] === 'object' ? JSON.stringify(row[column]) : String(row[column] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Don't show loading if user is not logged in
  if (!user) {
    return null;
  }

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
        <div className="flex items-center justify-between">
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
                <Database className="w-4 h-4" />
                QueryAI Backend • Natural language to SQL queries
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border-x border-gray-200 overflow-hidden flex flex-col">
        {/* Error Messages */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Table className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">QueryAI Backend</h3>
              </div>
              <p className="text-blue-700 text-sm">
                Ask natural language questions about your restaurant data and get SQL-powered results.
              </p>
            </div>

            {/* Quick Questions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Try these queries:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    disabled={processingQueryAI}
                    className="text-left p-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Display */}
            {queryAIResult && (
              <div className="space-y-4">
                {queryAIResult.result && queryAIResult.result.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Table className="w-5 h-5" />
                      Query Results
                    </h4>
                    {renderTable(queryAIResult.result)}
                  </div>
                )}

                {queryAIResult.sql_query && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Generated SQL Query
                    </h4>
                    <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                      {queryAIResult.sql_query}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {processingQueryAI && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-700">Processing your query...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleQueryAI} className="flex gap-3">
            <button
              type="button"
              className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 transition-colors"
              title="Voice input (coming soon)"
              disabled
            >
              <Mic className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 transition-colors"
              title="Image upload (coming soon)"
              disabled
            >
              <Image className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                id="input_query"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={processingQueryAI ? "Processing query..." : "Ask a question about your restaurant data..."}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                disabled={processingQueryAI}
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || processingQueryAI}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                  inputValue.trim() && !processingQueryAI
                    ? `bg-gradient-to-r ${getRoleColor(user?.role || '')} text-white hover:shadow-lg`
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {processingQueryAI ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            QueryAI Backend • Natural language to SQL queries
            {processingQueryAI && <span className="text-blue-600"> • Processing your query...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}