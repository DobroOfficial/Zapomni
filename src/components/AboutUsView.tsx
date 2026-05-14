import { ArrowLeft, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useEffect } from 'react';

interface AboutUsViewProps {
  onBack: () => void;
  theme: string;
}

export default function AboutUsView({ onBack, theme }: AboutUsViewProps) {
  const { t, language } = useLanguage();

  useEffect(() => {
    const main = document.querySelector('main');
    if (main) {
      main.scrollTop = 0;
    }
  }, []);

  return (
    <div className={`flex-1 flex flex-col min-h-0 bg-transparent custom-scrollbar ${theme === 'light' ? 'text-text-main' : 'text-white'}`}>
      {/* Header */}
      <div className="h-[60px] flex items-center px-4 shrink-0 border-b border-white/5 relative z-10 bg-transparent">
        <button 
          onClick={onBack}
          className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform ${theme === 'light' ? 'text-text-main hover:bg-black/5' : 'text-white hover:bg-white/5'}`}
        >
          <ArrowLeft size={24} />
        </button>
        <span className={`font-bold ml-2 ${theme === 'light' ? 'text-text-main' : 'text-white'}`}>{t('About Us')}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 select-text">
        <div className="text-center space-y-4 pb-6 border-b border-white/5">
          <div className="w-16 h-16 mx-auto bg-accent/20 rounded-full flex items-center justify-center text-accent">
            <Info size={32} />
          </div>
          <div>
            <h1 className="text-xl font-bold">DobroOfficial</h1>
            <h2 className="text-lg text-text-main mt-1">{t('About Us')}</h2>
          </div>
        </div>

        <p className="text-sm leading-relaxed font-medium">
          {language === 'Slovenian'
            ? 'DobroOfficial je enoosebni hobi projekt. Dobro pomeni dobro v slovenščini - in to je cilj. Preproste, uporabne aplikacije za vsakdanje življenje, zgrajene v prostem času.'
            : 'DobroOfficial is a one-person hobby project. Dobro means good in Slovenian - and that\'s the goal. Simple, useful apps for everyday life, built in free time.'}
        </p>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">1. {language === 'Slovenian' ? 'Kdo stoji za tem' : 'Who\'s Behind This'}</h3>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Samo jaz - ena oseba, ki gradi aplikacije v svojem prostem času. Nisem profesionalni razvijalec, si pa želim ustvarjati orodja, ki ljudem resnično pomagajo in jim polepšajo vsakdan. S pomočjo umetne inteligence lahko končno uresničim te ideje.'
              : 'Just me - one person building apps in my spare time. I\'m not a professional developer, but I\'ve always wanted to build tools that genuinely help people and make their daily lives a little easier. With the help of AI, I can finally bring these ideas to life.'}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">2. {language === 'Slovenian' ? 'Obljuba' : 'The Promise'}</h3>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Brezplačno. Brez povezave. Zasebno.'
              : 'Free. Offline. Private.'}
          </p>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Vsaka aplikacija je popolnoma brezplačna, deluje brez interneta in nikoli ne zbira vaših podatkov. Brez strežnikov, brez oglasov, brez sledenja. Vaši podatki ostanejo v vaši napravi - vedno.'
              : 'Every app is completely free, works without internet, and never collects your data. No servers, no ads, no tracking. Your data stays on your device - always.'}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">3. {language === 'Slovenian' ? 'Aplikacije' : 'Apps'}</h3>
          <p className="text-sm text-text-main leading-relaxed">
            <span className={`font-medium ${theme === 'light' ? 'text-black' : 'text-white'}`}>Zapomni</span><br/>
            {language === 'Slovenian'
              ? 'Brezplačna aplikacija za zapiske brez povezave. Zapiski, opomniki, glasovni beležki, fotografije in videoposnetki - vse shranjeno zasebno v vaši napravi.'
              : 'A free offline notes app. Notes, reminders, voice memos, photos and videos - all stored privately on your device.'}
          </p>
          <p className="text-sm text-text-main leading-relaxed mt-2">
            <span className={`font-medium ${theme === 'light' ? 'text-black' : 'text-white'}`}>Navada - {language === 'Slovenian' ? 'kmalu na voljo' : 'coming soon'}</span><br/>
            {language === 'Slovenian'
              ? 'V razvoju.'
              : 'In development.'}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">4. {language === 'Slovenian' ? 'Podpora' : 'Support'}</h3>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Vse aplikacije so brezplačne in bodo takšne tudi ostale. Če želite podpreti ta majhen hobi projekt, kava pomeni veliko'
              : 'All apps are free and will stay that way. If you\'d like to support this little hobby project, a coffee means a lot'}
          </p>
        </section>

        <div className="pt-8 pb-12 text-center border-t border-white/5 space-y-2">
          <p className="text-xs font-bold">© 2026 DobroOfficial · Zapomni</p>
          <p className="text-xs text-text-main">
            {language === 'Slovenian' ? 'Vsi podatki so shranjeni lokalno v vaši napravi' : 'All data stored locally on your device'}
          </p>
        </div>
      </div>
    </div>
  );
}
