import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { MOCK_HOME_DATA } from '../constants';
import { generateSimulatedCall } from '../services/geminiService';

interface Props {
  message: Message;
  history: Message[];
  onRetry: () => void;
}

// Audio Helper Function
const playPCMAudio = async (base64Audio: string, audioContextRef: React.MutableRefObject<AudioContext | null>) => {
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        
        // Ensure context is running (browser autoplay policy)
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // We need to convert Int16 PCM to Float32 for AudioBuffer
        // Note: Gemini output is typically 16-bit PCM (Little Endian)
        const int16Data = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
            float32Data[i] = int16Data[i] / 32768.0;
        }

        const buffer = ctx.createBuffer(1, float32Data.length, 24000);
        buffer.copyToChannel(float32Data, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        
        return source;
    } catch (e) {
        console.error("Audio playback error:", e);
        return null;
    }
};

const DiagnosticReport: React.FC<Props> = ({ message, onRetry }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [animDirection, setAnimDirection] = useState<'next' | 'prev' | 'none'>('none');

  // --- PARSING LOGIC MOVED UP FOR CONTEXT ACCESS ---
  const parseContent = (text: string) => {
    // Separate main content from sources footer if present
    const sourceSplit = text.split('**Fonti Web Consultate:**');
    const mainBody = sourceSplit[0];
    const sources = sourceSplit[1] ? sourceSplit[1] : null;

    // Split by the specific headers used in the prompt
    const rawSections = mainBody.split(/###\s\d+\.\s/g).filter(Boolean);
    
    // Strict check: A valid diagnostic report must have headers (###) and multiple sections.
    if (rawSections.length < 2 && !text.includes('###')) {
        return {
            sections: [{ title: "Non Identificato", content: text }],
            sources: null,
            isFallback: true
        };
    }

    const headers = ["Diagnosi", "Azioni Immediate", "Soluzione", "Prevenzione"];
    const sections = headers.map((header, index) => {
        let content = rawSections[index] || "Dati non disponibili.";
        // Clean up if the header name itself was captured
        if (content.trim().startsWith(header)) content = content.replace(header, '').trim();
        return { title: header, content: content.trim() };
    });

    return { sections, sources, isFallback: false };
  };

  const { sections, sources, isFallback } = parseContent(message.text);
  const totalSteps = sections.length;

  // --- CALL SIMULATION STATE ---
  const [callingState, setCallingState] = useState<{
      isGenerating: boolean;
      activeCall: boolean;
      techName: string;
  }>({ isGenerating: false, activeCall: false, techName: '' });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Stop audio on unmount or close
  const stopCall = () => {
      if (audioSourceRef.current) {
          try { audioSourceRef.current.stop(); } catch(e) {}
      }
      setCallingState({ isGenerating: false, activeCall: false, techName: '' });
  };

  const handleSimulatedCall = async (techName: string) => {
      if (callingState.isGenerating) return;

      setCallingState({ isGenerating: true, activeCall: false, techName });
      
      // CRITICAL: We pass the ACTUAL DIAGNOSIS (Step 1) as context, not generic details.
      // This ensures the AI knows if it's a boiler, a leak, or a blackout.
      const problemContext = sections[0]?.content || "Problema tecnico generico da diagnosticare.";
      
      const base64Audio = await generateSimulatedCall(techName, problemContext);
      
      if (base64Audio) {
          setCallingState({ isGenerating: false, activeCall: true, techName });
          const source = await playPCMAudio(base64Audio, audioContextRef);
          if (source) {
              audioSourceRef.current = source;
              // Automatically close the call overlay when audio finishes
              source.onended = () => {
                  stopCall();
              };
          }
      } else {
          alert("Impossibile stabilire la linea con l'AI. Riprova.");
          setCallingState({ isGenerating: false, activeCall: false, techName: '' });
      }
  };

  // --- SWIPE HANDLERS ---
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeStep < totalSteps - 1) {
      changeStep('next');
    }
    if (isRightSwipe && activeStep > 0) {
      changeStep('prev');
    }
  };

  const changeStep = (dir: 'next' | 'prev') => {
    setAnimDirection(dir);
    if (dir === 'next') setActiveStep(prev => Math.min(prev + 1, totalSteps - 1));
    else setActiveStep(prev => Math.max(prev - 1, 0));
    
    setTimeout(() => setAnimDirection('none'), 300);
  };

  // --- TEXT FORMATTING HELPER ---
  const formatInlineText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        } else {
            const linkRegex = /\[(.*?)\]\((.*?)\)/g;
            const linkParts = [];
            let lastIndex = 0;
            let match;

            while ((match = linkRegex.exec(part)) !== null) {
                if (match.index > lastIndex) {
                    linkParts.push(part.substring(lastIndex, match.index));
                }
                linkParts.push(
                    <a key={`${i}-${lastIndex}`} href={match[2]} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        {match[1]}
                    </a>
                );
                lastIndex = linkRegex.lastIndex;
            }
            if (lastIndex < part.length) {
                linkParts.push(part.substring(lastIndex));
            }
            return <span key={i}>{linkParts.length > 0 ? linkParts : part}</span>;
        }
    });
  };

  // --- RENDERERS ---

  // JSON Based Solution Renderer
  const renderSolutionContent = (content: string) => {
    let data = { partners: [], web: [] };
    let parseError = false;
    
    try {
        // Try to extract JSON from code blocks first
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const jsonString = jsonMatch[1] || jsonMatch[0];
            data = JSON.parse(jsonString);
        } else {
             if (content.trim().startsWith('{')) {
                data = JSON.parse(content);
             } else {
                parseError = true;
             }
        }
    } catch (e) {
        console.error("Failed to parse solution JSON", e);
        parseError = true;
    }

    if (parseError) {
        return (
             <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 break-words">
                <p>Non sono riuscito a caricare i dati strutturati dei tecnici.</p>
                <div className="mt-2 text-xs opacity-70 whitespace-pre-wrap">{content}</div>
             </div>
        );
    }

    const { partners = [], web = [] } = data;
    const hasResults = (partners && partners.length > 0) || (web && web.length > 0);

    const renderCard = (item: any, isPremium: boolean) => {
        const name = item.name || "Tecnico sconosciuto";
        const details = item.details || [];
        const phone = item.phone || null;
        const url = item.url || null;
        
        // Is this specific card currently loading the call?
        const isThisCardLoading = callingState.isGenerating && callingState.techName === name;

        return (
            <div 
                key={`${name}-${isPremium ? 'p' : 'w'}-${Math.random()}`} 
                className="group w-full bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            >
                {/* Decorative top bar for premium */}
                {isPremium && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-orange-400" />}
                
                <div className="p-4">
                    <div className="flex justify-between items-start gap-3 mb-3">
                        <h3 className="font-bold text-lg text-slate-800 leading-tight break-words mt-1">
                            {name}
                        </h3>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${
                            isPremium 
                            ? "bg-rose-50 text-rose-600 border-rose-100" 
                            : "bg-blue-50 text-blue-600 border-blue-100"
                        }`}>
                            {isPremium ? "Partner" : "Web"}
                        </span>
                    </div>
                    
                    {details.length > 0 && (
                        <div className="text-sm text-slate-600 mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                            {details.map((d: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                                    <span className="text-slate-400 mt-1 text-[10px] shrink-0">•</span>
                                    <span className="break-words leading-snug">{d}</span> 
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        {/* THE CALL BUTTON */}
                        <button 
                            onClick={() => handleSimulatedCall(name)}
                            disabled={callingState.isGenerating}
                            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm
                                ${isThisCardLoading
                                    ? 'bg-slate-100 text-slate-400'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
                                }
                            `}
                        >
                            {isThisCardLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs">Connessione...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Chiama AI
                                </>
                            )}
                        </button>

                        <a 
                            href={url || `https://www.google.com/search?q=${encodeURIComponent(name)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            Sito
                        </a>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {partners && partners.length > 0 && partners.map((p: any) => renderCard(p, true))}
            {web && web.length > 0 && web.map((w: any) => renderCard(w, false))}
            
            {!hasResults && (
                <div className="text-center text-slate-500 py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p>Nessun tecnico specifico trovato.</p>
                </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 mb-3">Non trovi quello che cerchi?</p>
                <a 
                    href={`https://www.google.com/search?q=tecnici+riparazioni+vicino+${encodeURIComponent(MOCK_HOME_DATA.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-medium py-3 rounded-xl transition-all active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Cerca altri tecnici in zona
                </a>
            </div>
        </div>
    );
  };

  const renderStandardMarkdown = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
        return (
          <div key={i} className="flex items-start gap-3 mb-3 pl-1">
            <div className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${
                activeStep === 0 ? 'bg-blue-500' :
                activeStep === 1 ? 'bg-amber-500' :
                activeStep === 2 ? 'bg-emerald-500' : 'bg-purple-500'
            }`} />
            <span className="text-slate-700 text-base leading-relaxed break-words w-full">
                {formatInlineText(line.replace(/^[\*\-]\s*/, ''))}
            </span>
          </div>
        );
      }
      if (line.trim().length > 0) {
        return <div key={i} className="mb-3 text-slate-600 text-base leading-relaxed break-words">{formatInlineText(line)}</div>;
      }
      return null;
    });
  };

  const currentSection = sections[activeStep];
  
  const stepColors = [
      'bg-blue-50 text-blue-700',   // Diagnosi
      'bg-amber-50 text-amber-700', // Azioni
      'bg-emerald-50 text-emerald-700', // Soluzione
      'bg-purple-50 text-purple-700'  // Prevenzione
  ];
  
  const iconMap = ['🩺', '⚠️', '✅', '🛡️'];

  return (
    <>
    <div className="flex flex-col h-full w-full max-w-md mx-auto md:max-w-2xl overflow-hidden relative">
      
      {/* --- PROGRESS HEADER --- */}
      <div className="flex items-center justify-between mb-2 px-2 shrink-0 h-8">
        <div className="flex gap-1.5">
            {sections.map((_, i) => (
                <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === activeStep 
                            ? 'w-8 bg-slate-800' 
                            : i < activeStep ? 'w-4 bg-slate-400' : 'w-2 bg-slate-200'
                    }`} 
                />
            ))}
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Step {activeStep + 1} / {totalSteps}
        </span>
      </div>

      {/* --- SWIPEABLE CARD CONTAINER --- */}
      <div 
        className="flex-1 relative perspective-1000 min-h-0"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={`
            h-full bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col
            transition-all duration-300 transform
            ${animDirection === 'next' ? 'opacity-50 -translate-x-4 scale-95' : ''}
            ${animDirection === 'prev' ? 'opacity-50 translate-x-4 scale-95' : ''}
            ${animDirection === 'none' ? 'opacity-100 translate-x-0 scale-100' : ''}
        `}>
            
            {/* Card Header (Fixed at top of card) */}
            <div className={`px-6 py-5 shrink-0 rounded-t-3xl ${stepColors[activeStep]} transition-colors duration-500`}>
                <div className="flex items-center gap-3">
                    <span className="text-3xl shadow-sm bg-white/60 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm">
                        {iconMap[activeStep]}
                    </span>
                    <div>
                        <h2 className="text-xl font-bold leading-tight">{currentSection.title}</h2>
                        <p className="text-[10px] opacity-80 font-medium uppercase tracking-wide">
                            {activeStep === 0 ? 'Analisi AI' : activeStep === 1 ? 'Checklist Sicurezza' : activeStep === 2 ? 'Risoluzione' : 'Piano Futuro'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Card Content (Scrollable Area) */}
            <div className="flex-1 overflow-y-auto bg-white rounded-b-3xl">
                <div className="p-6 pb-24">
                    {activeStep === 2 
                        ? renderSolutionContent(currentSection.content) 
                        : renderStandardMarkdown(currentSection.content)
                    }

                    {/* Show Sources Footer if present */}
                    {sources && activeStep === 2 && (
                        <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-slate-400">
                             <strong className="block text-slate-600 mb-2 uppercase tracking-wide text-[10px]">Fonti dati:</strong>
                             {renderStandardMarkdown(sources)}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Navigation Controls */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/90 to-transparent flex justify-between items-center px-6 pb-2 rounded-b-3xl pointer-events-none">
                <button 
                    onClick={() => changeStep('prev')}
                    disabled={activeStep === 0}
                    className="pointer-events-auto p-3 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-0 transition-all active:scale-95"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                
                <span className="text-[10px] font-medium text-slate-300 uppercase tracking-widest animate-pulse select-none">
                    Swipe
                </span>

                <button 
                    onClick={() => changeStep('next')}
                    disabled={activeStep === totalSteps - 1}
                    className="pointer-events-auto p-3 rounded-full text-slate-800 bg-slate-100 hover:bg-slate-200 shadow-sm disabled:opacity-0 transition-all active:scale-95"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
      </div>
    </div>

    {/* --- CALL OVERLAY (PHONE UI) --- */}
    {callingState.activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-fade-in">
            <div className="flex flex-col items-center justify-between h-full w-full max-w-sm py-12 pb-20">
                <div className="flex flex-col items-center mt-10">
                    <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center mb-6 shadow-2xl relative overflow-visible">
                         <span className="text-4xl">🤖</span>
                         {/* Pulsing ring */}
                         <div className="absolute inset-0 rounded-full border border-blue-500/50 animate-ping" />
                         <div className="absolute -inset-4 rounded-full border border-blue-400/20 animate-pulse" />
                    </div>
                    <h2 className="text-white text-2xl font-bold mb-1 text-center px-4">{callingState.techName}</h2>
                    <p className="text-blue-400 font-medium">Chiamata AI in corso...</p>
                    <p className="text-slate-500 text-sm mt-2">Home Twin sta negoziando per te</p>
                </div>

                {/* Simulated Audio Waveform */}
                <div className="flex items-center gap-1 h-12">
                    {[...Array(8)].map((_, i) => (
                        <div 
                            key={i} 
                            className="w-1.5 bg-gradient-to-t from-blue-500 to-teal-400 rounded-full animate-pulse" 
                            style={{ 
                                height: `${Math.random() * 100}%`, 
                                animationDuration: `${0.5 + Math.random()}s` 
                            }} 
                        />
                    ))}
                </div>

                <div className="flex gap-8">
                     {/* Mute (Fake) */}
                     <button className="flex flex-col items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <span className="text-xs">Muto</span>
                     </button>

                     {/* Hang Up */}
                     <button 
                        onClick={stopCall}
                        className="flex flex-col items-center gap-2 text-white hover:opacity-90 transition-opacity"
                     >
                        <div className="w-16 h-16 rounded-full bg-red-500 shadow-lg shadow-red-500/40 flex items-center justify-center">
                            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41C4.59 7.52 8.06 6 12 6s7.41 1.52 11.71 5.67c.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                            </svg>
                        </div>
                        <span className="text-xs font-bold">Chiudi</span>
                     </button>

                     {/* Keypad (Fake) */}
                     <button className="flex flex-col items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <span className="text-xs">Tastiera</span>
                     </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default DiagnosticReport;