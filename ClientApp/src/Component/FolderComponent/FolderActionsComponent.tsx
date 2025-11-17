import React, { useState, useRef } from 'react';
import { FileCreateHubs } from '../../Hubs/FileHubs/FileHubs';
import { IoAddOutline } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaRegCopy } from "react-icons/fa6";
import { MdOutlineContentCut, MdDriveFileRenameOutline } from "react-icons/md";
import { IoCloudUploadOutline } from "react-icons/io5";
import { initUploadHub, uploadFiles } from '../../Hubs/UploadHubs/UploadHubs';

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
    currentPath,
    onFileCreated
}) => {
    const [creating, setCreating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFilesSelected = async (filesList: FileList | null) => {
        const files = filesList ? Array.from(filesList) : [];
        if (files.length === 0) return;
        const target = currentPath && currentPath.trim() !== '' ? currentPath.replace(/\/$/, '') : '';
        setUploading(true);
        try {
            const conn = await initUploadHub();
            await uploadFiles(
                conn,
                target,
                files,
                () => {
                    alert('Upload thành công');
                },
                (err) => {
                    alert(`Lỗi upload: ${String(err)}`);
                }
            );
        } catch (err: any) {
            alert(`Lỗi khi upload: ${err?.message ?? String(err)}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
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
            <div className="relative mr-10">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 w-28 flex justify-center items-center flex-row h-8 border-2 rounded-2xl border-gray-100"
                    aria-haspopup="true"
                    aria-expanded={showCreateMenu}
                    disabled={uploading}
                >
                    <IoCloudUploadOutline className='h-6 w-6 font-bold text-gray-100'/>
                    <div className='text-gray-100 font-bold flex justify-center items-center ml-2'>
                        {uploading ? 'Đang tải...' : 'Tải lên'}
                    </div>
                </button>
            </div>
        </div>
    );
};

export default FolderActionsComponent;
