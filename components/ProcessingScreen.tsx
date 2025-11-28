import React, { useEffect, useState } from 'react';

const steps = [
    "Sto ripulendo il testo e agganciando i sensori...",
    "Trasformo immagini/video in embedding multimodali...",
    "Consulto il gemello digitale + RAG locale...",
    "Innesco la negoziazione con i partner tecnici...",
    "Compongo la diagnosi finale e le azioni smart..."
];

const ProcessingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 h-full flex items-center justify-center px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-70 pointer-events-none">
        <div className="absolute w-72 h-72 bg-gradient-to-br from-cyan-500/40 to-blue-500/20 blur-3xl top-20 left-12 animate-blob" />
        <div className="absolute w-80 h-80 bg-gradient-to-br from-emerald-500/30 to-sky-400/10 blur-3xl bottom-10 right-16 animate-blob" />
      </div>

      <div className="relative z-10 glass-panel w-full max-w-3xl p-8 md:p-12 space-y-8 text-center">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.3em] text-slate-300">
          Orchestrazione AI in corso
          <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-semibold text-white">Allineo sensori, RAG e partner</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Sto componendo la diagnosi sfruttando Gemini, database locale e simulazione di chiamata AI verso i tecnici partner. Rimani qui, lo stato avanza automaticamente.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-left">
          {steps.map((step, idx) => (
            <div key={idx} className={`rounded-2xl border px-4 py-4 transition-all ${idx <= currentStep ? 'border-sky-400/40 bg-sky-400/5' : 'border-white/5 bg-white/5'}`}>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">
                <span>Step {idx + 1}</span>
                <span className={`w-2 h-2 rounded-full ${idx <= currentStep ? 'bg-cyan-300' : 'bg-white/10'}`} />
              </div>
              <p className="text-sm text-slate-200">{step}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {currentStep + 1}/{steps.length} · orchestrazione autonoma
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingScreen;