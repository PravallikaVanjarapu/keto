import React, { useEffect, useRef, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import "./chart.scss";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="label">{new Date(label).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                })}</p>
                {payload.map((entry, index) => (
                    <p key={`item-${index}`} style={{ color: entry.color }}>
                        {`${entry.name}: ${entry.value}`}
                    </p>
                ))}
            </div>
        );
    }

    return null;
};

const Chart = ({ data }) => {
    const [chartWidth, setChartWidth] = useState(window.innerWidth + 80);
    const chartContainerRef = useRef(null);
    const [selectedHeading1, setSelectedHeading1] = useState('Max Cell Voltage');
    const [selectedHeading2, setSelectedHeading2] = useState('SOC');
    const [Battery, setBattery] = useState([]);

    useEffect(() => {
        const handleResize = () => {
            if (chartContainerRef.current) {
                setChartWidth(chartContainerRef.current.offsetWidth);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const sortedData = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestEntry = sortedData[0];
        const latestPackSerialNumber = latestEntry.packSerialNumber;
        const filteredData = sortedData.filter(item => item.packSerialNumber === latestPackSerialNumber).reverse();
        setBattery(filteredData);
    }, [data]);

    const handleSelectChange1 = (event) => {
        setSelectedHeading1(event.target.value);
    };

    const handleSelectChange2 = (event) => {
        setSelectedHeading2(event.target.value);
    };

    const mapHeadingToDataKey = (heading) => {
        switch (heading) {
            case 'SOC':
                return 'SOC';
            case 'Battery Pack Current':
                return 'BatteryPackcurrent';
            case 'Max Cell Voltage':
                return 'maxCellVoltage';
            case 'Min Cell Voltage':
                return 'minCellVoltage';
            case 'Min Temperature':
                return 'minCellTemp';
            case 'Max Temperature':
                return 'maxCellTemp';
            default:
                return '';
        }
    };

    return (
        <div className='chart'>
            <div className="header">
                <select className='selectval' onChange={handleSelectChange1} value={selectedHeading1}>
                    <option value="Max Cell Voltage">Max Cell Voltage</option>
                    <option value="Max Temperature">Max Cell Temperature</option>
                    <option value="Battery Pack Current">Battery Pack Current</option>
                </select>

                <select className='selectval' onChange={handleSelectChange2} value={selectedHeading2}>
                    <option value="SOC">SOC</option>
                    <option value="Min Cell Voltage">Min Cell Voltage</option>
                    <option value="Min Temperature">Min Cell Temperature</option>
                </select>
            </div>

            <div ref={chartContainerRef}>
                <LineChart width={chartWidth} height={300} data={Battery} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorFirst" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7379E1" />
                            <stop offset="95%" stopColor="#8884d8" />
                        </linearGradient>
                        <linearGradient id="colorSecond" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#CCB003" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#CCB003" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <XAxis dataKey="createdAt" tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Line yAxisId="right" type="monotone" dataKey={mapHeadingToDataKey(selectedHeading1)} stroke="#A2A4EF" fillOpacity={1} fill="url(#colorFirst)" />
                    <Line yAxisId="left" type="monotone" dataKey={mapHeadingToDataKey(selectedHeading2)} stroke="#CCB003" fillOpacity={1} fill="url(#colorSecond)" />
                </LineChart>
            </div>
        </div>
    );
};

export default Chart;
