import { useState, useRef, useCallback } from 'react';
import { Award, GraduationCap, Clock, MapPin, Video, ChevronDown, ChevronUp, Quote, Mail, Send, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { useLang } from './i18n/I18nContext';
import { translations, type Lang } from './i18n/translations';
import { supabase } from './lib/supabase';

function LangSwitcher() {
  const { lang, setLang } = useLang();
  const opts: { key: Lang; code: string; label: string }[] = [
    { key: 'en', code: 'EN', label: 'English' },
    { key: 'ja', code: 'JP', label: '日本語' },
    { key: 'ko', code: 'KO', label: '한국어' },
  ];
  return (
    <div className="flex items-center gap-1 bg-teal-800/80 rounded-full px-2 py-1 shadow-md border border-teal-600">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => setLang(o.key)}
          className={`px-3 py-1 rounded-full text-sm font-bold transition-all leading-none ${
            lang === o.key
              ? 'bg-white text-teal-700 shadow'
              : 'text-white hover:bg-white/10'
          }`}
        >
          <span className="block text-[13px] leading-tight">{o.code}</span>
          <span className="block text-[10px] leading-tight font-normal opacity-80">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function FloatingCta({ onClick }: { onClick: () => void }) {
  const { lang } = useLang();
  const t = translations[lang];
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-xl transition-all hover:scale-105 flex items-center gap-2"
    >
      <Send className="w-4 h-4" />
      {t.floatingCta}
    </button>
  );
}

function useCopyEmail() {
  const { lang } = useLang();
  const t = translations[lang];
  const [copied, setCopied] = useState(false);
  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('easymaths.au@gmail.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.location.href = 'mailto:easymaths.au@gmail.com';
    }
  }, []);
  return { copyEmail, copied, label: t.emailCopied };
}

function EnquiryForm() {
  const { lang } = useLang();
  const t = translations[lang];
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { copyEmail, copied } = useCopyEmail();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus('idle');

    const formData = new FormData(e.currentTarget);
    const data = {
      parent_name: String(formData.get('parent_name') || ''),
      student_year: String(formData.get('student_year') || ''),
      subject: String(formData.get('subject') || ''),
      lesson_format: String(formData.get('lesson_format') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || '') || null,
      message: String(formData.get('message') || '') || null,
    };

    const { data: inserted, error } = await supabase.from('enquiries').insert(data).select('id').single();

    if (error) {
      setSubmitting(false);
      setStatus('error');
      return;
    }

    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-enquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ enquiry_id: inserted.id }),
      });
    } catch {
      // email send failed silently — enquiry is still saved in database
    }

    setSubmitting(false);
    setStatus('success');
    (e.target as HTMLFormElement).reset();
  };

  const inputClass = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';

  return (
    <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
      <h3 className="text-2xl font-bold text-teal-900 mb-2">{t.formTitle}</h3>
      <p className="text-gray-600 mb-6">{t.formSubtitle}</p>

      {status === 'success' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <p className="text-sm text-green-800 font-medium">{t.formSuccess}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-800 font-medium">{t.formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.formParentName}</label>
            <input name="parent_name" type="text" required placeholder={t.formParentNamePlaceholder} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.formStudentYear}</label>
            <input name="student_year" type="text" required placeholder={t.formStudentYearPlaceholder} className={inputClass} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.formSubject}</label>
            <select name="subject" required className={inputClass}>
              <option value="Mathematics">{t.formSubjectMath}</option>
              <option value="English">{t.formSubjectEnglish}</option>
              <option value="Assignment Help">{t.formSubjectHelp}</option>
              <option value="All-Round Help">{t.formSubjectAll}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.formFormat}</label>
            <select name="lesson_format" required className={inputClass}>
              <option value="In-person">{t.formFormatInPerson}</option>
              <option value="Online">{t.formFormatOnline}</option>
              <option value="Not sure">{t.formFormatNotSure}</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.formEmail}</label>
            <input name="email" type="email" required placeholder={t.formEmailPlaceholder} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.formPhone}</label>
            <input name="phone" type="tel" placeholder={t.formPhonePlaceholder} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.formMessage}</label>
          <textarea name="message" rows={3} placeholder={t.formMessagePlaceholder} className={inputClass} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? t.formSubmitting : (
            <>
              <Send className="w-4 h-4" />
              {t.formSubmit}
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        {t.formOrEmail}
        <button onClick={copyEmail} className="text-teal-700 font-medium hover:underline inline-flex items-center gap-1">
          {copied ? <><CheckCircle className="w-3.5 h-3.5" /> {t.emailCopied}</> : <><Copy className="w-3.5 h-3.5" /> {t.contactEmail}</>}
        </button>
      </p>
    </div>
  );
}

