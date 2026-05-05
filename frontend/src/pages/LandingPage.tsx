// LandingPage - Stark Gen Z Mission-Audit Gateway
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CalendarDays,
  CheckCircle2,
  Chrome,
  ClipboardList,
  FileText,
  Inbox,
  Menu,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  Cpu,
  Globe,
  Zap,
  Shield,
  Terminal,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import BRAND from '@/config/branding';
import { soundManager } from '@/lib/sounds';

const FEATURES = [
  { 
    id: '01',
    title: 'SMART_INBOX', 
    desc: 'Stop unexpected charges. All detections wait in staging for your authorization.', 
    icon: Inbox,
    accent: '#E11D48'
  },
  { 
    id: '02',
    title: 'AI_INSIGHTS', 
    desc: 'Advanced AI financial coaching that roasts your spending and optimizes capital.', 
    icon: Brain,
    accent: '#000000'
  },
  { 
    id: '03',
    title: 'BROWSER_SYNC', 
    desc: 'Browser extension syncs checkout and subscription data directly to your inbox.', 
    icon: Chrome,
    accent: '#000000'
  },
  { 
    id: '04',
    title: 'GOAL_TRACKING', 
    desc: 'Stark visual tracking for your financial milestones with visual precision.', 
    icon: Target,
    accent: '#E11D48'
  },
  { 
    id: '05',
    title: 'AUTO_RULES', 
    desc: 'Smart rules ensure your ledger remains clean and automated correctly.', 
    icon: ShieldCheck,
    accent: '#000000'
  },
  { 
    id: '06',
    title: 'REPORTS', 
    desc: 'Generate Professional PDF reports for tax, monthly reviews, and deep audits.', 
    icon: FileText,
    accent: '#000000'
  },
];

const WORKFLOW = [
  { step: 'CREATE_ACCOUNT', desc: 'Create your free account.' },
  { step: 'SYNC_SOURCES', desc: 'Install extension and sync data.' },
  { step: 'REVIEW_INBOX', desc: 'Review and approve new transactions.' },
  { step: 'FINALIZE_LEDGER', desc: 'View reports and get AI insights.' },
];

