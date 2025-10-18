import {useAuthStore} from "../../Store/Slices/AuthSlice/AuthSlice.tsx";
import {useLocation, useNavigate} from "react-router-dom";
import {useState} from "react";

const authComponent: React.FC = () =>{
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
    return(
        <div className="w-full h-screen flex justify-center items-center">
            <div className="flex flex-row w-6/12 h-[60%] shadow-indigo-900 shadow-2xl rounded rounded-bl-2xl rounded-tl-2xl rounded-br-2xl rounded-tr-2xl">
                <div className="w-1/2 h-full flex flex-col justify-center items-center bg-white p-4 rounded rounded-bl-2xl rounded-tl-2xl">
                    <div className='m-3 font-bold font-mono text-3xl'>Sign In</div>
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
                            {loading ? 'Đang đăng nhập...' : 'SIGN IN'}
                        </button>
                    </form>
                </div>
                <div
                    className="w-1/2 h-full flex justify-center items-center bg-indigo-900 rounded-bl-[140px] rounded-tl-[140px] text-white p-4 rounded-br-2xl rounded-tr-2xl">
                </div>
            </div>
        </div>
    )
}

export default authComponent