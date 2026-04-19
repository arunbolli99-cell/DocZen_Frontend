import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Wand2, Download, Loader2, RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { cn } from "../../lib/utils";
import "./ImageGenerator.css";

const STYLES = [
    { id: "realistic", label: "Realistic Photo" },
    { id: "anime", label: "Anime Style" },
    { id: "digital-art", label: "Digital Illustration" },
    { id: "oil-painting", label: "Oil Painting" },
    { id: "3d-render", label: "3D Render" },
    { id: "cyberpunk", label: "Cyberpunk" },
];

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

export default function ImageGeneratorPage() {
    const [prompt, setPrompt] = useState(() => localStorage.getItem("doczen_image_prompt") || "");
    const [style, setStyle] = useState(() => localStorage.getItem("doczen_image_style") || "Digital Art");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null); 
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
        // Prompt persistence is fine, but image is now ephemeral
        if (prompt) localStorage.setItem("doczen_image_prompt", prompt);
        else localStorage.removeItem("doczen_image_prompt");
        
        if (style) localStorage.setItem("doczen_image_style", style);
    }, [prompt, style, generatedImage]);

    const fetchSpecificHistory = async (id) => {
        try {
            const response = await api.get(`tools/image/history/detail/${id}/`);
            if (response.data) {
                setGeneratedImage(response.data.output_result.image_url);
                setPrompt(response.data.input_data || "");
                toast.success("Loaded from history.");
            }
        } catch (error) {
            console.error("Failed to fetch specific history:", error);
            toast.error("Could not load history detail.");
        }
    };

    const handleGenerate = async (e) => {
        e?.preventDefault();
        if (!prompt.trim()) {
            toast.error("Please enter a prompt to generate an image.");
            return;
        }

        setIsGenerating(true);
        setGeneratedImage(null);

        try {
            const response = await api.post("tools/image/ai-generate/", {
                prompt: prompt.trim(),
                style: style
            });

            if (response.data?.success && response.data?.result?.image_url) {
                setGeneratedImage(response.data.result.image_url);
                setIsImageLoading(true); // Start loading the actual image bits
                toast.success("Design received! Rendering pixels...");
                refreshUser();
            } else {
                toast.error("Failed to generate image.");
            }
        } catch (error) {
            console.error("Generator API Error:", error);
            setIsImageLoading(false);
            toast.error("An error occurred during generation.");
        } finally {
            setIsGenerating(false);
        }
    };

    const clearForm = () => {
        setPrompt("");
        setGeneratedImage(null);
        localStorage.removeItem("doczen_image_prompt");
        localStorage.removeItem("doczen_image_result");
    };
    const downloadImage = async () => {
        if (!generatedImage) return;
        
        try {
            toast.loading("Preparing your download...");
            const response = await fetch(generatedImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = url;
            a.download = `doczen-image-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success("Download started!");
        } catch (error) {
            console.error("Download failed:", error);
            toast.error("Failed to download image. Try right-clicking and 'Save Image As'.");
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
                className="max-w-6xl w-full mx-auto space-y-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
            >

                {/* Left Column: Input Form */}
                <div className="col-span-1 lg:col-span-5 space-y-8">
                    <motion.header variants={itemVariants}>
                        <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 flex flex-wrap gap-x-3 gap-y-2 items-center">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                                <ImageIcon className="w-6 h-6 text-primary" />
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
                                Studio
                            </motion.span>
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Transform your imagination into stunning visuals. Describe what you want to see, and watch the magic happen.
                        </p>
                    </motion.header>

                    <motion.form variants={itemVariants} onSubmit={handleGenerate} className="image-input-card space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-white flex items-center gap-2">
                                <Wand2 className="w-4 h-4 text-primary" /> Your Idea
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="A futuristic city with flying cars at sunset, cyberpunk aesthetic..."
                                className="tool-input h-32"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-white pl-1 relative -top-1">Art Style</label>
                            <div className="grid grid-cols-2 gap-4">
                                {STYLES.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setStyle(s.id)}
                                        className={cn(
                                            "image-style-btn",
                                            style === s.id && "active"
                                        )}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={!prompt.trim() || isGenerating}
                                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Forging Image...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        Generate Masterpiece
                                    </>
                                )}
                            </button>
                            
                            {(prompt || generatedImage) && (
                                <button
                                    type="button"
                                    onClick={clearForm}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white/70 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10"
                                >
                                    <RefreshCw className="w-4 h-4" /> Clear All
                                </button>
                            )}
                        </div>
                    </motion.form>
                </div>

                {/* Right Column: Canvas / Results */}
                <div className="col-span-1 lg:col-span-7 h-full flex flex-col gap-8">
                    <motion.div variants={itemVariants} className={cn(
                        "image-preview-container",
                        generatedImage && "has-image"
                    )}>

                        <AnimatePresence>
                            {(isGenerating || isImageLoading) && (
                                <motion.div
                                    key="loading-overlay"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center z-20 glass"
                                >
                                    <div className="relative w-24 h-24 mb-6">
                                        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                                        <div className="absolute inset-2 rounded-full border-r-2 border-accent animate-spin animation-delay-2000" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Wand2 className="w-8 h-8 text-primary animate-pulse" />
                                        </div>
                                    </div>
                                    <p className="text-white font-medium text-lg tracking-wide">
                                        {isGenerating ? "Forging Digital Reality..." : "Capturing the Vision..."}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {isGenerating ? "Connecting to neural networks" : "Finalizing pixel patterns"}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!generatedImage && !isGenerating ? (
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center z-0"
                            >
                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-xl font-medium text-white/50 mb-2">Blank Canvas</h3>
                                <p className="text-muted-foreground/60 max-w-sm">
                                    Enter a descriptive prompt and select a style to generate your AI artwork here.
                                </p>
                            </motion.div>
                        ) : generatedImage && (
                            <motion.div
                                key="result-view"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full h-full relative group z-10"
                            >
                                <img
                                    src={generatedImage}
                                    alt="AI Generated"
                                    className="w-full h-full object-cover"
                                    onLoad={() => setIsImageLoading(false)}
                                    onError={() => {
                                        setIsImageLoading(false);
                                        toast.error("Failed to render image. Try a different prompt.");
                                    }}
                                />

                                {/* Appears on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                    <p className="text-white text-sm line-clamp-2 mb-4 italic">"{prompt}"</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={downloadImage}
                                            className="flex-1 bg-white hover:bg-white/90 text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Download className="w-4 h-4" /> Download HD
                                        </button>
                                        <button
                                            onClick={handleGenerate}
                                            className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" /> Variations
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
