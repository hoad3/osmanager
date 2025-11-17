

import React, { useEffect, useState } from 'react';
import { dockerHubsContainer } from '../../Hubs/DockerHubs/DockerHubs';
import type {ContainerItem} from "../../Interface/Model.tsx";
import {LuContainer} from "react-icons/lu";


const DockerContainerComponent: React.FC = () => {
    const [containers, setContainers] = useState<ContainerItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchContainers = async () => {
        setLoading(true);
        setError(null);
        try {
            await dockerHubsContainer(
                (data) => {
                    setContainers(Array.isArray(data) ? data as ContainerItem[] : []);
                    setLoading(false);
                },
                (err) => {
                    const msg = err?.message ?? err?.detail ?? String(err);
                    setError(msg);
                    setLoading(false);
                }
            );
        } catch (ex: any) {
            setError(ex?.message ?? String(ex));
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContainers();
    }, []);

    const getStateColor = (state: string) => {
        switch (state) {
            case "running":
                return "bg-green-500/20 text-green-400 border border-green-400/30";
            case "exited":
                return "bg-red-500/20 text-red-400 border border-red-400/30";
            case "paused":
                return "bg-yellow-500/20 text-yellow-300 border border-yellow-300/30";
            default:
                return "bg-gray-600/30 text-gray-300 border border-gray-500/40";
        }
    };

    return (
        <div className="p-6 text-white bg-gray-900 min-h-screen w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <LuContainer className="text-blue-400 h-8 w-8 mr-3" />
                    <h1 className="text-2xl font-semibold">Docker Containers</h1>
                </div>
                <button
                    onClick={fetchContainers}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {loading ? "Đang tải..." : "Refresh"}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="text-red-400 bg-red-900/30 p-3 rounded-lg mb-4">
                    Lỗi: {error}
                </div>
            )}

            {/* Empty */}
            {!loading && !error && containers.length === 0 && (
                <div className="text-gray-400 italic">Không có container nào được tìm thấy.</div>
            )}

            {/* Table */}
            {!loading && containers.length > 0 && (
                <div className="overflow-x-auto bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Tên</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Image</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Ports</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Ngày tạo</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                        {containers.map((c) => (
                            <tr
                                key={c.id}
                                className="hover:bg-gray-700/50 transition-colors"
                            >
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                                    {c.name}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                                    {c.image}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                    <span
                        className={`px-3 py-1 rounded-md text-sm font-medium ${getStateColor(
                            c.state
                        )}`}
                    >
                      {c.state}
                    </span>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                                    {c.ports && c.ports.length > 0 ? (
                                        <div className="flex flex-col space-y-1">
                                            {c.ports.map((p, idx) => (
                                                <div key={idx} className="text-xs text-gray-300">
                                                    {p.publicPort && p.publicPort > 0 ? (
                                                        <>{p.publicPort} → {p.privatePort}/{p.type}</>
                                                    ) : (
                                                        <>{p.privatePort}/{p.type}</>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-500 italic">No ports</span>
                                    )}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                                    {c.created}
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
export default DockerContainerComponent;