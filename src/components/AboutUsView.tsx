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
            <h1 className="text-xl font-bold">Zapomni · DobroOfficial</h1>
            <h2 className="text-lg text-text-main mt-1">{t('About Us')}</h2>
          </div>
        </div>

        <section className="space-y-3">
          <p className="text-sm text-text-main leading-relaxed mb-4">
            {language === 'Slovenian'
              ? 'DobroOfficial predstavlja aplikacijo Zapomni. Smo ekipa entuziastov, ki želi ustvarjati preproste in uporabne rešitve za vsakodnevno življenje. Naša vizija je zagotoviti varno in zasebno okolje za shranjevanje vaših spominov in zapiskov.'
              : 'DobroOfficial presents the Zapomni app. We are a team of enthusiasts dedicated to creating simple and useful solutions for everyday life. Our vision is to provide a safe and private environment for storing your memories and notes.'}
          </p>
          
          <p className="text-sm text-text-main leading-relaxed mb-4">
            {language === 'Slovenian'
              ? 'Aplikacija Zapomni je bila zasnovana z mislijo na lokalno shranjevanje in popolno zasebnost. Prizadevamo si za transparentnost in odprtokodnost, zato je koda aplikacije dostopna na GitHubu.'
              : 'The Zapomni app was designed with local storage and complete privacy in mind. We strive for transparency and open-source development, which is why the application code is available on GitHub.'}
          </p>

          <p className="text-sm text-text-main leading-relaxed mb-4">
            {language === 'Slovenian'
              ? 'Za vsa vprašanja, predloge ali pomoč smo dosegljivi preko elektronske pošte: DobroOfficial.si@gmail.com.'
              : 'For any questions, suggestions, or help, you can reach us via email: DobroOfficial.si@gmail.com.'}
          </p>
        </section>
      </div>
    </div>
  );
}
