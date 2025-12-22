import React from 'react';
import { Shield, CheckCircle2, ArrowLeft, Clock, RefreshCw, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MoneyBackGuarantee } from '@/components/trust';

/**
 * Guarantee Page
 * Dedicated page explaining 30-day guarantee
 * Psychology: Transparency builds trust, eliminates purchase anxiety
 */
export const Guarantee: React.FC = () => {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                </Link>

                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-100 mb-6">
                        <Shield className="h-12 w-12 text-green-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                        Our 30-Day Perfect Notes Guarantee
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        You risk nothing. We risk everything.
                    </p>
                </div>

                {/* Main Guarantee Card */}
                <MoneyBackGuarantee variant="section" showDetails className="mb-12" />

                {/* How It Works */}
                <div className="bg-card border border-border rounded-xl p-8 mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6">How Our Guarantee Works</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                1
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Purchase Any Notes</h3>
                                <p className="text-muted-foreground">
                                    Buy with confidence knowing you're protected by our guarantee
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                2
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Try Them For 30 Days</h3>
                                <p className="text-muted-foreground">
                                    Use the notes to study, prepare for exams, and see if they help
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                3
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Not Satisfied? Get Refund</h3>
                                <p className="text-muted-foreground">
                                    Simply contact support within 30 days and we'll process a full refund - no questions asked
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* What's Covered */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <h3 className="font-bold text-green-900">What's Covered</h3>
                        </div>
                        <ul className="space-y-3 text-sm text-green-800">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>Notes don't match the description</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>Quality not as expected</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>Notes didn't help your studies</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>Any other reason - we don't ask questions</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Clock className="h-6 w-6 text-primary" />
                            <h3 className="font-bold text-foreground">Refund Timeline</h3>
                        </div>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <RefreshCw className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
                                <span><strong>Request:</strong> Email support within 30 days</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <RefreshCw className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
                                <span><strong>Processing:</strong> We confirm receipt within 24 hours</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <DollarSign className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-600" />
                                <span><strong>Refund:</strong> Full amount returned within 3-5 business days</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* FAQs */}
                <div className="bg-card border border-border rounded-xl p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">
                                Do I need to provide a reason for the refund?
                            </h3>
                            <p className="text-muted-foreground">
                                No. We process all refund requests within 30 days, no questions asked. We do appreciate feedback to improve our service, but it's not required.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-foreground mb-2">
                                What if I already used the notes for my exam?
                            </h3>
                            <p className="text-muted-foreground">
                                That's fine! The 30-day period starts from the day of purchase, regardless of when you use the notes.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-foreground mb-2">
                                How do I request a refund?
                            </h3>
                            <p className="text-muted-foreground">
                                Simply email support@studyvault.com with your order number and "Refund Request" in the subject line. We'll process it within 24 hours.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-foreground mb-2">
                                Why do you offer this guarantee?
                            </h3>
                            <p className="text-muted-foreground">
                                We're confident in our notes because thousands of students have successfully used them to score 90+. We want you to purchase with complete peace of mind.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trust Building Statement */}
                <div className="mt-12 text-center">
                    <p className="text-lg text-muted-foreground mb-4">
                        Over <strong className="text-foreground">50,000 students</strong> have trusted our notes.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Less than 2% have requested refunds - and that's okay!
                    </p>
                </div>
            </div>
        </div>
    );
};
