import React, { useState, useRef } from 'react';
import { FileCreateHubs } from '../../Hubs/FileHubs/FileHubs';
import { IoAddOutline } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaRegCopy } from "react-icons/fa6";
import { MdOutlineContentCut, MdDriveFileRenameOutline } from "react-icons/md";
import { IoCloudUploadOutline } from "react-icons/io5";
import {useUploadStore} from "../../Store/Slices/UploadSlice/UploadSlice.ts";

interface FolderActionsProps {
    showCreateMenu: boolean;
    setShowCreateMenu: (show: boolean) => void;
    setShowCreateFolderModal: (show: boolean) => void;
    isDeleteMode: boolean;
    handleDeleteMode: () => void;
    isRenameMode: boolean;
    handleRenameMode: () => void;
    onCopySelected?: () => void;
    onCutSelected?: () => void;
    onPasteClipboard?: () => void;
    onCancelClipboard?: () => void;
    canPaste?: boolean; 
    canCopyOrCut?: boolean; 
    clipboardLabel?: string;
    /** current folder path where new files should be created, e.g. 'home/daongochoa/docs' */
    currentPath?: string;
    onFileCreated?: (fileInfo: { Name: string; Path: string }) => void;
    onFileUploaded?: () => void;
}

const FolderActionsComponent: React.FC<FolderActionsProps> = ({
    showCreateMenu,
    setShowCreateMenu,
    setShowCreateFolderModal,
    isDeleteMode,
    handleDeleteMode,
    isRenameMode,
    handleRenameMode,
    onCopySelected,
    onCutSelected,
    onPasteClipboard,
    onCancelClipboard,
    canPaste = false,
    canCopyOrCut = true,
    clipboardLabel,
    currentPath, onFileUploaded,
    onFileCreated
    
}) => {
    const [creating, setCreating] = useState(false);
    // const [uploading, setUploading] = useState(false);
    const [ ,setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { uploading, success, uploadFiles } = useUploadStore();
    const [showDropZone, setShowDropZone] = useState(false);
    const handleFilesSelected = async (filesList: FileList | null) => {
        const files = filesList ? Array.from(filesList) : [];
        if (files.length === 0) return;
        setSelectedFiles(files);

        const target = currentPath?.trim().replace(/\/$/, '') ?? '';

        try {
            await uploadFiles(target, files); // gọi trực tiếp hàm từ Zustand
            if (success) {
                alert('Upload thành công');
                if (onFileUploaded) onFileUploaded();
            }
        } catch (err: any) {
            alert(`Lỗi khi upload: ${err?.message ?? String(err)}`);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getFilesFromDataTransferItems = async (items: DataTransferItemList): Promise<File[]> => {
        const files: File[] = [];

        const traverseFileTree = (entry: any, path = ''): Promise<void> => {
            return new Promise((resolve) => {
                if (entry.isFile) {
                    entry.file((file: File) => {
                        // Lưu fullPath để server biết đường dẫn
                        const fileWithPath = new File([file], path + file.name, { type: file.type });
                        (fileWithPath as any).relativePath = path + file.name; // thêm relativePath
                        files.push(fileWithPath);
                        resolve();
                    });
                } else if (entry.isDirectory) {
                    const dirReader = entry.createReader();
                    dirReader.readEntries(async (entries: any[]) => {
                        for (const entr of entries) {
                            await traverseFileTree(entr, path + entry.name + '/');
                        }
                        resolve();
                    });
                }
            });
        };

        const promises: Promise<void>[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i].webkitGetAsEntry();
            if (item) promises.push(traverseFileTree(item));
        }

        await Promise.all(promises);
        return files;
    };
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!e.dataTransfer.items) return;

        const files = await getFilesFromDataTransferItems(e.dataTransfer.items);
        if (files.length === 0) return;

        setSelectedFiles(files);

        const target = currentPath?.trim().replace(/\/$/, '') ?? '';

        try {
            await uploadFiles(target, files); // Zustand upload
            if (success) {
                alert('Upload thành công');
                if (onFileUploaded) onFileUploaded();
            }
        } catch (err: any) {
            alert(`Lỗi khi upload: ${err?.message ?? String(err)}`);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    return (
        <div className='flex justify-start items-center flex-row'>
            {/* Tạo button */}
            <div className="relative mr-10">
                <button
                    onClick={() => setShowCreateMenu(!showCreateMenu)}
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
                                <button
                                    className="w-full text-left px-3 py-1 hover:bg-slate-600 rounded-2xl"
                                    onClick={async () => {
                                        const defaultName = 'newfile.txt';
                                        const input = window.prompt('Nhập tên file (ví dụ newfile.txt):', defaultName);
                                        setShowCreateMenu(false);
                                        if (!input || input.trim() === '') return;
                                        let targetPath = input.trim();
                                        if (currentPath && currentPath.trim() !== '') {
                                            if (!input.includes('/')) {
                                                const base = currentPath.replace(/\/$/, '');
                                                targetPath = `${base}/${input.trim()}`;
                                            } else {
                                                targetPath = input.trim();
                                            }
                                        }

                                        setCreating(true);
                                        try {
                                            await FileCreateHubs(
                                                targetPath,
                                                (fileInfo) => {
                                                    if (onFileCreated) onFileCreated(fileInfo as any);
                                                    alert(`Tạo file thành công: ${fileInfo?.Name ?? targetPath}`);
                                                },
                                                (err) => {
                                                    alert(`Lỗi khi tạo file: ${String(err)}`);
                                                }
                                            );
                                        } catch (ex: any) {
                                            alert(`Lỗi khi gọi service: ${ex?.message ?? String(ex)}`);
                                        } finally {
                                            setCreating(false);
                                        }
                                    }}
                                    disabled={creating}
                                >
                                    {creating ? 'Đang tạo...' : 'Tạo file'}
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

            {/* Copy button */}
            <div className="relative mr-10">
                <button
                    onClick={onCopySelected}
                    disabled={!canCopyOrCut}
                    className={`flex-shrink-0 w-28 flex justify-center items-center flex-row h-8 border-2 rounded-2xl ${canCopyOrCut ? 'border-gray-100' : 'border-gray-500 opacity-50 cursor-not-allowed'}`}
                    aria-haspopup="true"
                    aria-expanded={showCreateMenu}
                >
                    <FaRegCopy className='h-6 w-6 font-bold text-gray-100'/>
                    <div className='text-gray-100 font-bold flex justify-center items-center ml-2'>
                        Copy
                    </div>
                </button>
            </div>

            {/* Cut button */}
            <div className="relative mr-10">
                <button
                    onClick={onCutSelected}
                    disabled={!canCopyOrCut}
                    className={`flex-shrink-0 w-28 flex justify-center items-center flex-row h-8 border-2 rounded-2xl ${canCopyOrCut ? 'border-gray-100' : 'border-gray-500 opacity-50 cursor-not-allowed'}`}
                    aria-haspopup="true"
                    aria-expanded={showCreateMenu}
                >
                    <MdOutlineContentCut className='h-6 w-6 font-bold text-gray-100'/>
                    <div className='text-gray-100 font-bold flex justify-center items-center ml-2'>
                        Cut
                    </div>
                </button>
            </div>
            {canPaste && (
                <div className="relative mr-10">
                    <button
                        onClick={onPasteClipboard}
                        className={`flex-shrink-0 w-28 flex justify-center items-center flex-row h-8 border-2 rounded-2xl border-green-400 bg-green-600`}
                    >
                        <div className='text-gray-100 font-bold flex justify-center items-center'>
                            Paste
                        </div>
                    </button>
                </div>
            )}

            {/* Clipboard badge + Cancel */}
            {canPaste && (
                <div className="flex items-center mr-10">
                    <span className="text-sm text-gray-300 mr-3 px-2 py-1 rounded bg-slate-700">
                        {clipboardLabel || 'Ready to paste'}
                    </span>
                    <button
                        onClick={onCancelClipboard}
                        className="flex-shrink-0 h-8 px-3 border-2 rounded-2xl border-gray-100 text-gray-100"
                    >
                        Hủy
                    </button>
                </div>
            )}

            {/* Delete button */}
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

            {/* Rename button */}
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

            {/* Upload button */}
            <button
                onClick={() => setShowDropZone(!showDropZone)}
                className={`flex-shrink-0 w-28 flex justify-center items-center flex-row h-8 border-2 rounded-2xl border-gray-100`}
                disabled={uploading}
            >
                <IoCloudUploadOutline className="h-6 w-6 font-bold text-gray-100"/>
                <div className="text-gray-100 font-bold flex justify-center items-center ml-2">
                    {uploading ? 'Đang tải...' : 'Tải lên'}
                </div>
            </button>

            {showDropZone && (
                <div
                    className="absolute z-50 mt-[500px] ml-[500px] w-1/2 h-96 border-2 border-dashed border-gray-400 rounded flex flex-col justify-center items-center bg-slate-700 text-gray-200 p-4"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <p>Kéo file hoặc folder vào đây</p>
                    <p className="text-sm mt-2 text-gray-400"></p>
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => handleFilesSelected(e.target.files)}
                        {...({ webkitdirectory: 'true' } as any)}
                    />
                    {/*<button*/}
                    {/*    className="mt-3 px-4 py-1 border rounded bg-gray-600 hover:bg-gray-500"*/}
                    {/*    onClick={() => fileInputRef.current?.click()}*/}
                    {/*>*/}
                    {/*    Chọn file/folder*/}
                    {/*</button>*/}
                </div>
            )}
        </div>
    );
};

export default FolderActionsComponent;
