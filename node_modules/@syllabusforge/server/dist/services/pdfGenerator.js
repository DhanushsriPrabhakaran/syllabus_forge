import puppeteer from 'puppeteer';
import { ConfigSettingsModel } from '../models/MasterData.js';
export async function generatePdfDocument(course) {
    const configSetting = await ConfigSettingsModel.findOne({ key: 'acmText' });
    const footerText = configSetting?.value || 'Passed in BoS Meeting 01.06.2026 | Approved in 71st Academic Council Meeting 27.06.2026';
    const titleCaps = (course.courseName || '').toUpperCase();
    const isTheory = course.courseType === 'THEORY';
    const isPractical = course.courseType === 'PRACTICAL';
    const isTcp = course.courseType === 'TCP';
    // Build HTML representation mirroring docx
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4;
    margin: 25mm 20mm 25mm 20mm;
    @bottom-right {
      content: "${footerText}";
      font-family: Arial, sans-serif;
      font-size: 9pt;
      color: #555;
    }
  }
  body {
    font-family: Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.25;
    color: #111827;
    margin: 0;
    padding: 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    font-size: 10pt;
  }
  th, td {
    border: 1px solid #6b7280;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background-color: #f3f4f6;
    font-weight: bold;
  }
  .center {
    text-align: center;
  }
  h3 {
    font-size: 11pt;
    font-weight: bold;
    margin-top: 14px;
    margin-bottom: 6px;
    text-transform: uppercase;
      background-color: #E5E7EB;
      padding: 4px;
  }
  .footer-note {
    position: fixed;
    bottom: -15mm;
    right: 0;
    font-size: 9pt;
    color: #4b5563;
  }
