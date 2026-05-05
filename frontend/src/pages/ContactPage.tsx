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
            <div className="grid md:grid-cols-2 gap-12">
                {/* Contact Form */}
                <div className="border-4 border-black p-10 bg-white shadow-[10px_10px_0px_#000000]">
                    <div className="flex items-center gap-4 mb-10 pb-6 border-b-4 border-black">
                        <div className="p-3 bg-black text-white border-2 border-black">
                            <Send size={24} strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">New_Inbound</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Identity_Alias</label>
                            <div className="relative">
                                <User className="absolute left-5 top-5 text-black/20" size={24} />
                                <input
                                    className="w-full h-16 border-4 border-black bg-white pl-14 pr-6 font-black uppercase text-sm focus:bg-black focus:text-white transition-colors outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ENTER_NAME"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Dispatch_Address</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-5 text-black/20" size={24} />
                                <input
                                    type="email"
                                    className="w-full h-16 border-4 border-black bg-white pl-14 pr-6 font-black uppercase text-sm focus:bg-black focus:text-white transition-colors outline-none"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="ENTER_EMAIL"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Subject_Line</label>
                            <input
                                className="w-full h-16 border-4 border-black bg-white px-6 font-black uppercase text-sm focus:bg-black focus:text-white transition-colors outline-none"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="ISSUE_TYPE // GENERAL_INQUIRY"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Message_Buffer</label>
                            <textarea
                                className="w-full min-h-[160px] border-4 border-black bg-white p-6 font-black uppercase text-sm focus:bg-black focus:text-white transition-colors outline-none"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="ENTER_MESSAGE_DETAILS..."
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full h-16 bg-black text-white font-black uppercase text-sm hover:bg-[#E11D48] transition-colors shadow-[6px_6px_0px_#E11D48] hover:translate-x-1 hover:translate-y-1 hover:shadow-none flex items-center justify-center gap-4"
                        >
                            <Send size={20} strokeWidth={3} />
                            Initiate_Dispatch
                        </button>
                    </form>
                </div>

                {/* Contact Info */}
                <div className="space-y-8">
                    <div className="border-4 border-black p-10 bg-white shadow-[10px_10px_0px_#E11D48]">
                        <div className="flex items-start gap-6">
                            <div className="w-16 h-16 bg-black text-white border-2 border-black flex items-center justify-center shrink-0">
                                <Mail size={32} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic italic tracking-tighter mb-2">Email_Node</h3>
                                <p className="font-black text-black text-lg">SUPPORT@CASHLY.APP</p>
                                <div className="mt-4 bg-black text-white text-[10px] font-black px-3 py-1 inline-block uppercase tracking-widest">
                                    RESPONSE_WINDOW: 24H
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-4 border-black p-10 bg-white shadow-[10px_10px_0px_#000000]">
                        <div className="flex items-start gap-6">
                            <div className="w-16 h-16 bg-black text-white border-2 border-black flex items-center justify-center shrink-0">
                                <MessageSquare size={32} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic italic tracking-tighter mb-2">Live_Bridge</h3>
                                <p className="font-black text-black/50 text-sm uppercase tracking-widest mb-6">MON-FRI // 09:00 - 17:00 EST</p>
                                <button className="h-14 px-8 border-4 border-black font-black uppercase text-xs hover:bg-black hover:text-white transition-colors flex items-center gap-3">
                                    <Zap size={18} strokeWidth={3} />
                                    Open_Secure_Chat
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-4 border-black p-10 bg-black text-white">
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
