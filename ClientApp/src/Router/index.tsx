import { createBrowserRouter } from 'react-router-dom'
import Layout from '../Pages/Sidebar/Layout'
import HomePageComponent from '../Pages/Homepage/HomePageComponent'
import LoginPage from '../Pages/LoginPage/LoginPage'
import PrivateRoute from './PrivateRoute.tsx'
import DirectoryPage from '../Pages/DirectoryPage/DirectoryPage'

const router = createBrowserRouter([
	{ path: '/', element: <LoginPage /> },
	{
		path: '/',
		element: <Layout />,
		children: [
			{ path: 'home', element: <PrivateRoute><HomePageComponent /></PrivateRoute> },
			{ path: 'directory', element: <PrivateRoute><DirectoryPage /></PrivateRoute> },
		],
	},
])

export default router

