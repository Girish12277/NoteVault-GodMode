import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from 'lucide-react';
import ProtectedRoute from "../../components/ProtectedRoute";
import { PageTransition } from './PageTransition';

// Lazy load all page components for better performance
const Index = lazy(() => import("../../pages/Index"));
const Auth = lazy(() => import("../../pages/Auth"));
const ForgotPassword = lazy(() => import("../../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../../pages/ResetPassword"));
const Onboarding = lazy(() => import("../../pages/Onboarding"));
const Browse = lazy(() => import("../../pages/Browse"));
const NotificationHistory = lazy(() => import("@/pages/notifications/NotificationHistory"));
const NoteDetail = lazy(() => import("../../pages/NoteDetail"));
const Cart = lazy(() => import("../../pages/Cart"));
const Checkout = lazy(() => import("../../pages/Checkout"));
const Wishlist = lazy(() => import("../../pages/Wishlist"));
const Account = lazy(() => import("../../pages/Account"));
const Library = lazy(() => import("../../pages/Library"));
const HowItWorks = lazy(() => import("../../pages/HowItWorks"));
const RefundPolicy = lazy(() => import("../../pages/RefundPolicy"));
const About = lazy(() => import("../../pages/About"));
const Contact = lazy(() => import("../../pages/Contact"));
const Terms = lazy(() => import("../../pages/Terms"));
const Privacy = lazy(() => import("../../pages/Privacy"));
const Guarantee = lazy(() => import("../../pages/Guarantee").then(module => ({ default: module.Guarantee })));
const Categories = lazy(() => import("../../pages/Categories"));
const Universities = lazy(() => import("../../pages/Universities"));
const PaymentSuccess = lazy(() => import("../../pages/PaymentSuccess"));
const PaymentFailed = lazy(() => import("../../pages/PaymentFailed"));
const SellerDashboard = lazy(() => import("../../pages/seller/SellerDashboard"));
const UploadNotes = lazy(() => import("../../pages/seller/UploadNotes"));
const MyNotes = lazy(() => import("../../pages/seller/MyNotes"));
const EditNote = lazy(() => import("../../pages/seller/EditNote"));
const Wallet = lazy(() => import("../../pages/seller/Wallet"));
const Analytics = lazy(() => import("../../pages/seller/Analytics"));
const SellerSettings = lazy(() => import("../../pages/seller/SellerSettings"));
const SellerGuidelines = lazy(() => import("../../pages/seller/SellerGuidelines"));
const SellerFAQ = lazy(() => import("../../pages/seller/SellerFAQ"));
const AdminDashboard = lazy(() => import("../../pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("../../pages/admin/AdminUsers"));
const AdminContent = lazy(() => import("../../pages/admin/AdminContent"));
const AdminFinance = lazy(() => import("../../pages/admin/AdminFinance"));
const AdminDisputes = lazy(() => import("../../pages/admin/AdminDisputes"));
const AdminAnalytics = lazy(() => import("../../pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("../../pages/admin/AdminSettings"));
const AdminCoupons = lazy(() => import("../../pages/admin/AdminCoupons"));
const AdminNotifications = lazy(() => import("../../pages/admin/AdminNotifications"));
const AdminMessages = lazy(() => import("../../pages/admin/AdminMessages"));
const NotificationDetails = lazy(() => import('@/pages/notifications/NotificationDetails'));
const InvoiceVerifier = lazy(() => import("../../pages/public/InvoiceVerifier"));
const SellerProfile = lazy(() => import('@/pages/SellerProfile'));
const Messages = lazy(() => import('@/pages/Messages'));
const BTechHub = lazy(() => import('@/pages/hubs/BTechHub'));
const NotFound = lazy(() => import("../../pages/NotFound"));

// Loading fallback component
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
    </div>
);

export const AnimatedRoutes: React.FC = () => {
    const location = useLocation();

    return (
        <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait" initial={false}>
                <Routes location={location} key={location.pathname}>
                    {/* PUBLIC ROUTES */}
                    <Route path="/" element={<PageTransition><Index /></PageTransition>} />
                    <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
                    <Route path="/verify/:invoiceId" element={<PageTransition><InvoiceVerifier /></PageTransition>} />
                    <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
                    <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
                    <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
                    <Route path="/browse" element={<PageTransition><Browse /></PageTransition>} />
                    <Route path="/notes/:id" element={<PageTransition><NoteDetail /></PageTransition>} />
                    <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
                    <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
                    <Route path="/wishlist" element={<PageTransition><Wishlist /></PageTransition>} />
                    <Route path="/account" element={<PageTransition><Account /></PageTransition>} />
                    <Route path="/library" element={<PageTransition><Library /></PageTransition>} />
                    <Route path="/how-it-works" element={<PageTransition><HowItWorks /></PageTransition>} />
                    <Route path="/refund" element={<PageTransition><RefundPolicy /></PageTransition>} />
                    <Route path="/guarantee" element={<PageTransition><Guarantee /></PageTransition>} />
                    <Route path="/about" element={<PageTransition><About /></PageTransition>} />
                    <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
                    <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
                    <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
                    <Route path="/categories" element={<PageTransition><Categories /></PageTransition>} />
                    <Route path="/universities" element={<PageTransition><Universities /></PageTransition>} />
                    <Route path="/payment/success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
                    <Route path="/payment/failed" element={<PageTransition><PaymentFailed /></PageTransition>} />

                    {/* HUB PAGES */}
                    <Route path="/hub/btech" element={<PageTransition><BTechHub /></PageTransition>} />

                    {/* SELLER ROUTES */}
                    <Route path="/seller" element={<PageTransition><SellerDashboard /></PageTransition>} />
                    <Route path="/seller/upload" element={<PageTransition><UploadNotes /></PageTransition>} />
                    <Route path="/seller/notes" element={<PageTransition><MyNotes /></PageTransition>} />
                    <Route path="/seller/notes/edit/:id" element={<PageTransition><EditNote /></PageTransition>} />
                    <Route path="/seller/wallet" element={<PageTransition><Wallet /></PageTransition>} />
                    <Route path="/seller/analytics" element={<PageTransition><Analytics /></PageTransition>} />
                    <Route path="/seller/settings" element={<PageTransition><SellerSettings /></PageTransition>} />
                    <Route path="/seller/guidelines" element={<PageTransition><SellerGuidelines /></PageTransition>} />
                    <Route path="/seller/faq" element={<PageTransition><SellerFAQ /></PageTransition>} />
                    <Route path="/profile/:userId" element={<PageTransition><SellerProfile /></PageTransition>} />

                    {/* ADMIN ROUTES */}
                    <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
                    <Route path="/admin/users" element={<PageTransition><AdminUsers /></PageTransition>} />
                    <Route path="/admin/content" element={<PageTransition><AdminContent /></PageTransition>} />
                    <Route path="/admin/coupons" element={<PageTransition><AdminCoupons /></PageTransition>} />
                    <Route path="/admin/notifications" element={<PageTransition><AdminNotifications /></PageTransition>} />
                    <Route path="/admin/messages" element={<PageTransition><AdminMessages /></PageTransition>} />
                    <Route path="/admin/finance" element={<PageTransition><AdminFinance /></PageTransition>} />
                    <Route path="/admin/disputes" element={<PageTransition><AdminDisputes /></PageTransition>} />
                    <Route path="/admin/analytics" element={<PageTransition><AdminAnalytics /></PageTransition>} />
                    <Route path="/admin/settings" element={<PageTransition><AdminSettings /></PageTransition>} />

                    {/* NOTIFICATIONS & MESSAGES */}
                    <Route path="/notifications" element={<PageTransition><NotificationHistory /></PageTransition>} />
                    <Route path="/messages" element={
                        <ProtectedRoute>
                            <PageTransition><Messages /></PageTransition>
                        </ProtectedRoute>
                    } />
                    <Route path="/notifications/:id" element={
                        <ProtectedRoute>
                            <PageTransition><NotificationDetails /></PageTransition>
                        </ProtectedRoute>
                    } />

                    {/* 404 */}
                    <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                </Routes>
            </AnimatePresence>
        </Suspense>
    );
};
