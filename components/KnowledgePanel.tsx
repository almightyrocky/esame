import React, { useMemo, useState } from 'react';
import { MOCK_HOME_DATA, MOCK_TECHNICIANS } from '../constants';

const quickTracks = [
  { id: 'clima', label: 'Clima', value: 92, status: 'Stabile' },
  { id: 'elettrico', label: 'Elettrico', value: 88, status: 'Monitorato' },
  { id: 'idrico', label: 'Idrico', value: 76, status: 'Valvola ok' }
];

const KnowledgePanel: React.FC = () => {
  const [activeCollection, setActiveCollection] = useState<'system' | 'appliance'>('system');
  const [enabledServices, setEnabledServices] = useState<Record<string, boolean>>({
    clima: true,
    sicurezza: true,
    energia: false
  });

  const upcomingMaint = useMemo(() => {
    return [...MOCK_HOME_DATA.appliances]
      .map((app) => ({
        ...app,
        nextDate: new Date(app.nextScheduled)
      }))
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
      .slice(0, 3);
  }, []);

  const toggleService = (id: string) => {
    setEnabledServices((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="hidden md:flex flex-col h-full bg-transparent w-[320px] xl:w-[360px] p-4 lg:p-6 text-slate-100 overflow-y-auto gap-5">
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Gemello</p>
            <h2 className="text-xl font-semibold text-white mt-1">{MOCK_HOME_DATA.address}</h2>
          </div>
          <span className="text-xs text-emerald-200 bg-emerald-500/10 px-3 py-1 rounded-full">Live</span>
        </div>
        <p className="text-sm text-slate-400">
          Snapshot sensori e RAG locale sempre sincronizzati. Puoi vedere impianti e partner disponibili in tempo reale.
        </p>
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Telemetria</p>
          <span className="text-[11px] text-slate-500">agg. 3s</span>
        </div>
        <div className="space-y-3">
          {quickTracks.map((item) => (
            <div key={item.id}>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>{item.label}</span>
                <span className="text-xs text-slate-500">{item.status}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Inventario</p>
          <div className="flex gap-1 rounded-full bg-white/5 p-1 text-xs">
            <button
              onClick={() => setActiveCollection('system')}
              className={`px-3 py-1 rounded-full transition-all ${activeCollection === 'system' ? 'bg-white/20' : 'text-slate-400'}`}
            >
              Impianti
            </button>
            <button
              onClick={() => setActiveCollection('appliance')}
              className={`px-3 py-1 rounded-full transition-all ${activeCollection === 'appliance' ? 'bg-white/20' : 'text-slate-400'}`}
            >
              Elettro
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {activeCollection === 'system'
            ? MOCK_HOME_DATA.systems.map((system, idx) => (
                <div key={`sys-${idx}`} className="glass-panel--light border border-white/5 rounded-2xl p-3">
                  <p className="text-sm text-white font-semibold">{system.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{system.details}</p>
                </div>
              ))
            : MOCK_HOME_DATA.appliances.map((app) => (
                <div key={app.id} className="glass-panel--light border border-white/5 rounded-2xl p-3">
                  <p className="text-sm text-white font-semibold">{app.type} · {app.brand}</p>
                  <p className="text-xs text-slate-400 mt-1">Modello {app.model}</p>
                  <p className="text-xs text-slate-500 mt-1">Manut. {app.lastMaintenance}</p>
                </div>
              ))}
        </div>
      </div>

      <div className="glass-panel p-5 space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Prossime manutenzioni</p>
        <div className="space-y-3">
          {upcomingMaint.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="text-white font-medium">{item.type}</p>
                <p className="text-xs text-slate-400">{item.brand} · {item.model}</p>
              </div>
              <span className="text-xs text-sky-200 bg-sky-500/10 px-2 py-1 rounded-full">
                {item.nextDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Partner RAG</p>
          <span className="text-[11px] text-slate-500">{MOCK_TECHNICIANS.length} tecnici</span>
        </div>
        <div className="space-y-3">
          {MOCK_TECHNICIANS.slice(0, 4).map((tech) => (
            <div key={tech.id} className="glass-panel--light border border-white/5 rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{tech.name}</p>
                <span className="text-[10px] text-emerald-200 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {tech.availability}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{tech.service}</p>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span>{tech.zone}</span>
                <span>{tech.estimatedCost}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Autonomi</p>
        {[
          { id: 'clima', label: 'Bilanciamento clima' },
          { id: 'sicurezza', label: 'Perimetro smart' },
          { id: 'energia', label: 'Peak shaving' }
        ].map((svc) => (
          <button
            key={svc.id}
            onClick={() => toggleService(svc.id)}
            className={`w-full text-left rounded-2xl border px-4 py-3 text-sm transition-all ${
              enabledServices[svc.id]
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {svc.label}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default KnowledgePanel;