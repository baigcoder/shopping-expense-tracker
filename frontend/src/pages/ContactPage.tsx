// Contact Page - Stark Gen Z Brutalist Mission Dispatch
import { useState } from 'react';
import StaticPageTemplate from '../components/StaticPageTemplate';
import { Mail, MessageSquare, Send, User, Target, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success('MISSION_DISPATCHED // WE_WILL_RESPOND_SOON');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <StaticPageTemplate
            title="Dispatch Hub"
            subtitle="DIRECT_COMMUNICATION_LINK_TO_CASHLY_CORE"
        >
            <div className="grid w-full max-w-full min-w-0 overflow-hidden md:grid-cols-2 gap-6 md:gap-12">
                {/* Contact Form */}
                <div className="w-full max-w-full min-w-0 overflow-hidden border-2 sm:border-4 border-black p-3 sm:p-10 bg-white shadow-[3px_3px_0px_#000000] sm:shadow-[10px_10px_0px_#000000]">
                    <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center gap-4 mb-8 sm:mb-10 pb-6 border-b-4 border-black">
                        <div className="p-3 bg-black text-white border-2 border-black">
                            <Send size={24} strokeWidth={3} />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter break-words" style={{ overflowWrap: 'anywhere' }}>New_Inbound</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-wide sm:tracking-widest text-black/40 ml-1">Identity_Alias</label>
                            <div className="relative">
                                <User className="absolute left-3 sm:left-5 top-4 sm:top-5 text-black/20" size={22} />
                                <input
                                    className="w-full h-14 sm:h-16 border-4 border-black bg-white pl-11 sm:pl-14 pr-3 sm:pr-6 font-black uppercase text-[11px] sm:text-sm focus:bg-black focus:text-white transition-colors outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ENTER_NAME"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-wide sm:tracking-widest text-black/40 ml-1">Dispatch_Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 sm:left-5 top-4 sm:top-5 text-black/20" size={22} />
                                <input
                                    type="email"
                                    className="w-full h-14 sm:h-16 border-4 border-black bg-white pl-11 sm:pl-14 pr-3 sm:pr-6 font-black uppercase text-[11px] sm:text-sm focus:bg-black focus:text-white transition-colors outline-none"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="ENTER_EMAIL"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-wide sm:tracking-widest text-black/40 ml-1">Subject_Line</label>
                            <input
                                className="w-full h-14 sm:h-16 border-4 border-black bg-white px-3 sm:px-6 font-black uppercase text-[10px] min-[380px]:text-xs sm:text-sm focus:bg-black focus:text-white transition-colors outline-none"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="GENERAL_INQUIRY"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-wide sm:tracking-widest text-black/40 ml-1">Message_Buffer</label>
                            <textarea
                                className="w-full min-h-[150px] sm:min-h-[160px] border-4 border-black bg-white p-3 sm:p-6 font-black uppercase text-[11px] sm:text-sm focus:bg-black focus:text-white transition-colors outline-none"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="ENTER_MESSAGE_DETAILS..."
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full min-h-14 sm:h-16 bg-black text-white font-black uppercase text-[11px] sm:text-sm hover:bg-[#E11D48] transition-colors shadow-[4px_4px_0px_#E11D48] sm:shadow-[6px_6px_0px_#E11D48] hover:translate-x-1 hover:translate-y-1 hover:shadow-none flex items-center justify-center gap-2 sm:gap-4"
                        >
                            <Send size={18} strokeWidth={3} />
                            <span className="sm:hidden">Dispatch</span>
                            <span className="hidden sm:inline">Initiate_Dispatch</span>
                        </button>
                    </form>
                </div>

                {/* Contact Info */}
                <div className="w-full max-w-full min-w-0 space-y-8 overflow-hidden">
                    <div className="border-2 sm:border-4 border-black p-4 sm:p-10 bg-white shadow-[3px_3px_0px_#E11D48] sm:shadow-[10px_10px_0px_#E11D48]">
                        <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
                            <div className="w-16 h-16 bg-black text-white border-2 border-black flex items-center justify-center shrink-0">
                                <Mail size={32} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic italic tracking-tighter mb-2">Email_Node</h3>
                                <p className="font-black text-black text-sm sm:text-lg break-words">SUPPORT@CASHLY.APP</p>
                                <div className="mt-4 bg-black text-white text-[10px] font-black px-3 py-1 inline-block uppercase tracking-widest">
                                    RESPONSE_WINDOW: 24H
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-2 sm:border-4 border-black p-4 sm:p-10 bg-white shadow-[3px_3px_0px_#000000] sm:shadow-[10px_10px_0px_#000000]">
                        <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
                            <div className="w-16 h-16 bg-black text-white border-2 border-black flex items-center justify-center shrink-0">
                                <MessageSquare size={32} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic italic tracking-tighter mb-2">Live_Bridge</h3>
                                <p className="font-black text-black/50 text-xs sm:text-sm uppercase tracking-wide sm:tracking-widest mb-6">MON-FRI // 09:00 - 17:00 EST</p>
                                <button className="min-h-14 px-4 sm:px-8 border-4 border-black font-black uppercase text-[11px] sm:text-xs hover:bg-black hover:text-white transition-colors flex items-center gap-3">
                                    <Zap size={18} strokeWidth={3} />
                                    Open_Secure_Chat
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-2 sm:border-4 border-black p-4 sm:p-10 bg-black text-white">
                        <div className="flex items-center gap-4 mb-6">
                            <Target size={24} strokeWidth={3} className="text-[#E11D48]" />
                            <h3 className="text-lg font-black uppercase italic tracking-tighter">Audit_Resources</h3>
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-white/50 leading-relaxed">
                            Before initiating a dispatch, check our system manifest for common resolutions.
                        </p>
                        <a 
                            href="/faq" 
                            className="mt-6 h-14 border-2 border-white flex items-center justify-center font-black uppercase text-xs hover:bg-white hover:text-black transition-colors"
                        >
                            Open_FAQ_Matrix
                        </a>
                    </div>
                </div>
            </div>
        </StaticPageTemplate>
    );
};

export default ContactPage;
