import mongoose from 'mongoose';

const batteryDataSchema9 = new mongoose.Schema({
    ident: { type: String },
    servertime: { type: String },
    deviceID: { type: Number, default: 5714764 },
    packSerialNumber: { type: String, index: true },
    packSerialNumber2: { type: String, index: true },
    bmsMake: { type: String },
    batteryCapacity: { type: String },
    date: { type: String },
    maxCellVoltage: { type: Number },
    minCellVoltage: { type: Number },
    cellImbalance: { type: Number },
    maxCellTemp: { type: Number },
    minCellTemp: { type: Number },
    thermalBehaviour: { type: Number },
    status: { type: String },
    BatteryPackcurrent: { type: Number, required: true },
    chargeCondition: { type: String, enum: ['INIT', 'STANDBY', 'Charger Detection', 'Discharge', 'Charging'] },
    dischargeCondition: { type: String },
    SOC: { type: Number },
    SOCJump: { type: String },
    cycleCount: { type: Number },
    isActive: { type: Boolean },
    iferror: { type: [String] },
    connect: { type: Boolean },
    heartbeatSignal: { type: Number }
}, { timestamps: true });

const BatteryData9 = mongoose.model('BatteryData9', batteryDataSchema9);

export default BatteryData9;
