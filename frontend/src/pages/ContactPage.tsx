import { useState } from 'react';
import StaticPageTemplate from '../components/StaticPageTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success('Message sent! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <StaticPageTemplate
            title="Contact Us"
            subtitle="We'd love to hear from you"
        >
            <div className="grid md:grid-cols-2 gap-8">
                {/* Contact Form */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject</label>
                                <Input
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="How can we help?"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message</label>
                                <textarea
                                    className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Your message..."
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                <Send className="mr-2 h-4 w-4" />
                                Send Message
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <Mail className="h-6 w-6 text-primary mt-1" />
                                <div>
                                    <h3 className="font-semibold mb-1">Email</h3>
                                    <p className="text-muted-foreground">support@spendsync.app</p>
                                    <p className="text-sm text-muted-foreground mt-1">We'll respond within 24 hours</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <MessageSquare className="h-6 w-6 text-primary mt-1" />
                                <div>
                                    <h3 className="font-semibold mb-1">Live Chat</h3>
                                    <p className="text-muted-foreground">Available Mon-Fri, 9AM-5PM EST</p>
                                    <Button variant="outline" size="sm" className="mt-2">
                                        Start Chat
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="prose prose-sm">
                        <h3>FAQ</h3>
                        <p>
                            Before reaching out, check our <a href="/faq" className="text-primary hover:underline">FAQ page</a> for quick answers to common questions.
                        </p>
                    </div>
                </div>
            </div>
        </StaticPageTemplate>
    );
};

export default ContactPage;
