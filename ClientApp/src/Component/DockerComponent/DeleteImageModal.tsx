import {useState} from "react";


interface DeleteImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (sshKey: File) => void;
}
const DeleteImageModal: React.FC<DeleteImageModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [sshKey, setSshKey] = useState<File | null>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-96 text-white">
                <h2 className="text-xl font-semibold mb-4">Xóa Docker Image</h2>

                <label className="block mb-3">
                    <span className="text-gray-300">SSH Key:</span>
                    <input
                        type="file"
                        onChange={(e) => setSshKey(e.target.files?.[0] || null)}
                        className="mt-1 w-full bg-gray-700 text-gray-200 p-2 rounded border border-gray-600"
                    />
                </label>

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                    >
                        Hủy
                    </button>

                    <button
                        onClick={() => sshKey && onSubmit(sshKey)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                    >
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteImageModal;