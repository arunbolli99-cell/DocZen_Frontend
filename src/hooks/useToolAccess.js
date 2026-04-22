import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export const useToolAccess = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const checkAccess = () => {
        if (!user) {
            toast.error("Please login to use this tool!");
            navigate("/login");
            return false;
        }
        return true;
    };

    return { checkAccess, isAuthenticated: !!user };
};
