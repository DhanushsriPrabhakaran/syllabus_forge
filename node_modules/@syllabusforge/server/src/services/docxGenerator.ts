import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType, ShadingType,
  WidthType,
  BorderStyle,
  Footer,
  PageNumber,
  HeadingLevel,
  Packer,
  VerticalMergeType,
  ImageRun,
} from 'docx';
import { Course } from '@syllabusforge/shared';
import { ConfigSettingsModel } from '../models/MasterData.js';

// Table cell border helper
const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
};

function createText(text: string, options: { bold?: boolean; size?: number; font?: string; italics?: boolean } = {}) {
  return new TextRun({
    text: text || '',
    font: options.font || 'Arial',
    size: options.size !== undefined ? options.size : 22, // 22 half-pts = 11 pt
    bold: !!options.bold,
    italics: !!options.italics,
  });
}

function createHeading(text: string) {
  return new Paragraph({
    spacing: { before: 200, after: 100 }, shading: { type: ShadingType.CLEAR, color: "auto", fill: "E0E0E0" },
    children: [createText(text, { bold: true, size: 22 })],
  });
}

function createCell(
  textOrRuns: string | TextRun[],
  options: {
    bold?: boolean;
    fill?: string;
    widthPercent?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    verticalMerge?: (typeof VerticalMergeType)[keyof typeof VerticalMergeType];
    rowSpan?: number;
    colSpan?: number;
  } = {}
) {
  const children = typeof textOrRuns === 'string'
    ? (textOrRuns ? [new Paragraph({
        alignment: options.align || AlignmentType.LEFT,
        children: [createText(textOrRuns, { bold: options.bold })],
      })] : [])
    : [new Paragraph({
        alignment: options.align || AlignmentType.LEFT,
        children: textOrRuns,
      })];

  return new TableCell({
    borders: cellBorders,
    shading: options.fill ? { fill: options.fill } : undefined,
    width: options.widthPercent ? { size: options.widthPercent, type: WidthType.PERCENTAGE } : undefined,
    verticalMerge: options.verticalMerge,
    rowSpan: options.rowSpan,
    columnSpan: options.colSpan,
    children,
  });
}

