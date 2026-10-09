import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Course,
  CourseType,
  CourseOutcome,
  SyllabusModule,
  LearningResource,
  SdgActivity,
  LabExperiment,
  LabCoursePlanItem,
  CourseDesigner,
  validateCourse,
  computeCourseCode,
  computeCredits,
  suggestCoWeightages,
  countWords,
  PROGRAMME_CODES,
  CATEGORY_CODES,
  CATEGORY_ABBREVIATIONS,
  TPS_VERBS,
  LAB_OBJECTIVES,
  GENERAL_CO_POOL,
  PERFORMANCE_INDICATORS,
  SDG_LIST,
  DOMAIN_TO_SDG_MAP,
  TCP_WEIGHTAGE_TABLE,
  LAB_ACTIVITY_CHIPS,
  SCHWAB_HERRON_LEVELS,
  LAB_ASSESSMENT_SPLITS,
} from '@syllabusforge/shared';
import { LiveCompliancePanel } from '../components/LiveCompliancePanel';
import { DocumentPreview } from '../components/DocumentPreview';
import {
  CheckCircle,
  AlertCircle,
  Save,
  Send,
  Eye,
  Edit3,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Sparkles,
  Info,
  Check,
  RefreshCw,
  Copy,
  Upload,
  Image as ImageIcon, ChevronRight, ChevronLeft, Menu,
} from 'lucide-react';

