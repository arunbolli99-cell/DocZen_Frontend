import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Trash2, Plus, Square } from "lucide-react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { cn } from "../../lib/utils";
import Typewriter from "../../components/Typewriter";
import "./Chat.css";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState(() => localStorage.getItem("doczen_chat_input") || "");
    const [isTyping, setIsTyping] = useState(false);
    const { refreshUser } = useAuth();
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get("tools/ai-chat/history/");
                if (response.data?.success) {
                    setMessages(response.data.history);
                }
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Persist input
    useEffect(() => {
        if (input) localStorage.setItem("doczen_chat_input", input);
        else localStorage.removeItem("doczen_chat_input");
    }, [input]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            role: "user",
            text: input.trim(),
        };

        // Prepare history format for API
        const history = messages.map((m) => ({
            role: m.role,
            text: m.text,
        }));

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        localStorage.removeItem("doczen_chat_input");
        setIsTyping(true);
        
        // Setup AbortController
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        try {
            const response = await api.post("tools/ai-chat/", {
                message: userMessage.text,
                history: history,
            }, { signal: abortControllerRef.current.signal });

            if (response.data?.success) {
                const modelMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "model",
                    text: response.data.result.reply,
                };
                setMessages((prev) => [...prev, modelMessage]);
                refreshUser();
            } else {
                toast.error("Failed to get a response from the AI.");
            }
        } catch (error) {
            if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
                console.log("Chat request aborted");
                return; // Silently exit on stop
            }
            console.error("Chat API Error:", error);
            if (error.response?.status === 429) {
                toast.error(error.response.data?.message || "AI daily limit reached. Please try again tomorrow!");
            } else {
                toast.error("An error occurred while connecting to the AI.");
            }
        } finally {
            setIsTyping(false);
            abortControllerRef.current = null;
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsTyping(false);
            toast.success("AI Generation stopped.");
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        toast.success("Started a new session.");
    };

    const handleClear = async () => {
        try {
            const response = await api.delete("tools/ai-chat/history/");
            if (response.data?.success) {
                setMessages([]);
                toast.success("Chat history cleared.");
            }
        } catch (error) {
            console.error("Failed to clear chat history:", error);
            toast.error("An error occurred while clearing history.");
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="chat-container"
        >
            <motion.div variants={itemVariants} className="chat-header">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <motion.div
                            initial={{ rotate: -20, scale: 0.8 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            <Bot className="w-6 h-6 text-primary" />
                        </motion.div>
                        <div className="flex gap-x-2">
                            {"AI Chat Assistant".split(" ").map((word, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, x: -10, filter: "blur(8px)" }}
                                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                    transition={{
                                        duration: 0.6,
                                        delay: 0.5 + (i * 0.1),
                                        ease: "easeOut"
                                    }}
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </div>
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Powered by advanced large language models
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all text-sm font-medium border border-primary/20"
                        title="Start New Chat"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Chat</span>
                    </button>
                    {messages.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-destructive transition-colors"
                            title="Clear Chat History"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Messages Area */}
            <motion.div variants={itemVariants} className="chat-messages">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <Bot className="w-16 h-16 text-primary mb-4" />
                        <p className="text-lg font-medium text-white max-w-md">
                            How can I help you today? Ask me anything, from code generation to creative writing.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className={`message-row ${msg.role === "user" ? "message-row-user" : "message-row-model"}`}
                            >
                                <div className={`message-avatar ${msg.role === "user" ? "message-avatar-user" : "message-avatar-model"}`}>
                                    {msg.role === "user" ? (
                                        <User className="w-4 h-4" />
                                    ) : (
                                        <Bot className="w-4 h-4" />
                                    )}
                                </div>
                                <div
                                    className={cn(
                                        "message-bubble",
                                        msg.role === "user" ? "message-user" : "message-model"
                                    )}
                                >
                                    <p className="whitespace-pre-wrap">
                                        {msg.role === "model" && msg.id === messages[messages.length - 1]?.id ? (
                                            <Typewriter text={msg.text} speed={15} onComplete={scrollToBottom} />
                                        ) : (
                                            msg.text
                                        )}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="message-row message-row-model"
                    >
                        <div className="message-avatar message-avatar-model">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="message-bubble message-model flex gap-2 items-center">
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                                className="w-2 h-2 rounded-full bg-primary"
                            />
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                                className="w-2 h-2 rounded-full bg-primary"
                            />
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                                className="w-2 h-2 rounded-full bg-primary"
                            />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </motion.div>

            <motion.div variants={itemVariants} className="chat-input-wrapper">
                <form
                    onSubmit={handleSend}
                    className="chat-input-container"
                >
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type your message..."
                        className="chat-input"
                        rows={1}
                    />
                    {isTyping ? (
                        <button
                            type="button"
                            onClick={handleStop}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-destructive hover:bg-destructive/90 flex items-center justify-center text-white transition-colors z-10 shadow-lg shadow-destructive/20"
                            title="Stop Response"
                        >
                            <Square className="w-4 h-4 fill-white" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary flex items-center justify-center text-white transition-colors z-10"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    )}
                </form>
                <p className="text-center text-xs text-muted-foreground mt-3">
                    AI generated content may be inaccurate. Verify important information.
                </p>
            </motion.div>
        </motion.div>
    );
}
