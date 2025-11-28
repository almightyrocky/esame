import { HomeSnapshot, Technician } from './types';

export const MOCK_HOME_DATA: HomeSnapshot = {
  address: 'Via Manzoni 42 · Milano',
  systems: [
    { name: 'Gemello Termico', details: 'Caldaia a condensazione · Ariston H-Class 12kW' },
    { name: 'Rete Idrica', details: 'Circuito a zone · Sensori perdite Aqara' },
    { name: 'Bilanciamento Energia', details: 'Fotovoltaico 6kW + batteria 10kWh' },
    { name: 'Comfort Aria', details: 'Purificatori + split inverter Samsung WindFree' }
  ],
  appliances: [
    {
      id: 'app-1',
      type: 'Caldaia',
      brand: 'Ariston',
      model: 'H-Class 120i',
      lastMaintenance: 'Ago 2025',
      nextScheduled: '2026-02-12'
    },
    {
      id: 'app-2',
      type: 'Lavatrice',
      brand: 'Bosch',
      model: 'Serie 8 i-DOS',
      lastMaintenance: 'Lug 2025',
      nextScheduled: '2025-12-04'
    },
    {
      id: 'app-3',
      type: 'Asciugatrice',
      brand: 'Miele',
      model: 'EcoSpeed 9kg',
      lastMaintenance: 'Giu 2025',
      nextScheduled: '2026-01-08'
    },
    {
      id: 'app-4',
      type: 'Lavastoviglie',
      brand: 'Samsung',
      model: 'Bespoke AI',
      lastMaintenance: 'Set 2025',
      nextScheduled: '2026-03-03'
    }
  ]
};

export const MOCK_TECHNICIANS: Technician[] = [
  {
    id: 'tech-1',
    name: 'HydraFix 24/7',
    service: 'Termoidraulica smart + IoT',
    zone: 'Milano centro',
    availability: 'Live',
    estimatedCost: '€120-€180'
  },
  {
    id: 'tech-2',
    name: 'ElettroLab AI Team',
    service: 'Diagnostica elettrodomestici premium',
    zone: 'Milano nord',
    availability: 'On Call',
    estimatedCost: '€80-€140'
  },
  {
    id: 'tech-3',
    name: 'Clima Pulse',
    service: 'HVAC & IAQ ottimizzato',
    zone: 'Milano sud',
    availability: 'Live',
    estimatedCost: '€150-€210'
  },
  {
    id: 'tech-4',
    name: 'Volt Guard',
    service: 'Reti elettriche domestiche',
    zone: 'Hinterland',
    availability: 'On Call',
    estimatedCost: '€90-€160'
  },
  {
    id: 'tech-5',
    name: 'Acqua Sense',
    service: 'Circuiti idrici e perdite',
    zone: 'Milano est',
    availability: 'Live',
    estimatedCost: '€110-€170'
  }
];

