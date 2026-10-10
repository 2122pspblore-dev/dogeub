import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, Check, FileText, Image, LogOut, MessageCircle,
  MessagesSquare, Paperclip, Plus, Search, Send, Settings, ShieldCheck,
  Users, X, LoaderCircle, LockKeyhole, UserRound
} from "lucide-react";
import { formatSize, listFiles } from "../utils/fileStore";

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const MAX_AVATAR_BYTES = 512 * 1024;

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body && typeof options.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(data.error || "The Messages service could not complete that request.");
  return data;
}

const readAsDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(new Error("Could not read that file."));
  reader.readAsDataURL(blob);
});

const relativeTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = Date.now();
  const elapsed = Math.max(0, now - date.getTime());
  if (elapsed < 60_000) return "now";
  if (elapsed < 60 * 60_000) return Math.floor(elapsed / 60_000) + "m";
  if (elapsed < 24 * 60 * 60_000) return Math.floor(elapsed / (60 * 60_000)) + "h";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

function Avatar({ user, size = "md" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [user?.avatarUrl]);
  const dimensions = size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <span className={"inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-300/20 to-violet-400/20 font-bold text-cyan-100 " + dimensions}>
      {user?.avatarUrl && !failed
        ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
        : (user?.username?.trim()?.[0]?.toUpperCase() || <UserRound size={18} />)}
    </span>
  );
}

function Spinner({ small = false }) {
  return <LoaderCircle size={small ? 15 : 20} className="animate-spin" />;
}

