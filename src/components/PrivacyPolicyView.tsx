import { ArrowLeft, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useEffect, useRef } from 'react';

interface PrivacyPolicyViewProps {
  onBack: () => void;
  theme: string;
}

export default function PrivacyPolicyView({ onBack, theme }: PrivacyPolicyViewProps) {
  const { t, language } = useLanguage();

  useEffect(() => {
    const main = document.querySelector('main');
    if (main) {
      main.scrollTop = 0;
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-text-main custom-scrollbar">
      {/* Header */}
      <div className="h-[60px] flex items-center px-4 shrink-0 border-b border-white/5 relative z-10 bg-background">
        <button 
          onClick={onBack}
          className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform ${theme === 'light' ? 'text-text-main' : 'text-white'}`}
        >
          <ArrowLeft size={24} />
        </button>
        <span className="font-bold ml-2">{t('Privacy Policy')}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 select-text">
        <div className="text-center space-y-4 pb-6 border-b border-white/5">
          <div className="w-16 h-16 mx-auto bg-accent/20 rounded-full flex items-center justify-center text-accent">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Zapomni · DobroOfficial</h1>
            <h2 className="text-lg text-text-main mt-1">{t('Privacy Policy')}</h2>
          </div>
          <p className="text-xs text-text-main">
            {language === 'Slovenian' 
              ? 'Datum uveljavitve: 6. maj 2026 · Zadnja posodobitev: 6. maj 2026'
              : 'Effective date: May 6, 2026 · Last updated: May 6, 2026'}
          </p>
        </div>

        <p className="text-sm leading-relaxed font-medium">
          {language === 'Slovenian'
            ? 'Zapomni temelji na preprosti obljubi: vse, kar shranite, ostane v vaši napravi. Nikoli ne vidimo, ne zbiramo in ne shranjujemo nikjer drugje.'
            : 'Zapomni is built on a simple promise: everything you save stays on your device. We never see it, collect it, or store it anywhere else.'}
        </p>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">
            {language === 'Slovenian' ? '1. Kdo smo' : '1. Who We Are'}
          </h3>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Zapomni razvija in vzdržuje DobroOfficial (v nadaljevanju "mi" ali "naš"). To aplikacijo smo izdelali, da bi ljudem pomagali pomniti stvari — nič več.'
              : 'Zapomni is developed and maintained by DobroOfficial (referred to as "we", "us", or "our"). We built this app to help people remember things — nothing more.'}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">
            {language === 'Slovenian' ? '2. Podatki, ki jih NE zbiramo' : '2. Data We Do NOT Collect'}
          </h3>
          <h4 className="font-semibold text-sm">
            {language === 'Slovenian' ? '100% lokalna shramba' : '100% Local Storage'}
          </h4>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Ne zbiramo, prenašamo ali shranjujemo naslednjega:'
              : 'We do not collect, transmit, or store any of the following:'}
          </p>
          <ul className="list-disc list-inside text-sm text-text-main space-y-1 ml-2">
            <li>{language === 'Slovenian' ? 'Beležk ali besedila, ki ga napišete' : 'Notes or text you write'}</li>
            <li>{language === 'Slovenian' ? 'Fotografij ali videoposnetkov, ki jih posnamete ali priložite' : 'Photos or videos you take or attach'}</li>
            <li>{language === 'Slovenian' ? 'Glasovnih posnetkov, ki jih posnamete' : 'Voice memos you record'}</li>
            <li>{language === 'Slovenian' ? 'Koledarskih dogodkov ali opozoril, ki jih nastavite' : 'Calendar events or reminders you set'}</li>
            <li>{language === 'Slovenian' ? 'Vašega imena, e-pošte ali kakršnih koli osebnih identifikatorjev' : 'Your name, email, or any personal identifiers'}</li>
            <li>{language === 'Slovenian' ? 'Vaše lokacije' : 'Your location'}</li>
            <li>{language === 'Slovenian' ? 'Podatkov o uporabi ali analitike' : 'Usage data or analytics'}</li>
          </ul>
          <p className="text-sm text-text-main leading-relaxed mt-3 font-medium text-white">
            {language === 'Slovenian'
              ? 'Vsa vsebina, ki jo ustvarite v Zapomni, je shranjena izključno lokalno v vaši napravi in je nikoli ne zapusti.'
              : 'All content you create in Zapomni is stored locally on your device only and never leaves it.'}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">
            {language === 'Slovenian' ? '3. Dovoljenja, ki jih zahtevamo' : '3. Permissions We Request'}
          </h3>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Zapomni lahko zahteva naslednja dovoljenja naprave. Ta se uporabljajo samo za delovanje funkcij znotraj aplikacije — nobeni podatki se ne pošiljajo nam:'
              : 'Zapomni may request the following device permissions. These are used only to power features inside the app — no data is sent to us:'}
          </p>
          <ul className="space-y-2 text-sm text-text-main ml-2">
            <li><strong>{language === 'Slovenian' ? 'Kamera' : 'Camera'}</strong> — {language === 'Slovenian' ? 'za dodajanje fotografij k vašim beležkam' : 'to let you attach photos to your notes'}</li>
            <li><strong>{language === 'Slovenian' ? 'Mikrofon' : 'Microphone'}</strong> — {language === 'Slovenian' ? 'za snemanje glasovnih opomnikov' : 'to let you record voice memos'}</li>
            <li><strong>{language === 'Slovenian' ? 'Shramba' : 'Storage'}</strong> — {language === 'Slovenian' ? 'za lokalno shranjevanje in nalaganje vaših beležk in medijev' : 'to save and load your notes and media locally'}</li>
            <li><strong>{language === 'Slovenian' ? 'Obvestila' : 'Notifications'}</strong> — {language === 'Slovenian' ? 'za dostavo vaših koledarskih opomnikov' : 'to deliver your calendar reminders'}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">
            {language === 'Slovenian' ? '4. Brez storitev tretjih oseb' : '4. No Third-Party Services'}
          </h3>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Zapomni ne vključuje nobenih analitik tretjih oseb, oglaševalskih omrežij, orodij za poročanje o napakah ali storitev v oblaku. Ni nobenih sledilnikov kakršne koli vrste.'
              : 'Zapomni does not integrate any third-party analytics, advertising networks, crash reporting tools, or cloud storage services. There are no trackers of any kind.'}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">
            {language === 'Slovenian' ? '5. Internetna povezava ni potrebna' : '5. No Internet Connection Required'}
          </h3>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Zapomni deluje popolnoma brez povezave. Aplikacija ne izvaja nobenih omrežnih zahtevkov. Vaši podatki nikoli ne pridejo v stik z internetom.'
              : 'Zapomni works entirely offline. The app does not make any network requests. Your data never touches the internet.'}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">
            {language === 'Slovenian' ? '6. Zasebnost otrok' : '6. Children\'s Privacy'}
          </h3>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Zapomni ne zbira nobenih podatkov od nikogar, vključno z otroki, mlajšimi od 13 let. Aplikacija je varna za vse starosti.'
              : 'Zapomni does not collect any data from anyone, including children under the age of 13. The app is safe for all ages.'}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">
            {language === 'Slovenian' ? '7. Izbris podatkov' : '7. Data Deletion'}
          </h3>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Ker so vsi podatki shranjeni lokalno v vaši napravi, imate popoln nadzor. Svoje podatke lahko kadar koli izbrišete tako, da počistite shrambo aplikacije v nastavitvah naprave ali odstranite aplikacijo.'
              : 'Since all data is stored locally on your device, you are in full control. You can delete your data at any time by clearing the app\'s storage in your device settings, or by uninstalling the app.'}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">
            {language === 'Slovenian' ? '8. Spremembe tega pravilnika' : '8. Changes to This Policy'}
          </h3>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Če kdaj posodobimo ta pravilnik o zasebnosti, bomo posodobili datum "Zadnja posodobitev" na vrhu te strani. Priporočamo, da ga redno pregledujete.'
              : 'If we ever update this privacy policy, we will update the "Last updated" date at the top of this page. We encourage you to review it periodically.'}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-accent">
            {language === 'Slovenian' ? '9. Kontakt' : '9. Contact'}
          </h3>
          <p className="text-sm text-text-main leading-relaxed">
            {language === 'Slovenian'
              ? 'Če imate kakršna koli vprašanja o tem pravilniku o zasebnosti, nas lahko kontaktirate:'
              : 'If you have any questions about this privacy policy, you can reach us at:'}
            <br /><br />
            <strong>DobroOfficial</strong><br />
            {language === 'Slovenian'
              ? 'Prosimo, kontaktirajte nas prek strani naše aplikacije v trgovini.'
              : 'Please contact us through our app\'s store listing page.'}
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
