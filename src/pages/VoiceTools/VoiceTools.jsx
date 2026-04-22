import { useState } from "react";
import { motion } from "framer-motion";
import { 
    Volume2, 
    Download, 
    Loader2, 
    Headphones, 
    CheckCircle2,
    X,
    Sparkles
} from "lucide-react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { useToolAccess } from "../../hooks/useToolAccess";
import "./VoiceTools.css";

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

const VOICES = [
    { id: "en-US-AriaNeural", name: "Aria (Female, US)", lang: "English" },
    { id: "en-US-GuyNeural", name: "Guy (Male, US)", lang: "English" },
    { id: "en-GB-SoniaNeural", name: "Sonia (Female, UK)", lang: "English" },
    { id: "en-GB-RyanNeural", name: "Ryan (Male, UK)", lang: "English" },
    { id: "en-IN-NeerjaNeural", name: "Neerja (Female, India)", lang: "English" },
    { id: "hi-IN-SwaraNeural", name: "Swara (Female, Hindi)", lang: "Hindi" },
    { id: "hi-IN-MadhurNeural", name: "Madhur (Male, Hindi)", lang: "Hindi" },
];

export default function VoiceToolsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { refreshUser } = useAuth();
    const { checkAccess } = useToolAccess();

    // TTS state
    const [ttsText, setTtsText] = useState("");
    const [selectedVoice, setSelectedVoice] = useState("en-US-AriaNeural");
    const [generatedAudio, setGeneratedAudio] = useState(null);

    const handleTtsGenerate = async () => {
        if (!checkAccess()) return;
        if (!ttsText.trim()) return;
        setIsLoading(true);
        setGeneratedAudio(null);

        try {
            const response = await api.post("tools/voice/tts/", {
                text: ttsText,
                voice: selectedVoice
            }, { responseType: 'blob' });

            const audioUrl = URL.createObjectURL(response.data);
            setGeneratedAudio(audioUrl);
            toast.success("Voice generated successfully!");
            refreshUser();
        } catch (error) {
            console.error("TTS Error:", error);
            toast.error("Failed to generate voice.");
        } finally {
            setIsLoading(false);
        }
    };

    const clearAll = () => {
        setTtsText("");
        setGeneratedAudio(null);
    };

    return (
        <div className="voice-tools-container">
            <div className="dashboard-blob-2" />
            
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="w-full max-w-2xl relative z-10"
            >
                <motion.div variants={itemVariants} className="text-center mb-10">
                    <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 flex flex-wrap gap-x-4 gap-y-2 justify-center items-center">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                            <Headphones className="w-6 h-6 text-primary" />
                        </div>
                        <motion.span>Text-to-Speech</motion.span>
                        <motion.span className="text-gradient">Studio</motion.span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Transform text to natural, high-fidelity AI speech in seconds.
                    </p>
                </motion.div>

                <motion.div variants={itemVariants} className="voice-tools-card">
                    <div className="voice-input-group pt-4">
                        {/* Input Text Moved to TOP */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-primary/80 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Input Text
                            </label>
                            <textarea
                                className="tool-input min-h-[180px] p-5 resize-none text-lg border-white/5 bg-white/[0.02]"
                                placeholder="Type or paste the text you want to convert to speech..."
                                value={ttsText}
                                onChange={(e) => setTtsText(e.target.value)}
                            />
                        </div>

                        {/* Voice Actor Selection */}
                        <div className="space-y-4 pt-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Select Voice Actor
                            </label>
                            <select 
                                className="voice-select bg-white/5 border-white/10 hover:border-primary/50 transition-all"
                                value={selectedVoice}
                                onChange={(e) => setSelectedVoice(e.target.value)}
                            >
                                {VOICES.map(v => (
                                    <option key={v.id} value={v.id}>{v.name} - {v.lang}</option>
                                ))}
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleTtsGenerate}
                                disabled={!ttsText.trim() || isLoading}
                                className="tool-button py-4 px-8 text-lg flex-1 shadow-lg shadow-primary/20"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Synthesize Voice <Volume2 className="w-5 h-5" />
                                    </span>
                                )}
                            </button>
                            {(ttsText || generatedAudio) && (
                                <button
                                    onClick={clearAll}
                                    className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all border border-white/5"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Result Audio Player */}
                        {generatedAudio && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="result-area bg-primary/5 border-primary/20 backdrop-blur-md mt-4"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="flex items-center gap-2 text-emerald-400 font-semibold tracking-wide text-sm">
                                        <CheckCircle2 className="w-4 h-4" /> AUDIO SYNTHESIZED
                                    </span>
                                    <a 
                                        href={generatedAudio} 
                                        download="doczen_voice.mp3"
                                        className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                                        title="Download MP3"
                                    >
                                        <Download className="w-5 h-5" />
                                    </a>
                                </div>
                                <audio controls src={generatedAudio} className="w-full h-12" />
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
