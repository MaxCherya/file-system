'use client';

import { motion } from 'framer-motion';

export default function Loader() {
    return (
        <div className="flex items-center justify-center w-full h-full py-10 z-[9999]">
            <motion.div
                className="relative flex items-center justify-center w-16 h-16"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            >
                <div className="absolute w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </motion.div>
        </div>
    );
}