import React, { useCallback, useMemo, useState } from 'react';
import DiagnosticReport from './components/DiagnosticReport';
import InputArea from './components/InputArea';
import KnowledgePanel from './components/KnowledgePanel';
import MessageBubble from './components/MessageBubble';
import ProcessingScreen from './components/ProcessingScreen';
import { MOCK_HOME_DATA } from './constants';
import { runHomeAgent } from './services/geminiService';
import { Attachment, Message } from './types';

type FlowState = 'idle' | 'processing' | 'diagnosis';

const initialMessages: Message[] = [
  {
    id: 'boot',
    role: 'assistant',
    text:
      "Ciao, sono il tuo Predictive Home Twin. Posso leggere testo, foto e dati sensore per darti una diagnosi completa e contattare i tecnici partner. Raccontami il problema dell'elettrodomestico.",
    timestamp: Date.now()
  }
];

const heroStats = [
  { label: 'Gemello Attivo', value: 'Live 24/7', detail: 'Streaming sensori sincronizzato' },
  { label: 'Ultimo intervento', value: '35 min fa', detail: 'Bilanciamento circuito idrico' },
  { label: 'Mood Casa', value: 'Tranquillo', detail: 'Nessun alert critico' }
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [latestReport, setLatestReport] = useState<Message | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasAssistantResponse = useMemo(() => messages.some((msg) => msg.role === 'assistant' && msg.id !== 'boot'), [messages]);

  const resetSession = useCallback(() => {
    setMessages(initialMessages);
    setLatestReport(null);
    setFlowState('idle');
    setError(null);
  }, []);

  const handleSendMessage = useCallback(
    async (text: string, files: File[]) => {
      if (!text.trim() && files.length === 0) return;

      const attachmentPayload: Attachment[] = files.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        url: URL.createObjectURL(file)
      }));

      const outbound: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: text.trim(),
        timestamp: Date.now(),
        attachments: attachmentPayload
      };

      const historySnapshot = [...messages, outbound];

      setMessages((prev) => [...prev, outbound]);
      setLatestReport(null);
      setError(null);
      setFlowState('processing');

      try {
        const aiText = await runHomeAgent({ text, files, history: historySnapshot });
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: aiText,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setLatestReport(assistantMessage);
        setFlowState('diagnosis');
      } catch (err) {
        console.error(err);
        setError('Non riesco a completare la diagnosi. Controlla la chiave Gemini o riprova più tardi.');
        setFlowState('idle');
      }
    },
    [messages]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 grid-overlay opacity-40 pointer-events-none" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 py-8 flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 flex flex-col gap-6">
          <header className="glass-panel shadow-focused p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400 mb-2">Gemello domestico</p>
                <h1 className="text-3xl md:text-4xl font-semibold text-white">Predictive Home Twin</h1>
                <p className="text-slate-400 mt-2 max-w-2xl">
                  Diagnosi tecnica multimodale per elettrodomestici e impianti domestici. Integro foto, testo e segnali del gemello per proporre azioni e tecnici consigliati.
                </p>
              </div>
              <div className="glass-panel--light border border-white/10 rounded-2xl px-5 py-4 w-full md:w-auto">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Gemello</p>
                <p className="text-lg font-semibold text-white">{MOCK_HOME_DATA.address}</p>
                <p className="text-xs text-slate-500 mt-1">Sincronizzato 2 secondi fa</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="glass-panel--light border border-white/5 rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                  <p className="text-xl font-semibold text-white mt-1">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.detail}</p>
                </div>
              ))}
            </div>
          </header>

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-100 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <section className="glass-panel shadow-focused flex flex-col h-[720px]">
            <div className="grid md:grid-cols-2 gap-6 border-b border-white/5 p-4 md:p-6">
              {flowState === 'processing' ? (
                <ProcessingScreen />
              ) : latestReport ? (
                <DiagnosticReport message={latestReport} history={messages} onRetry={resetSession} />
              ) : (
                <div className="flex flex-col items-center justify-center text-center gap-4 px-6 py-10 border border-dashed border-white/10 rounded-3xl">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">Nessuna diagnosi attiva</p>
                    <p className="text-sm text-slate-400 mt-2">Descrivi il problema o carica una foto/video per avviare la valutazione predittiva.</p>
                  </div>
                </div>
              )}

              <div className="rounded-3xl bg-slate-950/40 border border-white/5 p-5 flex flex-col gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Sessione</p>
                  <p className="text-xl font-semibold text-white mt-1">
                    {hasAssistantResponse ? 'Chat attiva' : 'In attesa del tuo input'}
                  </p>
                </div>
                <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1 max-h-[360px]">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </div>
              </div>
            </div>
            <InputArea onSendMessage={handleSendMessage} isLoading={flowState === 'processing'} />
          </section>
        </div>

        <KnowledgePanel />
      </div>
    </div>
  );
};

export default App;

