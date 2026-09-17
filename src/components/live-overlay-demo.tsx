"use client";

import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  Circle,
  Clipboard,
  Eye,
  Keyboard,
  Maximize,
  Mic,
  MicOff,
  Minus,
  PanelLeft,
  PanelTop,
  RotateCcw,
  Settings,
  Sparkles,
  Trash2,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
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
type SpeechRecognitionResultLike = ArrayLike<{ transcript: string }> & { isFinal?: boolean };
type SpeechRecognitionEventLike = {
  resultIndex?: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};
type SpeechRecognitionErrorEventLike = { error?: string };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type ToolbarLayout = "horizontal" | "vertical";
type PreviewPosition = { x: number; y: number };
type PreviewSize = { width: number; height: number };
type PreviewTooltip = { label: string; shortcut?: string; x: number; y: number; placement: "top" | "bottom" };

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content: interviewDemo[0].answer,
    firstTokenMs: interviewDemo[0].firstTokenMs,
    totalMs: interviewDemo[0].totalMs,
    sample: true,
  },
];

const OVERLAY_HISTORY_KEY = "smartyai-overlay-preview-history";

const shortcutClaims = [
  ["Screenshot", "S", "S"],
  ["Clipboard", "P", "P"],
  ["Regenerate answer", "R", "R"],
  ["Microphone", "M", "M"],
  ["System audio", "A", "A"],
  ["Conversation history", "⇧ H", "Shift H"],
  ["Move edge", "← / →", "← / →"],
  ["Opacity", "⇧ ↑ / ↓", "Shift ↑ / ↓"],
  ["Toolbar layout", "T", "T"],
  ["Compact / expand", "− / =", "− / ="],
  ["Profile context", "⇧ P", "Shift P"],
  ["Settings", "⇧ K", "Shift K"],
  ["Clear conversation", "⇧ ⌫", "Shift Backspace"],
  ["Hide/show overlay", "X", "X"],
] as const;

