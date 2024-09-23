
import hex2ascii from "hex2ascii";
import moment from "moment-timezone";
import { Model } from "mongoose";
import { EsimProfileContextImpl } from "twilio/lib/rest/supersim/v1/esimProfile.js";
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
import DeviceModel from "../models/Unique.js";

export async function checkAndNotifySOCJump(packSerialNumber, Device, Model) {
    // Fetch the latest two BatteryData entries for the specific battery
    const latestBatteryDataEntries = await Model.find({ packSerialNumber: packSerialNumber })
        .sort({ createdAt: -1 }) // Sort by creation time, descending
        .limit(2); // Limit to the two most recent entries

    // Check if we have two entries to compare
    if (latestBatteryDataEntries.length < 2) {
        // console.log("Not enough data entries for comparison.");
        return ""; // Return empty if there aren't enough entries
    }

    const [latestEntry, previousEntry] = latestBatteryDataEntries;

    // Check if both SOC values are either > 90% or < 10%
    if ((latestEntry.SOC > 90 && previousEntry.SOC > 90) || (latestEntry.SOC < 10 && previousEntry.SOC < 10)) {
        // console.log("Both SOC readings are either above 90% or below 10%. No action taken.");
        return ""; // Return empty since no actionable SOC jump occurred
    }

    // Calculate the difference in SOC values
    const socJump = Math.abs(latestEntry.SOC - previousEntry.SOC);

    // Format time using moment-timezone
    const formatTime = (date) => {
        return moment(date).tz('Asia/Kolkata').format('hh:mm:ss A');
    };
    // const formattedTime = formatTime(new Date());
    // const message = `${previousEntry.SOC} - ${latestEntry.SOC} | ${formattedTime}`;
    // console.log("SOC JUMP check" + message);
    // return message;
    // Determine if the jump is significant
    if (socJump > 0.2) {
        const formattedTime = formatTime(new Date());
        const message = `${previousEntry.SOC} - ${latestEntry.SOC} | ${formattedTime}`;
        console.log(message);
        return message; // Return the message with the jump and timestamp
    } else {
        return "";
    }
}

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
        //console.error(`Unsupported device ID: ${deviceID}`);
        return null;  // Return null to handle this more gracefully
    }
    return model;
};

export async function checkAndUpdateBSN(device, bms, first, second, third, connect) {
    // Find an existing record in the DeviceModel collection with the specified DeviceID
    const existingRecord = await DeviceModel.findOne({ DeviceID: device });

    if (bms === "EXM") {

        // Initialize a new Map object to store CAN frames
        const NewcanFrames = new Map();
        // Placeholder data to check against
        const placeholderData = "00000000000000";
        // Loop through the provided frames (first, second, third)
        [first, second, third].forEach((frame) => {
            // Check if the frame is not null or undefined
            if (frame) {
                // Extract the key (first two characters) and the value (remaining characters) from the frame
                let key = frame.substring(0, 2);
                let value = frame.substring(2);

                // Conditional checks for specific allowed keys and that the value is not the placeholder
                if ((key === "00" && value !== placeholderData) ||
                    (key === "01" && value !== placeholderData) ||
                    (key === "02" && value !== placeholderData)) {
                    // Add the key-value pair to the NewcanFrames map
                    NewcanFrames.set(key, value);
                }
            }
        });

        if (existingRecord) {

            // Get the existing keys from the CanFrames of the existing record
            if (connect == true) {
                const existingKeys = new Set(existingRecord.CanFrames.keys());
                // Convert the keys of the NewcanFrames map to an array
                const newKeys = Array.from(NewcanFrames.keys());
                // Check if any of the new keys match the existing keys
                const hasMatchingKey = newKeys.some(key => existingKeys.has(key));

                // If there is at least one matching key
                if (hasMatchingKey) {
                    // Loop through the NewcanFrames map
                    NewcanFrames.forEach((value, key) => {
                        // Update the CanFrames of the existing record only if the key does not exist
                        if (!existingRecord.CanFrames.get(key)) {
                            existingRecord.CanFrames.set(key, value);
                        }
                    });
                } else if (!hasMatchingKey) {
                    // If no keys match, replace existing CanFrames with NewcanFrames
                    existingRecord.CanFrames = new Map(NewcanFrames);
                }
                // Check if the existing record has a BSN and if its length is 16
                if (existingRecord.BSN && existingRecord.BSN.length === 16) {
                    return existingRecord.BSN;
                }
            } else if (connect == false) {

                const last10Records = await getModelForDevice(device).find({})
                    .sort({ createdAt: -1 })
                    .limit(10);

                if (last10Records.every(record => !record.connect)) {
                    await DeviceModel.deleteOne({ DeviceID: device });
                    return "empempemp";
                }
                if (existingRecord.BSN && existingRecord.BSN.length === 16) {
                    return existingRecord.BSN;
                }
            }

            // Update the BSN of the existing record using the CanFrames
            existingRecord.BSN = processBSN(existingRecord.CanFrames);

            // Save the updated record to the database
            await existingRecord.save();

            // Check if the updated BSN length is 16, otherwise return "empempemp"
            return existingRecord.BSN.length === 16 ? existingRecord.BSN : "empempemp";
        }
        if (!existingRecord) {
            // If no existing record is found, save the new CAN frames as a new document
            await saveToModel(NewcanFrames, device, bms);
        }

        // Generate a new BSN from the NewcanFrames
        const NewBSN = processBSN(NewcanFrames);

        // If the generated BSN has a length of 16, return it

        if (NewBSN.length == 16) {
            return NewBSN;
        } else {
            // Otherwise, return a placeholder string
            return "empempemp";
        }
    }
}

