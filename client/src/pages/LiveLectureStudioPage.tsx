import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useClassContext } from '../context/ClassContext';
import { SlideItem, FilteredVoiceChunk, MasterLectureNotes, RecordingStatus } from '../types';
import { publishLiveEvent, clearLiveState } from '../services/classLiveChannel';
import { StudentLiveView } from './StudentLiveView';
import jsPDF from 'jspdf';
import {
  Mic,
  MicOff,
  Radio,
  FileText,
  Play,
  Square,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Download,
  Clock,
  ArrowRight,
  Layers,
  Volume2,
  Zap,
  Info,
  RefreshCw,
  X,
  ArrowDown,
  AlertCircle,
  HelpCircle,
  Terminal,
  Server,
  Cpu,
  Copy,
  Hash,
  Users,
  UploadCloud,
  FileUp,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  ProcessedDeck,
  parseUploadedLectureDeck,
  SlideDeckMeta,
} from '../services/slideParser';
import {
  PRETRAINED_DECK,
  loadUploadedDecks,
  saveUploadedDeck,
  deleteUploadedDeck,
} from '../services/deckStorage';
import {
  matchSentenceToSlides,
  detectVoiceCommand,
  buildDeckVocabulary,
  correctSpeechTerms,
} from '../services/slideMatcher';

const COMMON_FILLERS = [
  'uhm', 'uh', 'um', 'like', 'you know', 'basically', 'actually', 'sort of',
  'kind of', 'right guys', 'so yeah', 'you see', 'literally', 'okay so', 'i mean'
];

const SLIDE_KEYWORDS = [
  { slideIndex: 0, keywords: ['matrix', 'adjacency matrix', 'sparse', 'v squared', 'v^2', 'representation', 'terabyte', 'ram', 'grid', 'representation'] },
  { slideIndex: 1, keywords: ['bfs', 'breadth-first', 'breadth first', 'queue', 'fifo', 'level-order', 'ripple', 'ripples', 'shortest path'] },
  { slideIndex: 2, keywords: ['visited', 'enqueue', 'pop', 'explosion', 'invariant', 'duplicate', 'marked', 'memory blowup', 'limit exceeded'] },
  { slideIndex: 3, keywords: ['dfs', 'depth-first', 'depth first', 'recursion', 'call stack', 'activation frame', 'stack overflow', 'lifo'] },
  { slideIndex: 4, keywords: ['cycle', 'cycles', 'dag', 'directed acyclic', 'kahn', 'topological', 'in-degree', 'indegree', 'back-edge'] },
];

const DEMO_PRESET_LECTURE = [
  {
    text: 'Good morning class. Today we are getting into Graph Representations and memory footprints.',
    category: 'core_concept' as const,
  },
  {
    text: 'When we allocate an Adjacency Matrix, basically it allocates V squared space in hardware RAM.',
    category: 'core_concept' as const,
  },
  {
    text: 'Now moving to Breadth-First Search, like ripples in a pond, we expand layer by layer using an explicit FIFO queue.',
    category: 'analogy' as const,
  },
  {
    text: 'Listen up class, this is critical: you must mark neighbors visited immediately when enqueued, not when popped!',
    category: 'pitfall_warning' as const,
  },
  {
    text: 'If you wait until dequeue, you know, cyclic paths will inject duplicate nodes and cause exponential queue explosion.',
    category: 'pitfall_warning' as const,
  },
  {
    text: 'For Depth-First Search, remember our lecture on Call Stacks: each recursive call pushes an activation frame.',
    category: 'core_concept' as const,
  },
  {
    text: 'And finally on slide 5: Directed Acyclic Graphs have zero cycles, so Kahn\'s in-degree sorting can linearize dependencies.',
    category: 'core_concept' as const,
  }
];

