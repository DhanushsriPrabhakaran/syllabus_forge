import { Router, Response } from 'express';
import { Programme } from '../models/Programme.js';
import { Course } from '../models/Course.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { validateCourse } from '@syllabusforge/shared';
import { generateProgrammeBundleDocx } from '../services/docxGenerator.js';

const router = Router();

// GET /api/programmes
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const programmes = await Programme.find({ active: true }).sort({ code: 1 });
    res.json(programmes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/programmes/:code/readiness (ACM Readiness Report)
router.get('/:code/readiness', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const programme = await Programme.findOne({ code: code ? (code as string).toUpperCase() : '' });
    if (!programme) {
      res.status(404).json({ error: 'Programme not found.' });
      return;
    }

    const courses = await Course.find({ programmeCode: code ? (code as string).toUpperCase() : '' }).sort({ semester: 1, courseCode: 1 });
    const existingCodes = courses.map(c => c.courseCode);

    const auditResults = courses.map(course => {
      const report = validateCourse(course.toObject() as any, existingCodes.filter(c => c !== course.courseCode));
      return {
        id: course._id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        semester: course.semester,
        courseType: course.courseType,
        status: course.status,
        isValid: report.isValid,
        errorCount: report.errors.length,
        warningCount: report.warnings.length,
        errors: report.errors,
        warnings: report.warnings,
      };
    });

    const isProgrammeReady = auditResults.every(r => r.isValid && (r.status === 'APPROVED' || r.status === 'FINALIZED'));

    res.json({
      programmeCode: programme.code,
      programmeName: programme.name,
      totalCourses: courses.length,
      isProgrammeReady,
      courseAudits: auditResults,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/programmes/:code/bundle (Programme Bundler .docx)
router.post('/:code/bundle', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { regulationYear = 2026, minSemester = 1, maxSemester = 8, annexureNo = '01' } = req.body;

    const programme = await Programme.findOne({ code: code ? (code as string).toUpperCase() : '' });
    if (!programme) {
      res.status(404).json({ error: 'Programme not found.' });
      return;
    }

    const courses = await Course.find({
      programmeCode: code ? (code as string).toUpperCase() : '',
      semester: { $gte: Number(minSemester), $lte: Number(maxSemester) },
    }).sort({ semester: 1, courseCode: 1 });

    if (courses.length === 0) {
      res.status(400).json({ error: 'No courses found in the selected semester range.' });
      return;
    }

    const buffer = await generateProgrammeBundleDocx({
      programmeCode: programme.code,
      programmeName: programme.name,
      department: programme.department,
      regulationYear: Number(regulationYear),
      annexureNo: String(annexureNo),
      courses: courses.map(c => c.toObject() as any),
    });

    const filename = `Annexure ${annexureNo} - ${programme.code} ${programme.name}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: `Bundle generation failed: ${err.message}` });
  }
});

export default router;
