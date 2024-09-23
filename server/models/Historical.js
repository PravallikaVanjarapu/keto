import mongoose from 'mongoose';

const historicalSchema = new mongoose.Schema({
    deviceId: { type: Number },
    Ident: { type: Number },
    batterySerialNumber: { type: String, index: true },
    date: { type: Date, default: new Date },
    isActive: { type: Boolean },
    bmsMake: { type: String },
    startTime: { type: Date },
    status: { type: String },
    endTime: { type: Date },
    duration: { type: Number },
    averageCurrent: { type: Number },
    totalChargeCycles: { type: Number },
    capacity: { type: Number },
    MaxSOC: { type: Number },
    MinSOC: { type: Number },
    SOCJump: [{ type: String }],
    CellImbalance: [{ type: String }],
    MaxCellVolt: { type: Number },
    MinCellVolt: { type: Number },
    MaxCellTemp: { type: Number },
    MinCellTemp: { type: Number },
    ThermalIssue: [{ type: String }],
    BatteryPackCurrent: [{ type: Number }],
    Charge: { type: Number },
    Discharge: { type: Number },
    iferrors: { type: [String], required: true },
    Condition: { type: String, enum: ['Weak', 'Strong', 'UnderCDC'] },
    canFrames: {
        type: Map,
        of: String
    },
    SOC: [{
        value: { type: String },
        timestamp: { type: String }
    }],
    isActive: { type: Boolean },
    connection: { type: Boolean }
}, { timestamps: true });

const EXM = mongoose.model('EXM', historicalSchema);
const TTK = mongoose.model('TTK', historicalSchema);
const NEU = mongoose.model('NEU', historicalSchema);
const WEC = mongoose.model('WEC', historicalSchema);
const OTHERS = mongoose.model('OTHERS', historicalSchema);
const EXIDE = mongoose.model('EXIDE', historicalSchema);
const LG9 = mongoose.model('LG9', historicalSchema);
const ENE = mongoose.model('ENE', historicalSchema);
const RED = mongoose.model('RED', historicalSchema);

export { ENE, EXIDE, EXM, LG9, NEU, OTHERS, RED, TTK, WEC };