export const LiveLectureStudioPage: React.FC = () => {
  const {
    currentUser,
    liveSession,
    startLiveSession,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetLiveSession,
    setRecordingStatus,
    setCurrentSlideIndex,
    uploadSlidesDeck,
    addVoiceChunk,
    reassignVoiceChunk,
    generateMasterNotes,
    getLateArrivalCatchUp,
    activeLanguage,
  } = useApp();

  const isTeacher = currentUser.role === 'teacher';

  // ── Class Code integration ────────────────────────────────────────────────
  const { activeSession: teacherClassSession, joinedClass, roster } = useClassContext();
  // The class code the teacher is broadcasting on (null if no active class)
  const activeClassCode = isTeacher ? (teacherClassSession?.code ?? null) : null;
  // Copy-code helper for teacher chip
  const [chipCopied, setChipCopied] = useState(false);
  const copyChipCode = useCallback(async () => {
    if (!activeClassCode) return;
    try { await navigator.clipboard.writeText(activeClassCode); } catch { /* */ }
    setChipCopied(true);
    setTimeout(() => setChipCopied(false), 2000);
  }, [activeClassCode]);

  // Check URL query param for debug mode (?debug=1)
  const isDebugUrl = useMemo(() => {
    return new URLSearchParams(window.location.search).get('debug') === '1';
  }, []);
  const [showDebugStrip, setShowDebugStrip] = useState<boolean>(isDebugUrl);

  // Real-time transcription state
  const [interimText, setInterimText] = useState<string>('');
  const [speechWarning, setSpeechWarning] = useState<string | null>(null);
  const [activeEngine, setActiveEngine] = useState<'browser' | 'server'>('browser');
  const [debugLog, setDebugLog] = useState<{
    engine: string;
    recognitionState: string;
    lastEvent: string;
    lastError: string;
    lastEventTime: string;
    lang: string;
  }>({
    engine: 'Browser STT (Web Speech)',
    recognitionState: 'idle',
    lastEvent: 'none',
    lastError: 'none',
    lastEventTime: 'none',
    lang: activeLanguage === 'hi' ? 'hi-IN' : activeLanguage === 'ml' ? 'ml-IN' : 'en-IN',
  });

  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(false);
  const [arrivalMinuteInput, setArrivalMinuteInput] = useState<number>(20);
  const [showLateCatchUpModal, setShowLateCatchUpModal] = useState<boolean>(false);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState<boolean>(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);

  // Real Web Audio level & waveform state
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [waveformBars, setWaveformBars] = useState<number[]>([6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]);

  // Tabs below top recording & transcript section
  const [activeTab, setActiveTab] = useState<'slides_view' | 'comparison_matrix' | 'master_notes'>('slides_view');

  // References
  const recognitionRef = useRef<any>(null);
  const isRecordingIntentRef = useRef<boolean>(false);
  const currentSlideRef = useRef<number>(0);
  const manualOverrideUntilRef = useRef<number>(0);
  const elapsedSecondsRef = useRef<number>(0);
  const recentSentencesRef = useRef<string[]>([]);
  const isManualActive = () => Date.now() < manualOverrideUntilRef.current;
  const [isManualOverrideBadge, setIsManualOverrideBadge] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const demoIntervalRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);
  const networkErrorCountRef = useRef<number>(0);

  // Synchronize currentSlideRef and elapsedSecondsRef whenever liveSession updates
  useEffect(() => {
    currentSlideRef.current = liveSession.currentSlideIndex;
  }, [liveSession.currentSlideIndex]);

  useEffect(() => {
    elapsedSecondsRef.current = liveSession.elapsedSeconds;
  }, [liveSession.elapsedSeconds]);

  // Check manual override expiration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setIsManualOverrideBadge(isManualActive());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Safe manual slide changer that sets ref immediately, tags manual override for 10s, and updates state
  const handleManualSlideChange = useCallback(
    (newIndex: number) => {
      const clamped = Math.max(0, Math.min(newIndex, liveSession.slides.length - 1));
      currentSlideRef.current = clamped;
      manualOverrideUntilRef.current = Date.now() + 10000; // 10s override
      setIsManualOverrideBadge(true);
      setCurrentSlideIndex(clamped);
      if (activeClassCode) {
        publishLiveEvent(activeClassCode, {
          type: 'slide-change',
          slideIndex: clamped,
        });
      }
    },
    [liveSession.slides.length, setCurrentSlideIndex, activeClassCode]
  );

  // Log telemetry helper
  const logTelemetry = (event: string, state: string, error: string = 'none') => {
    console.log(`[LectureLens Speech] event="${event}" state="${state}" error="${error}"`);
    setDebugLog((prev) => ({
      ...prev,
      lastEvent: event,
      recognitionState: state,
      lastError: error,
      lastEventTime: new Date().toLocaleTimeString(),
      lang: activeLanguage === 'hi' ? 'hi-IN' : activeLanguage === 'ml' ? 'ml-IN' : 'en-IN',
    }));
  };

  // Format mm:ss
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Deck Management State ────────────────────────────────────────────────
  const [uploadedDecks, setUploadedDecks] = useState<ProcessedDeck[]>(() =>
    loadUploadedDecks(currentUser.id, activeClassCode)
  );
  const [selectedDeckId, setSelectedDeckId] = useState<string>(PRETRAINED_DECK.meta.id);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'reading' | 'extracting' | 'ready' | 'error'
  >('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active processed deck
  const activeDeck = useMemo<ProcessedDeck>(() => {
    if (selectedDeckId === PRETRAINED_DECK.meta.id) {
      return PRETRAINED_DECK;
    }
    const found = uploadedDecks.find((d) => d.meta.id === selectedDeckId);
    return found || PRETRAINED_DECK;
  }, [selectedDeckId, uploadedDecks]);

  // Keep liveSession slides synced when deck changes
  const handleSelectDeck = useCallback(
    (deck: ProcessedDeck) => {
      if (liveSession.recordingStatus === 'recording') return;
      setSelectedDeckId(deck.meta.id);
      uploadSlidesDeck(deck.slides);
      // Broadcast deck update to students
      if (activeClassCode) {
        publishLiveEvent(activeClassCode, {
          type: 'deck-updated',
          slides: deck.slides,
          deckTitle: deck.meta.name,
        });
      }
    },
    [liveSession.recordingStatus, uploadSlidesDeck, activeClassCode]
  );

  // File Upload Processor
  const processUploadedFile = async (file: File) => {
    setUploadError(null);
    setUploadStatus('uploading');

    try {
      const processed = await parseUploadedLectureDeck(file, (step) => {
        if (step === 'Reading slides') setUploadStatus('reading');
        else if (step === 'Extracting key concepts') setUploadStatus('extracting');
        else if (step === 'Ready') setUploadStatus('ready');
      });

      saveUploadedDeck(currentUser.id, processed, activeClassCode);
      setUploadedDecks((prev) => [processed, ...prev.filter((d) => d.meta.id !== processed.meta.id)]);
      handleSelectDeck(processed);
      setUploadStatus('ready');
      setTimeout(() => setUploadStatus('idle'), 2500);
    } catch (err: any) {
      console.error('Slide upload error:', err);
      setUploadStatus('error');
      setUploadError(err.message || 'Failed to process presentation file. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (liveSession.recordingStatus === 'recording') return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDeleteDeck = (deckId: string) => {
    deleteUploadedDeck(currentUser.id, deckId, activeClassCode);
    setUploadedDecks((prev) => prev.filter((d) => d.meta.id !== deckId));
    if (selectedDeckId === deckId) {
      handleSelectDeck(PRETRAINED_DECK);
    }
    setDeckToDelete(null);
  };

  // Synchronize ref with live session status
  useEffect(() => {
    isRecordingIntentRef.current = liveSession.recordingStatus === 'recording';
  }, [liveSession.recordingStatus]);

  // Vocabulary list derived from active deck for phrase boosting & spell-correction
  const activeDeckVocabulary = useMemo(() => {
    return buildDeckVocabulary(liveSession.slides);
  }, [liveSession.slides]);

  // Dynamic Slide Synchronization & Command Processor based on active deck
  const processFinalizedSpeech = (spokenText: string) => {
    const trimmed = spokenText.trim();
    if (!trimmed) return;

    // 1. Detect voice commands ("next slide", "previous slide", "go to slide 4", "back to problem statement")
    const cmd = detectVoiceCommand(
      trimmed,
      currentSlideRef.current,
      liveSession.slides.length,
      liveSession.slides
    );

    if (cmd.isCommand && cmd.target !== undefined) {
      logTelemetry(`voice_command(${cmd.action}) -> Slide ${cmd.target + 1}`, 'command_executed');
      currentSlideRef.current = cmd.target;
      setCurrentSlideIndex(cmd.target);
      if (activeClassCode) {
        publishLiveEvent(activeClassCode, {
          type: 'slide-change',
          slideIndex: cmd.target,
        });
      }
      // Voice commands change slides and are NOT included in the lecture transcript!
      return;
    }

    // 2. Light spell-correction pass against active deck vocabulary (e.g. "neurofiction" -> "NeuroFusion")
    const correctedText = correctSpeechTerms(trimmed, activeDeckVocabulary);

    // 3. Multi-factor slide matching
    let targetSlideIdx = currentSlideRef.current;
    let alignmentScore = 80;
    let category: FilteredVoiceChunk['category'] = 'core_concept';

    if (isManualActive()) {
      // Manual override active (10s lock): lock sentence to teacher's selected slide
      targetSlideIdx = currentSlideRef.current;
      alignmentScore = 85;
    } else {
      const matchResult = matchSentenceToSlides(
        correctedText,
        recentSentencesRef.current,
        liveSession.slides,
        currentSlideRef.current,
        activeDeck.keywordsPerSlide
      );

      targetSlideIdx = matchResult.targetSlideIndex;
      alignmentScore = matchResult.alignmentScore;
      if (matchResult.isOffSlide) {
        category = 'off_slide';
      }

      // If matcher advanced to a new slide, update active slide
      if (targetSlideIdx !== currentSlideRef.current) {
        currentSlideRef.current = targetSlideIdx;
        setCurrentSlideIndex(targetSlideIdx);
        if (activeClassCode) {
          publishLiveEvent(activeClassCode, {
            type: 'slide-change',
            slideIndex: targetSlideIdx,
          });
        }
      }
    }

    // Update recent sentences window
    recentSentencesRef.current = [...recentSentencesRef.current.slice(-3), correctedText];

    // Compute real elapsed timestamp from ref
    const currentTimestamp = formatTime(elapsedSecondsRef.current);

    // 4. Add finalized voice chunk with REAL slideIndex and REAL alignmentScore
    addVoiceChunk(
      correctedText,
      currentTimestamp,
      targetSlideIdx,
      false,
      alignmentScore,
      category
    );
  };

  // Start Real Web Audio Analyser
  const startAudioVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const renderMeter = () => {
        if (!analyserRef.current || !isRecordingIntentRef.current) {
          setAudioLevel(0);
          setWaveformBars([6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]);
          return;
        }

        const buffer = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(buffer);

        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / (buffer.length || 1);

        // Real sound threshold: below noise floor reads 0%
        const noiseFloor = 3.5;
        let normalized = 0;
        if (avg > noiseFloor) {
          normalized = Math.min(100, Math.round(((avg - noiseFloor) / (90 - noiseFloor)) * 100));
        }
        setAudioLevel(normalized);

        // Calculate 12 responsive waveform bars matching real audio
        const step = Math.max(1, Math.floor(buffer.length / 12));
        const bars: number[] = [];
        for (let i = 0; i < 12; i++) {
          const rawVal = buffer[i * step] || 0;
          if (rawVal > noiseFloor && normalized > 0) {
            const h = Math.round(8 + (rawVal / 255) * 36);
            bars.push(Math.min(44, h));
          } else {
            bars.push(6); // flat baseline when silent
          }
        }
        setWaveformBars(bars);

        animFrameRef.current = requestAnimationFrame(renderMeter);
      };

      renderMeter();
    } catch (err) {
      console.warn('Web Audio visualizer initialization warning:', err);
    }
  };

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
    setWaveformBars([6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]);
  };

  // Setup Web Speech Recognition
  const initSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      logTelemetry('unsupported', 'unsupported', 'SpeechRecognition not present');
      setSpeechWarning(
        'Live speech recognition is not available in this browser. Use Chrome or Edge, or record with Server STT fallback.'
      );
      return null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Language configured according to selected UI language
      const langCode =
        activeLanguage === 'hi' ? 'hi-IN' : activeLanguage === 'ml' ? 'ml-IN' : 'en-IN';
      recognition.lang = langCode;

      recognition.onstart = () => {
        logTelemetry('onstart', 'listening');
      };

      recognition.onaudiostart = () => {
        logTelemetry('onaudiostart', 'audio_capturing');
      };

      recognition.onspeechstart = () => {
        logTelemetry('onspeechstart', 'speech_detected');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';

          if (result.isFinal) {
            const finalized = text.trim();
            logTelemetry(`onresult(final): "${finalized}"`, 'transcribed');
            if (finalized.length > 0) {
              processFinalizedSpeech(finalized);
            }
            setInterimText('');
          } else {
            currentInterim += text;
          }
        }

        if (currentInterim.trim().length > 0) {
          logTelemetry(`onresult(interim): "${currentInterim.trim()}"`, 'interim');
          setInterimText(currentInterim.trim());
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;
        logTelemetry(`onerror: ${errType}`, 'error', errType);

        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          isRecordingIntentRef.current = false;
          setRecordingStatus(
            'error',
            'Microphone access was denied. Please allow microphone access in your browser settings (click the lock/mic icon in the address bar).'
          );
          stopAudioVisualizer();
        } else if (errType === 'network') {
          networkErrorCountRef.current++;
          if (networkErrorCountRef.current >= 2) {
            setSpeechWarning(
              'Browser Speech Recognition network service is unavailable. Switched to Server STT fallback.'
            );
            setActiveEngine('server');
            startServerSTTFallback();
          }
        } else if (errType === 'no-speech' || errType === 'aborted') {
          // Normal silence or pause, handled smoothly
        }
      };

      recognition.onend = () => {
        logTelemetry('onend', isRecordingIntentRef.current ? 'restarting' : 'stopped');
        // Auto-restart recognition only while state is recording with 300ms debounce
        if (isRecordingIntentRef.current && activeEngine === 'browser') {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (isRecordingIntentRef.current) {
              try {
                recognition.start();
                logTelemetry('restart_success', 'listening');
              } catch (e: any) {
                // If already active or error, do not loop aggressively
              }
            }
          }, 300);
        }
      };

      return recognition;
    } catch (err: any) {
      logTelemetry('init_exception', 'error', err.message || 'unknown');
      setSpeechWarning('Speech recognition initialization error: ' + (err.message || 'unknown'));
      return null;
    }
  };

  // Server STT Fallback using MediaRecorder chunks
  const startServerSTTFallback = () => {
    if (!mediaStreamRef.current) return;
    try {
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType: mime });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 2000 && isRecordingIntentRef.current) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result as string;
            try {
              const res = await fetch('http://localhost:5000/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audioBase64: base64,
                  mimeType: mime,
                  language: activeLanguage,
                }),
              });
              const data = await res.json();
              if (data.text && data.text.trim().length > 0) {
                processFinalizedSpeech(data.text.trim());
              }
            } catch (err) {
              console.warn('Server STT chunk upload error:', err);
            }
          };
          reader.readAsDataURL(e.data);
        }
      };

      // Slice in 4-second chunks
      recorder.start(4000);
      logTelemetry('server_stt_started', 'recording');
    } catch (err) {
      console.warn('MediaRecorder Server STT initialization failed:', err);
    }
  };

  // Start Recording Flow (Clean User Gesture)
  const handleStartRecording = async () => {
    setSpeechWarning(null);
    networkErrorCountRef.current = 0;
    setRecordingStatus('requesting_permission');
    logTelemetry('start_clicked', 'requesting_permission');

    try {
      // 1. Request real microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2. Start Web Audio level meter
      isRecordingIntentRef.current = true;
      startAudioVisualizer(stream);

      // 3. Start streaming Speech Recognition automatically
      const recognition = initSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        try {
          recognition.start();
          logTelemetry('recognition_started', 'listening');
        } catch (e: any) {
          logTelemetry('start_exception', 'error', e.message);
        }
      } else {
        // If browser SpeechRecognition is absent, switch to server STT
        setActiveEngine('server');
        startServerSTTFallback();
      }

      // 4. Update session state (initializes fresh, clears existing chunks)
      startLiveSession();
    } catch (err: any) {
      console.error('Microphone access failure:', err);
      logTelemetry('get_user_media_error', 'error', err.name || err.message);
      stopAudioVisualizer();

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setRecordingStatus(
          'error',
          'Microphone permission was denied. Please allow microphone access in your browser settings (look for the lock/camera icon in the address bar), then click Try Again.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setRecordingStatus(
          'error',
          'No microphone device was detected on your system. Please connect an audio input device or use the Demo Lecture Audio fallback.'
        );
      } else {
        setRecordingStatus(
          'error',
          `Could not initialize microphone: ${err.message || 'Unknown error'}. Please try again.`
        );
      }
    }
  };

  // Pause Recording
  const handlePauseRecording = () => {
    isRecordingIntentRef.current = false;
    logTelemetry('pause_clicked', 'paused');

    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

    // Stop speech recognition while paused
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
      } catch (e) {}
    }

    // Mute visualizer
    setAudioLevel(0);
    setWaveformBars([6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]);
    pauseRecording();
  };

  // Resume Recording
  const handleResumeRecording = () => {
    setSpeechWarning(null);
    isRecordingIntentRef.current = true;
    logTelemetry('resume_clicked', 'recording');

    // Restart visualizer if stream exists
    if (mediaStreamRef.current) {
      startAudioVisualizer(mediaStreamRef.current);
    }

    if (activeEngine === 'browser') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      } else {
        const recognition = initSpeechRecognition();
        if (recognition) {
          recognitionRef.current = recognition;
          try {
            recognition.start();
          } catch (e) {}
        }
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        try {
          mediaRecorderRef.current.resume();
        } catch (e) {}
      } else {
        startServerSTTFallback();
      }
    }

    resumeRecording();
  };

  // Stop Recording (confirmed via dialog)
  const handleConfirmStop = () => {
    isRecordingIntentRef.current = false;
    logTelemetry('stop_confirmed', 'stopped');

    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }

    stopAudioVisualizer();

    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
      setIsDemoPlaying(false);
    }

    setInterimText('');
    stopRecording();
    setShowEndConfirmModal(false);
    setActiveTab('master_notes');
  };

  // Fallback: Play Simulated Demo Lecture (Explicit Demo Mode Only)
  const handlePlayDemoAudio = () => {
    if (isDemoPlaying) return;
    setIsDemoPlaying(true);
    setSpeechWarning(null);
    logTelemetry('demo_audio_clicked', 'demo_playing');

    if (liveSession.recordingStatus === 'idle' || liveSession.recordingStatus === 'stopped') {
      startLiveSession();
    }

    let sentenceIdx = 0;
    const playNextSentence = () => {
      if (sentenceIdx >= DEMO_PRESET_LECTURE.length) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
        setIsDemoPlaying(false);
        setInterimText('');
        setAudioLevel(0);
        setWaveformBars([6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]);
        return;
      }

      const item = DEMO_PRESET_LECTURE[sentenceIdx];
      // Step 1: Simulate interim typing with simulated wave
      setAudioLevel(48);
      setWaveformBars([14, 22, 38, 18, 30, 42, 26, 34, 18, 28, 14, 10]);
      setInterimText(item.text.slice(0, Math.floor(item.text.length * 0.6)) + '...');

      // Step 2: Finalize phrase after 1200ms
      setTimeout(() => {
        setInterimText('');
        setAudioLevel(0);
        setWaveformBars([6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]);
        // Explicitly labeled as demo chunk
        const chunkIndex = Math.min(sentenceIdx, liveSession.slides.length - 1);
        addVoiceChunk(
          item.text,
          formatTime(elapsedSecondsRef.current || liveSession.elapsedSeconds),
          chunkIndex,
          true,
          88,
          item.category
        );
        setCurrentSlideIndex(chunkIndex);
        currentSlideRef.current = chunkIndex;
        sentenceIdx++;
      }, 1200);
    };

    playNextSentence();
    demoIntervalRef.current = setInterval(playNextSentence, 3800);
  };

  // ── TEACHER: Publish live lecture state to the class channel ─────────────
  // These effects are no-ops when not a teacher or when no class is active.

  // 1. Publish recording-state whenever status or elapsed seconds change.
  //    This also acts as the student timer tick (teacher pushes every second).
  useEffect(() => {
    if (!isTeacher || !activeClassCode) return;
    publishLiveEvent(activeClassCode, {
      type: 'recording-state',
      status: liveSession.recordingStatus,
      elapsedSeconds: liveSession.elapsedSeconds,
    });
    // When teacher starts a completely fresh session, clear old state
    if (liveSession.recordingStatus === 'idle') {
      clearLiveState(activeClassCode);
    }
  }, [isTeacher, activeClassCode, liveSession.recordingStatus, liveSession.elapsedSeconds]);

  // 2. Publish each new final transcript chunk.
  //    Only publish the latest chunk (the one just added) to avoid replaying history.
  const lastPublishedChunkIdRef = useRef<string>('');
  useEffect(() => {
    if (!isTeacher || !activeClassCode) return;
    const chunks = liveSession.filteredChunks;
    if (chunks.length === 0) return;
    const latest = chunks[chunks.length - 1];
    if (latest.id === lastPublishedChunkIdRef.current) return;
    lastPublishedChunkIdRef.current = latest.id;
    publishLiveEvent(activeClassCode, { type: 'transcript-final', chunk: latest });
  }, [isTeacher, activeClassCode, liveSession.filteredChunks]);

  // 3. Publish interim (partial) speech as it arrives.
  useEffect(() => {
    if (!isTeacher || !activeClassCode || !interimText) return;
    publishLiveEvent(activeClassCode, { type: 'transcript-interim', text: interimText });
  }, [isTeacher, activeClassCode, interimText]);

  // 4. Publish slide changes.
  useEffect(() => {
    if (!isTeacher || !activeClassCode) return;
    publishLiveEvent(activeClassCode, {
      type: 'slide-change',
      slideIndex: liveSession.currentSlideIndex,
    });
  }, [isTeacher, activeClassCode, liveSession.currentSlideIndex]);

  // 5. Publish master notes when generated.
  useEffect(() => {
    if (!isTeacher || !activeClassCode || !liveSession.masterNotes) return;
    publishLiveEvent(activeClassCode, {
      type: 'notes-updated',
      notes: liveSession.masterNotes,
    });
  }, [isTeacher, activeClassCode, liveSession.masterNotes]);

  // Component unmount cleanup: release all resources
  useEffect(() => {
    return () => {
      isRecordingIntentRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
        mediaRecorderRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) {}
        audioContextRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
    };
  }, []);

  // Auto-scroll transcript container
  useEffect(() => {
    if (transcriptScrollRef.current && !showScrollBottomBtn) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [liveSession.filteredChunks, interimText, showScrollBottomBtn]);

  const handleTranscriptScroll = () => {
    if (!transcriptScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = transcriptScrollRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 80;
    setShowScrollBottomBtn(isUp);
  };

  const jumpToLatest = () => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTo({
        top: transcriptScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setShowScrollBottomBtn(false);
    }
  };

  // Calculate total removed fillers across all chunks
  const totalFillersRemoved = useMemo(() => {
    return liveSession.filteredChunks.reduce(
      (acc, chunk) => acc + (chunk.fillerWordsRemoved?.length || 0),
      0
    );
  }, [liveSession.filteredChunks]);

  const currentSlide = liveSession.slides[liveSession.currentSlideIndex] || liveSession.slides[0];
  const lateCatchUpData = getLateArrivalCatchUp(arrivalMinuteInput);

  // PDF Exporter
  const exportMasterNotesPDF = () => {
    const notes = liveSession.masterNotes || generateMasterNotes();
    const doc = new jsPDF();
    const margin = 16;
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('LectureLens — Master Lecture Synthesis', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Course: CS201 | Instructor: Prof. Meera Sen | Generated: ${new Date().toLocaleDateString()}`,
      margin,
      y
    );
    y += 12;

    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, 178, 22, 3, 3, 'FD');
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('EXECUTIVE SYNTHESIS & VOICE FILTER OVERVIEW:', margin + 4, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const splitOverview = doc.splitTextToSize(notes.overview, 170);
    doc.text(splitOverview, margin + 4, y);
    y += 18;

    notes.slideAndSpeechAlignment.slice(0, 3).forEach((sec) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Slide ${sec.slideNumber}: ${sec.slideTitle}`, margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      sec.slidePoints.forEach((pt) => {
        doc.text(`• Slide: ${pt}`, margin + 4, y);
        y += 5;
      });

      sec.teacherSpokenPoints.forEach((sp) => {
        doc.setTextColor(16, 185, 129);
        doc.text(`✓ Spoken Emphasis: ${sp}`, margin + 4, y);
        y += 5;
      });
      y += 4;
    });

    doc.save(`LectureLens-MasterNotes-Lecture14.pdf`);
  };

  // ── STUDENT: Render the read-only student live view ──────────────────────
  if (!isTeacher) {
    return <StudentLiveView />;
  }

  // ── TEACHER: Full recording studio JSX ───────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. TOP HEADER: Clean Title & Subtitle without awkward wrapping */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            {isTeacher ? 'Live Lecture Studio & Real-Time Audio Filter' : 'Live Classroom Stream & Catch-Up'}
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 mt-1 max-w-3xl">
            {isTeacher
              ? 'Record lecture speech, filter verbal fillers in real time, synchronize slides, and synthesize master notes.'
              : 'Follow the professor live. If you joined late, access your personalized 90-second catch-up brief below.'}
          </p>
        </div>

        {/* ── Teacher Class Chip (compact, additive — does not move existing elements) ── */}
        {activeClassCode ? (
          <div className="flex items-center gap-2 self-start px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs shadow-xs flex-wrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-black text-emerald-800">Class</span>
            <span className="font-mono font-black tracking-widest text-zinc-900 text-sm">{activeClassCode}</span>
            <button
              onClick={copyChipCode}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors font-bold"
              title="Copy class code"
            >
              {chipCopied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {chipCopied ? 'Copied' : 'Copy'}
            </button>
            <span className="flex items-center gap-1 text-zinc-500 font-medium">
              <Users className="w-3 h-3" />
              {roster.length} joined
            </span>
          </div>
        ) : (
          <Link
            to="/app/class-code"
            className="self-start flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors font-medium"
          >
            <Hash className="w-3.5 h-3.5" />
            Create a class to let students follow live
          </Link>
        )}

        {/* Global Slide Navigation pill & Engine Indicator */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-zinc-200 shadow-xs text-xs font-bold text-zinc-700">
            {activeEngine === 'browser' ? (
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Browser STT (Web Speech)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-purple-700">
                <Server className="w-3.5 h-3.5 text-purple-600" />
                Server STT (Gemini Audio)
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white border border-zinc-200 shadow-xs text-xs font-bold text-zinc-700">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Active Slide {liveSession.currentSlideIndex + 1} of {liveSession.slides.length}</span>
            {isManualOverrideBadge && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                Manual
              </span>
            )}
          </div>

          <button
            onClick={() => setShowDebugStrip((prev) => !prev)}
            className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            title="Toggle Debug Telemetry Strip (?debug=1)"
          >
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PART 1: UNMISTAKABLE PROMINENT RECORDING STATUS & CONTROLS  */}
      {/* ============================================================== */}
      <div className="bg-white border-2 border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-subtle space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Status Indicator Left */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* IDLE STATE */}
            {liveSession.recordingStatus === 'idle' && (
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-zinc-400 inline-block"></span>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 block">
                    Session Status
                  </span>
                  <span className="text-lg font-black text-zinc-700">Not recording</span>
                </div>
              </div>
            )}

            {/* REQUESTING PERMISSION STATE */}
            {liveSession.recordingStatus === 'requesting_permission' && (
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-ping inline-block"></span>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 block">
                    Microphone Setup
                  </span>
                  <span className="text-lg font-black text-blue-900">
                    Allow microphone access in your browser
                  </span>
                </div>
              </div>
            )}

            {/* RECORDING STATE */}
            {liveSession.recordingStatus === 'recording' && (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-red-50 border border-red-200 text-red-700">
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
                  <span className="text-base font-black tracking-wider uppercase">RECORDING</span>
                </div>

                {/* Running Timer */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-900 font-mono font-black text-lg">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span>{formatTime(liveSession.elapsedSeconds)}</span>
                </div>

                {/* Real Audio Level Meter (Active sound level) */}
                <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-zinc-900 text-white shadow-inner">
                  <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex items-center gap-1 h-7">
                    {waveformBars.map((barHeight, idx) => (
                      <span
                        key={idx}
                        style={{ height: `${barHeight}px` }}
                        className="w-1.5 rounded-full bg-emerald-400 transition-all duration-75 inline-block"
                      ></span>
                    ))}
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-300 pl-1">
                    {audioLevel}% MIC
                  </span>
                </div>
              </div>
            )}

            {/* PAUSED STATE */}
            {liveSession.recordingStatus === 'paused' && (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500"></span>
                  <span className="text-base font-black tracking-wider uppercase">PAUSED</span>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono font-bold text-base">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>{formatTime(liveSession.elapsedSeconds)}</span>
                </div>

                <span className="text-xs text-amber-800 font-medium px-2 py-1 bg-amber-100/60 rounded-xl">
                  Mic Muted • Recognition Stopped
                </span>
              </div>
            )}

            {/* STOPPED STATE */}
            {liveSession.recordingStatus === 'stopped' && (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-zinc-100 border border-zinc-300 text-zinc-700">
                  <span className="w-3 h-3 rounded-full bg-zinc-500"></span>
                  <span className="text-base font-black tracking-wider uppercase">SESSION ENDED</span>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-600 font-mono font-bold text-base">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>{formatTime(liveSession.elapsedSeconds)}</span>
                </div>
              </div>
            )}
          </div>

          {/* PRIMARY & SECONDARY RECORDING CONTROLS (At least 44px high) */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* IDLE: Show Start Recording */}
            {liveSession.recordingStatus === 'idle' && (
              <button
                onClick={handleStartRecording}
                className="min-h-[44px] inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-base font-extrabold px-6 py-2.5 rounded-2xl shadow-subtle hover:scale-[1.02] active:scale-100 transition-all cursor-pointer"
              >
                <Mic className="w-5 h-5 fill-white" />
                <span>Start Recording</span>
              </button>
            )}

            {/* REQUESTING PERMISSION: Spinner Button */}
            {liveSession.recordingStatus === 'requesting_permission' && (
              <button
                disabled
                className="min-h-[44px] inline-flex items-center gap-2 bg-blue-600 text-white text-base font-extrabold px-6 py-2.5 rounded-2xl opacity-80 cursor-wait shadow-subtle"
              >
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Waiting for Microphone...</span>
              </button>
            )}

            {/* RECORDING: Show Pause (Amber) and Stop (Red) */}
            {liveSession.recordingStatus === 'recording' && (
              <>
                <button
                  onClick={handlePauseRecording}
                  className="min-h-[44px] inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm sm:text-base font-extrabold px-5 py-2.5 rounded-2xl shadow-subtle hover:scale-[1.02] active:scale-100 transition-all cursor-pointer"
                >
                  <Pause className="w-5 h-5 fill-white" />
                  <span>Pause Recording</span>
                </button>

                <button
                  onClick={() => setShowEndConfirmModal(true)}
                  className="min-h-[44px] inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-extrabold px-5 py-2.5 rounded-2xl shadow-subtle hover:scale-[1.02] active:scale-100 transition-all cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Recording</span>
                </button>
              </>
            )}

            {/* PAUSED: Show Resume (Green) and Stop (Red) */}
            {liveSession.recordingStatus === 'paused' && (
              <>
                <button
                  onClick={handleResumeRecording}
                  className="min-h-[44px] inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-extrabold px-5 py-2.5 rounded-2xl shadow-subtle hover:scale-[1.02] active:scale-100 transition-all cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Resume Recording</span>
                </button>

                <button
                  onClick={() => setShowEndConfirmModal(true)}
                  className="min-h-[44px] inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-extrabold px-5 py-2.5 rounded-2xl shadow-subtle hover:scale-[1.02] active:scale-100 transition-all cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Recording</span>
                </button>
              </>
            )}

            {/* STOPPED: Show Start New Recording */}
            {liveSession.recordingStatus === 'stopped' && (
              <button
                onClick={() => {
                  resetLiveSession();
                  handleStartRecording();
                }}
                className="min-h-[44px] inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-extrabold px-5 py-2.5 rounded-2xl shadow-subtle hover:scale-[1.02] active:scale-100 transition-all cursor-pointer"
              >
                <Mic className="w-5 h-5 fill-white" />
                <span>Start New Recording</span>
              </button>
            )}

            {/* DEMO FALLBACK BUTTON: Clearly labeled as simulated demo fallback */}
            <button
              onClick={handlePlayDemoAudio}
              disabled={isDemoPlaying || liveSession.recordingStatus === 'recording'}
              className="min-h-[44px] inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-800 text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-2xl border border-zinc-200 transition-all cursor-pointer"
              title="Stream simulated teacher speech through the filler filter & slide sync for testing"
            >
              <Zap className="w-4 h-4 text-amber-600" />
              <span>{isDemoPlaying ? 'Playing Demo...' : 'Play demo lecture (Demo Audio)'}</span>
            </button>

            {/* EXPORT PDF BUTTON */}
            <button
              onClick={exportMasterNotesPDF}
              className="min-h-[44px] inline-flex items-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-900 text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-2xl shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-zinc-600" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* ERROR STATE BANNER */}
        {liveSession.recordingStatus === 'error' && (
          <div className="bg-red-50 border border-red-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3 text-red-900">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <strong className="block text-xs uppercase tracking-wider font-black text-red-700">
                  Recording Error Detected
                </strong>
                <p className="text-sm font-medium">
                  {liveSession.recordingError || 'Microphone or speech recognition failure.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleStartRecording}
                className="min-h-[40px] bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={handlePlayDemoAudio}
                className="min-h-[40px] bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 text-xs font-extrabold px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                Play demo lecture
              </button>
            </div>
          </div>
        )}

        {/* SPEECH WARNING BANNER */}
        {speechWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{speechWarning}</span>
            </div>
            <button
              onClick={() => setSpeechWarning(null)}
              className="text-amber-700 hover:text-amber-950 font-bold p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. PART 2: REAL-TIME LIVE TRANSCRIPT & VOICE FILTER FEED PANEL */}
      {/* ============================================================== */}
      <div className="bg-white border-2 border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-subtle flex flex-col space-y-4">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <h2 className="text-lg sm:text-xl font-black text-zinc-950 flex items-center gap-2">
              <span>Live Teacher Voice Filter Feed</span>
              {liveSession.recordingStatus === 'recording' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  LIVE
                </span>
              )}
              {liveSession.recordingStatus === 'paused' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
                  PAUSED
                </span>
              )}
              {liveSession.recordingStatus === 'stopped' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold uppercase tracking-wider">
                  SESSION ENDED
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-zinc-100 text-zinc-700 font-bold px-2.5 py-1 rounded-full border border-zinc-200">
              Total Sentences: {liveSession.filteredChunks.length}
            </span>
            <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
              Fillers Stripped: {totalFillersRemoved}
            </span>
          </div>
        </div>

        {/* Live Streaming Feed Container */}
        <div
          ref={transcriptScrollRef}
          onScroll={handleTranscriptScroll}
          className="relative overflow-y-auto min-h-[380px] max-h-[500px] pr-2 space-y-3.5 scroll-smooth"
        >
          {/* EMPTY STATE: Idle */}
          {liveSession.recordingStatus === 'idle' && liveSession.filteredChunks.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-zinc-800">
                Press Start Recording and begin speaking
              </h3>
              <p className="text-sm text-zinc-500 max-w-md mx-auto">
                Live speech recognition will stream directly to this feed, filter verbal fillers, and synchronize slides automatically.
              </p>
              <button
                onClick={handlePlayDemoAudio}
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors mt-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Or preview with Play demo lecture</span>
              </button>
            </div>
          )}

          {/* LISTENING PLACEHOLDER: Recording is on but no sentences spoken yet */}
          {liveSession.recordingStatus === 'recording' && liveSession.filteredChunks.length === 0 && !interimText && (
            <div className="py-14 text-center space-y-3 animate-fadeIn">
              <div className="flex items-center justify-center gap-1.5 h-8">
                <span className="w-2 h-6 bg-red-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-8 bg-red-600 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-5 bg-red-500 rounded-full animate-bounce delay-200"></span>
              </div>
              <h3 className="text-lg font-black text-zinc-900">
                Listening for teacher voice...
              </h3>
              <p className="text-sm text-zinc-500">
                Speak into your microphone. Words will appear live with sub-second latency.
              </p>
            </div>
          )}

          {/* PAUSED BANNER IN FEED */}
          {liveSession.recordingStatus === 'paused' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-800">
              ⏸️ Recording is currently paused. Existing transcript lines preserved.
            </div>
          )}

          {/* FINALIZED CHUNKS (Chronologically appended at the bottom) */}
          {liveSession.filteredChunks.map((chunk) => (
            <div
              key={chunk.id}
              className={`p-4 sm:p-5 rounded-2xl border ${
                chunk.isDemo
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              } shadow-xs transition-colors space-y-2.5`}
            >
              {/* Metadata row */}
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-zinc-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                    {chunk.timestamp}
                  </span>
                  <span className="font-bold text-zinc-700 bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                    Slide {chunk.slideIndex}
                  </span>
                  {chunk.isDemo && (
                    <span className="font-extrabold text-[10px] uppercase bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md">
                      DEMO SAMPLE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] ${
                      chunk.category === 'pitfall_warning'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : chunk.category === 'analogy'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : chunk.category === 'off_slide'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {chunk.category === 'off_slide' ? 'Off-Slide / Added' : chunk.category.replace('_', ' ')}
                  </span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    {chunk.slideAlignmentScore}% Aligned
                  </span>
                </div>
              </div>

              {/* Cleaned conceptual text: Minimum 18px text */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                  ✓ Filtered Speech (Cleaned Conceptual Text):
                </span>
                <p className="text-lg sm:text-xl font-bold text-zinc-950 leading-relaxed">
                  {chunk.filteredSpeech}
                </p>
              </div>

              {/* Raw speech text with highlighted fillers */}
              <div className="pt-2 border-t border-zinc-100 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Raw Speech Transcript:
                </span>
                <p className="text-zinc-600 italic">
                  "{chunk.rawSpeech}"
                </p>

                {/* Removed Fillers Tags */}
                {chunk.fillerWordsRemoved && chunk.fillerWordsRemoved.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="text-zinc-400 font-semibold">Removed fillers ({chunk.fillerWordsRemoved.length}):</span>
                    {chunk.fillerWordsRemoved.map((filler, fIdx) => (
                      <span
                        key={fIdx}
                        className="bg-amber-50 text-amber-800 border border-amber-200 line-through px-2 py-0.5 rounded-md font-mono"
                      >
                        {filler}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* INTERIM (PARTIAL) RESULTS: Lighter grey italic text, streaming live */}
          {interimText && (
            <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-zinc-500 animate-pulse space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Speaking (Streaming live)...</span>
              </div>
              <p className="text-lg sm:text-xl font-medium italic text-zinc-700">
                "{interimText}"
              </p>
            </div>
          )}

          {/* STOPPED BANNER AT BOTTOM */}
          {liveSession.recordingStatus === 'stopped' && (
            <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-xl text-center text-xs font-bold text-zinc-700">
              ⏹️ Session ended. All {liveSession.filteredChunks.length} sentences saved. You can export PDF notes below.
            </div>
          )}
        </div>

        {/* Floating "Jump to Latest" button if teacher scrolled up */}
        {showScrollBottomBtn && (
          <div className="flex justify-center pt-2">
            <button
              onClick={jumpToLatest}
              className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white text-xs font-extrabold px-4 py-2 rounded-full shadow-float transition-all cursor-pointer"
            >
              <span>Jump to latest sentences</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* STEP 2.8: DEBUG TELEMETRY STRIP (Visible with ?debug=1 or toggle button) */}
        {showDebugStrip && (
          <div className="mt-3 p-3.5 bg-zinc-900 text-zinc-200 rounded-2xl font-mono text-xs border border-zinc-700 space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-1">
              <span className="font-bold flex items-center gap-1 text-emerald-400">
                <Terminal className="w-3.5 h-3.5" />
                Live Speech Telemetry (?debug=1)
              </span>
              <span className="text-[10px]">Lang: {debugLog.lang}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-zinc-500 block">Engine:</span>
                <span className="text-white font-bold">{debugLog.engine}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Recognition State:</span>
                <span className="text-amber-300 font-bold">{debugLog.recognitionState}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Last Event:</span>
                <span className="text-emerald-300 truncate block">{debugLog.lastEvent}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Last Error:</span>
                <span className={debugLog.lastError === 'none' ? 'text-zinc-400' : 'text-red-400 font-bold'}>
                  {debugLog.lastError}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. LATE STUDENT ARRIVAL NOTIFICATION                           */}
      {/* ============================================================== */}
      {!isTeacher && showLateCatchUpModal && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 shadow-subtle relative animate-fadeIn">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Late Arrival Catch-Up Engine
                </span>
                <h2 className="text-lg font-black text-amber-950">
                  Joined Late? Catch Up in 90 Seconds
                </h2>
              </div>
            </div>

            <button
              onClick={() => setShowLateCatchUpModal(false)}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 px-2 py-1 bg-amber-100 rounded-lg cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <p className="text-sm text-amber-900 mt-3 leading-relaxed">
            {lateCatchUpData.executiveBriefing}
          </p>

          {/* Weak Prerequisite Warnings */}
          {lateCatchUpData.personalizedPrerequisiteGap.length > 0 && (
            <div className="mt-4 p-3.5 bg-white/80 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Personalized Prerequisite Alert (Based on Your Mastery Profile):</span>
              </div>
              {lateCatchUpData.personalizedPrerequisiteGap.slice(0, 2).map((gap) => (
                <div key={gap.conceptId} className="text-xs text-zinc-700 pl-6">
                  • <strong>{gap.conceptName} ({gap.masteryScore}%):</strong> {gap.warning}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setCurrentSlideIndex(liveSession.currentSlideIndex);
                setShowLateCatchUpModal(false);
              }}
              className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-subtle transition-all cursor-pointer"
            >
              <span>Sync to Live Lecture (Slide {liveSession.currentSlideIndex + 1})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <span className="text-xs text-amber-800 font-medium">
              You missed Slides {lateCatchUpData.missedSlides.join(', ')} • 3 Key Takeaways Synthesized
            </span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4.5. LECTURE MATERIAL & UPLOAD SECTION                         */}
      {/* ============================================================== */}
      <div className="bg-white border-2 border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-950 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              <span>Lecture Material &amp; Slide Decks</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Select the pretrained deck or upload your own .pptx or .pdf slides. Audio transcription, slide-vs-voice sync, and notes will adapt automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
              Active: {activeDeck.meta.name.slice(0, 30)} ({activeDeck.slides.length} slides)
            </span>
          </div>
        </div>

        {/* Warning if recording active */}
        {liveSession.recordingStatus === 'recording' && (
          <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Recording active:</strong> Deck switching is locked to prevent slide mismatch. Pause or stop the recording to change the deck.
            </span>
          </div>
        )}

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="flex items-center justify-between p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-700 hover:text-red-950 font-bold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (liveSession.recordingStatus !== 'recording') setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
          } ${liveSession.recordingStatus === 'recording' ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,.pdf"
            onChange={handleFileChange}
            disabled={liveSession.recordingStatus === 'recording'}
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 shadow-xs flex items-center justify-center mx-auto text-emerald-600">
              <FileUp className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-bold text-zinc-900">
                Drag and drop your lecture slides here, or
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={liveSession.recordingStatus === 'recording'}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Choose file from computer</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-400">
              Accepted formats: <strong>.pptx</strong> (primary), <strong>.pdf</strong> • Maximum file size: <strong>25 MB</strong>
            </p>
            <p className="text-[11px] text-zinc-400">
              <em>Your slides are processed safely in your browser to extract text and concepts.</em>
            </p>
          </div>

          {/* Upload Progress Indicator */}
          {uploadStatus !== 'idle' && (
            <div className="mt-4 pt-4 border-t border-zinc-200 max-w-sm mx-auto">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-700">
                {uploadStatus === 'ready' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : uploadStatus === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                )}
                <span>
                  {uploadStatus === 'uploading' && 'Uploading file...'}
                  {uploadStatus === 'reading' && 'Reading slides from presentation...'}
                  {uploadStatus === 'extracting' && 'Extracting key concepts & keywords...'}
                  {uploadStatus === 'ready' && 'Deck ready and activated!'}
                  {uploadStatus === 'error' && 'Processing failed.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Deck Selector & List of Decks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Available Lecture Decks
            </span>
            <span className="text-xs text-zinc-500 font-medium">
              {uploadedDecks.length + 1} deck{uploadedDecks.length > 0 ? 's' : ''} available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. Pretrained / Sample Deck Option */}
            <div
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                selectedDeckId === PRETRAINED_DECK.meta.id
                  ? 'border-emerald-500 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-500'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                    Pretrained Sample
                  </span>
                  {selectedDeckId === PRETRAINED_DECK.meta.id && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>
                <h3 className="font-black text-sm text-zinc-900 leading-snug">
                  {PRETRAINED_DECK.meta.name}
                </h3>
                <p className="text-xs text-zinc-500">
                  {PRETRAINED_DECK.slides.length} slides • Graph Traversals, BFS/DFS, Invariants &amp; Kahn DAGs
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-zinc-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleSelectDeck(PRETRAINED_DECK)}
                  disabled={
                    selectedDeckId === PRETRAINED_DECK.meta.id ||
                    liveSession.recordingStatus === 'recording'
                  }
                  title={
                    liveSession.recordingStatus === 'recording'
                      ? 'Stop or pause the recording to change the deck'
                      : ''
                  }
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white transition-colors cursor-pointer"
                >
                  {selectedDeckId === PRETRAINED_DECK.meta.id ? 'Currently Active' : 'Use this deck'}
                </button>
              </div>
            </div>

            {/* 2. Uploaded Decks List */}
            {uploadedDecks.map((deck) => (
              <div
                key={deck.meta.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  selectedDeckId === deck.meta.id
                    ? 'border-emerald-500 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-500'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      Uploaded {deck.meta.format.toUpperCase()}
                    </span>
                    {selectedDeckId === deck.meta.id && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-sm text-zinc-900 leading-snug truncate" title={deck.meta.name}>
                    {deck.meta.name}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {deck.slides.length} slides • {Math.round(deck.meta.fileSize / 1024)} KB • Uploaded {new Date(deck.meta.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSelectDeck(deck)}
                    disabled={
                      selectedDeckId === deck.meta.id ||
                      liveSession.recordingStatus === 'recording'
                    }
                    title={
                      liveSession.recordingStatus === 'recording'
                        ? 'Stop or pause the recording to change the deck'
                        : ''
                    }
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white transition-colors cursor-pointer"
                  >
                    {selectedDeckId === deck.meta.id ? 'Currently Active' : 'Use this deck'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectDeck(deck);
                        setActiveTab('slides_view');
                      }}
                      className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Preview this deck in Active Slide panel"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={liveSession.recordingStatus === 'recording'}
                      className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-bold transition-colors"
                      title="Replace with updated file"
                    >
                      Replace
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeckToDelete(deck.meta.id)}
                      disabled={liveSession.recordingStatus === 'recording'}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
                      title="Delete deck"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delete Confirmation Modal */}
          {deckToDelete && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-float">
                <h3 className="font-black text-base text-zinc-900">Delete Uploaded Deck?</h3>
                <p className="text-xs text-zinc-500">
                  Are you sure you want to delete this slide deck? This will remove the uploaded material.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDeckToDelete(null)}
                    className="px-3.5 py-2 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteDeck(deckToDelete)}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Knowledge Graph link prompt */}
          {selectedDeckId !== PRETRAINED_DECK.meta.id && (
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Custom deck active: You can ingest its concepts into the Knowledge Graph.</span>
              </div>
              <Link
                to="/app/syllabus"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors shrink-0"
              >
                Generate Concept Graph &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. TABS ROW (Below top status & transcript feed)               */}
      {/* ============================================================== */}
      <div className="flex border-b border-zinc-200 gap-2 pt-2">
        <button
          onClick={() => setActiveTab('slides_view')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'slides_view'
              ? 'border-dark-900 text-zinc-950 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Active Slide Presentation</span>
        </button>

        <button
          onClick={() => setActiveTab('comparison_matrix')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'comparison_matrix'
              ? 'border-dark-900 text-zinc-950 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Slide vs. Voice Comparison Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('master_notes')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'master_notes'
              ? 'border-dark-900 text-zinc-950 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Synthesized Master Lecture Notes</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 6. TAB CONTENT: SLIDES PRESENTATION                            */}
      {/* ============================================================== */}
      {activeTab === 'slides_view' && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-subtle space-y-5">
          {/* Slide Navigator Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Active Slide Deck
              </span>
              <span className="text-xs bg-zinc-100 px-2.5 py-0.5 rounded-full font-mono font-bold text-zinc-800">
                Slide {liveSession.currentSlideIndex + 1} / {liveSession.slides.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleManualSlideChange(liveSession.currentSlideIndex - 1)}
                disabled={liveSession.currentSlideIndex === 0}
                className="p-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 transition-colors cursor-pointer"
                title="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleManualSlideChange(liveSession.currentSlideIndex + 1)}
                disabled={liveSession.currentSlideIndex === liveSession.slides.length - 1}
                className="p-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 transition-colors cursor-pointer"
                title="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slide Presentation Card */}
          <div className="bg-zinc-900 text-white rounded-3xl p-7 sm:p-9 shadow-inner space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-black truncate max-w-sm">
                {activeDeck.meta.name}
              </span>
              <span className="text-xs text-zinc-400 font-mono font-bold shrink-0">
                SLIDE #{currentSlide.slideNumber || liveSession.currentSlideIndex + 1} OF {liveSession.slides.length}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {currentSlide.title}
            </h2>

            <ul className="space-y-3 text-base text-zinc-200 pt-3">
              {currentSlide.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-emerald-400 font-black mt-1">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            {currentSlide.codeSnippet && (
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono block mb-2">
                  Code Implementation / Invariant:
                </span>
                <pre className="bg-zinc-950 p-4 rounded-2xl text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto border border-zinc-800">
                  <code>{currentSlide.codeSnippet}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Teacher Guidance & Slide Thumbnails */}
          <div className="space-y-3 pt-2">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-900">
              <strong className="block font-black mb-1">Pedagogical Invariant Guidance:</strong>
              {currentSlide.notes || 'Emphasize algorithmic invariants, structure definitions, and asymptotic bounds.'}
            </div>

            {/* Thumbnails row */}
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {liveSession.slides.map((s, idx) => (
                <button
                  key={s.slideNumber || idx}
                  onClick={() => handleManualSlideChange(idx)}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all shrink-0 text-left cursor-pointer ${
                    idx === liveSession.currentSlideIndex
                      ? 'bg-dark-900 text-white border-dark-900 shadow-sm'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <span className="block font-mono text-[10px] opacity-75">#{s.slideNumber || idx + 1}</span>
                  <span className="truncate max-w-[130px] block">{s.title.slice(0, 22)}...</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. TAB CONTENT: SLIDE VS VOICE COMPARISON MATRIX               */}
      {/* ============================================================== */}
      {activeTab === 'comparison_matrix' && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-xl font-black text-zinc-950">
                Slide Material vs. Spoken Teacher Voice Alignment
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Compares text in PPT materials against transcribed speech to detect curriculum delivery gaps and pedagogical additions.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 self-start md:self-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Overall Delivery Match:{' '}
                {liveSession.filteredChunks.length > 0
                  ? `${Math.min(98, Math.max(45, Math.round(
                      (liveSession.filteredChunks.reduce((acc, c) => acc + (c.slideAlignmentScore || 70), 0) /
                        liveSession.filteredChunks.length)
                    )))}%`
                  : 'Awaiting Voice Stream'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveSession.slides.map((s, idx) => {
              const matchingChunks = liveSession.filteredChunks.filter((c) => c.slideIndex === idx + 1);
              const spokenWordsCombined = matchingChunks.map((c) => c.filteredSpeech.toLowerCase()).join(' ');

              return (
                <div
                  key={s.slideNumber || idx}
                  className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Slide {s.slideNumber || idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-600">
                      {matchingChunks.length} verbal statements
                    </span>
                  </div>

                  <h3 className="font-black text-base text-zinc-900">{s.title}</h3>

                  <div className="grid grid-cols-1 gap-3 text-xs">
                    {/* Slide Points (Covered vs Missed) */}
                    <div className="bg-white p-3.5 rounded-xl border border-zinc-200 space-y-1.5">
                      <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                        <span className="font-extrabold text-zinc-900 uppercase tracking-wider text-[10px]">
                          📄 Slide Content Points &amp; Coverage:
                        </span>
                        {matchingChunks.length > 0 && (
                          <span className="text-[10px] text-emerald-700 font-bold">
                            {s.bullets.filter((b) =>
                              b.toLowerCase().split(/\s+/).some((w) => w.length > 4 && spokenWordsCombined.includes(w))
                            ).length} / {s.bullets.length} Covered
                          </span>
                        )}
                      </div>
                      {s.bullets.map((b, bIdx) => {
                        const isCovered =
                          matchingChunks.length > 0 &&
                          b.toLowerCase().split(/\s+/).some((w) => w.length > 4 && spokenWordsCombined.includes(w));
                        return (
                          <div key={bIdx} className="flex items-start gap-1.5 leading-snug">
                            <span className={isCovered ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>
                              {isCovered ? '✓' : '•'}
                            </span>
                            <span className={isCovered ? 'text-zinc-800 font-medium' : 'text-zinc-500'}>
                              {b}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Teacher Spoken Reinforcement with Move-To-Slide Action */}
                    <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-emerald-200/60">
                        <span className="font-extrabold text-emerald-900 uppercase tracking-wider text-[10px]">
                          🎙️ Teacher Spoken Highlights:
                        </span>
                        {matchingChunks.length > 0 && (
                          <span className="text-[10px] text-emerald-800 font-mono font-bold">
                            Avg Score: {Math.round(matchingChunks.reduce((a, b) => a + (b.slideAlignmentScore || 70), 0) / matchingChunks.length)}%
                          </span>
                        )}
                      </div>

                      {matchingChunks.length > 0 ? (
                        matchingChunks.map((chunk) => (
                          <div
                            key={chunk.id}
                            className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 space-y-1.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between text-[11px] text-emerald-900">
                              <span className="font-mono font-bold text-zinc-500">{chunk.timestamp}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  chunk.category === 'off_slide'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {chunk.category === 'off_slide' ? 'Off-slide / Added' : `${chunk.slideAlignmentScore}% Aligned`}
                                </span>

                                {/* Move to slide dropdown menu */}
                                <select
                                  value={chunk.slideIndex}
                                  onChange={(e) => {
                                    const targetSlideNum = parseInt(e.target.value, 10);
                                    reassignVoiceChunk(chunk.id, targetSlideNum);
                                  }}
                                  className="text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded-md border border-zinc-200 cursor-pointer"
                                  title="Reassign this statement to another slide"
                                >
                                  {liveSession.slides.map((slideOpt, sOptIdx) => (
                                    <option key={slideOpt.slideNumber || sOptIdx + 1} value={sOptIdx + 1}>
                                      Move to Slide {sOptIdx + 1}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <p className="text-zinc-900 font-medium leading-relaxed">
                              "{chunk.filteredSpeech}"
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-zinc-500 italic py-2">
                          No spoken highlights recorded yet for this slide.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. TAB CONTENT: SYNTHESIZED MASTER LECTURE NOTES              */}
      {/* ============================================================== */}
      {activeTab === 'master_notes' && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-9 shadow-subtle space-y-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 mb-2">
                <FileText className="w-3.5 h-3.5" />
                <span>AI Automated Lecture Synthesis</span>
              </div>
              <h2 className="text-2xl font-black text-zinc-950">
                Master Lecture Notes (Slide Text + Filtered Voice)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Comprehensive lecture study notes generated by aligning the slide deck with teacher voice insights.
              </p>
            </div>

            <button
              onClick={exportMasterNotesPDF}
              className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white text-xs sm:text-sm font-extrabold px-5 py-2.5 rounded-2xl shadow-subtle transition-all self-start md:self-auto cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Note Deck</span>
            </button>
          </div>

          {/* Overview Callout */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 text-sm text-zinc-800 leading-relaxed">
            <strong className="block font-black text-zinc-950 mb-1">Lecture Overview:</strong>
            {liveSession.masterNotes?.overview || (
              <span>
                {liveSession.filteredChunks.length === 0
                  ? 'Start recording to speak into your microphone, or click Play demo lecture to generate a synthesized note overview.'
                  : `Automated synthesis combining ${liveSession.slides.length} slides with ${liveSession.filteredChunks.length} spoken voice chunks.`}
              </span>
            )}
          </div>

          {/* Section details */}
          <div className="space-y-5">
            {(liveSession.masterNotes || generateMasterNotes()).slideAndSpeechAlignment.map(
              (alignment) => (
                <div
                  key={alignment.slideNumber}
                  className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-base text-zinc-900">
                      Module {alignment.slideNumber}: {alignment.slideTitle}
                    </h3>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Slide & Audio Synced
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                    <div>
                      <span className="font-extrabold text-zinc-900 block mb-1">
                        Core Slide Invariants:
                      </span>
                      <ul className="space-y-1 text-zinc-600">
                        {alignment.slidePoints.map((p, pIdx) => (
                          <li key={pIdx}>• {p}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-extrabold text-emerald-800 block mb-1">
                        Teacher Spoken Elaboration:
                      </span>
                      <ul className="space-y-1 text-emerald-950 font-medium">
                        {alignment.teacherSpokenPoints.map((tp, tpIdx) => (
                          <li key={tpIdx}>✓ {tp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {alignment.keyFormulasOrCode && (
                    <div className="pt-2 border-t border-zinc-100">
                      <pre className="bg-zinc-900 text-emerald-300 p-2.5 rounded-xl text-xs font-mono">
                        <code>{alignment.keyFormulasOrCode}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Exam Pitfalls & Takeaways */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
            <div className="p-5 bg-red-50/60 rounded-2xl border border-red-200 text-xs space-y-2">
              <span className="font-black text-red-900 block text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Detected Exam Pitfalls
              </span>
              {(liveSession.masterNotes || generateMasterNotes()).detectedExamPitfalls.map(
                (pf, idx) => (
                  <div key={idx} className="text-red-950">
                    • {pf}
                  </div>
                )
              )}
            </div>

            <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-2">
              <span className="font-black text-emerald-900 block text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Key Algorithmic Takeaways
              </span>
              {(liveSession.masterNotes || generateMasterNotes()).keyTakeaways.map(
                (ta, idx) => (
                  <div key={idx} className="text-emerald-950">
                    • {ta}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. STOP RECORDING CONFIRMATION DIALOG MODAL                     */}
      {/* ============================================================== */}
      {showEndConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 max-w-md w-full shadow-float space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Square className="w-5 h-5 fill-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-950">End recording?</h3>
                <p className="text-xs text-zinc-500">The transcript will be saved.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed">
              This will stop recording audio, release your microphone, and synthesize master lecture notes for this session.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEndConfirmModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStop}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>End Recording</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
