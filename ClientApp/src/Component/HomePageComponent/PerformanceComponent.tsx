import {createPerformanceConnection} from "../../Hubs/connection.ts";
import {useEffect, useState} from "react";
import type {PerformanceData} from "../../Interface/Model.tsx";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
const MAX_DATA_POINTS = 20;

const PerformanceMonitor: React.FC = () => {
    const [data, setData] = useState<Array<{
        cpu: number;
        ram: number;
        disk: number;
    }>>(Array(MAX_DATA_POINTS).fill({ cpu: 0, ram: 0, disk: 0 }));

    const [diskInfo, setDiskInfo] = useState<{ used: string; total: string }>({ used: '0', total: '0' });
    const [ramInfo, setRamInfo] = useState<{ used: string; total: string }>({used: '0', total: '0' });

    useEffect(() => {
        const connection = createPerformanceConnection();
        let isConnected = false;

        const startConnection = async () => {
            try {
                await connection.start();
                isConnected = true;
                console.log("✅ Connected to PerformanceHub");
                connection.on("ReceivePerformance", (performanceData: PerformanceData) => {
                    setData(prevData => {
                        const cpuPercentage = parseFloat(performanceData.cpu) || 0;
                        const ramMatch = performanceData.ram.match(/(\d+)\/(\d+)MB \((\d+\.?\d*)%\)/);
                        const ramPercentage = ramMatch ? parseFloat(ramMatch[3]) : 0;
                        if (ramMatch) {
                            setRamInfo({
                                used: (parseFloat(ramMatch[1])).toFixed(1), 
                                total: (parseFloat(ramMatch[2])).toFixed(1) 
                            });
                        }
                        const diskMatch = performanceData.disk.match(/(\d+)\/(\d+)GB/);
                        const diskPercentage = diskMatch 
                            ? (parseFloat(diskMatch[1]) / parseFloat(diskMatch[2])) * 100 
                            : 0;
                        if (diskMatch) {
                            setDiskInfo({
                                used: diskMatch[1],
                                total: diskMatch[2]
                            });
                        }
                        
                        const newData = [...prevData.slice(1), {
                            cpu: cpuPercentage,
                            ram: ramPercentage,
                            disk: diskPercentage
                        }];
                        return newData;
                    });
                });
            } catch (err) {
                console.error("❌ Connection failed:", err);
            }
        };

        startConnection();

        return () => {
            if (isConnected) {
                connection.stop();
            }
        };
    }, []);

    return (
        <div className="flex flex-col gap-4 p-6 bg-gray-100 rounded-lg shadow-lg w-full max-w-6xl">
            <h2 className="text-2xl font-bold text-gray-800">System Performance</h2>

            {/* CPU Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">CPU Usage (%)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis />
                            <YAxis 
                                dataKey="cpu"
                                type="number" 
                                domain={[0, 100]} 
                            />
                            <Tooltip formatter={(value) => `${value}%`} />
                            <Line
                                type="monotone"
                                dataKey="cpu"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* RAM Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">Memory Usage (%)</h3>
                <h3 className="text-lg text-gray-600 mb-4">{ramInfo.used}/{ramInfo.total}MB used</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{top: 5, right: 30, left: 20, bottom: 5}}
                        >
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis/>
                            <YAxis
                                dataKey="ram"
                                type="number"
                                domain={[0, 100]}
                            />
                            <Tooltip formatter={(value) => `${value}%`}/>
                            <Line
                                type="monotone"
                                dataKey="ram"
                                stroke="#10B981"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Disk Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">Disk Usage (%)</h3>
                <h3 className="text-lg text-gray-600 mb-4">{diskInfo.used}/{diskInfo.total}GB used</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{top: 5, right: 30, left: 20, bottom: 5}}
                        >
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis/>
                            <YAxis
                                dataKey="disk"
                                type="number"
                                domain={[0, 100]}
                            />
                            <Tooltip formatter={(value) => `${value}%`}/>
                            <Line
                                type="monotone"
                                dataKey="disk"
                                stroke="#8B5CF6"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default PerformanceMonitor;