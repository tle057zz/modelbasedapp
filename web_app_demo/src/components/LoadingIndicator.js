import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import './LoadingIndicator.css';

const LoadingIndicator = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="loading-indicator"
        >
            <div className="loading-avatar">
                <Bot size={18} />
            </div>
            
            <div className="loading-content">
                <div className="typing-animation">
                    <motion.div
                        className="typing-dot"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                        className="typing-dot"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                        className="typing-dot"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    />
                </div>
                <div className="loading-text">AI is thinking...</div>
            </div>
        </motion.div>
    );
};

export default LoadingIndicator;
