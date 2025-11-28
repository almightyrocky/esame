import React, { useState } from 'react';
import { Message } from '../types';

interface Props {
  message: Message;
}

const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';
  const [activeStep, setActiveStep] = useState(0);

  // Helper to parse the structured response into nice UI cards
  const renderAIContent = (text: string) => {
    // Split by the specific headers we asked for in the prompt
    const sections = text.split(/###\s\d+\.\s/g).filter(Boolean);
    
    // Check if we have sources appended at the end (not part of the 4 steps)
    // The prompt asks for 4 steps. Sometimes sources are appended after.
    // We'll treat the sources as part of the last step or a footer if feasible.
    
    if (sections.length < 2 && !text.includes('###')) {
        return <div className="whitespace-pre-wrap p-4 text-sm">{text}</div>;
    }

    const headers = [
      "Diagnosi",
      "Azioni Immediate",
      "Soluzione",
      "Prevenzione"
    ];

    // Map content to headers
    const steps = headers.map((header, index) => {
        let content = sections[index] || "Dati non disponibili.";
        // Cleanup header repetition
        if (content.trim().startsWith(header)) {
            content = content.replace(header, '').trim();
        }
        return { title: header, content: content.trim() };
    });

    const currentStep = steps[activeStep];

    // Function to render content with markdown-like list support
    const renderMarkdownContent = (content: string) => {
        return content.split('\n').map((line, i) => {
            // Handle lists
            if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
                return (
                    <div key={i} className="flex items-start gap-2 mb-2 ml-1">
                        <span className="text-blue-500 mt-1.5">•</span>
                        <span className="flex-1 text-slate-700">{line.replace(/^[\*\-]\s*/, '')}</span>
                    </div>
                );
            }
            // Handle bold (simple implementation)
            if (line.includes('**')) {
                 const parts = line.split('**');
                 return (
                    <p key={i} className="mb-2 text-slate-700">
                        {parts.map((part, idx) => 
                            idx % 2 === 1 ? <strong key={idx} className="font-semibold text-slate-900">{part}</strong> : part
                        )}
                    </p>
                 );
            }
            // Regular paragraph
            if (line.trim().length > 0) {
                return <p key={i} className="mb-2 text-slate-700">{line}</p>;
            }
            return <div key={i} className="h-2"></div>;
        });
    };

    return (
      <div className="w-full flex flex-col">
        {/* Step Navigation (Tabs) */}
        <div className="flex w-full bg-slate-50 rounded-t-lg overflow-hidden border-b border-slate-200">
            {steps.map((step, idx) => {
                const isActive = idx === activeStep;
                return (
                    <button
                        key={idx}
                        onClick={() => setActiveStep(idx)}
                        className={`
                            flex-1 py-3 px-1 text-[10px] md:text-xs font-bold uppercase tracking-wide transition-all
                            ${isActive 
                                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm z-10' 
                                : 'text-slate-400 hover:bg-slate-100'
                            }
                        `}
                    >
                        {/* Mobile: Show Number, Desktop: Show Title */}
                        <span className="md:hidden">{idx + 1}</span>
                        <span className="hidden md:inline">{step.title}</span>
                    </button>
                );
            })}
        </div>

        {/* Step Content */}
        <div className="p-5 min-h-[160px] bg-white rounded-b-lg">
             <div className="flex items-center gap-2 mb-4">
                <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold
                    ${activeStep === 0 ? 'bg-blue-500' : 
                      activeStep === 1 ? 'bg-amber-500' :
                      activeStep === 2 ? 'bg-teal-500' : 'bg-purple-500'}
                `}>
                    {activeStep + 1}
                </div>
                <h3 className="font-bold text-slate-800 text-base">{currentStep.title}</h3>
             </div>
             
             <div className="text-sm leading-relaxed">
                {renderMarkdownContent(currentStep.content)}
             </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex justify-between items-center px-4 py-2 bg-slate-50/50 rounded-b-lg border-t border-slate-100 text-xs text-slate-400">
            <button 
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                className="hover:text-blue-600 disabled:opacity-30 flex items-center gap-1"
            >
                ← Prev
            </button>
            <div className="flex gap-1">
                {steps.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === activeStep ? 'bg-slate-400' : 'bg-slate-200'}`} />
                ))}
            </div>
            <button 
                onClick={() => setActiveStep(Math.min(3, activeStep + 1))}
                disabled={activeStep === 3}
                className="hover:text-blue-600 disabled:opacity-30 flex items-center gap-1"
            >
                Next →
            </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col w-full ${isUser ? 'items-end max-w-[85%]' : 'items-start max-w-full md:max-w-[85%]'}`}>
        
        {/* Author Name */}
        <span className="text-xs text-slate-400 mb-1 px-1 font-medium">
          {isUser ? 'Tu' : 'Predictive Home Twin'}
        </span>

        {/* Bubble */}
        <div className={`
          relative rounded-2xl shadow-sm w-full transition-all
          ${isUser 
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none p-4' 
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none p-0 overflow-hidden'
          }
        `}>
          {/* Attachments Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${isUser ? 'mb-2' : 'p-4 pb-0'}`}>
              {message.attachments.map((att, idx) => (
                <div key={idx} className="relative group overflow-hidden rounded-lg shadow-sm">
                  {att.mimeType.startsWith('image/') ? (
                    <img src={att.url} alt="attachment" className="w-24 h-24 object-cover hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-24 h-24 bg-slate-100 flex flex-col items-center justify-center text-slate-500 text-xs gap-1 border border-slate-200">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Video</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Text Content */}
          {isUser ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</div>
          ) : (
            renderAIContent(message.text)
          )}
        </div>
        
        {/* Timestamp */}
        <span className="text-[10px] text-slate-300 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;