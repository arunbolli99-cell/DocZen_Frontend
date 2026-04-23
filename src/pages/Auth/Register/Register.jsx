import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ShieldCheck, 
    Mail, 
    Lock, 
    User, 
    Loader2, 
    ArrowRight, 
    Phone, 
    Calendar,
    Eye,
    EyeOff
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

// Import Assets
import imageDetectorImg from "../../../assets/tools/image_detector.png";
import resumeAnalyzerImg from "../../../assets/tools/resume_analyzer.png";
import codeExplainerImg from "../../../assets/tools/code_explainer.png";
import ParticleBackground from "../../../components/ParticleBackground";
import "./Register.css";

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

const TOOLS = [
    {
        title: "AI Image Detector",
        description: "Instantly distinguish between human-captured photos and AI-generated imagery with 99.8% precision.",
        image: imageDetectorImg,
        color: "from-purple-500 to-indigo-600"
    },
    {
        title: "AI Resume Analyzer",
        description: "Elevate your career with deep structural analysis and scoring to beat modern ATS systems.",
        image: resumeAnalyzerImg,
        color: "from-cyan-500 to-blue-600"
    },
    {
        title: "Smart Code Explainer",
        description: "Translate complex algorithms into human-friendly logic instantly. Master any codebase faster.",
        image: codeExplainerImg,
        color: "from-indigo-500 to-purple-600"
    }
];

function ToolCarousel() {
    const [index, setIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setIndex((prev) => (prev + 1) % TOOLS.length);
    }, []);

    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    return (
        <div className="tool-carousel-wrapper">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="tool-slide"
                >
                    <div className="tool-image-container group">
                        <div className={`absolute inset-0 bg-gradient-to-br ${TOOLS[index].color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-500`} />
                        <img 
                            src={TOOLS[index].image} 
                            alt={TOOLS[index].title} 
                            className="relative z-10 w-full h-full object-cover rounded-2xl border border-white/10 shadow-2xl"
                        />
                    </div>
                    
                    <div className="mt-8">
                        <h3 className="text-2xl font-bold text-white mb-3">
                            {TOOLS[index].title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {TOOLS[index].description}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="flex gap-2 mt-5">
                {TOOLS.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`h-1 rounded-full transition-all duration-500 ${
                            i === index ? "w-8 bg-primary" : "w-2 bg-white/10"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        gender: "",
        password: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { firstName, lastName, email, password, confirmPassword, phone, gender } = formData;
        const name = `${firstName} ${lastName}`.trim();
        const result = await register(name, email, password, confirmPassword, phone, gender);
        setIsSubmitting(false);
        
        if (result.success) {
            navigate("/");
        } else if (result.status === 400 && result.message.includes("already registered")) {
            // Already registered - redirect to login after a short delay
            setTimeout(() => {
                navigate("/login", { state: { email: formData.email } });
            }, 2000);
        }
    };

    return (
        <div className="auth-page register-page-root">
            {/* Animated Mesh Gradient */}
            <div className="auth-mesh-gradient" />
            
            {/* Interactive Particle Constellation */}
            <ParticleBackground />
            
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="register-split-container"
            >
                {/* LEFT SIDE: Branding & Info */}
                <motion.div variants={itemVariants} className="register-branding-pane glass-card">
                    <Link to="/" className="flex items-center gap-3 group mb-12">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/25">
                            <ShieldCheck className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-3xl font-bold tracking-tight text-white group-hover:text-primary transition-colors duration-300">
                            Doc<span className="text-primary group-hover:text-white transition-colors duration-300">Zen</span>
                        </span>
                    </Link>

                    <div className="register-hero-content">
                        <h2 className="text-4xl font-bold text-white mb-10 leading-tight tracking-tight">
                            Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Intelligence</span>
                        </h2>
                        
                        <ToolCarousel />
                    </div>

                </motion.div>

                {/* RIGHT SIDE: Form */}
                <motion.div variants={itemVariants} className="register-form-pane glass-card">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                        <p className="text-muted-foreground">Start your workspace journey today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="register-grid-form">
                        <div className="auth-input-group">
                            <label className="text-sm font-medium text-white/80 pl-1">First Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <input
                                    name="firstName"
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="John"
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label className="text-sm font-medium text-white/80 pl-1">Last Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <input
                                    name="lastName"
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label className="text-sm font-medium text-white/80 pl-1">Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <input
                                    name="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label className="text-sm font-medium text-white/80 pl-1">Gender</label>
                            <select
                                name="gender"
                                required
                                value={formData.gender}
                                onChange={handleChange}
                                className="auth-input appearance-none cursor-pointer"
                                style={{ paddingLeft: '1rem' }}
                            >
                                <option value="" disabled className="bg-slate-900">Select Gender</option>
                                <option value="male" className="bg-slate-900">Male</option>
                                <option value="female" className="bg-slate-900">Female</option>
                                <option value="other" className="bg-slate-900">Other</option>
                            </select>
                        </div>

                        <div className="auth-input-group col-span-full">
                            <label className="text-sm font-medium text-white/80 pl-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label className="text-sm font-medium text-white/80 pl-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="auth-input pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-primary transition-colors h-full"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label className="text-sm font-medium text-white/80 pl-1">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`auth-input pr-12 ${formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500/50' : ''}`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-primary transition-colors h-full"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-xs text-red-500 mt-1 pl-1 font-medium">Passwords do not match</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || (formData.password !== formData.confirmPassword)}
                            className="auth-button col-span-full flex items-center justify-center gap-2 mt-4"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Create Account <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="font-medium text-primary hover:text-white transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
