import { IoHome } from "react-icons/io5";
import { FaFolderClosed, FaBars } from "react-icons/fa6";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CiServer } from "react-icons/ci";
import { LiaDocker } from "react-icons/lia";
import { LuContainer } from "react-icons/lu";
import { HiMiniCubeTransparent } from "react-icons/hi2";
import {FaRegUserCircle } from "react-icons/fa";


interface NavItem {
    name: string;
    path: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const hostItems: NavItem[] = [
    { name: 'Home', path: '/home', icon: IoHome },
    { name: 'Quản lý thư mục', path: '/directory', icon: FaFolderClosed },
    { name: 'Quản lý User', path: '/user', icon: FaRegUserCircle },
];

const dockerItems: NavItem[] = [
    { name: 'Containers', path: '/container', icon: LuContainer },
    { name: 'Images', path: '/images', icon: HiMiniCubeTransparent },
];

interface SidebarProps {
    sidebarWidth: number;
    onToggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarWidth, onToggleSidebar }) => {
    const [isCollapsed, setIsCollapsed] = useState(sidebarWidth === 80);
    const location = useLocation();

    React.useEffect(() => {
        setIsCollapsed(sidebarWidth === 80);
    }, [sidebarWidth]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <div
                className={`bg-gray-800 fixed top-0 left-0 h-full shadow-lg transition-all duration-300`}
                style={{ width: sidebarWidth }}
            >
                <div className="hover:bg-indigo-500 p-4">
                    <button
                        onClick={onToggleSidebar}
                        className="w-full flex items-center pt-2 rounded-lg transition-colors"
                    >
                        <FaBars className="h-6 w-6 text-white" />
                    </button>
                </div>
                <nav className="mt-4 h-auto overflow-y-auto border-b-2 border-amber-50">
                    <div
                        className={`flex ${
                            isCollapsed ? '' : 'items-center px-4'
                        } py-3 px-4 text-white text-2xl font-bold transition-all duration-300`}
                    >
                        <CiServer
                            className={`${
                                isCollapsed ? 'h-6 w-6' : 'h-14 w-14'
                            } text-white transition-all duration-300`}
                        />
                        {!isCollapsed && (
                            <span className="ml-3 text-xl">Server</span>
                        )}
                    </div>

                    {hostItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-500 transition-colors ${
                                    isActive ? 'bg-indigo-900 text-blue-600' : ''
                                }`}
                            >
                                <item.icon className="h-6 w-6 text-white" />
                                {!isCollapsed && (
                                    <span className="ml-3 text-white">{item.name}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
                <nav className="mt-4 h-auto overflow-y-auto">
                    <div
                        className={`flex ${
                            isCollapsed ? '' : 'items-center px-4'
                        } py-3 px-4 text-white text-2xl font-bold transition-all duration-300`}
                    >
                        <LiaDocker
                            className={`${
                                isCollapsed ? 'h-6 w-6' : 'h-14 w-14'
                            } text-white transition-all duration-300`}
                        />
                        {!isCollapsed && (
                            <span className="ml-3 text-xl">Docker</span>
                        )}
                    </div>

                    {dockerItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-500 transition-colors ${
                                    isActive ? 'bg-indigo-900 text-blue-600' : ''
                                }`}
                            >
                                <item.icon className="h-6 w-6 text-white" />
                                {!isCollapsed && (
                                    <span className="ml-3 text-white">{item.name}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default Sidebar;
