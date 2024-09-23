import React, { useEffect, useState } from 'react';
import { CiCircleInfo } from "react-icons/ci";
import average from "../assets/Battery/average.png";
import Battery from "../assets/Battery/battery.png";
import BatteryData from "../data/battery.json";
import "./topbox.scss";


const TopBox = ({ data }) => {
    // Accessing the battery voltage using the namespaced key
    const [BMSMake, setBMSMake] = useState(data[0].bmsMake);
    const [serialPackNumber, setSerialPackNumber] = useState(data[0]?.packSerialNumber);
    const [BatteryCapacity, setBatteryCapacity] = useState(data[0]?.batteryCapacity);
    const [MaxCellVoltage, setMaxCellVoltage] = useState(data[0]?.maxCellTemp);
    const [MinCellVoltage, setMinCellVoltage] = useState(data[0]?.minCellTemp);
    const [Ident, setIdent] = useState(data[0]?.ident);
    const [ThermalBehaviour, setThermalBehaviour] = useState(data[0]?.thermalBehaviour);
    // const [DeviceId] = useState(data[0]?.deviceID);

    useEffect(() => {
        setBMSMake(data[0]?.bmsMake);
        setSerialPackNumber(data[0]?.packSerialNumber);
        setBatteryCapacity(data[0]?.batteryCapacity);
        setMaxCellVoltage(data[0]?.maxCellTemp);
        setMinCellVoltage(data[0]?.minCellTemp);
        setIdent(data[0]?.ident);
    }, [data]);
    return (
        <div className='topBox'>
            <h1>{BMSMake}</h1>
            <span><CiCircleInfo style={{ fontSize: "18px" }} /></span>
            <div className="serial">
                {serialPackNumber}

            </div>
            <div className="card">
                <div className="left">
                    <div className="listItem">
                        <div className="list-value">{BatteryCapacity} Ah</div>
                        <div className="list-head">Battery Capacity</div>
                    </div>
                    <div className="listItem">
                        <div className="list-value">{MaxCellVoltage} °C</div>
                        <div className="list-head">Max. Cell Temp</div>
                    </div>
                    <div className="listItem">
                        <div className="list-value">{MinCellVoltage} °C</div>
                        <div className="list-head">Min. Cell Temp</div>
                    </div>
                    <div className="listItem">
                        <div className="list-value">{ThermalBehaviour} °C</div>
                        <div className="list-head">Temp Difference</div>
                    </div>
                </div>


                <div className="right">
                    <div className="battery-img">
                        <img src={Battery} alt="Battery" />
                    </div>
                    <div className="battery-data">
                        Device Id:<span>
                            {Ident} </span>
                    </div>
                    {/* <div className="battery-data">
                        Device ID:<span>
                            {DeviceId} </span>
                    </div> */}
                </div>
            </div>
            {/* <div className="capsule" style={{ backgroundColor: "#E6ECF9" }}>
                <div className="info-img"> <img src={average} alt="" /> </div>
                <div className="card" style={{ color: "#000" }}>
                    <div className="info-head">Average Current</div>
                    <div className="info-value">50 A</div>
                </div>
            </div> */}
        </div>
    );
}

export default TopBox;
