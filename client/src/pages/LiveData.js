import axios from "axios";
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import Arrow from "../assets/Battery/arrow.png";
import download from "../assets/Battery/dwnload.png";
import Line from "../assets/Battery/line.png";
import ChartMaster from '../components/ChartMaster';
import './mastery.scss';

const LiveData = () => {
    const navigate = useNavigate();

    const sendBatteryValue = (device) => {
        navigate(`/keto/dashboard/${device}`);
    };

    // Refactor state to include both count and serial number for each device
    const [deviceData, setDeviceData] = useState({
        '5715131': { count: 0, serialNumber: '', make: '' },
        '5640344': { count: 0, serialNumber: '', make: '' },
        '5644154': { count: 0, serialNumber: '', make: '' },
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            const devices = Object.keys(deviceData);

            // Create a promise for each device data fetch
            const fetchPromises = devices.map(async (device) => {
                try {
                    const response = await axios.get(`https://www.ketomotors.in/getcount/${device}`);
                    return {
                        device,
                        data: response.data
                    };
                } catch (err) {
                    console.error("Error fetching data for device:", device, err);
                    return null; // Handle error per device, maybe accumulate errors in an array
                }
            });



            // Await all promises and then update state accordingly
            const results = await Promise.all(fetchPromises);
            const newData = { ...deviceData };
            results.forEach(result => {
                if (result) {
                    const { device, data } = result;
                    newData[device] = {
                        ...newData[device],
                        count: data.count,
                        serialNumber: data.serialNumber,
                        make: data.bmsMake,
                    };
                    // console.log(data.make); 
                }
            });
            setDeviceData(newData);
            setIsLoading(false);
        };

        fetchAllData();

    }, []);

    const handleDownload = async (serialNumber) => {
        try {
            const response = await axios.get(`https://www.ketomotors.in/api/report/${serialNumber}`);
            let jsonData = response.data;

            // Assuming jsonData is an object that includes a notifications array
            // Flatten the structure if necessary and ensure it's an array of objects
            let processedData = []; // Initialize an array to hold processed data

            // Example processing, adjust according to your data structure
            if (jsonData.notifications && jsonData.notifications.length > 0) {
                // Flatten and merge notifications into the main data object, adjust this logic as needed
                processedData = jsonData.notifications.map(notification => ({
                    ...jsonData, // Spread the main data object
                    ...notification // Spread the notification object, overriding common keys if necessary
                }));
            } else {
                processedData = [jsonData]; // Wrap in an array if not processing notifications
            }

            // console.log("Processed Data for Excel:", processedData); // Debugging line

            // Generate Excel file
            const worksheet = XLSX.utils.json_to_sheet(processedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
            XLSX.writeFile(workbook, `report_${serialNumber}.xlsx`);
        } catch (error) {
            console.error("Failed to download report:", error);
        }
    };



    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="cards-container">
            {Object.entries(deviceData).map(([device, data]) => (
                <div key={device} className="card">
                    <div className="flex">
                        <div className="info">
                            <div className="batterymake">Device</div>
                        </div>
                        <div className="chart">
                            {/* <ChartMaster /> */}
                            <div className="download" onClick={() => handleDownload(data.serialNumber)}>
                                <img src={download} alt="Download" width={34} height={34} />
                            </div>
                        </div>
                    </div>

                    <img src={Line} alt="" width="100%" />
                    <div className="box">
                        {/* <div className="undercdc">Under CDC</div> */}
                        <div className="sn">{data.serialNumber}</div>
                        <div className="arrow">
                            <button className='arrow-button' onClick={() => sendBatteryValue(device)}>
                                <img src={Arrow} alt="Arrow" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LiveData;
