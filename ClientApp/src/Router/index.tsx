import { createBrowserRouter } from 'react-router-dom'
import Layout from '../Pages/Sidebar/Layout'
import HomePageComponent from '../Pages/Homepage/HomePageComponent'
import LoginPage from '../Pages/LoginPage/LoginPage'
import PrivateRoute from './PrivateRoute.tsx'
import DirectoryPage from '../Pages/DirectoryPage/DirectoryPage'
import DockerContainerPage from "../Pages/DockerPage/DockerContainerPage.tsx";
import DockerImagesComponent from "../Component/DockerComponent/DockerImagesComponent.tsx";
import Histories from "../Pages/HistoryPage/HistoryPage.tsx";
import Userpage from "../Pages/Userpage/Userpage.tsx";

const router = createBrowserRouter([
	{ path: '/', element: <LoginPage /> },
	{
		path: '/',
		element: <Layout />,
		children: [
			{ path: 'home', element: <PrivateRoute><HomePageComponent /></PrivateRoute> },
			{ path: 'directory', element: <PrivateRoute><DirectoryPage /></PrivateRoute> },
			{path:'container', element:<PrivateRoute><DockerContainerPage/></PrivateRoute>},
			{path:'images', element:<PrivateRoute><DockerImagesComponent/></PrivateRoute>},
			{path:'history', element:<PrivateRoute><Histories/></PrivateRoute>},
			{path:'user', element:<PrivateRoute><Userpage/></PrivateRoute>},
		],
	},
])

export default router

