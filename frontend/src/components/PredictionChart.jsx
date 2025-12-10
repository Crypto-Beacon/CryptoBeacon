import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

const PredictionChart = ({ data, title = "Price Prediction" }) => {
    // Mock data if none provided, for visualization
    const chartData = data || [
        { date: '2023-01-01', actual: 40000, predicted: 40100 },
        { date: '2023-01-02', actual: 41000, predicted: 40800 },
        { date: '2023-01-03', actual: 40500, predicted: 41200 },
        { date: '2023-01-04', actual: 42000, predicted: 42500 },
        { date: '2023-01-05', actual: 42500, predicted: 43000 },
    ];

    return (
        <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#A3A3A3" />
                        <YAxis stroke="#A3A3A3" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            name="Actual Price"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="#00FF88"
                            strokeWidth={2}
                            name="Predicted Price"
                            strokeDasharray="5 5"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PredictionChart;
