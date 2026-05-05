import { Camera } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

export default function PhotoSettingsView({ 
  photoQuality, setPhotoQuality, 
  photoFormat, setPhotoFormat,
  onBack,
  theme
}: { 
  photoQuality: string; setPhotoQuality: Dispatch<SetStateAction<string>>;
  photoFormat: string; setPhotoFormat: Dispatch<SetStateAction<string>>;
  onBack: () => void;
  theme: string;
}) {
  return (
    <div className="p-6 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="text-sm font-bold text-accent uppercase tracking-widest mb-4">
        ← Back to Settings
      </button>
      <h2 className={`text-xl font-bold uppercase tracking-tight ${theme === 'light' ? 'text-text-main' : 'text-white'}`}>Photo Settings</h2>
      
      <div className="bg-card-surface border border-[#222] rounded-[24px] p-6 flex flex-col gap-4">
        <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest px-1">Quality</label>
        <select value={photoQuality} onChange={(e) => setPhotoQuality(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-[12px] p-4 text-white">
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      <div className="bg-card-surface border border-[#222] rounded-[24px] p-6 flex flex-col gap-4">
        <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest px-1">Format</label>
        <select value={photoFormat} onChange={(e) => setPhotoFormat(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-[12px] p-4 text-white">
          <option>JPEG</option>
          <option>HEIC</option>
        </select>
      </div>
    </div>
  );
}
