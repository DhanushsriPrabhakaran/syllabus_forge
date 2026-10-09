import React from 'react';
import { Course } from '@syllabusforge/shared';
import { Download, FileText, Printer } from 'lucide-react';
import { api } from '../services/api';

interface DocumentPreviewProps {
  course: Course;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ course }) => {
  const isTheory = course.courseType === 'THEORY';
  const isPractical = course.courseType === 'PRACTICAL';
  const isTcp = course.courseType === 'TCP';

  const downloadDocx = () => {
    if (course._id) {
      window.open(api.getExportUrl(course._id, 'docx'), '_blank');
    }
  };

  const downloadPdf = () => {
    if (course._id) {
      window.open(api.getExportUrl(course._id, 'pdf'), '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center">
      {/* Top Action Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-sky-600" />
          <span className="font-semibold text-slate-800 text-sm">
            Institutional Layout Preview ({course.courseType})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={downloadDocx}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export .docx</span>
          </button>
          <button
            onClick={downloadPdf}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* A4 White Page Sheet Container */}
      <div className="w-full max-w-4xl bg-white p-12 sm:p-16 rounded-xl shadow-lg border border-slate-300 document-view min-h-[1123px] text-slate-900 select-text">
        {/* Header Table: Aligned with MCA Format */}
        <table className="mb-4 w-full border-collapse">
          <tbody>
            <tr>
              <td
                rowSpan={2}
                className="w-[18%] font-bold text-slate-900 bg-slate-100 text-center align-middle border border-slate-400 p-2 text-sm"
              >
                {course.courseCode}
              </td>
              <td
                rowSpan={2}
                className="w-[42%] font-bold text-slate-900 bg-slate-100 uppercase tracking-wide align-middle border border-slate-400 p-2 text-sm"
              >
                {course.courseName || ''}
              </td>
              <th className="w-[14%] text-center font-bold text-slate-800 bg-slate-50 border border-slate-400 p-1.5 text-xs">
                CATEGORY
              </th>
              <th className="w-[6.5%] text-center font-bold text-slate-800 bg-slate-50 border border-slate-400 p-1.5 text-xs">
                L
              </th>
              <th className="w-[6.5%] text-center font-bold text-slate-800 bg-slate-50 border border-slate-400 p-1.5 text-xs">
                T
              </th>
              <th className="w-[6.5%] text-center font-bold text-slate-800 bg-slate-50 border border-slate-400 p-1.5 text-xs">
                P
              </th>
              <th className="w-[6.5%] text-center font-bold text-slate-800 bg-slate-50 border border-slate-400 p-1.5 text-xs">
                CREDIT
              </th>
              {isTcp && (
                <th className="w-[10%] text-center font-bold text-slate-800 bg-slate-50 border border-slate-400 p-1.5 text-xs">
                  TE TYPE
                </th>
              )}
            </tr>
            <tr>
              <td className="text-center font-medium border border-slate-400 p-1.5 text-xs">
                {course.categoryAbbr || 'PCC'}
              </td>
              <td className="text-center border border-slate-400 p-1.5 text-xs">{course.L}</td>
              <td className="text-center border border-slate-400 p-1.5 text-xs">{course.T}</td>
              <td className="text-center border border-slate-400 p-1.5 text-xs">{course.P}</td>
              <td className="text-center font-bold border border-slate-400 p-1.5 text-xs">{course.credits}</td>
              {isTcp && (
                <td className="text-center font-bold border border-slate-400 p-1.5 text-xs">
                  {course.teExamType || 'TCP-T'}
                </td>
              )}
            </tr>
          </tbody>
        </table>

        {/* Preamble */}
        <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">Preamble</h3>
        <p className="text-justify mb-4">{course.preamble || 'No preamble entered.'}</p>

        {/* Prerequisite */}
        <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">Prerequisite</h3>
        <p className="mb-4">
          {typeof course.prerequisites === 'string' ? course.prerequisites : 'Nil'}
        </p>

        {/* Course Outcomes */}
        <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">Course Outcomes</h3>
        <p className="mb-2 italic text-xs">On the successful completion of the course, students will be able to:</p>
        <table className="mb-4">
          <thead>
            <tr>
              <th className="w-[8%]">No.</th>
              <th className="w-[46%]">Course Outcome</th>
              <th className="w-[12%]">{isTcp ? 'TCE Proficiency Scale' : 'TPS Level'}</th>
              <th className="w-[14%]">Performance Indicator</th>
              {(isTheory || isTcp) && <th className="w-[10%]">CO Weightage</th>}
              {isPractical && <th className="w-[10%]">Objective</th>}
              <th className="w-[10%]">SDG Addressed</th>
              <th className="w-[10%]">SDG Level</th>
            </tr>
          </thead>
          <tbody>
            {(course.courseOutcomes || []).map(co => (
              <tr key={co.coNo}>
                <td className="font-bold">{co.coNo}</td>
                <td>{co.statement}</td>
                <td>TPS {co.tpsLevel}</td>
                <td>{co.pi}</td>
                {(isTheory || isTcp) && <td>{co.weightage || 0}%</td>}
                {isPractical && <td>{co.objectiveNo ? `Obj. ${co.objectiveNo}` : '-'}</td>}
                <td>{co.sdgNo || 'NC'}</td>
                <td>{co.sdgLevel || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mapping with Programme Outcomes and Programme Specific Outcomes */}
        <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">Mapping with Programme Outcomes and Programme Specific Outcomes</h3>
        <table className="mb-2 text-center text-xs">
          <thead>
            <tr>
              <th className="w-12 font-bold bg-slate-100">COs</th>
              {['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12'].map(po => (
                <th key={po} className="font-bold bg-slate-100 px-1">{po}</th>
              ))}
              {['PSO1', 'PSO2', 'PSO3'].map(pso => (
                <th key={pso} className="font-bold bg-slate-100 px-1">{pso}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {((course.poPsoMapping && course.poPsoMapping.length > 0)
              ? course.poPsoMapping
              : (course.courseOutcomes || []).map(co => ({ coNo: co.coNo }))
            ).map((row, idx) => (
              <tr key={idx}>
                <td className="font-bold bg-slate-50">{row.coNo}</td>
                {['po1', 'po2', 'po3', 'po4', 'po5', 'po6', 'po7', 'po8', 'po9', 'po10', 'po11', 'po12'].map(k => (
                  <td key={k} className="p-1 font-medium">{(row as any)[k] || '-'}</td>
                ))}
                {['pso1', 'pso2', 'pso3'].map(k => (
                  <td key={k} className="p-1 font-medium">{(row as any)[k] || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-500 italic mb-4">S - Strong; M - Medium; L - Low</p>

        {/* Assessment Pattern: Cognitive Domain */}
        {isTheory && (
          <div className="mb-4">
            <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">Assessment Pattern: Cognitive Domain</h3>
            <table className="mb-4 text-xs">
              <thead>
                <tr>
                  <th className="font-bold bg-slate-100 text-left w-36">Cognitive Levels</th>
                  <th className="font-bold bg-slate-100 text-center" colSpan={3}>
                    Continuous Assessment Tests
                    <div className="grid grid-cols-3 mt-1 pt-1 border-t border-slate-300 font-semibold">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                    </div>
                  </th>
                  <th className="font-bold bg-slate-100 text-center w-28">Terminal Examination</th>
                </tr>
              </thead>
              <tbody>
                {((course.cognitiveAssessmentPattern && course.cognitiveAssessmentPattern.length > 0)
                  ? course.cognitiveAssessmentPattern
                  : [
                      { level: 'Remember', cat1: 10, cat2: 10, cat3: 10, terminalExam: 10 },
                      { level: 'Understand', cat1: 30, cat2: 30, cat3: 10, terminalExam: 10 },
                      { level: 'Apply', cat1: 60, cat2: 60, cat3: 80, terminalExam: 80 },
                      { level: 'Analyze', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
                      { level: 'Evaluate', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
                      { level: 'Create', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
                    ]
                ).map((row, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold text-left">{row.level}</td>
                    <td className="text-center">{row.cat1}</td>
                    <td className="text-center">{row.cat2}</td>
                    <td className="text-center">{row.cat3}</td>
                    <td className="text-center">{row.terminalExam}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Course Level Assessment Questions */}
            {course.courseAssessmentQuestions && course.courseAssessmentQuestions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">Course Level Assessment Questions</h3>
                <div className="space-y-3 text-xs">
                  {course.courseAssessmentQuestions.map((grp, gIdx) => (
                    <div key={gIdx} className="border border-slate-200 rounded p-2.5 bg-slate-50/50">
                      <div className="font-bold text-slate-800 mb-1.5">Course Outcome {grp.coNo}:</div>
                      <ol className="list-decimal pl-4 space-y-1">
                        {grp.questions.map((q, qIdx) => (
                          <li key={qIdx} className="text-justify leading-relaxed">{q}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Concept Map */}
        {(isTheory || isTcp) && (
          <div className="mb-4">
            <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">Concept Map</h3>
            {course.conceptMapImage ? (
              <div className="my-2 p-2 border border-slate-200 rounded-lg flex justify-center bg-slate-50">
                <img
                  src={course.conceptMapImage}
                  alt="Concept Map"
                  className="max-h-80 object-contain rounded border border-slate-300"
                />
              </div>
            ) : (
              <p className="text-xs italic text-slate-500 my-2">
                (Concept Map pending upload by faculty)
              </p>
            )}
          </div>
        )}

        {isPractical && (
          <table className="mb-4">
            <thead>
              <tr>
                <th>Type of Assessment</th>
                <th>Component</th>
                <th>Marks</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Continuous Assessment</td>
                <td>Pre-lab, In-lab, Post-lab</td>
                <td className="font-bold">75</td>
                <td>Conducted throughout the semester.</td>
              </tr>
              <tr>
                <td>Model Test</td>
                <td>CO-wise (Cognitive, Psychomotor, Affective)</td>
                <td className="font-bold">25</td>
                <td>Rubrics considering all three domains.</td>
              </tr>
              <tr>
                <td className="font-bold">Total Internal Marks</td>
                <td></td>
                <td className="font-bold">100</td>
                <td></td>
              </tr>
              <tr>
                <td>End Semester Examination</td>
                <td>CO-wise (Cognitive, Psychomotor, Affective)</td>
                <td className="font-bold">100</td>
                <td>Rubrics considering all three domains.</td>
              </tr>
            </tbody>
          </table>
        )}

        {isTcp && (
          <table className="mb-4">
            <thead>
              <tr>
                <th>CO</th>
                <th>Theory CAT1 (%)</th>
                <th>Theory CAT2 (%)</th>
                <th>Practical CA (%)</th>
                <th>Model Test (%)</th>
                <th>Terminal Exam (%)</th>
              </tr>
            </thead>
            <tbody>
              {(course.assessmentMatrix || []).map(r => (
                <tr key={r.coNo}>
                  <td className="font-bold">{r.coNo}</td>
                  <td>{r.theoryCat1 || 0}</td>
                  <td>{r.theoryCat2 || 0}</td>
                  <td>{r.practicalCa || 0}</td>
                  <td>{r.practicalModel || 0}</td>
                  <td>{r.tcpTerminal || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Syllabus Modules (Theory & TCP) */}
        {(isTheory || isTcp) && course.modules && course.modules.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">Syllabus</h3>
            <div className="space-y-2">
              {course.modules.map((m, idx) => (
                <div key={idx} className="text-sm">
                  <strong>Module {m.moduleNo || idx + 1}:</strong> {m.mainTopic} –{' '}
                  {(m.subtopics || []).join(' – ')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List of Experiments (Practical & TCP) */}
        {(isPractical || isTcp) && course.experiments && course.experiments.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">List of Experiments with CO Mapping</h3>
            <table>
              <thead>
                <tr>
                  <th className="w-[10%]">Sl. No.</th>
                  <th className="w-[60%]">Name of the Experiment</th>
                  <th className="w-[15%]">Level</th>
                  <th className="w-[15%]">COs Addressed</th>
                </tr>
              </thead>
              <tbody>
                {course.experiments.map((e, idx) => (
                  <tr key={idx}>
                    <td>{e.slNo || idx + 1}</td>
                    <td>{e.name}</td>
                    <td>Level {e.level}</td>
                    <td>{(e.coNos || []).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Learning Resources */}
        <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">Learning Resources</h3>
        <div className="mb-2">
          <strong>Text Books:</strong>
          <ol className="list-decimal pl-5 mt-1 space-y-1">
            {(course.textBooks || []).map((b, idx) => (
              <li key={idx}>
                {b.authors}, <em>"{b.title}"</em>, {b.publisher || ''}, {b.edition || ''},{' '}
                {b.year}. {b.chapters ? `(${b.chapters})` : ''}
              </li>
            ))}
          </ol>
        </div>

        <div className="mb-4">
          <strong>Reference Books & Web Resources:</strong>
          <ol className="list-decimal pl-5 mt-1 space-y-1">
            {(course.referenceBooks || []).map((b, idx) => (
              <li key={idx}>
                {b.authors}, <em>"{b.title}"</em>, {b.publisher || ''}, {b.edition || ''},{' '}
                {b.year}.
              </li>
            ))}
          </ol>
        </div>

        {/* SDG Alignment */}
        {course.sdgActivities && course.sdgActivities.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">SDG Alignment</h3>
            <ol className="list-decimal pl-5 space-y-1">
              {course.sdgActivities.map((a, idx) => (
                <li key={idx}>
                  <strong>[SDG {a.sdgNo}]</strong> {a.activity} (
                  <em>
                    Deliverable: {a.deliverable}
                    {a.linkedModuleNo ? `, Linked Module: ${a.linkedModuleNo}` : ''}
                  </em>
                  )
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Lecture Schedule (Theory & TCP) */}
        {(isTheory || isTcp) && (
          <div className="mb-4">
            <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">Course Contents and Lecture Schedule</h3>
            {course.lectureScheduleItems && course.lectureScheduleItems.length > 0 ? (
              <table className="mb-4 text-xs">
                <thead>
                  <tr>
                    <th className="w-24 text-center font-bold bg-slate-100">Module No.</th>
                    <th className="font-bold bg-slate-100 text-left">Topic</th>
                    <th className="w-28 text-center font-bold bg-slate-100">No. of Lectures</th>
                  </tr>
                </thead>
                <tbody>
                  {course.lectureScheduleItems.map((item, idx) => {
                    const isHeader = !item.moduleNo.includes('.');
                    return (
                      <tr key={idx} className={isHeader ? 'bg-slate-50 font-semibold' : ''}>
                        <td className="text-center">{item.moduleNo}</td>
                        <td className={isHeader ? 'font-bold text-slate-900' : 'pl-4'}>{item.topic}</td>
                        <td className="text-center">{item.periods || '-'}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold bg-slate-100">
                    <td colSpan={2} className="text-right pr-4">Total No of Hours:</td>
                    <td className="text-center">
                      {course.lectureScheduleItems.reduce((sum, item) => sum + (Number(item.periods) || 0), 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : course.modules && course.modules.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Module No</th>
                    <th>Topic</th>
                    <th>No. of Periods</th>
                    {isTcp && <th>Course Outcomes</th>}
                  </tr>
                </thead>
                <tbody>
                  {course.modules.map((m, idx) => (
                    <tr key={idx}>
                      <td>{m.moduleNo || idx + 1}</td>
                      <td>{m.mainTopic}</td>
                      <td>{m.periods || 0}</td>
                      {isTcp && <td>{(m.coMapping || []).join(', ')}</td>}
                    </tr>
                  ))}
                  <tr>
                    <td className="font-bold">Total Periods</td>
                    <td></td>
                    <td className="font-bold">
                      {course.modules.reduce((sum, m) => sum + (Number(m.periods) || 0), 0)}
                    </td>
                    {isTcp && <td></td>}
                  </tr>
                </tbody>
              </table>
            ) : null}
          </div>
        )}

        {/* Annexure 1 for Practical Courses */}
        {isPractical && course.coursePlan && course.coursePlan.length > 0 && (
          <div className="mb-4 mt-8 pt-6 border-t border-slate-300">
            <h3 className="font-bold mt-2 mb-2 bg-gray-200 p-1">Annexure – 1: Course Plan</h3>
            <table className="mb-4">
              <thead>
                <tr>
                  <th className="w-[10%]">Exp. No.</th>
                  <th className="w-[30%]">Pre-Lab Activity</th>
                  <th className="w-[30%]">In-Lab Activity</th>
                  <th className="w-[30%]">Post-Lab Activity</th>
                </tr>
              </thead>
              <tbody>
                {course.coursePlan.map((p, idx) => (
                  <tr key={idx}>
                    <td>{p.experimentNo}</td>
                    <td>{p.preLabActivity}</td>
                    <td>{p.inLabActivity}</td>
                    <td>{p.postLabActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">Plan for Assessment (Continuous Assessment: 75 Marks)</h3>
            <table className="mb-4">
              <thead>
                <tr>
                  <th>Exp. No.</th>
                  <th>Level</th>
                  <th>Pre-Lab</th>
                  <th>In-Lab</th>
                  <th>Post-Lab</th>
                  <th>Total (75)</th>
                </tr>
              </thead>
              <tbody>
                {course.coursePlan.map((p, idx) => (
                  <tr key={idx}>
                    <td>{p.experimentNo}</td>
                    <td>Level {p.level}</td>
                    <td>{p.preMarks}</td>
                    <td>{p.inMarks}</td>
                    <td>{p.postMarks}</td>
                    <td className="font-bold">{(p.preMarks || 0) + (p.inMarks || 0) + (p.postMarks || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Course Designers */}
        <h3 className="font-bold mt-4 mb-2 bg-gray-200 p-1">Course Designer(s):</h3>
        <table>
          <thead>
            <tr>
              <th>Name, Designation & Department</th>
              <th>Email ID</th>
            </tr>
          </thead>
          <tbody>
            {(course.designers || []).map((d, idx) => (
              <tr key={idx}>
                <td>
                  {d.name}, {d.designation}, {d.department}
                </td>
                <td>{d.email}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Running Footer Note */}
        <div className="mt-12 pt-4 border-t border-slate-300 text-right text-xs text-slate-500 font-sans">
          Passed in BoS Meeting 01.06.2026 | Approved in 71st Academic Council Meeting 27.06.2026
        </div>
      </div>
    </div>
  );
};
