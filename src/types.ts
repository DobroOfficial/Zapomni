export type CaptureType = 'note' | 'photo' | 'voice' | 'video';

export interface MapData {
  id: string;
  name: string;
  iconId: string; // ID for the icon
  color: string;
  count: number;
  lastUpdated: number;
}

export interface Capture {
  id: string;
  type: CaptureType;
  title: string;
  content: string; // For notes, this is the text; for photos/voice, maybe base64 or path
  description?: string; // Optional description/caption for photos/voice
  audioContent?: string; // Optional voice note (base64) attached to a photo
  additionalContents?: string[];
  mapId: string;
  timestamp: number;
  reminderDate?: number;
}
