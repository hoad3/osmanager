import {Outlet} from "react-router-dom";
import Sidebar from "../../Component/SidebarComponent/SideBar.tsx";
import {useState} from "react";

const Layout: React.FC = () => {
    const [sidebarWidth, setSidebarWidth] = useState(256); // 256px = 64 (w-64)
    const handleToggleSidebar = () => {
        setSidebarWidth(sidebarWidth === 256 ? 80 : 256); // 80px = 20 (w-20)
    };
    return (
        <div className="min-h-screen bg-zinc-700 flex">
            <Sidebar sidebarWidth={sidebarWidth} onToggleSidebar={handleToggleSidebar} />
            <div
                className="transition-all duration-300 flex-1"
                style={{ marginLeft: sidebarWidth }}
            >
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;