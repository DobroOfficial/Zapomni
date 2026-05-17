import { useState, useEffect } from 'react';
import React from 'react';
import { Map as MapIcon, Plus, Trash2, Folder, ChevronLeft, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { Capture, MapData } from '../types';
import { getAllMaps, addMap, deleteMap, getAllCaptures, deleteCapturesByMapId, unassignCapturesByMapId } from '../services/db';
import NoteCard from './NoteCard';
import PhotoCard from './PhotoCard';
import VoiceCard from './VoiceCard';
import VideoCard from './VideoCard';
import { useLanguage } from '../contexts/LanguageContext';
import { MAP_ICONS, getIconComponent } from '../utils/mapIcons';
import { useLongPress } from '../hooks/useLongPress';
import { useBackHandler } from '../hooks/useBackHandler';

const PRESET_COLORS = [
  '#FFD700', '#FF4500', '#1E90FF', '#32CD32', '#9370DB', '#FF69B4', '#00CED1'
];

interface MapsViewProps {
  onCaptureClick?: (capture: Capture) => void;
  onCaptureEdit?: (capture: Capture) => void;
  onMapViewChange?: (mapId: string | null) => void;
}

function MapCard({ map, index, onClick, onEdit, onDelete }: { 
  key?: string | number,
  map: MapData, 
  index: number,
  onClick: () => void, 
  onEdit: (map: MapData) => void,
  onDelete: (map: MapData, e: React.MouseEvent) => void 
}) {
  const longPressProps = useLongPress({
    onLongPress: () => onEdit(map),
    onClick: onClick
  });

  const IconComponent = getIconComponent(map.iconId);

  return (
    <div 
      {...longPressProps}
      className="bg-card-surface border border-[#222] rounded-[28px] p-5 flex flex-col gap-4 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer hover:border-accent/40 shadow-sm"
    >
      <div 
        className="absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 pointer-events-none transition-opacity group-hover:opacity-30"
        style={{ backgroundColor: map.color }}
      />
      
      <div className="flex justify-between items-start">
        <div 
          className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ backgroundColor: `${map.color}15`, color: map.color }}
        >
          <IconComponent size={20} fill="currentColor" />
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(map, e);
          }}
          className="text-[#333] hover:text-red-500 transition-colors p-1 relative z-10"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div>
        <h3 className="font-bold text-white leading-tight uppercase tracking-tight">{map.name}</h3>
        <p className="text-[10px] text-muted-text font-bold mt-1 uppercase tracking-widest opacity-40">Category</p>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="bg-black/20 px-3 py-1 rounded-full border border-white/5">
          <span className="text-[10px] font-bold text-white/20">#{String(index + 1).padStart(2, '0')}</span>
        </div>
        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: map.color, color: map.color }} />
      </div>
    </div>
  );
}

