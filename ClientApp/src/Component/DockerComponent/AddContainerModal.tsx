import React, { useState } from "react";
import DirectoryComponent from "../HomePageComponent/DirectoryComponent.tsx";

interface AddContainerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (folderPath: string, sshKeyFile: File, passphrase?: string) => Promise<void>;
}

const AddContainerModal: React.FC<AddContainerModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [selectedFolder, setSelectedFolder] = useState("");
    const [sshKeyFile, setSshKeyFile] = useState<File | null>(null);
    const [passphrase, setPassphrase] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sshKeyFile || !selectedFolder) return;

        setLoading(true);
        try {
            await onSubmit(selectedFolder, sshKeyFile, passphrase);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setSelectedFolder("");
            setSshKeyFile(null);
            setPassphrase("");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-gray-900 p-6 rounded-2xl w-3/4 max-w-3xl">
                <h2 className="text-xl font-bold text-white mb-4">Tạo Container Mới</h2>

                {/* Folder selection */}
                <div className="mb-4 border border-gray-700 rounded-lg p-2 bg-gray-800">
                    <span className="text-gray-300 mb-1 block">Chọn thư mục chứa docker-compose:</span>
                    <div className="h-60 overflow-y-auto border border-gray-700 rounded p-2">
                        <DirectoryComponent
                            hideActions
                            onSelectFolder={(path) => setSelectedFolder(path)}
                        />
                    </div>
                    <span className="text-gray-200 mt-2 block">
                        Đường dẫn đã chọn: {selectedFolder || "/"}
                    </span>
                </div>

                {/* SSH Key selection */}
                <div className="mb-4">
                    <label className="block text-gray-300 mb-1">SSH Key File:</label>
                    <input
                        type="file"
                        onChange={(e) => setSshKeyFile(e.target.files?.[0] ?? null)}
                        className="bg-gray-800 text-white border border-gray-700 p-2 rounded w-full"
                        required
                    />
                    {sshKeyFile && <div className="text-gray-200 mt-1">{sshKeyFile.name}</div>}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                        disabled={loading}
                    >
                        {loading ? "Đang tạo..." : "Tạo Container"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddContainerModal;
