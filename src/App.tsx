/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Home, Folder, Calendar, Search, Settings, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import HomeView from './components/HomeView';
import MapsView from './components/MapsView';
import CalendarView from './components/CalendarView';
import SearchView from './components/SearchView';
import SettingsView from './components/SettingsView';
import DetailView from './components/DetailView';
import CreateModal from './components/CreateModal';
import { useLanguage } from './contexts/LanguageContext';
import { Capture, CaptureType, MapData } from './types';
import { addCapture, deleteCapture, getAllMaps, getAllCaptures } from './services/db';
import { notificationService } from './services/notificationService';

export default function App() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCapture, setEditingCapture] = useState<Capture | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [maps, setMaps] = useState<MapData[]>([]);
  const [allCaptures, setAllCaptures] = useState<Capture[]>([]);
  const [theme, setTheme] = useState('dark');
  const [globalActiveMapId, setGlobalActiveMapId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    loadMaps();
    loadAllCaptures();
    if (activeTab !== 'Maps') {
      setGlobalActiveMapId(null);
    }
  }, [refreshTrigger, activeTab]);

  useEffect(() => {
    if (allCaptures.length > 0) {
      notificationService.checkReminders(allCaptures, t);
      // Check every minute if the time threshold has been reached
      const interval = setInterval(() => {
        notificationService.checkReminders(allCaptures, t);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [allCaptures, t]);

  useEffect(() => {
    const handleAppNotification = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; body: string }>;
      setToast(customEvent.detail);
      setTimeout(() => setToast(null), 5000);
    };

    window.addEventListener('app-notification', handleAppNotification);
    return () => window.removeEventListener('app-notification', handleAppNotification);
  }, []);

  const loadMaps = async () => {
    const allMaps = await getAllMaps();
    setMaps(allMaps);
  };

  const loadAllCaptures = async () => {
    const captures = await getAllCaptures();
    setAllCaptures(captures);
  };

  const handleSaveCapture = async (type: CaptureType, title: string, content: string, description?: string, audioContent?: string, mapId: string = 'unassigned', reminderDate?: number) => {
    const newCapture: Capture = {
      id: editingCapture?.id || uuidv4(),
      type,
      title,
      content,
      description,
      audioContent,
      mapId,
      timestamp: editingCapture?.timestamp || Date.now(),
      reminderDate
    };
    await addCapture(newCapture);
    setEditingCapture(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDelete = async (id: string) => {
    await deleteCapture(id);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUpdate = async (capture: Capture) => {
    await addCapture(capture);
    setSelectedCapture(capture);
    setRefreshTrigger(prev => prev + 1);
  };

  const renderView = () => {
    switch (activeTab) {
      case 'Home': return <HomeView onCaptureClick={setSelectedCapture} onCaptureEdit={setEditingCapture} refreshTrigger={refreshTrigger} />;
      case 'Maps': return <MapsView onCaptureClick={setSelectedCapture} onCaptureEdit={setEditingCapture} onMapViewChange={setGlobalActiveMapId} />;
      case 'Calendar': return <CalendarView onCaptureClick={setSelectedCapture} onCaptureEdit={setEditingCapture} />;
      case 'Search': return <SearchView onCaptureClick={setSelectedCapture} onCaptureEdit={setEditingCapture} />;
      case 'Settings': return <SettingsView theme={theme} setTheme={setTheme} />;
      default: return <HomeView onCaptureClick={setSelectedCapture} onCaptureEdit={setEditingCapture} refreshTrigger={refreshTrigger} />;
    }
  };

  return (
    <div className={`${theme} h-screen flex flex-col bg-page-bg text-text-main font-sans overflow-hidden`}>
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-28">
          <header className="flex items-center justify-between mb-8 mt-2 px-2">
          <div className="flex items-center gap-2">
            <h1 className="font-sans font-extrabold text-[28px] tracking-tight">{t('ZAPOMNI')}</h1>
            <div className="w-2 h-2 bg-accent rounded-full -mb-1"></div>
          </div>
          <button 
            onClick={() => {
              setActiveTab('Settings');
            }}
            className={`p-2 rounded-xl border transition-all ${activeTab === 'Settings' ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-muted-text hover:bg-white/10'}`}
          >
            <Settings size={20} />
          </button>
        </header>

        {renderView()}
      </main>
  
        {/* FAB */}
        {activeTab !== 'Settings' && (
          <button 
            onClick={() => {
              setIsCreateOpen(true);
            }}
            className="fixed bottom-[88px] right-6 w-14 h-14 bg-accent text-black rounded-full flex items-center justify-center z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(255,208,0,0.3)] active:scale-90 transition-transform"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        )}
  
        {/* Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 h-[72px] border-t border-white/5 bg-nav-bg/80 backdrop-blur-xl grid grid-cols-4 items-center px-4 safe-area-bottom z-[100]">
          {[
            { name: 'Home', icon: Home },
            { name: 'Categories', icon: Folder, tab: 'Maps' },
            { name: 'Calendar', icon: Calendar, tab: 'Calendar' },
            { name: 'Search', icon: Search, tab: 'Search' }
          ].map((tab) => {
            const isActive = activeTab === (tab.tab || tab.name);
            return (
              <button 
                key={tab.name}
                onClick={() => {
                  setActiveTab(tab.tab || tab.name);
                  setSelectedCapture(null);
                }}
                className={`flex flex-col items-center justify-center gap-1 transition-all ${
                  theme === 'light' 
                    ? isActive 
                      ? 'text-[#FFD000]' 
                      : 'text-[#B0A060]'
                    : isActive 
                      ? 'text-accent' 
                      : 'text-[#444]'
                }`}
              >
                <div className={`p-1 px-3 rounded-full transition-all flex items-center ${
                  theme === 'light'
                    ? isActive ? 'bg-[#E8A000]' : ''
                    : ''
                }`}>
                  <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} color={theme === 'light' && isActive ? 'white' : 'currentColor'} />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? (theme === 'light' ? 'text-[#FFD000]' : 'text-white') : 'text-muted-text'}`}>
                  {t(tab.name)}
                </span>
              </button>
            );
          })}
        </nav>
  
        {/* Overlays */}
        <AnimatePresence>
          {selectedCapture && (
            <DetailView 
              capture={selectedCapture} 
              maps={maps}
              onClose={() => setSelectedCapture(null)} 
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          )}
        </AnimatePresence>
  
        <CreateModal 
          isOpen={isCreateOpen || !!editingCapture} 
          editCapture={editingCapture}
          initialMapId={globalActiveMapId}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingCapture(null);
          }} 
          onSave={handleSaveCapture} 
          onDelete={(id) => {
            handleDelete(id);
            setIsCreateOpen(false);
            setEditingCapture(null);
          }}
        />
        
        {/* Simulated Push Notification Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-4 left-4 right-4 z-[999]"
            >
              <div className="bg-[#141414] border border-white/10 shadow-2xl rounded-2xl p-4 flex gap-4 backdrop-blur-xl items-start">
                <div className="bg-accent text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs shrink-0 mt-1">Z</div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm mb-1">{toast.title}</span>
                  <span className="text-muted-text text-xs leading-snug">{toast.body}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}

