import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Bot, MessageSquare, Sparkles, GitCompareArrows, Bookmark, Plus } from 'lucide-react';
import { Header } from '../components/Header';
import { useGalaxy } from '../context/GalaxyContext';

const suggestions = [
  'I need a phone for college. Good battery, good camera for notes and photos, and budget under ₹40,000.',
  'What is the best Samsung phone for gaming under ₹30,000?',
  'Suggest a flagship with the best camera',
  'Best foldable Samsung phone for business use',
];

const sidebar = [
  { label: 'New Conversation', icon: Plus, active: true },
  { label: 'Recommended for you', icon: Sparkles },
  { label: 'Compare', icon: GitCompareArrows },
  { label: 'Saved', icon: Bookmark },
];

export default function Chat() {
  const { API, persona } = useGalaxy();
  const [sessionId] = useState(() => `session-${crypto.randomUUID()}`);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || streaming) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setStreaming(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text, persona }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();
        for (const p of parts) {
          if (!p.startsWith('data: ')) continue;
          const payload = p.slice(6);
          if (payload === '[DONE]') continue;
          setMessages(m => {
            const next = [...m];
            next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + payload };
            return next;
          });
        }
      }
    } catch (e) {
      setMessages(m => {
        const next = [...m];
        next[next.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header variant="inner" />
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-1">
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1B4EFF] flex items-center justify-center mb-2">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="font-bold text-black">Galaxy AI</div>
              <div className="text-xs text-gray-500">Your smart assistant</div>
            </div>
            {sidebar.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  data-testid={`chat-sidebar-${s.label.replace(/ /g, '-').toLowerCase()}`}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${s.active ? 'bg-[#E8F0FE] text-[#1B4EFF]' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Icon className="w-4 h-4" /> {s.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat area */}
        <main className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_28px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden" style={{ minHeight: '70vh' }}>
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1B4EFF] flex items-center justify-center mb-4">
                <Bot className="w-9 h-9 text-white" />
              </div>
              <h3 className="font-display text-2xl font-extrabold text-black">Describe your ideal phone</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">Tell me what you need in your own words.</p>
              <div className="mt-6 grid sm:grid-cols-2 gap-3 max-w-xl w-full">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    data-testid={`chat-suggestion-${i}`}
                    onClick={() => send(s)}
                    className="text-left text-sm p-3 rounded-2xl border border-gray-100 hover:border-[#1B4EFF] hover:bg-blue-50/40 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#1B4EFF] text-white' : 'bg-gray-50 text-black border border-gray-100'}`}>
                    {m.content || (streaming && i === messages.length - 1 ? (
                      <div className="flex"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
                    ) : '')}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-1 border border-gray-100 focus-within:border-[#1B4EFF] transition-colors">
              <input
                data-testid="chat-input-field"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Type your message…"
                className="flex-1 bg-transparent py-3 outline-none text-sm"
              />
              <button
                data-testid="chat-send-btn"
                onClick={() => send()}
                disabled={streaming || !input.trim()}
                className="w-10 h-10 rounded-full bg-[#1B4EFF] hover:bg-[#1428A0] disabled:bg-gray-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-400 text-center">Galaxy AI is powered by Gemini. Responses may vary.</div>
          </div>
        </main>
      </div>
    </div>
  );
}
