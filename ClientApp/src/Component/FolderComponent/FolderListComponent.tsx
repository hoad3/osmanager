import React, {useState} from 'react';
import { MdDriveFileRenameOutline } from "react-icons/md";
import {useFileStore} from "../../Store/Slices/FileSlice/FileSlice.ts";

interface FolderItem {
    fullPath: string;
    name: string;
    isDirectory: boolean;
}

interface FolderListProps {
    items: FolderItem[];
    loading: boolean;
    error: string | null;
    isDeleteMode: boolean;
    selectedItems: Set<string>;
    onItemSelect: (itemPath: string, event: React.MouseEvent) => void;
    onFolderClick: (item: FolderItem) => void;
    isRenameMode: boolean;
    onRenameClick: (item: FolderItem, event: React.MouseEvent) => void;
}

const forbiddenExtensions = [".tar", ".exe", ".bat", ".cmd"]; // danh sách file cấm

const FolderListComponent: React.FC<FolderListProps> = ({
                                                            items,
                                                            loading,
                                                            error,
                                                            isDeleteMode,
                                                            selectedItems,
                                                            onItemSelect,
                                                            onFolderClick,
                                                            isRenameMode,
                                                            onRenameClick
                                                        }) => {
    const { readFile, updateFile, fileContent, loading: fileLoading, error: fileError } = useFileStore();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingFilePath, setEditingFilePath] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState<string>("");

    React.useEffect(() => {
        if (modalOpen) {
            if (typeof fileContent === "object") {
                setEditorContent(JSON.stringify(fileContent, null, 2)); // ⭐ stringify đẹp
            } else {
                setEditorContent(fileContent ?? "");
            }
        }
    }, [fileContent, modalOpen]);
    const isForbiddenFile = (fileName: string) => {
        const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
        return forbiddenExtensions.includes(ext);
    };

    const handleItemClick = async (item: FolderItem) => {
        
        if (item.isDirectory) {
            onFolderClick(item);
            // console.log("file:")
        } else if (isForbiddenFile(item.name)) {
            alert(`File ${item.name} không được phép mở.`);
        } else {
            try {
                setEditingFilePath(item.fullPath);
                setModalOpen(true);
                await readFile(item.fullPath);
                // console.log("file:")
                // setEditorContent(fileContent ?? "");
            } catch (err) {
                console.error("Không đọc được file:", err);
            }
        }
    };

    if (loading) return <div>Đang tải...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <>
            <ul>
                {items.map((item) => {
                    const forbidden = isForbiddenFile(item.name);
                    return (
                        <li
                            key={item.fullPath}
                            className={`relative flex items-center justify-between p-1 hover:border-1 rounded-2xl ${
                                item.isDirectory ? "font-bold text-indigo-600" : "text-gray-200"
                            } ${
                                isDeleteMode ? 'cursor-default' : forbidden ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                            } ${
                                selectedItems.has(item.fullPath) ? 'bg-red-900/20 border border-red-500' : ''
                            }`}
                            onClick={isDeleteMode || forbidden ? undefined : () => handleItemClick(item)}
                        >
                            <div className="flex items-center min-w-0">
                                {isDeleteMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.has(item.fullPath)}
                                        onChange={(e) => onItemSelect(item.fullPath, e as any)}
                                        className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                    />
                                )}
                                <span className="mr-2">{item.isDirectory ? "📁" : "📄"}</span>
                                <span className="truncate" title={item.fullPath}>{item.name}</span>
                            </div>
                            {isRenameMode && !forbidden && (
                                <button
                                    onClick={(e) => onRenameClick(item, e)}
                                    className="ml-2 p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded"
                                    title="Đổi tên"
                                >
                                    <MdDriveFileRenameOutline className="h-4 w-4" />
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-3xl p-4 relative">
                        <h2 className="text-lg font-bold mb-2">{editingFilePath}</h2>

                        {fileLoading ? (
                            <div>Đang tải file...</div>
                        ) : fileError ? (
                            <div className="text-red-500">{fileError}</div>
                        ) : (
                            <textarea
                                className="w-full h-80 border border-gray-300 rounded p-2 font-mono text-sm"
                                value={editorContent}
                                onChange={(e) => setEditorContent(e.target.value)}
                            />
                        )}

                        <div className="flex justify-end mt-4 space-x-2">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={async () => {
                                    if (editingFilePath) {
                                        await updateFile(editingFilePath, editorContent);
                                        setModalOpen(false);
                                    }
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FolderListComponent;