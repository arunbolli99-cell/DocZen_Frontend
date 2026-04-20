import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import ParticleBackground from "../../../components/ParticleBackground";
import "./Login.css";

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

export default function LoginPage() {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || "");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await login(email, password);
        setIsSubmitting(false);
        if (result.success) {
            const from = location.state?.from?.pathname || "/";
            navigate(from, { replace: true });
        }
    };

    return (
        <div className="auth-page">
            {/* Animated Mesh Gradient */}
            <div className="auth-mesh-gradient" />

            {/* Interactive Particle Constellation */}
            <ParticleBackground />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="auth-card"
            >
                {/* Logo */}
                <motion.div variants={itemVariants} className="flex justify-center mb-8">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/25">
                            <ShieldCheck className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-3xl font-bold tracking-tight text-white group-hover:text-primary transition-colors duration-300">
                            Doc<span className="text-primary group-hover:text-white transition-colors duration-300">Zen</span>
                        </span>
                    </Link>
                </motion.div>

                {/* Card */}
                <motion.div variants={itemVariants} className="auth-form-wrapper">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />

                    <div className="auth-header">
                        <h1 className="text-2xl font-bold text-white mb-2 flex gap-x-2 justify-center">
                            {"Welcome Back".split(" ").map((word, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, x: -10, filter: "blur(8px)" }}
                                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                    transition={{
                                        duration: 0.6,
                                        delay: 0.4 + (i * 0.1),
                                        ease: "easeOut"
                                    }}
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </h1>
                        <p className="text-muted-foreground text-sm">Sign in to continue to your AI tools suite</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="auth-input-group">
                            <label className="text-sm font-medium text-white/80 pl-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="auth-button flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <Link to="/register" className="font-medium text-primary hover:text-white transition-colors">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
