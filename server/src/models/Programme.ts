import mongoose, { Schema, Document } from 'mongoose';

export interface IProgramme extends Document {
  code: string; // 2 letters e.g. 'CA'
  name: string; // e.g. 'Computer Applications'
  department: string;
  active: boolean;
}

const ProgrammeSchema = new Schema<IProgramme>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, minlength: 2, maxlength: 2 },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Programme = mongoose.model<IProgramme>('Programme', ProgrammeSchema);
