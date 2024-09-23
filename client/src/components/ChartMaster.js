import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import "./chartMaster.scss";
const ChartMaster = ({ pass, errors }) => {

    const strong = pass
    const data = [
        { name: "Strong", value: strong, color: "#5E5CE6" },
        { name: "Weak", value: errors, color: "#ed1c24" },
    ];
    return (
        <div className="pieChartBox">
            <div className="chart">
                <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                        <Tooltip
                            contentStyle={{ borderRadius: "5px" }}
                        />
                        <Pie
                            data={data}
                            innerRadius={"50%"}
                            outerRadius={"100%"}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((item) => (
                                <Cell key={item.name} fill={item.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default ChartMaster;