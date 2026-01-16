import {useEffect, useState, useRef} from "react";
import {useDirectoryStore} from "../../Store/Slices/DirectoryItem/DirectoryItemSlices.ts";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { createFolderConnectioṇ̣̣ } from "../../Hubs/connection";
import { copyComponent } from "../FolderComponent/CopyComponent";
import { deleteFolder } from "../FolderComponent/DeleteComponent";
import { renameComponent } from "../FolderComponent/RenameComponent";
import FolderActionsComponent from "../FolderComponent/FolderActionsComponent";
import FolderModalsComponent from "../FolderComponent/FolderModalsComponent";
import FolderListComponent from "../FolderComponent/FolderListComponent";
import DeleteControlComponent from "../FolderComponent/DeleteControlComponent";
import type { HubConnection } from "@microsoft/signalr";
import {getAuthTokens} from "../../Store/Slices/AuthSlice/AuthSlice.tsx";

interface DirectoryComponentProps {
    onSelectFolder?: (path: string) => void;
    hideActions?: boolean; // nếu muốn ẩn nút
}
const DirectoryComponent: React.FC<DirectoryComponentProps> = ({ onSelectFolder}) => {
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
    const [isCreating, setIsCreating] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const connectionRef = useRef<HubConnection | null>(null);

    const tokens = getAuthTokens();

    const requireRoot = () => {
        if (!tokens) throw new Error("Bạn chưa đăng nhập");
        if (tokens.role !== "root") throw new Error("Bạn không có quyền");
    };
    
    const [clipboard, setClipboard] = useState<{
        items: string[];
        mode: 'copy' | 'cut' | null;
        overwrite: boolean;
        includeRoot: boolean;
    }>({ items: [], mode: null, overwrite: false, includeRoot: true });
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
            if (onSelectFolder) onSelectFolder(newPath);
        }
    };

    const handleCreateFolder = async () => {
        requireRoot();
        setCreateError(null);
        const name = newFolderName?.trim();
        if (!name) {
            setCreateError("Tên folder không được để trống");
            return;
        }

        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        setIsCreating(true);

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
        } finally {
            setIsCreating(false);
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
        requireRoot();
        setIsDeleteMode(!isDeleteMode);
        if (isDeleteMode) {
            setSelectedItems(new Set());
        }
    };
    const handleItemSelect = (itemPath: string, event: React.MouseEvent) => {
        requireRoot();
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
        requireRoot();
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map(item => item.fullPath)));
        }
    };
    const handleDeleteSelected = async () => {
        requireRoot()
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
    const handleRenameMode = () => {
        requireRoot();
        setIsRenameMode(!isRenameMode);
    };
    const handleRenameClick = (item: any, event: React.MouseEvent) => {
        requireRoot();
        event.stopPropagation();
        setRenameItem({ path: item.fullPath, name: item.name });
        setNewName(item.name);
        setRenameError(null);
        setShowRenameModal(true);
    };
    const handleRename = async () => {
        requireRoot();
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
    const handleCloseCreateModal = () => {
        setShowCreateFolderModal(false);
        setNewFolderName("");
        setCreateError(null);
    };
    const handleCloseRenameModal = () => {
        setShowRenameModal(false);
        setRenameItem(null);
        setNewName("");
        setRenameError(null);
    };

    // Copy/Cut/Paste handlers
    const handleCopySelected = () => {
        requireRoot()
        // Mở modal chọn thư mục để copy từ danh sách hiện tại
        setShowCopyModal(true);
    };

    const handleCutSelected = () => {
        requireRoot();
        if (selectedItems.size === 0) return;
        setClipboard({
            items: Array.from(selectedItems),
            mode: 'cut',
            overwrite: false,
            includeRoot: true
        });
    };

    const handleCancelClipboard = () => {
        setClipboard({ items: [], mode: null, overwrite: false, includeRoot: true });
    };

    const handlePasteClipboard = async () => {
        requireRoot();
        if (!clipboard.mode || clipboard.items.length === 0) return;
        if (!currentPath && currentPath !== "") return; 
        const destinationPath = currentPath || "";

        try {
            for (const sourcePath of clipboard.items) {
                await copyComponent(
                    sourcePath,
                    destinationPath,
                    () => {},
                    (err) => { console.error('Copy error:', err); },
                    clipboard.overwrite,
                    clipboard.includeRoot
                );
            }
            if (currentPath) {
                browsePath(currentPath);
            } else {
                scanRoot();
            }
        } catch (e) {
            console.error('Paste failed:', e);
        } finally {
            setClipboard({ items: [], mode: null, overwrite: false, includeRoot: true });
            setSelectedItems(new Set());
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
            <FolderActionsComponent
                showCreateMenu={showCreateMenu}
                setShowCreateMenu={(show) => setShowCreateMenu(show)}
                setShowCreateFolderModal={setShowCreateFolderModal}
                isDeleteMode={isDeleteMode}
                handleDeleteMode={handleDeleteMode}
                isRenameMode={isRenameMode}
                handleRenameMode={handleRenameMode}
                onCopySelected={handleCopySelected}
                onCutSelected={handleCutSelected}
                onPasteClipboard={handlePasteClipboard}
                onCancelClipboard={handleCancelClipboard}
                canPaste={clipboard.items.length > 0}
                canCopyOrCut={true}
                clipboardLabel={`${clipboard.items.length} items (${clipboard.mode ?? ''})`}
                currentPath={currentPath}
            />
            <DeleteControlComponent
                isDeleteMode={isDeleteMode}
                selectedItemsCount={selectedItems.size}
                totalItemsCount={items.length}
                isDeleting={isDeleting}
                onSelectAll={handleSelectAll}
                onCancel={() => {
                    setIsDeleteMode(false);
                    setSelectedItems(new Set());
                }}
                onDeleteSelected={handleDeleteSelected}
            />
            
            <FolderModalsComponent
                showCreateFolderModal={showCreateFolderModal}
                newFolderName={newFolderName}
                setNewFolderName={setNewFolderName}
                createError={createError}
                isCreating={isCreating}
                onCreateFolder={handleCreateFolder}
                onCloseCreateModal={handleCloseCreateModal}
                showRenameModal={showRenameModal}
                renameItem={renameItem}
                newName={newName}
                setNewName={setNewName}
                renameError={renameError}
                isRenaming={isRenaming}
                onRename={handleRename}
                onCloseRenameModal={handleCloseRenameModal}
                showCopyModal={showCopyModal}
                copyCandidates={items.map(it => ({ path: it.fullPath, name: it.name, isDirectory: it.isDirectory }))}
                onConfirmCopySelection={(paths) => {
                    setClipboard({ items: paths, mode: 'copy', overwrite: false, includeRoot: true });
                    setShowCopyModal(false);
                }}
                onCancelCopySelection={() => setShowCopyModal(false)}
            />

            <FolderListComponent
                items={items}
                loading={loading}
                error={error}
                isDeleteMode={isDeleteMode}
                selectedItems={selectedItems}
                onItemSelect={handleItemSelect}
                onFolderClick={handleFolderClick}
                isRenameMode={isRenameMode}
                onRenameClick={handleRenameClick}
            />
        </div>
    );
};

export default DirectoryComponent;