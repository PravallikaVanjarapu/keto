import axios from "axios";
import hex2ascii from "hex2ascii";
import hex2decimal from "hex2decimal";
import ieee754 from "ieee754";
import moment from "moment-timezone";
import unixTimestamp from 'unix-timestamp';
import BatteryData from "../models/Battery.js";
import BatteryData10 from "../models/Battery10.js";
import BatteryData2 from "../models/Battery2.js";
import BatteryData3 from "../models/Battery3.js";
import BatteryData4 from "../models/Battery4.js";
import BatteryData5 from "../models/Battery5.js";
import BatteryData6 from "../models/Battery6.js";
import BatteryData7 from "../models/Battery7.js";
import BatteryData8 from "../models/Battery8.js";
import BatteryData9 from "../models/Battery9.js";
import { ENE, EXIDE, EXM, LG9, NEU, OTHERS, RED, TTK, WEC } from '../models/Historical.js';
import { checkAndNotifySOCJump, checkAndUpdateBSN } from "./notificationController.js";

export const fetchData = async (Device) => {
    //console.log("Device Id " + Device);
    const url = 'https://flespi.io/gw/devices/' + Device + '/?fields=telemetry&=';
    const token = 'oMnzBCes5MKDOqEb8KSHEOlxd20iSvT465tvxvNq7mRJClIBTq6o5hL87CgPV0JP';

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: token
            }
        });

        const data = await response.data;
        const getModelForDevice = (deviceID) => {
            const modelsMap = {
                '5715131': BatteryData,
                '5640344': BatteryData2,
                '5644154': BatteryData3,
                '5691447': BatteryData4,
                '5691471': BatteryData5,
                '5691488': BatteryData6,
                '5691496': BatteryData7,
                '5691499': BatteryData8,
                '5714764': BatteryData9,
                '5709381': BatteryData10
            };

            const model = modelsMap[deviceID];

            if (!model) {
                console.error(`Unsupported device ID: ${deviceID}`);
                return null;  // Return null to handle this more gracefully
            }
            return model;
        };

        const fetchTimestampCheck = async (Device) => {
            try {
                const Timestamp = data.result[0]?.telemetry?.["timestamp"];
                console.log(Timestamp + " at " + Device);
                const date = new Date(unixTimestamp.toDate(Timestamp));
                // Extract HH:MM:SS from the Date object
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');

                // Format the time as HH:MM:SS
                const formattedTime = `${hours}:${minutes}:${seconds}`;

                if (formattedTime) {
                    const model = getModelForDevice(Device);

                    const latestRecord = await model.findOne().sort({ createdAt: -1 }).exec();

                    const previousRecord = latestRecord ? latestRecord.servertime : null;

                    if (previousRecord === formattedTime) {
                        return false;
                    } else {
                        return Timestamp;
                    }
                }
            } catch (error) {
                console.error("Error fetching timestamp:", error);
            }
        }

        const fetchIMEI = async () => {
            const imei = data.result[0]?.telemetry?.["ident"];

            ////console.log("IMEI is " + typeof (imei));
            return imei;
        }

        const fetchBMSMake = async () => {
            try {
                const canData5 = data.result[0]?.telemetry?.["can.data.frame.5"];
                const canData26 = data.result[0]?.telemetry?.["can.data.26"];

                // 45 58 4D 01 10 02 D2 30

                const canData5res = canData5 && canData5.length >= 6 ? canData5.substring(0, 6) : "";
                const asciiResult = hex2ascii(canData5res);

                ////console.log("ASCII Result:", asciiResult); // Debugging output

                if (asciiResult === "") {
                    ////console.log("No valid ASCII result from CAN data, BMS Make is OTHERS");
                    if (canData26 && canData26.substring(0, 2) === "01") {
                        const Batteryhex = canData26.substring(2);
                        const Battery = hex2ascii(Batteryhex);
                        return Battery.includes("ETO") ? "EXIDE" : "OTHERS";
                    }
                } else {
                    const makes = {
                        "EXM": "EXM",
                        "NEU": "NEU",
                        "TTK": "TTK",
                        "LG9": "LG9",
                        "ENE": "ENE",
                        "RED": "RED",
                        "WEC": "WEC"
                    };

                    for (let key in makes) {
                        if (asciiResult.includes(key)) {
                            ////console.log(`Detected BMS Make: ${key}`); // Debugging output
                            return makes[key];
                        }
                    }
                }

                // ////console.log("No BMS make found, defaulting to OTHERS");
                return "OTHERS";
            } catch (error) {
                console.error("Error processing CAN data in fetchBMSMake:", error);
                return "OTHERS";  // Return "OTHERS" as a fallback
            }
        };



        const fetchBatterySerialNumber = async (Device, connect) => {


            const canData26 = data.result[0]?.telemetry?.["can.data.frame.26"];

            const canData27 = data.result[0]?.telemetry?.["can.data.frame.27"];

            const canData28 = data.result[0]?.telemetry?.["can.data.frame.28"];

            // ////console.log(DeviceId);
            // Initialize the data parts with 'emp' as a default value

            let splitData26 = "emp";
            let splitData27 = "emp";
            let splitData28 = "emp";

            const bmsMake = await fetchBMSMake();

            // Check for each CAN data part and update if available


            if (bmsMake === "OTHERS" || bmsMake === "EXIDE") {

                if (canData26 && canData26.substring(0, 2) === "01") {
                    splitData26 = canData26.substring(2);
                }

                if (canData27 && canData27.substring(0, 2) === "02") {
                    splitData27 = canData27.substring(2);
                }

                if (canData28 && canData28.substring(0, 2) === "03") {
                    splitData28 = canData28.substring(2);
                }

            }
            else if (bmsMake === "EXM") {

                const canData26Str = String(canData26);
                const canData27Str = String(canData27);
                const canData28Str = String(canData28);

                const joinedDat = checkAndUpdateBSN(Device, bmsMake, canData26Str, canData27Str, canData28Str, connect);
                return await joinedDat;
            }
            else if (bmsMake !== "OTHERS" || bmsMake !== "EXIDE") {

                if (canData26 && canData26.substring(0, 2) === "00") {
                    splitData26 = canData26.substring(2);
                }
                if (canData27 && canData27.substring(0, 2) === "01") {
                    splitData27 = canData27.substring(2);
                }
                if (canData28 && canData28.substring(0, 2) === "02") {
                    splitData28 = canData28.substring(2);
                }
            }

            // Process each part to ASCII if not 'emp', otherwise keep 'emp'
            const processedData26 = splitData26 !== "emp" ? hex2ascii(splitData26) : splitData26;
            const processedData27 = splitData27 !== "emp" ? hex2ascii(splitData27) : splitData27;
            const processedData28 = splitData28 !== "emp" ? hex2ascii(splitData28) : splitData28;

            // Join all processed parts
            const joinedData = [processedData26, processedData27, processedData28].join('');
            return joinedData || "";   //Debugging output
        };

        const fetchBatteryCapacity = async () => {
            const canData5 = data.result[0]?.telemetry?.["can.data.frame.5"];
            const canData24 = data.result[0]?.telemetry?.["can.data.frame.24"];

            const rawData = canData24.substring(8); // Correct extraction of the substring for IEEE 754 conversion

            const bmsMake = await fetchBMSMake();

            let batteryCapacity = 0;

            if (!canData5 || canData5 === '0000000000000000') {
                if (bmsMake === "OTHERS" || bmsMake === "EXIDE") {
                    // Check if rawData has at least 8 hex characters (4 bytes), which it should from your example
                    if (rawData && rawData.length === 8) {
                        const buffer = Buffer.from(rawData, 'hex');
                        batteryCapacity = ieee754.read(buffer, 0, false, 23, 4);
                        // Read a 32-bit float; adjust for endianness if necessary
                    } else {
                        console.error("Insufficient data to read a 32-bit float");
                    }
                }
            } else if (canData5 !== '0000000000000000') {
                //45 76 43 45 65 47 56 67
                // Extracts two hex characters and converts them to a decimal integer
                const extractedData = canData5.substring(12, 14); // Correct capturing of hex bytes for conversion
                batteryCapacity = parseInt(extractedData, 16);
            }

            ////console.log("Battery Capacity: " + batteryCapacity);
            return batteryCapacity;
        };

        const fetchDate = () => {
            const currentDate = new Date();
            const formattedDate = ('0' + currentDate.getDate()).slice(-2) + '-' + ('0' + (currentDate.getMonth() + 1)).slice(-2) + '-' + currentDate.getFullYear();
            ////console.log(formattedDate);
            return formattedDate;
        }

        const fetchSOC = async () => {
            const canData10 = data.result[0]?.telemetry?.["can.data.frame.10"];
            if (!canData10) {
                return 0;
            }

            const firstTwoValues = canData10.substring(8, 10);
            const NextTwoValues = canData10.substring(10, 12);
            const value = hex2decimal(NextTwoValues + firstTwoValues);
            const SOC = value * 0.01;

            // Ensures SOC is a finite number, otherwise returns 0           
            return parseFloat(Number.isFinite(SOC) ? SOC : 0).toFixed(2);

        }

        const fetchHeartbeat = async () => {
            const canFrame6 = data.result[0]?.telemetry?.["can.data.frame.6"];
            const heartBeatRaw = canFrame6.substring(14);
            const heartBeat = hex2decimal(heartBeatRaw);
            //console.log(heartBeat);
            return heartBeat;
        }

        const fetchIsActive = async () => {

            const isActive = true;
            return isActive;
        }

        const fetchMaxCellVoltage = async () => {
            const canData7 = await data.result[0]?.telemetry?.["can.data.frame.7"];
            //console.log(canData7);
            const BmsMake = await fetchBMSMake();
            if (canData7) {
                // if (BmsMake.includes("EXM") || BmsMake.includes("WEC")) {
                const maxCellVoltagef = canData7.substring(0, 2);
                const maxCellVoltagel = canData7.substring(2, 4);
                const factor = 0.0001;
                // Ensure hex2decimal conversion is handled correctly, including the factor application
                const maxCellVoltage = hex2decimal(maxCellVoltagel + maxCellVoltagef) * factor;
                // Check if the result is a finite number; if not, set a default or error value
                return (parseFloat(Number.isFinite(maxCellVoltage) ? maxCellVoltage : 0).toFixed(3)); // or handle the NaN case as needed
            } else {

                return 0; // Default or error value when canData7 is not available
            }
        };

        function hexToBinary(hexString) {
            hexString = String(hexString);
            return hexString.split('')
                .map(hexDigit => parseInt(hexDigit, 16).toString(2).padStart(4, '0'))
                .join('');
        }

        const formatTime = async (Time) => {
            const formattedTime = Time.toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            return formattedTime;
        }

        const fetchErrors = async () => {
            const canData2 = await data.result[0]?.telemetry?.["can.data.frame.2"];
            const extractedData = await canData2.substring(0, 6);
            const ErrorsBin = hexToBinary(extractedData);
            // const ErrorsBin = '0100101010110100101010101'
            //console.log("Errors Bin " + ErrorsBin);

            const first8 = ErrorsBin.substring(0, 8);
            const second8 = ErrorsBin.substring(0, 8);
            const third8 = ErrorsBin.substring(0, 8);

            const time = await formatTime(new Date(Date.now()));
            const Error = [];
            // const Error = ["Thermal Runaway", "Battery High Charge Current"];

            if (first8[7] === '1') {
                Error.push(`Battery over Temperature Alarm  | ${time}`);
            }
            if (first8[6] === '1') {
                Error.push(`Battery over Temperature Cut Off| ${time}`);
            }
            if (first8[5] === '1') {
                Error.push(`Battery Under Temperature &nbsp; | ${time}`);
            }
            if (first8[4] === '1') {
                Error.push(`Battery under Cutoff Temperature| ${time}`);
            }
            if (first8[3] === ' ') {
                Error.push(`Battery Over Voltage            | ${time}`);
            }
            if (first8[2] === '1') {
                Error.push(`Battery Over Voltage cutoff     | ${time}`);
            }
            if (first8[1] === '1') {
                Error.push(`Battery Under Voltage           | ${time}`);
            }
            if (first8[0] === '1') {
                Error.push(`Battery Under Voltage Cutoff    | ${time}`);
            }
            if (second8[7] === '1') {
                Error.push(`Battery Low SOC                 | ${time}`);
            }
            if (second8[6] === '1') {
                Error.push(`Battery Weak                    | ${time}`);
            }
            if (second8[5] === '1') {
                Error.push(`TCU Communication failure       | ${time}`);
            }
            if (second8[4] === '1') {
                Error.push(`Cell Over Voltage Cut off       | ${time}`);
            }
            if (second8[3] === '1') {
                Error.push(`Cell Under Voltage Cut off      | ${time}`);
            }
            if (second8[2] === '1') {
                Error.push(`Battery High Discharge Current  | ${time}`);
            }
            if (second8[1] === '1') {
                Error.push(`Battery High Charge Current     | ${time}`);
            }
            if (second8[0] === '1') {
                Error.push(`Cell Deviation Error            | ${time}`);
            }
            if (third8[7] === '1') {
                Error.push(`Thermal Runaway                 | ${time}`);
            }
            ////console.log("Array of Errors :" + Error);
            // return [`Battery over Temperature Alarm | ${time}`, `Cell Under Voltage Cut off | ${time}`];
            return Error;
        }

        const fetchMinCellVoltage = async () => {
            const canData7 = await data.result[0]?.telemetry?.["can.data.frame.7"];

            const BmsMake = await fetchBMSMake();

            // Make sure canData7 is not undefined before proceeding
            if (canData7) {
                // Extract the first two values
                let factor = 0.0001;
                const minCellVoltagef = canData7.substring(4, 6);
                const minCellVoltagel = canData7.substring(6, 8);

                const minCellVoltage = hex2decimal(minCellVoltagel + minCellVoltagef) * factor;

                // Check if the result is a finite number; if not, set a default or error value
                return parseFloat(Number.isFinite(minCellVoltage) ? minCellVoltage : 0).toFixed(3);
                // or handle the NaN case as needed
            }
            else {
                return 0;
            }
        }

        const fetchcellImbalance = async () => {
            try {
                const MaxCellVoltage = await fetchMaxCellVoltage();
                const MinCellVoltage = await fetchMinCellVoltage();

                // Check if either value is not a number or is missing
                // if (typeof MaxCellVoltage !== 'number' || typeof MinCellVoltage !== 'number' || isNaN(MaxCellVoltage) || isNaN(MinCellVoltage)) {
                //     // Log error, set default, or handle as needed
                //     console.error('Invalid cell voltage values:', { MaxCellVoltage, MinCellVoltage });
                //     return 0; // Example default value, adjust as needed
                // }

                const CellImbalance = MaxCellVoltage - MinCellVoltage;
                // Return CellImbalance rounded to two decimal places
                return CellImbalance;
            } catch (error) {
                console.error('Error calculating cell imbalance:', error);
                return 0;
                // Example default value, adjust accordingly
            }
        };

        // const minCellVoltagef = canData7.substring(4, 6);
        // const minCellVoltagel = canData7.substring(6, 8);
        // const minCellVoltage = (hex2decimal(minCellVoltagel + minCellVoltagef) * factor);
        // const cellImbalance = maxCellVoltage - minCellVoltage;
        ////console.log("Cell " + cellImbalance);

        const fetchmaxCellTemp = async () => {
            const canData = await data.result[0]?.telemetry?.["can.data.frame.9"];
            if (!canData) {
                console.error("No data for max cell temperature.");
                return 0; // Provide a sensible default or handle as needed.
            }
            const rawValue = canData.substring(0, 2);
            // Adjust indices as needed.
            const maxCellTemp = hex2decimal(rawValue);
            return maxCellTemp;
        };

        const fetchCycleCount = async () => {
            const canData15 = await data.result[0]?.telemetry?.["can.data.frame.15"];

            if (!canData15) {
                return 0; // Return 0 if telemetry data is missing
            }
            const firstTwoValues = canData15.substring(0, 2);
            const NextTwoValues = canData15.substring(2, 4);
            const CycleCount = hex2decimal(NextTwoValues + firstTwoValues);
            return CycleCount;
        }

        const fetchminCellTemp = async () => {
            const canData = await data.result[0]?.telemetry?.["can.data.frame.9"];
            if (!canData) {
                console.error("No data for min cell temperature.");
                return 0; // Provide a sensible default or handle as needed.
            }
            const rawValue = canData.substring(2, 4); // Adjust indices as needed.
            const minCellTemp = hex2decimal(rawValue); // Example conversion factor.
            return minCellTemp;
        };

        const fetchthermalBehaviour = async () => {
            const maxCellTemp = await fetchmaxCellTemp();
            const minCellTemp = await fetchminCellTemp();
            const thermalBehaviour = maxCellTemp - minCellTemp;
            //console.log("Thermal Behaviour  " + thermalBehaviour);
            return parseFloat(thermalBehaviour.toFixed(4));
        }

        // const fetchCurrent = async () => {
        //     const canData8 = await data.result[0]?.telemetry?.["can.data.frame.8"];
        //     const firstData = canData8.substring(0, 2);
        //     const SecondData = canData8.substring(2, 4);
        //     const thirdData = canData8.substring(4, 6);
        //     const fourthData = canData8.substring(6, 8);
        //     const factor = 0.00001;
        //     let Current;
        //     function hexToSignedInt(hex) {
        //         // Ensure the hex string represents a 32-bit number, padding if necessary
        //         hex = hex.padStart(8, '0');

        //         // Convert hex to a 32-bit binary string
        //         let binaryStr = parseInt(hex, 16).toString(2).padStart(32, '0');

        //         // Check if the number is negative (if the first bit is 1)
        //         if (binaryStr[0] === '1') {
        //             // Calculate 2's complement to get the positive value, then make it negative
        //             const invertedBinaryStr = binaryStr.split('').map(b => b === '1' ? '0' : '1').join(''); // Invert bits for 1's complement
        //             const positiveValue = parseInt(invertedBinaryStr, 2) + 1; // Add 1 for 2's complement, converting back from binary to decimal
        //             return -positiveValue; // Return as negative value
        //         } else {
        //             // Directly convert binary string to decimal for positive numbers
        //             return parseInt(binaryStr, 2);
        //         }
        //     }

        //     if (fourthData === "00") {
        //         Current = hex2decimal(fourthData + thirdData + SecondData + firstData);

        //     }
        //     if (fourthData === "FF") {
        //         Current = (fourthData + thirdData + SecondData + firstData);
        //        //console.log("Negative Current: " + hexToSignedInt(Current));
        //         Current = hexToSignedInt(Current);

        //     }
        //     const ActualCurrent = Current * factor;
        //    //console.log("Current: " + ActualCurrent);
        //     return ActualCurrent;

        // }

        // const fetchMinCellVoltage = async () => {
        //     const canData7 = await data.result[0]?.telemetry?.["can.data.frame.7"];
        //     const minCellVoltageHex = canData7.substring(2, 4);
        //     const minCellVoltage = hex2decimal(minCellVoltageHex);
        //    //console.log(minCellVoltage);
        //     return minCellVoltage;

        // }
        // const fetchStatus = async () => {
        //     const canData3 = data.result[0]?.telemetry?.["can.data.frame.3"];
        //     const StatusHex = canData3.substring(canData3.length - 2);
        //     const Status = hex2decimal(StatusHex);
        //    //console.log(Status);
        //     return Status;

        // }

        const fetchStatus = async () => {
            const canData4 = data.result[0]?.telemetry?.["can.data.frame.4"];
            if (canData4) {

                const StatusHex = canData4.slice(-2);
                const decimalValue = hex2decimal(StatusHex);
                let state = ''

                switch (decimalValue) {
                    case '0':
                        state = 'INIT';
                        break;
                    case '1':
                        state = 'STANDBY';
                        break;
                    case '2':
                        state = 'Discharging';
                        break;
                    case '3':
                        state = 'Charger Detection';
                        break;
                    case '4':
                        state = 'Charging';
                        break;
                }
                //console.log(state);
                return state;
            } else {
                ////console.log("canData3 is undefined or not present");
                return null;
            }
        };

        // const getLiveTime = async () => {
        //     const now = new Date(); // Create a new date object with the current time
        //     const hours = now.getHours().toString().padStart(2, '0'); // Get the current hour and pad with leading zero if necessary
        //     const minutes = now.getMinutes().toString().padStart(2, '0'); // Get the current minute and pad with leading zero if necessary
        //     const seconds = now.getSeconds().toString().padStart(2, '0'); // Get the current second and pad with leading zero if necessary

        //     return `${hours}:${minutes}:${seconds}`; // Return the formatted time
        // }

        ////console.log(getLiveTime());

        const fetchServerTime = async () => {
            try {
                const timestamp = data.result[0]?.telemetry?.["timestamp"];
                if (timestamp) {
                    // Convert Unix timestamp to Date object
                    const date = new Date(unixTimestamp.toDate(timestamp));

                    return date;
                } else {
                    throw new Error("Timestamp not found");
                }
            } catch (error) {
                console.error(error);
                return null;
            }
        };

        const fetchbatteryPackCurrent = async () => {
            const canData8 = await data.result[0]?.telemetry?.["can.data.frame.8"];
            const firstData = canData8.substring(0, 2);
            const SecondData = canData8.substring(2, 4);
            const thirdData = canData8.substring(4, 6);
            const fourthData = canData8.substring(6, 8);
            const factor = 0.00001;
            let Current;
            if (!canData8) {
                return 0
            }
            function hexToSignedInt(hex) {
                // Ensure the hex string represents a 32-bit number, padding if necessary
                hex = hex.padStart(8, '0');

                // Convert hex to a 32-bit binary string
                let binaryStr = parseInt(hex, 16).toString(2).padStart(32, '0');

                // Check if the number is negative (if the first bit is 1)
                if (binaryStr[0] === '1') {
                    // Calculate 2's complement to get the positive value, then make it negative
                    const invertedBinaryStr = binaryStr.split('').map(b => b === '1' ? '0' : '1').join(''); // Invert bits for 1's complement
                    const positiveValue = parseInt(invertedBinaryStr, 2) + 1; // Add 1 for 2's complement, converting back from binary to decimal
                    return -positiveValue; // Return as negative value
                } else {
                    // Directly convert binary string to decimal for positive numbers
                    return parseInt(binaryStr, 2);
                }
            }

            if (fourthData === "00") {
                Current = hex2decimal(fourthData + thirdData + SecondData + firstData);

            }
            if (fourthData === "FF") {
                Current = (fourthData + thirdData + SecondData + firstData);
                ////console.log("Negative Current: " + hexToSignedInt(Current));
                Current = hexToSignedInt(Current);
            }
            const ActualCurrent = Current * factor;
            ////console.log("Current: " + ActualCurrent);
            return parseFloat(ActualCurrent).toFixed(3);
        }

        const fetchconnectStatus = async () => {
            const current = await fetchbatteryPackCurrent();
            ////console.log(current);

            // Convert the float value of current to number and check status
            return parseFloat(current) !== 0;
        };

        const connectStatus = await fetchconnectStatus();
        ////console.log("Connect Status " + connectStatus);

        // const fetchDuration = async () => {
        //    //console.log("New Session function called");
        //    //console.log("Duration " + Duration);
        //     return Duration;
        // }

        //For all Notifications checking write a function
        // initializeOrUpdateHistoricalData(Device, bmsMakeValue, BatterySerialNumber, SOC, CycleCount, BatteryCapacity, maxCellTemp, minCellTemp, MaxCellVoltage, MinCellVoltage, Status, batteryPackCurrent, SOCJumpMessage, CellImbNotify, ThermalImbNotify, Error, first, second, third, Imei, connectStatus);

        async function initializeOrUpdateHistoricalData(Device, Make, batterySerialNumber, SOC, CycleCount, BatteryCapacity, rawMaxCellTemp, rawMinCellTemp, rawMaxCellVolt, rawMinCellVolt, Status, batteryPackCurrent, SOCJumpMessages, CellImbNotify, ThermalImbNotify, ifError, ident, connect, serverTime) {
            const Model = getModelByMake(Make);

            if (!Model) {
                //console.log(`Skipping operation for unsupported BMS Make: ${Make}`);
                return;
            }

            // const NewcanFrames = new Map();

            // if (Make === "OTHERS" || Make === "EXIDE") {
            //     if (first && first.substring(0, 2) === "01") NewcanFrames.set(first.substring(0, 2), first.substring(2));
            //     if (second && second.substring(0, 2) === "02") NewcanFrames.set(second.substring(0, 2), second.substring(2));
            //     if (third && third.substring(0, 2) === "03") NewcanFrames.set(third.substring(0, 2), third.substring(2));
            // }

            // if (Make !== "OTHERS" || Make !== "EXIDE") {
            //     if (first && first.substring(0, 2) === "00") NewcanFrames.set(first.substring(0, 2), first.substring(2));
            //     if (second && second.substring(0, 2) === "01") NewcanFrames.set(second.substring(0, 2), second.substring(2));
            //     if (third && third.substring(0, 2) === "02") NewcanFrames.set(third.substring(0, 2), third.substring(2));
            // }

            const currentTime = new Date();
            const twentyMinutesAgo = new Date(currentTime.getTime() - 20 * 60 * 1000);

            const MaxCellTemp = safeNumber(rawMaxCellTemp);
            const MinCellTemp = safeNumber(rawMinCellTemp);
            const MaxCellVolt = safeNumber(rawMaxCellVolt);
            const MinCellVolt = safeNumber(rawMinCellVolt);

            const partialSerial = batterySerialNumber; // Assume this is the substring you want to match
            const regex = new RegExp(partialSerial, 'i'); // 'i' for case-insensitive matching.

            const existingRecord = await Model.findOne({ batterySerialNumber: { $regex: regex } })
                .sort({ endTime: -1 })
                .exec();

            if (batterySerialNumber == "empempemp" || batterySerialNumber == "empemp" || batterySerialNumber == "emp" || batterySerialNumber == "") {
                return "";

                // } else if (existingRecord && (existingRecord.MaxSOC === 100 || existingRecord.MinSOC === 0) && existingRecord.BatteryPackCurrent[existingRecord.BatteryPackCurrent.length - 1] === 0) {

                //     existingRecord.Condition = "Strong";
                //     if (existingRecord.SOCJump.length > 0) {
                //         existingRecord.Condition = "Weak";
                //     } else if (existingRecord.CellImbalance.length > 0) {
                //         existingRecord.Condition = "Weak";
                //     } else if (existingRecord.ThermalIssue.length > 0) {
                //         existingRecord.Condition = "Weak";
                //     } else if (ifError.length > 0) {
                //         existingRecord.Condition = "Weak";
                //     }
                //     ////console.log(`No updates or new records are created as SOC limits reached for record with serial number: ${existingRecord.batterySerialNumber}`);
                //     await existingRecord.save();
                //     return; 

            } else if (connect == true) {
                function convertToIST(timestamp) {
                    const date = new Date(timestamp);

                    const utcTime = date.getTime();

                    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;

                    const istTime = new Date(utcTime + istOffset);

                    const hours = String(istTime.getHours()).padStart(2, '0');
                    const minutes = String(istTime.getMinutes()).padStart(2, '0');
                    const seconds = String(istTime.getSeconds()).padStart(2, '0');

                    return `${hours}:${minutes}:${seconds}`;
                }
                if (!existingRecord || (existingRecord.endTime && new Date(existingRecord.endTime) < twentyMinutesAgo)) {
                    // Create a new record if no existing record or last session ended more than 10 minutes ago
                    if (!batterySerialNumber.includes("emp")) {
                        // if (!batterySerialNumber.includes("emp")) {
                        const newHistoricalRecord = new Model({
                            deviceId: Device,      //561
                            Ident: ident,          //123456
                            bmsMake: Make,         //EXM
                            date: serverTime,      //18-05-24
                            batterySerialNumber,   //EK123
                            startTime: serverTime, //01:24
                            endTime: serverTime,   //01:24
                            MaxSOC: SOC,           //49
                            MinSOC: SOC,
                            MaxCellTemp,
                            MinCellTemp,
                            MaxCellVolt,
                            MinCellVolt,
                            totalChargeCycles: CycleCount,
                            duration: 0,
                            status: Status,
                            capacity: BatteryCapacity,
                            BatteryPackCurrent: batteryPackCurrent ? [batteryPackCurrent] : [],
                            averageCurrent: 0,
                            isActive: connect,
                            iferrors: ifError ? ifError : [],
                            SOCJump: [],
                            CellImbalance: CellImbNotify ? [CellImbNotify] : [],
                            ThermalIssue: ThermalImbNotify ? [ThermalImbNotify] : [],
                            Charge: 0,
                            Discharge: 0,
                            Condition: "UnderCDC",
                            SOC: [{
                                value: SOC.toString(), timestamp: convertToIST(serverTime)
                            }] // Save SOC along with timestamp
                        });
                        await newHistoricalRecord.save();
                        ////console.log('New historical record created:', newHistoricalRecord);
                    }
                } else {
                    // Update the existing record
                    const durationInMilliseconds = currentTime - existingRecord.startTime;
                    const durationInHours = durationInMilliseconds / 3600000;
                    const totalCurrent = existingRecord.BatteryPackCurrent.reduce((a, b) => a + b, 0);
                    const averageCurrent = existingRecord.BatteryPackCurrent.length > 0 ? totalCurrent / existingRecord.BatteryPackCurrent.length : 0;
                    const Charge = averageCurrent > 0 ? averageCurrent * durationInHours : 0;
                    const Discharge = averageCurrent < 0 ? -averageCurrent * durationInHours : 0;

                    existingRecord.endTime = serverTime;
                    // existingRecord.endTime = currentTime;
                    existingRecord.totalChargeCycles = CycleCount;
                    existingRecord.status = Status;
                    existingRecord.averageCurrent = parseFloat(averageCurrent.toFixed(2));
                    existingRecord.duration = parseFloat(durationInHours.toFixed(2));
                    existingRecord.MaxSOC = Math.max(existingRecord.MaxSOC, SOC);
                    existingRecord.MinSOC = Math.min(existingRecord.MinSOC, SOC);
                    existingRecord.MaxCellTemp = Math.max(existingRecord.MaxCellTemp, MaxCellTemp);
                    existingRecord.MinCellTemp = Math.min(existingRecord.MinCellTemp, MinCellTemp);
                    existingRecord.MaxCellVolt = Math.max(existingRecord.MaxCellVolt, MaxCellVolt);
                    existingRecord.MinCellVolt = Math.min(existingRecord.MinCellVolt, MinCellVolt);

                    existingRecord.SOC.push({ value: SOC.toString(), timestamp: serverTime });
                    existingRecord.SOC.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                    if (batteryPackCurrent) {
                        const lastFewCurrents = existingRecord.BatteryPackCurrent.slice(-3); // Check the last three values
                        // Only push if the current value is different from the last and not all recent values are zero when the current is zero
                        if (batteryPackCurrent !== lastFewCurrents[lastFewCurrents.length - 1]) {
                            existingRecord.BatteryPackCurrent.push(batteryPackCurrent);
                        }
                    }
                    if (CellImbNotify) {

                        existingRecord.CellImbalance.push(CellImbNotify);

                    }
                    if (ThermalImbNotify) {
                        existingRecord.ThermalIssue.push(ThermalImbNotify);
                    }
                    if (ifError) {
                        existingRecord.iferrors.push(...ifError);
                        // Merge new errors into the existing array
                    }
                    existingRecord.Charge = Charge; // Increment the accumulated charge
                    existingRecord.Discharge = Discharge; // Increment the accumulated discharge

                    existingRecord.Condition = "UnderCDC";

                    await existingRecord.save();
                    ////console.log('Existing historical record updated:', existingRecord);
                }
            }
            else if (connect == false) {

                if (existingRecord) {

                    // Check for SOC jumps

                    // [1,2,3,4,5,6,7,8,9,10,11]

                    for (let i = 1; i < existingRecord.SOC.length; i++) {
                        const currentSOC = parseFloat(existingRecord.SOC[i].value);
                        const previousSOC = parseFloat(existingRecord.SOC[i - 1].value);
                        const SOCtimestamp = existingRecord.SOC[i].timestamp;

                        // Check if SOC has increased by more than 0.2
                        if (currentSOC - previousSOC > 0.2) {
                            // Calculate the SOC jump and add it to the SOCJump array
                            const socJump = `${currentSOC} - ${previousSOC}    | ${SOCtimestamp}`;

                            const exists = existingRecord.SOCJump.some(jump => jump === socJump);
                            if (!exists) {
                                existingRecord.SOCJump.push(socJump);
                            }
                        }
                    }

                    // existingRecord.Condition = "Strong";

                    if (existingRecord.SOCJump.length > 0) {
                        existingRecord.Condition = "Weak";

                    } else if (existingRecord.CellImbalance.length > 0) {
                        existingRecord.Condition = "Weak";

                    } else if (existingRecord.ThermalIssue.length > 0) {
                        existingRecord.Condition = "Weak";

                    } else if (ifError.length > 0) {
                        existingRecord.Condition = "Weak";
                    }
                    else if (existingRecord.Charge < (0.95 * existingRecord.capacity) || existingRecord.Discharge < (0.95 * existingRecord.capacity)) {
                        existingRecord.Condition = "Weak";
                    } else {

                        existingRecord.Condition = "Strong"
                    }

                    existingRecord.isActive = false;

                    await existingRecord.save();
                }
                return;
            }
        }

        // Helper function to handle NaN values safely
        function safeNumber(value, defaultValue = 0) {
            const num = parseFloat(value);
            return isNaN(num) ? defaultValue : num;
        }


        const getModelByMake = (Make) => {

            if (!Make) {  // Check if 'Make' is empty or undefined
                //console.log('BMS Make is empty, skipping operation.');
                return null;  // Return null to indicate that the operation should be skipped
            }
            switch (Make) {
                case "EXM":
                    return EXM;
                case "NEU":
                    return NEU;
                case "TTK":
                    return TTK;
                case "OTHERS":
                    return OTHERS;
                case "EXIDE":
                    return EXIDE;
                case "WEC":
                    return WEC;
                case "ENE":
                    return ENE;
                case "LG9":
                    return LG9;
                case "RED":
                    return RED;
                default:
                    console.warn(`Unsupported Make: ${Make}, unable to proceed.`);
                    return null; // Return null if no known Make matches
            }

        }

        const fetchAndProcessSOCJump = async (packSerialNumber, Device, Model) => {
            const socJumpData = await checkAndNotifySOCJump(packSerialNumber, Device, Model);
            return socJumpData;  // Assuming this returns a string description of the SOC jump
        };

        const fetchAndProcessCellImbalance = async (CellImbalance, serverTime) => {
            const formatTime = (date) => {
                // Format the date using the desired time zone and 12-hour format with AM/PM notation
                return moment(date).tz('Asia/Kolkata').format('hh:mm:ss A');
            };


            if (CellImbalance > 0.3) {

                //  parseFloat(batteryPackCurrent)
                const message = `${parseFloat(CellImbalance).toFixed(2)} | ${serverTime}`;
                return message; // Return the message if the condition is met
            } else {
                return ""; // Return empty string if the imbalance is not significant
            }
        };

        const fetchAndProcessThermalImb = async (thermalBehaviour, maxCellTemp, serverTime) => {
            const formatTime = (date) => {
                // Format the date using the desired time zone and 12-hour format with AM/PM notation
                return moment(date).tz('Asia/Kolkata').format('hh:mm:ss A');
            };

            const currentTime = new Date();
            if (maxCellTemp > 50) {
                try {
                    const Time = formatTime(currentTime);
                    const message = `${maxCellTemp} | ${serverTime}`;
                    return message; // Return the formatted message if the condition is met
                } catch (error) {
                    console.error('Error formatting time:', error);
                    return ""; // Return empty string in case of an error
                }
            } else if (thermalBehaviour > 5) {
                try {
                    const Time = formatTime(currentTime);
                    const message = `${thermalBehaviour} > 50 | ${serverTime}`;
                    //console.log("THERMAL " + message);
                    return message; // Return the formatted message if the condition is met
                } catch (error) {
                    console.error('Error formatting time:', error);
                    return ""; // Return empty string in case of an error
                }
            } else {
                return ""; // Return empty string if the imbalance is not significant
            }
        };


        async function saveBatteryData(Device) {
            try {
                const model = getModelForDevice(Device);
                const Timestamp = await fetchTimestampCheck(Device);
                if (Timestamp) {

                    const SOC = await fetchSOC();
                    const BatteryCapacity = await fetchBatteryCapacity();
                    const Status = await fetchStatus();
                    const connectStatus = await fetchconnectStatus();
                    const BMSMake = await fetchBMSMake();
                    const BatterySerialNumber = await fetchBatterySerialNumber(Device, connectStatus);
                    const bmsMakeValue = BatterySerialNumber.startsWith("ETO") ? "EXIDE" : BMSMake;
                    const isActive = await fetchIsActive();
                    const batteryPackCurrent = await fetchbatteryPackCurrent();
                    if (BatterySerialNumber === "" && BMSMake === "" && batteryPackCurrent === 0 && SOC === 0) {
                        //console.log(`No serial number and BMS Make found, skipping save operation for ${Device}`);
                        return;
                    }
                    const minCellTemp = await fetchminCellTemp();
                    const BatteryDate = fetchDate();
                    const MaxCellVoltage = await fetchMaxCellVoltage();
                    const MinCellVoltage = await fetchMinCellVoltage();
                    const CellImbalance = await fetchcellImbalance();
                    const serverTime = await fetchServerTime();
                    const maxCellTemp = await fetchmaxCellTemp();
                    const thermalBehaviour = await fetchthermalBehaviour();
                    const CycleCount = await fetchCycleCount();
                    const Error = await fetchErrors();
                    const SOCJumpMessage = await fetchAndProcessSOCJump(BatterySerialNumber, Device, model)
                    const CellImbNotify = await fetchAndProcessCellImbalance(CellImbalance, serverTime);
                    const ThermalImbNotify = await fetchAndProcessThermalImb(thermalBehaviour, maxCellTemp, serverTime);
                    const Imei = await fetchIMEI();
                    const heartbeat = await fetchHeartbeat();

                    // initializeOrUpdateHistoricalData(Device, BMSMake, BatterySerialNumber, isActive, batteryPackCurrent, SOC, MaxCellVoltage, MinCellVoltage, maxCellTemp, minCellTemp, CycleCount);

                    initializeOrUpdateHistoricalData(Device, bmsMakeValue, BatterySerialNumber, SOC, CycleCount, BatteryCapacity, maxCellTemp, minCellTemp, MaxCellVoltage, MinCellVoltage, Status, batteryPackCurrent, SOCJumpMessage, CellImbNotify, ThermalImbNotify, Error, Imei, connectStatus, serverTime);

                    if ((BatterySerialNumber != "empemp" || BatterySerialNumber != "empempemp" || !BatterySerialNumber.includes("emp") && maxCellTemp !== 0 && minCellTemp !== 0 && MaxCellVoltage !== 0 && MinCellVoltage)) {
                        if (BatterySerialNumber !== "empempemp") {
                            const newBatteryData = new model({
                                deviceID: Device,
                                packSerialNumber: BatterySerialNumber,
                                bmsMake: bmsMakeValue,
                                batteryCapacity: BatteryCapacity,
                                date: BatteryDate,
                                SOC: SOC,
                                cycleCount: CycleCount,
                                maxCellVoltage: MaxCellVoltage,
                                minCellVoltage: MinCellVoltage,
                                cellImbalance: CellImbalance,
                                maxCellTemp: maxCellTemp,
                                minCellTemp: minCellTemp,
                                thermalBehaviour: thermalBehaviour,
                                status: Status,
                                BatteryPackcurrent: parseFloat(batteryPackCurrent).toFixed(2),
                                iferror: Error,
                                isActive: isActive,
                                SOCJump: SOCJumpMessage,
                                ident: Imei,
                                connect: connectStatus,
                                heartbeatSignal: heartbeat,
                                servertime: serverTime
                            });

                            await newBatteryData.save();
                        }
                    }
                }

                //console.log('Data saved to DB successfully.');
            } catch (error) {
                console.error('Error fetching data or saving to DB:', error);
            }
        }
        saveBatteryData(Device).then(() => {
            //console.log(`Operation complete for ${Device}`);

        }).catch(error => {
            console.error('Failed to save battery data:', error);
        });


    } catch (error) {
        console.error('Error fetching data:', error);
    }
};