import React, {useEffect, useState} from "react";
import {useUserStore} from "../../Store/Slices/UserSlice/UserSlice.ts";
import {HiUser, HiUserAdd} from "react-icons/hi";
import type {UserFormState} from "../../Interface/Model.tsx";
import {getAuthTokens} from "../../Store/Slices/AuthSlice/AuthSlice.tsx";




const UserComponent: React.FC = () => {
    const { users, fetchUsers, createUser, updateUser,deleteUser,  loading, error } = useUserStore();
    const [form, setForm] = useState<UserFormState>({
        username: "",
        password: "",
        isRoot: false,
        canUseDocker: false,
        CanUseOSManager: false,
        allowedDirectories: [],
        sshPrivateKeyFile: null,
        sshPrivateKeyPassphrase: "",
        email: "",
    });
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [deletingUser, setDeletingUser] = useState<string | null>(null);

    const tokens = getAuthTokens();

    const resolveSshUsername = () => {
        if (!tokens) throw new Error("Bạn chưa đăng nhập");

        const { role, username } = tokens;

        if (username === "root") return "root";
        if (role === "root") return username;

        throw new Error("Bạn không có quyền thực hiện hành động này");
    };
    
    
    useEffect(() => {
        fetchUsers();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setForm((prev) => ({ ...prev, sshPrivateKeyFile: e.target.files![0] }));
        }
    };

    const resetForm = () => {
        setForm({
            username: "",
            password: "",
            isRoot: false,
            canUseDocker: false,
            CanUseOSManager: false,
            allowedDirectories: [],
            sshPrivateKeyFile: null,
            sshPrivateKeyPassphrase: "",
            email: "",
        });
        setEditingUser(null);
        setDeletingUser(null);
        fetchUsers();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            resolveSshUsername();
        } catch (err: any) {
            alert(err.message);
            return;
        }
        if (deletingUser) {
            const role = resolveSshUsername();
            await deleteUser(    form.username,
                form.sshPrivateKeyFile!,          
                form.sshPrivateKeyPassphrase,    
                true,                            
                true,
                role )
            resetForm();
            return;
        }
        if (editingUser) {
            await updateUser(form);
            resetForm();
            return;
        }
        if (!form.password) {
            alert("Password required for new user");
            return;
        }

        await createUser(form);
        setEditingUser(null);
        setDeletingUser(null);
        fetchUsers();
    };

    const handleEdit = (user: any) => {
        try {
            resolveSshUsername();
        } catch (err: any) {
            alert(err.message);
            return;
        }
        setEditingUser(user.Username);
        setDeletingUser(null);
        setForm({
            username: user.Username,
            password: "",
            isRoot: user.Role === "root",
            canUseDocker: user.CanUseDocker,
            CanUseOSManager: user.CanUseOSManager,
            allowedDirectories: [],
            sshPrivateKeyFile: null,
            sshPrivateKeyPassphrase: "",
            email: user.Email || "",
        });
    };

    const handleDelete = (user: any) => {
        try {
            resolveSshUsername(); 
        } catch (err: any) {
            alert(err.message);
            return;
        }
        
        setDeletingUser(user.Username);
        setEditingUser(null);
        setForm({
            username: user.Username,
            password: "",
            isRoot: user.Role === "root",
            canUseDocker: user.CanUseDocker,
            CanUseOSManager: user.CanUseOSManagement,
            allowedDirectories: [],
            sshPrivateKeyFile: null,
            sshPrivateKeyPassphrase: "",
            email: user.Email || "",
        });
    };


    return (
        <div className="p-6 w-full bg-gray-900 min-h-screen text-gray-100 flex flex-col">
            {/* Header */}
            <div className="flex items-center mb-6">
                <HiUserAdd className="text-blue-400 h-8 w-8 mr-3" />
                <h1 className="text-2xl font-semibold">
                    {editingUser ? "Edit User" : deletingUser ? "Delete User" : "Create User"}
                </h1>
            </div>

            {/* FORM */}
            <form
                onSubmit={handleSubmit}
                className="mb-6 p-4 bg-gray-800 rounded-2xl shadow-lg flex flex-col space-y-3 border border-gray-700"
            >
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleInputChange}
                    className="p-2 rounded-md border border-gray-600 bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                />

                {!editingUser && !deletingUser && (
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleInputChange}
                        className="p-2 rounded-md border border-gray-600 bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                )}

                <input
                    type="file"
                    name="sshPrivateKeyFile"
                    onChange={handleFileChange}
                    className="p-2 rounded-md border border-gray-600 bg-gray-700"
                />

                <input
                    type="text"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleInputChange}
                    className="p-2 rounded-md border border-gray-600 bg-gray-700"
                />

                {/* Checkbox */}
                {!deletingUser && (
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="isRoot"
                                checked={form.isRoot || false}
                                onChange={handleInputChange}
                                className="accent-blue-400"
                            />
                            <span>Root</span>
                        </label>

                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="canUseDocker"
                                checked={form.canUseDocker || false}
                                onChange={handleInputChange}
                                className="accent-blue-400"
                            />
                            <span>Can Use Docker</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="CanUseOSManager"
                                checked={form.CanUseOSManager || false}
                                onChange={handleInputChange}
                                className="accent-blue-400"
                            />
                            <span>Can Use OSManager</span>
                        </label>
                    </div>
                )}

                <button
                    type="submit"
                    className={`${
                        deletingUser ? "bg-red-600 hover:bg-red-700" : "bg-blue-500 hover:bg-blue-600"
                    } text-white py-2 px-4 rounded-md transition-colors`}
                >
                    {editingUser ? "Update User" : deletingUser ? "Confirm Delete" : "Create User"}
                </button>
            </form>
            {loading && <p className="text-gray-400 animate-pulse">Loading users...</p>}
            {error && <p className="text-red-400 bg-red-900/30 p-3 rounded-lg mb-4">{error}</p>}
            <h2 className="text-xl font-semibold mb-2 flex items-center">
                <HiUser className="text-blue-400 h-6 w-6 mr-2" />
                Users
            </h2>

            <div className="flex-1 overflow-auto bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
                <table className="min-w-full divide-y divide-gray-700 table-auto">
                    <thead className="bg-gray-700 sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Username</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Role</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">CanUseDocker</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">CanUseOSManagement</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Email</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Action</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-700">
                    {users.map((user) => (
                        <tr key={user.Username} className="hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-2 text-sm text-gray-200">{user.Username}</td>
                            <td className="px-4 py-2 text-sm text-gray-200">{user.Role}</td>
                            <td className="px-4 py-2 text-sm text-gray-200">{String(user.CanUseDocker)}</td>
                            <td className="px-4 py-2 text-sm text-gray-200">{String(user.CanUseOSManagement)}</td>
                            <td className="px-4 py-2 text-sm text-gray-200">{user.Email}</td>

                            <td className="px-4 py-2 text-sm text-gray-200 space-x-2">
                                <button
                                    className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md"
                                    onClick={() => handleEdit(user)}
                                >
                                    Edit
                                </button>

                                <button
                                    className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md"
                                    onClick={() => handleDelete(user)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>

                </table>
            </div>
        </div>
    );
};

export default UserComponent;