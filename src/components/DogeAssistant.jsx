import { useEffect, useRef, useState } from 'react';
import { Bot, Mic, MicOff, Send, X, Sparkles, Settings2, Palette, Moon, Sun, PawPrint, AppWindow, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOptions } from '../utils/optionsContext';
import { themeConfig } from '../utils/config';

const themeAliases = {
  midnight: 'Midnight', default: 'Midnight', mocha: 'Mocha', brown: 'Mocha',
  forest: 'Forest', green: 'Forest', dark: 'Dark', black: 'Dark',
  stellar: 'Stellar', space: 'Stellar', pink: 'Hot Pink', 'hot pink': 'Hot Pink',
  light: 'Light', bright: 'Light', paper: 'Paper', beige: 'Paper',
};

export default function DogeAssistant() {
  const { options, updateOption } = useOptions();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hey! I’m Doge, your OS assistant. Tell me what you want to change—like “make it dark”, “switch to Forest theme”, or “turn off Pet Buddy”.' }]);
  const [status, setStatus] = useState('Ready to help');
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  useEffect(() => {
    const openAssistant = () => setOpen(true);
    window.addEventListener('dogeub-open-assistant', openAssistant);
    return () => {
      window.removeEventListener('dogeub-open-assistant', openAssistant);
      recognitionRef.current?.stop?.();
    };
  }, []);

  const say = (text) => {
    setMessages((old) => [...old, { role: 'assistant', text }]);
    setStatus('Done');
  };

  const handleCommand = (raw) => {
    const text = raw.trim();
    const lower = text.toLowerCase();
    if (!text) return;
    setMessages((old) => [...old, { role: 'user', text }]);
    setInput('');
    setStatus('Working…');

    const themeRequest = lower.match(/(?:theme|look|style|color|colour)(?: to| like|:)?\s+(midnight|default|mocha|brown|forest|green|dark|black|stellar|space|pink|hot pink|light|bright|paper|beige)/)
      || lower.match(/^(midnight|default|mocha|brown|forest|green|dark|black|stellar|space|pink|hot pink|light|bright|paper|beige)(?: theme)?$/);
    if (themeRequest) {
      const wanted = themeAliases[themeRequest[1]];
      const selected = themeConfig.find((item) => item.option.toLowerCase() === wanted.toLowerCase());
      if (selected) {
        updateOption(selected.value);
        say('Done — I switched your site to the ' + selected.option + ' theme.');
      } else say('I couldn’t find that theme. Try Midnight, Mocha, Forest, Dark, Stellar, Hot Pink, Light, or Paper.');
      return;
    }

    if (/\b(light mode|make it light|bright mode|switch to light)\b/.test(lower)) {
      const selected = themeConfig.find((item) => item.option === 'Light');
      updateOption(selected.value); say('Light theme enabled.'); return;
    }
    if (/\b(dark mode|make it dark|darken|switch to dark|night mode)\b/.test(lower)) {
      const selected = themeConfig.find((item) => item.option === 'Dark');
      updateOption(selected.value); say('Dark theme enabled.'); return;
    }
    if (/pet buddy/.test(lower) && /off|hide|disable|turn off|remove/.test(lower)) {
      updateOption({ petBuddyEnabled: false }); say('Pet Buddy is turned off.'); return;
    }
    if (/pet buddy/.test(lower) && /on|show|enable|turn on/.test(lower)) {
      updateOption({ petBuddyEnabled: true }); say('Pet Buddy is turned on.'); return;
    }
    if (/\b(tabs bar|tab bar)\b/.test(lower) && /off|hide|disable|turn off/.test(lower)) {
      updateOption({ showTb: false }); say('The tabs bar is now hidden.'); return;
    }
    if (/\b(tabs bar|tab bar)\b/.test(lower) && /on|show|enable|turn on/.test(lower)) {
      updateOption({ showTb: true }); say('The tabs bar is enabled.'); return;
    }
    if (/\b(compact header|shrink header)\b/.test(lower)) {
      const enabled = !/off|disable|turn off/.test(lower);
      updateOption({ shrinkHeader: enabled }); say('Compact app header ' + (enabled ? 'enabled.' : 'disabled.')); return;
    }
    if (/\b(apps per page|items per page)\b/.test(lower)) {
      const amount = lower.match(/\b(10|20|30|40|50|all)\b/);
      if (!amount) { say('Try “show 30 apps per page” or “show all apps”.'); return; }
      const value = amount[1] === 'all' ? 999 : Number(amount[1]);
      updateOption({ itemsPerPage: value }); say('Apps per page set to ' + (amount[1] === 'all' ? 'all' : value) + '.'); return;
    }
    if (/\b(open|go to|show)\b/.test(lower) && /settings/.test(lower)) {
      setOpen(false); navigate('/settings'); return;
    }
    if (/\b(open|launch|show)\b/.test(lower) && /os studio|studio/.test(lower)) {
      window.dispatchEvent(new CustomEvent('dogeub-open-os-studio', { detail: { tab: 'desktop' } }));
      say('Opening OS Studio.'); return;
    }
    if (/\b(open|launch|show)\b/.test(lower) && /doge hub|hub/.test(lower)) {
      window.dispatchEvent(new CustomEvent('dogeub-open-hub', { detail: { tab: 'control' } }));
      say('Opening Doge Hub.'); return;
    }
    if (/\b(open|go to|launch)\b/.test(lower) && /home/.test(lower)) {
      setOpen(false); navigate('/'); return;
    }
    if (/\b(open|go to|launch)\b/.test(lower) && /browser|search/.test(lower)) {
      setOpen(false); navigate('/search'); return;
    }
    if (/\b(help|what can you do|commands)\b/.test(lower)) {
      say('I can switch themes (try “Forest theme” or “make it dark”), toggle Pet Buddy or the tabs bar, set apps per page, open Settings/OS Studio/Doge Hub, and navigate Home or Browser. Voice input works if your browser supports speech recognition.'); return;
    }
    say('I’m not sure how to do that yet. Try “switch to Forest theme”, “turn Pet Buddy off”, “show 30 apps per page”, or “open OS Studio”.');
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus('Voice input is not supported in this browser. Try typing instead.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    recognition.onstart = () => { setListening(true); setStatus('Listening…'); };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setListening(false);
      if (transcript) handleCommand(transcript);
      else setStatus('Didn’t catch that—try again.');
    };
    recognition.onerror = () => { setListening(false); setStatus('Voice input stopped. Check microphone permission or type your command.'); };
    recognition.onend = () => setListening(false);
    try { recognition.start(); } catch { setListening(false); setStatus('Could not start voice input.'); }
  };

  return (
    <div className="fixed bottom-20 right-4 z-[12000] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section className="flex h-[min(70vh,540px)] w-[min(92vw,370px)] flex-col overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#0b1020]/95 text-white shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl">
          <header className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-cyan-400/10 to-violet-400/10 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-300/10 text-cyan-200"><Bot size={24}/></div>
            <div className="min-w-0 flex-1"><div className="font-semibold tracking-wide">Doge Assistant</div><div className="text-xs text-white/50">OS controls · {status}</div></div>
            <button onClick={() => setOpen(false)} aria-label="Close Doge Assistant" className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white"><X size={18}/></button>
          </header>
          <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
            {[
              { label: 'Dark theme', icon: Moon, command: 'make it dark' },
              { label: 'Forest theme', icon: Palette, command: 'switch to Forest theme' },
              { label: 'OS Studio', icon: AppWindow, command: 'open OS Studio' },
            ].map((item) => <button key={item.label} onClick={() => handleCommand(item.command)} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.05] px-3 py-2 text-xs text-white/80 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"><item.icon size={13}/>{item.label}</button>)}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => <div key={index} className={'flex ' + (message.role === 'user' ? 'justify-end' : 'justify-start')}><div className={'max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-3 text-sm leading-relaxed ' + (message.role === 'user' ? 'rounded-br-md bg-cyan-300/15 text-cyan-50' : 'rounded-bl-md border border-white/10 bg-white/[.055] text-white/85')}>{message.text}</div></div>)}
            <div ref={bottomRef}/>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); handleCommand(input); }} className="flex items-center gap-2 border-t border-white/10 bg-black/20 p-3">
            <button type="button" onClick={startVoice} title={listening ? 'Stop listening' : 'Use voice'} aria-label={listening ? 'Stop listening' : 'Use voice'} className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ' + (listening ? 'border-rose-300/40 bg-rose-400/15 text-rose-200' : 'border-white/10 bg-white/[.05] text-white/70 hover:text-cyan-200')}>{listening ? <MicOff size={17}/> : <Mic size={17}/>}</button>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tell Doge what to change…" aria-label="Message Doge Assistant" className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[.06] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/50" />
            <button type="submit" aria-label="Send command" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300 text-slate-950 transition hover:bg-cyan-200"><Send size={16}/></button>
          </form>
          <div className="flex items-center justify-center gap-1.5 pb-2 text-[10px] text-white/35"><Settings2 size={11}/> Changes apply to this DogeUB browser profile</div>
        </section>
      )}
      <button onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close Doge Assistant' : 'Open Doge Assistant'} title="Doge Assistant" className="group relative flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/40 bg-[#0c1425] text-cyan-200 shadow-xl shadow-cyan-950/40 transition hover:-translate-y-0.5 hover:border-cyan-100/70 hover:text-white">
        <span className="absolute inset-0 rounded-2xl bg-cyan-300/10 opacity-0 transition group-hover:opacity-100"/>
        {open ? <X size={23}/> : <><Sparkles size={23}/><span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0c1425] bg-emerald-400"/></>}
      </button>
    </div>
  );
}
