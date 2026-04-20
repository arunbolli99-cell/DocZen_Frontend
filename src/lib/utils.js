import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function getAvatarSrc(path) {
    if (!path) return null;
    
    let url = path;
    if (!path.startsWith('http')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        url = `${cleanBaseUrl}${cleanPath}`;
    }

    // Force https for production backend
    if (url.includes('onrender.com') && url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
    }

    // Add cache buster to force visual update
    return `${url}${url.includes('?') ? '&' : '?'}v=${new Date().getTime()}`;
}
