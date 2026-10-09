import { Router } from 'express';
import { ProgrammeCodeModel, CategoryCodeModel, TpsVerbModel, LabObjectiveModel, GeneralCoPoolModel, PerformanceIndicatorModel, SdgListModel, DomainToSdgMapModel, TcpWeightageTableModel, ConfigSettingsModel, } from '../models/MasterData.js';
import { authenticate, requireRole } from '../middleware/auth.js';
const router = Router();
const MODEL_MAP = {
    programmes: ProgrammeCodeModel,
    categories: CategoryCodeModel,
    verbs: TpsVerbModel,
    objectives: LabObjectiveModel,
    generalCos: GeneralCoPoolModel,
    pis: PerformanceIndicatorModel,
    sdgs: SdgListModel,
    domainSdgMap: DomainToSdgMapModel,
    tcpWeightage: TcpWeightageTableModel,
    config: ConfigSettingsModel,
};
// GET /api/master/:collection
router.get('/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const model = MODEL_MAP[collection];
        if (!model) {
            res.status(404).json({ error: `Master collection "${collection}" not found.` });
            return;
        }
        const data = await model.find().sort({ createdAt: 1, no: 1, code: 1, piNumber: 1 });
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/master/:collection (Admin only)
router.post('/:collection', authenticate, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { collection } = req.params;
        const model = MODEL_MAP[collection];
        if (!model) {
            res.status(404).json({ error: `Master collection "${collection}" not found.` });
            return;
        }
        const item = new model(req.body);
        await item.save();
        res.status(201).json(item);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// PUT /api/master/:collection/:id (Admin only)
router.put('/:collection/:id', authenticate, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { collection, id } = req.params;
        const model = MODEL_MAP[collection];
        if (!model) {
            res.status(404).json({ error: `Master collection "${collection}" not found.` });
            return;
        }
        const updated = await model.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            res.status(404).json({ error: 'Item not found.' });
            return;
        }
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// DELETE /api/master/:collection/:id (Admin only)
router.delete('/:collection/:id', authenticate, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { collection, id } = req.params;
        const model = MODEL_MAP[collection];
        if (!model) {
            res.status(404).json({ error: `Master collection "${collection}" not found.` });
            return;
        }
        await model.findByIdAndDelete(id);
        res.json({ message: 'Deleted successfully.' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
export default router;
