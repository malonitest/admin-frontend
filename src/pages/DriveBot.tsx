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
      const response = await axiosClient.post('/drivebot/chat', {
        message: userMessage.content,
        conversationHistory: updatedMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
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
    'Které smlouvy končí tento měsíc?'
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
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="max-w-2xl w-full">
              {/* Logo/Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Carvex AI Agent</h1>
                <p className="text-gray-600">
                  Váš inteligentní asistent pro dotazy nad databází CashNdrive
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Co umím?
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 🔍 <strong>Vyhledávání</strong> - podle jména, VIN, telefonu, emailu</li>
                  <li>• 📊 <strong>Statistiky</strong> - leady, pronájmy, auta, klienti, obchodníci</li>
                  <li>• 📋 <strong>Přehledy</strong> - poslední záznamy, stavy, trendy</li>
                  <li>• 💰 <strong>Finance</strong> - transakce, faktury, hodnoty pronájmů</li>
                  <li>• 👔 <strong>Obchodníci</strong> - týmy, statistiky, výkony</li>
                  <li>• 📄 <strong>Dokumenty</strong> - přehled všech dokumentů</li>
                  <li>• 🤖 <strong>Obecné dotazy</strong> - odpovím na cokoliv!</li>
                </ul>
              </div>

              {/* Info Box - Powered by GPT-4 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Plnohodnotný AI asistent
                </h3>
                <p className="text-sm text-green-800">
                  Jsem napojený na Azure AI (GPT-4) a mám přístup k celé databázi CashNdrive. Můžu odpovídat na jakékoliv dotazy!
                </p>
              </div>

              {/* Example Queries */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Vyzkoušejte například:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {exampleQueries.map((query, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(query);
                        inputRef.current?.focus();
                      }}
                      className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors text-sm text-gray-700"
                    >
                      {query}
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
        <div className="border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Zadejte váš dotaz..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                style={{ minHeight: '48px', maxHeight: '200px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Carvex AI | Powered by Azure OpenAI GPT-4 | Plný přístup k databázi CashNdrive
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
