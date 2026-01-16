import {useState} from "react";
import DirectoryComponent from "../HomePageComponent/DirectoryComponent.tsx";

interface AddImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (folderPath: string, file: File | null) => void;
}


const AddImageModal: React.FC<AddImageModalProps> = ({ isOpen, onClose, onSubmit }) => {
    // const [selectedFolder] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFolder, setSelectedFolder] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-gray-900 p-6 rounded-2xl w-3/4 max-w-3xl">
                <h2 className="text-xl font-bold text-white mb-4">Add Docker Image</h2>

                {/* Folder selection */}
                <div className="mb-4 border border-gray-700 rounded-lg p-2 bg-gray-800">
                    <span className="text-gray-300 mb-1 block">Chọn thư mục:</span>
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

                {/* File selection */}
                <div className="mb-4">
                    <label className="block text-gray-300 mb-1">Chọn file từ máy:</label>
                    <input
                        type="file"
                        className="bg-gray-800 text-white border border-gray-700 p-2 rounded"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    />
                    {selectedFile && (
                        <div className="text-gray-200 mt-1">{selectedFile.name}</div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                    <button
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
                        onClick={onClose}
                    >
                        Hủy
                    </button>
                    <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        onClick={() => onSubmit(selectedFolder, selectedFile)}
                    >
                        Thêm Image
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddImageModal;