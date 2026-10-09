import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Bot, Sparkles, User, RotateCcw } from 'lucide-react';
import Nav from '../layouts/Nav';

const prompts = [
  ['Help me code', 'Help me work through a coding problem step by step.'],
  ['Explain a topic', 'Explain a topic in simple terms and give me an example.'],
  ['Brainstorm ideas', 'Help me brainstorm creative ideas for a project.'],
];

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [messages, busy]);

  async function sendMessage(value = input) {
    const text = value.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not get a response. Try again.');
      if (typeof data.reply !== 'string') throw new Error('The assistant response was invalid.');
      setMessages((current) => [...current, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function reset() {
    if (busy) return;
    setMessages([]);
    setInput('');
    setError('');
  }

  return (
    <div className="flex flex-col h-screen text-gray-100">
      <div className="shrink-0"><Nav /></div>
      <main className="flex flex-col flex-1 min-h-0 w-full max-w-5xl mx-auto px-4 sm:px-6">
        <header className="flex items-center justify-between gap-3 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl p-3 bg-indigo-500/20 text-indigo-300"><Sparkles size={23} /></div>
            <div><h1 className="text-xl sm:text-2xl font-semibold">DogeUB AI</h1><p className="text-sm text-gray-400">Ask, learn, build, and brainstorm.</p></div>
          </div>
          <button type="button" onClick={reset} disabled={busy || !messages.length} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border border-white/15 hover:bg-white/5 disabled:opacity-40"><RotateCcw size={15} /><span className="hidden sm:inline">New chat</span></button>
        </header>
        <section className="flex-1 min-h-0 overflow-y-auto py-6">
          {!messages.length ? (
            <div className="min-h-full flex flex-col items-center justify-center text-center py-8">
              <div className="rounded-3xl p-5 bg-indigo-500/15 text-indigo-300 mb-5"><Bot size={36} /></div>
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">What are we working on?</h2>
              <p className="text-gray-400 max-w-md mb-7">Choose a starter or type your own message. AI can make mistakes, so check important information.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl text-left">
                {prompts.map(([title, prompt]) => <button key={title} type="button" onClick={() => sendMessage(prompt)} className="rounded-2xl border border-white/10 p-4 hover:bg-white/5 transition-colors"><span className="block font-medium mb-1">{title}</span><span className="block text-sm text-gray-400">{prompt}</span></button>)}
              </div>
            </div>
          ) : <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`shrink-0 rounded-xl w-9 h-9 flex items-center justify-center ${message.role === 'user' ? 'bg-white/10' : 'bg-indigo-500/20 text-indigo-300'}`}>{message.role === 'user' ? <User size={18} /> : <Bot size={19} />}</div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 leading-7 whitespace-pre-wrap break-words ${message.role === 'user' ? 'bg-indigo-500/20' : 'bg-white/[0.04] border border-white/[0.07]'}`}>{message.content}</div>
            </div>)}
            {busy && <div className="flex items-center gap-3 text-gray-400"><Bot size={20} /><span className="animate-pulse">DogeUB AI is thinking…</span></div>}
            <div ref={endRef} />
          </div>}
          {error && <p role="alert" className="mt-4 max-w-3xl mx-auto text-sm text-amber-300">{error}</p>}
        </section>
        <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="max-w-3xl w-full mx-auto pb-5 pt-2">
          <div className="flex items-end gap-2 rounded-2xl border border-white/15 bg-black/10 focus-within:border-indigo-400/60 px-3 py-2">
            <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Message DogeUB AI…" rows={1} maxLength={6000} disabled={busy} className="flex-1 resize-none bg-transparent outline-none px-2 py-2 max-h-40 min-h-10 disabled:opacity-60" aria-label="Message DogeUB AI" />
            <button type="submit" disabled={busy || !input.trim()} className="rounded-xl p-3 bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-35" aria-label="Send message"><ArrowUp size={19} /></button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">Enter to send · Shift + Enter for a new line · Never share passwords or private information.</p>
        </form>
      </main>
    </div>
  );
}
