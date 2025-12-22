import React from 'react';
import { motion } from 'framer-motion';

// GOD-LEVEL CERAMIC PHYSICS
// High stiffness, no bounce, snappy but fluid.
const ceramicPhysics = {
    type: "spring",
    stiffness: 300,
    damping: 30, // Critique: 30 is high enough to kill bounce
    mass: 1
} as const;

const pageVariants = {
    initial: {
        opacity: 0,
        y: 12, // Slight upstream drift (12px)
        scale: 0.995 // Subtle depth effect
    },
    in: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            ...ceramicPhysics,
            staggerChildren: 0.1
        }
    },
    out: {
        opacity: 0,
        y: -12, // Drift up when leaving
        scale: 0.995,
        transition: {
            ...ceramicPhysics,
            when: "afterChildren" // Ensure content fades before page leaves
        }
    }
};

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            className={className}
            style={{ width: '100%' }} // Ensure it takes full width
        >
            {children}
        </motion.div>
    );
};
