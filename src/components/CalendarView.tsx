import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Capture, MapData } from '../types';
import { getAllCaptures, getAllMaps } from '../services/db';
import NoteCard from './NoteCard';
import PhotoCard from './PhotoCard';
import VoiceCard from './VoiceCard';
import VideoCard from './VideoCard';
import { useLanguage } from '../contexts/LanguageContext';

interface CalendarViewProps {
  onCaptureClick: (capture: Capture) => void;
  onCaptureEdit: (capture: Capture) => void;
  onDateChange?: (dateStr: string) => void;
}

export default function CalendarView({ onCaptureClick, onCaptureEdit, onDateChange }: CalendarViewProps) {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [maps, setMaps] = useState<MapData[]>([]);
  const [filteredCaptures, setFilteredCaptures] = useState<Capture[]>([]);
  const [reminderCaptures, setReminderCaptures] = useState<Capture[]>([]);

  useEffect(() => {
    loadData();
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(selectedDate.getDate()).padStart(2, '0');
    onDateChange?.(`${year}-${month}-${dayStr}`);
  }, []);

  useEffect(() => {
    filterCapturesByDate(selectedDate);
  }, [captures, selectedDate]);

  const loadData = async () => {
    const [allCaptures, allMaps] = await Promise.all([
      getAllCaptures(),
      getAllMaps()
    ]);
    setCaptures(allCaptures);
    setMaps(allMaps);
  };

  const filterCapturesByDate = (date: Date) => {
    const dayFiltered = captures.filter(c => {
      const cDate = new Date(c.timestamp);
      return cDate.getDate() === date.getDate() &&
             cDate.getMonth() === date.getMonth() &&
             cDate.getFullYear() === date.getFullYear();
    });

    const reminderFiltered = captures.filter(c => {
      if (!c.reminderDate) return false;
      const rDate = new Date(c.reminderDate);
      return rDate.getDate() === date.getDate() &&
             rDate.getMonth() === date.getMonth() &&
             rDate.getFullYear() === date.getFullYear();
    });

    setFilteredCaptures(dayFiltered.sort((a, b) => b.timestamp - a.timestamp));
    setReminderCaptures(reminderFiltered);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return (day + 6) % 7;
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getMapName = (id: string) => {
    const map = maps.find(m => m.id === id);
    return map ? map.name : 'Personal';
  };

  const hasActivity = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return captures.some(c => {
      const cDate = new Date(c.timestamp);
      return cDate.getDate() === d.getDate() &&
             cDate.getMonth() === d.getMonth() &&
             cDate.getFullYear() === d.getFullYear();
    });
  };

  const hasReminder = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return captures.some(c => {
      if (!c.reminderDate) return false;
      const rDate = new Date(c.reminderDate);
      return rDate.getDate() === d.getDate() &&
             rDate.getMonth() === d.getMonth() &&
             rDate.getFullYear() === d.getFullYear();
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() &&
           currentDate.getMonth() === selectedDate.getMonth() &&
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Calendar Header */}
      <div className="bg-[#141414] border border-[#222] rounded-[24px] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-accent/10 rounded-xl text-accent">
                <CalendarIcon size={18} />
             </div>
             <h2 className="font-sans font-bold text-lg text-white uppercase tracking-tight">
               {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
             </h2>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-text">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-text">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-4">
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-muted-text/50 uppercase tracking-widest py-2">
              {t(day)}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-2">
          {emptyDays.map(i => (
            <div key={`empty-${i}`} className=" h-10" />
          ))}
          {days.map(day => (
            <button 
              key={day}
              onClick={() => {
                const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                setSelectedDate(newDate);
                const year = newDate.getFullYear();
                const month = String(newDate.getMonth() + 1).padStart(2, '0');
                const dayStr = String(newDate.getDate()).padStart(2, '0');
                onDateChange?.(`${year}-${month}-${dayStr}`);
              }}
              className={`h-12 relative flex items-center justify-center text-xs font-bold transition-all active:scale-90
                ${isSelected(day) ? 'text-black z-10' : (isToday(day) ? 'text-accent' : 'text-white')}
              `}
            >
              {isSelected(day) && (
                <motion.div 
                   layoutId="activeDay"
                   className="absolute inset-2 bg-accent rounded-xl shadow-[0_0_15px_rgba(255,208,0,0.4)]"
                />
              )}
              <span className="relative z-20">{day}</span>
              {hasActivity(day) && !isSelected(day) && (
                <div className="absolute bottom-2 w-1 h-1 bg-accent/40 rounded-full" />
              )}
              {hasReminder(day) && !isSelected(day) && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-accent shadow-[0_0_8px_rgba(255,208,0,0.8)] rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Date Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] flex items-center gap-2">
           <Clock size={12} className="text-accent" />
           {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </h3>
        <span className="text-[10px] font-bold text-accent/50 uppercase tracking-widest">{filteredCaptures.length} Notes</span>
      </div>

      {/* Results List */}
      <div className="flex flex-col gap-4">
        {/* Reminders for today section */}
        {reminderCaptures.length > 0 && (
          <div className="flex flex-col gap-3 mb-2">
            <div className="flex items-center gap-2 px-2 text-[10px] font-bold text-accent uppercase tracking-widest">
              <Bell size={12} fill="currentColor" />
              {t('Active Reminders')}
            </div>
            {reminderCaptures.map(capture => (
              <div 
                key={`reminder-${capture.id}`}
                onClick={() => onCaptureClick(capture)}
                className="bg-accent/10 border border-accent/30 rounded-[18px] p-4 flex items-center gap-4 cursor-pointer hover:bg-accent/20 transition-all border-l-4 border-l-accent"
              >
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                   <Bell size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-bold truncate">{capture.title}</h4>
                  <p className="text-[10px] text-accent/60 font-mono mt-0.5 uppercase tracking-wider">Scheduled Reminder</p>
                </div>
              </div>
            ))}
            {filteredCaptures.length > 0 && <div className="h-px bg-white/5 mx-2 my-2" />}
          </div>
        )}

        {filteredCaptures.length > 0 ? (
          filteredCaptures.map(capture => {
            const date = new Date(capture.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            if (capture.type === 'note') {
              return (
                <NoteCard 
                  key={capture.id}
                  title={capture.title}
                  preview={capture.content}
                  timestamp={timeStr}
                  mapName={getMapName(capture.mapId)}
                  onClick={() => onCaptureClick(capture)}
                  onEdit={() => onCaptureEdit(capture)}
                />
              );
            }
            if (capture.type === 'photo') {
              return (
                <PhotoCard 
                  key={capture.id}
                  imageSrc={capture.content}
                  title={capture.title}
                  caption={capture.description || "Photo Capture"}
                  timestamp={timeStr}
                  mapName={getMapName(capture.mapId)}
                  onClick={() => onCaptureClick(capture)}
                  onEdit={() => onCaptureEdit(capture)}
                />
              );
            }
            if (capture.type === 'video') {
              return (
                <VideoCard 
                  key={capture.id}
                  videoSrc={capture.content}
                  title={capture.title}
                  caption={capture.description || "Video Capture"}
                  timestamp={timeStr}
                  mapName={getMapName(capture.mapId)}
                  onClick={() => onCaptureClick(capture)}
                  onEdit={() => onCaptureEdit(capture)}
                />
              );
            }
            if (capture.type === 'voice') {
              return (
                <VoiceCard 
                  key={capture.id}
                  title={capture.title}
                  duration={capture.description || "0:00"}
                  timestamp={timeStr}
                  mapName={getMapName(capture.mapId)}
                  onClick={() => onCaptureClick(capture)}
                  onEdit={() => onCaptureEdit(capture)}
                />
              );
            }
            return null;
          })
        ) : (
          reminderCaptures.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#141414] border border-[#222] flex items-center justify-center text-muted-text/20">
                  <CalendarIcon size={32} />
              </div>
              <div>
                  <h4 className="text-white text-sm font-bold uppercase tracking-widest opacity-30">No Reminders</h4>
                  <p className="text-[10px] text-muted-text/40 uppercase font-bold tracking-tight mt-1">Nothing scheduled for this day</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
