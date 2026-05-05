import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSettingsView({ 
  onBack,
  theme
}: { 
  onBack: () => void;
  theme: string;
}) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="p-6 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="text-sm font-bold text-accent uppercase tracking-widest mb-4">
        ← {t('Back to Settings')}
      </button>
      <h2 className={`text-xl font-bold uppercase tracking-tight ${theme === 'light' ? 'text-text-main' : 'text-white'}`}>{t('Language Settings')}</h2>
      
      <div className="bg-card-surface border border-[#222] rounded-[24px] p-6 flex flex-col gap-4">
        <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest px-1">{t('Language')}</label>
        <button 
          onClick={() => setLanguage('English')}
          className={`w-full text-left py-4 px-4 rounded-[16px] border ${language === 'English' ? 'bg-accent/20 border-accent' : 'bg-black/20 border-white/5'} text-white hover:bg-black/40 transition-colors flex items-center justify-between`}
        >
          {t('English')}
          {language === 'English' && <span className="text-accent underline">{t('selected')}</span>}
        </button>
        <button 
          onClick={() => setLanguage('Slovenian')}
          className={`w-full text-left py-4 px-4 rounded-[16px] border ${language === 'Slovenian' ? 'bg-accent/20 border-accent' : 'bg-black/20 border-white/5'} text-white hover:bg-black/40 transition-colors flex items-center justify-between`}
        >
          {t('Slovenian')}
          {language === 'Slovenian' && <span className="text-accent underline">{t('selected')}</span>}
        </button>
      </div>
    </div>
  );
}
