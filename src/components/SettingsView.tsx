import { Moon, Sun, Download, Upload, Database, Camera, Video, ChevronRight, Languages, Heart, Star, Mail, Trash2, Shield } from 'lucide-react';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { getAllCaptures, getAllMaps, addCapture, addMap, clearAllData } from '../services/db';
import PhotoSettingsView from './PhotoSettingsView';
import VideoSettingsView from './VideoSettingsView';
import LanguageSettingsView from './LanguageSettingsView';
import PrivacyPolicyView from './PrivacyPolicyView';
import { useLanguage } from '../contexts/LanguageContext';
import { useBackHandler } from '../hooks/useBackHandler';

export default function SettingsView({ theme, setTheme }: { theme: string; setTheme: Dispatch<SetStateAction<string>> }) {
  const { t } = useLanguage();
  const [storageUsed, setStorageUsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [photoQuality, setPhotoQuality] = useState(localStorage.getItem('photoQuality') || 'High');
  const [photoFormat, setPhotoFormat] = useState(localStorage.getItem('photoFormat') || 'JPEG');
  const [videoQuality, setVideoQuality] = useState(localStorage.getItem('videoQuality') || '4K');
  const [videoFrames, setVideoFrames] = useState(localStorage.getItem('videoFrames') || '60fps');
  const [videoFormat, setVideoFormat] = useState(localStorage.getItem('videoFormat') || 'MP4');
  
  const [activeSubTab, setActiveSubTab] = useState<'main' | 'photo' | 'video' | 'language' | 'privacy'>('main');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteCooldown, setDeleteCooldown] = useState(0);

  useBackHandler(activeSubTab !== 'main', () => setActiveSubTab('main'), `settings-${activeSubTab}`);
  useBackHandler(isDeleteModalOpen, () => setIsDeleteModalOpen(false), 'settings-delete');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isDeleteModalOpen && deleteCooldown > 0) {
      timer = setTimeout(() => setDeleteCooldown(deleteCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isDeleteModalOpen, deleteCooldown]);

  const handleDeleteAllData = async () => {
    try {
      await clearAllData();
      setIsDeleteModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete all data", err);
    }
  };

  const openDeleteModal = () => {
    setDeleteCooldown(5);
    setIsDeleteModalOpen(true);
  };

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

  if (activeSubTab === 'privacy') {
    return <PrivacyPolicyView onBack={() => setActiveSubTab('main')} theme={theme} />;
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
        
        <button 
          onClick={openDeleteModal}
          className="w-full h-14 text-left py-4 px-4 rounded-[16px] bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 hover:border-red-500/30 transition-colors flex items-center justify-between group mt-2"
        >
          <div className="flex items-center gap-3">
            <Trash2 size={16} />
            <span className="font-bold tracking-tight">{t('Delete all data')}</span>
          </div>
        </button>
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
        <a href="https://ko-fi.com/dobroofficial" target="_blank" rel="noopener noreferrer" className="w-full text-left py-4 px-4 rounded-[16px] bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/30 transition-colors flex items-center justify-between group">
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
        </a>
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

      {/* About */}
      <div className="flex flex-col gap-2 relative mt-6">
        <h3 className="text-[12px] font-bold text-muted-text uppercase tracking-widest px-4 mb-2">{t('About')}</h3>
        <button 
          onClick={() => setActiveSubTab('privacy')}
          className="w-full text-left py-4 px-4 rounded-[16px] bg-[#141414] border border-white/5 hover:bg-white/5 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-white/5 flex items-center justify-center">
              <Shield size={16} />
            </div>
            <span className="font-semibold text-white">{t('Privacy Policy')}</span>
          </div>
          <ChevronRight size={16} className="text-muted-text" />
        </button>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col items-center gap-1 mt-auto pt-2 text-muted-text">
        <span className="text-[10px] font-bold uppercase tracking-widest">{t('Version 1.0.2')}</span>
        <a 
          href="https://github.com/DobroOfficial/Zapomni" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[10px] font-bold uppercase tracking-widest hover:text-accent transition-colors"
        >
          {t('Open Source on GitHub')}
        </a>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#222] rounded-[24px] p-6 max-w-sm w-full flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t('ARE YOU SURE?')}</h3>
            <p className="text-sm text-red-500 font-medium">
              {t('Delete all data warning')}
            </p>
            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                disabled={deleteCooldown > 0}
                onClick={handleDeleteAllData}
                className="w-full py-4 bg-red-500 text-white rounded-[16px] font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {deleteCooldown > 0 ? `${t('Confirm')} (${deleteCooldown})` : t('Confirm')}
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-4 text-muted-text font-bold text-[10px] uppercase tracking-widest hover:text-white"
              >
                {t('Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
