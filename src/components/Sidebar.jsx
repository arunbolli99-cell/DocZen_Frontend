import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    MessageSquare,
    FileText,
    Link as LinkIcon,
    AlignLeft,
    ShieldCheck,
    Image as ImageIcon,
    Code,
    PenTool,
    Volume2,
    LayoutDashboard,
    LogOut,
    UserCircle,
    Headphones,
    Mic,
    X
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cn, getAvatarSrc } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const TOOLS = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "AI Chat", href: "/chat", icon: MessageSquare },
    { name: "Resume Analyzer", href: "/resume-analyzer", icon: FileText },
    { name: "Image Detector", href: "/image-detector", icon: ShieldCheck },
    { name: "Voice Studio", href: "/voice-tools", icon: Volume2 },
    { name: "Summarizer", href: "/summarizer", icon: AlignLeft },
    { name: "Image Generator", href: "/image-generator", icon: ImageIcon },
    { name: "Code Explainer", href: "/code-explainer", icon: Code },
    { name: "Grammar Checker", href: "/grammar-checker", icon: PenTool },
];

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const pathname = location.pathname;
    const { user, logout } = useAuth();
    const [imgError, setImgError] = useState(false);

    return (
        <aside className={cn("sidebar", isOpen ? "sidebar-open" : "")}>
            <div className="sidebar-logo-container">
                <Link to="/" className="flex items-center group no-underline">
                    <div className="text-4xl font-extrabold">
                        <span className="text-white">Doc</span>
                        <span className="text-primary">Zen</span>
                    </div>
                </Link>
                <button 
                    onClick={onClose}
                    className="mobile-sidebar-close p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="sidebar-nav">
                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Tools Suite
                </p>

                <div className="nav-links-group">
                    {TOOLS.map((tool) => {
                        const isActive = pathname === tool.href || (pathname.startsWith(tool.href) && tool.href !== "/");
                        return (
                            <Link
                                key={tool.name}
                                to={tool.href}
                                className={cn(
                                    "nav-link",
                                    isActive ? "nav-link-active" : ""
                                )}
                                onClick={onClose}
                            >
                                <tool.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-white")} />
                                {tool.name}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="sidebar-footer">
                {user ? (
                    <div className="flex items-center justify-between gap-2">
                        <Link
                            to="/profile"
                            className={cn(
                                "profile-link-compact",
                                pathname === "/profile" ? "nav-link-active" : ""
                            )}
                            onClick={onClose}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary/20 overflow-hidden">
                                {user.profile_pic && !imgError ? (
                                    <img 
                                        src={getAvatarSrc(user.profile_pic)} 
                                        alt={user.name} 
                                        className="w-full h-full object-cover"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    user.name?.charAt(0).toUpperCase() || "U"
                                )}
                            </div>
                            <span className="text-sm font-medium text-white truncate">{user.name}</span>
                        </Link>
                        <button
                            onClick={() => {
                                logout();
                                onClose();
                            }}
                            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        onClick={onClose}
                    >
                        Login to Account
                    </Link>
                )}
            </div>
        </aside>
    );
}
