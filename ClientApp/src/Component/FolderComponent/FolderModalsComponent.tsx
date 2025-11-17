import React from 'react';

interface CreateFolderModalProps {
    show: boolean;
    newFolderName: string;
    setNewFolderName: (name: string) => void;
    createError: string | null;
    isCreating: boolean;
    onClose: () => void;
    onCreate: () => void;
}
interface RenameModalProps {
    show: boolean;
    renameItem: {path: string, name: string} | null;
    newName: string;
    setNewName: (name: string) => void;
    renameError: string | null;
    isRenaming: boolean;
    onClose: () => void;
    onRename: () => void;
}
const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
    show,
    newFolderName,
    setNewFolderName,
    createError,
    isCreating,
    onClose,
    onCreate
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}/>
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
                        <button className="px-3 py-1 rounded bg-gray-600 text-gray-100" onClick={onClose}>
                            Hủy
                        </button>
                        <button
                            className="px-3 py-1 rounded bg-indigo-600 text-white"
                            onClick={onCreate}
                            disabled={isCreating}
                        >
                            {isCreating ? 'Đang tạo...' : 'Tạo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RenameModal: React.FC<RenameModalProps> = ({
    show,
    renameItem,
    newName,
    setNewName,
    renameError,
    isRenaming,
    onClose,
    onRename
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}/>
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
                        onClick={onClose}
                    >
                        Hủy
                    </button>
                    <button
                        className={`px-3 py-1 rounded text-white ${
                            isRenaming || !newName.trim()
                                ? 'bg-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        onClick={onRename}
                        disabled={isRenaming || !newName.trim()}
                    >
                        {isRenaming ? 'Đang đổi tên...' : 'Đổi tên'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface FolderModalsProps {
    // Create folder modal
    showCreateFolderModal: boolean;
    newFolderName: string;
    setNewFolderName: (name: string) => void;
    createError: string | null;
    isCreating: boolean;
    onCreateFolder: () => void;
    onCloseCreateModal: () => void;

    // Rename modal
    showRenameModal: boolean;
    renameItem: {path: string, name: string} | null;
    newName: string;
    setNewName: (name: string) => void;
    renameError: string | null;
    isRenaming: boolean;
    onRename: () => void;
    onCloseRenameModal: () => void;

    // Copy select modal
    showCopyModal?: boolean;
    copyCandidates?: { path: string; name: string; isDirectory: boolean }[];
    onConfirmCopySelection?: (paths: string[]) => void;
    onCancelCopySelection?: () => void;
}

const FolderModalsComponent: React.FC<FolderModalsProps> = ({
    showCreateFolderModal,
    newFolderName,
    setNewFolderName,
    createError,
    isCreating,
    onCreateFolder,
    onCloseCreateModal,
    showRenameModal,
    renameItem,
    newName,
    setNewName,
    renameError,
    isRenaming,
    onRename,
    onCloseRenameModal,
    showCopyModal,
    copyCandidates,
    onConfirmCopySelection,
    onCancelCopySelection
}) => {
    const CopySelectModal: React.FC<{
        show: boolean;
        candidates: { path: string; name: string; isDirectory: boolean }[];
        onConfirm: (paths: string[]) => void;
        onCancel: () => void;
    }> = ({ show, candidates, onConfirm, onCancel }) => {
        const [selected, setSelected] = React.useState<Set<string>>(new Set());

        React.useEffect(() => {
            if (show) setSelected(new Set());
        }, [show]);

        if (!show) return null;

        const onlyFolders = candidates.filter(c => c.isDirectory);
        const allSelected = selected.size === onlyFolders.length && onlyFolders.length > 0;

        const toggle = (p: string) => {
            setSelected(prev => {
                const next = new Set(prev);
                if (next.has(p)) next.delete(p); else next.add(p);
                return next;
            });
        };
        const toggleAll = () => {
            if (allSelected) {
                setSelected(new Set());
            } else {
                setSelected(new Set(onlyFolders.map(f => f.path)));
            }
        };

        return (
            <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 bg-black opacity-50" onClick={onCancel}/>
                <div className="relative bg-slate-800 p-6 rounded-lg w-[560px] max-h-[70vh] overflow-auto">
                    <h3 className="text-lg font-bold text-gray-100 mb-4">Chọn thư mục để copy</h3>
                    <div className="flex items-center mb-3">
                        <input type="checkbox" className="mr-2" checked={allSelected} onChange={toggleAll} />
                        <span className="text-gray-200 text-sm">Chọn tất cả thư mục</span>
                    </div>
                    <ul className="space-y-1">
                        {onlyFolders.length === 0 && (
                            <li className="text-gray-400 text-sm">Không có thư mục nào trong vị trí hiện tại</li>
                        )}
                        {onlyFolders.map((c) => (
                            <li key={c.path} className="flex items-center text-gray-100">
                                <input
                                    type="checkbox"
                                    className="mr-3"
                                    checked={selected.has(c.path)}
                                    onChange={() => toggle(c.path)}
                                />
                                <span className="truncate">📁 {c.name}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-5 flex justify-end gap-2">
                        <button className="px-3 py-1 rounded bg-gray-600 text-gray-100" onClick={onCancel}>Hủy</button>
                        <button
                            className={`px-3 py-1 rounded text-white ${selected.size === 0 ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                            onClick={() => onConfirm(Array.from(selected))}
                            disabled={selected.size === 0}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <CreateFolderModal
                show={showCreateFolderModal}
                newFolderName={newFolderName}
                setNewFolderName={setNewFolderName}
                createError={createError}
                isCreating={isCreating}
                onClose={onCloseCreateModal}
                onCreate={onCreateFolder}
            />
            <RenameModal
                show={showRenameModal}
                renameItem={renameItem}
                newName={newName}
                setNewName={setNewName}
                renameError={renameError}
                isRenaming={isRenaming}
                onClose={onCloseRenameModal}
                onRename={onRename}
            />
            <CopySelectModal
                show={!!showCopyModal}
                candidates={copyCandidates ?? []}
                onConfirm={(paths) => onConfirmCopySelection && onConfirmCopySelection(paths)}
                onCancel={() => onCancelCopySelection && onCancelCopySelection()}
            />
        </>
    );
};

export default FolderModalsComponent;