export default function Messages() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [authMode, setAuthMode] = useState("register");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [appError, setAppError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeChannel, setActiveChannel] = useState("global");
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [filesOpen, setFilesOpen] = useState(false);
  const [dogeFiles, setDogeFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [attachingId, setAttachingId] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [avatarDraft, setAvatarDraft] = useState("");
  const [clearAvatar, setClearAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [reportingId, setReportingId] = useState(null);
  const messageListRef = useRef(null);
  const shouldAutoScroll = useRef(true);
  const messageInputRef = useRef(null);

  useEffect(() => {
    let alive = true;
    apiRequest("/api/messages/session")
      .then((data) => { if (alive) setSession(data.user || null); })
      .catch((error) => { if (alive) setAppError(error.message); })
      .finally(() => { if (alive) setSessionLoading(false); });
    return () => { alive = false; };
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiRequest("/api/messages/conversations");
      setConversations(data.conversations || []);
    } catch (error) {
      if (error.message && !error.message.startsWith("Sign in to DOGEUB")) setAppError(error.message);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!session) return;
    if (activeChannel === "dm" && !selectedPeer) {
      setMessages([]);
      return;
    }
    const query = activeChannel === "global"
      ? "?channel=global"
      : "?channel=dm&with=" + encodeURIComponent(selectedPeer.id);
    try {
      const data = await apiRequest("/api/messages/messages" + query);
      const next = data.messages || [];
      setMessages((previous) => {
        if (previous.length === next.length && previous.at(-1)?.id === next.at(-1)?.id) return previous;
        if (next.length > previous.length) shouldAutoScroll.current = true;
        return next;
      });
      setAppError("");
    } catch (error) {
      setAppError(error.message);
    }
  }, [session, activeChannel, selectedPeer]);

  useEffect(() => {
    if (!session) return undefined;
    loadMessages();
    loadConversations();
    const interval = window.setInterval(() => {
      loadMessages();
      loadConversations();
    }, 3500);
    return () => window.clearInterval(interval);
  }, [session, loadMessages, loadConversations]);

  useEffect(() => {
    if (!shouldAutoScroll.current) return;
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const query = userSearch.trim();
    if (!session || query.length < 2) {
      setUserResults([]);
      setSearchingUsers(false);
      return undefined;
    }
    let alive = true;
    const timer = window.setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const data = await apiRequest("/api/messages/users?q=" + encodeURIComponent(query));
        if (alive) setUserResults(data.users || []);
      } catch (error) {
        if (alive) setAppError(error.message);
      } finally {
        if (alive) setSearchingUsers(false);
      }
    }, 250);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [session, userSearch]);

  const startConversation = (peer) => {
    setSelectedPeer(peer);
    setActiveChannel("dm");
    setUserSearch("");
    setUserResults([]);
    setMessageDraft("");
    setPendingAttachment(null);
    setMessages([]);
    shouldAutoScroll.current = true;
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setAuthBusy(true);
    setAppError("");
    try {
      const endpoint = authMode === "register" ? "/api/messages/register" : "/api/messages/login";
      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });
      setSession(data.user);
      setAuthPassword("");
      setProfileUsername(data.user.username);
      setNotice(authMode === "register" ? "Welcome to DOGEUB Messages." : "You're signed in.");
    } catch (error) {
      setAppError(error.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = async () => {
    try { await apiRequest("/api/messages/logout", { method: "POST", body: "{}" }); } catch {}
    setSession(null);
    setMessages([]);
    setConversations([]);
    setSelectedPeer(null);
    setActiveChannel("global");
    setPendingAttachment(null);
    setNotice("");
    setAppError("");
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (sending) return;
    const text = messageDraft.trim();
    if (!text && !pendingAttachment) return;
    setSending(true);
    setAppError("");
    try {
      await apiRequest("/api/messages/messages", {
        method: "POST",
        body: JSON.stringify({
          channel: activeChannel,
          recipientId: activeChannel === "dm" ? selectedPeer?.id : undefined,
          text,
          attachmentId: pendingAttachment?.id
        })
      });
      setMessageDraft("");
      setPendingAttachment(null);
      shouldAutoScroll.current = true;
      await Promise.all([loadMessages(), loadConversations()]);
      messageInputRef.current?.focus();
    } catch (error) {
      setAppError(error.message);
    } finally {
      setSending(false);
    }
  };

  const openDogeFiles = async () => {
    setFilesOpen(true);
    setFilesLoading(true);
    setAppError("");
    try {
      const data = await listFiles();
      setDogeFiles(data || []);
    } catch (error) {
      setAppError("Could not open DogeFiler: " + error.message);
    } finally {
      setFilesLoading(false);
    }
  };

  const attachFromDogeFiles = async (file) => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAppError("Messages attachments are limited to 4 MB. Choose a smaller file from DogeFiler.");
      return;
    }
    setAttachingId(file.id);
    setAppError("");
    try {
      const dataUrl = await readAsDataUrl(file.blob);
      const base64 = dataUrl.split(",")[1] || "";
      const data = await apiRequest("/api/messages/attachments", {
        method: "POST",
        body: JSON.stringify({
          name: file.name,
          type: file.type || file.blob?.type || "application/octet-stream",
          size: file.size,
          base64
        })
      });
      setPendingAttachment(data.attachment);
      setFilesOpen(false);
      setNotice("Attached " + file.name + " from DogeFiler.");
    } catch (error) {
      setAppError(error.message);
    } finally {
      setAttachingId(null);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setAppError("");
    try {
      const body = { username: profileUsername };
      if (avatarDraft) body.avatarDataUrl = avatarDraft;
      if (clearAvatar) body.clearAvatar = true;
      const data = await apiRequest("/api/messages/profile", { method: "PATCH", body: JSON.stringify(body) });
      setSession(data.user);
      setAvatarDraft("");
      setClearAvatar(false);
      setProfileOpen(false);
      setNotice("Profile updated.");
      await loadConversations();
      await loadMessages();
    } catch (error) {
      setAppError(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const pickAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setAppError("Profile pictures must be PNG, JPG, WebP, or GIF.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAppError("Profile pictures must be 512 KB or smaller.");
      return;
    }
    try {
      setAvatarDraft(await readAsDataUrl(file));
      setClearAvatar(false);
    } catch (error) {
      setAppError(error.message);
    }
  };

  const reportMessage = async (message) => {
    setReportingId(message.id);
    try {
      await apiRequest("/api/messages/report", {
        method: "POST",
        body: JSON.stringify({ messageId: message.id, reason: "Inappropriate or abusive content" })
      });
      setNotice("Report submitted. Thanks for flagging it.");
    } catch (error) {
      setAppError(error.message);
    } finally {
      setReportingId(null);
    }
  };

  const activeTitle = activeChannel === "global" ? "Global chat" : selectedPeer?.username || "Direct message";
  const activeSubtitle = activeChannel === "global"
    ? "Everyone signed in can see messages here."
    : "Private between you and " + (selectedPeer?.username || "this user") + ".";
  const previewAvatar = avatarDraft ? avatarDraft : clearAvatar ? null : session?.avatarUrl;
  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.user?.id === selectedPeer?.id),
    [conversations, selectedPeer]
  );

  if (sessionLoading) {
    return <main className="min-h-screen px-4 pb-28 pt-16 text-white"><div className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-3xl border border-white/10 bg-slate-950/70 p-10"><Spinner /><span className="text-sm text-white/60">Connecting to DOGEUB Messages…</span></div></main>;
  }

  if (!session) {
    return (
      <main className="min-h-screen px-4 pb-28 pt-12 text-white sm:pt-20">
        <div className="mx-auto max-w-5xl">
          <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-sm text-white/65 hover:bg-white/10"><ArrowLeft size={16} /> Back</button>
          <div className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_30px_120px_rgba(0,0,0,.38)] backdrop-blur-2xl lg:grid-cols-[1.1fr_.9fr]">
            <div className="relative overflow-hidden border-b border-white/10 p-7 sm:p-10 lg:border-b-0 lg:border-r">
              <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />
              <div className="relative">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-100/20 bg-cyan-100/[.08] text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,.12)]"><MessagesSquare size={28} /></div>
                <p className="text-xs font-semibold tracking-[.25em] text-cyan-100/70">DOGEUB · COMMUNICATIONS</p>
                <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Say it here.</h1>
                <p className="mt-4 max-w-lg text-sm leading-7 text-white/55">A place for DOGEUB users to talk in the global room or start a private conversation. Make a profile, share files from DogeFiler, and find people by username.</p>
                <div className="mt-8 space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4"><Users size={19} className="mt-0.5 shrink-0 text-cyan-100" /><div><p className="text-sm font-semibold">Global + private chat</p><p className="mt-1 text-xs leading-5 text-white/45">Global messages are visible to all signed-in users. Direct messages are restricted to their two participants.</p></div></div>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-emerald-200" /><div><p className="text-sm font-semibold">Server-side profanity filter</p><p className="mt-1 text-xs leading-5 text-white/45">Messages are filtered before they're stored, with sign-in and posting rate limits.</p></div></div>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4"><Paperclip size={19} className="mt-0.5 shrink-0 text-violet-200" /><div><p className="text-sm font-semibold">DogeFiler attachments</p><p className="mt-1 text-xs leading-5 text-white/45">Share supported files up to 4 MB. Attachments are downloaded rather than executed in the chat.</p></div></div>
                </div>
                <p className="mt-7 max-w-lg text-[11px] leading-5 text-white/30">Don't post passwords, personal contact details, or anything you wouldn't want other DOGEUB users to see in the global room.</p>
              </div>
            </div>

            <div className="p-6 sm:p-10">
              <div className="mb-6 flex rounded-xl border border-white/10 bg-black/20 p-1">
                <button type="button" onClick={() => { setAuthMode("register"); setAppError(""); }} className={"flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition " + (authMode === "register" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}>Create account</button>
                <button type="button" onClick={() => { setAuthMode("login"); setAppError(""); }} className={"flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition " + (authMode === "login" ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}>Sign in</button>
              </div>
              <h2 className="text-2xl font-bold">{authMode === "register" ? "Join the chat" : "Welcome back"}</h2>
              <p className="mt-2 text-sm leading-6 text-white/45">{authMode === "register" ? "Create your DOGEUB Messages username." : "Sign in with your existing Messages account."}</p>
              <form onSubmit={handleAuth} className="mt-7 space-y-4">
                <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">Username</span><input autoComplete="username" value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" placeholder="e.g. doge_fan" className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-cyan-100/35 focus:bg-white/[.07]" /></label>
                <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">Password</span><input type="password" autoComplete={authMode === "register" ? "new-password" : "current-password"} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} required minLength={8} maxLength={128} placeholder="At least 8 characters" className="w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-cyan-100/35 focus:bg-white/[.07]" /></label>
                {authMode === "register" && <p className="text-[11px] leading-5 text-white/35">Usernames use 3–20 letters, numbers, or underscores. Passwords are stored as salted hashes.</p>}
                {appError && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[.06] px-3 py-2.5 text-xs leading-5 text-rose-100/90">{appError}</p>}
                <button type="submit" disabled={authBusy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-100 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-white disabled:cursor-wait disabled:opacity-60">{authBusy ? <Spinner small /> : <MessagesSquare size={17} />}{authMode === "register" ? "Create Messages account" : "Sign in to Messages"}</button>
              </form>
              <p className="mt-5 text-center text-[11px] leading-5 text-white/30">This account is for DOGEUB Messages. It is separate from your browser, email, and other accounts.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-2 pb-24 pt-4 text-white sm:px-4 sm:pt-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 shadow-[0_12px_48px_rgba(0,0,0,.16)] backdrop-blur-2xl sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-100/20 bg-cyan-100/[.08] text-cyan-100"><MessagesSquare size={21} /></div>
            <div className="min-w-0"><h1 className="truncate text-lg font-bold tracking-tight">Doge Messages</h1><p className="text-[11px] text-white/35">Connected as @{session.username}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setProfileUsername(session.username); setAvatarDraft(""); setClearAvatar(false); setProfileOpen(true); }} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] p-1.5 pr-3 text-left transition hover:bg-white/[.08]"><Avatar user={session} size="sm" /><span className="max-w-28 truncate text-xs font-semibold">@{session.username}</span><Settings size={14} className="text-white/40" /></button>
            <button type="button" title="Sign out" aria-label="Sign out" onClick={logout} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:border-rose-200/20 hover:bg-rose-200/[.06] hover:text-rose-100"><LogOut size={17} /></button>
          </div>
        </header>

        {(appError || notice) && <div className={"mb-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5 " + (appError ? "border-rose-300/20 bg-rose-300/[.05] text-rose-100/90" : "border-emerald-200/15 bg-emerald-200/[.04] text-emerald-100/80")}>{appError ? <AlertTriangle size={15} className="mt-0.5 shrink-0" /> : <Check size={15} className="mt-0.5 shrink-0" />}<span className="flex-1">{appError || notice}</span><button aria-label="Dismiss notification" onClick={() => { setAppError(""); setNotice(""); }} className="text-white/40 hover:text-white"><X size={14} /></button></div>}

        <div className="grid min-h-[min(730px,calc(100vh-10rem))] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_25px_100px_rgba(0,0,0,.25)] backdrop-blur-2xl lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-white/10 bg-black/10 lg:border-b-0 lg:border-r">
            <div className="p-3">
              <button type="button" onClick={() => { setActiveChannel("global"); setSelectedPeer(null); setPendingAttachment(null); setMessages([]); shouldAutoScroll.current = true; }} className={"flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition " + (activeChannel === "global" ? "border-cyan-100/20 bg-cyan-100/[.08]" : "border-transparent hover:bg-white/[.04]")}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100/10 text-cyan-100"><Users size={19} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Global chat</span><span className="mt-1 block text-[11px] text-white/35">Everyone on DOGEUB</span></span>
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.5)]" />
              </button>
            </div>

            <div className="px-3 pb-2 pt-1">
              <div className="flex items-center justify-between px-1 pb-2"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/30">Direct messages</p><span className="text-[10px] text-white/25">{conversations.length}</span></div>
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3 py-2.5 focus-within:border-cyan-100/25"><Search size={15} className="shrink-0 text-white/35" /><input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Find a username…" aria-label="Find a DOGEUB user" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-white/25" />{searchingUsers && <Spinner small />}</label>
              {userResults.length > 0 && <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/90 p-1">{userResults.map((peer) => <button type="button" key={peer.id} onClick={() => startConversation(peer)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/[.07]"><Avatar user={peer} size="sm" /><span className="truncate text-xs font-semibold">@{peer.username}</span><Plus size={13} className="ml-auto text-white/30" /></button>)}</div>}
              {userSearch.trim().length >= 2 && !searchingUsers && userResults.length === 0 && <p className="px-2 py-2 text-[11px] text-white/30">No matching users yet.</p>}
            </div>

            <div className="min-h-24 flex-1 overflow-y-auto px-3 pb-3">
              {conversations.length ? conversations.map((conversation) => {
                const peer = conversation.user;
                const active = activeChannel === "dm" && selectedPeer?.id === peer.id;
                return <button type="button" key={peer.id} onClick={() => startConversation(peer)} className={"mt-1 flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-left transition " + (active ? "border-violet-200/20 bg-violet-200/[.07]" : "border-transparent hover:bg-white/[.04]")}>
                  <Avatar user={peer} size="sm" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">@{peer.username}</span><span className="mt-1 block truncate text-[10px] text-white/35">{conversation.lastMessage || "File attachment"} </span></span>
                  <span className="text-[9px] text-white/25">{relativeTime(conversation.createdAt)}</span>
                </button>;
              }) : <div className="px-2 py-5 text-center"><MessageCircle size={22} className="mx-auto text-white/20" /><p className="mt-2 text-xs text-white/35">No conversations yet.</p><p className="mt-1 text-[10px] text-white/25">Search a username to start one.</p></div>}
            </div>

            <div className="border-t border-white/10 p-3">
              <div className="flex items-start gap-2 rounded-xl border border-white/[.06] bg-white/[.025] p-3"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-200/70" /><p className="text-[10px] leading-4 text-white/35">Profanity is filtered server-side. Keep personal details out of the global room.</p></div>
            </div>
          </aside>

          <section className="flex min-h-[540px] min-w-0 flex-col">
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 sm:px-6">
              {activeChannel === "dm" && <button type="button" aria-label="Back to global chat" onClick={() => { setActiveChannel("global"); setSelectedPeer(null); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/50 hover:bg-white/[.06] lg:hidden"><ArrowLeft size={16} /></button>}
              {activeChannel === "global" ? <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100/15 bg-cyan-100/[.07] text-cyan-100"><MessagesSquare size={19} /></div> : <Avatar user={selectedPeer} />}
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate text-sm font-bold">{activeTitle}</h2>{activeChannel === "global" ? <span className="rounded-full border border-emerald-200/15 bg-emerald-200/[.05] px-2 py-0.5 text-[9px] font-semibold text-emerald-100/70">PUBLIC</span> : <span className="rounded-full border border-violet-200/15 bg-violet-200/[.05] px-2 py-0.5 text-[9px] font-semibold text-violet-100/70">PRIVATE</span>}</div><p className="mt-1 truncate text-[11px] text-white/35">{activeSubtitle}</p></div>
              <span className="hidden items-center gap-1.5 text-[10px] text-white/25 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" /> Live updates</span>
            </header>

            <div
              ref={messageListRef}
              onScroll={(event) => { const element = event.currentTarget; shouldAutoScroll.current = element.scrollHeight - element.scrollTop - element.clientHeight < 100; }}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5"
            >
              {activeChannel === "dm" && !selectedPeer ? (
                <div className="flex h-full min-h-64 flex-col items-center justify-center text-center"><LockKeyhole size={28} className="text-violet-100/45" /><h3 className="mt-3 text-sm font-semibold text-white/75">Choose a conversation</h3><p className="mt-1 max-w-xs text-xs leading-5 text-white/35">Search for someone by DOGEUB username to start a private chat.</p></div>
              ) : messages.length === 0 ? (
                <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[.035] text-white/30">{activeChannel === "global" ? <Users size={24} /> : <MessageCircle size={24} />}</div><h3 className="mt-4 text-sm font-semibold text-white/70">{activeChannel === "global" ? "It's quiet in here." : "Start the conversation."}</h3><p className="mt-1 max-w-xs text-xs leading-5 text-white/35">{activeChannel === "global" ? "Say hello to other DOGEUB users. Messages here are public to signed-in accounts." : "Only you and @" + (selectedPeer?.username || "this user") + " can read this conversation."}</p></div>
              ) : messages.map((message) => {
                const own = message.sender?.id === session.id;
                return <article key={message.id} className="group flex items-start gap-2.5">
                  <Avatar user={message.sender} size="sm" />
                  <div className="min-w-0 max-w-[min(92%,680px)] flex-1">
                    <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5"><span className="text-xs font-bold text-white/85">{message.sender?.username || "Unknown user"}</span><time className="text-[9px] text-white/25" title={new Date(message.createdAt).toLocaleString()}>{relativeTime(message.createdAt)}</time>{own && <span className="text-[9px] uppercase tracking-wider text-cyan-100/40">you</span>}</div>
                    {message.text && <p className="whitespace-pre-wrap break-words rounded-2xl rounded-tl-md border border-white/[.06] bg-white/[.035] px-3.5 py-2.5 text-[13px] leading-6 text-white/80">{message.text}</p>}
                    {message.attachment && <a href={message.attachment.url} className="mt-1.5 flex max-w-md items-center gap-3 rounded-xl border border-cyan-100/10 bg-cyan-100/[.035] px-3 py-3 transition hover:border-cyan-100/25 hover:bg-cyan-100/[.07]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100/10 text-cyan-100">{message.attachment.type?.startsWith("image/") ? <Image size={18} /> : <FileText size={18} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-white/80">{message.attachment.name}</span><span className="mt-1 block text-[10px] text-white/35">{formatSize(message.attachment.size)} · download</span></span><Paperclip size={15} className="shrink-0 text-white/30" /></a>}
                  </div>
                  {!own && <button type="button" aria-label={"Report message from " + message.sender?.username} title="Report message" disabled={reportingId === message.id} onClick={() => reportMessage(message)} className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/20 opacity-0 transition hover:bg-rose-300/[.08] hover:text-rose-100 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50">{reportingId === message.id ? <Spinner small /> : <AlertTriangle size={13} />}</button>}
                </article>;
              })}
              <div aria-hidden="true" />
            </div>

            <div className="border-t border-white/10 bg-black/[.08] p-3 sm:p-4">
              {pendingAttachment && <div className="mb-2 flex items-center gap-2 rounded-xl border border-cyan-100/15 bg-cyan-100/[.04] px-3 py-2"><Paperclip size={15} className="shrink-0 text-cyan-100" /><span className="min-w-0 flex-1 truncate text-xs text-white/70">{pendingAttachment.name} <span className="text-white/30">· {formatSize(pendingAttachment.size)}</span></span><button type="button" aria-label="Remove attachment" onClick={() => setPendingAttachment(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white"><X size={14} /></button></div>}
              <form onSubmit={sendMessage} className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[.035] p-2 focus-within:border-cyan-100/20">
                <button type="button" title="Attach from DogeFiler" aria-label="Attach from DogeFiler" disabled={activeChannel === "dm" && !selectedPeer} onClick={openDogeFiles} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/45 transition hover:bg-white/[.07] hover:text-cyan-100 disabled:opacity-25"><Paperclip size={18} /></button>
                <textarea
                  ref={messageInputRef}
                  rows={1}
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value.slice(0, 1200))}
                  onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}
                  placeholder={activeChannel === "global" ? "Message the DOGEUB community…" : selectedPeer ? "Message @" + selectedPeer.username + " privately…" : "Choose a conversation first…"}
                  disabled={activeChannel === "dm" && !selectedPeer}
                  aria-label="Message"
                  className="max-h-32 min-h-10 min-w-0 flex-1 resize-y bg-transparent px-1 py-2.5 text-[13px] leading-5 outline-none placeholder:text-white/25 disabled:opacity-30"
                />
                <button type="submit" disabled={sending || (!messageDraft.trim() && !pendingAttachment) || (activeChannel === "dm" && !selectedPeer)} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25">{sending ? <Spinner small /> : <Send size={17} />}</button>
              </form>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-white/25"><span>Enter to send · Shift+Enter for a new line · Profanity filter on</span><span>{messageDraft.length}/1200</span></div>
            </div>
          </section>
        </div>
      </div>

      {filesOpen && <div className="fixed inset-0 z-[17000] flex items-center justify-center bg-black/70 p-3 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) setFilesOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-label="Attach a file from DogeFiler" className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/95 shadow-2xl">
          <header className="flex items-center gap-3 border-b border-white/10 px-4 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100/10 text-cyan-100"><Paperclip size={18} /></div><div className="min-w-0 flex-1"><h2 className="text-sm font-bold">Attach from DogeFiler</h2><p className="mt-1 text-[11px] text-white/40">Pick a file already saved in your DOGEUB file manager.</p></div><button type="button" aria-label="Close file picker" onClick={() => setFilesOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white"><X size={16} /></button></header>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {filesLoading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-white/45"><Spinner /> Loading DogeFiler…</div>
            : dogeFiles.length === 0 ? <div className="py-12 text-center"><FileText size={25} className="mx-auto text-white/25" /><p className="mt-3 text-sm text-white/60">No saved files found.</p><p className="mt-1 text-xs text-white/35">Import a file into DogeFiler first, then come back here.</p></div>
            : <div className="space-y-1">{dogeFiles.map((file) => {
              const tooLarge = file.size > MAX_ATTACHMENT_BYTES;
              const blocked = /\.(exe|dll|com|scr|msi|bat|cmd|ps1|sh|js|mjs|cjs|html?|svg|jar|apk|reg|vbs)$/i.test(file.name);
              const disabled = tooLarge || blocked || attachingId !== null;
              return <button type="button" key={file.id} disabled={disabled} onClick={() => attachFromDogeFiles(file)} className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-white/10 hover:bg-white/[.04] disabled:cursor-not-allowed disabled:opacity-35"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[.035] text-white/50">{file.type?.startsWith("image/") ? <Image size={18} /> : <FileText size={18} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-white/80">{file.name}</span><span className="mt-1 block text-[10px] text-white/35">{formatSize(file.size)} · {file.folder || "File"}</span>{tooLarge && <span className="mt-1 block text-[10px] text-amber-200/80">Over 4 MB attachment limit</span>}{blocked && <span className="mt-1 block text-[10px] text-rose-200/80">This file type cannot be attached</span>}</span>{attachingId === file.id ? <Spinner small /> : <Paperclip size={15} className="text-white/25" />}</button>;
            })}</div>}
          </div>
          <footer className="border-t border-white/10 px-4 py-3 text-[10px] leading-4 text-white/35">Attachments are copied to the Messages server when selected. Maximum file size: 4 MB.</footer>
        </section>
      </div>}

      {profileOpen && <div className="fixed inset-0 z-[17000] flex items-center justify-center bg-black/70 p-3 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-label="Edit Messages profile" className="w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-slate-950/95 shadow-2xl">
          <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100/10 text-violet-100"><UserRound size={18} /></div><div className="flex-1"><h2 className="text-sm font-bold">Your profile</h2><p className="mt-1 text-[11px] text-white/40">Change your username and custom picture.</p></div><button type="button" aria-label="Close profile" onClick={() => setProfileOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white"><X size={16} /></button></header>
          <form onSubmit={saveProfile} className="space-y-5 p-5">
            <div className="flex items-center gap-4"><span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] text-lg font-bold text-cyan-100">{previewAvatar ? <img src={previewAvatar} alt="Profile preview" className="h-full w-full object-cover" /> : session.username[0]?.toUpperCase()}</span><div className="min-w-0 flex-1"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-xs font-semibold transition hover:bg-white/[.08]"><Image size={15} /> Upload picture<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={pickAvatar} className="sr-only" /></label><p className="mt-2 text-[10px] leading-4 text-white/35">PNG, JPG, WebP, GIF · 512 KB max</p></div></div>
            {(avatarDraft || (session.avatarUrl && !clearAvatar)) && <button type="button" onClick={() => { setAvatarDraft(""); setClearAvatar(true); }} className="text-xs text-rose-200/70 hover:text-rose-100">Remove profile picture</button>}
            <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.17em] text-white/40">Username</span><input value={profileUsername} onChange={(event) => setProfileUsername(event.target.value)} required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" className="w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-3 text-sm outline-none focus:border-cyan-100/25" /></label>
            <p className="text-[10px] leading-4 text-white/30">Usernames must be unique and use only letters, numbers, or underscores.</p>
            <div className="flex gap-2"><button type="button" onClick={() => setProfileOpen(false)} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-white/55 hover:bg-white/[.05]">Cancel</button><button type="submit" disabled={savingProfile} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-100 px-4 py-3 text-xs font-bold text-slate-950 hover:bg-white disabled:opacity-50">{savingProfile ? <Spinner small /> : <Check size={15} />}Save profile</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
