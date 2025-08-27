import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';
import './ChatInterface.css';

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        
        if (!inputValue.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: userMessage.content }),
            });

            const data = await response.json();
            
            // Simulate slight delay for better UX
            setTimeout(() => {
                const aiMessage = {
                    id: Date.now() + 1,
                    type: 'ai',
                    content: data.answer || 'I received your message!',
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, aiMessage]);
                setIsLoading(false);
            }, 1000);

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="chat-container glass-intense"
        >
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="chat-header"
            >
                <div className="header-icon">
                    <Sparkles size={24} />
                </div>
                <div className="header-text">
                    <h1>AI Assistant</h1>
                    <p>Powered by advanced language model</p>
                </div>
                <div className="status-indicator">
                    <div className="status-dot"></div>
                    <span>Online</span>
                </div>
            </motion.div>

            {/* Messages Area */}
            <div className="messages-container">
                <AnimatePresence>
                    {messages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="welcome-message"
                        >
                            <Bot size={48} className="welcome-icon" />
                            <h3>Welcome to AI Chat</h3>
                            <p>Ask me anything! I'm here to help and have a conversation with you.</p>
                        </motion.div>
                    )}
                    
                    {messages.map((message, index) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            delay={index * 0.1}
                        />
                    ))}
                    
                    {isLoading && <LoadingIndicator />}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <motion.form
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                onSubmit={sendMessage}
                className="input-form"
            >
                <div className="input-container">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                        className="message-input"
                        disabled={isLoading}
                    />
                    <motion.button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="send-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Send size={20} />
                    </motion.button>
                </div>
            </motion.form>
        </motion.div>
    );
};

export default ChatInterface;
