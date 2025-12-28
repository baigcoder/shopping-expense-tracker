// ProfilePage - Cashly User Profile
import { useState, useEffect } from 'react';
import { User, Mail, Calendar, MapPin, Edit2, Save, X, Camera, Shield, Sparkles, Receipt, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        } catch (error) {
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
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary shadow-lg shadow-primary/20">
                            <User className="h-6 w-6 text-white" />
                        </div>
                        Profile
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your account settings</p>
                </div>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} className="gradient-primary text-white shadow-lg shadow-emerald-500/20">
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="gradient-primary text-white">
                            <Save className="mr-2 h-4 w-4" />
                            Save
                        </Button>
                    </div>
                )}
            </motion.div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="card-hover overflow-hidden">
                    {/* Cover */}
                    <div className="h-32 bg-primary" />

                    <CardContent className="relative pt-0">
                        {/* Avatar overlapping cover */}
                        <div className="flex flex-col md:flex-row gap-6 -mt-16">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&size=128&background=10B981&color=fff`} />
                                        <AvatarFallback className="bg-emerald-500 text-white text-3xl font-bold">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    {isEditing && (
                                        <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full shadow-lg">
                                            <Camera className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <Badge className="bg-primary text-white border-0">
                                    <Sparkles className="mr-1 h-3 w-3" />
                                    Premium
                                </Badge>
                            </div>

                            {/* Form */}
                            <div className="flex-1 space-y-4 pt-4 md:pt-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John Doe"
                                            className="border-emerald-500/20 focus:border-emerald-500"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                                            <User className="h-4 w-4 text-emerald-600" />
                                            <span className="font-medium">{formData.name || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                                        <Mail className="h-4 w-4 text-violet-600" />
                                        <span>{formData.email}</span>
                                        <Badge variant="secondary" className="ml-auto text-emerald-600 border-emerald-500/20 bg-emerald-500/10">
                                            <Shield className="mr-1 h-3 w-3" />
                                            Verified
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Location</label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="New York, USA"
                                            className="border-emerald-500/20 focus:border-emerald-500"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                                            <MapPin className="h-4 w-4 text-amber-600" />
                                            <span>{formData.location || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Bio</label>
                                    {isEditing ? (
                                        <textarea
                                            className="w-full min-h-[80px] rounded-lg border border-emerald-500/20 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder="Tell us about yourself..."
                                        />
                                    ) : (
                                        <div className="p-3 rounded-lg border bg-muted/30">
                                            <span className="text-muted-foreground">{formData.bio || 'No bio yet'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Stats */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="card-hover bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Member Since</CardTitle>
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <Calendar className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-display">Jan 2024</div>
                        <p className="text-xs text-muted-foreground mt-1">11 months ago</p>
                    </CardContent>
                </Card>
                <Card className="card-hover bg-gradient-to-br from-violet-500/10 via-transparent to-transparent border-violet-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                        <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                            <Receipt className="h-4 w-4 text-violet-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-display">342</div>
                        <p className="text-xs text-muted-foreground mt-1">Lifetime tracking</p>
                    </CardContent>
                </Card>
                <Card className="card-hover bg-gradient-to-br from-amber-500/10 via-transparent to-transparent border-amber-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Connected Cards</CardTitle>
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <CreditCard className="h-4 w-4 text-amber-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-display">3</div>
                        <p className="text-xs text-muted-foreground mt-1">Active cards</p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default ProfilePage;