export const CourseWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const courseTypeParam = (searchParams.get('type') as CourseType) || 'THEORY';

  // Refs
  const conceptMapInputRef = useRef<HTMLInputElement>(null);

  // State
  const [activeTab, setActiveTab] = useState<'wizard' | 'preview'>('wizard');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [existingCodes, setExistingCodes] = useState<string[]>([]);

  // Selected domain for SDG 3-step helper
  const [selectedDomain, setSelectedDomain] = useState<string>('');

  // Course Form State
  const [course, setCourse] = useState<Course>({
    courseType: courseTypeParam,
    regulationYear: 2026,
    regulationCode: '26',
    programmeCode: user?.programmeAccess[0] || 'CA',
    categoryLetter: 'C',
    uniqueLetter: 'A',
    version: 0,
    courseCode: `26${user?.programmeAccess[0] || 'CA'}CA0`,
    courseName: '',
    categoryAbbr: 'PCC',
    semester: 1,
    L: courseTypeParam === 'PRACTICAL' ? 0 : 3,
    T: courseTypeParam === 'PRACTICAL' ? 0 : 1,
    P: courseTypeParam === 'PRACTICAL' ? 3 : 0,
    credits: courseTypeParam === 'PRACTICAL' ? 1.5 : 4,
    teExamType: courseTypeParam === 'TCP' ? 'TCP-T' : undefined,
    preamble: '',
    isAdvanced: false,
    prerequisites: 'Nil',
    courseOutcomes: [],
    assessmentMatrix: [],
    modules: [],
    textBooks: [],
    referenceBooks: [],
    webResources: [],
    sdgActivities: [],
    experiments: [],
    coursePlan: [],
    designers: [
      {
        name: user?.name || '',
        designation: user?.designation || 'Assistant Professor',
        department: user?.department || 'Computer Applications',
        email: user?.email || '',
      },
    ],
    status: 'DRAFT',
    createdBy: user?.email || '',
    department: user?.department || 'Computer Applications',
    comments: [],
  });

  // Load existing course or catalog codes
  useEffect(() => {
    async function loadData() {
      try {
        const allCourses = await api.getCourses();
        setExistingCodes(allCourses.map(c => c.courseCode));

        if (id) {
          const fetched = await api.getCourse(id);
          setCourse(fetched);
          setLastSaved(new Date());
        }
      } catch (err) {
        console.error('Failed to load course:', err);
      }
    }
    loadData();
  }, [id]);

  // Compute live validation report
  const validationReport = validateCourse(
    course,
    existingCodes.filter(c => c !== course.courseCode)
  );

  // Debounced auto-save
  const saveTimeoutRef = useRef<any>(null);
  useEffect(() => {
    if (!course._id) return; // don't autosave uncreated drafts

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        const updated = await api.updateCourse(course._id!, course);
        setLastSaved(new Date());
        setIsSaving(false);
      } catch (e) {
        setIsSaving(false);
      }
    }, 2500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [course]);

  // Handle Initial Draft Creation
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      if (course._id) {
        const updated = await api.updateCourse(course._id, course);
        setCourse(updated);
      } else {
        const created = await api.createCourse(course);
        setCourse(created);
        navigate(`/courses/${created._id}`, { replace: true });
      }
      setLastSaved(new Date());
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Submit for Review
  const handleSubmitForReview = async () => {
    if (!course._id) {
      await handleSaveDraft();
    }
    if (!course._id) return;

    try {
      const res = await api.submitCourse(course._id);
      setCourse(res.course);
      setSubmitSuccess('Syllabus submitted successfully to Department Review Queue!');
    } catch (err: any) {
      alert(`Submission blocked: ${err.message}`);
    }
  };

  // Clone Revision
  const handleRevise = async () => {
    if (!course._id) return;
    try {
      const res = await api.reviseCourse(course._id);
      navigate(`/courses/${res.course._id}`);
    } catch (err: any) {
      alert(`Revision error: ${err.message}`);
    }
  };

  // Update field helpers
  const updateField = (field: keyof Course, value: any) => {
    setCourse(prev => {
      const updated = { ...prev, [field]: value };

      // Recalculate courseCode
      if (['regulationCode', 'programmeCode', 'categoryLetter', 'uniqueLetter', 'version'].includes(field)) {
        updated.courseCode = computeCourseCode({
          regulationCode: updated.regulationCode,
          programmeCode: updated.programmeCode,
          categoryLetter: updated.categoryLetter,
          uniqueLetter: updated.uniqueLetter,
          version: updated.version,
        });
      }

      // Auto-suggest category abbreviation when category letter changes
      if (field === 'categoryLetter') {
        const cat = CATEGORY_CODES.find(c => c.code === value);
        if (cat) {
          updated.categoryAbbr = cat.defaultAbbr as any;
        }
      }

      // Recalculate credits
      if (['L', 'T', 'P'].includes(field)) {
        updated.credits = computeCredits(Number(updated.L) || 0, Number(updated.T) || 0, Number(updated.P) || 0, updated.courseType);
      }

      return updated;
    });
  };

  // Stepper definition
  const steps = [
    { id: 'identity', title: '1. Course Code & Identity', desc: 'Code RR AA C U V & Title' },
    { id: 'structure', title: '2. Structure & L-T-P', desc: 'Hours, credits, semester' },
    { id: 'preamble', title: '3. Preamble & Context', desc: 'Course context & relevance' },
    { id: 'cos', title: '4. Course Outcomes', desc: 'TPS taxonomy & weightages' },
    { id: 'assessment', title: '5. Assessment Pattern', desc: 'Continuous & Terminal exam' },
    {
      id: 'syllabus',
      title: course.courseType === 'PRACTICAL' ? '6. Laboratory Experiments' : '6. Syllabus & Content',
      desc: course.courseType === 'PRACTICAL' ? 'Experiments & Annexure 1' : 'Modules & Schedule',
    },
    { id: 'resources', title: '7. Learning Resources', desc: 'Text & reference books' },
    { id: 'sdg', title: '8. SDG Alignment', desc: 'UN SDGs & academic activities' },
    { id: 'designers', title: '9. Designers & Prerequisites', desc: 'Faculty details & prior courses' },
    { id: 'review', title: '10. Review & Submit', desc: '17-point compliance audit' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 sticky top-16 z-30 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                {course.courseCode}
              </span>
              <span className="font-bold text-slate-900 text-base">
                {course.courseName || 'Untitled Course'}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold ${
                  course.status === 'APPROVED' || course.status === 'FINALIZED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : course.status === 'SUBMITTED'
                    ? 'bg-sky-100 text-sky-800'
                    : course.status === 'RETURNED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {course.status}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {course.courseType} • {course.categoryAbbr} • Credits: {course.credits} • Reg {course.regulationYear}
            </div>
          </div>
        </div>

        {/* Tab & Action Bar */}
        <div className="flex items-center space-x-3">
          {/* Autosave Status */}
          <div className="text-xs text-slate-500 hidden sm:flex items-center space-x-1.5">
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                <span>Saving draft...</span>
              </>
            ) : lastSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            ) : null}
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('wizard')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                activeTab === 'wizard' ? 'bg-[#7B1113] text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Form Wizard</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                activeTab === 'preview' ? 'bg-[#7B1113] text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Document Preview</span>
            </button>
          </div>

          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-lg border border-[#C59B27]/40 bg-white hover:bg-[#FAF7F2] text-[#7B1113] text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Save Draft</span>
          </button>

          {(course.status === 'APPROVED' || course.status === 'FINALIZED') && (
            <button
              onClick={handleRevise}
              className="px-3 py-1.5 rounded-lg bg-[#0F2942] hover:bg-[#091A2A] text-[#E2BF53] text-xs font-semibold shadow-xs flex items-center space-x-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Clone Revision (v{course.version + 1})</span>
            </button>
          )}
        </div>
      </div>

      {submitSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-sm text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{submitSuccess}</span>
          </div>
          <button onClick={() => setSubmitSuccess(null)} className="text-xs font-bold text-emerald-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex gap-6">
        {activeTab === 'preview' ? (
          <div className="flex-1">
            <DocumentPreview course={course} />
          </div>
        ) : (
          <>
            {/* Left Stepper List (Collapsible Slider) */}
            <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-72 bg-white shadow-2xl border-r border-slate-200 flex flex-col`}>
              <div className="p-4 border-b border-[#C59B27]/40 bg-[#7B1113] text-white flex items-center justify-between sticky top-0 z-10">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#E2BF53] block font-tce">
                    TCE SYLLABUS SECTIONS
                  </span>
                  <span className="text-[10px] text-white/80">Regulation 2026 Navigation</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {steps.map((st, idx) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setCurrentStep(idx);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-3 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      currentStep === idx
                        ? 'bg-[#FAF2F3] text-[#7B1113] font-bold border-l-4 border-[#7B1113] shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <div>{st.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-1">{st.desc}</div>
                    </div>
                    {/* Status indicator */}
                    <div className="ml-2 flex-shrink-0">
                      {idx < currentStep ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Floating button to open slider when closed */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-[#7B1113] hover:bg-[#560B0D] text-white p-2.5 rounded-r-xl shadow-lg border-y border-r border-[#C59B27] transition-colors"
                title="Open Syllabus Sections"
              >
                <Menu className="w-5 h-5 text-[#E2BF53]" />
              </button>
            )}

            {/* Center Wizard Form Container */}
            <div className="flex-1 bg-white border border-slate-200 border-t-4 border-t-[#7B1113] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between ml-12 lg:ml-0">
              <div>
                {/* Step 1: Course Identity */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">1. Course Code & Identity</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Compose the standardized 5-component course code <strong>RR AA C U V</strong> and enter the formal title.
                      </p>
                    </div>

                    {/* Course Code Breakdown Card */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-700">Course Code Composition</span>
                        <span className="font-mono text-base font-bold text-sky-700 bg-sky-100 px-3 py-1 rounded-lg border border-sky-200">
                          {course.courseCode}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="block text-slate-400 font-semibold">RR</span>
                          <span className="font-bold text-slate-800">{course.regulationCode}</span>
                          <span className="text-[10px] text-slate-500 block">Reg. 26</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="block text-slate-400 font-semibold">AA</span>
                          <span className="font-bold text-slate-800">{course.programmeCode}</span>
                          <span className="text-[10px] text-slate-500 block">Programme</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="block text-slate-400 font-semibold">C</span>
                          <span className="font-bold text-slate-800">{course.categoryLetter}</span>
                          <span className="text-[10px] text-slate-500 block">Category</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="block text-slate-400 font-semibold">U</span>
                          <span className="font-bold text-slate-800">{course.uniqueLetter}</span>
                          <span className="text-[10px] text-slate-500 block">Unique (A-Z)</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="block text-slate-400 font-semibold">V</span>
                          <span className="font-bold text-slate-800">{course.version}</span>
                          <span className="text-[10px] text-slate-500 block">Version</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Programme Dropdown */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Programme (AA) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={course.programmeCode}
                          onChange={e => updateField('programmeCode', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
                        >
                          {PROGRAMME_CODES.map(p => (
                            <option key={p.code} value={p.code}>
                              {p.code} — {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Category Letter Dropdown */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Category Code (C) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={course.categoryLetter}
                          onChange={e => updateField('categoryLetter', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
                        >
                          {CATEGORY_CODES.map(c => (
                            <option key={c.code} value={c.code}>
                              {c.code} — {c.name} ({c.defaultAbbr})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Unique Letter */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Unique Letter (U) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={1}
                          value={course.uniqueLetter}
                          onChange={e => updateField('uniqueLetter', e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-sky-500"
                          placeholder="A (excluding I, O)"
                        />
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          Single letter A-Z excluding letters "I" and "O".
                        </span>
                      </div>

                      {/* Version */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Version (V)
                        </label>
                        <input
                          type="number"
                          value={course.version}
                          onChange={(e) => updateField('version', e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500"
                        />
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          Starts at 0 (digit zero). Incremented on course revision.
                        </span>
                      </div>
                    </div>

                    {/* Course Title Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Course Title <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {(course.courseName || '').length}/60 characters
                        </span>
                      </div>
                      <input
                        type="text"
                        value={course.courseName}
                        onChange={e => updateField('courseName', e.target.value)}
                        placeholder={
                          course.courseType === 'PRACTICAL'
                            ? 'AC Machines Laboratory'
                            : 'Data Structures and Applications'
                        }
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 font-medium"
                      />
                      <div className="mt-1 text-[11px] text-slate-500 space-y-0.5">
                        <p>• Only letters, digits and spaces. No hyphens, ampersands, or slashes.</p>
                        <p>• Title Case. Rendered in CAPITAL and BOLD on official documents.</p>
                        <p>
                          • Use "Laboratory", never "Lab". Practical courses must end with "Laboratory".
                        </p>
                      </div>
                    </div>

                    {/* Category Abbreviation Confirmation */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Category Abbreviation (Credit Distribution Framework) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={course.categoryAbbr}
                        onChange={e => updateField('categoryAbbr', e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
                      >
                        {CATEGORY_ABBREVIATIONS.map(abbr => (
                          <option key={abbr} value={abbr}>
                            {abbr}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        HSMC, BSC, ESC, PCC, PEC, OEC, EEC, AC. Auto-suggested from category letter.
                      </span>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact Hours, LTP & Credits */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">2. Contact Hours & Credits</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Specify contact periods. Credits are computed automatically using <strong>Credits = L + T + P/2</strong>.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Lecture (L)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={course.L}
                          disabled={course.courseType === 'PRACTICAL'}
                          onChange={e => updateField('L', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tutorial (T)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={course.T}
                          disabled={course.courseType === 'PRACTICAL'}
                          onChange={e => updateField('T', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Practical (P)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={course.P}
                          onChange={e => updateField('P', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg text-center">
                        <label className="block text-xs font-bold text-sky-900 mb-1">
                          Credits (Computed)
                        </label>
                        <span className="text-xl font-extrabold text-sky-700">{course.credits}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Semester
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={course.semester}
                          onChange={e => updateField('semester', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      {/* TCP TE Exam Type */}
                      {course.courseType === 'TCP' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Terminal Examination Type (TE Type) <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={course.teExamType || 'TCP-T'}
                            onChange={e => updateField('teExamType', e.target.value as any)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="TCP-T">TCP-T (Theory Examination 50%)</option>
                            <option value="TCP-P">TCP-P (Practical Examination 50%)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Advanced / Elective Flag */}
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
                      <input
                        type="checkbox"
                        id="isAdvanced"
                        checked={course.isAdvanced || false}
                        onChange={e => updateField('isAdvanced', e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                      />
                      <label htmlFor="isAdvanced" className="text-xs text-slate-700 font-medium">
                        Classify as Advanced / Elective Course (triggers mandatory 5-year publication recency rule on textbooks)
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3: Preamble */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">3. Course Preamble</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Contextualizes domain, academic relevance, and industrial significance.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Preamble Statement <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {countWords(course.preamble || '')} words
                        </span>
                      </div>
                      <textarea
                        rows={6}
                        value={course.preamble}
                        onChange={e => updateField('preamble', e.target.value)}
                        placeholder="State what the course is about, connect to real-world applications and modern standards, and avoid generic clichés..."
                        className="w-full p-3.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 leading-relaxed"
                      />
                      <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                        <p>• Single coherent paragraph without line breaks.</p>
                        <p>• Avoid cliché phrases: "This course covers important topics" or "Students will learn about".</p>
                        <p>• Do not repeat the Course Outcomes list verbatim.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Course Outcomes */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">4. Course Outcomes (COs)</h2>
                        <p className="text-sm text-slate-500 mt-1">
                          {course.courseType === 'THEORY' && '6 to 8 COs. Minimum 70% at TPS >= 3. Total weightage = 100%.'}
                          {course.courseType === 'PRACTICAL' && 'Select from General CO Pool: Cognitive (2-4), Affective (2-3), Psychomotor (2-3).'}
                          {course.courseType === 'TCP' && 'Up to 8 COs. At least 2 addressing PO6 to PO11 competencies.'}
                        </p>
                      </div>

                      {/* Weightage Suggester */}
                      {(course.courseType === 'THEORY' || course.courseType === 'TCP') && (
                        <button
                          onClick={() => {
                            const suggested = suggestCoWeightages(course.courseOutcomes || []);
                            const updatedCos = (course.courseOutcomes || []).map((c, i) => ({
                              ...c,
                              weightage: suggested[i] || c.weightage,
                            }));
                            updateField('courseOutcomes', updatedCos);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold flex items-center space-x-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Suggest Weightages</span>
                        </button>
                      )}
                    </div>

                    {/* Practical General CO Pool Picker */}
                    {course.courseType === 'PRACTICAL' && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-xs font-bold text-slate-800 block mb-2">
                          Add from Institutional General CO Pool:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {GENERAL_CO_POOL.map(g => (
                            <button
                              key={g.code}
                              onClick={() => {
                                const newCo: CourseOutcome = {
                                  coNo: `CO${(course.courseOutcomes || []).length + 1}`,
                                  statement: g.statement,
                                  tpsLevel: g.tpsLevel,
                                  pi: g.pi,
                                  objectiveNo: g.objectiveNo,
                                  objectiveName: g.objectiveName,
                                  domain: g.domain,
                                  generalCoRef: g.code,
                                  sdgNo: 'NC',
                                  sdgLevel: 0,
                                };
                                updateField('courseOutcomes', [...(course.courseOutcomes || []), newCo]);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium border bg-white hover:bg-sky-50 border-slate-300 text-slate-700 hover:text-sky-700 transition-colors"
                            >
                              + {g.code} ({g.domain}, TPS {g.tpsLevel})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CO Table Rows */}
                    <div className="space-y-4">
                      {(course.courseOutcomes || []).map((co, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-800">
                              {co.coNo || `CO${idx + 1}`}
                            </span>
                            <div className="flex items-center space-x-2">
                              {/* Verb Helper Pill */}
                              <div className="text-xs text-slate-500">
                                Approved TPS {co.tpsLevel} Verbs: {TPS_VERBS[co.tpsLevel]?.slice(0, 4).join(', ')}
                              </div>
                              <button
                                onClick={() => {
                                  const updated = (course.courseOutcomes || []).filter((_, i) => i !== idx);
                                  // renumber
                                  const renumbered = updated.map((c, i) => ({ ...c, coNo: `CO${i + 1}` }));
                                  updateField('courseOutcomes', renumbered);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-8">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Outcome Statement (must start with TPS {co.tpsLevel} verb)
                              </label>
                              <textarea
                                rows={2}
                                value={co.statement}
                                onChange={e => {
                                  const updated = [...(course.courseOutcomes || [])];
                                  updated[idx] = { ...updated[idx], statement: e.target.value };
                                  updateField('courseOutcomes', updated);
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                TPS Level
                              </label>
                              <select
                                value={co.tpsLevel}
                                onChange={e => {
                                  const level = parseInt(e.target.value);
                                  const updated = [...(course.courseOutcomes || [])];
                                  updated[idx] = { ...updated[idx], tpsLevel: level };
                                  updateField('courseOutcomes', updated);
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                              >
                                <option value={1}>TPS 1 (Remember)</option>
<option value={2}>TPS 2 (Understand)</option>
<option value={3}>TPS 3 (Apply)</option>
<option value={4}>TPS 4 (Analyze)</option>
<option value={5}>TPS 5 (Evaluate)</option>
<option value={6}>TPS 6 (Create)</option>
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                PI (x.y.z)
                              </label>
                              <input
                                type="text"
                                list={`pi-suggestions-${idx}`}
                                value={co.pi || ''}
                                onChange={e => {
                                  const piVal = e.target.value;
                                  const updated = [...(course.courseOutcomes || [])];
                                  const matchedPi = PERFORMANCE_INDICATORS.find(p => p.piNumber === piVal.trim());
                                  updated[idx] = {
                                    ...updated[idx],
                                    pi: piVal,
                                    ...(matchedPi ? { tpsLevel: matchedPi.tpsLevel } : {}),
                                  };
                                  updateField('courseOutcomes', updated);
                                }}
                                placeholder="e.g. 1.2.1 or 1.2.1, 2.1.3"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-sky-500"
                              />
                              <datalist id={`pi-suggestions-${idx}`}>
                                {PERFORMANCE_INDICATORS.map(p => (
                                  <option key={p.piNumber} value={p.piNumber}>
                                    {p.piNumber} (TPS {p.tpsLevel})
                                  </option>
                                ))}
                              </datalist>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            {(course.courseType === 'THEORY' || course.courseType === 'TCP') && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  CO Weightage (%)
                                </label>
                                <input
                                  type="number"
                                  min={8}
                                  max={20}
                                  value={co.weightage || 0}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    const updated = [...(course.courseOutcomes || [])];
                                    updated[idx] = { ...updated[idx], weightage: val };
                                    updateField('courseOutcomes', updated);
                                  }}
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center font-bold"
                                />
                              </div>
                            )}

                            {course.courseType === 'PRACTICAL' && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Objective (1–13)
                                </label>
                                <select
                                  value={co.objectiveNo || 1}
                                  onChange={e => {
                                    const objNum = parseInt(e.target.value);
                                    const matched = LAB_OBJECTIVES.find(o => o.no === objNum);
                                    const updated = [...(course.courseOutcomes || [])];
                                    updated[idx] = {
                                      ...updated[idx],
                                      objectiveNo: objNum,
                                      objectiveName: matched?.name,
                                      domain: matched?.domain,
                                    };
                                    updateField('courseOutcomes', updated);
                                  }}
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                                >
                                  {LAB_OBJECTIVES.map(o => (
                                    <option key={o.no} value={o.no}>
                                      {o.no}. {o.name} ({o.domain})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                SDG Addressed
                              </label>
                              <select
                                value={co.sdgNo || 'NC'}
                                onChange={e => {
                                  const val = e.target.value === 'NC' ? 'NC' : parseInt(e.target.value);
                                  const updated = [...(course.courseOutcomes || [])];
                                  updated[idx] = { ...updated[idx], sdgNo: val, sdgLevel: val === 'NC' ? 0 : updated[idx].sdgLevel || 1 };
                                  updateField('courseOutcomes', updated);
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                              >
                                <option value="NC">NC (Not Covered)</option>
                                {SDG_LIST.map(s => (
                                  <option key={s.no} value={s.no}>
                                    SDG {s.no}: {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                SDG Level (0–5)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={5}
                                disabled={co.sdgNo === 'NC'}
                                value={co.sdgLevel || 0}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 0;
                                  const updated = [...(course.courseOutcomes || [])];
                                  updated[idx] = { ...updated[idx], sdgLevel: val };
                                  updateField('courseOutcomes', updated);
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add CO Button */}
                      <button
                        onClick={() => {
                          const n = (course.courseOutcomes || []).length + 1;
                          const newCo: CourseOutcome = {
                            coNo: `CO${n}`,
                            statement: 'Apply fundamental engineering principles to solve practical domain problems.',
                            tpsLevel: 3,
                            pi: '1.1.1',
                            weightage: 15,
                            sdgNo: 'NC',
                            sdgLevel: 0,
                          };
                          updateField('courseOutcomes', [...(course.courseOutcomes || []), newCo]);
                        }}
                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-500 text-slate-600 hover:text-sky-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Course Outcome</span>
                      </button>

                      {/* Mapping with Programme Outcomes and Programme Specific Outcomes */}
                      <div className="pt-6 border-t border-slate-200 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              Mapping with Programme Outcomes and Programme Specific Outcomes
                            </h3>
                            <p className="text-xs text-slate-500">
                              Map each Course Outcome against PO1–PO12 and PSO1–PSO3 with S (Strong), M (Medium), L (Low), or leave blank.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const cos = course.courseOutcomes || [];
                              const updated = cos.map(co => {
                                const tps = co.tpsLevel || 2;
                                return {
                                  coNo: co.coNo,
                                  po1: tps >= 3 ? 'S' : 'M',
                                  po2: tps >= 4 ? 'S' : (tps === 3 ? 'S' : 'M'),
                                  po3: tps >= 3 ? 'M' : 'L',
                                  po4: tps >= 4 ? 'M' : '',
                                  po5: tps >= 3 ? 'M' : '',
                                  po6: '',
                                  po7: '',
                                  po8: co.sdgNo && co.sdgNo !== 'NC' ? 'L' : '',
                                  po9: '',
                                  po10: '',
                                  po11: '',
                                  po12: 'L',
                                  pso1: tps >= 3 ? 'S' : 'M',
                                  pso2: tps >= 4 ? 'M' : '',
                                  pso3: '',
                                };
                              });
                              updateField('poPsoMapping', updated);
                            }}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold shadow-xs transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Auto-fill Recommended PO/PSO Mappings</span>
                          </button>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-xs text-center border-collapse">
                            <thead className="bg-slate-100 text-slate-700 font-bold">
                              <tr>
                                <th className="p-2 border-b w-14 bg-slate-200 text-slate-800">CO</th>
                                {['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12'].map(po => (
                                  <th key={po} className="p-2 border-b min-w-[38px]">{po}</th>
                                ))}
                                {['PSO1', 'PSO2', 'PSO3'].map(pso => (
                                  <th key={pso} className="p-2 border-b min-w-[42px] bg-sky-50 text-sky-800">{pso}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(course.courseOutcomes || []).map(co => {
                                const existingRow = (course.poPsoMapping || []).find(r => r.coNo === co.coNo) || { coNo: co.coNo };
                                const cols = [
                                  'po1', 'po2', 'po3', 'po4', 'po5', 'po6', 'po7', 'po8', 'po9', 'po10', 'po11', 'po12',
                                  'pso1', 'pso2', 'pso3'
                                ];
                                return (
                                  <tr key={co.coNo} className="border-b border-slate-100 hover:bg-slate-50/50">
                                    <td className="p-2 font-bold bg-slate-50 text-slate-800">{co.coNo}</td>
                                    {cols.map(cKey => {
                                      const val = (existingRow as any)[cKey] || '';
                                      return (
                                        <td key={cKey} className="p-1">
                                          <select
                                            value={val}
                                            onChange={e => {
                                              const newVal = e.target.value;
                                              const list = [...(course.poPsoMapping || [])];
                                              const rIdx = list.findIndex(r => r.coNo === co.coNo);
                                              if (rIdx >= 0) {
                                                list[rIdx] = { ...list[rIdx], [cKey]: newVal };
                                              } else {
                                                list.push({ coNo: co.coNo, [cKey]: newVal });
                                              }
                                              updateField('poPsoMapping', list);
                                            }}
                                            className={`w-full p-1 text-center font-bold text-xs rounded border ${
                                              val === 'S'
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                : val === 'M'
                                                ? 'bg-sky-100 text-sky-800 border-sky-300'
                                                : val === 'L'
                                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                                : 'bg-white text-slate-400 border-slate-200'
                                            }`}
                                          >
                                            <option value="">-</option>
                                            <option value="S">S</option>
                                            <option value="M">M</option>
                                            <option value="L">L</option>
                                          </select>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span>Legend:</span>
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">S = Strong</span>
                          <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">M = Medium</span>
                          <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">L = Low</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Assessment Pattern */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">5. Assessment Pattern</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Configure mark distribution across continuous assessment and terminal examination. Each component column must total 100%.
                      </p>
                    </div>

                    {/* Theory: Assessment Pattern Cognitive Domain & Questions */}
                    {course.courseType === 'THEORY' && (
                      <div className="space-y-6">
                        {/* Cognitive Domain Table */}
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-slate-900">
                                Assessment Pattern: Cognitive Domain
                              </h3>
                              <p className="text-xs text-slate-500">
                                Bloom's Cognitive Levels mark percentage distribution across Continuous Assessment Tests (1, 2, 3) and Terminal Examination. Each column must sum to 100%.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                updateField('cognitiveAssessmentPattern', [
                                  { level: 'Remember', cat1: 10, cat2: 10, cat3: 10, terminalExam: 10 },
                                  { level: 'Understand', cat1: 30, cat2: 30, cat3: 10, terminalExam: 10 },
                                  { level: 'Apply', cat1: 60, cat2: 60, cat3: 80, terminalExam: 80 },
                                  { level: 'Analyze', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
                                  { level: 'Evaluate', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
                                  { level: 'Create', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
                                ]);
                              }}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold shadow-xs transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Apply Model MCA Cognitive Distribution</span>
                            </button>
                          </div>

                          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead className="bg-slate-100 text-slate-700 font-bold">
                                <tr>
                                  <th className="p-2.5 border-b w-40 bg-slate-200 text-slate-800">Cognitive Levels</th>
                                  <th className="p-2.5 border-b text-center">CAT 1 (%)</th>
                                  <th className="p-2.5 border-b text-center">CAT 2 (%)</th>
                                  <th className="p-2.5 border-b text-center">CAT 3 (%)</th>
                                  <th className="p-2.5 border-b text-center bg-sky-50 text-sky-900">Terminal Exam (%)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {([
                                  'Remember',
                                  'Understand',
                                  'Apply',
                                  'Analyze',
                                  'Evaluate',
                                  'Create',
                                ] as const).map(lvl => {
                                  const currentPattern = course.cognitiveAssessmentPattern || [
                                    { level: 'Remember', cat1: 10, cat2: 10, cat3: 10, terminalExam: 10 },
                                    { level: 'Understand', cat1: 30, cat2: 30, cat3: 10, terminalExam: 10 },
                                    { level: 'Apply', cat1: 60, cat2: 60, cat3: 80, terminalExam: 80 },
                                    { level: 'Analyze', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
                                    { level: 'Evaluate', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
                                    { level: 'Create', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
                                  ];
                                  const rowData = currentPattern.find(r => r.level === lvl) || {
                                    level: lvl,
                                    cat1: 0,
                                    cat2: 0,
                                    cat3: 0,
                                    terminalExam: 0,
                                  };

                                  const updateRow = (col: 'cat1' | 'cat2' | 'cat3' | 'terminalExam', val: number) => {
                                    const next = currentPattern.map(r =>
                                      r.level === lvl ? { ...r, [col]: val } : r
                                    );
                                    if (!next.some(r => r.level === lvl)) {
                                      next.push({ ...rowData, [col]: val });
                                    }
                                    updateField('cognitiveAssessmentPattern', next);
                                  };

                                  return (
                                    <tr key={lvl} className="border-b border-slate-100 hover:bg-slate-50/50">
                                      <td className="p-2.5 font-bold text-slate-800 bg-slate-50/60">{lvl}</td>
                                      <td className="p-2 text-center">
                                        <input
                                          type="number"
                                          min={0}
                                          max={100}
                                          value={rowData.cat1}
                                          onChange={e => updateRow('cat1', parseInt(e.target.value) || 0)}
                                          className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs font-semibold"
                                        />
                                      </td>
                                      <td className="p-2 text-center">
                                        <input
                                          type="number"
                                          min={0}
                                          max={100}
                                          value={rowData.cat2}
                                          onChange={e => updateRow('cat2', parseInt(e.target.value) || 0)}
                                          className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs font-semibold"
                                        />
                                      </td>
                                      <td className="p-2 text-center">
                                        <input
                                          type="number"
                                          min={0}
                                          max={100}
                                          value={rowData.cat3}
                                          onChange={e => updateRow('cat3', parseInt(e.target.value) || 0)}
                                          className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs font-semibold"
                                        />
                                      </td>
                                      <td className="p-2 text-center bg-sky-50/30">
                                        <input
                                          type="number"
                                          min={0}
                                          max={100}
                                          value={rowData.terminalExam}
                                          onChange={e => updateRow('terminalExam', parseInt(e.target.value) || 0)}
                                          className="w-16 p-1.5 border border-sky-300 bg-white rounded text-center text-xs font-bold text-sky-900"
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <tr>
                                  <td className="p-2.5 font-extrabold text-slate-900">Total Marks (%):</td>
                                  {(['cat1', 'cat2', 'cat3', 'terminalExam'] as const).map(col => {
                                    const pattern = course.cognitiveAssessmentPattern || [];
                                    const sum = pattern.reduce((acc, r) => acc + (Number((r as any)[col]) || 0), 0);
                                    const isOk = sum === 100;
                                    return (
                                      <td
                                        key={col}
                                        className={`p-2.5 text-center text-xs font-extrabold ${
                                          isOk ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                                        }`}
                                      >
                                        <div className="flex items-center justify-center space-x-1">
                                          <span>{sum}%</span>
                                          {isOk ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                          ) : (
                                            <span className="text-[10px] text-rose-500 font-normal">(!=100)</span>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {/* Course Level Assessment Questions Editor */}
                        <div className="pt-6 border-t border-slate-200 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-slate-900">
                                Course Level Assessment Questions
                              </h3>
                              <p className="text-xs text-slate-500">
                                Sample evaluative questions aligned per Course Outcome for CAT tests, quizzes, assignments, and terminal exams.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                updateField('courseAssessmentQuestions', [
                                  {
                                    coNo: 'CO1',
                                    questions: [
                                      'Suppose a circular queue of capacity (n - 1) elements is implemented with an array of n elements. Assume that insertion and deletion operations are carried out using REAR and FRONT as array index variables, respectively. Initially, REAR=FRONT=0. Give the conditions to detect queue full and queue empty?',
                                      'Given a 5 element stack S (from top to bottom: 2, 4, 6, 8, 10), and an empty queue Q, remove elements one-by-one from S and insert them into Q, then remove them one-by-one from Q and re-insert them into S. List elements in S.',
                                      'Given an array and a singly linked list. Which of these data structures uses more memory space to store the same number of elements? Justify your answer.'
                                    ]
                                  },
                                  {
                                    coNo: 'CO2',
                                    questions: [
                                      'Perform the AVL algorithm for non-AVL trees. In each case, count the number of updated links required by the AVL rotation. Given an expression tree, write an algorithm to evaluate the expression tree.',
                                      'Construct a binary tree given Inorder: D, B, H, E, A, I, F, J, C, G and Preorder: A, B, D, E, H, C, F, I, J, G.',
                                      'Given a red-black tree with n elements, how fast can you sort them using the tree? Demonstrate step by step.'
                                    ]
                                  },
                                  {
                                    coNo: 'CO3',
                                    questions: [
                                      'Given a B-Tree with H=5, M=10 and L=10, what is the maximum and minimum number of values that can be contained in the leaves of the B-Tree?',
                                      'Given a red-black tree and a key, check whether the given key exists or not without recursion.',
                                      'Create a Trie tree for the set of words S={ab, ba, ca, caa, caaa, baaa} over alphabet Sigma={a,b,c}.'
                                    ]
                                  },
                                  {
                                    coNo: 'CO4',
                                    questions: [
                                      'Given a Boolean 2D matrix, find the number of islands using disjoint set data structures.',
                                      'Write pseudocode for make-set, find-set, and union operations using singly linked lists and weighted union rule.'
                                    ]
                                  },
                                  {
                                    coNo: 'CO5',
                                    questions: [
                                      'For a binary heap stored in an array, what about a d-heap? In what positions are children and parent of node i stored?',
                                      'Show the result of inserting keys 1 to 15 in order into an initially empty leftist heap using leftist heap merge algorithm.'
                                    ]
                                  },
                                  {
                                    coNo: 'CO6',
                                    questions: [
                                      'Given input {4371, 1323, 6173, 4199, 4344, 9679, 1989} and hash function h(x) = x mod 10, show the resulting hash table using: (a) Separate chaining, (b) Linear probing, (c) Quadratic probing.',
                                      'Explain carefully why search cannot stop when a tombstone is encountered in open addressing hash tables.'
                                    ]
                                  }
                                ]);
                              }}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold shadow-xs transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Auto-fill MCA Sample Questions</span>
                            </button>
                          </div>

                          <div className="space-y-4">
                            {(course.courseOutcomes || []).map(co => {
                              const qGroup = (course.courseAssessmentQuestions || []).find(g => g.coNo === co.coNo) || {
                                coNo: co.coNo,
                                questions: []
                              };
                              return (
                                <div key={co.coNo} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-slate-800">
                                      Course Outcome {co.coNo} ({co.statement.slice(0, 70)}...)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const list = [...(course.courseAssessmentQuestions || [])];
                                        const gIdx = list.findIndex(g => g.coNo === co.coNo);
                                        if (gIdx >= 0) {
                                          list[gIdx] = {
                                            ...list[gIdx],
                                            questions: [...(list[gIdx].questions || []), 'New assessment question...']
                                          };
                                        } else {
                                          list.push({ coNo: co.coNo, questions: ['New assessment question...'] });
                                        }
                                        updateField('courseAssessmentQuestions', list);
                                      }}
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:border-sky-500 text-slate-700 hover:text-sky-700 text-xs font-semibold"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add Question</span>
                                    </button>
                                  </div>

                                  {(qGroup.questions || []).map((q, qIdx) => (
                                    <div key={qIdx} className="flex items-start space-x-2">
                                      <span className="font-bold text-xs text-slate-500 mt-2">{qIdx + 1}.</span>
                                      <textarea
                                        rows={2}
                                        value={q}
                                        onChange={e => {
                                          const list = [...(course.courseAssessmentQuestions || [])];
                                          const gIdx = list.findIndex(g => g.coNo === co.coNo);
                                          if (gIdx >= 0) {
                                            const updatedQ = [...(list[gIdx].questions || [])];
                                            updatedQ[qIdx] = e.target.value;
                                            list[gIdx] = { ...list[gIdx], questions: updatedQ };
                                            updateField('courseAssessmentQuestions', list);
                                          }
                                        }}
                                        className="flex-1 p-2 border border-slate-300 rounded-lg text-xs leading-relaxed"
                                        placeholder="Enter question text..."
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const list = [...(course.courseAssessmentQuestions || [])];
                                          const gIdx = list.findIndex(g => g.coNo === co.coNo);
                                          if (gIdx >= 0) {
                                            const updatedQ = (list[gIdx].questions || []).filter((_, i) => i !== qIdx);
                                            list[gIdx] = { ...list[gIdx], questions: updatedQ };
                                            updateField('courseAssessmentQuestions', list);
                                          }
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}

                                  {(qGroup.questions || []).length === 0 && (
                                    <p className="text-xs text-slate-400 italic">No questions added yet for {co.coNo}.</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Practical Component Table (Fixed by guideline) */}
                    {course.courseType === 'PRACTICAL' && (
                      <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                        <span className="font-bold text-xs text-emerald-900 block">
                          Standard Laboratory Assessment Framework (200 Marks Total):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                          <div className="p-3 bg-white rounded-lg border border-emerald-200">
                            <span className="text-slate-500 block">Continuous Assessment</span>
                            <span className="text-lg font-extrabold text-emerald-700">75 Marks</span>
                            <span className="text-[10px] text-slate-400 block">Pre/In/Post lab</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-emerald-200">
                            <span className="text-slate-500 block">Model Test</span>
                            <span className="text-lg font-extrabold text-emerald-700">25 Marks</span>
                            <span className="text-[10px] text-slate-400 block">Rubrics 3 domains</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-emerald-200">
                            <span className="text-slate-500 block">Total Internal</span>
                            <span className="text-lg font-extrabold text-emerald-700">100 Marks</span>
                            <span className="text-[10px] text-slate-400 block">Continuous + Model</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-emerald-200">
                            <span className="text-slate-500 block">End Semester Exam</span>
                            <span className="text-lg font-extrabold text-emerald-700">100 Marks</span>
                            <span className="text-[10px] text-slate-400 block">Rubrics 3 domains</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TCP Dual Matrix */}
                    {course.courseType === 'TCP' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                          <thead className="bg-slate-100 text-slate-700 font-bold">
                            <tr>
                              <th className="p-2.5 border-b">CO</th>
                              <th className="p-2.5 border-b text-center">Theory CAT1 (%)</th>
                              <th className="p-2.5 border-b text-center">Theory CAT2 (%)</th>
                              <th className="p-2.5 border-b text-center">Practical CA (%)</th>
                              <th className="p-2.5 border-b text-center">Model Test (%)</th>
                              <th className="p-2.5 border-b text-center">Terminal (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(course.courseOutcomes || []).map(co => {
                              const cell = (course.assessmentMatrix || []).find(r => r.coNo === co.coNo) || {
                                coNo: co.coNo,
                                theoryCat1: 0,
                                theoryCat2: 0,
                                practicalCa: 0,
                                practicalModel: 0,
                                tcpTerminal: 0,
                              };

                              return (
                                <tr key={co.coNo} className="border-b border-slate-100 hover:bg-slate-50/50">
                                  <td className="p-2.5 font-bold text-slate-800">{co.coNo}</td>
                                  {['theoryCat1', 'theoryCat2', 'practicalCa', 'practicalModel', 'tcpTerminal'].map(colKey => (
                                    <td key={colKey} className="p-2 text-center">
                                      <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={(cell as any)[colKey] || 0}
                                        onChange={e => {
                                          const val = parseInt(e.target.value) || 0;
                                          const matrix = [...(course.assessmentMatrix || [])];
                                          const idx = matrix.findIndex(r => r.coNo === co.coNo);
                                          if (idx >= 0) {
                                            matrix[idx] = { ...matrix[idx], [colKey]: val };
                                          } else {
                                            matrix.push({ coNo: co.coNo, [colKey]: val });
                                          }
                                          updateField('assessmentMatrix', matrix);
                                        }}
                                        className="w-16 p-1.5 border border-slate-300 rounded text-center text-xs"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 6: Syllabus Modules & Experiments */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {course.courseType === 'PRACTICAL' ? '6. Laboratory Experiments' : '6. Syllabus Modules & Schedule'}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {course.courseType === 'PRACTICAL'
                          ? 'Specify experiments with inquiry openness levels (1/2/3) and Annexure 1 course plan.'
                          : 'Modules must contain main topic, ordered subtopics, contact periods, and CO mapping.'}
                      </p>
                    </div>

                    {/* Theory / TCP Modules */}
                    {(course.courseType === 'THEORY' || course.courseType === 'TCP') && (
                      <div className="space-y-4">
                        {(course.modules || []).map((mod, idx) => (
                          <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-800">
                                Module {mod.moduleNo || idx + 1}
                              </span>
                              <button
                                onClick={() => {
                                  const updated = (course.modules || []).filter((_, i) => i !== idx);
                                  const renumbered = updated.map((m, i) => ({ ...m, moduleNo: i + 1 }));
                                  updateField('modules', renumbered);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div className="md:col-span-3">
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Main Topic Title
                                </label>
                                <input
                                  type="text"
                                  value={mod.mainTopic}
                                  onChange={e => {
                                    const updated = [...(course.modules || [])];
                                    updated[idx] = { ...updated[idx], mainTopic: e.target.value };
                                    updateField('modules', updated);
                                  }}
                                  placeholder="e.g. Abstract Data Types and Analysis"
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Periods
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={mod.periods || 0}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    const updated = [...(course.modules || [])];
                                    updated[idx] = { ...updated[idx], periods: val };
                                    updateField('modules', updated);
                                  }}
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center font-bold"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Subtopics (comma-separated or dashed)
                              </label>
                              <input
                                type="text"
                                value={(mod.subtopics || []).join(', ')}
                                onChange={e => {
                                  const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                  const updated = [...(course.modules || [])];
                                  updated[idx] = { ...updated[idx], subtopics: list };
                                  updateField('modules', updated);
                                }}
                                placeholder="Review of elementary data types, Big-Oh, Singly Linked List, etc."
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Mapped Course Outcomes
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {(course.courseOutcomes || []).map(co => {
                                  const isMapped = (mod.coMapping || []).includes(co.coNo);
                                  return (
                                    <button
                                      key={co.coNo}
                                      type="button"
                                      onClick={() => {
                                        const currentMap = mod.coMapping || [];
                                        const newMap = isMapped
                                          ? currentMap.filter(c => c !== co.coNo)
                                          : [...currentMap, co.coNo];
                                        const updated = [...(course.modules || [])];
                                        updated[idx] = { ...updated[idx], coMapping: newMap };
                                        updateField('modules', updated);
                                      }}
                                      className={`px-2 py-1 rounded text-xs font-semibold border ${
                                        isMapped
                                          ? 'bg-sky-600 text-white border-sky-600'
                                          : 'bg-white text-slate-600 border-slate-300'
                                      }`}
                                    >
                                      {co.coNo}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => {
                            const n = (course.modules || []).length + 1;
                            const newMod: SyllabusModule = {
                              moduleNo: n,
                              mainTopic: `Module ${n} Topic`,
                              subtopics: ['Subtopic A', 'Subtopic B'],
                              periods: 12,
                              coMapping: [`CO${Math.min(n, (course.courseOutcomes || []).length || 1)}`],
                            };
                            updateField('modules', [...(course.modules || []), newMod]);
                          }}
                          className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-500 text-slate-600 hover:text-sky-700 text-xs font-semibold flex items-center justify-center space-x-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Module</span>
                        </button>

                        {/* Concept Map Upload Card */}
                        <div className="pt-6 border-t border-slate-200 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                                <ImageIcon className="w-4 h-4 text-sky-600" />
                                <span>Concept Map (Visual Curriculum Hierarchy)</span>
                              </h3>
                              <p className="text-xs text-slate-500">
                                Upload a visual diagram or concept map depicting algorithmic linkages and course dependencies.
                              </p>
                            </div>
                            <div>
                              <input
                                type="file"
                                ref={conceptMapInputRef}
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = ev => {
                                    const result = ev.target?.result as string;
                                    updateField('conceptMapImage', result);
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => conceptMapInputRef.current?.click()}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold shadow-xs transition-colors"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{course.conceptMapImage ? 'Replace Concept Map' : 'Upload Concept Map Image'}</span>
                              </button>
                            </div>
                          </div>

                          {course.conceptMapImage ? (
                            <div className="p-3 border border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center">
                              <img
                                src={course.conceptMapImage}
                                alt="Concept Map Preview"
                                className="max-h-72 object-contain rounded-lg border border-slate-200 shadow-xs mb-3 bg-white"
                              />
                              <div className="flex items-center space-x-3">
                                <button
                                  type="button"
                                  onClick={() => conceptMapInputRef.current?.click()}
                                  className="text-xs text-sky-700 hover:text-sky-900 font-semibold underline"
                                >
                                  Change Image
                                </button>
                                <span className="text-slate-300">•</span>
                                <button
                                  type="button"
                                  onClick={() => updateField('conceptMapImage', '')}
                                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                                >
                                  Remove Concept Map
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => conceptMapInputRef.current?.click()}
                              className="p-6 border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl bg-slate-50 hover:bg-sky-50/30 flex flex-col items-center justify-center cursor-pointer transition-colors"
                            >
                              <Upload className="w-8 h-8 text-slate-400 mb-2" />
                              <span className="text-xs font-bold text-slate-700">Click to upload Concept Map image</span>
                              <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, SVG, or WebP</span>
                            </div>
                          )}
                        </div>

                        {/* Hierarchical Course Contents and Lecture Schedule */}
                        <div className="pt-6 border-t border-slate-200 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-slate-900">
                                Course Contents and Lecture Schedule
                              </h3>
                              <p className="text-xs text-slate-500">
                                Detailed lecture-by-lecture schedule formatted as per University MCA syllabus standard (total hours must equal {course.credits * 12} periods).
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const targetTotal = (course.credits || 4) * 12;
                                const mods = course.modules || [];
                                if (mods.length === 0) {
                                  alert('Please add modules above before generating the lecture schedule.');
                                  return;
                                }
                                const items: Array<{ moduleNo: string; topic: string; periods: number }> = [];
                                const baseP = Math.floor(targetTotal / mods.length);
                                let rem = targetTotal;

                                mods.forEach((m, mIdx) => {
                                  const mP = mIdx === mods.length - 1 ? rem : baseP;
                                  rem -= mP;

                                  items.push({
                                    moduleNo: String(m.moduleNo || mIdx + 1),
                                    topic: m.mainTopic,
                                    periods: mP,
                                  });

                                  const subs = m.subtopics || [];
                                  if (subs.length > 0) {
                                    const subP = Math.max(1, Math.floor(mP / subs.length));
                                    let subRem = mP;
                                    subs.forEach((s, sIdx) => {
                                      const p = sIdx === subs.length - 1 ? Math.max(1, subRem) : subP;
                                      subRem -= p;
                                      items.push({
                                        moduleNo: `${m.moduleNo || mIdx + 1}.${sIdx + 1}`,
                                        topic: s,
                                        periods: p,
                                      });
                                    });
                                  }
                                });
                                updateField('lectureScheduleItems', items);
                              }}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold shadow-xs transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Auto-populate from Modules & Subtopics</span>
                            </button>
                          </div>

                          <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead className="bg-slate-100 text-slate-700 font-bold">
                                <tr>
                                  <th className="p-2.5 border-b w-28 text-center">Module No.</th>
                                  <th className="p-2.5 border-b">Topic</th>
                                  <th className="p-2.5 border-b w-32 text-center">No. of Lectures</th>
                                  <th className="p-2.5 border-b w-14 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(course.lectureScheduleItems || []).map((item, idx) => {
                                  const isHeader = !item.moduleNo.includes('.');
                                  return (
                                    <tr key={idx} className={`border-b border-slate-100 ${isHeader ? 'bg-slate-50/80 font-bold' : ''}`}>
                                      <td className="p-2 text-center">
                                        <input
                                          type="text"
                                          value={item.moduleNo}
                                          onChange={e => {
                                            const list = [...(course.lectureScheduleItems || [])];
                                            list[idx] = { ...list[idx], moduleNo: e.target.value };
                                            updateField('lectureScheduleItems', list);
                                          }}
                                          className="w-20 p-1 border border-slate-300 rounded text-center text-xs font-semibold"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={item.topic}
                                          onChange={e => {
                                            const list = [...(course.lectureScheduleItems || [])];
                                            list[idx] = { ...list[idx], topic: e.target.value };
                                            updateField('lectureScheduleItems', list);
                                          }}
                                          className={`w-full p-1 border border-slate-300 rounded text-xs ${isHeader ? 'font-bold text-slate-900' : ''}`}
                                        />
                                      </td>
                                      <td className="p-2 text-center">
                                        <input
                                          type="number"
                                          min={0}
                                          value={item.periods || 0}
                                          onChange={e => {
                                            const list = [...(course.lectureScheduleItems || [])];
                                            list[idx] = { ...list[idx], periods: parseInt(e.target.value) || 0 };
                                            updateField('lectureScheduleItems', list);
                                          }}
                                          className="w-16 p-1 border border-slate-300 rounded text-center text-xs font-bold"
                                        />
                                      </td>
                                      <td className="p-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const list = (course.lectureScheduleItems || []).filter((_, i) => i !== idx);
                                            updateField('lectureScheduleItems', list);
                                          }}
                                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <tr>
                                  <td colSpan={2} className="p-2.5 text-right font-extrabold text-slate-900">
                                    Total No of Hours / Periods:
                                  </td>
                                  <td className="p-2.5 text-center font-extrabold text-xs">
                                    {(() => {
                                      const sum = (course.lectureScheduleItems || []).reduce(
                                        (acc, curr) => acc + (Number(curr.periods) || 0),
                                        0
                                      );
                                      const expected = (course.credits || 0) * 12;
                                      const matches = sum === expected;
                                      return (
                                        <span className={matches ? 'text-emerald-700' : 'text-amber-600'}>
                                          {sum} / {expected} hrs
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const list = [...(course.lectureScheduleItems || [])];
                              list.push({
                                moduleNo: `${list.length + 1}`,
                                topic: 'New Topic',
                                periods: 1,
                              });
                              updateField('lectureScheduleItems', list);
                            }}
                            className="w-full py-2 rounded-xl border border-dashed border-slate-300 hover:border-sky-500 text-slate-600 hover:text-sky-700 text-xs font-semibold flex items-center justify-center space-x-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Lecture Schedule Row</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Practical Experiments */}
                    {(course.courseType === 'PRACTICAL' || course.courseType === 'TCP') && (
                      <div className="space-y-4">
                        <span className="font-bold text-xs text-slate-800 block">List of Experiments:</span>
                        {(course.experiments || []).map((exp, idx) => (
                          <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-700">Exp. {exp.slNo || idx + 1}</span>
                              <button
                                onClick={() => {
                                  const updated = (course.experiments || []).filter((_, i) => i !== idx);
                                  updateField('experiments', updated);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                              <div className="md:col-span-8">
                                <input
                                  type="text"
                                  value={exp.name}
                                  onChange={e => {
                                    const updated = [...(course.experiments || [])];
                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                    updateField('experiments', updated);
                                  }}
                                  placeholder="Experiment Title"
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                                />
                              </div>

                              <div className="md:col-span-4">
                                <select
                                  value={exp.level}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) as 1 | 2 | 3;
                                    const updated = [...(course.experiments || [])];
                                    updated[idx] = { ...updated[idx], level: val };
                                    updateField('experiments', updated);
                                  }}
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                                >
                                  <option value={1}>Level 1: Structured (Open answers)</option>
                                  <option value={2}>Level 2: Guided (Open methods)</option>
                                  <option value={3}>Level 3: Inquiry (Fully open)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => {
                            const n = (course.experiments || []).length + 1;
                            const newExp: LabExperiment = {
                              slNo: n,
                              name: `Laboratory Investigation ${n}`,
                              level: 2,
                              objectiveNos: [1],
                              coNos: ['CO1'],
                            };
                            updateField('experiments', [...(course.experiments || []), newExp]);
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-slate-300 hover:border-sky-500 text-slate-600 hover:text-sky-700 text-xs font-semibold flex items-center justify-center space-x-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Laboratory Experiment</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 7: Learning Resources */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">7. Learning Resources</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Must specify <strong>1 to 2 Text Books</strong> and <strong>3 to 6 Reference Books</strong> with mandatory publication year.
                      </p>
                    </div>

                    {/* Text Books */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">
                          Text Books (1–2 required, format: Author, "Title", Publisher, Edition, Year):
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          {(course.textBooks || []).length} / 2
                        </span>
                      </div>
                      {(course.textBooks || []).map((b, idx) => (
                        <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-700">Text Book {idx + 1}</span>
                            <button
                              onClick={() => {
                                const updated = (course.textBooks || []).filter((_, i) => i !== idx);
                                updateField('textBooks', updated);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                              type="text"
                              value={b.authors}
                              onChange={e => {
                                const updated = [...(course.textBooks || [])];
                                updated[idx] = { ...updated[idx], authors: e.target.value };
                                updateField('textBooks', updated);
                              }}
                              placeholder="Author(s)"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={b.title}
                              onChange={e => {
                                const updated = [...(course.textBooks || [])];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                updateField('textBooks', updated);
                              }}
                              placeholder="Title (in double quotes)"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={b.publisher || ''}
                              onChange={e => {
                                const updated = [...(course.textBooks || [])];
                                updated[idx] = { ...updated[idx], publisher: e.target.value };
                                updateField('textBooks', updated);
                              }}
                              placeholder="Publisher"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="number"
                              value={b.year || ''}
                              onChange={e => {
                                const updated = [...(course.textBooks || [])];
                                updated[idx] = { ...updated[idx], year: parseInt(e.target.value) || '' };
                                updateField('textBooks', updated);
                              }}
                              placeholder="Year (e.g. 2022)"
                              className="p-2 border border-slate-300 rounded text-xs font-bold"
                            />
                          </div>
                        </div>
                      ))}

                      {(course.textBooks || []).length < 2 && (
                        <button
                          onClick={() => {
                            const newBook: LearningResource = {
                              type: 'TEXT',
                              authors: 'Author Name',
                              title: 'Subject Textbook',
                              publisher: 'Academic Press',
                              year: 2022,
                            };
                            updateField('textBooks', [...(course.textBooks || []), newBook]);
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-sky-700 text-xs font-semibold"
                        >
                          + Add Text Book
                        </button>
                      )}
                    </div>

                    {/* Reference Books */}
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">
                          Reference Books (3–6 required):
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          {(course.referenceBooks || []).length} / 3–6
                        </span>
                      </div>
                      {(course.referenceBooks || []).map((b, idx) => (
                        <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-700">Reference Book {idx + 1}</span>
                            <button
                              onClick={() => {
                                const updated = (course.referenceBooks || []).filter((_, i) => i !== idx);
                                updateField('referenceBooks', updated);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                              type="text"
                              value={b.authors}
                              onChange={e => {
                                const updated = [...(course.referenceBooks || [])];
                                updated[idx] = { ...updated[idx], authors: e.target.value };
                                updateField('referenceBooks', updated);
                              }}
                              placeholder="Author(s)"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={b.title}
                              onChange={e => {
                                const updated = [...(course.referenceBooks || [])];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                updateField('referenceBooks', updated);
                              }}
                              placeholder="Title"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={b.publisher || ''}
                              onChange={e => {
                                const updated = [...(course.referenceBooks || [])];
                                updated[idx] = { ...updated[idx], publisher: e.target.value };
                                updateField('referenceBooks', updated);
                              }}
                              placeholder="Publisher"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="number"
                              value={b.year || ''}
                              onChange={e => {
                                const updated = [...(course.referenceBooks || [])];
                                updated[idx] = { ...updated[idx], year: parseInt(e.target.value) || '' };
                                updateField('referenceBooks', updated);
                              }}
                              placeholder="Year (e.g. 2021)"
                              className="p-2 border border-slate-300 rounded text-xs font-bold"
                            />
                          </div>
                        </div>
                      ))}

                      {(course.referenceBooks || []).length < 6 && (
                        <button
                          onClick={() => {
                            const newBook: LearningResource = {
                              type: 'REFERENCE',
                              authors: 'Reference Author',
                              title: 'Reference Title',
                              publisher: 'Publisher',
                              year: 2022,
                            };
                            updateField('referenceBooks', [...(course.referenceBooks || []), newBook]);
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-sky-700 text-xs font-semibold"
                        >
                          + Add Reference Book
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 8: SDG Alignment */}
                {currentStep === 7 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">8. SDG Alignment</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Every SDG assigned in Course Outcomes must be supported by at least one actionable academic activity with a deliverable.
                      </p>
                    </div>

                    {/* 3-Step Guide Box */}
                    <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-3">
                      <div className="font-bold text-xs text-sky-950 flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-sky-700" />
                        <span>3-Step SDG Alignment Helper:</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-sky-900 mb-1">
                            Step 1: Choose Domain
                          </label>
                          <select
                            value={selectedDomain}
                            onChange={e => setSelectedDomain(e.target.value)}
                            className="w-full p-2 border border-sky-300 rounded bg-white text-xs"
                          >
                            <option value="">Select Domain...</option>
                            {DOMAIN_TO_SDG_MAP.map(d => (
                              <option key={d.domain} value={d.domain}>
                                {d.domain}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-sky-900 mb-1">
                            Step 2: Suggested SDGs
                          </label>
                          <div className="p-2 bg-white rounded border border-sky-200 min-h-[38px] flex items-center">
                            {selectedDomain ? (
                              <span className="font-bold text-sky-800">
                                SDGs:{' '}
                                {DOMAIN_TO_SDG_MAP.find(d => d.domain === selectedDomain)?.suggestedSdgs.join(
                                  ', '
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Select domain above</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-sky-900 mb-1">
                            Step 3: Actionable Deliverable
                          </label>
                          <div className="text-[11px] text-sky-800 pt-1">
                            Ensure activity results in a Report, Presentation, Case Analysis, or Design Exercise.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Activities List */}
                    <div className="space-y-3">
                      <span className="font-bold text-xs text-slate-800 block">Academic Activities:</span>
                      {(course.sdgActivities || []).map((act, idx) => (
                        <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-700">Activity {idx + 1}</span>
                            <button
                              onClick={() => {
                                const updated = (course.sdgActivities || []).filter((_, i) => i !== idx);
                                updateField('sdgActivities', updated);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">SDG No.</label>
                              <select
                                value={act.sdgNo}
                                onChange={e => {
                                  const updated = [...(course.sdgActivities || [])];
                                  updated[idx] = { ...updated[idx], sdgNo: parseInt(e.target.value) };
                                  updateField('sdgActivities', updated);
                                }}
                                className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                              >
                                {SDG_LIST.map(s => (
                                  <option key={s.no} value={s.no}>
                                    SDG {s.no}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-6">
                              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Activity Description</label>
                              <input
                                type="text"
                                value={act.activity}
                                onChange={e => {
                                  const updated = [...(course.sdgActivities || [])];
                                  updated[idx] = { ...updated[idx], activity: e.target.value };
                                  updateField('sdgActivities', updated);
                                }}
                                placeholder="Describe academic activity linked to syllabus topic"
                                className="w-full p-2 border border-slate-300 rounded text-xs"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Deliverable</label>
                              <select
                                value={act.deliverable}
                                onChange={e => {
                                  const updated = [...(course.sdgActivities || [])];
                                  updated[idx] = { ...updated[idx], deliverable: e.target.value };
                                  updateField('sdgActivities', updated);
                                }}
                                className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                              >
                                <option value="Report">Report</option>
                                <option value="Presentation">Presentation</option>
                                <option value="Case Analysis">Case Analysis</option>
                                <option value="Problem Set">Problem Set</option>
                                <option value="Design Exercise">Design Exercise</option>
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Linked Module</label>
                              <input
                                type="number"
                                min={1}
                                value={act.linkedModuleNo || 1}
                                onChange={e => {
                                  const updated = [...(course.sdgActivities || [])];
                                  updated[idx] = { ...updated[idx], linkedModuleNo: parseInt(e.target.value) || 1 };
                                  updateField('sdgActivities', updated);
                                }}
                                className="w-full p-2 border border-slate-300 rounded text-xs text-center"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const newAct: SdgActivity = {
                            sdgNo: 9,
                            activity: 'Practical case study evaluating sustainable infrastructure energy usage.',
                            deliverable: 'Report',
                            linkedModuleNo: 1,
                          };
                          updateField('sdgActivities', [...(course.sdgActivities || []), newAct]);
                        }}
                        className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-sky-700 text-xs font-semibold"
                      >
                        + Add SDG Academic Activity
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 9: Prerequisites & Designers */}
                {currentStep === 8 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">9. Designers & Prerequisites</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        List course designers with institutional emails, and identify prior foundational prerequisites.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Prerequisites
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(course.prerequisites) ? '' : course.prerequisites}
                        onChange={e => updateField('prerequisites', e.target.value || 'Nil')}
                        placeholder="Nil or Course Code : Course Name"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                      />
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Enter "Nil" if there are no prerequisites.
                      </span>
                    </div>

                    <div className="space-y-3">
                      <span className="font-bold text-xs text-slate-800 block">Course Designers:</span>
                      {(course.designers || []).map((des, idx) => (
                        <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-700">Designer {idx + 1}</span>
                            {(course.designers || []).length > 1 && (
                              <button
                                onClick={() => {
                                  const updated = (course.designers || []).filter((_, i) => i !== idx);
                                  updateField('designers', updated);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                              type="text"
                              value={des.name}
                              onChange={e => {
                                const updated = [...(course.designers || [])];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                updateField('designers', updated);
                              }}
                              placeholder="Name"
                              className="p-2 border border-slate-300 rounded text-xs font-semibold"
                            />
                            <input
                              type="text"
                              value={des.designation}
                              onChange={e => {
                                const updated = [...(course.designers || [])];
                                updated[idx] = { ...updated[idx], designation: e.target.value };
                                updateField('designers', updated);
                              }}
                              placeholder="Designation"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={des.department}
                              onChange={e => {
                                const updated = [...(course.designers || [])];
                                updated[idx] = { ...updated[idx], department: e.target.value };
                                updateField('designers', updated);
                              }}
                              placeholder="Department"
                              className="p-2 border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="email"
                              value={des.email}
                              onChange={e => {
                                const updated = [...(course.designers || [])];
                                updated[idx] = { ...updated[idx], email: e.target.value };
                                updateField('designers', updated);
                              }}
                              placeholder="Email ID"
                              className="p-2 border border-slate-300 rounded text-xs font-mono"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const newDes: CourseDesigner = {
                            name: '',
                            designation: 'Assistant Professor',
                            department: course.department || 'General',
                            email: '',
                          };
                          updateField('designers', [...(course.designers || []), newDes]);
                        }}
                        className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-sky-700 text-xs font-semibold"
                      >
                        + Add Additional Designer
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 10: Review & Compliance Audit */}
                {currentStep === 9 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">10. Review & Self-Audit</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Final institutional check. Ensure all compliance checklist items pass prior to submitting for Department review.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">
                          Academic Council Meeting (ACM) Compliance Status:
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            validationReport.isValid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {validationReport.isValid ? 'Ready for Submission' : 'Requires Corrections'}
                        </span>
                      </div>

                      {validationReport.errors.length > 0 && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                          <span className="text-xs font-bold text-rose-900 block mb-1">
                            Blocking Issues ({validationReport.errors.length}):
                          </span>
                          <ul className="list-disc pl-4 text-xs text-rose-800 space-y-0.5">
                            {validationReport.errors.map(e => (
                              <li key={e.id}>{e.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationReport.warnings.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <span className="text-xs font-bold text-amber-900 block mb-1">
                            Advisories ({validationReport.warnings.length}):
                          </span>
                          <ul className="list-disc pl-4 text-xs text-amber-800 space-y-0.5">
                            {validationReport.warnings.map(w => (
                              <li key={w.id}>{w.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-8 border-t border-slate-200 mt-8">
                <button
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="text-xs text-slate-500 font-medium">
                  Step {currentStep + 1} of {steps.length}
                </div>

                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white shadow-sm flex items-center space-x-1 active:scale-95 transition-all"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitForReview}
                    disabled={!validationReport.isValid || course.status === 'FINALIZED'}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all ${
                      validationReport.isValid && course.status !== 'FINALIZED'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Review</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Sticky Live Compliance Panel */}
            <LiveCompliancePanel
              report={validationReport}
              currentStepIndex={currentStep}
              onNavigateToStep={stepId => {
                const idx = steps.findIndex(s => s.id === stepId);
                if (idx >= 0) setCurrentStep(idx);
              }}
              onSubmit={handleSubmitForReview}
              courseStatus={course.status}
            />
          </>
        )}
      </div>
    </div>
  );
};







