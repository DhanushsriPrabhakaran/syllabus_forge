import mongoose, { Schema } from 'mongoose';
const ProgrammeSchema = new Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, minlength: 2, maxlength: 2 },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
}, { timestamps: true });
export const Programme = mongoose.model('Programme', ProgrammeSchema);
