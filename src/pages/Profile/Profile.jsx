import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, ShieldCheck, Camera, LogOut, Check, Phone, ChevronRight, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { getAvatarSrc } from "../../lib/utils";
import "./Profile.css";

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

const activityRouteMap = {
    'RESUME_ANALYSIS': '/resume-analyzer',
    'AI_CHAT': '/chat',
    'URL_SHORTENER': '/url-shortener',
    'TEXT_SUMMARIZE': '/summarizer',
    'TEXT_GRAMMAR': '/grammar-checker',
    'TEXT_EXPLAIN_CODE': '/code-explainer',
    'IMAGE_AI_DETECT': '/image-detector',
    'IMAGE_AI_GENERATE': '/image-generator'
};

const storageKeyMap = {
    'RESUME_ANALYSIS': ['doczen_resume_jd', 'doczen_resume_result'],
    'AI_CHAT': ['doczen_chat_input'],
    'URL_SHORTENER': ['doczen_shortener_url', 'doczen_shortener_result'],
    'TEXT_SUMMARIZE': ['doczen_summarizer_text', 'doczen_summarizer_result'],
    'TEXT_GRAMMAR': ['doczen_grammar_text', 'doczen_grammar_result'],
    'TEXT_EXPLAIN_CODE': ['doczen_explainer_code', 'doczen_explainer_result'],
    'IMAGE_AI_DETECT': ['doczen_detector_preview', 'doczen_detector_result'],
    'IMAGE_AI_GENERATE': ['doczen_image_prompt', 'doczen_image_style', 'doczen_image_result']
};

