import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import './MessageBubble.css';

const MessageBubble = ({ message, delay = 0 }) => {
    const isUser = message.type === 'user';
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
                duration: 0.4, 
                delay,
                type: "spring",
                stiffness: 500,
                damping: 30
            }}
            className={`message-bubble ${isUser ? 'user-message' : 'ai-message'}`}
        >
            <div className="message-avatar">
                {isUser ? (
                    <User size={18} />
                ) : (
                    <Bot size={18} />
                )}
            </div>
            
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.1 }}
                className="message-content"
            >
                <div className="message-text">
                    {message.content}
                </div>
                <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MessageBubble;
