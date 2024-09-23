import mongoose from 'mongoose';

const deviceModelSchema = new mongoose.Schema({
    DeviceID: { type: Number },
    BSN: { type: String },
    bmsMake: { type: String },
    CanFrames: {
        type: Map,
        of: String
    }
},
    {
    timestamps: true
    });

const DeviceModel = mongoose.model('DeviceModel', deviceModelSchema);

export default DeviceModel;