// import {useAuthStore} from "../../Store/Slices/AuthSlice/AuthSlice.tsx";
// import {useLocation, useNavigate} from "react-router-dom";
// import {useState} from "react";
//
// const authComponent: React.FC = () =>{
//     const navigate = useNavigate();
//     const location = useLocation();
//     // const tokens = useAuthStore((state) => state.tokens)
//     const loading = useAuthStore((state) => state.loading);
//     const login = useAuthStore((state) => state.login)
//     const [username, setUsername] = useState(location.state?.username || '');
//     const [password, setPassword] = useState(location.state?.password || '');
//     const HandleLogin = async (e: React.FormEvent) =>{
//         e.preventDefault();
//         const success = await login(username, password);
//         if (success) {
//             navigate("/home");
//         }
//     }
//     return(
//         <div className="w-full h-screen flex justify-center items-center">
//             <div className="flex flex-row w-6/12 h-[60%] shadow-indigo-900 shadow-2xl rounded rounded-bl-2xl rounded-tl-2xl rounded-br-2xl rounded-tr-2xl">
//                 <div className="w-1/2 h-full flex flex-col justify-center items-center bg-white p-4 rounded rounded-bl-2xl rounded-tl-2xl">
//                     <div className='m-3 font-bold font-mono text-3xl'>Sign In</div>
//                     <form className='w-full flex flex-col items-center ' onSubmit={HandleLogin}>
//                         <input className='m-3 border-2 rounded-2xl border-gray-400 w-11/12 h-9'
//                                type='text'
//                                value={username}
//                                onChange={(e) => setUsername(e.target.value)}
//                                required
//                                placeholder='   Nhập vào tên tài khoản'/>
//                         <input className='m-3 border-2 rounded-2xl border-gray-400 w-11/12 h-9'
//                                type='password'
//                                value={password}
//                                onChange={(e) => setPassword(e.target.value)}
//                                required
//                                placeholder='   Nhập vào mật khẩu tài khoản'/>
//                         <button
//                             className='m-3 font-bold font-mono bg-indigo-500 w-20 h-9 rounded-md transition duration-300 ease-in-out hover:bg-indigo-300 hover:text-white hover:rounded-2xl hover:shadow-lg hover:shadow-indigo-500/50'>
//                             {loading ? 'Đang đăng nhập...' : 'SIGN IN'}
//                         </button>
//                     </form>
//                 </div>
//                 <div
//                     className="w-1/2 h-full flex justify-center items-center bg-indigo-900 rounded-bl-[140px] rounded-tl-[140px] text-white p-4 rounded-br-2xl rounded-tr-2xl ">
//                     Login With SSH
//                 </div>
//             </div>
//         </div>
//     )
// }
//
// export default authComponent

import { useState } from "react";
import {useAuthStore} from "../../Store/Slices/AuthSlice/AuthSlice.tsx";
import {useLocation, useNavigate} from "react-router-dom";


const AuthComponent: React.FC = () => {
    const [isSSH, setIsSSH] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    // const tokens = useAuthStore((state) => state.tokens)
    const loading = useAuthStore((state) => state.loading);
    const login = useAuthStore((state) => state.login)
    const [username, setUsername] = useState(location.state?.username || '');
    const [password, setPassword] = useState(location.state?.password || '');
    const HandleLogin = async (e: React.FormEvent) =>{
        e.preventDefault();
        const success = await login(username, password);
        if (success) {
            navigate("/home");
        }
    }
    return (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-r from-gray-200 to-indigo-200 font-sans">
            <div className="relative w-1/2 h-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden">

                {/* Forms container */}
                <div className="absolute w-full h-full flex transition-all duration-700 ease-in-out">

                    {/* Password Form */}
                    <div className={`absolute top-0 left-0 w-1/2 h-full p-6 flex flex-col justify-center transition-all duration-700 ease-in-out
                        ${isSSH ? "-translate-x-full opacity-0 z-0" : "translate-x-0 opacity-100 z-10"}`}>
                        <div className='flex items-center justify-center'>
                            <h2 className="text-2xl font-bold mb-6">Login with Password</h2>
                        </div>

                        <form className='w-full flex flex-col items-center ' onSubmit={HandleLogin}>
                                                 <input className='m-3 border-2 rounded-2xl border-gray-400 w-11/12 h-9'
                                                       type='text'
                                                        value={username}
                                                        onChange={(e) => setUsername(e.target.value)}
                                                        required
                                                        placeholder='   Nhập vào tên tài khoản'/>
                                                 <input className='m-3 border-2 rounded-2xl border-gray-400 w-11/12 h-9'
                                                       type='password'
                                                       value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        placeholder='   Nhập vào mật khẩu tài khoản'/>
                                                 <button
                                                     className='m-3 font-bold font-mono bg-indigo-500 w-20 h-9 rounded-md transition duration-300 ease-in-out hover:bg-indigo-300 hover:text-white hover:rounded-2xl hover:shadow-lg hover:shadow-indigo-500/50'>
                                                     {loading ? 'Đang đăng nhập...' : 'LOGIN'}
                                                 </button>
                                             </form>
                    </div>

                    {/* SSH Form */}
                    <div className={`absolute top-0 right-0 w-1/2 h-full p-6 flex flex-col justify-center transition-all duration-700 ease-in-out
                        ${isSSH ? "translate-x-0 opacity-100 z-10" : "translate-x-full opacity-0 z-0"}`}>
                        <div className='flex items-center justify-center'>
                            <h2 className="text-2xl font-bold mb-6 text-black">Login with SSH</h2>
                        </div>

                        <div className="flex justify-center items-center flex-col">
                            <input type="file" className="p-2 rounded-xl text-black" />
                            <button
                                className='m-3 font-bold font-mono bg-indigo-500 w-20 h-9 rounded-md transition duration-300 ease-in-out hover:bg-indigo-300 hover:text-white hover:rounded-2xl hover:shadow-lg hover:shadow-indigo-500/50'>
                                {loading ? 'Đang đăng nhập...' : 'LOGIN'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toggle Panel */}
                <div
                    className={`absolute top-0 left-1/2 w-1/2 h-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white flex flex-col items-center justify-center cursor-pointer transition-all duration-700 ease-in-out
                        ${isSSH ? "-translate-x-full rounded-l-[3px] rounded-r-[150px]" : "translate-x-0 rounded-l-[150px] rounded-r-[2px]"}`}
                    onClick={() => setIsSSH(!isSSH)}
                >
                    <span className="font-bold text-lg">{isSSH ? "Login with Password" : "Login with SSH"}</span>
                </div>
            </div>
        </div>
    );
};

export default AuthComponent;