const tourSteps = [
  ["language", "Recognition language", "Choose English, Hindi, or Spanish for browser microphone recognition.", "Click"],
  ["record", "Session recording", "Preview the desktop session recording state.", "Click"],
  ["history", "Conversation history", "Switch between the latest exchange and your stored conversation.", "⌘⌥⇧H / Ctrl+Alt+Shift+H"],
  ["microphone", "Microphone", "Listen for your spoken question and send the final transcript automatically.", "⌘⌥M / Ctrl+Alt+M"],
  ["speaker", "Shared audio", "Select a tab or screen and verify that speaker audio is reaching SmartyAI.", "⌘⌥A / Ctrl+Alt+A"],
  ["screenshot", "Screen context", "Preview the Electron screenshot capture action.", "⌘⌥S / Ctrl+Alt+S"],
  ["clipboard", "Clipboard context", "Preview sending clipboard text as context.", "⌘⌥P / Ctrl+Alt+P"],
  ["regenerate", "Regenerate", "Ask the last user question again for a fresh response.", "⌘⌥R / Ctrl+Alt+R"],
  ["layout", "Toolbar layout", "Switch between a left rail and a top toolbar.", "⌘⌥T / Ctrl+Alt+T"],
  ["move-start", "Move to start edge", "Move left with a vertical rail, or up with a horizontal toolbar.", "⌘⌥← / Ctrl+Alt+←"],
  ["move-end", "Move to end edge", "Move right with a vertical rail, or down with a horizontal toolbar.", "⌘⌥→ / Ctrl+Alt+→"],
  ["mode", "Compact or expand", "Keep only the controls visible, or restore the full conversation.", "⌘⌥− / ⌘⌥="],
  ["opacity", "Opacity", "Adjust how strongly the overlay appears over your conversation.", "⌘⌥⇧↑/↓"],
  ["resize", "Resize the window", "Drag the corner grip to fit the overlay around your conversation.", "Drag corner"],
  ["shortcuts", "Shortcut guide", "Open the complete Electron command reference.", "Click"],
  ["profile", "Profile context", "Preview updating the resume and job description used for answers.", "⌘⌥⇧P / Ctrl+Alt+Shift+P"],
  ["settings", "Settings", "Preview opening desktop configuration.", "⌘⌥⇧K / Ctrl+Alt+Shift+K"],
  ["clear", "Clear conversation", "Remove the current and stored preview conversation.", "⌘⌥⇧⌫ / Ctrl+Alt+Shift+Backspace"],
  ["hide", "Hide overlay", "Compact the browser preview; Electron hides or restores the window.", "⌘⌥X / Ctrl+Alt+X"],
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

export function LiveOverlayDemo({ verticalToolbar = false }: { verticalToolbar?: boolean }) {
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
  const [expanded, setExpanded] = useState(true);
  const [toolbarLayout, setToolbarLayout] = useState<ToolbarLayout>(verticalToolbar ? "vertical" : "horizontal");
  const [showAllMessages, setShowAllMessages] = useState(true);
  const [language, setLanguage] = useState<"EN" | "HI" | "ES">("EN");
  const [dock, setDock] = useState<"left" | "right">("right");
  const [screenshotPulse, setScreenshotPulse] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [listening, setListening] = useState(false);
  const [capturingAudio, setCapturingAudio] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [recordingPreview, setRecordingPreview] = useState(false);
  const [tourAvailable, setTourAvailable] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(-1);
  const [previewPosition, setPreviewPosition] = useState<PreviewPosition>({ x: 0, y: 0 });
  const [previewSize, setPreviewSize] = useState<PreviewSize | null>(null);
  const [previewTooltip, setPreviewTooltip] = useState<PreviewTooltip | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: PreviewPosition;
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
  } | null>(null);
  const resizeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: PreviewSize;
    maximum: PreviewSize;
  } | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const systemAudioStreamRef = useRef<MediaStream | null>(null);
  const systemAudioContextRef = useRef<AudioContext | null>(null);
  const systemAudioSampleRef = useRef<number | null>(null);
  const systemAudioTimeoutRef = useRef<number | null>(null);
  const shouldListenRef = useRef(false);
  const requestInFlightRef = useRef(false);
  const historyReadyRef = useRef(false);
  const tourResolvedRef = useRef(false);
  const sendQuestionRef = useRef<(input: string) => void>(() => undefined);
  const messagesRef = useRef<HTMLDivElement>(null);
  const captureScreenRef = useRef<() => void>(() => undefined);
  const captureMicrophoneRef = useRef<() => void>(() => undefined);
  const captureSystemAudioRef = useRef<() => void>(() => undefined);
  const regenerateRef = useRef<() => void>(() => undefined);
  const compactPreviewRef = useRef<() => void>(() => undefined);
  const expandPreviewRef = useRef<() => void>(() => undefined);
  const togglePreviewVisibilityRef = useRef<() => void>(() => undefined);
  const toggleToolbarLayoutRef = useRef<() => void>(() => undefined);
  const movePreviewRef = useRef<(side: "start" | "end") => void>(() => undefined);
  const clearConversationRef = useRef<() => void>(() => undefined);

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
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
      systemAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (systemAudioSampleRef.current !== null) window.clearInterval(systemAudioSampleRef.current);
      if (systemAudioTimeoutRef.current !== null) window.clearTimeout(systemAudioTimeoutRef.current);
      void systemAudioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const productStage = overlayRef.current?.closest<HTMLElement>("[data-hero-demo]");
    if (productStage) productStage.dataset.layout = toolbarLayout;
  }, [toolbarLayout]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (tourResolvedRef.current) return;
      try {
        if (window.localStorage.getItem("smartyai-overlay-tour-seen") === "1") {
          tourResolvedRef.current = true;
          setTourAvailable(false);
          return;
        }
      } catch {
        // Continue with an in-memory tour when storage is unavailable.
      }
      tourResolvedRef.current = true;
      setPreviewMode("expand");
      setTourStep(-1);
      setShowTour(true);
      setTourAvailable(false);
    }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const stored = window.localStorage.getItem(OVERLAY_HISTORY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ChatMessage[];
          if (Array.isArray(parsed) && parsed.some((message) => message.role === "user")) setMessages(parsed);
        }
      } catch {
        // Keep the bundled sample when stored preview history is unavailable.
      } finally {
        historyReadyRef.current = true;
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!historyReadyRef.current || streaming) return;
    try {
      window.localStorage.setItem(OVERLAY_HISTORY_KEY, JSON.stringify(messages.filter((message) => message.content.trim())));
    } catch {
      // The live preview remains usable when storage is unavailable.
    }
  }, [messages, streaming]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    function resizeFromPointer(event: PointerEvent) {
      const resize = resizeRef.current;
      if (!resize || resize.pointerId !== event.pointerId) return;
      setPreviewSize({
        width: Math.max(280, Math.min(resize.maximum.width, resize.origin.width + event.clientX - resize.startX)),
        height: Math.max(360, Math.min(resize.maximum.height, resize.origin.height + event.clientY - resize.startY)),
      });
    }

    function finishResize(event: PointerEvent) {
      if (resizeRef.current?.pointerId !== event.pointerId) return;
      resizeRef.current = null;
      setResizing(false);
    }

    window.addEventListener("pointermove", resizeFromPointer);
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", finishResize);
    return () => {
      window.removeEventListener("pointermove", resizeFromPointer);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", finishResize);
    };
  }, []);

  useEffect(() => {
    if (!showTour || tourStep < 0) return;
    overlayRef.current?.querySelector<HTMLElement>(`[data-tour="${tourSteps[tourStep][0]}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }, [showTour, tourStep]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((!event.metaKey && !event.ctrlKey) || !event.altKey) return;
      const shortcutCode = `${event.shiftKey ? "Shift+" : ""}${event.code}`;
      const actions: Record<string, () => void> = {
        KeyS: () => captureScreenRef.current(),
        KeyP: () => setStatus("Preview: send clipboard text to SmartyAI"),
        KeyR: () => regenerateRef.current(),
        KeyM: () => captureMicrophoneRef.current(),
        KeyA: () => captureSystemAudioRef.current(),
        "Shift+KeyH": () => setShowAllMessages((current) => !current),
        ArrowLeft: () => movePreviewRef.current("start"),
        ArrowRight: () => movePreviewRef.current("end"),
        "Shift+ArrowUp": () => setOpacity((current) => Math.min(100, current + 10)),
        "Shift+ArrowDown": () => setOpacity((current) => Math.max(0, current - 10)),
        KeyT: () => toggleToolbarLayoutRef.current(),
        Minus: () => compactPreviewRef.current(),
        Equal: () => expandPreviewRef.current(),
        "Shift+KeyP": () => setStatus("Preview: update profile context"),
        "Shift+KeyK": () => setStatus("Preview: open desktop settings"),
        "Shift+Backspace": () => clearConversationRef.current(),
        KeyX: () => togglePreviewVisibilityRef.current(),
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
    if (!question || streaming || requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    if (mode === "trial" && !session) {
      setStatus("Connecting secure trial...");
      try {
        setSession(await createDemoSession());
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "The live demo is unavailable");
        requestInFlightRef.current = false;
        return;
      }
    }
    if (mode === "api" && !apiKey.trim()) {
      setStatus("Enter your purchased API key first");
      requestInFlightRef.current = false;
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
      requestInFlightRef.current = false;
      setStreaming(false);
    }
  }

  function sendPrompt(event?: FormEvent) {
    event?.preventDefault();
    void sendQuestion(prompt);
  }

  async function captureScreen() {
    setScreenshotPulse(true);
    window.setTimeout(() => setScreenshotPulse(false), 1100);
    setStatus("Preview: desktop screenshot capture");
  }

  async function captureMicrophone() {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const activeStream = stream;
      microphoneStreamRef.current = activeStream;
      const speechConstructor = (window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition
        || (window as typeof window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
      if (!speechConstructor) {
        releaseMicrophone();
        setStatus("Microphone permission worked; live browser transcription is not supported here");
        return;
      }
      const recognition = new speechConstructor();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = language === "HI" ? "hi-IN" : language === "ES" ? "es-ES" : "en-US";
      recognition.onresult = (event) => {
        let transcript = "";
        for (let index = event.resultIndex ?? 0; index < event.results.length; index += 1) {
          const result = event.results[index];
          if (result.isFinal === false) continue;
          transcript += `${result[0]?.transcript || ""} `;
        }
        transcript = transcript.trim();
        setPrompt(transcript);
        if (transcript) sendQuestionRef.current(transcript);
      };
      recognition.onerror = (event) => {
        if (["audio-capture", "not-allowed", "service-not-allowed"].includes(event.error || "")) {
          stopListening();
        }
        setStatus("Browser speech recognition could not transcribe this sample");
      };
      recognition.onend = () => {
        if (shouldListenRef.current) {
          window.setTimeout(() => {
            if (!shouldListenRef.current) return;
            try {
              recognition.start();
            } catch {
              stopListening();
              setStatus("Browser speech recognition stopped unexpectedly");
            }
          }, 250);
          return;
        }
        activeStream.getTracks().forEach((track) => track.stop());
      };
      recognitionRef.current = recognition;
      shouldListenRef.current = true;
      recognition.start();
      setListening(true);
      setStatus("Auto-listening for your next question...");
    } catch (error) {
      releaseMicrophone();
      setStatus(error instanceof Error ? error.message : "Microphone permission was denied");
    }
  }

  async function captureSystemAudio() {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const activeStream = stream;
      systemAudioStreamRef.current = activeStream;
      const hasAudio = activeStream.getAudioTracks().length > 0;
      if (!hasAudio) {
        setStatus("This shared source did not provide audio");
        stopSystemAudio();
        return;
      }
      const context = new AudioContext();
      systemAudioContextRef.current = context;
      const analyser = context.createAnalyser();
      context.createMediaStreamSource(activeStream).connect(analyser);
      const levels = new Uint8Array(analyser.frequencyBinCount);
      let detected = false;
      systemAudioSampleRef.current = window.setInterval(() => {
        analyser.getByteFrequencyData(levels);
        if (levels.some((level) => level > 18)) detected = true;
      }, 120);
      setCapturingAudio(true);
      setStatus("Listening for shared-tab audio...");
      systemAudioTimeoutRef.current = window.setTimeout(async () => {
        if (systemAudioSampleRef.current !== null) window.clearInterval(systemAudioSampleRef.current);
        systemAudioSampleRef.current = null;
        systemAudioTimeoutRef.current = null;
        activeStream.getTracks().forEach((track) => track.stop());
        systemAudioStreamRef.current = null;
        await context.close();
        systemAudioContextRef.current = null;
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
      stopSystemAudio();
      setStatus(error instanceof Error ? error.message : "Tab audio sharing was cancelled");
    }
  }

  function stopSystemAudio() {
    if (systemAudioSampleRef.current !== null) window.clearInterval(systemAudioSampleRef.current);
    if (systemAudioTimeoutRef.current !== null) window.clearTimeout(systemAudioTimeoutRef.current);
    systemAudioSampleRef.current = null;
    systemAudioTimeoutRef.current = null;
    systemAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
    systemAudioStreamRef.current = null;
    const context = systemAudioContextRef.current;
    systemAudioContextRef.current = null;
    if (context && context.state !== "closed") void context.close();
    setCapturingAudio(false);
    setStatus("Speaker audio detection stopped");
  }

  function toggleSystemAudio() {
    if (systemAudioStreamRef.current || capturingAudio) {
      stopSystemAudio();
      return;
    }
    void captureSystemAudio();
  }

  captureScreenRef.current = captureScreen;
  captureMicrophoneRef.current = toggleAutoVoice;
  captureSystemAudioRef.current = toggleSystemAudio;
  sendQuestionRef.current = (input) => void sendQuestion(input);

  function releaseMicrophone() {
    shouldListenRef.current = false;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        if (recognition.abort) recognition.abort();
        else recognition.stop();
      } catch {
        // The browser may already have ended recognition.
      }
    }
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    microphoneStreamRef.current = null;
    setListening(false);
  }

  function stopListening() {
    releaseMicrophone();
    setStatus("Browser voice detection stopped");
  }

  function toggleAutoVoice() {
    if (shouldListenRef.current || recognitionRef.current || microphoneStreamRef.current) {
      stopListening();
      return;
    }
    void captureMicrophone();
  }

  function regenerateLastAnswer() {
    const previousQuestion = messages.findLast((message) => message.role === "user");
    if (!previousQuestion || streaming) {
      setStatus(streaming ? "Wait for the current response to finish" : "Ask a question before regenerating");
      return;
    }
    void sendQuestion(previousQuestion.content, false);
  }

  function clearConversation() {
    setMessages(starterMessages);
    setShowAllMessages(true);
    setStatus("Conversation cleared");
    try {
      window.localStorage.removeItem(OVERLAY_HISTORY_KEY);
    } catch {
      // Clearing in-memory history is sufficient when storage is unavailable.
    }
  }

  function setPreviewMode(mode: "compact" | "expand") {
    const shouldExpand = mode === "expand";
    setExpanded(shouldExpand);
    setMinimized(!shouldExpand);
    if (!shouldExpand) setShowShortcuts(false);
  }

  function toggleToolbarLayout() {
    setPreviewMode("expand");
    setToolbarLayout((current) => current === "vertical" ? "horizontal" : "vertical");
    setPreviewPosition({ x: 0, y: 0 });
    setDock("right");
    overlayRef.current?.querySelector(".overlay-demo-controls")?.scrollTo({ top: 0, left: 0 });
    setStatus("Preview layout changed");
  }

  function movePreview(side: "start" | "end") {
    const overlay = overlayRef.current;
    const hero = overlay?.closest<HTMLElement>("[data-home-hero]");
    if (!overlay || !hero) return;
    const overlayBounds = overlay.getBoundingClientRect();
    const heroBounds = hero.getBoundingClientRect();
    const edge = 16;
    setPreviewPosition((current) => toolbarLayout === "vertical"
      ? {
          x: current.x + (side === "start" ? heroBounds.left + edge - overlayBounds.left : heroBounds.right - edge - overlayBounds.right),
          y: current.y,
        }
      : {
          x: current.x,
          y: current.y + (side === "start" ? heroBounds.top + edge - overlayBounds.top : heroBounds.bottom - edge - overlayBounds.bottom),
        });
    setDock(side === "start" ? "left" : "right");
  }

  function beginDrag(event: ReactPointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button, input, label")) return;
    const overlay = overlayRef.current;
    const hero = overlay?.closest<HTMLElement>("[data-home-hero]");
    if (!overlay || !hero) return;
    const overlayBounds = overlay.getBoundingClientRect();
    const heroBounds = hero.getBoundingClientRect();
    const edge = 8;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: previewPosition,
      bounds: {
        minX: previewPosition.x + heroBounds.left + edge - overlayBounds.left,
        maxX: previewPosition.x + heroBounds.right - edge - overlayBounds.right,
        minY: previewPosition.y + heroBounds.top + edge - overlayBounds.top,
        maxY: previewPosition.y + heroBounds.bottom - edge - overlayBounds.bottom,
      },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function dragPreview(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPreviewPosition({
      x: Math.max(drag.bounds.minX, Math.min(drag.bounds.maxX, drag.origin.x + event.clientX - drag.startX)),
      y: Math.max(drag.bounds.minY, Math.min(drag.bounds.maxY, drag.origin.y + event.clientY - drag.startY)),
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  }

  function beginResize(event: ReactPointerEvent<HTMLButtonElement>) {
    const overlay = overlayRef.current;
    const hero = overlay?.closest<HTMLElement>("[data-home-hero]");
    if (!overlay || !hero) return;
    const overlayBounds = overlay.getBoundingClientRect();
    const heroBounds = hero.getBoundingClientRect();
    resizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: { width: overlayBounds.width, height: overlayBounds.height },
      maximum: {
        width: Math.max(280, heroBounds.right - overlayBounds.left - 8),
        height: Math.max(360, heroBounds.bottom - overlayBounds.top - 8),
      },
    };
    setResizing(true);
    event.preventDefault();
  }

  function showControlTooltip(event: ReactPointerEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[title]");
    if (!target || !overlayRef.current?.contains(target)) return;
    const text = target.getAttribute("title");
    if (!text) return;
    const bounds = target.getBoundingClientRect();
    const shortcutStart = text.lastIndexOf(" (");
    const hasShortcut = shortcutStart > 0 && text.endsWith(")");
    const placement = bounds.bottom + 100 > window.innerHeight ? "top" : "bottom";
    target.dataset.previewTitle = text;
    target.removeAttribute("title");
    setPreviewTooltip({
      label: hasShortcut ? text.slice(0, shortcutStart) : text,
      shortcut: hasShortcut ? text.slice(shortcutStart + 2, -1) : undefined,
      x: Math.max(140, Math.min(window.innerWidth - 140, bounds.left + bounds.width / 2)),
      y: placement === "top" ? bounds.top - 10 : bounds.bottom + 10,
      placement,
    });
  }

  function hideControlTooltip(event: ReactPointerEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-preview-title]");
    if (target?.dataset.previewTitle) {
      target.setAttribute("title", target.dataset.previewTitle);
      delete target.dataset.previewTitle;
    }
    setPreviewTooltip(null);
  }

  function openTour() {
    if (!tourAvailable || showTour || tourResolvedRef.current) return;
    try {
      if (window.localStorage.getItem("smartyai-overlay-tour-seen") === "1") {
        tourResolvedRef.current = true;
        setTourAvailable(false);
        return;
      }
    } catch {
      // Continue with the one-time in-memory tour when storage is unavailable.
    }
    tourResolvedRef.current = true;
    setPreviewMode("expand");
    setTourStep(-1);
    setShowTour(true);
    setTourAvailable(false);
  }

  function completeTour() {
    setShowTour(false);
    overlayRef.current?.querySelector(".overlay-demo-controls")?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    try {
      window.localStorage.setItem("smartyai-overlay-tour-seen", "1");
    } catch {
      // The preview still works when storage is unavailable.
    }
  }

  function nextTourStep() {
    if (tourStep >= tourSteps.length - 1) {
      completeTour();
      return;
    }
    setTourStep((current) => current + 1);
  }

  function cycleLanguage() {
    setLanguage((current) => current === "EN" ? "HI" : current === "HI" ? "ES" : "EN");
  }

  regenerateRef.current = regenerateLastAnswer;
  compactPreviewRef.current = () => setPreviewMode("compact");
  expandPreviewRef.current = () => setPreviewMode("expand");
  togglePreviewVisibilityRef.current = () => setPreviewMode(minimized ? "expand" : "compact");
  toggleToolbarLayoutRef.current = toggleToolbarLayout;
  movePreviewRef.current = movePreview;
  clearConversationRef.current = clearConversation;

  const visibleMessages = showAllMessages ? messages : messages.slice(-2);
  const trialExhausted = mode === "trial" && Boolean(session && !session.usage.unlimited && session.usage.remaining === 0);
  const currentTourStep = tourStep >= 0 ? tourSteps[tourStep] : null;
  const tourTarget = currentTourStep?.[0];

  return (
    <div
      ref={overlayRef}
      className={`overlay-demo overlay-demo-${toolbarLayout} ${expanded ? "overlay-demo-expanded" : "overlay-demo-compact"} ${showTour ? "is-tour-open" : ""} ${dragging ? "is-dragging" : ""} ${resizing ? "is-resizing" : ""}`}
      style={{ opacity: opacity / 100, transform: `translate3d(${previewPosition.x}px, ${previewPosition.y}px, 0)`, ...(expanded && previewSize ? previewSize : {}) }}
      onPointerEnter={openTour}
      onFocusCapture={openTour}
      onPointerOver={showControlTooltip}
      onPointerOut={hideControlTooltip}
    >
      <header className="overlay-demo-control-bar" onPointerDown={beginDrag} onPointerMove={dragPreview} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className="overlay-demo-ready"><i className={listening || capturingAudio ? "active" : ""} /> {listening ? "Listening..." : capturingAudio ? "System audio..." : "Ready"}</div>
        <div className="overlay-demo-controls">
          <button type="button" data-tour="language" data-tour-active={tourTarget === "language" || undefined} onClick={cycleLanguage} title="Cycle recognition language">{language}</button>
          <button type="button" data-tour="record" data-tour-active={tourTarget === "record" || undefined} className={recordingPreview ? "danger" : ""} onClick={() => setRecordingPreview((current) => {
            const next = !current;
            setStatus(next ? "Preview: record the desktop session" : "Preview recording stopped");
            return next;
          })} title="Record session" aria-label={recordingPreview ? "Stop recording session" : "Start recording session"}><Circle size={14} fill={recordingPreview ? "currentColor" : "none"} aria-hidden="true" /></button>
          <button type="button" data-tour="history" data-tour-active={tourTarget === "history" || undefined} className={showAllMessages ? "active" : ""} onClick={() => setShowAllMessages((current) => !current)} title="Toggle conversation history (⌘⌥⇧H / Ctrl+Alt+Shift+H)" aria-label="Toggle conversation history"><Eye size={14} aria-hidden="true" /></button>
          {listening
            ? <button key="stop-microphone" type="button" data-tour="microphone" data-tour-active={tourTarget === "microphone" || undefined} className="overlay-demo-auto-voice danger" onClick={stopListening} title="Stop autonomous voice detection (⌘⌥M / Ctrl+Alt+M)" aria-label="Stop microphone" aria-pressed="true">
                <MicOff size={14} aria-hidden="true" />
              </button>
            : <button key="start-microphone" type="button" data-tour="microphone" data-tour-active={tourTarget === "microphone" || undefined} className="overlay-demo-auto-voice primary" onClick={() => void captureMicrophone()} title="Start autonomous voice detection (⌘⌥M / Ctrl+Alt+M)" aria-label="Start microphone" aria-pressed="false">
                <Mic size={14} aria-hidden="true" />
              </button>}
          {capturingAudio
            ? <button key="stop-speaker" type="button" data-tour="speaker" data-tour-active={tourTarget === "speaker" || undefined} className="overlay-demo-speaker danger" onClick={stopSystemAudio} title="Stop shared speaker audio detection (⌘⌥A / Ctrl+Alt+A)" aria-label="Stop system audio" aria-pressed="true">
                <VolumeX size={14} aria-hidden="true" />
              </button>
            : <button key="start-speaker" type="button" data-tour="speaker" data-tour-active={tourTarget === "speaker" || undefined} className="overlay-demo-speaker" onClick={() => void captureSystemAudio()} title="Start shared speaker audio detection (⌘⌥A / Ctrl+Alt+A)" aria-label="Start system audio" aria-pressed="false">
                <Volume2 size={14} aria-hidden="true" />
              </button>}
          <button type="button" data-tour="screenshot" data-tour-active={tourTarget === "screenshot" || undefined} onClick={captureScreen} title="Simulate screenshot context (⌘⌥S / Ctrl+Alt+S)" aria-label="Capture screen"><Camera size={14} aria-hidden="true" /></button>
          <button type="button" data-tour="clipboard" data-tour-active={tourTarget === "clipboard" || undefined} onClick={() => setStatus("Preview: send clipboard text to SmartyAI")} title="Send clipboard text (⌘⌥P / Ctrl+Alt+P)" aria-label="Send clipboard text"><Clipboard size={14} aria-hidden="true" /></button>
          <button type="button" data-tour="regenerate" data-tour-active={tourTarget === "regenerate" || undefined} onClick={regenerateLastAnswer} title="Regenerate last answer (⌘⌥R / Ctrl+Alt+R)" aria-label="Regenerate last answer"><RotateCcw size={14} aria-hidden="true" /></button>
          <button type="button" data-tour="layout" data-tour-active={tourTarget === "layout" || undefined} onClick={toggleToolbarLayout} title={`Use ${toolbarLayout === "vertical" ? "top" : "left"} toolbar (⌘⌥T / Ctrl+Alt+T)`} aria-label={`Use ${toolbarLayout === "vertical" ? "horizontal" : "vertical"} toolbar`}>{toolbarLayout === "vertical" ? <PanelTop size={14} aria-hidden="true" /> : <PanelLeft size={14} aria-hidden="true" />}</button>
          <button type="button" data-tour="move-start" data-tour-active={tourTarget === "move-start" || undefined} className={dock === "left" ? "active" : ""} onClick={() => movePreview("start")} title={`${toolbarLayout === "vertical" ? "Move overlay left" : "Move overlay up"} (⌘⌥← / Ctrl+Alt+←)`} aria-label={toolbarLayout === "vertical" ? "Move overlay left" : "Move overlay up"}>{toolbarLayout === "vertical" ? <ArrowLeft size={14} aria-hidden="true" /> : <ArrowUp size={14} aria-hidden="true" />}</button>
          <button type="button" data-tour="move-end" data-tour-active={tourTarget === "move-end" || undefined} className={dock === "right" ? "active" : ""} onClick={() => movePreview("end")} title={`${toolbarLayout === "vertical" ? "Move overlay right" : "Move overlay down"} (⌘⌥→ / Ctrl+Alt+→)`} aria-label={toolbarLayout === "vertical" ? "Move overlay right" : "Move overlay down"}>{toolbarLayout === "vertical" ? <ArrowRight size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />}</button>
          <button type="button" data-tour="mode" data-tour-active={tourTarget === "mode" || undefined} className={expanded ? "" : "active"} onClick={() => setPreviewMode(expanded ? "compact" : "expand")} title={expanded ? "Show controls only (⌘⌥− / Ctrl+Alt+−)" : "Show full conversation (⌘⌥= / Ctrl+Alt+=)"} aria-label={expanded ? "Show controls only" : "Show full conversation"}>{expanded ? <Minus size={14} aria-hidden="true" /> : <Maximize size={14} aria-hidden="true" />}</button>
          <label data-tour="opacity" data-tour-active={tourTarget === "opacity" || undefined} className="overlay-demo-opacity" title="Window opacity (⌘⌥⇧↑/↓ / Ctrl+Alt+Shift+↑/↓)"><input type="range" min="0" max="100" step="10" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} /><span>{opacity}%</span></label>
          <button type="button" data-tour="shortcuts" data-tour-active={tourTarget === "shortcuts" || undefined} className={showShortcuts ? "active" : ""} onClick={() => setShowShortcuts((current) => !current)} title="Keyboard shortcuts" aria-label="Keyboard shortcuts"><Keyboard size={14} aria-hidden="true" /></button>
          <button type="button" data-tour="profile" data-tour-active={tourTarget === "profile" || undefined} onClick={() => setStatus("Preview: update resume or job description")} title="Update profile context (⌘⌥⇧P / Ctrl+Alt+Shift+P)" aria-label="Update profile context"><UserRound size={14} aria-hidden="true" /></button>
          <button type="button" data-tour="settings" data-tour-active={tourTarget === "settings" || undefined} onClick={() => setStatus("Preview: open desktop settings")} title="Open settings (⌘⌥⇧K / Ctrl+Alt+Shift+K)" aria-label="Open settings"><Settings size={14} aria-hidden="true" /></button>
          <button type="button" data-tour="clear" data-tour-active={tourTarget === "clear" || undefined} onClick={clearConversation} title="Clear conversation (⌘⌥⇧⌫ / Ctrl+Alt+Shift+Backspace)" aria-label="Clear conversation"><Trash2 size={14} aria-hidden="true" /></button>
          <button type="button" data-tour="hide" data-tour-active={tourTarget === "hide" || undefined} onClick={() => setPreviewMode("compact")} title="Hide preview (⌘⌥X / Ctrl+Alt+X)" aria-label="Hide preview"><X size={14} aria-hidden="true" /></button>
        </div>
      </header>

      {showTour && <aside className={`overlay-demo-tour ${currentTourStep ? "is-stepping" : ""}`} role="dialog" aria-label="SmartyAI overlay controls tour">
        {!currentTourStep ? <>
          <Image src="/smartyai-hinglish-comedy-sticker.svg" alt="Arre yaar, type karke dekh na. Asli live demo yahin hai." width={340} height={160} priority />
          <div>
            <strong>Window ko khud chala ke dekho.</strong>
            <p>Ab har control ko ek-ek karke dekhenge, exactly uske Electron shortcut ke saath.</p>
            <button type="button" onClick={nextTourStep}>Samajh gaya</button>
          </div>
        </> : <div className="overlay-demo-tour-step">
          <small>{tourStep + 1} / {tourSteps.length}</small>
          <strong>{currentTourStep[1]}</strong>
          <p>{currentTourStep[2]}</p>
          <kbd>{currentTourStep[3]}</kbd>
          <div className="overlay-demo-tour-actions">
            <button type="button" className="secondary" onClick={completeTour}>Skip</button>
            {tourStep > 0 && <button type="button" className="secondary" onClick={() => setTourStep((current) => current - 1)}>Back</button>}
            <button type="button" onClick={nextTourStep}>{tourStep === tourSteps.length - 1 ? "Finish" : "Next"}</button>
          </div>
        </div>}
      </aside>}

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
      </div> : <button type="button" className="overlay-demo-minimized" onClick={() => setPreviewMode("expand")}>● Ready <span>Click to restore chat</span></button>}
      {expanded && <button
        type="button"
        className="overlay-demo-resize-handle"
        data-tour="resize"
        data-tour-active={tourTarget === "resize" || undefined}
        title="Resize overlay"
        aria-label="Resize overlay"
        onPointerDown={beginResize}
      />}
      {previewTooltip && createPortal(<div className="overlay-demo-tooltip" data-placement={previewTooltip.placement} role="tooltip" style={{ left: previewTooltip.x, top: previewTooltip.y }}>
        <small>Overlay control</small>
        <strong>{previewTooltip.label}</strong>
        {previewTooltip.shortcut && <kbd>{previewTooltip.shortcut}</kbd>}
      </div>, document.body)}
    </div>
  );
}
