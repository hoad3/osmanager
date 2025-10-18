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


