import React from 'react';
import { motion } from 'framer-motion';
import { Button, ButtonProps } from "@/components/ui/button";

// Tactile Tap Physics: Scale down slightly
const tapAnimation = {
    scale: 0.96, // Subtle "press" feel
    transition: { type: "spring", stiffness: 400, damping: 10 }
};

const hoverAnimation = {
    y: -1, // Micro-lift
    transition: { type: "spring", stiffness: 300, damping: 20 }
};

// Create a Motion component from the Shadcn Button
const MotionBtn = motion(Button);

export const MotionButton: React.FC<ButtonProps & React.ComponentProps<typeof motion.button>> = (props) => {
    return (
        <MotionBtn
            whileTap={tapAnimation}
            whileHover={hoverAnimation}
            {...props}
        />
    );
};
