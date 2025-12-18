import React from 'react';
import { motion } from 'framer-motion';

interface SectionRevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export const SectionReveal: React.FC<SectionRevealProps> = ({ children, className, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }} // Trigger when 10% visible
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: delay,
                mass: 1
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
