export interface AuthToken{
    apiKey: string;
    jwtToken: string;
}

export interface DirectoryItem {
    name: string;
    fullPath: string;
    isDirectory: boolean;
    sizeInBytes: number | null;
}

export interface PerformanceData{
    cpu: string;  // thay vì CPU
    ram: string;  // thay vì RAM 
    disk: string; // thay vì Disk
}

export interface PortInfo {
    privatePort: number;
    publicPort: number;
    type: string;
}

export interface ContainerItem {
    id: string;
    name: string;
    image: string;
    state: string;
    status: string;
    created: string;
    ports: PortInfo[];
}

export interface ImagesItem {
    id: string;
    repoTags: string;
    size: string;
    created: string;
    containers: number
}

export interface FileUploadModel {
    fileName: string;
    fileStream: Blob;
    isFolder?: boolean; 
}
export interface HistoryEntry {
    id: string;
    timestamp: string;
    action: string;
    target: string;
    details: string;
}

export interface UserForm {
    username: string;
    password?: string;
    isRoot?: boolean;
    canUseDocker?: boolean;
    CanUseOSManager?: boolean;
    allowedDirectories?: string[];
    sshPrivateKeyFile?: File | null;
    sshPrivateKeyPassphrase?: string;
    email?: string;
}

export interface UserFormState {
    username: string;
    password?: string;
    isRoot?: boolean;
    canUseDocker?: boolean;
    CanUseOSManager?: boolean;
    allowedDirectories?: string[];
    sshPrivateKeyFile?: File | null;
    sshPrivateKeyPassphrase?: string;
    email?: string;
}


