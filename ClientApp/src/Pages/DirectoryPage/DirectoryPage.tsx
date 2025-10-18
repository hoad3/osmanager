import DirectoryComponent from "../../Component/HomePageComponent/DirectoryComponent.tsx";


const DirectoryPage: React.FC = () =>{
    return(
        <div className="min-h-screen bg-slate-800 flex items-start justify-start">
            <div>
                <DirectoryComponent/>
            </div>
        </div>
    );
}

export default DirectoryPage;