import { Moon, Sun, Download, Upload, Database, Camera, Video, ChevronRight, Languages, Heart, Star, Mail } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { getAllCaptures, getAllMaps, addCapture, addMap } from '../services/db';
import PhotoSettingsView from './PhotoSettingsView';
import VideoSettingsView from './VideoSettingsView';
import LanguageSettingsView from './LanguageSettingsView';
import { useLanguage } from '../contexts/LanguageContext';

export default function SettingsView({ theme, setTheme }: { theme: string; setTheme: Dispatch<SetStateAction<string>> }) {
  const { t } = useLanguage();
  const [storageUsed, setStorageUsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [photoQuality, setPhotoQuality] = useState(localStorage.getItem('photoQuality') || 'High');
  const [photoFormat, setPhotoFormat] = useState(localStorage.getItem('photoFormat') || 'JPEG');
  const [videoQuality, setVideoQuality] = useState(localStorage.getItem('videoQuality') || '4K');
  const [videoFrames, setVideoFrames] = useState(localStorage.getItem('videoFrames') || '60fps');
  const [videoFormat, setVideoFormat] = useState(localStorage.getItem('videoFormat') || 'MP4');
  
  const [activeSubTab, setActiveSubTab] = useState<'main' | 'photo' | 'video' | 'language'>('main');

  useEffect(() => {
    const calculateStorage = async () => {
      try {
        const captures = await getAllCaptures();
        const maps = await getAllMaps();
        
        const capturesStr = JSON.stringify(captures);
        const mapsStr = JSON.stringify(maps);
        
        // This is a rough estimation of size in bytes
        const total = new Blob([capturesStr, mapsStr]).size;
        setStorageUsed(total);
      } catch (err) {
        console.error("Failed to calculate storage", err);
      }
    };
    calculateStorage();
  }, []);

  useEffect(() => {
    localStorage.setItem('photoQuality', photoQuality);
  }, [photoQuality]);
  useEffect(() => {
    localStorage.setItem('photoFormat', photoFormat);
  }, [photoFormat]);
  useEffect(() => {
    localStorage.setItem('videoQuality', videoQuality);
  }, [videoQuality]);
  useEffect(() => {
    localStorage.setItem('videoFrames', videoFrames);
  }, [videoFrames]);
  useEffect(() => {
    localStorage.setItem('videoFormat', videoFormat);
  }, [videoFormat]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleExportData = async () => {
    try {
      const captures = await getAllCaptures();
      const maps = await getAllMaps();
      const data = { captures, maps, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-app-backup-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export data", err);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Assuming data is { captures: [], maps: [] }
        for (const capture of data.captures) await addCapture(capture);
        for (const map of data.maps) await addMap(map);
        alert('Data imported successfully!');
        window.location.reload(); // Refresh to reflect changes
      } catch (err) {
        console.error("Failed to import data", err);
      }
    };
    reader.readAsText(file);
  };

  if (activeSubTab === 'photo') {
    return <PhotoSettingsView photoQuality={photoQuality} setPhotoQuality={setPhotoQuality} photoFormat={photoFormat} setPhotoFormat={setPhotoFormat} onBack={() => setActiveSubTab('main')} theme={theme} />;
  }

  if (activeSubTab === 'video') {
    return <VideoSettingsView videoQuality={videoQuality} setVideoQuality={setVideoQuality} videoFrames={videoFrames} setVideoFrames={setVideoFrames} videoFormat={videoFormat} setVideoFormat={setVideoFormat} onBack={() => setActiveSubTab('main')} theme={theme} />;
  }

  if (activeSubTab === 'language') {
    return <LanguageSettingsView onBack={() => setActiveSubTab('main')} theme={theme} />;
  }

  return (
    <div className="p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className={`text-xl font-bold uppercase tracking-tight ${theme === 'light' ? 'text-text-main' : 'text-white'}`}>{t('Settings')}</h2>
        <p className="text-xs text-muted-text uppercase tracking-widest font-bold mt-1">{t('Manage your interface')}</p>
      </div>

      {/* Theme Selection */}
      <div className="bg-card-surface border border-[#222] rounded-[24px] p-6 flex flex-col gap-2">
        <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest px-1 mb-2">{t('Display Mode')}</label>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-3 py-4 rounded-[16px] transition-all border font-bold text-[10px] uppercase tracking-widest ${
              theme === 'dark' 
                ? 'bg-accent text-black border-accent' 
                : 'bg-black/20 text-muted-text border-white/5 hover:bg-black/40'
            }`}
          >
            <Moon size={16} />
            {t('Dark')}
          </button>
          <button 
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-3 py-4 rounded-[16px] transition-all border font-bold text-[10px] uppercase tracking-widest ${
              theme === 'light' 
                ? 'bg-white text-black border-white' 
                : 'bg-black/20 text-muted-text border-white/5 hover:bg-black/40'
            }`}
          >
            <Sun size={16} />
            {t('Light')}
          </button>
        </div>
      </div>

      {/* Capture Settings */}
      <div className="bg-card-surface border border-[#222] rounded-[24px] p-6 flex flex-col gap-4">
        <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest px-1">{t('Capture Settings')}</label>

        {/* Photo Settings */}
        <button 
          onClick={() => setActiveSubTab('photo')}
          className="w-full h-14 text-left py-4 px-4 rounded-[16px] bg-black/20 border border-white/5 text-white hover:bg-black/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Camera size={16} />
            <span className={`${theme === 'light' ? 'text-text-main' : 'text-white'}`}>{t('Photo Settings')}</span>
          </div>
          <ChevronRight size={16} className="text-muted-text" />
        </button>

        {/* Video Settings */}
        <button 
          onClick={() => setActiveSubTab('video')}
          className="w-full h-14 text-left py-4 px-4 rounded-[16px] bg-black/20 border border-white/5 text-white hover:bg-black/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Video size={16} />
            <span className={`${theme === 'light' ? 'text-text-main' : 'text-white'}`}>{t('Video Settings')}</span>
          </div>
          <ChevronRight size={16} className="text-muted-text" />
        </button>

        <button 
          onClick={() => {
            import('../services/notificationService').then(({ notificationService }) => {
              notificationService.sendNotification(t('Test Notification'), t('This is a simulated push notification'));
            });
          }}
          className="w-full h-14 text-left py-4 px-4 rounded-[16px] bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors flex items-center justify-center font-bold text-[10px] uppercase tracking-widest"
        >
          {t('Test Notification')}
        </button>
      </div>

      {/* Data Management */}
      <div className="bg-card-surface border border-[#222] rounded-[24px] p-6 flex flex-col gap-2">
        <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest px-1 mb-2">{t('Data Management & Storage')}</label>
        
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest flex items-center gap-2">
            <Database size={14} /> {t('Storage Usage')}
          </span>
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{formatBytes(storageUsed)} {t('local')}</span>
        </div>

        <button 
          onClick={handleExportData}
          className="w-full h-14 text-left py-4 px-4 rounded-[16px] bg-black/20 border border-white/5 text-white hover:bg-black/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Download size={16} />
            <div className="flex flex-col">
              <span className={`${theme === 'light' ? 'text-text-main' : 'text-white'} leading-tight`}>{t('Export Data')}</span>
              <span className="text-[9px] text-accent leading-tight">(.json)</span>
            </div>
          </div>
          <span className="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">{t('DOWNLOAD')}</span>
        </button>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-14 text-left py-2 px-4 rounded-[16px] bg-black/20 border border-white/5 text-white hover:bg-black/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Upload size={16} />
            <div className="flex flex-col">
              <span className={`${theme === 'light' ? 'text-text-main' : 'text-white'} leading-tight`}>{t('Import Data')}</span>
              <span className="text-[9px] text-accent leading-tight">(.json)</span>
            </div>
          </div>
          <span className="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">{t('UPLOAD')}</span>
        </button>
        <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json" />
      </div>

      {/* Language Settings */}
      <div className="bg-card-surface border border-[#222] rounded-[24px] p-6 flex flex-col gap-4">
        <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest px-1">{t('Language')}</label>
        <button 
          onClick={() => setActiveSubTab('language')}
          className="w-full h-14 text-left py-4 px-4 rounded-[16px] bg-black/20 border border-white/5 text-white hover:bg-black/40 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Languages size={16} />
            <span className={`${theme === 'light' ? 'text-text-main' : 'text-white'}`}>{t('Language Settings')}</span>
          </div>
          <ChevronRight size={16} className="text-muted-text" />
        </button>
      </div>

      <div className="bg-card-surface border border-[#222] rounded-[24px] p-6 flex flex-col gap-2">
        <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest px-1 mb-2">{t('Support & Donations')}</label>
        <button className="w-full text-left py-4 px-4 rounded-[16px] bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/30 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-yellow-500 text-black flex items-center justify-center">
              <Heart size={16} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className={`font-bold ${theme === 'light' ? 'text-black' : 'text-yellow-500'}`}>Ko-Fi</span>
              <span className="text-[10px] text-yellow-500/60 uppercase tracking-widest font-bold">{t('Donations')}</span>
            </div>
          </div>
          <span className="text-[10px] text-yellow-500 opacity-0 group-hover:opacity-100 transition-all translate-x-2 font-bold">{t('EXTERNAL LINK')}</span>
        </button>
        <a href="https://play.google.com/store/apps/details?id=your.package.name" target="_blank" rel="noopener noreferrer" className="w-full text-left py-4 px-4 rounded-[16px] bg-black/20 border border-white/5 text-white hover:bg-black/40 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-white/10 text-white flex items-center justify-center">
              <Star size={16} fill="currentColor" />
            </div>
            <span className={`${theme === 'light' ? 'text-text-main' : 'text-white'}`}>{t('Rate on Google Play')}</span>
          </div>
          <span className="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-all translate-x-2">{t('EXTERNAL LINK')}</span>
        </a>
        <a href="mailto:DobroOfficial.si@gmail.com?subject=Zapomni%20feedback" className="w-full text-left py-4 px-4 rounded-[16px] bg-black/20 border border-white/5 text-white hover:bg-black/40 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-white/10 text-white flex items-center justify-center">
              <Mail size={16} fill="currentColor" />
            </div>
            <span className={`${theme === 'light' ? 'text-text-main' : 'text-white'}`}>{t('Send Feedback')}</span>
          </div>
          <span className="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-all translate-x-2">{t('EXTERNAL LINK')}</span>
        </a>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col items-center gap-1 mt-auto pt-2 text-muted-text">
        <span className="text-[10px] font-bold uppercase tracking-widest">{t('Version 1.0.0')}</span>
        <a 
          href="https://github.com/your-username/your-repo" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[10px] font-bold uppercase tracking-widest hover:text-accent transition-colors"
        >
          {t('Open Source on GitHub')}
        </a>
      </div>
    </div>
  );
}