export default function MapsView({ onCaptureClick, onCaptureEdit, onMapViewChange }: MapsViewProps) {
  const { t } = useLanguage();
  const [maps, setMaps] = useState<MapData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedIconId, setSelectedIconId] = useState('folder');
  const [selectedMap, setSelectedMap] = useState<MapData | null>(null);
  const [mapCaptures, setMapCaptures] = useState<Capture[]>([]);
  const [deletingMap, setDeletingMap] = useState<MapData | null>(null);
  const [deleteStep, setDeleteStep] = useState<number>(0);
  const [cooldown, setCooldown] = useState(0);

  useBackHandler(selectedMap !== null, () => setSelectedMap(null), 'map-view');
  useBackHandler(isAdding || editingMapId !== null, () => {
    setIsAdding(false);
    setEditingMapId(null);
  }, 'map-edit');
  useBackHandler(deletingMap !== null, () => setDeletingMap(null), 'map-delete');

  useEffect(() => {
    let timer: any;
    if (deleteStep === 3) {
      setCooldown(5);
      timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCooldown(0);
    }
    return () => clearInterval(timer);
  }, [deleteStep]);

  useEffect(() => {
    loadMaps();
  }, []);

  useEffect(() => {
    const handleOpenAddMap = () => {
      if (!selectedMap && !isAdding) {
        startAddMap();
      }
    };
    window.addEventListener('open-add-map', handleOpenAddMap);
    return () => window.removeEventListener('open-add-map', handleOpenAddMap);
  }, [selectedMap, isAdding]);

  useEffect(() => {
    if (selectedMap) {
      loadMapCaptures(selectedMap.id);
      onMapViewChange?.(selectedMap.id);
    } else {
      onMapViewChange?.(null);
    }
  }, [selectedMap, onMapViewChange]);

  const loadMaps = async () => {
    const allMaps = await getAllMaps();
    setMaps(allMaps);
  };

  const loadMapCaptures = async (mapId: string) => {
    const allCaptures = await getAllCaptures();
    const filtered = allCaptures.filter(c => c.mapId === mapId);
    setMapCaptures(filtered.sort((a, b) => b.timestamp - a.timestamp));
  };

  const startEditMap = (map: MapData) => {
    setEditingMapId(map.id);
    setNewName(map.name);
    setSelectedColor(map.color);
    setSelectedIconId(map.iconId || 'folder');
    setIsAdding(true);
  };

  const startAddMap = () => {
    setEditingMapId(null);
    setNewName('');
    setSelectedColor(PRESET_COLORS[0]);
    setSelectedIconId('folder');
    setIsAdding(true);
  };

  const handleSaveMap = async () => {
    if (!newName.trim()) return;
    
    let mapToChange: MapData;

    if (editingMapId) {
      const existing = maps.find(m => m.id === editingMapId);
      if (!existing) return;
      mapToChange = {
        ...existing,
        name: newName,
        iconId: selectedIconId,
        color: selectedColor,
        lastUpdated: Date.now()
      };
    } else {
      mapToChange = {
        id: uuidv4(),
        name: newName,
        iconId: selectedIconId,
        color: selectedColor,
        count: 0,
        lastUpdated: Date.now()
      };
    }
    await addMap(mapToChange); // addMap does an upsert via put
    setNewName('');
    setIsAdding(false);
    setEditingMapId(null);
    loadMaps();
  };

  const handleDeleteMap = (map: MapData, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingMap(map);
    setDeleteStep(1);
  };

  const cancelDelete = () => {
    setDeletingMap(null);
    setDeleteStep(0);
  };

  const confirmStep1 = () => {
    // Asked if they want to delete the map. YES -> Step 2
    setDeleteStep(2);
  };

  const confirmStep2 = (deleteAllNotes: boolean) => {
    // Asked if they want to delete all notes.
    if (deleteAllNotes) {
      setDeleteStep(3);
    } else {
      finalizeDeletion(false);
    }
  };

  const finalizeDeletion = async (deleteAllNotes: boolean) => {
    if (!deletingMap) return;
    
    if (deleteAllNotes) {
      await deleteCapturesByMapId(deletingMap.id);
    } else {
      await unassignCapturesByMapId(deletingMap.id);
    }
    
    await deleteMap(deletingMap.id);
    setDeletingMap(null);
    setDeleteStep(0);
    loadMaps();
    if (selectedMap?.id === deletingMap.id) {
      setSelectedMap(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <AnimatePresence mode="wait">
        {!selectedMap ? (
          <motion.div 
            key="maps-list"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center justify-between px-2 pt-2">
              <div>
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">{t('Categories')}</h2>
                <p className="text-xs text-muted-text uppercase tracking-widest font-bold mt-1">{t('Organize your reminders')}</p>
              </div>
              <button 
                onClick={startAddMap}
                className="w-10 h-10 rounded-full bg-accent text-black flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-accent/20"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>

            {maps.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 bg-[#141414] border border-[#222] border-dashed rounded-[32px]">
                <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center mb-6">
                  <MapIcon className="text-muted-text" size={32} />
                </div>
                <h2 className="text-lg font-bold text-white">No Categories Yet</h2>
                <p className="text-muted-text text-sm mt-2 leading-relaxed uppercase tracking-tight font-bold">{t('Organize your notes by creating your first category.')}</p>
                <button 
                  onClick={startAddMap}
                  className="mt-6 text-accent text-xs font-bold uppercase tracking-widest flex items-center gap-2 border-b border-accent pb-1"
                >
                  Add Category <Plus size={14} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {maps.map((map, index) => (
                  <MapCard 
                    key={map.id}
                    map={map}
                    index={index}
                    onClick={() => setSelectedMap(map)}
                    onEdit={startEditMap}
                    onDelete={handleDeleteMap}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="map-detail"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-4 pt-2">
              <button 
                onClick={() => setSelectedMap(null)}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-text active:scale-90 transition-transform"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  <div className="w-6 h-6 rounded flex items-center justify-center mr-1" style={{ backgroundColor: `${selectedMap.color}20`, color: selectedMap.color }}>
                    {React.createElement(getIconComponent(selectedMap.iconId), { size: 14 })}
                  </div>
                  {selectedMap.name}
                </h2>
                <p className="text-[9px] text-accent font-bold uppercase tracking-[0.2em] mt-0.5">Viewing category</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {mapCaptures.length > 0 ? (
                mapCaptures.map(capture => {
                  const date = new Date(capture.timestamp);
                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
                  
                  if (capture.type === 'note') {
                    return (
                      <NoteCard 
                        key={capture.id}
                        title={capture.title}
                        preview={capture.content}
                        timestamp={timeStr}
                        mapName={selectedMap.name}
                        onClick={() => {
                          onCaptureClick?.(capture);
                        }}
                        onEdit={() => onCaptureEdit?.(capture)}
                      />
                    );
                  }
                  if (capture.type === 'photo') {
                    return (
                      <PhotoCard 
                        key={capture.id}
                        imageSrc={capture.content}
                        title={capture.title}
                        caption={capture.description || "Photo"}
                        timestamp={timeStr}
                        mapName={selectedMap.name}
                        hasVoice={!!capture.audioContent}
                        onClick={() => {
                          onCaptureClick?.(capture);
                        }}
                        onEdit={() => onCaptureEdit?.(capture)}
                      />
                    );
                  }
                  if (capture.type === 'video') {
                    return (
                      <VideoCard 
                        key={capture.id}
                        videoSrc={capture.content}
                        title={capture.title}
                        caption={capture.description || "Video"}
                        timestamp={timeStr}
                        mapName={selectedMap.name}
                        onClick={() => {
                          onCaptureClick?.(capture);
                        }}
                        onEdit={() => onCaptureEdit?.(capture)}
                      />
                    );
                  }
                  if (capture.type === 'voice') {
                    return (
                      <VoiceCard 
                        key={capture.id}
                        title={capture.title}
                        duration="Voice Memo"
                        timestamp={timeStr}
                        mapName={selectedMap.name}
                        audioContent={capture.audioContent}
                        onClick={() => {
                          onCaptureClick?.(capture);
                        }}
                        onEdit={() => onCaptureEdit?.(capture)}
                      />
                    );
                  }
                  return null;
                })
              ) : (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#141414] border border-[#222] flex items-center justify-center text-muted-text/20">
                      <Folder size={32} />
                  </div>
                  <div>
                      <p className="text-[10px] text-muted-text/40 uppercase font-bold tracking-tight mt-1 leading-relaxed">No reminders in this category yet.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deletion Overlay */}
      <AnimatePresence>
        {deleteStep > 0 && deletingMap && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card-surface border border-red-500/30 rounded-[32px] p-8 w-full max-w-sm flex flex-col items-center text-center gap-6 shadow-[0_0_50px_rgba(239,68,68,0.15)]"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                <Trash2 size={40} />
              </div>

              {deleteStep === 1 && (
                <>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-bold text-white">{t('Delete Category?')}</h3>
                    <p className="text-muted-text text-sm leading-relaxed">
                      {t('You are about to delete the category')} <span className="text-white font-bold">"{deletingMap.name}"</span>. 
                    </p>
                  </div>
                  <div className="flex flex-col w-full gap-3 mt-2">
                    <button 
                      onClick={confirmStep1}
                      className="w-full bg-red-500 text-white font-bold py-4 rounded-[18px] active:scale-95 transition-transform"
                    >
                      {t('Yes, Delete Category')}
                    </button>
                    <button 
                      onClick={cancelDelete}
                      className="w-full bg-white/5 text-muted-text font-bold py-4 rounded-[18px] active:scale-95 transition-transform border border-white/5"
                    >
                      {t('No, Keep It')}
                    </button>
                  </div>
                </>
              )}

              {deleteStep === 2 && (
                <>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">{t('Delete contents?')}</h3>
                    <p className="text-muted-text text-sm leading-relaxed">
                      {t('Do you also want to delete all')} <span className="text-white font-bold">{t('Notes, Photos, and Videos')}</span> {t('inside this category?')}
                    </p>
                  </div>
                  <div className="flex flex-col w-full gap-3 mt-2">
                    <button 
                      onClick={() => confirmStep2(true)}
                      className="w-full bg-red-500 text-white font-bold py-4 rounded-[18px] active:scale-95 transition-transform flex flex-col items-center"
                    >
                      <span>{t('Yes, Delete Everything')}</span>
                      <span className="text-[10px] opacity-70">{t('Cannot be undone')}</span>
                    </button>
                    <button 
                      onClick={() => confirmStep2(false)}
                      className="w-full bg-accent text-black font-bold py-4 rounded-[18px] active:scale-95 transition-transform flex flex-col items-center"
                    >
                      <span>{t('No, Move to Unassigned')}</span>
                      <span className="text-[10px] opacity-70">{t('Keep my notes')}</span>
                    </button>
                    <button 
                      onClick={cancelDelete}
                      className="w-full bg-transparent text-muted-text font-bold py-2 active:scale-95 transition-transform text-xs"
                    >
                      {t('Cancel')}
                    </button>
                  </div>
                </>
              )}

              {deleteStep === 3 && (
                <>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-2xl font-bold text-white">{t('ARE YOU SURE?')}</h3>
                    <p className="text-red-400 text-xs font-bold leading-relaxed px-4">
                      {t('ALL NOTES, PHOTOS, AND VIDEOS WILL BE PERMANENTLY DELETED. THIS CANNOT BE UNDONE.')}
                    </p>
                  </div>
                  <div className="flex flex-col w-full gap-3 mt-4">
                    <button 
                      disabled={cooldown > 0}
                      onClick={() => finalizeDeletion(true)}
                      className={`w-full font-black py-5 rounded-[20px] active:scale-95 transition-all text-lg shadow-xl ${cooldown > 0 ? 'bg-red-900/50 text-white/30 cursor-not-allowed border border-white/5' : 'bg-red-600 text-white shadow-red-600/20 hover:bg-red-500'}`}
                    >
                      {cooldown > 0 ? `WAIT ${cooldown}s...` : t('CONFIRM DELETE ALL')}
                    </button>
                    <button 
                      onClick={() => setDeleteStep(2)}
                      className="w-full bg-white/10 text-white font-bold py-4 rounded-[18px] active:scale-95 transition-transform"
                    >
                      {t('Wait, Go Back')}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-nav-bg border border-[#222] rounded-t-[24px] sm:rounded-[24px] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-accent uppercase tracking-wider">{editingMapId ? 'Edit Category' : 'New Category'}</h3>
                  <button onClick={() => { setIsAdding(false); setEditingMapId(null); }} className="text-muted-text hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest px-1">Name</span>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="e.g. Personal, Work, Grocery"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-black/40 border border-[#222] rounded-[14px] p-4 text-white focus:outline-none focus:border-accent text-sm font-bold placeholder:text-muted-text/20"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Icon</span>
                  </div>
                  <div className="grid grid-cols-8 gap-2">
                    {Object.keys(MAP_ICONS).map(iconId => {
                      const IconDef = MAP_ICONS[iconId];
                      const isSelected = selectedIconId === iconId;
                      return (
                        <button
                          key={iconId}
                          onClick={() => setSelectedIconId(iconId)}
                          className={`aspect-square flex items-center justify-center rounded-[10px] border transition-all ${isSelected ? 'border-accent bg-accent/20 text-accent' : 'border-[#222] bg-black/40 text-muted-text hover:border-white/20'}`}
                        >
                          <IconDef size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Theme Color</span>
                    <div className="w-4 h-4 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: selectedColor, color: selectedColor }} />
                  </div>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_COLORS.map(color => (
                       <button
                         key={color}
                         onClick={() => setSelectedColor(color)}
                         className={`aspect-square rounded-full transition-all ${selectedColor === color ? 'scale-110 border-2 border-white ring-2 ring-accent shadow-lg' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
                         style={{ backgroundColor: color }}
                       />
                    ))}
                    <div className="relative aspect-square">
                      <input 
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div 
                        className={`w-full h-full rounded-full border-2 border-dashed flex items-center justify-center text-[10px] ${!PRESET_COLORS.includes(selectedColor) ? 'border-accent text-accent ring-2 ring-accent/20 scale-110' : 'border-muted-text/30 text-muted-text/40'}`}
                        style={{ backgroundColor: !PRESET_COLORS.includes(selectedColor) ? selectedColor : 'transparent' }}
                      >
                         {!PRESET_COLORS.includes(selectedColor) ? '' : '+'}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveMap}
                  className="w-full bg-accent text-black font-extrabold py-4 rounded-[16px] text-xs uppercase tracking-widest active:scale-95 transition-transform mt-2 shadow-lg shadow-accent/10"
                >
                  {editingMapId ? 'Save Category' : 'Create Category'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
