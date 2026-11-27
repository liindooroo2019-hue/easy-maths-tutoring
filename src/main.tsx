import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { I18nProvider } from './i18n/I18nContext.tsx';
import GlobalSite from './pages/GlobalSite.tsx';

const isGlobal = window.location.pathname.replace(/\/+$/, '').endsWith('/global');

if (isGlobal) {
  document.title = 'Online Maths, English & Academic Tutoring for Grades 1–12 | Easy Maths Tutoring';
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', 'Personalised online maths tutor, English tutor and academic support for Grades 1–12. IB Mathematics tutoring, homework help and more — online worldwide via Teams. Free trial available.');
} else {
  document.title = 'Easy Maths Tutoring | Year 1–12 Maths & English Tutoring (Brisbane & Online)';
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', 'Personalised maths and English tutoring for Year 1–12 in Indooroopilly, Brisbane and online. IB & ATAR support, free trial lesson.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      {isGlobal ? <GlobalSite /> : <App />}
    </I18nProvider>
  </StrictMode>
);
