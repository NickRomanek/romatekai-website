"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import Image from "next/image";

// UI components
import Transcript from "./components/Transcript";
import Events from "./components/Events";
import BottomToolbar from "./components/BottomToolbar";
import ThreeSphere from './components/ThreeSphere';

// Types
import { SessionStatus, TranscriptItem } from "@/app/types";
import type { RealtimeAgent } from '@openai/agents/realtime';

// Context providers & hooks
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";

// Utilities
import { RealtimeClient } from "@/app/agentConfigs/realtimeClient";

// Agent configs
import { allAgentSets, defaultAgentSetKey } from "@/app/agentConfigs";
// New SDK scenarios
import { simpleHandoffScenario } from "@/app/agentConfigs/simpleHandoff";
import { customerServiceRetailScenario } from "@/app/agentConfigs/customerServiceRetail";
import { chatSupervisorScenario } from "@/app/agentConfigs/chatSupervisor";

const sdkScenarioMap: Record<string, RealtimeAgent[]> = {
  simpleHandoff: simpleHandoffScenario,
  customerServiceRetail: customerServiceRetailScenario,
  chatSupervisor: chatSupervisorScenario,
};

import useAudioDownload from "./hooks/useAudioDownload";

function App() {
  const searchParams = useSearchParams()!;

  // Use urlCodec directly from URL search params (default: "opus")
  const urlCodec = searchParams.get("codec") || "opus";

  const {
    transcriptItems,
    addTranscriptMessage,
    addTranscriptBreadcrumb,
    updateTranscriptMessage,
    updateTranscriptItem,
  } = useTranscript();

  // Keep a mutable reference to the latest transcriptItems so that streaming
  // callbacks registered once during setup always have access to up-to-date
  // data without being re-registered on every render.
  const transcriptItemsRef = useRef<TranscriptItem[]>(transcriptItems);
  useEffect(() => {
    transcriptItemsRef.current = transcriptItems;
  }, [transcriptItems]);
  const { logClientEvent, logServerEvent, logHistoryItem } = useEvent();

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const sdkAudioElement = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, []);

  // Attach SDK audio element once it exists (after first render in browser)
  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;
    }
  }, [sdkAudioElement]);

  const sdkClientRef = useRef<RealtimeClient | null>(null);
  const loggedFunctionCallsRef = useRef<Set<string>>(new Set());
  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const [isEventsPaneExpanded, setIsEventsPaneExpanded] =
    useState<boolean>(true);
  const [userText, setUserText] = useState<string>("");
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState<boolean>(true);

  // Initialize the recording hook.
  const { startRecording, stopRecording, downloadRecording } =
    useAudioDownload();

  const sendClientEvent = (eventObj: any, eventNameSuffix = '') => {
    if (!sdkClientRef.current) {
      console.error('SDK client not available', eventObj);
      return;
    }

    try {
      sdkClientRef.current.sendEvent(eventObj);
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }
  };


  const selectedAgentConfigSet = chatSupervisorScenario;
  const selectedAgentName = 'chatAgent';
  const agentSetKey = 'chatSupervisor';

  const fetchEphemeralKey = async (): Promise<string | null> => {
    logClientEvent({ url: "/session" }, "fetch_session_token_request");
    const tokenResponse = await fetch("/api/session");
    const data = await tokenResponse.json();
    logServerEvent(data, "fetch_session_token_response");

    if (!data.client_secret?.value) {
      logClientEvent(data, "error.no_ephemeral_key");
      console.error("No ephemeral key provided by the server");
      setSessionStatus("DISCONNECTED");
      return null;
    }

    return data.client_secret.value;
  };

  const connectToRealtime = async () => {
      if (sessionStatus !== "DISCONNECTED") return;
      setSessionStatus("CONNECTING");
      try {
        const EPHEMERAL_KEY = await fetchEphemeralKey();
        if (!EPHEMERAL_KEY) return;
      const reorderedAgents = [...chatSupervisorScenario];
      // chatAgent is already first, but ensure it
      const idx = reorderedAgents.findIndex((a) => a.name === 'chatAgent');
        if (idx > 0) {
          const [agent] = reorderedAgents.splice(idx, 1);
          reorderedAgents.unshift(agent);
        }
        const client = new RealtimeClient({
          getEphemeralKey: async () => EPHEMERAL_KEY,
          initialAgents: reorderedAgents,
          audioElement: sdkAudioElement,
          extraContext: {
            addTranscriptBreadcrumb,
          },
        } as any);
        sdkClientRef.current = client;

        client.on("connection_change", (status) => {
          if (status === "connected") setSessionStatus("CONNECTED");
          else if (status === "connecting") setSessionStatus("CONNECTING");
          else setSessionStatus("DISCONNECTED");
        });

        client.on("message", (ev) => {
          logServerEvent(ev);

          // --- Realtime streaming handling ---------------------------------
          // The Realtime transport emits granular *delta* events while the
          // assistant is speaking or while the user's audio is still being
          // transcribed. Those events were previously only logged which made
          // the UI update only once when the final conversation.item.* event
          // arrived – effectively disabling streaming. We now listen for the
          // delta events and update the transcript as they arrive so that
          // 1) assistant messages stream token-by-token, and
          // 2) the user sees a live "Transcribing…" placeholder while we are
          //    still converting their speech to text.

          // NOTE: The exact payloads are still evolving.  We intentionally
          // access properties defensively to avoid runtime crashes if fields
          // are renamed or missing.

          try {
            // Guardrail trip event – mark last assistant message as FAIL
            if (ev.type === 'guardrail_tripped') {
              const lastAssistant = [...transcriptItemsRef.current]
                .reverse()
                .find((i) => i.role === 'assistant');

              if (lastAssistant) {
                updateTranscriptItem(lastAssistant.itemId, {
                  guardrailResult: {
                    status: 'DONE',
                    category: 'OFF_BRAND',
                    rationale: 'Guardrail triggered',
                    testText: '',
                  },
                } as any);
              }
              return;
            }

            // Response finished – if we still have Pending guardrail mark as
            // Pass. This event fires once per assistant turn.
            if (ev.type === 'response.done') {
              const lastAssistant = [...transcriptItemsRef.current]
                .reverse()
                .find((i) => i.role === 'assistant');

              if (lastAssistant) {
                const existing: any = (lastAssistant as any).guardrailResult;
                if (!existing || existing.status === 'IN_PROGRESS') {
                  updateTranscriptItem(lastAssistant.itemId, {
                    guardrailResult: {
                      status: 'DONE',
                      category: 'NONE',
                      rationale: '',
                    },
                  } as any);
                }
              }
              // continue processing other logic if needed
            }
            // Assistant text (or audio-to-text) streaming
            if (
              ev.type === 'response.text.delta' ||
              ev.type === 'response.audio_transcript.delta'
            ) {
              const itemId: string | undefined = (ev as any).item_id ?? (ev as any).itemId;
              const delta: string | undefined = (ev as any).delta ?? (ev as any).text;
              if (!itemId || !delta) return;

              // Ensure a transcript message exists for this assistant item.
              if (!transcriptItemsRef.current.some((t) => t.itemId === itemId)) {
                addTranscriptMessage(itemId, 'assistant', '');
                updateTranscriptItem(itemId, {
                  guardrailResult: {
                    status: 'IN_PROGRESS',
                  },
                } as any);
              }

              // Append the latest delta so the UI streams.
              updateTranscriptMessage(itemId, delta, true);
              updateTranscriptItem(itemId, { status: 'IN_PROGRESS' });
              return;
            }

            // Live user transcription streaming
            if (ev.type === 'conversation.input_audio_transcription.delta') {
              const itemId: string | undefined = (ev as any).item_id ?? (ev as any).itemId;
              const delta: string | undefined = (ev as any).delta ?? (ev as any).text;
              if (!itemId || typeof delta !== 'string') return;

              // If this is the very first chunk, create a hidden user message
              // so that we can surface "Transcribing…" immediately.
              if (!transcriptItemsRef.current.some((t) => t.itemId === itemId)) {
                addTranscriptMessage(itemId, 'user', 'Transcribing…');
              }

              updateTranscriptMessage(itemId, delta, true);
              updateTranscriptItem(itemId, { status: 'IN_PROGRESS' });
            }

            // Detect start of a new user speech segment when VAD kicks in.
            if (ev.type === 'input_audio_buffer.speech_started') {
              const itemId: string | undefined = (ev as any).item_id;
              if (!itemId) return;

              const exists = transcriptItemsRef.current.some(
                (t) => t.itemId === itemId,
              );
              if (!exists) {
                addTranscriptMessage(itemId, 'user', 'Transcribing…');
                updateTranscriptItem(itemId, { status: 'IN_PROGRESS' });
              }
            }

            // Final transcript once Whisper finishes
            if (
              ev.type === 'conversation.item.input_audio_transcription.completed'
            ) {
              const itemId: string | undefined = (ev as any).item_id;
              const transcriptText: string | undefined = (ev as any).transcript;
              if (!itemId || typeof transcriptText !== 'string') return;

              const exists = transcriptItemsRef.current.some(
                (t) => t.itemId === itemId,
              );
              if (!exists) {
                addTranscriptMessage(itemId, 'user', transcriptText.trim());
              } else {
                // Replace placeholder / delta text with final transcript
                updateTranscriptMessage(itemId, transcriptText.trim(), false);
              }
              updateTranscriptItem(itemId, { status: 'DONE' });
            }

            // Assistant streaming tokens or transcript
            if (
              ev.type === 'response.text.delta' ||
              ev.type === 'response.audio_transcript.delta'
            ) {
              const responseId: string | undefined =
                (ev as any).response_id ?? (ev as any).responseId;
              const delta: string | undefined = (ev as any).delta ?? (ev as any).text;
              if (!responseId || typeof delta !== 'string') return;

              // We'll use responseId as part of itemId to make it deterministic.
              const itemId = `assistant-${responseId}`;

              if (!transcriptItemsRef.current.some((t) => t.itemId === itemId)) {
                addTranscriptMessage(itemId, 'assistant', '');
              }

              updateTranscriptMessage(itemId, delta, true);
              updateTranscriptItem(itemId, { status: 'IN_PROGRESS' });
            }
          } catch (err) {
            // Streaming is best-effort – never break the session because of it.
            console.warn('streaming-ui error', err);
          }
        });

        client.on('history_added', (item) => {
          logHistoryItem(item);

          // Update the transcript view
          if (item.type === 'message') {
            const textContent = (item.content || [])
              .map((c: any) => {
                if (c.type === 'text') return c.text;
                if (c.type === 'input_text') return c.text;
                if (c.type === 'input_audio') return c.transcript ?? '';
                if (c.type === 'audio') return c.transcript ?? '';
                return '';
              })
              .join(' ')
              .trim();

            if (!textContent) return;

            const role = item.role as 'user' | 'assistant';

            // No PTT placeholder logic needed

            const exists = transcriptItemsRef.current.some(
              (t) => t.itemId === item.itemId,
            );

            if (!exists) {
              addTranscriptMessage(item.itemId, role, textContent, false);
              if (role === 'assistant') {
                updateTranscriptItem(item.itemId, {
                  guardrailResult: {
                    status: 'IN_PROGRESS',
                  },
                } as any);
              }
            } else {
              updateTranscriptMessage(item.itemId, textContent, false);
            }

            // After assistant message completes, add default guardrail PASS if none present.
            if (
              role === 'assistant' &&
              (item as any).status === 'completed'
            ) {
              const current = transcriptItemsRef.current.find(
                (t) => t.itemId === item.itemId,
              );
              const existing = (current as any)?.guardrailResult;
              if (existing && existing.status !== 'IN_PROGRESS') {
                // already final (e.g., FAIL) – leave as is.
              } else {
                updateTranscriptItem(item.itemId, {
                  guardrailResult: {
                    status: 'DONE',
                    category: 'NONE',
                    rationale: '',
                  },
                } as any);
              }
            }

            if ('status' in item) {
              updateTranscriptItem(item.itemId, {
                status:
                  (item as any).status === 'completed'
                    ? 'DONE'
                    : 'IN_PROGRESS',
              });
            }
          }

          // Surface function / hand-off calls as breadcrumbs
          if (item.type === 'function_call') {
            const title = `Tool call: ${(item as any).name}`;

            if (!loggedFunctionCallsRef.current.has(item.itemId)) {
              addTranscriptBreadcrumb(title, {
                arguments: (item as any).arguments,
              });
              loggedFunctionCallsRef.current.add(item.itemId);

              // If this looks like a handoff (transfer_to_*), switch active
              // agent so subsequent session updates & breadcrumbs reflect the
              // new agent. The Realtime SDK already updated the session on
              // the backend; this only affects the UI state.
              const toolName: string = (item as any).name ?? '';
              const handoffMatch = toolName.match(/^transfer_to_(.+)$/);
              if (handoffMatch) {
                const newAgentKey = handoffMatch[1];

                // Find agent whose name matches (case-insensitive)
                const candidate = selectedAgentConfigSet?.find(
                  (a) => a.name.toLowerCase() === newAgentKey.toLowerCase(),
                );
                if (candidate && candidate.name !== selectedAgentName) {
                // setSelectedAgentName(candidate.name);
                }
              }
            }
            return;
          }
        });

        // Handle continuous updates for existing items so streaming assistant
        // speech shows up while in_progress.
        client.on('history_updated', (history) => {
          history.forEach((item: any) => {
            if (item.type === 'function_call') {
              // Update breadcrumb data (e.g., add output) once we have more info.

              if (!loggedFunctionCallsRef.current.has(item.itemId)) {
                addTranscriptBreadcrumb(`Tool call: ${(item as any).name}`, {
                  arguments: (item as any).arguments,
                  output: (item as any).output,
                });
                loggedFunctionCallsRef.current.add(item.itemId);

                const toolName: string = (item as any).name ?? '';
                const handoffMatch = toolName.match(/^transfer_to_(.+)$/);
                if (handoffMatch) {
                  const newAgentKey = handoffMatch[1];
                  const candidate = selectedAgentConfigSet?.find(
                    (a) => a.name.toLowerCase() === newAgentKey.toLowerCase(),
                  );
                  if (candidate && candidate.name !== selectedAgentName) {
                  // setSelectedAgentName(candidate.name);
                  }
                }
              }

              return;
            }

            if (item.type !== 'message') return;

            const textContent = (item.content || [])
              .map((c: any) => {
                if (c.type === 'text') return c.text;
                if (c.type === 'input_text') return c.text;
                if (c.type === 'input_audio') return c.transcript ?? '';
                if (c.type === 'audio') return c.transcript ?? '';
                return '';
              })
              .join(' ')
              .trim();

            const role = item.role as 'user' | 'assistant';

            if (!textContent) return;

            const exists = transcriptItemsRef.current.some(
              (t) => t.itemId === item.itemId,
            );
              if (!exists) {
                addTranscriptMessage(item.itemId, role, textContent, false);
                if (role === 'assistant') {
                  updateTranscriptItem(item.itemId, {
                    guardrailResult: {
                      status: 'IN_PROGRESS',
                    },
                  } as any);
                }
            } else {
              updateTranscriptMessage(item.itemId, textContent, false);
            }

            if ('status' in item) {
              updateTranscriptItem(item.itemId, {
                status:
                  (item as any).status === 'completed'
                    ? 'DONE'
                    : 'IN_PROGRESS',
              });
            }
          });
        });

        await client.connect();
      } catch (err) {
        console.error("Error connecting via SDK:", err);
        setSessionStatus("DISCONNECTED");
      }
      return;
  };

  const disconnectFromRealtime = () => {
    if (sdkClientRef.current) {
      sdkClientRef.current.disconnect();
      sdkClientRef.current = null;
    }
    setSessionStatus("DISCONNECTED");
    setIsPTTUserSpeaking(false);

    logClientEvent({}, "disconnected");
  };

  const sendSimulatedUserMessage = (text: string) => {
    const id = uuidv4().slice(0, 32);
    addTranscriptMessage(id, "user", text, true);

    sendClientEvent(
      {
        type: "conversation.item.create",
        item: {
          id,
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      },
      "(simulated user text message)"
    );
    sendClientEvent(
      { type: "response.create" },
      "(trigger response after simulated user text message)"
    );
  };

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    // In SDK scenarios RealtimeClient manages session config automatically.
    if (sdkClientRef.current) {
      if (shouldTriggerResponse) {
        sendSimulatedUserMessage('hi');
      }

      // Reflect Push-to-Talk UI state by (de)activating server VAD on the
      // backend. The Realtime SDK supports live session updates via the
      // `session.update` event.
      const client = sdkClientRef.current;
      if (client) {
        const turnDetection = isPTTActive
          ? null
          : {
              type: 'server_vad',
              threshold: 0.9,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
              create_response: true,
            };
        try {
          client.sendEvent({
            type: 'session.update',
            session: {
              turn_detection: turnDetection,
            },
          });
        } catch (err) {
          console.warn('Failed to update session', err);
        }
      }
      return;
    }
  };

  const cancelAssistantSpeech = async () => {

    // Interrupts server response and clears local audio.
    if (sdkClientRef.current) {
      try {
        sdkClientRef.current.interrupt();
      } catch (err) {
        console.error('Failed to interrupt', err);
      }
    }
  };

  const handleSendTextMessage = () => {
    if (!userText.trim()) return;
    cancelAssistantSpeech();

    if (!sdkClientRef.current) {
      console.error('SDK client not available');
      return;
    }

    try {
      sdkClientRef.current.sendUserText(userText.trim());
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }

    setUserText("");
  };

  const handleTalkButtonDown = () => {
    if (sessionStatus !== 'CONNECTED' || sdkClientRef.current == null) return;
    cancelAssistantSpeech();

    setIsPTTUserSpeaking(true);
    sendClientEvent({ type: "input_audio_buffer.clear" }, "clear PTT buffer");

    // No placeholder; we'll rely on server transcript once ready.
  };

  const handleTalkButtonUp = () => {
    if (sessionStatus !== 'CONNECTED' || sdkClientRef.current == null || !isPTTUserSpeaking)
      return;

    setIsPTTUserSpeaking(false);
    sendClientEvent({ type: "input_audio_buffer.commit" }, "commit PTT");
    sendClientEvent({ type: "response.create" }, "trigger response PTT");
  };

  const onToggleConnection = () => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");
    } else {
      connectToRealtime();
    }
  };

  const handleCodecChange = (newCodec: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set("codec", newCodec);
    window.location.replace(url.toString());
  };

  useEffect(() => {
    const storedPushToTalkUI = localStorage.getItem("pushToTalkUI");
    if (storedPushToTalkUI) {
      setIsPTTActive(storedPushToTalkUI === "true");
    }
    const storedLogsExpanded = localStorage.getItem("logsExpanded");
    if (storedLogsExpanded) {
      setIsEventsPaneExpanded(storedLogsExpanded === "true");
    }
    const storedAudioPlaybackEnabled = localStorage.getItem(
      "audioPlaybackEnabled"
    );
    if (storedAudioPlaybackEnabled) {
      setIsAudioPlaybackEnabled(storedAudioPlaybackEnabled === "true");
    } else {
      setIsAudioPlaybackEnabled(true); // Default to true
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTActive.toString());
  }, [isPTTActive]);

  useEffect(() => {
    localStorage.setItem("logsExpanded", isEventsPaneExpanded.toString());
  }, [isEventsPaneExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "audioPlaybackEnabled",
      isAudioPlaybackEnabled.toString()
    );
  }, [isAudioPlaybackEnabled]);

  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaybackEnabled) {
        audioElementRef.current.muted = false;
        audioElementRef.current.play().catch((err) => {
          console.warn("Autoplay may be blocked by browser:", err);
        });
      } else {
        // Mute and pause to avoid brief audio blips before pause takes effect.
        audioElementRef.current.muted = true;
        audioElementRef.current.pause();
      }
    }

    // Toggle server-side audio stream mute so bandwidth is saved when the
    // user disables playback. Only supported when using the SDK path.
    if (sdkClientRef.current) {
      try {
        sdkClientRef.current.mute(!isAudioPlaybackEnabled);
      } catch (err) {
        console.warn('Failed to toggle SDK mute', err);
      }
    }
  }, [isAudioPlaybackEnabled]);

  // Ensure mute state is propagated to transport right after we connect or
  // whenever the SDK client reference becomes available.
  useEffect(() => {
    if (sessionStatus === 'CONNECTED' && sdkClientRef.current) {
      try {
        sdkClientRef.current.mute(!isAudioPlaybackEnabled);
      } catch (err) {
        console.warn('mute sync after connect failed', err);
      }
    }
  }, [sessionStatus, isAudioPlaybackEnabled]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED" && audioElementRef.current?.srcObject) {
      // The remote audio stream from the audio element.
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }

    // Clean up on unmount or when sessionStatus is updated.
    return () => {
      stopRecording();
    };
  }, [sessionStatus]);

  useEffect(() => {
    if (sessionStatus === 'CONNECTED' && transcriptItems.length === 0) {
      sendSimulatedUserMessage('hi');
    }
  }, [sessionStatus, transcriptItems]);

  // Add state for logs panel visibility
  const [showLogs, setShowLogs] = useState<boolean>(false);

  // Add state for chat panel visibility
  const [showChat, setShowChat] = useState<boolean>(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    service: '',
    message: '',
    honeypot: '' // Anti-spam honeypot field
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setContactMessage('');

    // Check honeypot - if filled, it's likely a bot
    if (contactForm.honeypot) {
      setContactMessage('Error: Spam detected. Please try again.');
      setIsSubmittingContact(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        setContactMessage('Thank you! Your message has been sent successfully. We\'ll get back to you within 24 hours.');
        setContactForm({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          service: '',
          message: '',
          honeypot: ''
        });
      } else {
        const errorData = await response.json();
        setContactMessage(`Error: ${errorData.error || 'Failed to send message'}`);
      }
    } catch (error) {
      setContactMessage('Error: Something went wrong. Please try again.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const updateContactForm = (field: string, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  const [sphereRotation, setSphereRotation] = useState(0);
  const [highlightAngle, setHighlightAngle] = useState(0);
  const animationRef = useRef<number | null>(null);
  useEffect(() => {
    let start = Date.now();
    function animate() {
      const now = Date.now();
      const elapsed = (now - start) / 1000;
      setSphereRotation((360 * elapsed / 30) % 360); // 30s per rotation
      setHighlightAngle((360 * elapsed / 12) % 360); // 12s for highlight orbit
      animationRef.current = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  return (
    <div className="text-base flex flex-col h-screen bg-gray-100 text-gray-800 relative">
      {/* Header/Navbar */}
      <header className="bg-white shadow sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-700 mr-8 cursor-pointer" onClick={() => window.location.reload()}>
                RomaTek <span className="text-gray-700">AI Solutions</span>
              </span>
              {/* Nav Links */}
              <nav className="hidden md:flex space-x-6 text-base font-medium">
                {/* <a href="/about" className="hover:text-blue-600">About</a> */}
                <a href="/blog" className="hover:text-blue-600">Blog</a>
                <a href="#contact" className="hover:text-blue-600" onClick={e => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>Contact Us</a>
              </nav>
          </div>
            {/* Sign In Button */}
          <div>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition mr-2"
                onClick={() => {
                  setShowChat((prev) => !prev);
                  setSessionStatus("DISCONNECTED");
                }}
              >
                Chat with RomaTek AI
              </button>
                </div>
              </div>
            </div>
      </header>
      {/* Hero Section */}
      <section className="w-full px-4 py-16 text-center bg-gray-200">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-6">
          Practical AI for{' '}
          <span className="text-blue-600">Small to Medium<br className="sm:hidden" /> Businesses</span>
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-12">
          RomaTek AI empowers small to medium-sized businesses with practical AI and IT solutions. From strategic consulting to custom AI tools, we deliver measurable results—boosting efficiency, cutting costs, and driving growth.
        </p>
        {/* Rotating Sphere */}
        <div className="flex flex-col items-center justify-center mb-10">
          <ThreeSphere />
          <div className="flex gap-4 mt-8">
            <button 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get Started Today
            </button>
            <button
              className="border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
              onClick={() => {
                setShowChat(true);
                setSessionStatus('DISCONNECTED');
              }}
            >
              Talk to Our AI Assistant
            </button>
        </div>
      </div>
    </section>
    {/* AI Consulting Services Section */}
    <section className="w-full bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our AI Consulting Services</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">From strategy to implementation, we provide comprehensive AI solutions tailored to your business needs.</p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Service Card 1 */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left shadow-sm hover:shadow-md transition">
          <div className="text-blue-600 text-2xl mb-3">💡</div>
          <h3 className="font-semibold text-lg mb-2">AI Strategy & Road‑mapping</h3>
          <p className="text-gray-600 text-sm">Identify quick‑win pilots, craft a 3 to 12‑month roadmap, and model ROI—grounded in Microsoft Azure best practices.</p>
        </div>
        {/* Service Card 2 */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left shadow-sm hover:shadow-md transition">
          <div className="text-blue-600 text-2xl mb-3">⚙️</div>
          <h3 className="font-semibold text-lg mb-2">Rapid POC & Custom Implementation</h3>
          <p className="text-gray-600 text-sm">Spin up production‑ready prototypes in weeks—chatbots, document‑processing pipelines, copilot extensions—then scale on Azure.</p>
        </div>
        {/* Service Card 3 */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left shadow-sm hover:shadow-md transition">
          <div className="text-blue-600 text-2xl mb-3">🧪</div>
          <h3 className="font-semibold text-lg mb-2">AI‑Assisted Software Development</h3>
          <p className="text-gray-600 text-sm">Ship faster using AI‑assisted coding, continuous automated testing, and intelligent CI/CD pipelines—delivering secure, production‑ready code every time</p>
        </div>
        {/* Service Card 4 */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left shadow-sm hover:shadow-md transition">
          <div className="text-blue-600 text-2xl mb-3">📚</div>
          <h3 className="font-semibold text-lg mb-2">AI Training & Education</h3>
          <p className="text-gray-600 text-sm">Empower your team with comprehensive AI training programs and workshops tailored to your industry.</p>
        </div>
        {/* Service Card 5 */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left shadow-sm hover:shadow-md transition">
          <div className="text-blue-600 text-2xl mb-3">⚖️</div>
          <h3 className="font-semibold text-lg mb-2">AI Ethics & Compliance</h3>
          <p className="text-gray-600 text-sm">Ensure responsible AI deployment with ethical frameworks and regulatory compliance guidance.</p>
        </div>
        {/* Service Card 6 */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left shadow-sm hover:shadow-md transition">
          <div className="text-blue-600 text-2xl mb-3">🔄</div>
          <h3 className="font-semibold text-lg mb-2">Process Automation</h3>
          <p className="text-gray-600 text-sm">Streamline onboarding, finance, and support ops with low‑code flows, RPA, and API scripting—cut hours, not corners.</p>
        </div>
      </div>
    </section>
    {/* Contact Section */}
    <section id="contact" className="w-full bg-black py-20 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-start justify-between">
        {/* Left: Contact Info */}
        <div className="flex-1 text-white mb-10 lg:mb-0">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-lg text-gray-300 mb-10 max-w-lg">Let's discuss how AI can revolutionize your operations and drive growth. Get in touch for a free consultation.</p>
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Get In Touch</h3>
            <div className="flex items-start mb-4">
              <span className="text-blue-400 text-2xl mr-4 mt-1">✉️</span>
          <div>
                <span className="font-semibold">Email</span><br />
                <span className="text-gray-300">hello@romatekai.com</span>
          </div>
            </div>
            <div className="flex items-start mb-6">
              <span className="text-blue-400 text-2xl mr-4 mt-1">📞</span>
          <div>
                <span className="font-semibold">Phone</span><br />
                <span className="text-gray-300">484.695.0269</span>
          </div>
        </div>
            <div>
              <span className="font-semibold">Follow Us</span>
              <div className="flex gap-3 mt-2">
                <a href="https://x.com/RomaTekAI" className="bg-gray-800 hover:bg-gray-700 p-2 rounded text-white text-xl" aria-label="X.com"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 19c11 0 13-9 13-13v-.6A9.3 9.3 0 0023 3a9.1 9.1 0 01-2.6.7A4.5 4.5 0 0022.4.4a9.1 9.1 0 01-2.9 1.1A4.5 4.5 0 0016.1 0c-2.5 0-4.5 2-4.5 4.5 0 .4 0 .8.1 1.2A12.8 12.8 0 013 1.1a4.5 4.5 0 001.4 6A4.5 4.5 0 012 6.1v.1c0 2.2 1.6 4.1 3.8 4.5a4.5 4.5 0 01-2 .1c.6 1.8 2.3 3.1 4.3 3.1A9.1 9.1 0 012 17.5a12.8 12.8 0 006.9 2" /></svg></a>
            </div>
          </div>
                </div>
              </div>
        {/* Right: Contact Form */}
        <div className="flex-1 max-w-xl w-full bg-gray-900 rounded-xl shadow-lg p-8 text-white ml-auto">
          <h3 className="text-2xl font-bold mb-6">Start Your AI Journey</h3>
          
          {contactMessage && (
            <div className={`mb-4 p-3 rounded-lg ${contactMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {contactMessage}
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleContactSubmit}>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1">First Name *</label>
                <input type="text" className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required value={contactForm.firstName} onChange={(e) => updateContactForm('firstName', e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1">Last Name *</label>
                <input type="text" className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required value={contactForm.lastName} onChange={(e) => updateContactForm('lastName', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email Address *</label>
              <input type="email" className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required value={contactForm.email} onChange={(e) => updateContactForm('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Company</label>
              <input type="text" className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={contactForm.company} onChange={(e) => updateContactForm('company', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Interested Service</label>
              <select className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={contactForm.service} onChange={(e) => updateContactForm('service', e.target.value)}>
                <option value="">Select a service</option>
                <option>AI Strategy & Road‑mapping</option>
                <option>Rapid POC & Custom Implementation</option>
                <option>AI‑Assisted Software Development</option>
                <option>AI Training & Education</option>
                <option>AI Ethics & Compliance</option>
                <option>Process Automation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Message *</label>
              <textarea className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} required value={contactForm.message} onChange={(e) => updateContactForm('message', e.target.value)} placeholder="Tell us about your AI goals and challenges..."></textarea>
            </div>
            
            {/* Honeypot field - hidden from real users */}
            <div style={{ display: 'none' }}>
              <label htmlFor="website">Website (leave blank)</label>
              <input
                type="text"
                id="website"
                name="website"
                value={contactForm.honeypot}
                onChange={(e) => updateContactForm('honeypot', e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmittingContact}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md text-lg mt-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingContact ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </section>
    {/* Main Content */}
      <div className="flex flex-1 gap-2 px-2 overflow-hidden relative">
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Modal background */}
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => {
              setShowChat(false);
              disconnectFromRealtime();
            }}
          />
          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full h-[90vh] flex flex-col p-4">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold z-10"
              onClick={() => {
                setShowChat(false);
                disconnectFromRealtime();
              }}
              aria-label="Close chat"
            >
              ×
            </button>
            <div className="flex-1 flex flex-col min-h-0">
        <Transcript
          userText={userText}
          setUserText={setUserText}
          onSendMessage={handleSendTextMessage}
          downloadRecording={downloadRecording}
          canSend={
            sessionStatus === "CONNECTED" &&
                  sdkClientRef.current != null
          }
                sessionStatus={sessionStatus}
                onConnectClick={connectToRealtime}
                isAudioPlaybackEnabled={isAudioPlaybackEnabled}
                setIsAudioPlaybackEnabled={setIsAudioPlaybackEnabled}
        />
      </div>
          </div>
        </div>
      )}
      {showLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Modal background */}
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowLogs(false)} />
          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full h-[95vh] mx-4 flex flex-col">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold z-10"
              onClick={() => setShowLogs(false)}
              aria-label="Close logs"
            >
              ×
            </button>
            <div className="flex-1 flex flex-col min-h-0 h-full">
              <Events
                isExpanded={true}
                isAudioPlaybackEnabled={isAudioPlaybackEnabled}
                setIsAudioPlaybackEnabled={setIsAudioPlaybackEnabled}
                codec={urlCodec}
                onCodecChange={handleCodecChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
      <BottomToolbar
        sessionStatus={sessionStatus}
        onToggleConnection={onToggleConnection}
        isPTTActive={isPTTActive}
        setIsPTTActive={setIsPTTActive}
        isPTTUserSpeaking={isPTTUserSpeaking}
        handleTalkButtonDown={handleTalkButtonDown}
        handleTalkButtonUp={handleTalkButtonUp}
        isEventsPaneExpanded={isEventsPaneExpanded}
        setIsEventsPaneExpanded={setIsEventsPaneExpanded}
        isAudioPlaybackEnabled={isAudioPlaybackEnabled}
        setIsAudioPlaybackEnabled={setIsAudioPlaybackEnabled}
        codec={urlCodec}
        onCodecChange={handleCodecChange}
      />
    </div>
  );
}

export default App;
