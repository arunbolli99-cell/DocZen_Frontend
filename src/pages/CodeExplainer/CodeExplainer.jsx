import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Wand2, Loader2, Play, Terminal } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "./CodeExplainer.css";

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

export default function CodeExplainerPage() {
    const [code, setCode] = useState(() => localStorage.getItem("doczen_explainer_code") || "");
    const [isExplaining, setIsExplaining] = useState(false);
    const [result, setResult] = useState(() => {
        const savedResult = localStorage.getItem("doczen_explainer_result");
        try {
            return savedResult ? JSON.parse(savedResult) : null;
        } catch (e) {
            return null;
        }
    });
    const { refreshUser } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const historyId = location.state?.historyId;
        if (historyId) {
            fetchSpecificHistory(historyId);
        }
    }, [location.state]);

    // Save to persistence
    useEffect(() => {
        if (code) localStorage.setItem("doczen_explainer_code", code);
        else localStorage.removeItem("doczen_explainer_code");
        
        if (result) localStorage.setItem("doczen_explainer_result", JSON.stringify(result));
        else localStorage.removeItem("doczen_explainer_result");
    }, [code, result]);

    const fetchSpecificHistory = async (id) => {
        try {
            const response = await api.get(`tools/text/history/detail/${id}/`);
            if (response.data) {
                setResult(response.data.output_result);
                if (response.data.input_text) {
                    setCode(response.data.input_text);
                }
                toast.success("Loaded from history.");
            }
        } catch (error) {
            console.error("Failed to fetch specific history:", error);
            toast.error("Could not load history detail.");
        }
    };

    const handleExplain = async (e) => {
        e?.preventDefault();
        if (!code.trim()) {
            toast.error("Please paste some code to explain.");
            return;
        }

        setIsExplaining(true);
        setResult(null);

        try {
            const response = await api.post("tools/text/explain-code/", {
                text: code.trim()
            });

            if (response.data?.success && response.data?.result) {
                setResult(response.data.result);
                toast.success("Code explained successfully!");
                refreshUser();
            } else {
                toast.error("Failed to explain code.");
            }
        } catch (error) {
            console.error("Code API Error:", error);
            if (error.response?.status === 429) {
                toast.error(error.response.data?.message || "AI daily limit reached. Please try again tomorrow!");
            } else {
                toast.error("An error occurred during explanation.");
            }
        } finally {
            setIsExplaining(false);
        }
    };

    const clearForm = () => {
        setCode("");
        setResult(null);
        localStorage.removeItem("doczen_explainer_code");
        localStorage.removeItem("doczen_explainer_result");
    };

    return (
        <div className="text-tools-container">
            {/* Background decoration */}
            <div className="dashboard-blob-2" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-[1600px] mx-auto space-y-6 relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-12 lg:gap-20 items-start"
            >

                {/* Left Column: Code Editor */}
                <div className="space-y-4">
                    <motion.header variants={itemVariants} className="mt-12">
                        <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                                <Code2 className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex flex-wrap gap-x-3">
                                <motion.span
                                    animate={{ opacity: 1, y: 0 }}
                                    initial={{ opacity: 0, y: 20 }}
                                >Code</motion.span>
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-gradient"
                                >
                                    Explainer
                                </motion.span>
                            </div>
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Paste your mysterious code snippets here. Our AI will break it down line-by-line, detect bugs, and suggest improvements.
                        </p>
                    </motion.header>

                    <motion.form variants={itemVariants} onSubmit={handleExplain} className="glass-card rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col h-[520px]">
                        {/* Fake Editor Header */}
                        <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500" />
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            </div>
                            <div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                                <Terminal className="w-4 h-4" /> snippet.js
                            </div>
                        </div>

                        {/* Textarea Area */}
                        <div className="flex-1 relative">
                            {/* Line numbers (visual fake) */}
                            <div className="absolute left-0 top-0 bottom-0 w-12 bg-black/20 border-r border-white/5 flex flex-col items-end py-4 pr-3 text-xs text-muted-foreground/30 font-mono select-none overflow-hidden">
                                {Array.from({ length: 30 }).map((_, i) => (
                                    <div key={i} className="leading-6">{i + 1}</div>
                                ))}
                            </div>
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="// Paste your code here..."
                                className="w-full h-full bg-black/40 text-emerald-400 pl-16 pr-4 py-6 font-mono text-base placeholder:text-muted-foreground/50 focus:outline-none focus:ring-inset focus:ring-1 focus:ring-primary/50 transition-all resize-none leading-relaxed"
                                spellCheck="false"
                            />
                        </div>

                        {/* Action Bar */}
                        <div className="bg-white/5 border-t border-white/10 p-4 flex gap-4">
                            <button
                                type="submit"
                                disabled={!code.trim() || isExplaining}
                                className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isExplaining ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing Logic...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5 fill-current" />
                                        Run AI Analysis
                                    </>
                                )}
                            </button>
                            {(code || result) && (
                                <button
                                    type="button"
                                    onClick={clearForm}
                                    className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </motion.form>
                </div>

                {/* Right Column: Output / Explanation */}
                <motion.div variants={itemVariants} className="lg:h-[700px] lg:-mt-20">
                    <AnimatePresence mode="wait">
                        {isExplaining ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full border border-dashed border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center p-10 text-center bg-white/[0.02]"
                            >
                                <div className="relative w-20 h-20 mb-6 font-mono text-primary text-2xl flex items-center justify-center">
                                    <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin" />
                                    {`</>`}
                                </div>
                                <p className="text-white font-medium text-lg tracking-wide mb-2">Parsing abstract syntax trees...</p>
                                <p className="text-sm text-muted-foreground">Demystifying your logic step-by-step.</p>
                            </motion.div>
                        ) : result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-tool-output h-full flex flex-col overflow-hidden"
                            >
                                <div className="p-6 lg:p-8 border-b border-white/5 bg-white/5">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Wand2 className="w-5 h-5 text-primary" />
                                        Code Explanation
                                    </h3>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    {/* Overall Summary & Status */}
                                    <section>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold text-primary/80 uppercase tracking-widest">Overview</h4>
                                            {result.is_perfect ? (
                                                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    CODE IS GOOD
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                                                    ERRORS DETECTED
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-white/90 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                                            {result.explanation}
                                        </div>
                                    </section>

                                    {/* Error Breakdown */}
                                    {!result.is_perfect && result.errors && result.errors.length > 0 && (
                                        <section className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-xl space-y-3">
                                            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1 h-4 bg-rose-500 rounded-full" />
                                                Why this code is wrong:
                                            </h4>
                                            <ul className="space-y-2">
                                                {result.errors.map((error, idx) => (
                                                    <li key={idx} className="text-rose-200/80 text-sm flex gap-3">
                                                        <span className="text-rose-500 select-none">•</span>
                                                        {error}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}

                                    {/* Steps Breakdown */}
                                    {result.steps && result.steps.length > 0 && (
                                        <section>
                                            <h4 className="text-sm font-semibold text-primary/80 uppercase tracking-widest mb-4">Line-by-Line Breakdown</h4>
                                            <div className="space-y-6">
                                                {result.steps.map((step, idx) => (
                                                    <div key={idx} className="flex gap-4 group">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold group-hover:bg-primary group-hover:text-black transition-colors">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            {step.code && (
                                                                <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-xs text-emerald-400/90 group-hover:border-primary/30 transition-colors">
                                                                    <code>{step.code}</code>
                                                                </div>
                                                            )}
                                                            <div className="text-white/80 text-[14px] leading-relaxed pl-1">
                                                                {step.explanation || step}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Fixed Code Section */}
                                    {result.fixed_code && (
                                        <section>
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">Optimized & Fixed Version</h4>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(result.fixed_code);
                                                        toast.success("Fixed code copied!");
                                                    }}
                                                    className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg border border-emerald-500/20 transition-colors"
                                                >
                                                    Copy Code
                                                </button>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                                                <pre className="relative bg-black/60 p-5 rounded-xl border border-emerald-500/20 font-mono text-sm text-emerald-400 overflow-x-auto">
                                                    <code>{result.fixed_code}</code>
                                                </pre>
                                            </div>
                                        </section>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full border border-dashed border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center p-10 text-center bg-white/[0.02]"
                            >
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    <Code2 className="w-10 h-10 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-xl font-medium text-white/50 mb-2">Awaiting Code</h3>
                                <p className="text-muted-foreground/60 max-w-sm">
                                    Paste a snippet on the left and hit run. The AI will provide a detailed, human-readable breakdown right here.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </div>
    );
}