function processBSN(canFrames) {
    const processedParts = ["00", "01", "02"].map(key => {
        const data = canFrames.get(key);
        return data ? hex2ascii(data) : "emp";
    });
    return processedParts.join('');
}

async function saveToModel(canFrame, Device, Bms) {
    const newData = new DeviceModel({
        DeviceID: Device,
        CanFrames: canFrame,
        bmsMake: Bms
    });

    try {
        await newData.save();
        //console.log("Data saved:", canFrame, "Device:", Device);
    } catch (error) {
        //console.error('Error saving the model:', error);

        throw error; // Re-throw or handle as necessary
    }
}

export async function checkAndNotifyCellImbalance(packSerialNumber, Device, Model) {
    // Fetch the latest BatteryData entry for the specific battery
    const latestBatteryDataEntry = await Model.findOne({ packSerialNumber: packSerialNumber })
        .sort({ createdAt: -1 }); // Sort by creation time, descending

    // Ensure that an entry exists
    if (latestBatteryDataEntry) {
        const cellImbalance = latestBatteryDataEntry.cellImbalance; // Assuming you have a cellImbalance field
        ////console.log('Cell Imbalance: ' + cellImbalance);
        // Check if cell imbalance exceeds the threshold of 0.2
        if (cellImbalance > 0.3) {
            // Cell imbalance is significant; create a notification
            const notification = new Notification({
                deviceId: Device,
                batteryDataId: latestBatteryDataEntry._id,
                packSerialNumber: latestBatteryDataEntry.packSerialNumber, // Ensure your Notification schema includes this field if you use it
                messageType: 'cellimbalance',
                message: `Cell Imbalance detected as ${cellImbalance}`,
                severity: 'Medium', // Adjust severity as per your need
                observedTime: latestBatteryDataEntry.createdAt // Ensure your Notification schema includes this field if you use it
            });

            await notification.save(); // Save the notification to the database
            ////console.log('Notification created for Cell Imbalance.');
        } else {
            ////console.log('No significant cell imbalance detected.');
        }
    } else {
        ////console.log('No data entries found for the given packSerialNumber. Cell Imb');
    }
}


export async function checkAndNotifyFullCapacity(packSerialNumber, Device, Model) {
    // Fetch the latest two BatteryData entries for the specific battery
    const latestEntry = await Model.findOne({ packSerialNumber: packSerialNumber })
        .sort({ createdAt: -1 }) // Sort by creation time, descending
        .limit(1); // Limit to the two most recent entries

    // Ensure that we have two entries to compare
    if (latestEntry) {
        // Calculate the difference in SOC values
        const fullCapacity = latestEntry.SOC;
        ////console.log('full Capacity ' + fullCapacity);

        if (fullCapacity > 99.0) {
            // The SOC jump is significant; create a notification
            const notification = new Notification({
                deviceId: Device,
                batteryDataId: latestEntry._id,
                packSerialNumber: latestEntry.packSerialNumber,
                messageType: 'soc',
                message: `Full Capacity is exceeded to ${fullCapacity}`,
                severity: 'Medium',
                observedTime: latestEntry.createdAt
            });
            await notification.save(); // Save the notification to the database
            ////console.log('Notification created for Battery Capacity Reached.');
        } else {
            ////console.log('Battery Capacity is in range');
        }
    } else {
        ////console.log('Not enough data entries for comparison.');
    }

}