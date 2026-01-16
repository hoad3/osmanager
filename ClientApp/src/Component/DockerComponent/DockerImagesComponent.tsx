import type {ImagesItem} from "../../Interface/Model.tsx";
import {useEffect, useState} from "react";
import {dockerHubsImages} from "../../Hubs/DockerHubs/DockerHubs.ts";
import {HiMiniCubeTransparent} from "react-icons/hi2";
import AddImageModal from "./AddImageModal.tsx";
import {useDockerStore} from "../../Store/Slices/DockerSlice/DockerSlice.ts";
import DeleteImageModal from "./DeleteImageModal.tsx";
import PullImageModal from "./PullImageModal.tsx";

const DockerImagesComponent: React.FC = () =>{
    const [images, setImages] =useState<ImagesItem[]>([])
    const [, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAddImageOpen, setIsAddImageOpen] = useState(false);
    const { loadImage, loading } = useDockerStore();
    const {removeImage} = useDockerStore();
    const [isPullImageOpen, setIsPullImageOpen] = useState(false);
    const { pullImage } = useDockerStore();
    const [deleteModal, setDeleteModal] = useState<{
        open: boolean;
        imageName: string;
        tag: string;
    } | null>(null);
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
    return (<div className="p-6 text-white bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <HiMiniCubeTransparent className="text-blue-400 h-8 w-8 mr-3"/>
                        <h1 className="text-2xl font-semibold">Docker Images</h1>
                    </div>
                    <div className='flex gap-2'>
                        <button
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            onClick={() => setIsPullImageOpen(true)}
                        >
                            Pull Image
                        </button>
                        <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            onClick={() => setIsAddImageOpen(true)}
                        >
                            Add Image
                        </button>
                    </div>
                </div>

                <PullImageModal
                    isOpen={isPullImageOpen}
                    onClose={() => setIsPullImageOpen(false)}
                    onSubmit={async (repository, sshKeyFile) => {
                        const formData = new FormData();
                        formData.append("Repository", repository);
                        formData.append("SshKeyFile", sshKeyFile);
                        // if (passphrase) formData.append("Passphrase", passphrase);

                        try {
                            await pullImage(formData);
                            fetchImages(); // load lại danh sách images
                        } catch (err) {
                            console.error("Error pulling image:", err);
                        } finally {
                            setIsPullImageOpen(false);
                        }
                    }}
                />

                <AddImageModal
                    isOpen={isAddImageOpen}
                    onClose={() => setIsAddImageOpen(false)}
                    onSubmit={async (folderPath, file) => {
                        if (!file) return;

                        const formData = new FormData();
                        formData.append("DirectoryPath", folderPath);
                        formData.append("SshKeyFile", file);
                        for (const [key, value] of formData.entries()) {
                            console.log(key, value);
                        }

                        try {
                            await loadImage(formData);
                            fetchImages(); 
                        } catch (err) {
                            console.error("Error loading image:", err);
                        } finally {
                            setIsAddImageOpen(false);
                        }
                    }}
                />

                <DeleteImageModal
                    isOpen={deleteModal?.open || false}
                    onClose={() => setDeleteModal(null)}
                    onSubmit={async (sshKeyFile) => {
                        if (!deleteModal) return;

                        const formData = new FormData();
                        formData.append("Repository", deleteModal.imageName);
                        formData.append("Tag", deleteModal.tag);
                        formData.append("SshKeyFile", sshKeyFile);
                        for (const [key, value] of formData.entries()) {
                            console.log(key, value);
                        }
                        const results =  await removeImage(formData);
                        console.log(results);
                        fetchImages();
                        setDeleteModal(null);
                    }}
                />


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
                            <th className="px-6 py-3  text-sm font-semibold text-red-300 text-center">Xóa</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                        {images.map((img) => {
                            const {name, tag} = parseRepoTag(img.repoTags);
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
                                    <td className="px-6 py-3 whitespace-nowrap text-center">
                                        <button
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition"
                                            onClick={() =>
                                                setDeleteModal({
                                                    open: true,
                                                    imageName: name,
                                                    tag: tag
                                                })
                                            }
                                        >
                                            Delete
                                        </button>
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