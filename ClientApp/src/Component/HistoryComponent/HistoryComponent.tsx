import { useHistoryStore } from "../../Store/Slices/HistorySlice/HistorySlice.ts";
import { useEffect } from "react";
import type { HistoryEntry } from "../../Interface/Model.tsx";
import { HiOutlineClock } from "react-icons/hi";

const HistoryComponent: React.FC = () => {
    const { historyList, loading, error, fetchHistory } = useHistoryStore();

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);
    
    return (
        <div className="p-6 w-full bg-gray-900 min-h-screen text-gray-100 flex flex-col">
            {/* Header */}
            <div className="flex items-center mb-6">
                <HiOutlineClock className="text-blue-400 h-8 w-8 mr-3" />
                <h1 className="text-2xl font-semibold">System History</h1>
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-gray-400 animate-pulse">Đang tải lịch sử hệ thống...</div>
            )}

            {/* Error */}
            {error && (
                <div className="text-red-400 bg-red-900/30 p-3 rounded-lg mb-4">
                    Lỗi: {error}
                </div>
            )}

            {/* Empty */}
            {!loading && !error && (!historyList || historyList.length === 0) && (
                <div className="text-gray-400 italic mt-4">Không có lịch sử nào được tìm thấy.</div>
            )}

            {/* Table */}
            {!loading && historyList && historyList.length > 0 && (
                <div className="flex-1 overflow-auto bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
                    <table className="min-w-full divide-y divide-gray-700 table-auto">
                        <thead className="bg-gray-700 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Timestamp</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Action</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Target</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Details</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                        {historyList.map((entry: HistoryEntry) => (
                            <tr
                                key={entry.id}
                                className="hover:bg-gray-700/50 transition-colors"
                            >
                                <td className="px-4 py-2 text-sm text-gray-200 whitespace-nowrap overflow-hidden overflow-ellipsis max-w-[150px]">
                                    {entry.timestamp}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-200 whitespace-nowrap overflow-hidden overflow-ellipsis max-w-[100px]">
                                    {entry.action}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-200 overflow-hidden overflow-ellipsis max-w-[250px] break-words">
                                    {entry.target}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-200 overflow-hidden overflow-ellipsis max-w-[250px] break-words">
                                    {entry.details}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HistoryComponent;
