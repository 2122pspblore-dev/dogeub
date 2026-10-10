import { useEffect, useMemo, useState } from 'react';
import { Smile, LayoutGrid, Search, X, Copy, Plus, Trash2, Clock3, StickyNote, Link2, Hash, Type, Check } from 'lucide-react';

const STORAGE_KEY = 'dogeub-emoji-widgets-v1';
const EMOJI_GROUPS = [
  { name: 'Smileys', emojis: '😀 😃 😄 😁 😆 😅 😂 🤣 🥲 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🫢 🫣 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 🫥 😏 😒 🙄 😬 😮‍💨 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🥳 🥸 😎 🤓 🧐 😕 🫤 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 🥹 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👹 👺 👻 👽 👾 🤖 🎃'.split(' ') },
  { name: 'Hands & people', emojis: '👋 🤚 🖐️ ✋ 🖖 🫱 🫲 🫳 🫴 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👀 👁️ 👅 👄 🫦'.split(' ') },
  { name: 'Hearts & symbols', emojis: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 🩷 🩵 🩶 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ♥️ 💌 💋 💯 💢 💥 💫 💦 💨 🕳️ 💬 🗨️ 🗯️ 💭 💤 ✨ ⭐ 🌟 💫 🔥 ⚡ ☀️ 🌈 ☁️ ❄️ ☃️ 💧 🌊 🎉 🎊 🎈 🎀 🎁 🏆 🥇 🥈 🥉 ✔️ ❌ ❗ ❓ 💡 🔔 🔕 🔒 🔓 🔑 ♻️ 🚫 ⛔ 💲 💸 💵 💳 📌 📍 🔗'.split(' ') },
  { name: 'Animals & nature', emojis: '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐻‍❄️ 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🪱 🦋 🐌 🐞 🐜 🪰 🪲 🦟 🦗 🕷️ 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦐 🦞 🦀 🐡 🐠 🐟 🐬 🐳 🦈 🐊 🐅 🐆 🦓 🦍 🦧 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🦬 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🦮 🐈 🐓 🦃 🦚 🦜 🦢 🦩 🕊️ 🐇 🦝 🦨 🦡 🦦 🦥 🐁 🐀 🐿️ 🦔 🌵 🎄 🌲 🌳 🌴 🪵 🌱 🌿 ☘️ 🍀 🎍 🪴 🎋 🍃 🍂 🍁 🍄 🌾 💐 🌷 🌹 🥀 🌺 🌸 🌼 🌻'.split(' ') },
  { name: 'Food & drink', emojis: '🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🫒 🥑 🍆 🥔 🥕 🌽 🌶️ 🫑 🥒 🥬 🥦 🧄 🧅 🥜 🫘 🌰 🍞 🥐 🥖 🫓 🥨 🥯 🥞 🧇 🧀 🍖 🍗 🥩 🥓 🍔 🍟 🍕 🌭 🥪 🌮 🌯 🫔 🥙 🧆 🥚 🍳 🥘 🍲 🫕 🥣 🥗 🍿 🧈 🧂 🥫 🍱 🍘 🍙 🍚 🍛 🍜 🍝 🍠 🍢 🍣 🍤 🍥 🥮 🍡 🥟 🥠 🥡 🦪 🍦 🍧 🍨 🍩 🍪 🎂 🍰 🧁 🥧 🍫 🍬 🍭 🍮 🍯 🍼 🥛 ☕ 🫖 🍵 🍶 🍾 🍷 🍸 🍹 🍺 🍻 🥂 🥃 🫗 🥤 🧋 🧃 🧉 🧊'.split(' ') },
  { name: 'Activities', emojis: '⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🪀 🏓 🏸 🏒 🏑 🥍 🏏 🪃 🥅 ⛳ 🪁 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🛷 ⛸️ 🥌 🎿 ⛷️ 🏂 🏋️ 🤼 🤸 ⛹️ 🤺 🤾 🏌️ 🏇 🧘 🏄 🏊 🤽 🚣 🧗 🚵 🚴 🏆 🥇 🥈 🥉 🏅 🎖️ 🏵️ 🎗️ 🎫 🎟️ 🎪 🤹 🎭 🩰 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🪘 🎷 🎺 🪗 🎸 🪕 🎻 🪈 🎲 ♟️ 🎯 🎳 🎮 🕹️ 🎰 🧩'.split(' ') },
  { name: 'Travel & places', emojis: '🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🛵 🏍️ 🛺 🚲 🛴 🛹 🛼 🚏 🛣️ 🛤️ 🛢️ ⛽ 🚨 🚥 🚦 🛑 🚧 ⚓ 🛟 ⛵ 🚤 🛳️ ⛴️ 🛥️ 🚢 ✈️ 🛩️ 🛫 🛬 🪂 💺 🚁 🚟 🚠 🚡 🛰️ 🚀 🛸 🌍 🌎 🌏 🌐 🗺️ 🧭 🏔️ ⛰️ 🌋 🗻 🏕️ 🏖️ 🏜️ 🏝️ 🏞️ 🏟️ 🏛️ 🏗️ 🧱 🏘️ 🏚️ 🏠 🏡 🏢 🏣 🏤 🏥 🏦 🏨 🏩 🏪 🏫 🏬 🏭 🏯 🏰 💒 🗼 🗽 ⛪ 🕌 🛕 🕍 ⛩️ 🕋 ⛲ ⛺ 🌁 🌃 🏙️ 🌄 🌅 🌆 🌇 🌉 🌌'.split(' ') },
  { name: 'Objects', emojis: '⌚ 📱 📲 💻 🖥️ 🖨️ ⌨️ 🖱️ 🖲️ 💽 💾 💿 📀 🧮 🎥 🎞️ 📽️ 📺 📷 📸 📹 📼 🔍 🔎 🕯️ 💡 🔦 🏮 🪔 📔 📕 📖 📗 📘 📙 📚 📓 📒 📃 📜 📄 📰 🗞️ 📑 🔖 🏷️ 💰 🪙 💴 💵 💶 💷 💸 💳 🧾 ✉️ 📧 📨 📩 📤 📥 📦 📫 📪 📬 📭 📮 🗳️ ✏️ ✒️ 🖋️ 🖊️ 🖌️ 🖍️ 📝 💼 📁 📂 🗂️ 📅 📆 🗒️ 🗓️ 📇 📈 📉 📊 📋 📌 📍 📎 🖇️ 📏 📐 ✂️ 🗃️ 🗄️ 🗑️ 🔒 🔓 🔏 🔐 🔑 🗝️ 🔨 🪓 ⛏️ ⚒️ 🛠️ 🗡️ ⚔️ 💣 🪃 🏹 🛡️ 🔧 🪛 🔩 ⚙️ 🗜️ ⚖️ 🔗 ⛓️ 🧰 🧲 🪜 ⚗️ 🧪 🧫 🧬 🔬 🔭 📡 💉 🩹 🩺 🩻 🚪 🛏️ 🛋️ 🪑 🚽 🚿 🛁 🪒 🧴 🧷 🧹 🧺 🧻 🪣 🧼 🫧 🪥 🧽 🧯 🛒'.split(' ') },
  { name: 'Flags & misc', emojis: '🏳️ 🏴 🏁 🚩 🏳️‍🌈 🏳️‍⚧️ 🇺🇸 🇬🇧 🇨🇦 🇲🇽 🇧🇷 🇯🇵 🇰🇷 🇨🇳 🇮🇳 🇵🇰 🇵🇭 🇩🇪 🇫🇷 🇮🇹 🇪🇸 🇳🇬 🇿🇦 🇦🇺 🇳🇿 🏴‍☠️ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 #️⃣ *️⃣ 0️⃣ ⏩ ⏪ ⏫ ⏬ ▶️ ⏸️ ⏹️ ⏺️ ⏭️ ⏮️ 🔀 🔁 🔂 🔄 🔃 ➕ ➖ ➗ ✖️ ♾️ 💱 🔚 🔙 🔛 🔝 🔜'.split(' ') },
];
const WIDGET_TYPES = [
  { id: 'clock', label: 'Clock', description: 'A live clock', icon: Clock3 },
  { id: 'note', label: 'Sticky note', description: 'Editable note', icon: StickyNote },
  { id: 'counter', label: 'Counter', description: 'Tap to count up or down', icon: Hash },
  { id: 'link', label: 'Quick link', description: 'Save a URL shortcut', icon: Link2 },
  { id: 'text', label: 'Text card', description: 'Your own title and text', icon: Type },
];
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { widgets: [] }; }
  catch { return { widgets: [] }; }
}
function saveSaved(value) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch {}
}
export default function EmojiWidgets() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('emoji');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Smileys');
  const [saved, setSaved] = useState(loadSaved);
  const [adding, setAdding] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const listener = () => { setOpen(true); setTab('emoji'); };
    window.addEventListener('dogeub-open-emoji-widgets', listener);
    return () => window.removeEventListener('dogeub-open-emoji-widgets', listener);
  }, []);
  useEffect(() => { saveSaved(saved); }, [saved]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const allEmojis = useMemo(() => EMOJI_GROUPS.flatMap(group => group.emojis.map(emoji => ({ emoji, group: group.name }))), []);
  const filtered = useMemo(() => allEmojis.filter(item => (!search || item.emoji.includes(search) || item.group.toLowerCase().includes(search.toLowerCase())) && (!category || search || item.group === category), [allEmojis, search, category]);
  const notify = (text) => { setToast(text); window.setTimeout(() => setToast(''), 1600); };
  const copyEmoji = async (emoji) => {
    try { await navigator.clipboard.writeText(emoji); notify('Copied ' + emoji); }
    catch { setSearch(emoji); notify('Emoji selected — copy it from search'); }
  };
  const startAdd = (type) => { setAdding(type); setTitle(type === 'note' ? 'My note' : type === 'link' ? 'Quick link' : type === 'counter' ? 'Counter' : type === 'clock' ? 'Clock' : 'My widget'); setBody(type === 'note' ? '' : type === 'link' ? 'https://' : type === 'counter' ? '0' : ''); };
  const addWidget = (event) => {
    event.preventDefault();
    const type = adding;
    if (!type) return;
    if (type === 'link') {
      try { const url = new URL(body); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); }
      catch { notify('Enter a valid http(s) URL'); return; }
    }
    setSaved(old => ({ ...old, widgets: [...old.widgets, { id: Date.now(), type, title: title.trim() || WIDGET_TYPES.find(item => item.id === type)?.label || 'Widget', body, count: Number(body) || 0, created: Date.now() }] }));
    setAdding(null); setTitle(''); setBody(''); setTab('widgets'); notify('Widget added');
  };
  const updateWidget = (id, patch) => setSaved(old => ({ ...old, widgets: old.widgets.map(widget => widget.id === id ? { ...widget, ...patch } : widget) }));
  const removeWidget = (id) => setSaved(old => ({ ...old, widgets: old.widgets.filter(widget => widget.id !== id) }));
  const openLink = (url) => { try { const parsed = new URL(url); if (['http:', 'https:'].includes(parsed.protocol)) window.open(parsed.href, '_blank', 'noopener,noreferrer'); } catch {} };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[13000] flex items-center justify-center bg-black/55 p-3 text-white backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !adding) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-label="Emoji and custom widgets" className="flex max-h-[min(86vh,760px)] w-[min(94vw,780px)] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#101827]/95 shadow-2xl shadow-black/50 backdrop-blur-2xl">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200"><Smile size={21}/></span>
          <div className="min-w-0 flex-1"><h2 className="text-base font-semibold">Emoji & Widgets</h2><p className="text-xs text-white/50">Emoji picker · your own mini widgets</p></div>
          <button onClick={() => setOpen(false)} aria-label="Close emoji and widgets" className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white"><X size={18}/></button>
        </header>
        <div className="flex gap-2 border-b border-white/10 px-4 py-3">
          <button onClick={() => { setTab('emoji'); setAdding(null); }} className={'flex items-center gap-2 rounded-xl px-3 py-2 text-sm ' + (tab === 'emoji' ? 'bg-cyan-400/15 text-cyan-100' : 'text-white/60 hover:bg-white/5')}><Smile size={16}/> Emoji picker</button>
          <button onClick={() => { setTab('widgets'); setAdding(null); }} className={'flex items-center gap-2 rounded-xl px-3 py-2 text-sm ' + (tab === 'widgets' ? 'bg-cyan-400/15 text-cyan-100' : 'text-white/60 hover:bg-white/5')}><LayoutGrid size={16}/> Custom widgets <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{saved.widgets.length}</span></button>
        </div>
        {tab === 'emoji' && <div className="flex min-h-0 flex-1 flex-col p-4">
          <label className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"><Search size={16} className="text-white/40"/><input autoFocus value={search} onChange={event => setSearch(event.target.value)} placeholder="Search emojis or categories…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/35"/>{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={14}/></button>}</label>
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{EMOJI_GROUPS.map(group => <button key={group.name} onClick={() => { setCategory(group.name); setSearch(''); }} className={'shrink-0 rounded-lg px-3 py-1.5 text-xs ' + (category === group.name && !search ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/5')}>{group.name}</button>)}</div>
          <div className="grid min-h-0 flex-1 grid-cols-7 gap-1 overflow-y-auto pr-1 sm:grid-cols-10 md:grid-cols-12">{filtered.map((item, index) => <button key={item.emoji + item.group + index} title={'Copy ' + item.emoji} aria-label={'Copy emoji ' + item.emoji} onClick={() => copyEmoji(item.emoji)} className="flex aspect-square items-center justify-center rounded-xl text-2xl transition hover:scale-110 hover:bg-white/10 focus:bg-cyan-400/20 focus:outline-none">{item.emoji}</button>)}</div>
          <p className="mt-3 text-[11px] text-white/40">Tap an emoji to copy it. Includes hundreds of common emoji; availability can vary by device font.</p>
        </div>}
        {tab === 'widgets' && <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!adding && <><div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">{WIDGET_TYPES.map(type => { const Icon = type.icon; return <button key={type.id} onClick={() => startAdd(type.id)} className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-400/10"><span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-200"><Icon size={18}/></span><span className="block text-sm font-semibold">{type.label}</span><span className="mt-1 block text-[11px] leading-4 text-white/45">{type.description}</span><span className="mt-3 flex items-center gap-1 text-[11px] text-cyan-200"><Plus size={13}/> Add widget</span></button>; })}</div>
          <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Your widgets</h3><span className="text-xs text-white/40">Saved in this browser</span></div>
          {saved.widgets.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-white/45">No widgets yet. Add a clock, note, counter, link, or text card above.</div> : <div className="grid gap-3 sm:grid-cols-2">{saved.widgets.map(widget => <article key={widget.id} className="rounded-2xl border border-white/10 bg-white/[.045] p-4"><div className="mb-2 flex items-start gap-2"><div className="min-w-0 flex-1"><h4 className="truncate text-sm font-semibold">{widget.title}</h4><p className="text-[10px] uppercase tracking-wider text-white/35">{WIDGET_TYPES.find(item => item.id === widget.type)?.label}</p></div><button onClick={() => removeWidget(widget.id)} aria-label={'Delete ' + widget.title} className="rounded-lg p-1.5 text-white/40 hover:bg-red-400/10 hover:text-red-200"><Trash2 size={14}/></button></div>
          {widget.type === 'clock' && <div className="py-2 text-3xl font-light tabular-nums">{now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}<p className="mt-1 text-xs text-white/45">{now.toLocaleDateString([], {weekday:'long',month:'short',day:'numeric'})}</p></div>}
          {widget.type === 'note' && <textarea value={widget.body} onChange={event => updateWidget(widget.id,{body:event.target.value})} placeholder="Write anything…" className="min-h-24 w-full resize-y rounded-xl bg-black/20 p-3 text-sm outline-none focus:ring-1 focus:ring-cyan-300/40"/>}
          {widget.type === 'counter' && <div className="flex items-center justify-between rounded-xl bg-black/20 p-3"><button onClick={() => updateWidget(widget.id,{count:(widget.count || 0)-1})} className="h-9 w-9 rounded-lg bg-white/10 text-lg">−</button><span className="text-2xl tabular-nums">{widget.count || 0}</span><button onClick={() => updateWidget(widget.id,{count:(widget.count || 0)+1})} className="h-9 w-9 rounded-lg bg-cyan-400/15 text-lg text-cyan-100">+</button></div>}
          {widget.type === 'link' && <><p className="mb-3 truncate text-xs text-white/50">{widget.body}</p><button onClick={() => openLink(widget.body)} className="rounded-lg bg-cyan-400/15 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/25">Open link ↗</button></>}
          {widget.type === 'text' && <p className="whitespace-pre-wrap text-sm leading-6 text-white/75">{widget.body || 'Your text will appear here.'}</p>}
          </article>)}</div>}</>}
          {adding && <form onSubmit={addWidget} className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[.04] p-4"><button type="button" onClick={() => setAdding(null)} className="mb-4 text-xs text-white/50 hover:text-white">← Back to widgets</button><h3 className="mb-4 text-base font-semibold">Add {WIDGET_TYPES.find(item => item.id === adding)?.label}</h3><label className="mb-3 block text-xs text-white/60">Widget title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={48} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"/></label><label className="mb-4 block text-xs text-white/60">{adding === 'note' ? 'Note content' : adding === 'link' ? 'Web address (https://...)' : adding === 'counter' ? 'Starting count' : 'Text content'}{adding !== 'clock' && <textarea value={body} onChange={event => setBody(event.target.value)} maxLength={adding === 'link' ? 2048 : 4000} rows={adding === 'note' || adding === 'text' ? 4 : 2} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40" placeholder={adding === 'note' ? 'Remember…' : adding === 'link' ? 'https://example.com' : adding === 'counter' ? '0' : 'Write something…'}/>}</label><div className="flex justify-end gap-2"><button type="button" onClick={() => setAdding(null)} className="rounded-xl px-4 py-2 text-sm text-white/60 hover:bg-white/5">Cancel</button><button type="submit" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">Add widget</button></div></form>}
        </div>}
        {toast && <div role="status" className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/10 bg-[#1b2a40] px-4 py-2 text-xs shadow-xl"><Check size={14} className="text-emerald-300"/>{toast}</div>}
      </section>
    </div>
  );
}
