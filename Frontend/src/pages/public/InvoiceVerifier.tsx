
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ShieldCheck, Loader2, FileText, Calendar, User, Copy, Check, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { format } from 'date-fns';

// ==================== TYPES ====================

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

interface VerificationState {
    loading: boolean;
    data: VerificationData | null;
    error: string | null;
    warning: string | null;
    retryCount: number;
    cached: boolean;
}

interface DetailRowProps {
    icon: React.ElementType;
    label: string;
    value: string;
    subtext?: string;
    copyable?: boolean;
}

// ==================== UTILITY FUNCTIONS ====================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Validation
const validateSignature = (sig: string): boolean => /^[a-f0-9]{64}$/i.test(sig);
const validateInvoiceId = (id: string): boolean => /^[a-zA-Z0-9_-]{1,50}$/.test(id);

// URL Sanitization
const sanitizeUrl = (baseUrl: string): string => {
    return baseUrl
        .trim()
        .replace(/\/$/, '')
        .replace(/\/api\/?$/, '')
        .replace(/[^a-zA-Z0-9:/.%-]/g, '');
};

// Cache helpers
const getCacheKey = (invoiceId: string, sig: string): string =>
    `invoice_verify_${invoiceId}_${sig}`;

const getFromCache = (invoiceId: string, sig: string): VerificationData | null => {
    try {
        const cached = sessionStorage.getItem(getCacheKey(invoiceId, sig));
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
            sessionStorage.removeItem(getCacheKey(invoiceId, sig));
        }
    } catch (e) {
        console.error('Cache read error:', e);
    }
    return null;
};

const setCache = (invoiceId: string, sig: string, data: VerificationData): void => {
    try {
        sessionStorage.setItem(
            getCacheKey(invoiceId, sig),
            JSON.stringify({ data, timestamp: Date.now() })
        );
    } catch (e) {
        console.error('Cache write error:', e);
    }
};

// Response validation
const isValidData = (data: any): data is VerificationData => {
    return (
        data &&
        typeof data.isValid === 'boolean' &&
        typeof data.invoiceId === 'string' &&
        typeof data.amount === 'string' &&
        data.item &&
        typeof data.item.title === 'string'
    );
};

// ==================== SUB-COMPONENTS ====================