export default function ProfilePage() {
    const { user, updateProfile, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        gender: user?.gender || "",
    });

    const groupActivities = (activities) => {
        if (!activities || activities.length === 0) return [];
        
        const grouped = [];
        let currentGroup = null;

        activities.forEach((activity) => {
            const isChat = activity.action_type === 'AI_CHAT';
            const timestamp = new Date(activity.timestamp).getTime();

            if (isChat) {
                if (currentGroup && (new Date(currentGroup.timestamp).getTime() - timestamp) < 15 * 60 * 1000) {
                    // Update current group
                    currentGroup.count += 1;
                    currentGroup.ids.push(activity.id);
                    // Keep the latest description or a generic one
                    currentGroup.description = `AI Chat Session (${currentGroup.count} messages)`;
                } else {
                    // Start new group
                    currentGroup = {
                        ...activity,
                        isGroup: true,
                        count: 1,
                        ids: [activity.id],
                        description: `AI Chat Session (1 message)`
                    };
                    grouped.push(currentGroup);
                }
            } else {
                currentGroup = null;
                grouped.push({ ...activity, ids: [activity.id] });
            }
        });

        return grouped;
    };

    const handleDeleteActivity = async (e, ids, actionType) => {
        e.preventDefault();
        e.stopPropagation();
        
        const deletePromises = ids.map(id => api.delete(`auth/activities/${id}/`));
        
        try {
            await Promise.all(deletePromises);
            
            // Clear local storage for this tool
            if (actionType && storageKeyMap[actionType]) {
                storageKeyMap[actionType].forEach(key => localStorage.removeItem(key));
            }
            
            toast.success(ids.length > 1 ? "Session deleted." : "Activity deleted.");
            refreshUser();
        } catch (error) {
            console.error("Delete Activity Error:", error);
            toast.error("Failed to delete activity.");
        }
    };

    const groupedActivities = groupActivities(user.recent_activities);

    const handleClearAllActivities = async () => {
        if (!window.confirm("Are you sure you want to clear all activities?")) return;
        try {
            const response = await api.delete("auth/activities/");
            if (response.data?.success) {
                // Clear ALL tool-related localStorage
                Object.values(storageKeyMap).flat().forEach(key => localStorage.removeItem(key));
                
                toast.success("All activities cleared.");
                refreshUser();
            }
        } catch (error) {
            console.error("Clear Activities Error:", error);
            toast.error("Failed to clear activities.");
        }
    };

    // Protect the route
    if (!user) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-white">Please log in to view your profile.</h2>
                    <Link to="/login" className="px-6 py-2 bg-primary text-white rounded-lg inline-block hover:bg-primary/90 transition-colors">Go to Login</Link>
                </div>
            </div>
        );
    }

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        setIsEditing(false);
        await updateProfile({ 
            name: formData.name, 
            email: formData.email,
            phone: formData.phone, 
            gender: formData.gender 
        });
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file.");
            return;
        }

        // Validate file size (e.g., 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size should be less than 2MB.");
            return;
        }

        const formData = new FormData();
        formData.append('profile_pic', file);

        try {
            setImgError(false);
            await updateProfile(formData);
            toast.success("Profile picture updated!");
        } catch (error) {
            console.error("Image Upload Error:", error);
            toast.error("Failed to upload image.");
        }
    };

    return (
        <div className="profile-container">
            {/* Background decoration */}
            <div className="dashboard-blob-1" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="w-full max-w-5xl relative z-10 space-y-8"
            >
                <motion.header variants={itemVariants} className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <User className="w-8 h-8 text-primary" />
                            <span>Profile <span className="text-gradient">Page</span></span>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your account details and security preferences.
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-semibold text-sm border border-rose-500/20"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </motion.header>

                <div className="profile-layout grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Avatar and Quick Info */}
                    <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
                        <div className="profile-card text-center p-8">
                            <div className="relative inline-block mb-6">
                                {isEditing && (
                                    <>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <button 
                                            onClick={handleImageClick}
                                            className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-primary border-4 border-[#030014] flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform z-20"
                                        >
                                            <Camera className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                                <div className="profile-avatar-large mx-auto overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
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
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
                            <p className="text-muted-foreground mb-6 font-medium text-sm">{user.email}</p>
                            
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Account Status</span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 uppercase">
                                        <Check className="w-3 h-3" /> Verified
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Date of Joining</span>
                                    <span className="text-xs text-white font-medium">
                                        {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "Recently"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    
                    {/* Personal Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div variants={itemVariants} className="profile-card h-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <User className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Personal Information</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-semibold text-white/70 ml-1">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-white/5 border border-primary/30 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                                    placeholder="Enter your name"
                                                />
                                            ) : (
                                                <div className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white flex items-center font-medium">
                                                    {user.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-sm font-semibold text-white/70 ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full bg-white/5 border border-primary/30 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                                    placeholder="Enter your email"
                                                />
                                            ) : (
                                                <div className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white flex items-center font-medium opacity-80">
                                                    {user.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-sm font-semibold text-white/70 ml-1">Phone Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full bg-white/5 border border-primary/30 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                                    placeholder="Enter your phone number"
                                                />
                                            ) : (
                                                <div className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white flex items-center font-medium">
                                                    {user.phone || "Not provided"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-semibold text-white/70 ml-1">Gender</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            {isEditing ? (
                                                <select
                                                    value={formData.gender}
                                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                    className="w-full bg-[#0d0a2d]/40 border border-primary/30 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium appearance-none"
                                                >
                                                    <option value="" disabled className="bg-[#030014]">Select Gender</option>
                                                    <option value="male" className="bg-[#030014]">Male</option>
                                                    <option value="female" className="bg-[#030014]">Female</option>
                                                    <option value="other" className="bg-[#030014]">Other</option>
                                                </select>
                                            ) : (
                                                <div className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white flex items-center font-medium">
                                                    {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : "Not provided"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    {isEditing ? (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => { setIsEditing(false); setFormData({ ...formData, name: user.name, email: user.email, phone: user.phone || "", gender: user.gender || "" }); }}
                                                className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-white/5 transition-all text-sm"
                                            >
                                                Discard
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                                            >
                                                <Check className="w-4 h-4" /> Save Changes
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-8 py-3 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm"
                                        >
                                            Edit Information
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <motion.div variants={itemVariants} className="profile-card">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                </div>
                                Recent Activity
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">Your latest interactions across DocZen</p>
                        </div>
                        {user.recent_activities && user.recent_activities.length > 0 && (
                            <button
                                onClick={handleClearAllActivities}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all group"
                            >
                                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {groupedActivities.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {groupedActivities.map((group) => (
                                    <Link 
                                        key={group.id} 
                                        to={activityRouteMap[group.action_type] || '#'}
                                        state={{ historyId: group.related_id, actionType: group.action_type }}
                                        className="relative flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all group overflow-hidden"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                                        <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0 group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                                                    {group.isGroup ? "AI CHAT SESSION" : group.action_type.replace(/_/g, ' ')}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-white/30 font-medium px-2 py-0.5 rounded-full bg-white/5 whitespace-nowrap">
                                                        {new Date(group.timestamp).toLocaleDateString()}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                {group.description}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteActivity(e, group.ids, group.action_type)}
                                            className="p-2 rounded-lg hover:bg-destructive/20 text-white/10 hover:text-destructive transition-all z-20 mr-2 opacity-0 group-hover:opacity-100"
                                            title={group.isGroup ? "Delete Session" : "Delete Activity"}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-6 h-6 text-muted-foreground/50" />
                                </div>
                                <p className="text-sm text-muted-foreground">No recent activity detected yet.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
