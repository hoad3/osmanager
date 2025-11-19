import React, { useRef, useState } from 'react';
import { uploadFiles } from '../../Hubs/UploadHubs/UploadHubs';

type UploadComponentProps = {
    currentPath?: string;
    onUploaded?: (result?: any) => void;
};

const UploadComponent: React.FC<UploadComponentProps> = ({ currentPath = '', onUploaded }) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [statusMap, setStatusMap] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileSelection = (files: FileList | null) => {
        if (!files) return;
        const arr = Array.from(files);
        setSelectedFiles(arr);
        const map: Record<string, string> = {};
        arr.forEach(f => (map[f.name] = 'ready'));
        setStatusMap(map);
    };

    const doUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);

        const target = currentPath && currentPath.trim() !== '' ? currentPath.replace(/\/$/, '') : '';
        setStatusMap(prev => {
            const next = { ...prev };
            selectedFiles.forEach(f => (next[f.name] = 'uploading'));
            return next;
        });

        try {
            await uploadFiles(
                target,
                selectedFiles,
                (res) => {
                    setStatusMap(prev => {
                        const next = { ...prev };
                        selectedFiles.forEach(f => (next[f.name] = 'success'));
                        return next;
                    });
                    onUploaded?.(res);
                },
                (err) => {
                    setStatusMap(prev => {
                        const next = { ...prev };
                        selectedFiles.forEach(f => (next[f.name] = 'error'));
                        return next;
                    });
                    console.error('Upload error', err);
                }
            );
        } catch (err) {
            setStatusMap(prev => {
                const next = { ...prev };
                selectedFiles.forEach(f => (next[f.name] = 'error'));
                return next;
            });
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelection(e.target.files)}
            />

            <div className="flex items-center gap-2">
                <button
                    className="px-3 py-1 rounded bg-indigo-600 text-white"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    Chọn file
                </button>

                <button
                    className={`px-3 py-1 rounded text-white ${uploading ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'}`}
                    onClick={doUpload}
                    disabled={uploading || selectedFiles.length === 0}
                >
                    {uploading ? 'Đang tải...' : 'Upload'}
                </button>
            </div>

            {selectedFiles.length > 0 && (
                <div className="mt-2 bg-slate-800 p-2 rounded">
                    <ul className="space-y-1 text-sm text-gray-200">
                        {selectedFiles.map((f) => (
                            <li key={f.name} className="flex justify-between">
                                <span className="truncate max-w-[40ch]">{f.name}</span>
                                <span className="ml-4">
                                    {statusMap[f.name] === 'ready' && <span className="text-gray-400">Sẵn sàng</span>}
                                    {statusMap[f.name] === 'uploading' && <span className="text-yellow-300">Đang tải</span>}
                                    {statusMap[f.name] === 'success' && <span className="text-green-300">OK</span>}
                                    {statusMap[f.name] === 'error' && <span className="text-red-300">Lỗi</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UploadComponent;
