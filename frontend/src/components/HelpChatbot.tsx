'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, User, ShieldCheck } from 'lucide-react';

interface IMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

export default function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<IMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am your FreshKart AI Assistant. How can I help you with your groceries or orders today?',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleQuickReply = (topic: string) => {
    // Add user reply message
    const userMsg: IMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: topic,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    triggerAIResponse(topic);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: IMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    const userQuery = input;
    setInput('');
    triggerAIResponse(userQuery);
  };

  const triggerAIResponse = (query: string) => {
    setIsTyping(true);
    
    // Semantic/keyword matching rules
    const q = query.toLowerCase();
    let reply = "I am here to guide you with coupons, refund details, order dispatching, and delivery slots. Try typing 'coupon' or 'free delivery'!";

    if (q.includes('free') || q.includes('delivery') || q.includes('shipping') || q.includes('charge')) {
      reply = "Delivery is absolutely FREE for orders above ₹500! For orders under ₹500, we apply a nominal shipping fee of ₹29.";
    } else if (q.includes('cancel') || q.includes('delete') || q.includes('stop')) {
      reply = "You can cancel any active order in your Profile Order History, provided it is in 'pending' or 'confirmed' status. Once driver packaging is completed, cancellation is locked.";
    } else if (q.includes('refund') || q.includes('money') || q.includes('cashback')) {
      reply = "FreshKart guarantees peak freshness! If you are unsatisfied, refunds are credited instantly. UPI / Wallet refunds take under 5 minutes; card refunds take 2-3 business days.";
    } else if (q.includes('coupon') || q.includes('code') || q.includes('discount') || q.includes('offer')) {
      reply = "Active promo coupons include:\n• WELCOME100: Flat ₹100 off above ₹499.\n• FRESH30: 30% off above ₹299 (max ₹120).\n• SUPERDEAL: 50% off above ₹599 (max ₹200).";
    } else if (q.includes('time') || q.includes('track') || q.includes('live') || q.includes('driver')) {
      reply = "Once you place an order, you will see a 'Live Track' button in your order history. You can trigger driver simulations and monitor live coordinate streams directly on the map!";
    }

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: reply,
          timestamp: new Date()
        }
      ]);
    }, 1500); // 1.5s typing delay to look realistic
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-xs">
      
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer relative group pulse-primary-glow"
        aria-label="Help Chatbot"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-slate-950 text-emerald-400 font-bold border border-emerald-500/30 text-[8px] px-1.5 py-0.5 rounded-full">
          AI
        </span>
      </button>

      {/* Slide-out Chat Panel dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 h-[460px] glass-card rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500 text-slate-950 p-1.5 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm text-white">FreshKart Assistant</h3>
                  <p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Online & Ready
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-850 rounded-xl"
              >
                <X className="w-4.5 h-4.5 text-slate-400" />
              </button>
            </div>

            {/* Chat Body messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar bg-slate-50/50 dark:bg-slate-950/20">
              {messages.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAI && (
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                        FK
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                        isAI
                          ? 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-slate-800 dark:text-slate-200'
                          : 'bg-emerald-500 text-slate-950 font-medium'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <span className="text-[8px] opacity-60 mt-1 block text-right">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator bubble */}
              {isTyping && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                    FK
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl px-4 py-3 flex gap-1 items-center justify-center h-9">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      ></span>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies suggestion chips */}
            {messages.length < 5 && (
              <div className="px-4 py-2 border-t border-slate-100/50 dark:border-slate-805 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                {['How to get free delivery?', 'Active coupons?', 'Refund policy?'].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleQuickReply(topic)}
                    className="flex-shrink-0 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl transition-all text-[10px] font-bold text-slate-700 dark:text-slate-350"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex gap-2 items-center"
            >
              <input
                type="text"
                placeholder="Ask chatbot about active deals..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-grow bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-150"
              />
              <button
                type="submit"
                className="p-2.5 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-600 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