const LandingPage = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const playClick = () => soundManager.play('click');

  return (
    <div className="min-h-screen bg-white text-black font-bold selection:bg-black selection:text-white">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-8">
          <Link to="/" className="flex items-center gap-4 group" onClick={playClick}>
            <div className="w-12 h-12 bg-black text-white border-4 border-black flex items-center justify-center font-black text-xl italic tracking-tighter group-hover:bg-[#E11D48] transition-colors">
              C
            </div>
            <span className="text-2xl font-black italic tracking-tighter uppercase">{BRAND.name}</span>
          </Link>

          <nav className="hidden items-center gap-12 lg:flex">
            {['FEATURES', 'WORKFLOW', 'EXTENSION'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="text-xs font-black uppercase tracking-[0.2em] hover:text-[#E11D48] transition-colors"
                onClick={playClick}
              >
                {item}
              </a>
            ))}
            <div className="h-8 w-1 bg-black/10" />
            <Link 
              to="/login" 
              className="text-xs font-black uppercase tracking-[0.2em] hover:text-[#E11D48] transition-colors"
              onClick={playClick}
            >
              LOG_IN
            </Link>
            <Link 
              to="/signup" 
              className="h-12 px-8 bg-black text-white flex items-center justify-center text-xs font-black uppercase tracking-[0.2em] hover:bg-[#E11D48] transition-colors border-2 border-black"
              onClick={playClick}
            >
              SIGN_UP
            </Link>
          </nav>

          <button className="lg:hidden p-2 border-4 border-black" onClick={() => { setMobileOpen(!mobileOpen); playClick(); }}>
            {mobileOpen ? <X size={24} strokeWidth={4} /> : <Menu size={24} strokeWidth={4} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="overflow-hidden bg-white border-b-4 border-black lg:hidden"
            >
              <div className="p-8 flex flex-col gap-6">
                {['FEATURES', 'WORKFLOW', 'EXTENSION'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="text-xl font-black uppercase tracking-widest" onClick={() => { setMobileOpen(false); playClick(); }}>{item}</a>
                ))}
                <Link to="/login" className="text-xl font-black uppercase tracking-widest" onClick={() => { setMobileOpen(false); playClick(); }}>LOG_IN</Link>
                <Link to="/signup" className="h-16 bg-black text-white flex items-center justify-center text-xl font-black uppercase tracking-widest" onClick={() => { setMobileOpen(false); playClick(); }}>SIGN_UP</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* ── HERO SECTION ── */}
        <section className="relative overflow-hidden bg-white border-b-8 border-black">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>

          <div className="mx-auto max-w-[1600px] grid lg:grid-cols-[1.1fr_0.9fr] min-h-[calc(100vh-80px)]">
            <div className="p-8 md:p-16 lg:p-24 flex flex-col justify-center border-r-4 border-black relative">
              <div className="inline-block bg-[#E11D48] text-white text-[10px] font-black px-4 py-1 uppercase tracking-widest mb-8 border-2 border-[#E11D48]">
                SMART_FINANCE_v2.0
              </div>
              <h1 className="text-[5rem] md:text-[8rem] lg:text-[10rem] font-black italic uppercase tracking-tighter leading-[0.85] mb-12">
                FINANCE<br />SIMPLIFIED
              </h1>
              <p className="text-xl md:text-2xl font-black uppercase tracking-tighter max-w-2xl leading-[1.1] mb-16">
                AUTO_SYNC. SMART_INBOX. AI_INSIGHTS.<br />
                <span className="text-black/40">THE_END_OF_UNAUTHORIZED_CHARGES.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-6">
                <Link 
                  to="/signup" 
                  className="h-20 px-12 bg-black text-white flex items-center justify-center text-lg font-black uppercase tracking-widest shadow-[10px_10px_0px_#E11D48] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all"
                  onClick={playClick}
                >
                  GET_STARTED
                  <ArrowRight size={24} strokeWidth={4} className="ml-4" />
                </Link>
                <a 
                  href="/cashly-extension.zip"
                  className="h-20 px-12 border-4 border-black bg-white text-black flex items-center justify-center text-lg font-black uppercase tracking-widest shadow-[10px_10px_0px_#000000] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all"
                  onClick={playClick}
                >
                  GET_EXTENSION
                  <Chrome size={24} strokeWidth={3} className="ml-4" />
                </a>
              </div>

              <div className="mt-24 grid grid-cols-3 gap-8 border-t-4 border-black pt-12">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">SYSTEM_LATENCY</p>
                  <p className="text-3xl font-black italic tracking-tighter">0.02ms</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">AUTH_STATUS</p>
                  <p className="text-3xl font-black italic tracking-tighter text-[#E11D48]">STABLE</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">NODES_SYNCED</p>
                  <p className="text-3xl font-black italic tracking-tighter">12.8k</p>
                </div>
              </div>
            </div>

            <div className="bg-black text-white p-8 md:p-16 flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 flex gap-4">
                <div className="w-4 h-4 bg-[#E11D48]" />
                <div className="w-4 h-4 bg-white" />
                <div className="w-4 h-4 bg-white/20" />
              </div>
              
              <div className="w-full max-w-md space-y-12 relative z-10">
                <div className="border-8 border-white p-10 bg-black shadow-[20px_20px_0px_#E11D48]">
                   <header className="mb-12 flex items-center justify-between">
                     <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#E11D48] mb-2">DASHBOARD_PREVIEW</p>
                       <h2 className="text-4xl font-black italic uppercase tracking-tighter">AUDIT_LOG</h2>
                     </div>
                     <Shield size={48} strokeWidth={3} className="text-white" />
                   </header>

                   <div className="space-y-6">
                     <div className="p-6 border-4 border-white bg-white/5">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/40">INCOMING_ENTRY</span>
                           <span className="px-2 py-1 bg-[#E11D48] text-[8px] font-black">STAGED_REVIEW</span>
                        </div>
                        <p className="text-lg font-black uppercase tracking-tighter mb-1">FOODPANDA_CHECKOUT</p>
                        <p className="text-2xl font-black italic text-[#E11D48]">PKR 2,450.00</p>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="p-4 border-2 border-white/20">
                           <p className="text-[8px] font-black uppercase text-white/40 mb-1">CONFIDENCE</p>
                           <p className="text-xl font-black">98.2%</p>
                        </div>
                        <div className="p-4 border-2 border-white/20">
                           <p className="text-[8px] font-black uppercase text-white/40 mb-1">HEALTH_SCORE</p>
                           <p className="text-xl font-black text-[#E11D48]">MAX</p>
                        </div>
                     </div>

                     <div className="h-12 border-4 border-white flex items-center justify-center bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-[#E11D48] hover:text-white transition-colors cursor-pointer">
                        AUTHORIZE_TRANSACTION
                     </div>
                   </div>
                </div>

                <div className="flex items-center gap-6 px-4">
                   <div className="w-12 h-12 border-4 border-white flex items-center justify-center shrink-0">
                      <Terminal size={24} strokeWidth={3} />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-relaxed">
                      SYSTEM_MESSAGE: DETECTED_SUBSCRIPTION_RENEWAL. AUTHORIZATION_REQUIRED_BY_USER_PROTOCOL.
                   </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES MATRIX ── */}
        <section id="features" className="py-32 border-b-8 border-black">
          <div className="mx-auto max-w-[1600px] px-8">
            <header className="mb-24 flex flex-col md:flex-row items-end justify-between gap-12">
              <div className="max-w-3xl">
                <div className="inline-block bg-black text-white text-[10px] font-black px-4 py-1 uppercase tracking-widest mb-6 border-2 border-black">
                  CORE_PROTOCOLS
                </div>
                <h2 className="text-[4rem] md:text-[6rem] font-black italic uppercase tracking-tighter leading-[0.85]">
                  ENGINEERED_FOR_TRUST
                </h2>
              </div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-black/40 max-w-sm text-right leading-relaxed">
                WE_DO_NOT_POST_SILENTLY. WE_DO_NOT_ASSUME. WE_ONLY_SYNC_WHEN_AUTHORIZED.
              </p>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((f) => (
                <div key={f.title} className="border-4 border-black p-10 bg-white shadow-[12px_12px_0px_#000000] hover:shadow-none hover:translate-x-[12px] hover:translate-y-[12px] transition-all group relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <f.icon size={120} strokeWidth={4} />
                   </div>
                   <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="w-16 h-16 border-4 border-black bg-black text-white flex items-center justify-center">
                         <f.icon size={32} strokeWidth={3} />
                      </div>
                      <span className="text-3xl font-black italic text-black/10 group-hover:text-[#E11D48] transition-colors">{f.id}</span>
                   </div>
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 relative z-10">{f.title}</h3>
                   <p className="text-xs font-black uppercase tracking-widest text-black/40 leading-relaxed relative z-10">
                      {f.desc}
                   </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WORKFLOW SEQUENCE ── */}
        <section id="workflow" className="bg-black text-white py-32 border-b-8 border-black overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[#E11D48] opacity-10 blur-[120px] pointer-events-none" />
          
          <div className="mx-auto max-w-[1600px] px-8 grid lg:grid-cols-2 gap-24 relative z-10">
             <div>
                <div className="inline-block bg-white text-black text-[10px] font-black px-4 py-1 uppercase tracking-widest mb-6 border-2 border-white">
                  HOW_IT_WORKS
                </div>
                <h2 className="text-[4rem] md:text-[6rem] font-black italic uppercase tracking-tighter leading-[0.85] mb-12">
                  FROM_DATA<br />TO_INSIGHT
                </h2>
                <p className="text-lg font-black uppercase tracking-[0.1em] text-white/40 max-w-lg mb-12 leading-relaxed">
                  Automated data is saved immediately as a candidate, not silently posted to your final ledger. You hold the master key.
                </p>
                <Link 
                  to="/signup" 
                  className="inline-flex h-20 px-12 bg-white text-black items-center justify-center text-lg font-black uppercase tracking-widest shadow-[10px_10px_0px_#E11D48] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all"
                  onClick={playClick}
                >
                  GET_STARTED
                  <ChevronRight size={32} strokeWidth={4} className="ml-4" />
                </Link>
             </div>

             <div className="space-y-4">
                {WORKFLOW.map((item, i) => (
                  <div key={item.step} className="border-4 border-white p-8 bg-white/5 flex items-center gap-12 group hover:bg-white/10 transition-colors">
                     <span className="text-6xl font-black italic text-white/10 group-hover:text-[#E11D48] transition-colors">0{i+1}</span>
                     <div>
                        <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-2">{item.step}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-relaxed">
                           {item.desc}
                        </p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* ── EXTENSION NODE ── */}
        <section id="extension" className="py-32 border-b-8 border-black">
           <div className="mx-auto max-w-[1400px] px-8">
              <div className="border-8 border-black p-16 bg-white shadow-[24px_24px_0px_#000000] relative group">
                 <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#E11D48] border-8 border-black flex items-center justify-center text-white shadow-[8px_8px_0px_#000000]">
                    <Chrome size={64} strokeWidth={3} />
                 </div>
                 
                 <div className="max-w-3xl">
                    <h2 className="text-6xl font-black italic uppercase tracking-tighter mb-8 leading-[0.9]">
                       AUTOMATE_EVERYTHING<br />WITH_CASHLY
                    </h2>
                    <p className="text-lg font-black uppercase tracking-widest text-black/40 mb-12 leading-relaxed">
                       The extension watches checkout signals, trial confirmations, and subscription success triggers. It saves a structured candidate with precision health metrics so your ledger remains current.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6">
                       <a 
                         href="/cashly-extension.zip"
                         className="h-20 px-12 bg-black text-white flex items-center justify-center text-lg font-black uppercase tracking-widest shadow-[8px_8px_0px_#E11D48] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all"
                         onClick={playClick}
                       >
                         GET_EXTENSION
                         <Zap size={24} strokeWidth={4} className="ml-4" />
                       </a>
                       <Link 
                         to="/features" 
                         className="h-20 px-12 border-4 border-black flex items-center justify-center text-lg font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                         onClick={playClick}
                       >
                         LEARN_MORE
                       </Link>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-black text-white border-t-8 border-black">
        <div className="mx-auto max-w-[1600px] px-8 py-20 flex flex-col md:flex-row items-start justify-between gap-16">
          <div className="space-y-8">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white text-black border-4 border-white flex items-center justify-center font-black text-2xl italic tracking-tighter">
                   C
                </div>
                <div>
                   <h3 className="text-3xl font-black italic uppercase tracking-tighter">{BRAND.name}</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/40">SMART_FINANCE_SYSTEM</p>
                </div>
             </div>
             <p className="text-xs font-black uppercase tracking-widest text-white/20 max-w-xs leading-relaxed">
                ESTABLISHED_2026. BUILT_FOR_MODERN_FINANCE. ALL_RIGHTS_RESERVED.
             </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-24">
             <div className="space-y-6">
                <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#E11D48]">NAVIGATION</h5>
                <ul className="space-y-4">
                   {['FEATURES', 'WORKFLOW', 'EXTENSION', 'ROADMAP'].map(link => (
                     <li key={link}><a href={`#${link.toLowerCase()}`} className="text-sm font-black uppercase tracking-widest hover:text-[#E11D48] transition-colors">{link}</a></li>
                   ))}
                </ul>
             </div>
             <div className="space-y-6">
                <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#E11D48]">LEGAL</h5>
                <ul className="space-y-4">
                   {['PRIVACY', 'TERMS', 'SECURITY', 'COOKIE_NODES'].map(link => (
                     <li key={link}><Link to={`/${link.toLowerCase()}`} className="text-sm font-black uppercase tracking-widest hover:text-[#E11D48] transition-colors">{link}</Link></li>
                   ))}
                </ul>
             </div>
             <div className="space-y-6">
                <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#E11D48]">SUPPORT</h5>
                <ul className="space-y-4">
                   {['FAQ', 'CONTACT', 'DOC_MANIFEST', 'API_DOCS'].map(link => (
                     <li key={link}><Link to={`/${link.toLowerCase().replace('_', '-')}`} className="text-sm font-black uppercase tracking-widest hover:text-[#E11D48] transition-colors">{link}</Link></li>
                   ))}
                </ul>
             </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] px-8 py-8 border-t-4 border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.5em] text-white/10">
           <span>SYSTEM_STATUS: OPTIMAL</span>
           <span>STABLE_v2.0.4</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
