import {useEffect, useState, useRef} from "react";
import {useDirectoryStore} from "../../Store/Slices/DirectoryItem/DirectoryItemSlices.ts";
import { IoAddOutline , IoArrowBackCircleOutline, IoCloudUploadOutline  } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaRegCopy } from "react-icons/fa6";
import { MdOutlineContentCut, MdDriveFileRenameOutline } from "react-icons/md";
import { createFolderConnectioṇ̣̣ } from "../../Hubs/connection";
import { deleteFolder } from "../FolderComponent/DeleteComponent";
import { renameComponent } from "../FolderComponent/RenameComponent";
import type { HubConnection } from "@microsoft/signalr";
const DirectoryComponent: React.FC = () => {
    const { items, loading, scanRoot, browsePath, error } = useDirectoryStore();
    const [currentPath, setCurrentPath] = useState<string>("");
    const [, setOpenMenu] = useState<string | null>(null); 
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRenameMode, setIsRenameMode] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameItem, setRenameItem] = useState<{path: string, name: string} | null>(null);
    const [newName, setNewName] = useState("");
    const [renameError, setRenameError] = useState<string | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const connectionRef = useRef<HubConnection | null>(null);
    useEffect(() => {
        scanRoot();
        setCurrentPath("");
    }, []);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.item-menu') || target.closest('.item-menu-button')) {
                return;
            }
            setOpenMenu(null);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);
    
    
    const handleFolderClick = (item: any) => {
        if (item.isDirectory) {
            const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
            browsePath(newPath);
            setCurrentPath(newPath);
        }
    };

    const handleCreateFolder = async () => {
        setCreateError(null);
        const name = newFolderName?.trim();
        if (!name) {
            setCreateError("Tên folder không được để trống");
            return;
        }

        const fullPath = currentPath ? `${currentPath}/${name}` : name;

        try {
            let conn = connectionRef.current;
            if (!conn) {
                conn = createFolderConnectioṇ̣̣();
                connectionRef.current = conn;
                await conn.start();

                conn.on("AddFolder", (_folder) => {
                    if (currentPath) browsePath(currentPath);
                    else scanRoot();
                });

                conn.on("Error", (msg: string) => {
                    setCreateError(msg);
                });
            }

            await conn.invoke("AddFolder", fullPath);
            setShowCreateFolderModal(false);
            setNewFolderName("");
        } catch (err: any) {
            setCreateError(err?.message || "Lỗi khi tạo folder");
        }
    };
    const handleBack = () => {
        if (!currentPath) return;
        const parts = currentPath.split("/");
        parts.pop();
        const parentPath = parts.join("/");
        if (parentPath) {
            browsePath(parentPath);
        } else {
            scanRoot();
        }
        setCurrentPath(parentPath);
    };
    const handleDeleteMode = () => {
        setIsDeleteMode(!isDeleteMode);
        if (isDeleteMode) {
            setSelectedItems(new Set());
        }
    };
    const handleItemSelect = (itemPath: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemPath)) {
                newSet.delete(itemPath);
            } else {
                newSet.add(itemPath);
            }
            return newSet;
        });
    };
    const handleSelectAll = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map(item => item.fullPath)));
        }
    };
    const handleDeleteSelected = async () => {
        if (selectedItems.size === 0) return;
        
        setIsDeleting(true);
        try {
            for (const itemPath of selectedItems) {
                await deleteFolder(
                    itemPath,
                    true,
                    (folderInfo) => {
                        console.log('Folder deleted:', folderInfo);
                    },
                    (error) => {
                        console.error('Delete error:', error);
                    }
                );
            }
            if (currentPath) {
                browsePath(currentPath);
            } else {
                scanRoot();
            }
            setIsDeleteMode(false);
            setSelectedItems(new Set());
        } catch (error) {
            console.error('Error deleting items:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Hàm xử lý chế độ rename
    const handleRenameMode = () => {
        setIsRenameMode(!isRenameMode);
    };

    // Hàm xử lý click vào icon rename
    const handleRenameClick = (item: any, event: React.MouseEvent) => {
        event.stopPropagation();
        setRenameItem({ path: item.fullPath, name: item.name });
        setNewName(item.name);
        setRenameError(null);
        setShowRenameModal(true);
    };

    // Hàm xử lý rename
    const handleRename = async () => {
        if (!renameItem || !newName.trim()) {
            setRenameError("Tên mới không được để trống");
            return;
        }

        setIsRenaming(true);
        setRenameError(null);

        try {
            await renameComponent(
                renameItem.path,
                newName.trim(),
                (folderInfo) => {
                    console.log('Item renamed:', folderInfo);
                    // Refresh danh sách
                    if (currentPath) {
                        browsePath(currentPath);
                    } else {
                        scanRoot();
                    }
                    setShowRenameModal(false);
                    setRenameItem(null);
                    setNewName("");
                },
                (error) => {
                    console.error('Rename error:', error);
                    setRenameError(error);
                }
            );
        } catch (error) {
            console.error('Failed to rename item:', error);
            setRenameError(error instanceof Error ? error.message : "Có lỗi xảy ra khi đổi tên");
        } finally {
            setIsRenaming(false);
        }
    };
    return (
        <div className="p-4 ">
            <h2 className="font-bold mb-2 text-gray-100">Cấu trúc thư mục</h2>
            <div className="mb-2 flex justify-start">
                <div className='flex justify-center items-center flex-row h-8 w-full'>
                    {currentPath && (
                        <button
                            className="font-bold text-gray-100 "
                            onClick={handleBack}
                        >
                            <IoArrowBackCircleOutline className="h-6 w-6 mr-5"/>
                        </button>
                    )}

                    <span className="text-gray-100 w-28">Đường dẫn:</span>
                    <div className="flex-1 min-w-0 ml-2">
                        <span className="text-gray-100 block truncate">{currentPath || "/"}</span>
                    </div>
                </div>
            </div>
            <div className='flex justify-start items-center flex-row'>
                <div className="relative mr-10">
                    <button
                        onClick={() => setShowCreateMenu(v => !v)}
                        className="flex-shrink-0 w-28 flex justify-center items-center flex-row h-8 border-2 rounded-2xl border-gray-100"
                        aria-haspopup="true"
                        aria-expanded={showCreateMenu}
                    >
                        <IoAddOutline className='h-6 w-6 font-bold text-gray-100'/>
                        <div className='text-gray-100 font-bold flex justify-center items-center ml-2'>
                            Tạo
                        </div>
                    </button>
                    {showCreateMenu && (
                        <div className="absolute mt-2 w-40 bg-slate-700 text-gray-300 rounded shadow z-50">
                            <ul className="p-1">
                                <li>
                                    <button className="w-full text-left px-3 py-1 hover:bg-slate-600 rounded-2xl"
                                            onClick={() => {
                                                setShowCreateMenu(false);
                                            }}>Tạo file
                                    </button>
                                </li>
                                <li>
                                    <button className="w-full text-left px-3 py-1 hover:bg-slate-600 rounded-2xl"
                                            onClick={() => {
                                                setShowCreateFolderModal(true);
                                                setShowCreateMenu(false);
                                            }}>Tạo folder
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
                <div className="relative mr-10">
                    <button

                        className="flex-shrink-0 w-28 flex justify-center items-center flex-row h-8 border-2 rounded-2xl border-gray-100"
                        aria-haspopup="true"
                        aria-expanded={showCreateMenu}
                    >
                        <FaRegCopy className='h-6 w-6 font-bold text-gray-100'/>
                        <div className='text-gray-100 font-bold flex justify-center items-center ml-2'>
                            Copy
                        </div>
                    </button>
                </div>
                <div className="relative mr-10">
                    <button
                        className="flex-shrink-0 w-28 flex justify-center items-center flex-row h-8 border-2 rounded-2xl border-gray-100"
                        aria-haspopup="true"
                        aria-expanded={showCreateMenu}
                    >
                        <MdOutlineContentCut className='h-6 w-6 font-bold text-gray-100'/>
                        <div className='text-gray-100 font-bold flex justify-center items-center ml-2'>
                            Cut
                        </div>
                    </button>
                </div>
                <div className="relative mr-10">
                    <button
                        onClick={handleDeleteMode}
                        className={`flex-shrink-0 w-28 flex justify-center items-center flex-row h-8 border-2 rounded-2xl ${
                            isDeleteMode
                                ? 'border-red-500 bg-red-600'
                                : 'border-gray-100'
                        }`}>
                        <RiDeleteBin6Line className='h-6 w-6 font-bold text-gray-100'/>
                        <div className='text-gray-100 font-bold flex justify-center items-center ml-2'>
                            {isDeleteMode ? 'Hủy' : 'Delete'}
                        </div>
                    </button>
                </div>
                <div className="relative mr-10">
                    <button
                        onClick={handleRenameMode}
                        className={`flex-shrink-0 w-28 flex justify-center items-center flex-row h-8 border-2 rounded-2xl ${
                            isRenameMode 
                                ? 'border-blue-500 bg-blue-600' 
                                : 'border-gray-100'
                        }`}
                    >
                        <MdDriveFileRenameOutline className='h-6 w-6 font-bold text-gray-100'/>
                        <div className='text-gray-100 font-bold flex justify-center items-center ml-2'>
                            {isRenameMode ? 'Hủy' : 'Rename'}
                        </div>
                    </button>
                </div>
                <div className="relative mr-10">
                    <button
                        className="flex-shrink-0 w-28 flex justify-center items-center flex-row h-8 border-2 rounded-2xl border-gray-100"
                        aria-haspopup="true"
                        aria-expanded={showCreateMenu}
                    >
                        <IoCloudUploadOutline className='h-6 w-6 font-bold text-gray-100'/>
                        <div className='text-gray-100 font-bold flex justify-center items-center ml-2'>
                            Tải lên
                        </div>
                    </button>
                </div>
            </div>
            {isDeleteMode && (
                <div className="mb-4 p-3 mt-10 bg-red-900/20 border border-red-500 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-100 font-medium">
                                Đã chọn: {selectedItems.size} item(s)
                            </span>
                            <button
                                onClick={handleSelectAll}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {selectedItems.size === items.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => {
                                    setIsDeleteMode(false);
                                    setSelectedItems(new Set());
                                }}
                                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDeleteSelected}
                                disabled={selectedItems.size === 0 || isDeleting}
                                className={`px-3 py-1 rounded ${
                                    selectedItems.size === 0 || isDeleting
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700'
                                } text-white`}
                            >
                                {isDeleting ? 'Đang xóa...' : `Xóa ${selectedItems.size} item(s)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {showCreateFolderModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black opacity-50" onClick={() => {
                        setShowCreateFolderModal(false);
                        setNewFolderName("");
                        setCreateError(null);
                    }}/>
                    <div className="relative bg-slate-800 p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold text-gray-100 mb-2">Tạo folder</h3>
                        <label className="block text-gray-200 text-sm">Tên folder</label>
                        <input
                            autoFocus
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="w-full mt-2 p-2 rounded bg-slate-700 text-gray-100"
                            placeholder="Nhập tên folder"
                        />
                        {createError && <div className="text-red-500 mt-2">{createError}</div>}
                        <div className="mt-4 flex justify-end gap-2">
                            <div>
                                <button className="px-3 py-1 rounded bg-gray-600 text-gray-100" onClick={() => {
                                    setShowCreateFolderModal(false);
                                    setNewFolderName("");
                                    setCreateError(null);
                                }}>Hủy
                                </button>
                                <button
                                    className="px-3 py-1 rounded bg-indigo-600 text-white"
                                    onClick={handleCreateFolder}
                                >
                                    Tạo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal rename */}
            {showRenameModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black opacity-50" onClick={() => {
                        setShowRenameModal(false);
                        setRenameItem(null);
                        setNewName("");
                        setRenameError(null);
                    }}/>
                    <div className="relative bg-slate-800 p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold text-gray-100 mb-2">Đổi tên</h3>
                        <div className="mb-4">
                            <label className="block text-gray-200 text-sm mb-1">Tên hiện tại:</label>
                            <span className="text-gray-300">{renameItem?.name}</span>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-200 text-sm mb-1">Tên mới:</label>
                            <input
                                autoFocus
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full mt-1 p-2 rounded bg-slate-700 text-gray-100"
                                placeholder="Nhập tên mới"
                            />
                        </div>
                        {renameError && <div className="text-red-500 mb-4">{renameError}</div>}
                        <div className="flex justify-end gap-2">
                            <button 
                                className="px-3 py-1 rounded bg-gray-600 text-gray-100 hover:bg-gray-700" 
                                onClick={() => {
                                    setShowRenameModal(false);
                                    setRenameItem(null);
                                    setNewName("");
                                    setRenameError(null);
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                className={`px-3 py-1 rounded text-white ${
                                    isRenaming || !newName.trim()
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                                onClick={handleRename}
                                disabled={isRenaming || !newName.trim()}
                            >
                                {isRenaming ? 'Đang đổi tên...' : 'Đổi tên'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading && <div>Đang tải...</div>}
            {error && <div className="text-red-500">{error}</div>}
            <ul>
                {items.map((item) => (
                    <li
                        key={item.fullPath}
                        className={`relative flex items-center justify-between p-1 hover:border-1 rounded-2xl ${
                            item.isDirectory ? "font-bold text-indigo-600" : "text-gray-200"
                        } ${
                            isDeleteMode ? 'cursor-default' : 'cursor-pointer'
                        } ${
                            selectedItems.has(item.fullPath) ? 'bg-red-900/20 border border-red-500' : ''
                        }`}
                        onClick={isDeleteMode ? undefined : () => handleFolderClick(item)}
                    >
                        <div className="flex items-center min-w-0">
                            {isDeleteMode && (
                                <input
                                    type="checkbox"
                                    checked={selectedItems.has(item.fullPath)}
                                    onChange={(e) => handleItemSelect(item.fullPath, e as any)}
                                    className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                />
                            )}
                            <span className="mr-2">{item.isDirectory ? "📁" : "📄"}</span>
                            <span className="truncate" title={item.fullPath}>{item.name}</span>
                        </div>

                        {/* Thêm icon rename khi ở chế độ rename */}
                        {isRenameMode && (
                            <button
                                onClick={(e) => handleRenameClick(item, e)}
                                className="ml-2 p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded"
                                title="Đổi tên"
                            >
                                <MdDriveFileRenameOutline className="h-4 w-4" />
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DirectoryComponent;