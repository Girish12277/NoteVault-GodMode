import React from 'react';
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "../../pages/Index";
import Auth from "../../pages/Auth";
import ForgotPassword from "../../pages/ForgotPassword";
import ResetPassword from "../../pages/ResetPassword";
import Onboarding from "../../pages/Onboarding";
import Browse from "../../pages/Browse";
import NotificationHistory from "@/pages/notifications/NotificationHistory";
import NoteDetail from "../../pages/NoteDetail";
import Cart from "../../pages/Cart";
import Checkout from "../../pages/Checkout";
import Wishlist from "../../pages/Wishlist";
import Account from "../../pages/Account";
import Library from "../../pages/Library";
import HowItWorks from "../../pages/HowItWorks";
import RefundPolicy from "../../pages/RefundPolicy";
import About from "../../pages/About";
import Contact from "../../pages/Contact";
import Terms from "../../pages/Terms";
import Privacy from "../../pages/Privacy";
import { Guarantee } from "../../pages/Guarantee";
import Categories from "../../pages/Categories";
import Universities from "../../pages/Universities";
import PaymentSuccess from "../../pages/PaymentSuccess";
import PaymentFailed from "../../pages/PaymentFailed";
import SellerDashboard from "../../pages/seller/SellerDashboard";
import UploadNotes from "../../pages/seller/UploadNotes";
import MyNotes from "../../pages/seller/MyNotes";
import EditNote from "../../pages/seller/EditNote";
import Wallet from "../../pages/seller/Wallet";
import Analytics from "../../pages/seller/Analytics";
import SellerSettings from "../../pages/seller/SellerSettings";
import SellerGuidelines from "../../pages/seller/SellerGuidelines";
import SellerFAQ from "../../pages/seller/SellerFAQ";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import AdminUsers from "../../pages/admin/AdminUsers";
import AdminContent from "../../pages/admin/AdminContent";
import AdminFinance from "../../pages/admin/AdminFinance";
import AdminDisputes from "../../pages/admin/AdminDisputes";
import AdminAnalytics from "../../pages/admin/AdminAnalytics";
import AdminSettings from "../../pages/admin/AdminSettings";
import AdminCoupons from "../../pages/admin/AdminCoupons";
import AdminNotifications from "../../pages/admin/AdminNotifications";
import AdminMessages from "../../pages/admin/AdminMessages";
import NotificationDetails from '@/pages/notifications/NotificationDetails';
import InvoiceVerifier from "../../pages/public/InvoiceVerifier";
import SellerProfile from '@/pages/SellerProfile';
import Messages from '@/pages/Messages';
import NotFound from "../../pages/NotFound";
import ProtectedRoute from "../../components/ProtectedRoute";
import { PageTransition } from './PageTransition';

export const AnimatedRoutes: React.FC = () => {
    const location = useLocation();

    return (
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
    );
};
