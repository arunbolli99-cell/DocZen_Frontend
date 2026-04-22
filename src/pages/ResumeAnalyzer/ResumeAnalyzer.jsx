import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, AlertCircle, CheckCircle2, Loader2, X, PenTool } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { useToolAccess } from "../../hooks/useToolAccess";
import "./ResumeAnalyzer.css";

const CircularProgress = ({ score }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-48 h-48">
            <svg className="w-full h-full -rotate-90 drop-shadow-lg" viewBox="0 0 140 140">
                <circle
                    className="text-white/5"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                />
                <motion.circle
                    className={score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-rose-500"}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-5xl font-extrabold text-white">{score}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Resume Score</span>
            </div>
        </div>
    );
};

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

export default function ResumeAnalyzerPage() {
    const [file, setFile] = useState(null);
    const [jobDescription, setJobDescription] = useState(() => localStorage.getItem("doczen_resume_jd") || "");
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(() => {
        const savedResult = localStorage.getItem("doczen_resume_result");
        try {
            return savedResult ? JSON.parse(savedResult) : null;
        } catch (e) {
            return null;
        }
    });
    const { user, refreshUser } = useAuth();
    const { checkAccess } = useToolAccess();
    const fileInputRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        const historyId = location.state?.historyId;
        if (historyId) {
            fetchSpecificHistory(historyId);
        }
    }, [location.state]);

    // Save to persistence
    useEffect(() => {
        if (jobDescription) localStorage.setItem("doczen_resume_jd", jobDescription);
        else localStorage.removeItem("doczen_resume_jd");
        
        if (result) localStorage.setItem("doczen_resume_result", JSON.stringify(result));
        else localStorage.removeItem("doczen_resume_result");
    }, [jobDescription, result]);

    const fetchSpecificHistory = async (id) => {
        if (!user) return;
        try {
            const response = await api.get(`tools/resume/history/${id}/`);
            if (response.data) {
                setResult(response.data.analysis_result);
                toast.success("Loaded from history.");
            }
        } catch (error) {
            console.error("Failed to fetch specific history:", error);
            toast.error("Could not load history detail.");
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (selectedFile) => {
        if (selectedFile.type === "application/pdf" || selectedFile.type.startsWith("image/")) {
            setFile(selectedFile);
        } else {
            toast.error("Please upload a PDF or an image file.");
        }
    };

    const handleAnalyze = async () => {
        if (!checkAccess()) return;
        if (!file) {
            toast.error("Please provide a resume file.");
            return;
        }

        setIsAnalyzing(true);
        setResult(null);

        const formData = new FormData();
        formData.append("resume", file);
        if (jobDescription) formData.append("job_description", jobDescription);

        try {
            const response = await api.post("tools/resume/analyze/", formData);

            if (response.data?.success && response.data?.result) {
                setResult(response.data.result);
                toast.success("Analysis complete!");
                refreshUser();
            } else {
                toast.error("Failed to analyze resume.");
            }
        } catch (error) {
            console.error("ATS API Error:", error);
            if (error.response?.status === 429) {
                toast.error(error.response.data?.message || "AI daily limit reached. Please try again tomorrow!");
            } else {
                toast.error("An error occurred during analysis.");
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearForm = () => {
        setFile(null);
        setJobDescription("");
        setResult(null);
        localStorage.removeItem("doczen_resume_jd");
        localStorage.removeItem("doczen_resume_result");
    };

    return (
        <div className="resume-container">
            {/* Background decoration */}
            <div className="dashboard-blob-1" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-4xl mx-auto space-y-10 relative z-10"
            >
                <motion.header 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                    className="text-center"
                >
                    <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 flex flex-wrap gap-x-4 gap-y-2 justify-center items-center">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <motion.span
                             animate={{ opacity: 1, y: 0 }}
                             initial={{ opacity: 0, y: 20 }}
                        >Resume</motion.span>
                        {" "}
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-gradient"
                        >
                            Analyzer
                        </motion.span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Upload your resume and an optional job description to see how well it scores. Get actionable feedback to land your dream job.
                    </p>
                </motion.header>

                <div className="flex flex-col gap-8">
                    {/* Upload Section */}
                    <div className="space-y-6">
                        <motion.div variants={itemVariants} className="tool-card-main">
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Upload Resume
                            </h2>

                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "resume-upload-zone",
                                    isDragging ? "dragging" : "",
                                    file ? "has-file" : ""
                                )}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".pdf,image/*"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                                    }}
                                />

                                {file ? (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                                            <FileText className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <p className="text-white font-medium truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                            className="mt-4 text-xs text-destructive hover:underline flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" /> Remove File
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                            <UploadCloud className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-white font-medium mb-1">Click or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PDF or Images only (max. 10MB)</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="tool-card-main">
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <PenTool className="w-5 h-5 text-primary" />
                                Job Description (Optional)
                            </h2>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the target job description here to see how well your resume matches..."
                                className="tool-input min-h-[150px] resize-none"
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <button
                                onClick={handleAnalyze}
                                disabled={!file || isAnalyzing}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing Resume...
                                    </>
                                ) : (
                                    "Run Resume Analysis"
                                )}
                            </button>
                        </motion.div>

                        {(file || jobDescription || result) && (
                            <button onClick={clearForm} className="w-full text-sm text-muted-foreground hover:text-white transition-colors">
                                Reset Everything
                            </button>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="relative">
                        {isAnalyzing && (
                            <div className="glass-card rounded-2xl flex flex-col items-center justify-center p-10 min-h-[300px]">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                <p className="text-white font-medium">Extracting text & matching keywords...</p>
                                <p className="text-sm text-muted-foreground mt-2">This usually takes a few seconds.</p>
                            </div>
                        )}

                        {!result && !isAnalyzing && (
                            <div className="border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-10 text-center bg-white/[0.02] min-h-[300px]">
                                <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-medium text-white/50 mb-2">Awaiting Analysis</h3>
                                <p className="text-sm text-muted-foreground/60 max-w-sm">
                                    Upload your resume and click run to see your ATS compatibility scan results here.
                                </p>
                            </div>
                        )}

                        {result && !isAnalyzing && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="resume-result-card"
                            >
                                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8 pb-8 border-b border-white/10">
                                    <div className="flex-1 text-center sm:text-left">
                                        <h2 className="text-2xl font-bold text-white mb-2">Analysis Results</h2>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {result.overall_summary}
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex justify-center">
                                        <CircularProgress score={result.resume_score ?? result.ats_score} />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Strengths */}
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
                                        <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" /> Strengths
                                        </h3>
                                        <ul className="space-y-2">
                                            {result.strengths?.length > 0 ? (
                                                result.strengths.map((str, i) => (
                                                    <li key={i} className="text-sm text-emerald-100/80 flex items-start gap-2">
                                                        <span className="text-emerald-500 mt-1">•</span> {str}
                                                    </li>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">No specific strengths detected.</p>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Weaknesses */}
                                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-5">
                                        <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> Weaknesses
                                        </h3>
                                        <ul className="space-y-2">
                                            {result.weaknesses?.length > 0 ? (
                                                result.weaknesses.map((weak, i) => (
                                                    <li key={i} className="text-sm text-amber-100/80 flex items-start gap-2">
                                                        <span className="text-amber-500 mt-1">•</span> {weak}
                                                    </li>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">Looks solid.</p>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Missing Keywords */}
                                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-5">
                                        <h3 className="text-rose-400 font-semibold mb-3 flex items-center gap-2">
                                            <X className="w-4 h-4" /> Missed Keywords
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {result.missing_keywords?.length > 0 ? (
                                                result.missing_keywords.map((kw, i) => (
                                                    <span key={i} className="px-2 py-1 rounded bg-rose-500/10 text-rose-300 text-xs font-medium border border-rose-500/20">
                                                        {kw}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-muted-foreground italic">None missed!</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Improvement Suggestions */}
                                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-5">
                                        <h3 className="text-primary font-semibold mb-3 flex items-center gap-2">
                                            <PenTool className="w-4 h-4" /> Improvement Suggestions
                                        </h3>
                                        <ul className="space-y-2">
                                            {result.improvement_suggestions?.length > 0 ? (
                                                result.improvement_suggestions.map((sug, i) => (
                                                    <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                                                        <span className="text-primary mt-1">•</span> {sug}
                                                    </li>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">No suggestions available.</p>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
