import { Video } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

export default function VideoSettingsView({ 
  videoQuality, setVideoQuality, 
  videoFrames, setVideoFrames,
  videoFormat, setVideoFormat,
  onBack,
  theme
}: { 
  videoQuality: string; setVideoQuality: Dispatch<SetStateAction<string>>;
  videoFrames: string; setVideoFrames: Dispatch<SetStateAction<string>>;
  videoFormat: string; setVideoFormat: Dispatch<SetStateAction<string>>;
  onBack: () => void;
  theme: string;
}) {
  return (
    <div className="p-6 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="text-sm font-bold text-accent uppercase tracking-widest mb-4">
        ← Back to Settings
      </button>
      <h2 className={`text-xl font-bold uppercase tracking-tight ${theme === 'light' ? 'text-text-main' : 'text-white'}`}>Video Settings</h2>
      
      <div className="bg-card-surface border border-[#222] rounded-[24px] p-6 flex flex-col gap-4">
        <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest px-1">Quality</label>
        <select value={videoQuality} onChange={(e) => setVideoQuality(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-[12px] p-4 text-white">
          <option>4K</option>
          <option>1080p</option>
          <option>720p</option>
        </select>
      </div>

      <div className="bg-card-surface border border-[#222] rounded-[24px] p-6 flex flex-col gap-4">
        <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest px-1">Frames</label>
        <select value={videoFrames} onChange={(e) => setVideoFrames(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-[12px] p-4 text-white">
          <option>60fps</option>
          <option>30fps</option>
        </select>
      </div>

      <div className="bg-card-surface border border-[#222] rounded-[24px] p-6 flex flex-col gap-4">
        <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest px-1">Format</label>
        <select value={videoFormat} onChange={(e) => setVideoFormat(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-[12px] p-4 text-white">
          <option>MP4</option>
          <option>MOV</option>
        </select>
      </div>
    </div>
  );
}
