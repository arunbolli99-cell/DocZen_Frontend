import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";

export default function Layout() {
    const location = useLocation();

    return (
        <div className="layout-container">
            <Sidebar />
            <main className="main-content">
                <div className="scroll-container">
                    <AnimatePresence mode="wait">
                        <PageTransition key={location.pathname}>
                            <Outlet />
                        </PageTransition>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
