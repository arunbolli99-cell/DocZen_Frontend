import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, ShieldCheck, ShieldAlert, Loader2, X, AlertTriangle } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { useToolAccess } from "../../hooks/useToolAccess";
import "./ImageDetector.css";

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

export default function ImageDetectorPage() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(() => localStorage.getItem("doczen_detector_preview") || null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(() => {
        const savedResult = localStorage.getItem("doczen_detector_result");
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
        if (preview) localStorage.setItem("doczen_detector_preview", preview);
        else localStorage.removeItem("doczen_detector_preview");
        
        if (result) localStorage.setItem("doczen_detector_result", JSON.stringify(result));
        else localStorage.removeItem("doczen_detector_result");
    }, [preview, result]);

    const fetchSpecificHistory = async (id) => {
        if (!user) return;
        try {
            const response = await api.get(`tools/image/history/detail/${id}/`);
            if (response.data) {
                setResult(response.data.output_result);
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
        if (selectedFile.type.startsWith("image/")) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
            setResult(null); // Clear previous results
        } else {
            toast.error("Please upload an image file (JPEG, PNG, etc).");
        }
    };

    const clearImage = (e) => {
        if (e) e.stopPropagation();
        setFile(null);
        setPreview(null);
        setResult(null);
        localStorage.removeItem("doczen_detector_preview");
        localStorage.removeItem("doczen_detector_result");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleAnalyze = async () => {
        if (!checkAccess()) return;
        if (!file) {
            toast.error("Please provide an image to analyze.");
            return;
        }

        setIsAnalyzing(true);
        setResult(null);

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await api.post("tools/image/ai-detect/", formData);

            if (response.data?.success && response.data?.result) {
                setResult(response.data.result);
                toast.success("Analysis complete!");
                refreshUser();
            } else {
                toast.error("Failed to analyze image.");
            }
        } catch (error) {
            console.error("Detector API Error:", error);
            if (error.response?.status === 429) {
                toast.error(error.response.data?.message || "AI daily limit reached. Please try again tomorrow!");
            } else {
                toast.error("An error occurred during verification.");
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="image-tools-container">
            {/* Background decoration */}
            <div className="dashboard-blob-1" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-4xl w-full mx-auto space-y-10 relative z-10"
            >
                <motion.header variants={itemVariants} className="text-center">
                    <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 flex flex-wrap gap-x-4 gap-y-2 justify-center items-center">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <motion.span
                             animate={{ opacity: 1, y: 0 }}
                             initial={{ opacity: 0, y: 20 }}
                        >AI Image</motion.span>
                        {" "}
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-gradient"
                        >
                            Detector
                        </motion.span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Upload any image to verify its authenticity. Our advanced models analyze artifacts to determine if an image is real or AI-generated.
                    </p>
                </motion.header>

                <motion.div variants={itemVariants} className="image-input-card flex flex-col items-center">
                    <div className="w-full max-w-xl space-y-8">

                        {/* Upload Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !file && fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300 w-full ${preview ? "min-h-[400px] border-white/10 bg-black/40" : "aspect-video cursor-pointer " + (isDragging ? "border-primary bg-primary/10 scale-[1.02]" : "border-white/20 hover:border-white/40 hover:bg-white/5")
                                }`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                                }}
                            />

                            {preview ? (
                                <div className="absolute inset-0 flex flex-col">
                                    <div className="relative flex-1 bg-black/50 p-4">
                                        <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                                        <button
                                            onClick={clearImage}
                                            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/60 hover:bg-rose-500 text-white flex items-center justify-center transition-colors backdrop-blur-md shadow-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <UploadCloud className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-lg text-white font-medium mb-1">Click or drag and drop an image</p>
                                    <p className="text-sm text-muted-foreground">Supported formats: JPEG, PNG, WEBP (max 10MB)</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={!file || isAnalyzing || result}
                            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Analyzing Pixels & Artifacts...
                                </>
                            ) : result ? (
                                "Scan Complete"
                            ) : (
                                "Verify Authenticity"
                            )}
                        </button>

                        {/* Results Panel */}
                        <AnimatePresence>
                            {result && !isAnalyzing && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, y: 20 }}
                                    animate={{ opacity: 1, height: "auto", y: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-black/30 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">

                                        {/* Dynamic Background Glow based on result */}
                                        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[64px] opacity-20 pointer-events-none ${result.is_ai_generated ? "bg-rose-500" : "bg-emerald-500"
                                            }`} />

                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Analysis Result</h3>
                                                <div className="flex items-center gap-3">
                                                    {result.is_ai_generated ? (
                                                        <>
                                                            <ShieldAlert className="w-8 h-8 text-rose-500" />
                                                            <span className="text-2xl font-bold text-white">AI Generated</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShieldCheck className="w-8 h-8 text-emerald-500" />
                                                            <span className="text-2xl font-bold text-white">Authentic Human / Camera</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-white">{result.confidence_score}%</div>
                                                <div className="text-xs text-muted-foreground">Confidence</div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden mb-6 relative">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${result.confidence_score}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full ${result.is_ai_generated ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                            />
                                        </div>

                                        {/* Details/Explanation */}
                                        <div className="bg-white/5 rounded-xl text-sm text-foreground p-4 border border-white/5 flex gap-3">
                                            <AlertTriangle className={`w-5 h-5 shrink-0 ${result.is_ai_generated ? 'text-amber-500' : 'text-emerald-500'}`} />
                                            <p className="leading-relaxed">{result.explanation}</p>
                                        </div>

                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
