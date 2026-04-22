import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Eraser, Check, Copy, Loader2, Sparkles, Wand2, Info } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { cn } from "../../lib/utils";
import { useToolAccess } from "../../hooks/useToolAccess";
import "./GrammarChecker.css";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function GrammarCheckerPage() {
    const [text, setText] = useState(() => localStorage.getItem("doczen_grammar_text") || "");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(() => {
        const savedResult = localStorage.getItem("doczen_grammar_result");
        try {
            return savedResult ? JSON.parse(savedResult) : null;
        } catch (e) {
            return null;
        }
    });
    const [viewMode, setViewMode] = useState("diff"); // "diff" or "final"
    const [copied, setCopied] = useState(false);
    const { user, refreshUser } = useAuth();
    const { checkAccess } = useToolAccess();
    const location = useLocation();

    useEffect(() => {
        const historyId = location.state?.historyId;
        if (historyId) {
            fetchSpecificHistory(historyId);
        }
    }, [location.state]);

    // Save to persistence
    useEffect(() => {
        if (text) localStorage.setItem("doczen_grammar_text", text);
        else localStorage.removeItem("doczen_grammar_text");
        
        if (result) localStorage.setItem("doczen_grammar_result", JSON.stringify(result));
        else localStorage.removeItem("doczen_grammar_result");
    }, [text, result]);

    const fetchSpecificHistory = async (id) => {
        if (!user) return;
        try {
            const response = await api.get(`tools/text/history/detail/${id}/`);
            if (response.data) {
                setText(response.data.input_text);
                setResult(response.data.output_result);
                toast.success("Loaded from history.");
            }
        } catch (error) {
            console.error("Failed to fetch specific history:", error);
            toast.error("Could not load history detail.");
        }
    };

    const handleCheck = async () => {
        if (!checkAccess()) return;
        if (!text.trim()) return;
        setIsLoading(true);
        setResult(null);

        try {
            const response = await api.post("tools/text/grammar/", { text: text });
            if (response.data?.success) {
                setResult(response.data.result);
                toast.success("Grammar check completed!");
                refreshUser();
            } else {
                toast.error("Failed to check grammar.");
            }
        } catch (error) {
            console.error("Grammar API Error:", error);
            if (error.response?.status === 429) {
                toast.error(error.response.data?.message || "AI daily limit reached. Please try again tomorrow!");
            } else {
                toast.error("An error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.corrected_text);
        setCopied(true);
        toast.success("Corrected text copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setText("");
        setResult(null);
        localStorage.removeItem("doczen_grammar_text");
        localStorage.removeItem("doczen_grammar_result");
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grammar-container"
        >
            <motion.div variants={itemVariants} className="grammar-header">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Wand2 className="w-8 h-8 text-primary" />
                        Grammar <span className="text-gradient">Checker</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Advanced AI-powered proofreading and linguistic correction.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all text-sm border border-white/5"
                    >
                        <Eraser className="w-4 h-4" /> Clear
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-8">
                <motion.div variants={itemVariants} className="grammar-card">
                    <div className="relative">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste your text here to check for grammar, spelling, and style improvements..."
                            className="grammar-textarea min-h-[250px]"
                        />
                        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                            {text.length} characters
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleCheck}
                            disabled={!text.trim() || isLoading}
                            className="px-8 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                            Check Grammar
                        </button>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex flex-col gap-6"
                        >
                                {/* Corrections Panel */}
                                <div className="grammar-card border-primary/20">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-primary" />
                                            Mistakes Detected
                                        </h3>
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                                            {result.changes_made?.length || 0} Improvements
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {result.changes_made?.map((change, i) => (
                                            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3 group">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                                                <p className="text-sm text-white/80 leading-relaxed font-medium">{change}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Corrected Text Panel */}
                                <div className="grammar-card">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Check className="w-5 h-5 text-emerald-500" />
                                            Proofread Result
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setViewMode("diff")}
                                                className={cn(
                                                    "px-3 py-1 rounded-lg text-xs font-bold transition-all border",
                                                    viewMode === "diff" 
                                                        ? "bg-primary text-white border-primary" 
                                                        : "bg-white/5 text-muted-foreground border-white/5 hover:text-white"
                                                )}
                                            >
                                                Track Changes
                                            </button>
                                            <button
                                                onClick={() => setViewMode("final")}
                                                className={cn(
                                                    "px-3 py-1 rounded-lg text-xs font-bold transition-all border",
                                                    viewMode === "final" 
                                                        ? "bg-primary text-white border-primary" 
                                                        : "bg-white/5 text-muted-foreground border-white/5 hover:text-white"
                                                )}
                                            >
                                                Final Text
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-black/40 border border-white/5 min-h-[250px]">
                                        {viewMode === "final" ? (
                                            <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
                                                {result.corrected_text}
                                            </p>
                                        ) : (
                                            <div className="text-base leading-relaxed whitespace-pre-wrap">
                                                {result.diffs.map((part, i) => (
                                                    <span 
                                                        key={i} 
                                                        className={cn(
                                                            part.type === "insertion" && "text-emerald-400 font-medium underline decoration-emerald-400/30 underline-offset-4",
                                                            part.type === "deletion" && "text-rose-400/50 line-through decoration-rose-400/30"
                                                        )}
                                                    >
                                                        {part.text}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Info className="w-3.5 h-3.5" />
                                            Final version is ready to use
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            className={cn(
                                                "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all text-sm font-bold border group",
                                                copied 
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                                    : "bg-white/5 text-white hover:bg-white/10 border-white/5"
                                            )}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-4 h-4" /> Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" /> Copy Final Text
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