export async function generateDocxDocument(course: Course): Promise<Buffer> {
  // Fetch BoS & ACM config
  const configSetting = await ConfigSettingsModel.findOne({ key: 'acmText' });
  const footerText = configSetting?.value || 'Passed in BoS Meeting 01.06.2026 | Approved in 71st Academic Council Meeting 27.06.2026';

  const docSections = [];

  // Footer for all pages
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          createText(`${footerText} | Page `, { size: 18 }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18 }),
        ],
      }),
    ],
  });

  const children: any[] = [];

  // 1. Header Table: Aligned with MCA Syllabus Format
  const titleText = (course.courseName || '').toUpperCase();
  const isTcp = course.courseType === 'TCP';

  const headerRow1 = new TableRow({
    children: [
      createCell(course.courseCode, {
        bold: true,
        widthPercent: 16,
        fill: 'F3F4F6',
        verticalMerge: VerticalMergeType.RESTART,
        align: AlignmentType.CENTER,
      }),
      createCell(titleText, {
        bold: true,
        widthPercent: isTcp ? 38 : 44,
        fill: 'F3F4F6',
        verticalMerge: VerticalMergeType.RESTART,
      }),
      createCell('CATEGORY', { bold: true, widthPercent: 14, fill: 'E5E7EB', align: AlignmentType.CENTER }),
      createCell('L', { bold: true, widthPercent: 6.5, fill: 'E5E7EB', align: AlignmentType.CENTER }),
      createCell('T', { bold: true, widthPercent: 6.5, fill: 'E5E7EB', align: AlignmentType.CENTER }),
      createCell('P', { bold: true, widthPercent: 6.5, fill: 'E5E7EB', align: AlignmentType.CENTER }),
      createCell('CREDIT', { bold: true, widthPercent: 7.5, fill: 'E5E7EB', align: AlignmentType.CENTER }),
      ...(isTcp
        ? [createCell('TE TYPE', { bold: true, widthPercent: 12, fill: 'E5E7EB', align: AlignmentType.CENTER })]
        : []),
    ],
  });

  const headerRow2 = new TableRow({
    children: [
      createCell('', {
        widthPercent: 16,
        verticalMerge: VerticalMergeType.CONTINUE,
      }),
      createCell('', {
        widthPercent: isTcp ? 38 : 44,
        verticalMerge: VerticalMergeType.CONTINUE,
      }),
      createCell(course.categoryAbbr || 'PCC', { widthPercent: 14, align: AlignmentType.CENTER }),
      createCell(String(course.L), { widthPercent: 6.5, align: AlignmentType.CENTER }),
      createCell(String(course.T), { widthPercent: 6.5, align: AlignmentType.CENTER }),
      createCell(String(course.P), { widthPercent: 6.5, align: AlignmentType.CENTER }),
      createCell(String(course.credits), { bold: true, widthPercent: 7.5, align: AlignmentType.CENTER }),
      ...(isTcp
        ? [createCell(course.teExamType || 'TCP-T', { widthPercent: 12, align: AlignmentType.CENTER })]
        : []),
    ],
  });

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow1, headerRow2],
  });
  children.push(headerTable);

  // 2. Preamble
  children.push(createHeading('Preamble'));
  children.push(new Paragraph({
    spacing: { after: 150 },
    children: [createText(course.preamble || '')],
  }));

  // 3. Prerequisite
  children.push(createHeading('Prerequisite'));
  children.push(new Paragraph({
    spacing: { after: 150 },
    children: [createText(typeof course.prerequisites === 'string' ? course.prerequisites : 'Nil')],
  }));
  // 4. Course Outcomes
  children.push(createHeading('Course Outcomes'));
  children.push(new Paragraph({
    spacing: { after: 100 },
    children: [createText('On the successful completion of the course, students will be able to:')],
  }));

  // CO Table
  const isTheory = course.courseType === 'THEORY';
  const isPractical = course.courseType === 'PRACTICAL';

  const coHeaderCells = [
    createCell('No.', { bold: true, widthPercent: 8, fill: 'E5E7EB' }),
    createCell('Course Outcome', { bold: true, widthPercent: 46, fill: 'E5E7EB' }),
    createCell(isTcp ? 'TCE Proficiency Scale' : 'TPS Level', { bold: true, widthPercent: 12, fill: 'E5E7EB' }),
    createCell('Performance Indicator', { bold: true, widthPercent: 14, fill: 'E5E7EB' }),
  ];

  if (isTheory || isTcp) {
    coHeaderCells.push(createCell('CO Weightage', { bold: true, widthPercent: 10, fill: 'E5E7EB' }));
  }
  if (isPractical) {
    coHeaderCells.push(createCell('Objective', { bold: true, widthPercent: 10, fill: 'E5E7EB' }));
  }
  coHeaderCells.push(createCell('SDG Addressed', { bold: true, widthPercent: 10, fill: 'E5E7EB' }));
  coHeaderCells.push(createCell('SDG Level', { bold: true, widthPercent: 10, fill: 'E5E7EB' }));

  const coRows = [new TableRow({ children: coHeaderCells })];

  (course.courseOutcomes || []).forEach(co => {
    const rowCells = [
      createCell(co.coNo, { bold: true, widthPercent: 8 }),
      createCell(co.statement, { widthPercent: 46 }),
      createCell(`TPS ${co.tpsLevel}`, { widthPercent: 12 }),
      createCell(co.pi, { widthPercent: 14 }),
    ];

    if (isTheory || isTcp) {
      rowCells.push(createCell(`${co.weightage || 0}%`, { widthPercent: 10 }));
    }
    if (isPractical) {
      rowCells.push(createCell(co.objectiveNo ? `Obj. ${co.objectiveNo}` : '-', { widthPercent: 10 }));
    }
    rowCells.push(createCell(String(co.sdgNo || 'NC'), { widthPercent: 10 }));
    rowCells.push(createCell(co.sdgLevel ? String(co.sdgLevel) : '-', { widthPercent: 10 }));

    coRows.push(new TableRow({ children: rowCells }));
  });

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: coRows,
  }));

  // 4b. Mapping with Programme Outcomes and Programme Specific Outcomes
  children.push(createHeading('Mapping with Programme Outcomes and Programme Specific Outcomes'));

  const poHeaders = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12', 'PSO1', 'PSO2', 'PSO3'];
  const poHeaderCells = [
    createCell('COs', { bold: true, widthPercent: 10, fill: 'E5E7EB', align: AlignmentType.CENTER }),
    ...poHeaders.map(po => createCell(po, { bold: true, widthPercent: 6, fill: 'E5E7EB', align: AlignmentType.CENTER })),
  ];

  const poRows = [new TableRow({ children: poHeaderCells })];

  const poList = (course.poPsoMapping && course.poPsoMapping.length > 0)
    ? course.poPsoMapping
    : (course.courseOutcomes || []).map(co => ({ coNo: co.coNo }));

  poList.forEach(item => {
    const rowCells = [
      createCell(item.coNo, { bold: true, widthPercent: 10, align: AlignmentType.CENTER }),
      ...poHeaders.map(po => {
        const key = po.toLowerCase() as keyof typeof item;
        const val = (item as any)[key] || '-';
        return createCell(String(val), { widthPercent: 6, align: AlignmentType.CENTER });
      }),
    ];
    poRows.push(new TableRow({ children: rowCells }));
  });

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: poRows,
  }));

  children.push(new Paragraph({
    spacing: { before: 60, after: 120 },
    children: [createText('S - Strong; M - Medium; L - Low', { italics: true, size: 18 })],
  }));

  // 5. Assessment Pattern
  if (isTheory) {
    children.push(createHeading('Assessment Pattern: Cognitive Domain'));

    const cogHeader = new TableRow({
      children: [
        createCell('Cognitive Levels', { bold: true, widthPercent: 28, fill: 'E5E7EB' }),
        createCell('Continuous Assessment Tests (1)', { bold: true, widthPercent: 18, fill: 'E5E7EB', align: AlignmentType.CENTER }),
        createCell('CAT 2', { bold: true, widthPercent: 18, fill: 'E5E7EB', align: AlignmentType.CENTER }),
        createCell('CAT 3', { bold: true, widthPercent: 18, fill: 'E5E7EB', align: AlignmentType.CENTER }),
        createCell('Terminal Examination', { bold: true, widthPercent: 18, fill: 'E5E7EB', align: AlignmentType.CENTER }),
      ],
    });

    const cogData = (course.cognitiveAssessmentPattern && course.cognitiveAssessmentPattern.length > 0)
      ? course.cognitiveAssessmentPattern
      : [
          { level: 'Remember', cat1: 10, cat2: 10, cat3: 10, terminalExam: 10 },
          { level: 'Understand', cat1: 30, cat2: 30, cat3: 10, terminalExam: 10 },
          { level: 'Apply', cat1: 60, cat2: 60, cat3: 80, terminalExam: 80 },
          { level: 'Analyze', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
          { level: 'Evaluate', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
          { level: 'Create', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
        ];

    const cogRows = [cogHeader];
    cogData.forEach(row => {
      cogRows.push(new TableRow({
        children: [
          createCell(row.level, { bold: true, widthPercent: 28 }),
          createCell(String(row.cat1), { widthPercent: 18, align: AlignmentType.CENTER }),
          createCell(String(row.cat2), { widthPercent: 18, align: AlignmentType.CENTER }),
          createCell(String(row.cat3), { widthPercent: 18, align: AlignmentType.CENTER }),
          createCell(String(row.terminalExam), { widthPercent: 18, align: AlignmentType.CENTER }),
        ],
      }));
    });

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: cogRows,
    }));

    // Course Level Assessment Questions
    if (course.courseAssessmentQuestions && course.courseAssessmentQuestions.length > 0) {
      children.push(createHeading('Course Level Assessment Questions'));
      course.courseAssessmentQuestions.forEach(grp => {
        children.push(new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [createText(`Course Outcome ${grp.coNo}:`, { bold: true, size: 22 })],
        }));
        (grp.questions || []).forEach((q, qIdx) => {
          children.push(new Paragraph({
            spacing: { after: 50 },
            children: [createText(`${qIdx + 1}. ${q}`)],
          }));
        });
      });
    }
  } else if (isPractical) {
    const labAssessTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            createCell('Type of Assessment', { bold: true, fill: 'E5E7EB' }),
            createCell('Component', { bold: true, fill: 'E5E7EB' }),
            createCell('Marks', { bold: true, fill: 'E5E7EB' }),
            createCell('Remarks', { bold: true, fill: 'E5E7EB' }),
          ],
        }),
        new TableRow({
          children: [
            createCell('Continuous Assessment'),
            createCell('Pre-lab, In-lab, Post-lab'),
            createCell('75', { bold: true }),
            createCell('Conducted throughout the semester.'),
          ],
        }),
        new TableRow({
          children: [
            createCell('Model Test'),
            createCell('CO-wise (Cognitive, Psychomotor, Affective)'),
            createCell('25', { bold: true }),
            createCell('Rubrics considering all three domains.'),
          ],
        }),
        new TableRow({
          children: [
            createCell('Total Internal Marks', { bold: true }),
            createCell(''),
            createCell('100', { bold: true }),
            createCell(''),
          ],
        }),
        new TableRow({
          children: [
            createCell('End Semester Examination'),
            createCell('CO-wise (Cognitive, Psychomotor, Affective)'),
            createCell('100', { bold: true }),
            createCell('Rubrics considering all three domains.'),
          ],
        }),
      ],
    });
    children.push(labAssessTable);
  } else if (isTcp) {
    const tcpAssessRows = [
      new TableRow({
        children: [
          createCell('CO', { bold: true, fill: 'E5E7EB' }),
          createCell('Theory CAT1 (%)', { bold: true, fill: 'E5E7EB' }),
          createCell('Theory CAT2 (%)', { bold: true, fill: 'E5E7EB' }),
          createCell('Practical CA (%)', { bold: true, fill: 'E5E7EB' }),
          createCell('Model Test (%)', { bold: true, fill: 'E5E7EB' }),
          createCell('Terminal Exam (%)', { bold: true, fill: 'E5E7EB' }),
        ],
      }),
    ];
    (course.assessmentMatrix || []).forEach(row => {
      tcpAssessRows.push(new TableRow({
        children: [
          createCell(row.coNo, { bold: true }),
          createCell(String(row.theoryCat1 || 0)),
          createCell(String(row.theoryCat2 || 0)),
          createCell(String(row.practicalCa || 0)),
          createCell(String(row.practicalModel || 0)),
          createCell(String(row.tcpTerminal || 0)),
        ],
      }));
    });
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tcpAssessRows,
    }));
  }

  // Concept Map
  if (isTheory || isTcp) {
    children.push(createHeading('Concept Map'));
    if (course.conceptMapImage && course.conceptMapImage.startsWith('data:image')) {
      try {
        const base64Data = course.conceptMapImage.replace(/^data:image\/\w+;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 150 },
          children: [
            new ImageRun({
              data: imgBuffer,
              transformation: {
                width: 550,
                height: 280,
              },
            } as any),
          ],
        }));
      } catch (err) {
        console.error('Error rendering concept map in docx:', err);
      }
    } else {
      children.push(new Paragraph({
        children: [createText('(Concept Map pending upload by faculty)', { italics: true, size: 18 })],
      }));
    }
  }

  // 6. Syllabus Content (Theory & TCP)
  if (isTheory || isTcp) {
    children.push(createHeading('Syllabus'));
    (course.modules || []).forEach((mod, idx) => {
      const line = `Module ${mod.moduleNo || idx + 1}: ${mod.mainTopic} – ${(mod.subtopics || []).join(' – ')}`;
      children.push(new Paragraph({
        spacing: { after: 100 },
        children: [createText(line)],
      }));
    });
  }

  // 7. List of Experiments (Practical & TCP)
  if (isPractical || isTcp) {
    children.push(createHeading('List of Experiments with CO Mapping'));
    const expRows = [
      new TableRow({
        children: [
          createCell('Sl. No.', { bold: true, widthPercent: 10, fill: 'E5E7EB' }),
          createCell('Name of the Experiment', { bold: true, widthPercent: 55, fill: 'E5E7EB' }),
          createCell('Level', { bold: true, widthPercent: 15, fill: 'E5E7EB' }),
          createCell('COs Addressed', { bold: true, widthPercent: 20, fill: 'E5E7EB' }),
        ],
      }),
    ];
    (course.experiments || []).forEach((exp, idx) => {
      expRows.push(new TableRow({
        children: [
          createCell(String(exp.slNo || idx + 1), { widthPercent: 10 }),
          createCell(exp.name, { widthPercent: 55 }),
          createCell(`Level ${exp.level}`, { widthPercent: 15 }),
          createCell((exp.coNos || []).join(', '), { widthPercent: 20 }),
        ],
      }));
    });
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: expRows,
    }));
  }

  // 8. Learning Resources
  children.push(createHeading('Learning Resources'));
  children.push(new Paragraph({
    spacing: { after: 50 },
    children: [createText('Text Books:', { bold: true })],
  }));
  (course.textBooks || []).forEach((b, idx) => {
    children.push(new Paragraph({
      children: [
        createText(`${idx + 1}. ${b.authors}, `),
        createText(`"${b.title}"`, { italics: true }),
        createText(`, ${b.publisher || ''}, ${b.edition || ''}, ${b.year}.`),
      ],
    }));
  });

  children.push(new Paragraph({
    spacing: { before: 100, after: 50 },
    children: [createText('Reference Books & Web Resources:', { bold: true })],
  }));
  (course.referenceBooks || []).forEach((b, idx) => {
    children.push(new Paragraph({
      children: [
        createText(`${idx + 1}. ${b.authors}, `),
        createText(`"${b.title}"`, { italics: true }),
        createText(`, ${b.publisher || ''}, ${b.edition || ''}, ${b.year}.`),
      ],
    }));
  });

  // 9. SDG Alignment
  if (course.sdgActivities && course.sdgActivities.length > 0) {
    children.push(createHeading('SDG Alignment'));
    course.sdgActivities.forEach((act, idx) => {
      children.push(new Paragraph({
        children: [
          createText(`${idx + 1}. [SDG ${act.sdgNo}] ${act.activity} `),
          createText(`(Deliverable: ${act.deliverable}${act.linkedModuleNo ? `, Linked Module: ${act.linkedModuleNo}` : ''})`, { italics: true }),
        ],
      }));
    });
  }

  // 10. Lecture Schedule (Theory & TCP)
  if (isTheory || isTcp) {
    children.push(createHeading('Course Contents and Lecture Schedule'));

    if (course.lectureScheduleItems && course.lectureScheduleItems.length > 0) {
      const schedHeader = new TableRow({
        children: [
          createCell('Module No.', { bold: true, widthPercent: 15, fill: 'E5E7EB', align: AlignmentType.CENTER }),
          createCell('Topic', { bold: true, widthPercent: 65, fill: 'E5E7EB' }),
          createCell('No. of Lectures', { bold: true, widthPercent: 20, fill: 'E5E7EB', align: AlignmentType.CENTER }),
        ],
      });
      const schedRows = [schedHeader];
      let totalLectures = 0;
      course.lectureScheduleItems.forEach(item => {
        const isHeader = !item.moduleNo.includes('.');
        totalLectures += Number(item.periods) || 0;
        schedRows.push(new TableRow({
          children: [
            createCell(item.moduleNo, { bold: isHeader, widthPercent: 15, align: AlignmentType.CENTER }),
            createCell(item.topic, { bold: isHeader, widthPercent: 65 }),
            createCell(item.periods ? String(item.periods) : '-', { bold: isHeader, widthPercent: 20, align: AlignmentType.CENTER }),
          ],
        }));
      });
      schedRows.push(new TableRow({
        children: [
          createCell('Total No of Hours', { bold: true, widthPercent: 80, colSpan: 2, align: AlignmentType.RIGHT }),
          createCell(String(totalLectures), { bold: true, widthPercent: 20, align: AlignmentType.CENTER }),
        ],
      }));
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: schedRows,
      }));
    } else {
      const schedRows = [
        new TableRow({
          children: [
            createCell('Module No', { bold: true, widthPercent: 15, fill: 'E5E7EB' }),
            createCell('Topic', { bold: true, widthPercent: 55, fill: 'E5E7EB' }),
            createCell('No. of Periods', { bold: true, widthPercent: 15, fill: 'E5E7EB' }),
            ...(isTcp ? [createCell('Course Outcomes', { bold: true, widthPercent: 15, fill: 'E5E7EB' })] : []),
          ],
        }),
      ];
      let totalPeriods = 0;
      (course.modules || []).forEach((mod, idx) => {
        totalPeriods += Number(mod.periods) || 0;
        schedRows.push(new TableRow({
          children: [
            createCell(String(mod.moduleNo || idx + 1), { widthPercent: 15 }),
            createCell(mod.mainTopic, { widthPercent: 55 }),
            createCell(String(mod.periods || 0), { widthPercent: 15 }),
            ...(isTcp ? [createCell((mod.coMapping || []).join(', '), { widthPercent: 15 })] : []),
          ],
        }));
      });
      schedRows.push(new TableRow({
        children: [
          createCell('Total Periods', { bold: true, widthPercent: 15 }),
          createCell('', { widthPercent: 55 }),
          createCell(String(totalPeriods), { bold: true, widthPercent: 15 }),
          ...(isTcp ? [createCell('', { widthPercent: 15 })] : []),
        ],
      }));
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: schedRows,
      }));
    }
  }

  // 11. Annexure 1 for Practical courses
  if (isPractical && course.coursePlan && course.coursePlan.length > 0) {
    children.push(createHeading('Annexure – 1: Course Plan'));
    const planRows = [
      new TableRow({
        children: [
          createCell('Exp. No.', { bold: true, widthPercent: 10, fill: 'E5E7EB' }),
          createCell('Pre-Lab Activity', { bold: true, widthPercent: 30, fill: 'E5E7EB' }),
          createCell('In-Lab Activity', { bold: true, widthPercent: 30, fill: 'E5E7EB' }),
          createCell('Post-Lab Activity', { bold: true, widthPercent: 30, fill: 'E5E7EB' }),
        ],
      }),
    ];
    course.coursePlan.forEach(p => {
      planRows.push(new TableRow({
        children: [
          createCell(String(p.experimentNo), { widthPercent: 10 }),
          createCell(p.preLabActivity, { widthPercent: 30 }),
          createCell(p.inLabActivity, { widthPercent: 30 }),
          createCell(p.postLabActivity, { widthPercent: 30 }),
        ],
      }));
    });
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: planRows,
    }));

    // Assessment marks split table (sums to 75)
    children.push(createHeading('Plan for Assessment (Continuous Assessment: 75 Marks)'));
    const markRows = [
      new TableRow({
        children: [
          createCell('Exp. No.', { bold: true, fill: 'E5E7EB' }),
          createCell('Level (1/2/3)', { bold: true, fill: 'E5E7EB' }),
          createCell('Pre-Lab Marks', { bold: true, fill: 'E5E7EB' }),
          createCell('In-Lab Marks', { bold: true, fill: 'E5E7EB' }),
          createCell('Post-Lab Marks', { bold: true, fill: 'E5E7EB' }),
          createCell('Total Marks', { bold: true, fill: 'E5E7EB' }),
        ],
      }),
    ];
    course.coursePlan.forEach(p => {
      markRows.push(new TableRow({
        children: [
          createCell(String(p.experimentNo)),
          createCell(`Level ${p.level}`),
          createCell(String(p.preMarks)),
          createCell(String(p.inMarks)),
          createCell(String(p.postMarks)),
          createCell(String((p.preMarks || 0) + (p.inMarks || 0) + (p.postMarks || 0)), { bold: true }),
        ],
      }));
    });
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: markRows,
    }));
  }

  // 12. Course Designers
  children.push(createHeading('Course Designer(s):'));
  const designerRows = [
    new TableRow({
      children: [
        createCell('Name, Designation & Department', { bold: true, widthPercent: 60, fill: 'E5E7EB' }),
        createCell('Email ID', { bold: true, widthPercent: 40, fill: 'E5E7EB' }),
      ],
    }),
  ];
  (course.designers || []).forEach(des => {
    designerRows.push(new TableRow({
      children: [
        createCell(`${des.name}, ${des.designation}, ${des.department}`, { widthPercent: 60 }),
        createCell(des.email, { widthPercent: 40 }),
      ],
    }));
  });
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: designerRows,
  }));

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 inch = 1440 twips
          },
        },
        footers: { default: footer },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// Programme Compilation Bundle Generator
