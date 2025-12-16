import { useState, useRef, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export default function DriveBot() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  useEffect(() => {
    // Load conversations from localStorage
    const saved = localStorage.getItem('carvex-conversations');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        messages: c.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      })));
    }
  }, []);

  useEffect(() => {
    // Save conversations to localStorage
    if (conversations.length > 0) {
      localStorage.setItem('carvex-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  const startNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'Nová konverzace',
      messages: [],
      createdAt: new Date()
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversation(newConv);
    setShowHistory(false);
  };

  const selectConversation = (conv: Conversation) => {
    setCurrentConversation(conv);
    setShowHistory(false);
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversation?.id === id) {
      setCurrentConversation(null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    let conv = currentConversation;
    if (!conv) {
      conv = {
        id: Date.now().toString(),
        title: input.trim().slice(0, 50) + (input.length > 50 ? '...' : ''),
        messages: [],
        createdAt: new Date()
      };
      setConversations(prev => [conv!, ...prev]);
    }

    const updatedMessages = [...conv.messages, userMessage];
    const updatedConv = {
      ...conv,
      messages: updatedMessages,
      title: conv.messages.length === 0 ? input.trim().slice(0, 50) + (input.length > 50 ? '...' : '') : conv.title
    };

    setCurrentConversation(updatedConv);
    setConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c));
    setInput('');
    setIsLoading(true);

    try {
      // ✅ FIXED: Changed from /drivebot/chat to /bot/message
      const response = await axiosClient.post('/bot/message', {
        message: userMessage.content
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || 'Omlouvám se, nepodařilo se zpracovat váš dotaz.',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const finalConv = { ...updatedConv, messages: finalMessages };
      setCurrentConversation(finalConv);
      setConversations(prev => prev.map(c => c.id === finalConv.id ? finalConv : c));
    } catch (error: any) {
      console.error('DriveBot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Omlouvám se, došlo k chybě při zpracování vašeho dotazu. Zkuste to prosím znovu.',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, errorMessage];
      const finalConv = { ...updatedConv, messages: finalMessages };
      setCurrentConversation(finalConv);
      setConversations(prev => prev.map(c => c.id === finalConv.id ? finalConv : c));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exampleQueries = [
    'Kolik máme aktivních pronájmů?',
    'Jaké auta máme ve skladu?',
    'Ukaž mi detaily klienta s jménem Novák',
    'Kolik leadů bylo vytvořeno tento měsíc?',
    'Jaká je celková hodnota aktivních leasingů?',
    'Které smlouvy končí tento měsíc?',
    'Kolik leadů bylo vytvořeno tento měsíc?',
    'Jaká je konverzní míra z leadů na pronájmy?',
    'Zobraz TOP 10 obchodníků podle počtu konverzí',
    'Analýza průměrné doby schvalování leadů',
    'Které vozy mají nejvyšší hodnotu?',
    'Kolik zákazníků má problémy se splácením?',
    'Ukaž mi trend příjmů za poslední 3 měsíce',
    'Jaké jsou nejčastější důvody zamítnutí leadů?'
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar - History */}
      <div className={`${showHistory ? 'w-80' : 'w-0'} md:w-80 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300`}>
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nová konverzace
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-500 text-sm mt-4">Zatím žádné konverzace</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`p-3 rounded-lg cursor-pointer mb-1 group flex items-center justify-between ${
                  currentConversation?.id === conv.id
                    ? 'bg-red-100 border border-red-200'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{conv.title}</p>
                  <p className="text-xs text-gray-500">
                    {conv.createdAt.toLocaleDateString('cs-CZ')} • {conv.messages.length} zpráv
                  </p>
                </div>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile History Toggle */}
        <div className="md:hidden p-2 border-b border-gray-200 flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700">Historie konverzací</span>
        </div>

        {/* Chat Content */}
        {!currentConversation || currentConversation.messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {/* Logo/Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Carvex AI Agent</h1>
                <p className="text-lg text-gray-600 mb-1">
                  Váš seniorní datový analytik
                </p>
                <p className="text-sm text-gray-500">
                  Pokročilé analýzy nad databází CashNdrive
                </p>
              </div>

              {/* Capabilities Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {/* Analytical Capabilities */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytické schopnosti
                  </h3>
                  <ul className="text-sm text-blue-900 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Trendy & Predikce</strong> - Analýza časových řad a odhady budoucího vývoje</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Konverzní analýzy</strong> - Funnel metriky, drop-off rate, bottleneck identifikace</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Segmentace</strong> - Cohort analýzy, RFM segmentace zákazníků</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Performance metriky</strong> - KPI tracking, benchmark comparison</span>
                    </li>
                  </ul>
                </div>

                {/* Data Access */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2 text-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    Přístup k datům
                  </h3>
                  <ul className="text-sm text-purple-900 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span><strong>Leady</strong> - Všechny stavy, historie, konverze, decline reasons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span><strong>Pronájmy</strong> - Aktivní smlouvy, splátky, splatnost, rizikovost</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span><strong>Auta</strong> - Flotila, hodnoty, využití, údržba</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span><strong>Finance</strong> - Revenue, costs, P&L, cash flow</span>
                    </li>
                  </ul>
                </div>

                {/* Business Intelligence */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2 text-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Business Intelligence
                  </h3>
                  <ul className="text-sm text-green-900 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>Výkonnost týmů</strong> - Ranking, comparative analysis, growth rate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>Risk management</strong> - Late payments, collection cases, bad debt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>Operational metrics</strong> - Processing time, approval rates, efficiency</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span><strong>Customer insights</strong> - Retention, satisfaction, lifetime value</span>
                    </li>
                  </ul>
                </div>

                {/* AI Powered */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2 text-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Capabilities
                  </h3>
                  <ul className="text-sm text-orange-900 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span><strong>Natural Language</strong> - Ptejte se běžnou češtinou</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span><strong>Context Awareness</strong> - Pamatuji si kontext konverzace</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span><strong>Smart Recommendations</strong> - Navrhuji další kroky a akce</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span><strong>Multi-turn Queries</strong> - Navazující dotazy bez opakování</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Power Info */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-6 mb-8 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Powered by Azure OpenAI GPT-4</h3>
                    <p className="text-sm text-gray-300">Enterprise-grade AI s přímým přístupem k produkční databázi</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">100%</div>
                    <div className="text-xs text-gray-400">Data Coverage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">Real-time</div>
                    <div className="text-xs text-gray-400">Query Speed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">∞</div>
                    <div className="text-xs text-gray-400">Query Types</div>
                  </div>
                </div>
              </div>

              {/* Example Queries */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Vyzkoušejte pokročilé dotazy:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {exampleQueries.map((query, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(query);
                        inputRef.current?.focus();
                      }}
                      className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 hover:shadow-md transition-all text-sm text-gray-700 group"
                    >
                      <span className="group-hover:text-red-700">{query}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {currentConversation.messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-red-700 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-red-200' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ptejte se na cokoliv... Jsem váš seniorní datový analytik s přístupem ke všem datům."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                style={{ minHeight: '48px', maxHeight: '200px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              <span className="font-semibold text-gray-700">Carvex AI</span> • Powered by <span className="text-blue-600">Azure OpenAI GPT-4</span> • Real-time Database Access • Seniorní Analytik
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
