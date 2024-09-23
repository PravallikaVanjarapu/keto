import React, { useEffect, useState } from 'react';
import { RiFlashlightFill, RiPlugLine } from 'react-icons/ri';
import average from "../assets/Battery/average.png";
import bpc from "../assets/Battery/bpc.png";
import heart from "../assets/Battery/heart.png";
import charge from "../assets/Battery/charge.png";
import discharge from "../assets/Battery/discharge.png";
import Error from "../assets/Battery/err.png";
import "./battery.css";

const BatteryStatus = ({ data }) => {
    const [isCharging, setIsCharging] = useState(false);
    const [activeCapsule, setActiveCapsule] = useState('bpc');
    const [batteryLevel, setBatteryLevel] = useState(data[0].SOC);
    const [State, setState] = useState(data[0]?.status);
    const [Heart, setHeart] = useState(data[0]?.heartbeatSignal);
    const [BatteryPackCurrent, setBatteryPackCurrent] = useState(data[0]?.BatteryPackcurrent);
    // const [Charge, setChargeCondition] = useState(data[0]?.charge);
    // const [Discharge, setDischarge] = useState(data[0]?.discharge);
    // const [Average, setAverage] = useState(data[0]?.averageCurrent);

    useEffect(() => {
        setBatteryLevel(data[0].SOC);
        setState(data[0]?.status);
        setBatteryPackCurrent(data[0]?.BatteryPackcurrent);
        // setChargeCondition(data[0]?.charge);
        // setDischarge(data[0]?.discharge);
        // setAverage(data[0]?.averageCurrent);
    }, [data]);

    const handleStatClick = (capsuleId) => {
        setActiveCapsule(capsuleId);

    };

    function BatteryStatus({ batteryLevel }) {
        // Convert to number if it's a string representation of a number
        const numericBatteryLevel = parseFloat(batteryLevel);

        // Render only if numericBatteryLevel is a number
        return (
            <div>
                {numericBatteryLevel.toFixed(2)}%
            </div>
        );
    }

    const getLiquidClass = (level) => {
        if (level <= 20) return 'gradient-color-red';
        else if (level <= 40) return 'gradient-color-orange';
        else if (level <= 80) return 'gradient-color-yellow';
        else return 'gradient-color-green';
    };

    return (
        <>
            <div className="battery-body">
                <section className="battery">
                    <div className="battery__card">
                        <div className="battery__data">
                            <p className="battery__text">SOC</p>
                            <h1 className="battery__percentage" style={{ display: "inline" }}><BatteryStatus batteryLevel={batteryLevel} /></h1>
                            <p className="battery__status">
                                {batteryLevel === 100 && <div>
                                    Full Battery <RiPlugLine />
                                </div>}
                                <br />
                                <span>
                                    Battery Status <br />
                                    {State} <RiFlashlightFill />
                                </span>

                            </p>
                        </div>

                        <div className="battery__pill">
                            <div className="battery__level" >
                                <div className={`battery__liquid ${getLiquidClass(batteryLevel)}`} style={{ height: batteryLevel === 100 ? '104%' : `${batteryLevel}%` }}></div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="status">
                <div className="stat-img" onClick={() => handleStatClick('bpc')}><img src={bpc} alt="" /></div>
                {/* <div className="stat-img" onClick={() => handleStatClick('charge')}><img src={charge} alt="" /></div>
                <div className="stat-img" onClick={() => handleStatClick('discharge')}><img src={discharge} alt="" /></div>*/}
                <div className="stat-img" onClick={() => handleStatClick('heart')}><img src={heart} alt="" /></div> 
            </div>

            {activeCapsule === 'bpc' && (
                <div className="capsule">
                    <div className="info-img"> <img src={bpc} alt="" /> </div>
                    <div className="card">
                        <div className="info-head">Battery Pack Current</div>
                        <div className="info-value">{BatteryPackCurrent} Amp</div>
                    </div>
                </div>
            )}

            {activeCapsule === 'heart' && (
                <div className="capsule">
                    <div className="info-img"> <img src={heart} alt="" /> </div>
                    <div className="card">
                        <div className="info-head">BMS Heartbeat</div>
                        <div className="info-value">{Heart}</div>
                    </div>
                </div>
            )}


            {/* {activeCapsule === 'average' && (<div className="capsule">
                <div className="info-img"> <img src={average} alt="" /> </div>
                <div className="card">
                    <div className="info-head">Average Current</div>
                    <div className="info-value">{Number(Average).toFixed(3)} A</div>
                </div>
            </div>)} */}

            {/* {activeCapsule === 'discharge' && (<div className="capsule">
                <div className="info-img"> <img src={discharge} alt="" /> </div>
                <div className="card">
                    <div className="info-head">Discharge Condition</div>
                    <div className="info-value">{Discharge}</div>
                </div>
            </div>

            )}
            {activeCapsule === 'charge' && (<div className="capsule">
                <div className="info-img"> <img src={charge} alt="" /> </div>
                <div className="card">
                    <div className="info-head">Charge Condition</div>
                    <div className="info-value">{Charge}</div>
                </div>
            </div>

            )} */}
        </>
    );
};


export default BatteryStatus;