export async function generateProgrammeBundleDocx(bundleData: {
  programmeCode: string;
  programmeName: string;
  department: string;
  regulationYear: number;
  annexureNo: string;
  courses: Course[];
}): Promise<Buffer> {
  const { programmeCode, programmeName, regulationYear, annexureNo, courses } = bundleData;

  const configSetting = await ConfigSettingsModel.findOne({ key: 'acmText' });
  const footerText = configSetting?.value || 'Passed in BoS Meeting 01.06.2026 | Approved in 71st Academic Council Meeting 27.06.2026';

  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          createText(`${footerText} | Page `, { size: 18 }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18 }),
        ],
      }),
    ],
  });

  // Front Page
  const coverChildren = [
    new Paragraph({ spacing: { before: 2000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        createText(`ANNEXURE ${annexureNo}`, { bold: true, size: 32 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        createText(`CURRICULUM AND SYLLABI`, { bold: true, size: 28 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 },
      children: [
        createText(`FOR ${programmeName.toUpperCase()} (${programmeCode})`, { bold: true, size: 26 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        createText(`FOR THE STUDENTS ADMITTED FROM THE ACADEMIC YEAR ${regulationYear}–${(regulationYear + 1).toString().slice(-2)} ONWARDS`, { bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1000 },
      children: [
        createText(`Approved in 71st Academic Council Meeting 27.06.2026`, { italics: true, size: 20 }),
      ],
    }),
  ];

  // Document sections
  const sections = [
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children: coverChildren,
    },
  ];

  // For each course, compile its section
  for (const course of courses) {
    const courseBuffer = await generateDocxDocument(course);
    // Alternatively, we can build multi-section doc directly
  }

  // To build unified doc:
  const unifiedChildren: any[] = [...coverChildren];
  for (const course of courses) {
    unifiedChildren.push(new Paragraph({ pageBreakBefore: true }));
    // Append course table and contents
    const titleText = (course.courseName || '').toUpperCase();
    unifiedChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createCell(course.courseCode, { bold: true, widthPercent: 25, fill: 'F3F4F6' }),
              createCell(titleText, { bold: true, widthPercent: 75, fill: 'F3F4F6' }),
            ],
          }),
          new TableRow({
            children: [
              createCell('CATEGORY', { bold: true, widthPercent: 20 }),
              createCell('L', { bold: true, widthPercent: 10, align: AlignmentType.CENTER }),
              createCell('T', { bold: true, widthPercent: 10, align: AlignmentType.CENTER }),
              createCell('P', { bold: true, widthPercent: 10, align: AlignmentType.CENTER }),
              createCell('CREDIT', { bold: true, widthPercent: 20, align: AlignmentType.CENTER }),
            ],
          }),
          new TableRow({
            children: [
              createCell(course.categoryAbbr || 'PCC', { widthPercent: 20 }),
              createCell(String(course.L), { widthPercent: 10, align: AlignmentType.CENTER }),
              createCell(String(course.T), { widthPercent: 10, align: AlignmentType.CENTER }),
              createCell(String(course.P), { widthPercent: 10, align: AlignmentType.CENTER }),
              createCell(String(course.credits), { bold: true, widthPercent: 20, align: AlignmentType.CENTER }),
            ],
          }),
        ],
      })
    );

    unifiedChildren.push(createHeading('Preamble'));
    unifiedChildren.push(new Paragraph({ children: [createText(course.preamble || '')] }));

    unifiedChildren.push(createHeading('Course Outcomes'));
    const coRows = [
      new TableRow({
        children: [
          createCell('No.', { bold: true, widthPercent: 10, fill: 'E5E7EB' }),
          createCell('Course Outcome', { bold: true, widthPercent: 50, fill: 'E5E7EB' }),
          createCell('TPS Level', { bold: true, widthPercent: 15, fill: 'E5E7EB' }),
          createCell('Performance Indicator', { bold: true, widthPercent: 15, fill: 'E5E7EB' }),
          createCell('Weightage', { bold: true, widthPercent: 10, fill: 'E5E7EB' }),
        ],
      }),
    ];
    (course.courseOutcomes || []).forEach(co => {
      coRows.push(new TableRow({
        children: [
          createCell(co.coNo, { bold: true }),
          createCell(co.statement),
          createCell(`TPS ${co.tpsLevel}`),
          createCell(co.pi),
          createCell(`${co.weightage || 0}%`),
        ],
      }));
    });
    unifiedChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: coRows }));
  }

  const bundledDoc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        },
        footers: { default: footer },
        children: unifiedChildren,
      },
    ],
  });

  return await Packer.toBuffer(bundledDoc);
}

