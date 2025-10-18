// import {
//     Bars3Icon,
//     HomeIcon,
//     // UserGroupIcon,
//     DocumentTextIcon,
//     ChartBarIcon,
//     FolderIcon,
// } from '@heroicons/react/24/outline';
// import { CiUser } from "react-icons/ci";
// import { IoNotificationsOutline } from "react-icons/io5";
// import {HiOutlineUserGroup} from "react-icons/hi2"
import { IoHome } from "react-icons/io5";
import { FaFolderClosed } from "react-icons/fa6";
import { CgPerformance } from "react-icons/cg";
import React, {useState} from "react";
import { FaBars } from "react-icons/fa6";
import {Link, useLocation} from "react-router-dom";

interface NavItem {
    name: string;
    path: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
    { name: 'Home', path: '/home', icon: IoHome },
    { name: 'Quản lý thư mục', path: '/directory', icon: FaFolderClosed },
    { name: 'Theo dõi hiệu năng', path: '/test-page', icon: CgPerformance }, // Đường dẫn đúng
    // { name: 'Theo dõi tiến trình', path: '/statistical-page', icon: ChartBarIcon },
    // {name: 'Hội nhóm', path: '/room-page', icon:HiOutlineUserGroup},
    // {name:"Thông báo", path:"notification-page", icon:IoNotificationsOutline}
];

interface SidebarProps {
    sidebarWidth: number;
    onToggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({sidebarWidth, onToggleSidebar}) => {
    const [isCollapsed, setIsCollapsed] = useState(sidebarWidth === 80);
    const location = useLocation();
    
    
    React.useEffect(() => {
        setIsCollapsed(sidebarWidth === 80);
    }, [sidebarWidth]);
    return (
        <div style={{display: 'flex', minHeight: '100vh'}}>
            {/* Sidebar */}
            <div
                className={`bg-gray-800 fixed top-0 left-0 h-full shadow-lg transition-all duration-300`}
                style={{width: sidebarWidth}}
            >
                <div className="hover:bg-indigo-500 p-4">
                    <button
                        onClick={onToggleSidebar}
                        className="w-full flex items-center pt-2  rounded-lg transition-colors"
                    >
                        <FaBars className="h-6 w-6 text-white"/>
                    </button>
                </div>
                <nav className="mt-4 h-auto overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-500 transition-colors ${
                                    isActive ? 'bg-indigo-900 text-blue-600' : ''
                                }`}
                            >
                                <item.icon className="h-6 w-6 text-white"/>
                                {!isCollapsed && (
                                    <span className="ml-3 text-white">{item.name}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    )
}

export default Sidebar;