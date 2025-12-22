/**
 * OfflineBanner Component
 * Displays a banner when user loses network connectivity
 */

import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineBanner({ isOnline }: { isOnline: boolean }) {
    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 text-center shadow-lg"
                >
                    <div className="container flex items-center justify-center gap-2 text-sm font-medium">
                        <WifiOff className="h-4 w-4" />
                        <span>No internet connection. Some features may not work.</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
