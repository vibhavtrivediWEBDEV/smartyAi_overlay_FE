"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Keyboard, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, DEMO_API_BASE_URL } from "@/lib/api";
import interviewDemo from "@/content/interview-demo.json";
import CodeViewer from "@/vendor/code-viewer.js";
import ResponseParser from "@/vendor/response-parser.js";

type DemoUsage = {
  limit: number;
  used: number;
  remaining: number;
  unlimited?: boolean;
  captures: { screenshot: number; microphone: number; systemAudio: number };
};

type DemoSession = { usage: DemoUsage };
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  firstTokenMs?: number;
  totalMs?: number;
  sample?: boolean;
};
type SpeechRecognitionEventLike = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content: interviewDemo[0].answer,
    firstTokenMs: interviewDemo[0].firstTokenMs,
    totalMs: interviewDemo[0].totalMs,
    sample: true,
  },
];

const shortcutClaims = [
  ["Screenshot", "S", "S"],
  ["Regenerate answer", "⇧ R", "Shift R"],
  ["Microphone", "⇧ M", "Shift M"],
  ["System audio", "⇧ A", "Shift A"],
  ["Conversation history", "⇧ H", "Shift H"],
  ["Cycle language", "⇧ L", "Shift L"],
  ["Dock left / right", "⇧ ← / →", "Shift ← / →"],
  ["Opacity", "⇧ ↑ / ↓", "Shift ↑ / ↓"],
  ["Compact / expand", "− / =", "− / ="],
  ["Profile context", "⇧ P", "Shift P"],
  ["Settings", "⇧ K", "Shift K"],
  ["Clear conversation", "⇧ ⌫", "Shift Backspace"],
  ["Hide/show overlay", "X", "X"],
  ["Shortcut guide", "⇧ /", "Shift /"],
] as const;

function ResponseText({ content }: { content: string }) {
  return <div dangerouslySetInnerHTML={{ __html: ResponseParser.processMarkdown(content) }} />;
}

function SharedCodeViewer({ content, language, incomplete }: { content: string; language?: string; incomplete?: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const viewer = new CodeViewer();
    mount.replaceChildren(viewer.render(content, language, incomplete));
    return () => mount.replaceChildren();
  }, [content, incomplete, language]);

  return <div ref={mountRef} />;
}

function AssistantResponse({ content }: { content: string }) {
  return <>{ResponseParser.parseAIResponse(content).map((block, index) => block.type === "code"
    ? <SharedCodeViewer key={index} content={block.content} language={block.language} incomplete={block.incomplete} />
    : <ResponseText key={index} content={block.content} />)}</>;
}

function localTime(value?: string) {
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Preview ready";
}

async function errorMessage(response: Response) {
  const fallback = `Request failed (${response.status})`;
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message || fallback;
  } catch {
    return fallback;
  }
}

