export type MessageRole = 'user' | 'assistant';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface Technician {
  id: string;
  name: string;
  service: string;
  zone: string;
  availability: 'Live' | 'On Call' | 'Offline';
  estimatedCost: string;
}

export interface ApplianceInfo {
  id: string;
  type: string;
  brand: string;
  model: string;
  lastMaintenance: string;
  nextScheduled: string;
}

export interface SmartSystemInfo {
  name: string;
  details: string;
}

export interface HomeSnapshot {
  address: string;
  systems: SmartSystemInfo[];
  appliances: ApplianceInfo[];
}

