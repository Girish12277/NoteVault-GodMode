
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ShieldCheck, Loader2, FileText, Calendar, User, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { format } from 'date-fns';

interface VerificationData {
    isValid: boolean;
    invoiceId: string;
    issuedAt: string;
    amount: string;
    status: string;
    buyerRef: string;
    issuer: string;
    item: {
        title: string;
        type: string;
    };
}

export default function InvoiceVerifier() {
    const { invoiceId } = useParams();
    const [searchParams] = useSearchParams();
    const sig = searchParams.get('sig');

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<VerificationData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const verifyInvoice = async () => {
            if (!invoiceId || !sig) {
                setError('Missing verification parameters. Please scan the QR code again.');
                setLoading(false);
                return;
            }

            try {
                // Determine API URL based on environment
                // GOD-LEVEL FIX: Sanitization of Base URL to prevent double /api/api paths
                let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
                baseUrl = baseUrl.replace(/\/$/, '');      // Strip trailing slash
                baseUrl = baseUrl.replace(/\/api$/, '');   // Strip trailing /api if present

                const apiUrl = `${baseUrl}/api/public/verify/invoice/${invoiceId}?sig=${sig}`;

                const response = await axios.get(apiUrl);
                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setError(response.data.message || 'Verification failed');
                }
            } catch (err: any) {
                console.error("Verification Error", err);
                setError(err.response?.data?.message || 'Unable to verify invoice. The record may be missing or the signature is invalid.');
            } finally {
                // Minimum loading time for UX (Trust Signal)
                setTimeout(() => setLoading(false), 800);
            }
        };

        verifyInvoice();
    }, [invoiceId, sig]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative w-full max-w-md">

                {/* Header Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold font-display tracking-tight hover:opacity-80 transition-opacity">
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <ShieldCheck className="h-8 w-8 text-primary" />
                        </div>
                        NoteVault
                        <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold -mt-4 -ml-1">Verify</span>
                    </Link>
                </div>

                <Card className="border-none shadow-2xl bg-white/50 dark:bg-black/50 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                            Cryptographic Verification
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-6 md:p-8 pt-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                    <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-bold">Verifying Signature...</h3>
                                    <p className="text-sm text-muted-foreground">Checking blockchain-grade hash integrity</p>
                                </div>
                            </div>
                        ) : error ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-6"
                            >
                                <div className="mx-auto h-24 w-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center ring-8 ring-red-50/50 dark:ring-red-900/10">
                                    <XCircle className="h-12 w-12 text-red-500" />
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Verification Failed</h2>
                                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                        {error}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-red-100 dark:border-red-900/20">
                                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg text-xs text-red-600 dark:text-red-400 font-mono break-all">
                                        ID: {invoiceId}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-2">
                                        If you believe this is an error, please contact support with the ID above.
                                    </p>
                                </div>

                                <Link to="/">
                                    <Button variant="outline" className="w-full mt-4">Return Home</Button>
                                </Link>
                            </motion.div>
                        ) : data ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                {/* Success Icon */}
                                <div className="text-center">
                                    <div className="mx-auto h-24 w-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center ring-8 ring-emerald-50/50 dark:ring-emerald-900/10 mb-4">
                                        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Valid Invoice</h2>
                                    <p className="text-xs text-muted-foreground">Signed & Verified by NoteVault</p>
                                </div>

                                {/* Details Grid */}
                                <div className="grid gap-3 bg-muted/30 p-4 rounded-xl border border-muted-foreground/10">
                                    <div className="flex items-center justify-between py-2 border-b border-muted-foreground/10 last:border-0">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" /> Date
                                        </div>
                                        <span className="font-semibold text-sm">
                                            {format(new Date(data.issuedAt), 'MMM dd, yyyy')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2 border-b border-muted-foreground/10 last:border-0">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <User className="h-4 w-4" /> To
                                        </div>
                                        <div className="text-right">
                                            <span className="font-mono text-sm block">{data.buyerRef}</span>
                                            <span className="text-[10px] text-muted-foreground">Privacy Masked</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-2 border-b border-muted-foreground/10 last:border-0">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FileText className="h-4 w-4" /> Item
                                        </div>
                                        <span className="font-semibold text-sm truncate max-w-[150px]">
                                            {data.item.title}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            Amount
                                        </div>
                                        <span className="font-bold text-lg text-foreground">
                                            ₹{data.amount}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-[10px] text-center text-muted-foreground font-mono opacity-50">
                                    SHA-256 SIGNATURE VALIDATED
                                    <br />
                                    {invoiceId}
                                </div>

                            </motion.div>
                        ) : null}
                    </CardContent>
                </Card>

                {/* Footer Trust */}
                <div className="mt-8 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Secure Verification System v1.1
                    </p>
                    <div className="flex justify-center gap-4 text-xs text-muted-foreground/70">
                        <span>End-to-End Encrypted</span>
                        <span>•</span>
                        <span>Tamper Proof</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
