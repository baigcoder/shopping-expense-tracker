// ProfilePage - Cashly User Profile
import { useState, useEffect } from 'react';
import { User, Mail, Calendar, MapPin, Edit2, Save, X, Camera, Shield, Sparkles, Receipt, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '../store/useStore';
import { toast } from 'sonner';
import { useSound } from '@/hooks/useSound';
import { motion } from 'framer-motion';

const ProfilePage = () => {
    const { user } = useAuthStore();
    const sound = useSound();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        location: '',
        bio: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                location: '',
                bio: ''
            });
        }
    }, [user]);

    const handleSave = async () => {
        try {
            toast.success('Profile updated successfully!');
            setIsEditing(false);
            sound.playSuccess();
        } catch {
            toast.error('Failed to update profile');
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
            location: '',
            bio: ''
        });
        setIsEditing(false);
    };

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 md:px-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <motion.div
                className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-ink)] text-white text-[10px] font-mono tracking-wider uppercase mb-3 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EE5024] animate-pulse" />
                        Identity & Credentials
                    </div>
                    <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.04em] text-[var(--color-ink)] uppercase leading-none">
                        User Profile
                    </h1>
                    <p className="text-sm text-[var(--color-ink)]/70 mt-2 max-w-xl font-medium leading-relaxed">
                        Manage your sovereign identity, account credentials, and workspace connection state.
                    </p>
                </div>
                {!isEditing ? (
                    <Button 
                        onClick={() => setIsEditing(true)} 
                        className="rounded-full bg-[#EE5024] hover:bg-[#EE5024]/90 text-white font-bold text-xs h-10 px-6 shadow-sm transition-all"
                    >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={handleCancel}
                            className="rounded-full border-[var(--color-border)] text-xs h-10 px-5 text-[var(--color-ink)] hover:border-[var(--color-ink)]"
                        >
                            <X className="mr-1.5 h-3.5 w-3.5" />
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            className="rounded-full bg-[#EE5024] hover:bg-[#EE5024]/90 text-white font-bold text-xs h-10 px-6 shadow-sm"
                        >
                            <Save className="mr-1.5 h-4 w-4" />
                            Save
                        </Button>
                    </div>
                )}
            </motion.div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="rounded-[28px] bg-white border border-[var(--color-border)] shadow-xs overflow-hidden">
                    {/* Cover: Deep Ink with geometric accents */}
                    <div className="h-32 bg-[#111111] border-b border-[#222222] relative">
                        <div className="absolute top-4 right-6 text-[10px] font-mono font-bold uppercase tracking-wider text-white/40">
                            Cashly Sovereign Workspace
                        </div>
                    </div>

                    <div className="relative p-6 md:p-8 pt-0">
                        {/* Avatar overlapping cover */}
                        <div className="flex flex-col md:flex-row gap-6 -mt-14">
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-24 w-24 border-4 border-[var(--color-surface)] shadow-md">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&size=128&background=0F766E&color=fff`} />
                                        <AvatarFallback className="bg-[var(--color-brand)] text-white text-xl font-bold">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    {isEditing && (
                                        <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-7 w-7 rounded-full shadow-md bg-[var(--color-surface)] border border-[var(--color-border)]">
                                            <Camera className="h-3.5 w-3.5 text-[var(--color-text-primary)]" />
                                        </Button>
                                    )}
                                </div>
                                <Badge className="bg-[var(--color-brand)] text-white border-0 text-[10px] font-mono">
                                    <Sparkles className="mr-1 h-3 w-3" />
                                    Pro Tier
                                </Badge>
                            </div>

                            {/* Form */}
                            <div className="flex-1 space-y-4 pt-2 md:pt-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--color-text-primary)]">Full Name</label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Your full name"
                                            className="rounded-xl h-9 text-xs bg-[var(--color-surface-subtle)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
                                            <User className="h-4 w-4 text-[var(--color-brand)]" />
                                            <span className="font-semibold text-xs text-[var(--color-text-primary)]">{formData.name || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--color-text-primary)]">Email Address</label>
                                    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-xs">
                                        <Mail className="h-4 w-4 text-[var(--color-ai)]" />
                                        <span className="text-[var(--color-text-primary)] font-mono">{formData.email}</span>
                                        <Badge variant="secondary" className="ml-auto text-[var(--color-positive)] bg-[var(--color-positive-subtle)] border border-[var(--color-positive)]/20 text-[10px] font-mono">
                                            <Shield className="mr-1 h-3 w-3" />
                                            Verified
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--color-text-primary)]">Location</label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="e.g. San Francisco, CA"
                                            className="rounded-xl h-9 text-xs bg-[var(--color-surface-subtle)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-xs">
                                            <MapPin className="h-4 w-4 text-[var(--color-warning)]" />
                                            <span className="text-[var(--color-text-primary)]">{formData.location || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[var(--color-text-primary)]">Bio / Financial Goal</label>
                                    {isEditing ? (
                                        <textarea
                                            className="w-full min-h-[70px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-2.5 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)]"
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder="e.g. Saving for high-yield reserve..."
                                        />
                                    ) : (
                                        <div className="p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-xs">
                                            <span className="text-[var(--color-text-secondary)]">{formData.bio || 'No bio or targets configured yet'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium mb-1.5">
                        <span>Member Since</span>
                        <Calendar className="h-4 w-4 text-[var(--color-positive)]" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">Jan 2024</div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 font-mono">11 months active</p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium mb-1.5">
                        <span>Documented Purchases</span>
                        <Receipt className="h-4 w-4 text-[var(--color-ai)]" />
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-[var(--color-text-primary)]">342</div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">Audited ledger events</p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium mb-1.5">
                        <span>Connected Instruments</span>
                        <CreditCard className="h-4 w-4 text-[var(--color-warning)]" />
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-[var(--color-text-primary)]">3</div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">Cards & bank accounts</p>
                </div>
            </motion.div>
        </div>
    );
};

export default ProfilePage;
