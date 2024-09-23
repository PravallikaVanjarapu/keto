import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
    ident: { type: String },
    deviceID: { type: Number },
    model: { type: String }
}, { timestamps: true });

const Device = mongoose.model('Device', DeviceSchema);

export default Device;