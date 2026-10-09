import mongoose, { Schema } from 'mongoose';

// Master data schemas for institutional configuration

// 1. Programme Codes
export const ProgrammeCodeModel = mongoose.model('MasterProgrammeCode', new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
}, { timestamps: true }));

// 2. Category Codes
export const CategoryCodeModel = mongoose.model('MasterCategoryCode', new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  defaultAbbr: { type: String, required: true },
  allowedTypes: [{ type: String }],
}, { timestamps: true }));

// 3. TPS Verbs
export const TpsVerbModel = mongoose.model('MasterTpsVerb', new Schema({
  tpsLevel: { type: Number, required: true },
  verbs: [{ type: String }],
}, { timestamps: true }));

// 4. Lab Objectives
export const LabObjectiveModel = mongoose.model('MasterLabObjective', new Schema({
  no: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  domain: { type: String, enum: ['Cognitive', 'Psychomotor', 'Affective'], required: true },
}, { timestamps: true }));

// 5. General CO Pool
export const GeneralCoPoolModel = mongoose.model('MasterGeneralCoPool', new Schema({
  code: { type: String, required: true, unique: true },
  statement: { type: String, required: true },
  tpsLevel: { type: Number, required: true },
  pi: { type: String, required: true },
  objectiveNo: { type: Number, required: true },
  objectiveName: { type: String, required: true },
  domain: { type: String, enum: ['Cognitive', 'Psychomotor', 'Affective'], required: true },
  firstVerb: { type: String, required: true },
}, { timestamps: true }));

// 6. Performance Indicators
export const PerformanceIndicatorModel = mongoose.model('MasterPerformanceIndicator', new Schema({
  piNumber: { type: String, required: true, unique: true },
  descriptor: { type: String, required: true },
  tpsLevel: { type: Number, required: true },
  department: { type: String, default: 'General' },
}, { timestamps: true }));

// 7. SDG List
export const SdgListModel = mongoose.model('MasterSdgList', new Schema({
  no: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true }));

// 8. Domain to SDG Map
export const DomainToSdgMapModel = mongoose.model('MasterDomainToSdgMap', new Schema({
  domain: { type: String, required: true, unique: true },
  suggestedSdgs: [{ type: Number }],
  rationale: { type: String, required: true },
}, { timestamps: true }));

// 9. TCP Weightage Table
export const TcpWeightageTableModel = mongoose.model('MasterTcpWeightage', new Schema({
  ltp: { type: String, required: true },
  credits: { type: Number, required: true },
  teType: { type: String, enum: ['TCP-T', 'TCP-P'], required: true },
  caTheoryPercent: { type: Number, required: true },
  caPracticalPercent: { type: Number, required: true },
  eseTheoryPercent: { type: Number, required: true },
  esePracticalPercent: { type: Number, required: true },
}, { timestamps: true }));

// 10. Config Settings
export const ConfigSettingsModel = mongoose.model('MasterConfigSetting', new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  description: { type: String },
}, { timestamps: true }));