function DetailRow({ icon: Icon, label, value, subtext, copyable = false }: DetailRowProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        if (!copyable) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [copyable, value]);

    return (
        <motion.div
            onClick={handleCopy}
            className={`flex items-center justify-between py-2 border-b border-muted-foreground/10 last:border-0 ${copyable ? 'cursor-pointer hover:bg-muted/30 px-2 -mx-2 rounded transition-colors' : ''
                }`}
            whileTap={copyable ? { scale: 0.98 } : {}}
        >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <div className="text-right flex items-center gap-2">
                <div>
                    <span className="font-semibold text-sm block">{value}</span>
                    {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
                </div>
                {copyable && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: copied ? 1 : 0, scale: copied ? 1 : 0 }}
                        className="text-accent"
                    >
                        <Check className="h-3 w-3" />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

// ==================== MAIN COMPONENT ====================

export default function InvoiceVerifier() {
    const { invoiceId } = useParams();
    const [searchParams] = useSearchParams();
    const sig = searchParams.get('sig');

    const abortControllerRef = useRef<AbortController | null>(null);

    const [state, setState] = useState<VerificationState>({
        loading: true,
        data: null,
        error: null,
        warning: null,
        retryCount: 0,
        cached: false,
    });

    // Exponential backoff verification
    const attemptVerification = useCallback(async (retryNum: number): Promise<void> => {
        // Input validation
        if (!invoiceId || !validateInvoiceId(invoiceId)) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Invalid invoice ID format. Please check the QR code.',
            }));
            return;
        }

        if (!sig || !validateSignature(sig)) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Invalid signature format. This QR code may be corrupted.',
            }));
            return;
        }

        // Cache check
        const cachedData = getFromCache(invoiceId, sig);
        if (cachedData && retryNum === 0) {
            setState(prev => ({
                ...prev,
                loading: false,
                data: cachedData,
                cached: true,
            }));
            return;
        }

        try {
            // Setup abort controller
            abortControllerRef.current = new AbortController();

            // Build API URL with sanitization and encoding
            let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            baseUrl = sanitizeUrl(baseUrl);
            const apiUrl = `${baseUrl}/api/public/verify/invoice/${encodeURIComponent(invoiceId)}?sig=${encodeURIComponent(sig)}`;

            setState(prev => ({
                ...prev,
                warning: retryNum > 0 ? `Retrying... (Attempt ${retryNum + 1}/${MAX_RETRIES})` : null,
            }));

            const response = await axios.get(apiUrl, {
                signal: abortControllerRef.current.signal,
                timeout: 10000,
            });

            if (response.data?.success && isValidData(response.data.data)) {
                const verifiedData = response.data.data;
                setCache(invoiceId, sig, verifiedData);
                setState(prev => ({
                    ...prev,
                    loading: false,
                    data: verifiedData,
                    error: null,
                    warning: null,
                    cached: false,
                }));
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (err: any) {
            // Error classification
            const isNetworkError = !err.response || err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK';
            const isValidationError = err.response?.status === 400;
            const isNotFoundError = err.response?.status === 404;
            const isServerError = err.response?.status >= 500;
            const shouldRetry = retryNum < MAX_RETRIES && (isNetworkError || isServerError);

            if (shouldRetry) {
                const delay = RETRY_DELAY * Math.pow(2, retryNum);
                await new Promise(resolve => setTimeout(resolve, delay));
                return attemptVerification(retryNum + 1);
            }

            // User-friendly error messages
            let errorMessage = 'Unable to verify invoice. Please try again.';
            if (isNotFoundError) {
                errorMessage = 'Invoice not found. Please check the QR code is correct.';
            } else if (isValidationError) {
                errorMessage = 'Possible tampering detected. The signature is invalid.';
            } else if (isNetworkError) {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (isServerError) {
                errorMessage = 'Server error. Please try again in a few moments.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }

            setState(prev => ({
                ...prev,
                loading: false,
                error: errorMessage,
                warning: null,
                retryCount: retryNum,
            }));
        }
    }, [invoiceId, sig]);

    useEffect(() => {
        attemptVerification(0);

        return () => {
            abortControllerRef.current?.abort();
        };
    }, [attemptVerification]);

    const handleRetry = useCallback(() => {
        setState({
            loading: true,
            data: null,
            error: null,
            warning: null,
            retryCount: 0,
            cached: false,
        });
        attemptVerification(0);
    }, [attemptVerification]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-card opacity-30 pointer-events-none" />

            <div className="relative w-full max-w-md">
                {/* Header Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold font-display tracking-tight hover:opacity-80 transition-opacity">
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <ShieldCheck className="h-8 w-8 text-primary" />
                        </div>
                        NoteVault
                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-bold -mt-4 -ml-1">Verify</span>
                    </Link>
                </div>

                <Card className="border-none shadow-2xl bg-white/50 dark:bg-black/50 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-sm font-medium font-display uppercase tracking-widest text-muted-foreground">
                            Cryptographic Verification
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-6 md:p-6 pt-4">
                        <AnimatePresence mode="wait">
                            {state.loading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-12 space-y-6"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                        <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-lg sm:text-xl font-bold">Verifying Signature...</h3>
                                        <p className="text-sm text-muted-foreground">Checking cryptographic signature integrity</p>
                                        {state.warning && (
                                            <p className="text-xs text-warning mt-2">{state.warning}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ) : state.error ? (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="text-center space-y-6"
                                >
                                    <div className="mx-auto h-24 w-24 bg-destructive/10 dark:bg-destructive/20 rounded-full flex items-center justify-center ring-8 ring-destructive/10 dark:ring-destructive/20">
                                        <XCircle className="h-12 w-12 text-destructive" />
                                    </div>

                                    <div className="space-y-2">
                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-destructive">Verification Failed</h2>
                                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                            {state.error}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-destructive/10 dark:border-destructive/20">
                                        <div className="bg-destructive/5 dark:bg-destructive/10 p-3 rounded-lg text-xs text-destructive font-mono break-all">
                                            ID: {invoiceId}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            If you believe this is an error, please contact <a href="mailto:support@notevault.com" className="text-primary hover:underline">support@notevault.com</a> with the ID above.
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link to="/" className="flex-1">
                                            <Button variant="outline" className="w-full btn-touch">Return Home</Button>
                                        </Link>
                                        <Button onClick={handleRetry} className="flex-1 btn-touch bg-primary hover:bg-primary/90">
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Retry
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : state.data ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-6"
                                >
                                    {/* Success Icon */}
                                    <div className="text-center">
                                        <div className="mx-auto h-24 w-24 bg-accent/10 dark:bg-accent/20 rounded-full flex items-center justify-center ring-8 ring-accent/10 dark:ring-accent/20 mb-4">
                                            <CheckCircle2 className="h-12 w-12 text-accent" />
                                        </div>
                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">Valid Invoice</h2>
                                        <p className="text-xs text-muted-foreground">
                                            Signed & Verified by NoteVault
                                            {state.cached && ' • Cached'}
                                        </p>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid gap-3 bg-muted/30 p-4 rounded-xl border border-muted-foreground/10">
                                        <DetailRow
                                            icon={Calendar}
                                            label="Date"
                                            value={format(new Date(state.data.issuedAt), 'MMM dd, yyyy')}
                                        />
                                        <DetailRow
                                            icon={User}
                                            label="To"
                                            value={state.data.buyerRef}
                                            subtext="Privacy Masked"
                                            copyable
                                        />
                                        <DetailRow
                                            icon={FileText}
                                            label="Item"
                                            value={state.data.item.title}
                                        />
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                Amount
                                            </div>
                                            <span className="font-bold text-lg text-foreground">
                                                ₹{state.data.amount}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-center text-muted-foreground opacity-50">
                                        <span className="font-mono">SHA-256 SIGNATURE VALIDATED</span>
                                        <br />
                                        <span className="font-mono">{invoiceId}</span>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* Footer Trust */}
                <div className="mt-8 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Secure Verification System v2.0
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
