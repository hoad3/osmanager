import React, { useState } from "react";

interface PullImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (repository: string, sshKeyFile: File, passphrase?: string) => Promise<void>;
}

const PullImageModal: React.FC<PullImageModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [repository, setRepository] = useState("");
    const [sshKeyFile, setSshKeyFile] = useState<File | null>(null);
    const [passphrase] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!repository || !sshKeyFile) return;
        setLoading(true);
        try {
            await onSubmit(repository, sshKeyFile, passphrase);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-2xl w-full max-w-md text-white">
                <h2 className="text-lg font-semibold mb-4">Pull Docker Image</h2>
                <div className="mb-3">
                    <label className="block mb-1">Repository</label>
                    <input
                        type="text"
                        value={repository}
                        onChange={(e) => setRepository(e.target.value)}
                        className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                        placeholder="nginx:latest"
                    />
                </div>
                <div className="mb-3">
                    <label className="block mb-1">SSH Key</label>
                    <input
                        type="file"
                        onChange={(e) => e.target.files && setSshKeyFile(e.target.files[0])}
                        className="w-full text-white"
                    />
                </div>
                {/*<div className="mb-4">*/}
                {/*    <label className="block mb-1">Passphrase (optional)</label>*/}
                {/*    <input*/}
                {/*        type="text"*/}
                {/*        value={passphrase}*/}
                {/*        onChange={(e) => setPassphrase(e.target.value)}*/}
                {/*        className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"*/}
                {/*        placeholder="Passphrase"*/}
                {/*    />*/}
                {/*</div>*/}
                <div className="flex justify-end gap-3">
                    <button
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Pulling..." : "Pull"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PullImageModal;
