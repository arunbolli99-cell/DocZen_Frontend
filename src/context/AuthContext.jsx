import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const storedUser = localStorage.getItem("doczen_user");
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed); // Set initial state from storage
                    
                    // Fetch fresh profile from backend
                    const response = await api.get("auth/profile/");
                    const userData = { ...parsed, ...response.data.user };
                    setUser(userData);
                    localStorage.setItem("doczen_user", JSON.stringify(userData));
                } catch (error) {
                    console.error("Profile Fetch Error:", error);
                    if (error.response?.status === 401) {
                         localStorage.removeItem("doczen_user");
                         setUser(null);
                    }
                }
            }
            setIsLoading(false);
        };

        fetchProfile();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post("auth/login/", { email, password });
            const { access, refresh } = response.data;
            
            // Fetch profile details after login
            const profileResponse = await api.get("auth/profile/", {
                headers: { Authorization: `Bearer ${access}` }
            });

            const userData = {
                ...profileResponse.data.user,
                access,
                refresh
            };

            setUser(userData);
            localStorage.setItem("doczen_user", JSON.stringify(userData));
            toast.success("Welcome back to DocZen!");
            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);
            const msg = error.response?.data?.detail || "Invalid credentials. Please try again.";
            toast.error(msg);
            return { success: false, message: msg };
        }
    };

    const register = async (name, email, password, confirm_password, phone, gender, date_of_birth) => {
        try {
            const response = await api.post("auth/register/", { 
                name, 
                email, 
                password, 
                confirm_password, 
                phone, 
                gender,
                date_of_birth 
            });
            const { access, refresh, user: userData } = response.data;
            
            if (access && refresh) {
                const fullUser = { ...userData, access, refresh };
                setUser(fullUser);
                localStorage.setItem("doczen_user", JSON.stringify(fullUser));
                toast.success("Account created and logged in!");
            } else {
                toast.success("Account created successfully! Please login.");
            }
            return { success: true };
        } catch (error) {
            console.error("Registration Error:", error);
            const errorData = error.response?.data;
            let msg = "Registration failed. Please try again.";
            
            if (errorData) {
                // Handle DRF validation errors (which can be objects or single messages)
                if (typeof errorData === 'object') {
                    const firstError = Object.values(errorData)[0];
                    msg = Array.isArray(firstError) ? firstError[0] : firstError;
                } else {
                    msg = errorData;
                }
            }
            
            toast.error(msg);
            return { success: false, message: msg };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("doczen_user");
        toast.success("Logged out successfully.");
    };

    const updateProfile = async (data) => {
        try {
            const response = await api.patch("auth/profile/", data);
            const updatedUser = { ...user, ...response.data.user };
            setUser(updatedUser);
            localStorage.setItem("doczen_user", JSON.stringify(updatedUser));
            toast.success("Profile updated!");
            return { success: true };
        } catch (error) {
            console.error("Profile Update Error:", error);
            const errorData = error.response?.data;
            let msg = "Failed to update profile.";
            
            if (errorData) {
                if (typeof errorData === 'object') {
                    const firstError = Object.values(errorData)[0];
                    msg = Array.isArray(firstError) ? firstError[0] : firstError;
                } else {
                    msg = errorData;
                }
            }
            
            toast.error(msg);
            return { success: false };
        }
    }

    const refreshUser = async () => {
        try {
            const response = await api.get("auth/profile/");
            const userData = { ...user, ...response.data.user };
            setUser(userData);
            localStorage.setItem("doczen_user", JSON.stringify(userData));
            return { success: true };
        } catch (error) {
            console.error("Refresh User Error:", error);
            return { success: false };
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile, refreshUser }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};