</style>
</head>
<body>
  <div class="footer-note">${footerText}</div>

  <!-- Header Table: Aligned with MCA Format -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10pt;">
    <tr>
      <td rowspan="2" style="width: 16%; font-weight: bold; vertical-align: middle; background-color: #f9fafb; text-align: center;">${course.courseCode}</td>
      <td rowspan="2" style="width: 44%; font-weight: bold; vertical-align: middle; font-size: 10.5pt; text-transform: uppercase;
      background-color: #E5E7EB;
      padding: 4px; background-color: #f9fafb;">${titleCaps}</td>
      <th style="width: 14%; text-align: center; background-color: #f3f4f6; font-size: 9pt;">CATEGORY</th>
      <th style="width: 6.5%; text-align: center; background-color: #f3f4f6; font-size: 9pt;">L</th>
      <th style="width: 6.5%; text-align: center; background-color: #f3f4f6; font-size: 9pt;">T</th>
      <th style="width: 6.5%; text-align: center; background-color: #f3f4f6; font-size: 9pt;">P</th>
      <th style="width: 6.5%; text-align: center; background-color: #f3f4f6; font-size: 9pt;">CREDIT</th>
      ${isTcp ? `<th style="width: 10%; text-align: center; background-color: #f3f4f6; font-size: 9pt;">TE TYPE</th>` : ''}
    </tr>
    <tr>
      <td style="text-align: center; font-weight: 500;">${course.categoryAbbr || 'PCC'}</td>
      <td style="text-align: center;">${course.L}</td>
      <td style="text-align: center;">${course.T}</td>
      <td style="text-align: center;">${course.P}</td>
      <td style="text-align: center; font-weight: bold;">${course.credits}</td>
      ${isTcp ? `<td style="text-align: center; font-weight: bold;">${course.teExamType || 'TCP-T'}</td>` : ''}
    </tr>
  </table>

  <h3>Preamble</h3>
  <p>${course.preamble || ''}</p>

  <h3>Prerequisite</h3>
  <p>${typeof course.prerequisites === 'string' ? course.prerequisites : 'Nil'}</p>

  <h3>Course Outcomes</h3>
  <p>On the successful completion of the course, students will be able to:</p>
  <table>
    <thead>
      <tr>
        <th style="width: 8%;">No.</th>
        <th style="width: 46%;">Course Outcome</th>
        <th style="width: 12%;">${isTcp ? 'TCE Proficiency Scale' : 'TPS Level'}</th>
        <th style="width: 14%;">Performance Indicator</th>
        ${isTheory || isTcp ? '<th style="width: 10%;">CO Weightage</th>' : ''}
        ${isPractical ? '<th style="width: 10%;">Objective</th>' : ''}
        <th style="width: 10%;">SDG Addressed</th>
        <th style="width: 10%;">SDG Level</th>
      </tr>
    </thead>
    <tbody>
      ${(course.courseOutcomes || []).map(co => `
        <tr>
          <td><strong>${co.coNo}</strong></td>
          <td>${co.statement}</td>
          <td>TPS ${co.tpsLevel}</td>
          <td>${co.pi}</td>
          ${isTheory || isTcp ? `<td>${co.weightage || 0}%</td>` : ''}
          ${isPractical ? `<td>${co.objectiveNo ? 'Obj. ' + co.objectiveNo : '-'}</td>` : ''}
          <td>${co.sdgNo || 'NC'}</td>
          <td>${co.sdgLevel || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3>Mapping with Programme Outcomes and Programme Specific Outcomes</h3>
  <table style="text-align: center; font-size: 9pt;">
    <thead>
      <tr>
        <th style="width: 8%;">COs</th>
        <th>PO1</th><th>PO2</th><th>PO3</th><th>PO4</th><th>PO5</th><th>PO6</th>
        <th>PO7</th><th>PO8</th><th>PO9</th><th>PO10</th><th>PO11</th><th>PO12</th>
        <th>PSO1</th><th>PSO2</th><th>PSO3</th>
      </tr>
    </thead>
    <tbody>
      ${((course.poPsoMapping && course.poPsoMapping.length > 0)
        ? course.poPsoMapping
        : (course.courseOutcomes || []).map(c => ({ coNo: c.coNo }))).map(row => `
        <tr>
          <td><strong>${row.coNo}</strong></td>
          <td>${row.po1 || '-'}</td>
          <td>${row.po2 || '-'}</td>
          <td>${row.po3 || '-'}</td>
          <td>${row.po4 || '-'}</td>
          <td>${row.po5 || '-'}</td>
          <td>${row.po6 || '-'}</td>
          <td>${row.po7 || '-'}</td>
          <td>${row.po8 || '-'}</td>
          <td>${row.po9 || '-'}</td>
          <td>${row.po10 || '-'}</td>
          <td>${row.po11 || '-'}</td>
          <td>${row.po12 || '-'}</td>
          <td>${row.pso1 || '-'}</td>
          <td>${row.pso2 || '-'}</td>
          <td>${row.pso3 || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <p style="font-size: 8.5pt; color: #4b5563; font-style: italic; margin-top: -6px; margin-bottom: 14px;">
    S - Strong; M - Medium; L - Low
  </p>

  ${isTheory ? `
    <h3>Assessment Pattern: Cognitive Domain</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 28%;">Cognitive Levels</th>
          <th colspan="3" style="text-align: center;">Continuous Assessment Tests<br><small style="font-weight: normal;">1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 3</small></th>
          <th style="width: 24%; text-align: center;">Terminal Examination</th>
        </tr>
      </thead>
      <tbody>
        ${((course.cognitiveAssessmentPattern && course.cognitiveAssessmentPattern.length > 0)
        ? course.cognitiveAssessmentPattern
        : [
            { level: 'Remember', cat1: 10, cat2: 10, cat3: 10, terminalExam: 10 },
            { level: 'Understand', cat1: 30, cat2: 30, cat3: 10, terminalExam: 10 },
            { level: 'Apply', cat1: 60, cat2: 60, cat3: 80, terminalExam: 80 },
            { level: 'Analyze', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
            { level: 'Evaluate', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
            { level: 'Create', cat1: 0, cat2: 0, cat3: 0, terminalExam: 0 },
        ]).map(r => `
          <tr>
            <td><strong>${r.level}</strong></td>
            <td style="text-align: center;">${r.cat1}</td>
            <td style="text-align: center;">${r.cat2}</td>
            <td style="text-align: center;">${r.cat3}</td>
            <td style="text-align: center;">${r.terminalExam}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${course.courseAssessmentQuestions && course.courseAssessmentQuestions.length > 0 ? `
      <h3>Course Level Assessment Questions</h3>
      ${course.courseAssessmentQuestions.map(g => `
        <div style="margin-bottom: 10px;">
          <strong style="color: #1f2937;">Course Outcome ${g.coNo}:</strong>
          <ol style="margin: 4px 0 8px 18px; padding-left: 0;">
            ${(g.questions || []).map(q => `<li style="margin-bottom: 4px; text-align: justify;">${q}</li>`).join('')}
          </ol>
        </div>
      `).join('')}
    ` : ''}
  ` : ''}

  ${(isTheory || isTcp) ? `
    <h3>Concept Map</h3>
    ${course.conceptMapImage ? `
      <div style="text-align: center; margin: 12px 0;">
        <img src="${course.conceptMapImage}" style="max-width: 95%; max-height: 280px; border: 1px solid #d1d5db; border-radius: 6px;" alt="Concept Map" />
      </div>
    ` : `
      <p style="font-style: italic; color: #6b7280;">(Concept Map pending upload by faculty)</p>
    `}
  ` : ''}

  ${isPractical ? `
    <h3>Assessment Pattern</h3>
    <table>
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
          <td><strong>75</strong></td>
          <td>Conducted throughout the semester.</td>
        </tr>
        <tr>
          <td>Model Test</td>
          <td>CO-wise (Cognitive, Psychomotor, Affective)</td>
          <td><strong>25</strong></td>
          <td>Rubrics considering all three domains.</td>
        </tr>
        <tr>
          <td><strong>Total Internal Marks</strong></td>
          <td></td>
          <td><strong>100</strong></td>
          <td></td>
        </tr>
        <tr>
          <td>End Semester Examination</td>
          <td>CO-wise (Cognitive, Psychomotor, Affective)</td>
          <td><strong>100</strong></td>
          <td>Rubrics considering all three domains.</td>
        </tr>
      </tbody>
    </table>
  ` : ''}

  ${(isTheory || isTcp) && course.modules && course.modules.length > 0 ? `
    <h3>Syllabus</h3>
    ${course.modules.map((m, idx) => `
      <p><strong>Module ${m.moduleNo || idx + 1}:</strong> ${m.mainTopic} – ${(m.subtopics || []).join(' – ')}</p>
    `).join('')}
  ` : ''}

  ${(isPractical || isTcp) && course.experiments && course.experiments.length > 0 ? `
    <h3>List of Experiments with CO Mapping</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 10%;">Sl. No.</th>
          <th style="width: 60%;">Name of the Experiment</th>
          <th style="width: 15%;">Level</th>
          <th style="width: 15%;">COs Addressed</th>
        </tr>
      </thead>
      <tbody>
        ${course.experiments.map((e, idx) => `
          <tr>
            <td>${e.slNo || idx + 1}</td>
            <td>${e.name}</td>
            <td>Level ${e.level}</td>
            <td>${(e.coNos || []).join(', ')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <h3>Learning Resources</h3>
  <p><strong>Text Books:</strong></p>
  <ol>
    ${(course.textBooks || []).map(b => `
      <li>${b.authors}, <em>"${b.title}"</em>, ${b.publisher || ''}, ${b.edition || ''}, ${b.year}.</li>
    `).join('')}
  </ol>
  <p><strong>Reference Books & Web Resources:</strong></p>
  <ol>
    ${(course.referenceBooks || []).map(b => `
      <li>${b.authors}, <em>"${b.title}"</em>, ${b.publisher || ''}, ${b.edition || ''}, ${b.year}.</li>
    `).join('')}
  </ol>

  ${course.sdgActivities && course.sdgActivities.length > 0 ? `
    <h3>SDG Alignment</h3>
    <ol>
      ${course.sdgActivities.map(a => `
        <li>[SDG ${a.sdgNo}] ${a.activity} (<em>Deliverable: ${a.deliverable}</em>)</li>
      `).join('')}
    </ol>
  ` : ''}

  ${(isTheory || isTcp) ? `
    <h3>Course Contents and Lecture Schedule</h3>
    ${(course.lectureScheduleItems && course.lectureScheduleItems.length > 0) ? `
      <table>
        <thead>
          <tr>
            <th style="width: 15%; text-align: center;">Module No.</th>
            <th style="width: 65%;">Topic</th>
            <th style="width: 20%; text-align: center;">No. of Lectures</th>
          </tr>
        </thead>
        <tbody>
          ${course.lectureScheduleItems.map(item => {
        const isHeader = !item.moduleNo.includes('.');
        return `
              <tr style="${isHeader ? 'background-color: #f9fafb; font-weight: bold;' : ''}">
                <td style="text-align: center;">${item.moduleNo}</td>
                <td style="${isHeader ? '' : 'padding-left: 16px;'}">${item.topic}</td>
                <td style="text-align: center;">${item.periods || '-'}</td>
              </tr>
            `;
    }).join('')}
          <tr style="font-weight: bold; background-color: #f3f4f6;">
            <td colspan="2" style="text-align: right; padding-right: 14px;">Total No of Hours</td>
            <td style="text-align: center;">
              ${course.lectureScheduleItems.reduce((acc, curr) => acc + (Number(curr.periods) || 0), 0)}
            </td>
          </tr>
        </tbody>
      </table>
    ` : (course.modules && course.modules.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Module No</th>
            <th>Topic</th>
            <th>No. of Periods</th>
            ${isTcp ? '<th>Course Outcomes</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${course.modules.map((m, idx) => `
            <tr>
              <td>${m.moduleNo || idx + 1}</td>
              <td>${m.mainTopic}</td>
              <td>${m.periods || 0}</td>
              ${isTcp ? `<td>${(m.coMapping || []).join(', ')}</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '')}
  ` : ''}

  <h3>Course Designer(s):</h3>
  <table>
    <thead>
      <tr>
        <th>Name, Designation & Department</th>
        <th>Email ID</th>
      </tr>
    </thead>
    <tbody>
      ${(course.designers || []).map(d => `
        <tr>
          <td>${d.name}, ${d.designation}, ${d.department}</td>
          <td>${d.email}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `;
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '20mm',
                bottom: '25mm',
                left: '20mm',
                right: '20mm',
            },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
        <div style="font-family: Arial, sans-serif; font-size: 9pt; width: 100%; text-align: right; padding-right: 20mm; color: #555;">
          ${footerText} | Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
        });
        return Buffer.from(pdfBuffer);
    }
    finally {
        await browser.close();
    }
}