function App() {
  const { lang } = useLang();
  const t = translations[lang];
  const [mobileNav, setMobileNav] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { copyEmail, copied } = useCopyEmail();

  const scrollTo = (id: string) => {
    setMobileNav(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <nav className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="#" className="text-xl font-bold text-teal-700 tracking-tight" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              {t.brand}
            </a>
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about'); }} className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">{t.navAbout}</a>
              <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollTo('pricing'); }} className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">{t.navPricing}</a>
              <a href="#subjects" onClick={(e) => { e.preventDefault(); scrollTo('subjects'); }} className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">{t.navSubjects}</a>
              <a href="#how" onClick={(e) => { e.preventDefault(); scrollTo('how'); }} className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">{t.navHow}</a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('contact'); }} className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">{t.navContact}</a>
              <LangSwitcher />
            </div>
            <div className="flex items-center gap-3 md:hidden">
              <LangSwitcher />
              <button onClick={() => setMobileNav(!mobileNav)} className="text-teal-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
          {mobileNav && (
            <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-gray-100 pt-4">
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about'); }} className="block text-sm font-medium text-gray-600">{t.navAbout}</a>
              <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollTo('pricing'); }} className="block text-sm font-medium text-gray-600">{t.navPricing}</a>
              <a href="#subjects" onClick={(e) => { e.preventDefault(); scrollTo('subjects'); }} className="block text-sm font-medium text-gray-600">{t.navSubjects}</a>
              <a href="#how" onClick={(e) => { e.preventDefault(); scrollTo('how'); }} className="block text-sm font-medium text-gray-600">{t.navHow}</a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('contact'); }} className="block text-sm font-medium text-gray-600">{t.navContact}</a>
            </div>
          )}
        </div>
      </nav>

      {/* Credibility Banner */}
      <div className="bg-teal-700 text-white py-3">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium">
          <span className="flex items-center gap-1.5"><Award className="w-4 h-4" /> {t.credBadge1}</span>
          <span className="hidden sm:inline text-teal-400">|</span>
          <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {t.credBadge2}</span>
          <span className="hidden sm:inline text-teal-400">|</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {t.credBadge3}</span>
        </div>
      </div>

      <section className="bg-teal-900 text-white py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <img src="/img_2976.jpg" alt="Owen" className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-teal-600 shadow-xl" style={{ objectPosition: '50% 5%' }} />
          </div>
          <p className="text-teal-300 font-medium tracking-widest uppercase text-sm mb-4">{t.heroTag}</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">{t.heroTitle}</h1>
          <p className="text-lg md:text-xl text-teal-100 max-w-2xl mx-auto mb-4 leading-relaxed">{t.heroBody}</p>
          <p className="text-teal-300 text-sm font-medium mb-6 whitespace-pre-line leading-relaxed">{t.heroLocation}</p>
          {/* Online lessons highlight */}
          <div className="inline-flex items-center gap-2 bg-teal-800/80 text-teal-200 px-5 py-2.5 rounded-full text-sm font-medium border border-teal-600 mb-8">
            <Video className="w-4 h-4" />
            {t.heroOnline}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <span className="bg-teal-800 text-teal-200 px-4 py-2 rounded-full text-sm font-medium border border-teal-700">{t.badgeIB}</span>
            <span className="bg-teal-800 text-teal-200 px-4 py-2 rounded-full text-sm font-medium border border-teal-700">{t.badgeATAR}</span>
            <span className="bg-teal-800 text-teal-200 px-4 py-2 rounded-full text-sm font-medium border border-teal-700">{t.badgeScholar}</span>
            <span className="bg-teal-800 text-teal-200 px-4 py-2 rounded-full text-sm font-medium border border-teal-700">{t.badgeICAS}</span>
            <span className="bg-teal-800 text-teal-200 px-4 py-2 rounded-full text-sm font-medium border border-teal-700">{t.badgeNAPLAN}</span>
          </div>
          <a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('contact'); }} className="inline-block bg-white text-teal-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-teal-50 transition-colors shadow-lg">
            {t.ctaBtn}
          </a>
        </div>
      </section>

      <section id="about" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img src="/img_2976.jpg" alt="Owen" className="rounded-2xl shadow-xl w-full object-cover max-h-[600px]" style={{ objectPosition: '50% 10%' }} />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-6">{t.aboutTitle}</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                {t.aboutBullet.map((b, i) => <p key={i} className="flex items-start gap-3"><span className="text-teal-600 mt-1">{b.icon}</span><span>{b.text}</span></p>)}
              </div>
              <p className="mt-6 text-gray-600 leading-relaxed">{t.aboutBody}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-900 text-center mb-12">{t.pricingTitle}</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border-2 border-teal-100 shadow-lg">
              <p className="text-4xl font-bold text-teal-700 mb-2">{t.priceAmount}</p>
              <p className="text-gray-500">{t.priceUnit}</p>
            </div>
            <div className="bg-teal-700 rounded-2xl p-8 text-white shadow-lg flex flex-col justify-center">
              <p className="text-2xl font-bold mb-4">{t.priceCustomTitle}</p>
              <p className="text-teal-100 leading-relaxed">{t.priceCustomBody}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="subjects" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-900 text-center mb-4">{t.subjectsTitle}</h2>
          <p className="text-center text-gray-700 mb-2 text-lg">{t.subjectsBody}</p>
          <p className="text-center text-teal-700 font-medium mb-10">{t.subjectsBadges}</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-teal-800 mb-4">{t.subjectsIBTitle}</h3>
              <p className="text-gray-700">{t.subjectsIBBody}</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-teal-800 mb-4">{t.subjectsATARTitle}</h3>
              <ul className="space-y-2">
                {t.subjectsATARList.map((b, i) => <li key={i} className="flex items-center gap-2 text-gray-600"><span className="text-teal-500">{b.icon}</span>{b.text}</li>)}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 md:col-span-2">
              <h3 className="text-xl font-bold text-teal-800 mb-4">{t.subjectsEnglishTitle}</h3>
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                {t.subjectsEnglishList.map((b, i) => <li key={i} className="flex items-center gap-2 text-gray-600"><span className="text-teal-500">{b.icon}</span>{b.text}</li>)}
              </ul>
            </div>
          </div>
          <p className="mt-8 text-center text-gray-600 max-w-3xl mx-auto">{t.subjectsNote}</p>
        </div>
      </section>

      <section id="how" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-900 text-center mb-12">{t.howTitle}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {t.howSteps.map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl font-bold text-teal-700 mb-3">{step.num}</div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.body}</p>
                {step.list && (
                  <ul className="mt-3 space-y-1 text-sm text-gray-500">
                    {step.list.map((item, j) => <li key={j} className="flex items-center gap-2"><span className="text-teal-500">{item.icon}</span>{item.text}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-900 text-center mb-12">{t.bringTitle}</h2>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 max-w-3xl mx-auto">
            <ul className="space-y-3">
              {t.bringItems.map((item, i) => <li key={i} className="flex items-center gap-3 text-gray-700"><span className="text-teal-500 text-lg">{item.icon}</span>{item.text}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-900 text-center mb-12">{t.structureTitle}</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-teal-800 mb-3">{t.priorityTitle}</h3>
              <p className="text-gray-600 mb-4">{t.priorityTime}</p>
              <ul className="space-y-2">
                {t.priorityItems.map((item, i) => <li key={i} className="flex items-center gap-2 text-gray-600"><span className="text-teal-500">{item.icon}</span>{item.text}</li>)}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-teal-800 mb-3">{t.workbookTitle}</h3>
              <p className="text-gray-700">{t.workbookBody}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shortened Lesson Section + Expandable FAQ */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-900 text-center mb-6">{t.lessonSummaryTitle}</h2>
          <p className="text-center text-gray-700 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">{t.lessonSummaryBody}</p>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setFaqOpen(!faqOpen)}
              className="w-full flex items-center justify-between px-8 py-5 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-bold text-teal-800 text-lg">{t.faqTitle}</span>
              {faqOpen ? <ChevronUp className="w-5 h-5 text-teal-600 shrink-0" /> : <ChevronDown className="w-5 h-5 text-teal-600 shrink-0" />}
            </button>
            {faqOpen && (
              <div className="px-8 pb-6 space-y-4 border-t border-gray-100 pt-6">
                {t.typicalSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="bg-teal-700 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0">{step.num}</div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1 text-sm">{step.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-1">{step.body}</p>
                      {step.list && (
                        <ul className="space-y-1 text-sm text-gray-500 mt-2">
                          {step.list.map((item, j) => <li key={j} className="flex items-center gap-2"><span className="text-teal-500">{item.icon}</span>{item.text}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setFaqOpen(false)}
                  className="w-full flex items-center justify-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors pt-2"
                >
                  <ChevronUp className="w-4 h-4" />
                  {t.faqCollapse}
                </button>
              </div>
            )}
            {!faqOpen && (
              <button
                onClick={() => setFaqOpen(true)}
                className="w-full flex items-center justify-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors px-8 pb-5 -mt-2"
              >
                <ChevronDown className="w-4 h-4" />
                {t.faqExpand}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-900 text-center mb-12">{t.testimonialsTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.testimonials.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 flex flex-col">
                <Quote className="w-8 h-8 text-teal-400 mb-4 shrink-0" />
                <p className="text-gray-700 leading-relaxed flex-1 italic">{item.quote}</p>
                <p className="mt-6 text-sm font-medium text-teal-700">{item.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact section with Enquiry Form */}
      <section id="contact" className="py-20 md:py-28 bg-teal-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">{t.contactTitle}</h2>
          <p className="text-teal-200 mb-12 max-w-2xl mx-auto text-center">{t.contactBody}</p>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div ref={formRef}>
              <EnquiryForm />
            </div>
            <div className="space-y-6">
              <div className="bg-teal-800 rounded-2xl p-6 border border-teal-700">
                <h3 className="font-bold text-teal-200 mb-3 flex items-center gap-2"><Mail className="w-5 h-5" /> {t.contactEmail}</h3>
                <button onClick={copyEmail} className="inline-flex items-center gap-2 bg-white text-teal-900 px-6 py-3 rounded-full font-bold text-sm hover:bg-teal-50 transition-colors shadow-lg">
                  {copied ? <><CheckCircle className="w-4 h-4" /> {t.emailCopied}</> : <><Copy className="w-4 h-4" /> {t.contactBtn}</>}
                </button>
              </div>
              <div className="bg-teal-800 rounded-2xl p-6 border border-teal-700">
                <h3 className="font-bold text-teal-200 mb-3">{t.contactLangsTitle}</h3>
                <ul className="space-y-2">
                  {t.contactLangs.map((l, i) => <li key={i} className="flex items-center gap-2 text-white"><span className="text-teal-400">{l.icon}</span>{l.text}</li>)}
                </ul>
              </div>
              <div className="bg-teal-800 rounded-2xl p-6 border border-teal-700">
                <h3 className="font-bold text-teal-200 mb-3 flex items-center gap-2"><MapPin className="w-5 h-5" /> {t.locationTitle}</h3>
                <p className="text-white whitespace-pre-line leading-relaxed mb-4">{t.locationBody}</p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1.5 bg-teal-700 text-teal-100 px-4 py-2 rounded-full text-sm font-medium">
                    <MapPin className="w-4 h-4" /> {t.inPersonLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-teal-700 text-teal-100 px-4 py-2 rounded-full text-sm font-medium">
                    <Video className="w-4 h-4" /> {t.onlineLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p className="font-bold text-gray-300 mb-1">{t.footerBrand}</p>
          <p>{t.footerTag}</p>
        </div>
      </footer>

      <FloatingCta onClick={scrollToForm} />
    </div>
  );
}

export default App;
