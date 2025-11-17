import React from 'react';

interface DeleteControlProps {
    isDeleteMode: boolean;
    selectedItemsCount: number;
    totalItemsCount: number;
    isDeleting: boolean;
    onSelectAll: () => void;
    onCancel: () => void;
    onDeleteSelected: () => void;
}

const DeleteControlComponent: React.FC<DeleteControlProps> = ({
    isDeleteMode,
    selectedItemsCount,
    totalItemsCount,
    isDeleting,
    onSelectAll,
    onCancel,
    onDeleteSelected
}) => {
    if (!isDeleteMode) return null;

    return (
        <div className="mb-4 p-3 mt-10 bg-red-900/20 border border-red-500 rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <span className="text-gray-100 font-medium">
                        Đã chọn: {selectedItemsCount} item(s)
                    </span>
                    <button
                        onClick={onSelectAll}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        {selectedItemsCount === totalItemsCount ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onDeleteSelected}
                        disabled={selectedItemsCount === 0 || isDeleting}
                        className={`px-3 py-1 rounded ${
                            selectedItemsCount === 0 || isDeleting
                                ? 'bg-gray-500 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700'
                        } text-white`}
                    >
                        {isDeleting ? 'Đang xóa...' : `Xóa ${selectedItemsCount} item(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteControlComponent;

