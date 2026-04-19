import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, AlignLeft, Loader2, UploadCloud, X, Wand2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "./Summarizer.css";

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

export default function SummarizerPage() {
    const [activeTab, setActiveTab] = useState("text"); // text, url, file
    const [inputText, setInputText] = useState(() => localStorage.getItem("doczen_summarizer_text") || "");
    const [file, setFile] = useState(null);

    const [isSummarizing, setIsSummarizing] = useState(false);
    const [result, setResult] = useState(() => {
        const savedResult = localStorage.getItem("doczen_summarizer_result");
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
        if (inputText) localStorage.setItem("doczen_summarizer_text", inputText);
        else localStorage.removeItem("doczen_summarizer_text");
        
        if (result) localStorage.setItem("doczen_summarizer_result", JSON.stringify(result));
        else localStorage.removeItem("doczen_summarizer_result");
    }, [inputText, result]);

    const fetchSpecificHistory = async (id) => {
        try {
            const response = await api.get(`tools/text/history/detail/${id}/`);
            if (response.data) {
                setResult(response.data.output_result);
                if (response.data.input_text) {
                    setInputText(response.data.input_text);
                    setActiveTab("text");
                }
                toast.success("Loaded from history.");
            }
        } catch (error) {
            console.error("Failed to fetch specific history:", error);
            toast.error("Could not load history detail.");
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (selected && (selected.type === "application/pdf" || selected.type === "text/plain")) {
            setFile(selected);
        } else {
            toast.error("Please upload a PDF or TXT file.");
        }
    };

    const handleSummarize = async () => {
        if (activeTab === "text" && !inputText.trim()) {
            toast.error("Please enter some text to summarize.");
            return;
        }
        if (activeTab === "file" && !file) {
            toast.error("Please upload a file.");
            return;
        }

        setIsSummarizing(true);
        setResult(null);

        const formData = new FormData();
        if (activeTab === "text") formData.append("text", inputText);
        if (activeTab === "file") formData.append("document", file);

        try {
            const response = await api.post("tools/text/summarize/", formData);

            if (response.data?.success && response.data?.result) {
                setResult(response.data.result);
                toast.success("Summary generated successfully!");
                refreshUser();
            } else {
                toast.error("Failed to generate summary.");
            }
        } catch (error) {
            console.error("Summarizer API Error:", error);
            if (error.response?.status === 429) {
                toast.error(error.response.data?.message || "AI daily limit reached. Please try again tomorrow!");
            } else {
                toast.error("An error occurred during summarization.");
            }
        } finally {
            setIsSummarizing(false);
        }
    };

    const clearForm = () => {
        setInputText("");
        setFile(null);
        setResult(null);
        localStorage.removeItem("doczen_summarizer_text");
        localStorage.removeItem("doczen_summarizer_result");
    };

    return (
        <div className="text-tools-container">
            {/* Background decoration */}
            <div className="dashboard-blob-2" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-4xl mx-auto space-y-10 relative z-10"
            >
                <motion.header variants={itemVariants} className="text-center mt-12">
                    <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-6 flex items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                            <Wand2 className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-wrap gap-x-3 justify-center">
                            <motion.span
                                 animate={{ opacity: 1, y: 0 }}
                                 initial={{ opacity: 0, y: 20 }}
                            >AI Document</motion.span>
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-gradient"
                            >
                                Summarizer
                            </motion.span>
                        </div>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Distill long articles, documents, and text into concise, actionable insights instantly.
                    </p>
                </motion.header>

                <motion.div variants={itemVariants} className="text-tool-card">
                    {/* Tabs */}
                    <div className="flex p-1 space-x-2 bg-white/5 rounded-2xl mb-8">
                        <button
                            onClick={() => setActiveTab("text")}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeTab === "text" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <AlignLeft className="w-4 h-4" /> Text
                        </button>
                        <button
                            onClick={() => setActiveTab("file")}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeTab === "file" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <FileText className="w-4 h-4" /> Document
                        </button>
                    </div>

                    {/* Input Areas */}
                    <div className="min-h-[200px] mb-6">
                        <AnimatePresence mode="wait">
                            {activeTab === "text" && (
                                <motion.div
                                    key="text"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full"
                                >
                                    <textarea
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Paste your long text here..."
                                        className="w-full h-48 bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                                    />
                                </motion.div>
                            )}


                            {activeTab === "file" && (
                                <motion.div
                                    key="file"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full"
                                >
                                    <div className={`h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all ${file ? 'border-primary bg-primary/5' : 'border-white/20'}`}>
                                        {file ? (
                                            <>
                                                <FileText className="w-10 h-10 text-primary mb-3" />
                                                <p className="text-white font-medium mb-1">{file.name}</p>
                                                <p className="text-xs text-muted-foreground mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                <button onClick={() => setFile(null)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                                                    <X className="w-3 h-3" /> Remove File
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                                                <label className="cursor-pointer">
                                                    <span className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                                                        Browse Files
                                                    </span>
                                                    <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileChange} />
                                                </label>
                                                <p className="text-xs text-muted-foreground mt-4">Support PDF and TXT</p>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleSummarize}
                            disabled={isSummarizing || (activeTab === "text" && !inputText) || (activeTab === "file" && !file)}
                            className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSummarizing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating Summary...
                                </>
                            ) : (
                                "Summarize Content"
                            )}
                        </button>
                        {(inputText || file || result) && (
                            <button onClick={clearForm} className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                                Clear
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Results */}
                <AnimatePresence>
                    {result && !isSummarizing && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-tool-output"
                        >
                            {/* Passage Summary */}
                            {result.passage_summary && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-10 space-y-4"
                                >
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-primary" />
                                        Short Summary
                                    </h3>
                                    <div className="text-white/80 leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/5 text-lg italic shadow-inner">
                                        "{result.passage_summary}"
                                    </div>
                                </motion.div>
                            )}

                            {/* Key Insights (Points) */}
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <AlignLeft className="w-5 h-5 text-primary" />
                                Key Insights
                            </h3>

                            {result.points && result.points.length > 0 ? (
                                <ul className="space-y-4">
                                    {result.points.map((point, index) => (
                                        <motion.li
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                                        >
                                            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <p className="text-white/90 leading-relaxed pt-1">
                                                {point}
                                            </p>
                                        </motion.li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                                    {typeof result === 'string' ? result : JSON.stringify(result)}
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );

}