async function createDemoSession() {
  const response = await fetch(`${DEMO_API_BASE_URL}/api/demo/session`, {
    cache: "no-store",
    credentials: "include",
    headers: { "ngrok-skip-browser-warning": "true" },
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json() as Promise<DemoSession>;
}

export function LiveOverlayDemo() {
  const router = useRouter();
  const [mode, setMode] = useState<"trial" | "api">("trial");
  const [apiKey, setApiKey] = useState("");
  const [session, setSession] = useState<DemoSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [prompt, setPrompt] = useState("How should I answer: Tell me about a difficult stakeholder?");
  const [streaming, setStreaming] = useState(false);
  const [firstTokenMs, setFirstTokenMs] = useState<number | null>(null);
  const [totalMs, setTotalMs] = useState<number | null>(null);
  const [status, setStatus] = useState("Initializing secure trial...");
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(true);
  const [language, setLanguage] = useState<"EN" | "HI" | "ES">("EN");
  const [dock, setDock] = useState<"left" | "right">("right");
  const [screenshotPulse, setScreenshotPulse] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [listening, setListening] = useState(false);
  const [capturingAudio, setCapturingAudio] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const captureScreenRef = useRef<() => void>(() => undefined);
  const captureMicrophoneRef = useRef<() => void>(() => undefined);
  const captureSystemAudioRef = useRef<() => void>(() => undefined);
  const regenerateRef = useRef<() => void>(() => undefined);
  const cycleLanguageRef = useRef<() => void>(() => undefined);
  const toggleFullscreenRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    function handleFullscreenChange() {
      setExpanded(document.fullscreenElement === overlayRef.current);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    let active = true;
    createDemoSession()
      .then((nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setStatus("Live demo connected");
      })
      .catch((error: Error) => active && setStatus(error.message));
    return () => {
      active = false;
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((!event.metaKey && !event.ctrlKey) || !event.altKey) return;
      const shortcutCode = `${event.shiftKey ? "Shift+" : ""}${event.code}`;
      const actions: Record<string, () => void> = {
        KeyS: () => captureScreenRef.current(),
        "Shift+KeyR": () => regenerateRef.current(),
        "Shift+KeyM": () => captureMicrophoneRef.current(),
        "Shift+KeyA": () => captureSystemAudioRef.current(),
        "Shift+KeyH": () => setShowAllMessages((current) => !current),
        "Shift+KeyL": () => cycleLanguageRef.current(),
        ArrowLeft: () => setDock("left"),
        ArrowRight: () => setDock("right"),
        "Shift+ArrowUp": () => setOpacity((current) => Math.min(100, current + 10)),
        "Shift+ArrowDown": () => setOpacity((current) => Math.max(0, current - 10)),
        Minus: () => setMinimized(true),
        Equal: () => toggleFullscreenRef.current(),
        "Shift+KeyP": () => router.push("/dashboard/context"),
        "Shift+KeyK": () => router.push("/dashboard/account"),
        "Shift+Backspace": () => setMessages(starterMessages),
        KeyX: () => setMinimized((current) => !current),
        "Shift+Slash": () => setShowShortcuts((current) => !current),
      };
      const action = actions[shortcutCode];
      if (!action) return;
      event.preventDefault();
      action();
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [router]);

  async function reserveCapture(action: "screenshot" | "microphone" | "system-audio") {
    if (mode === "trial" && !session) throw new Error("The secure trial is still connecting");
    if (mode === "api" && !apiKey.trim()) throw new Error("Enter your purchased API key first");
    const response = await fetch(`${DEMO_API_BASE_URL}/api/demo/action`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(mode === "api" ? { "x-api-key": apiKey.trim() } : {}),
      },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) throw new Error(await errorMessage(response));
    const payload = (await response.json()) as { usage: DemoUsage | null };
    if (payload.usage) setSession((current) => current && { ...current, usage: payload.usage! });
  }

  async function sendQuestion(input: string, recordUser = true) {
    const question = input.trim();
    if (!question || streaming) return;
    if (mode === "trial" && !session) {
      setStatus("Connecting secure trial...");
      try {
        setSession(await createDemoSession());
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "The live demo is unavailable");
        return;
      }
    }
    if (mode === "api" && !apiKey.trim()) {
      setStatus("Enter your purchased API key first");
      return;
    }

    const createdAt = new Date().toISOString();
    const baseMessages = recordUser ? messages : messages.slice(0, -1);
    const history = recordUser ? [...baseMessages, { role: "user" as const, content: question, createdAt }] : baseMessages;
    setMessages([...history, { role: "assistant", content: "", createdAt }]);
    setPrompt("");
    setStreaming(true);
    setFirstTokenMs(null);
    setTotalMs(null);
    setStatus("Thinking with live context...");
    const startedAt = performance.now();

    try {
      const requestChat = () => fetch(
        mode === "api" ? `${API_BASE_URL}/v1/chat/completions` : `${DEMO_API_BASE_URL}/api/demo/chat/completions`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            ...(mode === "api" ? { "x-api-key": apiKey.trim() } : {}),
          },
          body: JSON.stringify({ messages: history, stream: true }),
        },
      );
      let response = await requestChat();
      if (mode === "trial" && response.status === 401) {
        setStatus("Reconnecting secure trial...");
        setSession(await createDemoSession());
        response = await requestChat();
      }
      if (mode === "trial" && response.status === 401) {
        throw new Error("The secure trial could not connect. Please try Send again.");
      }
      if (!response.ok || !response.body) {
        if (mode === "trial" && response.status === 429) {
          setSession((current) => current && { ...current, usage: { ...current.usage, used: current.usage.limit, remaining: 0 } });
        }
        throw new Error(await errorMessage(response));
      }
      const remaining = response.headers.get("x-demo-remaining");
      if (remaining !== null) {
        setSession((current) => current && { ...current, usage: { ...current.usage, remaining: Number(remaining), used: current.usage.limit - Number(remaining) } });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedFirstToken = false;
      let measuredFirstTokenMs: number | null = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const eventBlock of events) {
          for (const line of eventBlock.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            const payload = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
            const content = payload.choices?.[0]?.delta?.content || "";
            if (!content) continue;
            if (!receivedFirstToken) {
              receivedFirstToken = true;
              measuredFirstTokenMs = Math.round(performance.now() - startedAt);
              setFirstTokenMs(measuredFirstTokenMs);
            }
            setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, content: message.content + content } : message));
          }
        }
      }
      const completedIn = Math.round(performance.now() - startedAt);
      setTotalMs(completedIn);
      setMessages((current) => current.map((message, index) => index === current.length - 1
        ? { ...message, firstTokenMs: measuredFirstTokenMs ?? completedIn, totalMs: completedIn }
        : message));
      setStatus("Response complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "The live demo is unavailable";
      setMessages((current) => current.map((item, index) => index === current.length - 1 && !item.content ? { ...item, content: message } : item));
      setStatus(message);
    } finally {
      setStreaming(false);
    }
  }

  function sendPrompt(event?: FormEvent) {
    event?.preventDefault();
    void sendQuestion(prompt);
  }

  async function captureScreen() {
    try {
      await reserveCapture("screenshot");
      setScreenshotPulse(true);
      window.setTimeout(() => setScreenshotPulse(false), 1100);
      setMessages((current) => [...current, {
        role: "assistant",
        createdAt: new Date().toISOString(),
        content: "The SmartyAI homepage presents a live interview copilot with a compact desktop-style overlay. The strongest signals are real-time contextual answers, resume and job-description grounding, explicit capture controls, and transparent usage limits. The orange primary action clearly leads to download, while this preview lets visitors test response quality and measured latency before purchasing.",
      }]);
      setStatus("Screenshot preview captured");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Screenshot preview is unavailable");
    }
  }

  async function captureMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await reserveCapture("microphone");
      const speechConstructor = (window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition
        || (window as typeof window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
      if (!speechConstructor) {
        stream.getTracks().forEach((track) => track.stop());
        setStatus("Microphone permission worked; live browser transcription is not supported here");
        return;
      }
      const recognition = new speechConstructor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === "HI" ? "hi-IN" : language === "ES" ? "es-ES" : "en-US";
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || "";
        setPrompt(transcript);
        if (transcript.trim()) void sendQuestion(transcript);
      };
      recognition.onerror = () => setStatus("Browser speech recognition could not transcribe this sample");
      recognition.onend = () => {
        stream.getTracks().forEach((track) => track.stop());
        setListening(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setStatus("Listening through browser speech recognition...");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Microphone permission was denied");
    }
  }

  async function captureSystemAudio() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      await reserveCapture("system-audio");
      const hasAudio = stream.getAudioTracks().length > 0;
      setCapturingAudio(hasAudio);
      if (!hasAudio) {
        setStatus("This shared source did not provide audio");
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      context.createMediaStreamSource(stream).connect(analyser);
      const levels = new Uint8Array(analyser.frequencyBinCount);
      let detected = false;
      const sample = window.setInterval(() => {
        analyser.getByteFrequencyData(levels);
        if (levels.some((level) => level > 18)) detected = true;
      }, 120);
      setStatus("Listening for shared-tab audio...");
      window.setTimeout(async () => {
        window.clearInterval(sample);
        stream.getTracks().forEach((track) => track.stop());
        await context.close();
        setCapturingAudio(false);
        setMessages((current) => [...current, {
          role: "assistant",
          createdAt: new Date().toISOString(),
          content: detected
            ? "Shared-tab audio was detected. This browser preview verifies the capture path, but it does not transcribe tab audio. The macOS desktop app uses its local Whisper pipeline before sending the approved transcript to SmartyAI."
            : "No audible shared-tab signal was detected. Choose a tab with audio enabled, start playback, and try again.",
        }]);
        setStatus(detected ? "Shared-tab audio detected" : "No audible shared-tab signal detected");
      }, 3500);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Tab audio sharing was cancelled");
    }
  }

  captureScreenRef.current = captureScreen;
  captureMicrophoneRef.current = listening ? stopListening : captureMicrophone;
  captureSystemAudioRef.current = captureSystemAudio;

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function regenerateLastAnswer() {
    const previousQuestion = messages.findLast((message) => message.role === "user");
    if (!previousQuestion || streaming) {
      setStatus(streaming ? "Wait for the current response to finish" : "Ask a question before regenerating");
      return;
    }
    void sendQuestion(previousQuestion.content, false);
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await overlayRef.current?.requestFullscreen();
    }
  }

  function cycleLanguage() {
    setLanguage((current) => current === "EN" ? "HI" : current === "HI" ? "ES" : "EN");
  }

  regenerateRef.current = regenerateLastAnswer;
  cycleLanguageRef.current = cycleLanguage;
  toggleFullscreenRef.current = () => void toggleFullscreen();

  const visibleMessages = showAllMessages ? messages : messages.slice(-2);
  const trialExhausted = mode === "trial" && Boolean(session && !session.usage.unlimited && session.usage.remaining === 0);

  return (
    <div ref={overlayRef} className={`overlay-demo ${expanded ? "overlay-demo-expanded" : ""} ${dock === "left" ? "overlay-demo-left" : "overlay-demo-right"}`} style={{ opacity: opacity / 100 }}>
      <header className="overlay-demo-control-bar">
        <div className="overlay-demo-ready"><i className={listening || capturingAudio ? "active" : ""} /> {listening ? "Listening..." : capturingAudio ? "System audio..." : "Ready"}</div>
        <div className="overlay-demo-controls">
          <button type="button" onClick={cycleLanguage} title="Cycle recognition language (⌘⌥⇧L / Ctrl+Alt+Shift+L)">{language}</button>
          <button type="button" className={showAllMessages ? "active" : ""} onClick={() => setShowAllMessages((current) => !current)} title="Toggle conversation history (⌘⌥⇧H / Ctrl+Alt+Shift+H)">👁</button>
          <button type="button" className={listening ? "active" : "primary"} onClick={listening ? stopListening : captureMicrophone} title="Toggle microphone (⌘⌥⇧M / Ctrl+Alt+Shift+M)">🎙 <span>{listening ? "Stop" : "Mic"}</span></button>
          <button type="button" className={capturingAudio ? "danger" : ""} onClick={captureSystemAudio} title="Toggle system audio (⌘⌥⇧A / Ctrl+Alt+Shift+A)">🔊 <span>System Audio</span></button>
          <button type="button" onClick={captureScreen} title="Simulate screenshot context (⌘⌥S / Ctrl+Alt+S)">📸</button>
          <button type="button" onClick={regenerateLastAnswer} title="Regenerate last answer (⌘⌥⇧R / Ctrl+Alt+Shift+R)">↻</button>
          <button type="button" className={dock === "left" ? "active" : ""} onClick={() => setDock("left")} title="Move overlay left (⌘⌥← / Ctrl+Alt+←)">←</button>
          <button type="button" className={dock === "right" ? "active" : ""} onClick={() => setDock("right")} title="Move overlay right (⌘⌥→ / Ctrl+Alt+→)">→</button>
          <button type="button" onClick={() => setMinimized(true)} title="Show controls only (⌘⌥− / Ctrl+Alt+−)">−</button>
          <button type="button" className={expanded ? "active" : ""} onClick={() => void toggleFullscreen()} title="Expand preview (⌘⌥= / Ctrl+Alt+=)">□</button>
          <label className="overlay-demo-opacity" title="Window opacity (⌘⌥⇧↑/↓ / Ctrl+Alt+Shift+↑/↓)"><input type="range" min="0" max="100" step="10" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} /><span>{opacity}%</span></label>
          <button type="button" className={showShortcuts ? "active" : ""} onClick={() => setShowShortcuts((current) => !current)} title="Keyboard shortcuts (⌘⌥⇧/ / Ctrl+Alt+Shift+/)" aria-label="Keyboard shortcuts"><Keyboard size={13} /></button>
          <button type="button" onClick={() => setMessages(starterMessages)} title="Clear conversation (⌘⌥⇧⌫ / Ctrl+Alt+Shift+Backspace)">Clear</button>
          <button type="button" onClick={() => setMinimized(true)} title="Hide preview (⌘⌥X / Ctrl+Alt+X)">✕</button>
        </div>
      </header>

      {showShortcuts && <section className="overlay-demo-shortcuts" aria-label="SmartyAI desktop keyboard shortcuts">
        <div className="overlay-demo-shortcuts-heading"><span>Keyboard command set</span><small>Use Option on macOS · Alt on Windows</small></div>
        <div className="overlay-demo-shortcuts-grid">
          {shortcutClaims.map(([label, macKey, windowsKey]) => <div key={label}><span>{label}</span><kbd>⌘⌥ {macKey}</kbd><kbd>Ctrl Alt {windowsKey}</kbd></div>)}
        </div>
        <p>Desktop shortcuts are global while SmartyAI is running. Capture actions still require explicit permission. Capture protection is best effort and depends on the OS and sharing app.</p>
      </section>}

      {!minimized ? <div className="overlay-demo-main">
        <div className="overlay-demo-status">
          <span><i className={listening ? "connected" : ""} /> STT: {listening ? "Listening" : "Ready"}</span>
          <span><i className={streaming ? "connected" : ""} /> SmartyAI: {streaming ? "Streaming" : "Ready"}</span>
          <span className={`overlay-demo-latency ${firstTokenMs !== null ? "measured" : ""}`}><i className={streaming || firstTokenMs !== null ? "connected" : ""} />{firstTokenMs === null ? status : `${firstTokenMs}ms first token · ${totalMs === null ? "streaming" : `${(totalMs / 1000).toFixed(2)}s complete`}`}</span>
          <span>{mode === "trial" ? session?.usage.unlimited ? "Build access" : `${session?.usage.remaining ?? "--"}/5 left` : "API key"}</span>
        </div>
        <div className={`overlay-demo-flash ${screenshotPulse ? "active" : ""}`}><span>CAPTURED</span></div>
        <div className="overlay-demo-messages" ref={messagesRef} aria-live="polite">
          {visibleMessages.map((message, index) => (
            <div className={`overlay-demo-message ${message.role === "user" ? "user" : ""}`} key={`${message.role}-${index}`}>
              <div className="overlay-demo-message-header">{message.role === "assistant" ? "SmartyAI Assistant" : "You"}</div>
              <div className="overlay-demo-message-text">{message.role === "assistant"
                ? <AssistantResponse content={message.content || (streaming && index === messages.length - 1 ? "Thinking..." : "")} />
                : message.content}</div>
              <div className="overlay-demo-message-meta">
                <time dateTime={message.createdAt}>{localTime(message.createdAt)}</time>
                {message.totalMs !== undefined && <span>{message.sample ? "Sample playback" : "Measured live"} · {message.firstTokenMs}ms first token · {(message.totalMs / 1000).toFixed(2)}s complete</span>}
              </div>
            </div>
          ))}
        </div>
        <form className="overlay-demo-input-area" onSubmit={sendPrompt}>
          <div className="overlay-demo-access">
            <button type="button" className={mode === "trial" ? "active" : ""} onClick={() => setMode("trial")}>5-action preview</button>
            <button type="button" className={mode === "api" ? "active" : ""} onClick={() => setMode("api")}>Use my API key</button>
            {mode === "api" && <input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="API key (not saved)" autoComplete="off" aria-label="SmartyAI API key" />}
          </div>
          {trialExhausted ? <div className="overlay-demo-credit-gate">
            <span><Sparkles size={14} /><b>Preview complete</b> Your five free actions have been used.</span>
            <button type="button" onClick={() => router.push("/login")}>Earn more credits <ArrowRight size={14} /></button>
          </div> : <>
            <div className="overlay-demo-suggestions" aria-label="Sample interview prompts">
              {interviewDemo.map((item) => <button type="button" key={item.label} onClick={() => setPrompt(item.prompt)}>{item.label}</button>)}
            </div>
            <div className="overlay-demo-input-row">
              <input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask your interview question..." aria-label="Interview question" />
              <button type="submit" className="primary" disabled={streaming || !prompt.trim()}>{streaming ? "Answering..." : "Send"}</button>
            </div>
          </>}
        </form>
      </div> : <button type="button" className="overlay-demo-minimized" onClick={() => setMinimized(false)}>● Ready <span>Click to restore chat</span></button>}
    </div>
  );
}
