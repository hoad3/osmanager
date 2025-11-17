import type {ImagesItem} from "../../Interface/Model.tsx";
import {useEffect, useState} from "react";
import {dockerHubsImages} from "../../Hubs/DockerHubs/DockerHubs.ts";
import {HiMiniCubeTransparent} from "react-icons/hi2";

const DockerImagesComponent: React.FC = () =>{
    const [images, setImages] =useState<ImagesItem[]>([])
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const fetchImages = async () => {
        setLoading(true);
        setError(null);
        try {
            await dockerHubsImages(
                (data) => {
                    setImages(Array.isArray(data) ? data as ImagesItem[] : []);
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
        fetchImages();
    }, []);

    const parseRepoTag = (repoTags: string) => {
        if (!repoTags) return { name: "unknown", tag: "latest" };
        const parts = repoTags.split(":");
        return {
            name: parts[0] || "unknown",
            tag: parts[1] || "latest",
        };
    };
    return ( <div className="p-6 text-white bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="flex items-center mb-6">
                <HiMiniCubeTransparent className="text-blue-400 h-8 w-8 mr-3" />
                <h1 className="text-2xl font-semibold">Docker Images</h1>
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-gray-400 animate-pulse">Đang tải danh sách images...</div>
            )}

            {/* Error */}
            {error && (
                <div className="text-red-400 bg-red-900/30 p-3 rounded-lg">
                    Lỗi: {error}
                </div>
            )}

            {/* Empty */}
            {!loading && !error && images.length === 0 && (
                <div className="text-gray-400 italic mt-4">
                    Không có image nào được tìm thấy.
                </div>
            )}

            {/* Table */}
            {!loading && images.length > 0 && (
                <div className="overflow-x-auto bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Tên</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Tag</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Kích thước</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Containers</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Được tạo</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                        {images.map((img) => {
                            const { name, tag } = parseRepoTag(img.repoTags);
                            return (
                                <tr
                                    key={img.id}
                                    className="hover:bg-gray-700/50 transition-colors"
                                >
                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                                        {name}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                                        {tag}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                                        {img.size}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                                        {img.containers}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                                        {img.created}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DockerImagesComponent;