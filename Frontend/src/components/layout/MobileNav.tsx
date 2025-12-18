import { Home, Search, Heart, User, Sparkles } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function MobileNav() {
    const location = useLocation();

    // Haptics Helper
    const triggerHaptic = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    const navItems = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/browse', icon: Search, label: 'Browse' },
        { href: '/wishlist', icon: Heart, label: 'Wishlist' },
        { href: '/account', icon: User, label: 'Profile' }
    ];

    return (
        <motion.nav
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-6 left-4 right-4 z-50 lg:hidden"
        >
            {/* LEVITATION DECK CONTAINER */}
            <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                <div className="flex h-16 items-center justify-around px-2 relative overflow-hidden rounded-2xl">

                    {/* Background Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />

                    {navItems.map(({ href, icon: Icon, label }) => {
                        const isActive = location.pathname === href;

                        return (
                            <NavLink
                                key={href}
                                to={href}
                                onClick={triggerHaptic}
                                className={cn(
                                    "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-all duration-300",
                                    isActive ? "text-primary" : "text-muted-foreground/60 hover:text-muted-foreground"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-primary/10 rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}

                                <div className="relative z-10 flex flex-col items-center gap-0.5">
                                    <motion.div
                                        animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <Icon className={cn("h-5 w-5", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                                    </motion.div>

                                    <motion.span
                                        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.6, y: 2 }}
                                        className="text-[10px]"
                                    >
                                        {label}
                                    </motion.span>
                                </div>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </motion.nav>
    );
}
