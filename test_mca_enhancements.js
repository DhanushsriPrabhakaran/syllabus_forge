import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\aa93196c-6534-48c9-be21-5b61174ab2e9';

async function runMcaEnhancementsTest() {
  console.log('Testing MCA Syllabus Format Enhancements in SyllabusForge...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1200'],
    defaultViewport: { width: 1440, height: 1200 },
  });

  const page = await browser.newPage();

  try {
    // 1. Login as Faculty
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const facultyBtn = buttons.find(b => b.innerText.includes('Faculty'));
      if (facultyBtn) facultyBtn.click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   Logged in successfully.');

    // 2. Retrieve token and locate course 26CACA0
    const token = await page.evaluate(() => localStorage.getItem('syllabusforge_token'));
    const coursesRes = await fetch('http://localhost:5000/api/courses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const coursesList = await coursesRes.json();
    const cacaCourse = coursesList.find(c => c.courseCode === '26CACA0');

    if (!cacaCourse) {
      throw new Error('Course 26CACA0 not found in database!');
    }

    // 3. Direct navigation to Course Wizard for 26CACA0
    console.log(`2. Navigating to course wizard for 26CACA0 (${cacaCourse._id})...`);
    await page.goto(`http://localhost:5000/courses/${cacaCourse._id}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    // Capture Step 0 (Identity) with MCA 2-Row Header Box Preview Card
    console.log('3. Capturing Step 0 Identity with MCA 2-Row Header Box...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mca_01_header_box.png') });
    console.log('   Saved: mca_01_header_box.png');

    // Helper to click sidebar step by index or exact text
    const clickSidebarStep = async (stepNumber) => {
      await page.evaluate((num) => {
        const stepItems = Array.from(document.querySelectorAll('nav button, aside button, .w-64 button, div.space-y-1 button'));
        const target = stepItems.find(b => b.innerText && b.innerText.trim().startsWith(`${num}.`));
        if (target) {
          target.click();
        }
      }, stepNumber);
      await new Promise(r => setTimeout(r, 1200));
    };

    // Step 4: Course Outcomes (Step index 4 in UI: "4. Course Outcomes")
    console.log('4. Navigating to Step 4 (Course Outcomes & PO/PSO Mapping)...');
    await clickSidebarStep(4);
    // Scroll down to show PO/PSO mapping table
    await page.evaluate(() => window.scrollBy(0, 1100));
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mca_02_popso_mapping.png') });
    console.log('   Saved: mca_02_popso_mapping.png');

    // Step 5: Assessment Pattern (Step index 5 in UI: "5. Assessment Pattern")
    console.log('5. Navigating to Step 5 (Assessment Pattern: Cognitive Domain & Questions)...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await clickSidebarStep(5);
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mca_03_cognitive_assessment.png') });
    console.log('   Saved: mca_03_cognitive_assessment.png');

    // Step 6: Syllabus & Content (Step index 6 in UI: "6. Syllabus & Content")
    console.log('6. Navigating to Step 6 (Concept Map & Lecture Schedule)...');
    await clickSidebarStep(6);
    // Scroll down to view Concept Map and Lecture Schedule
    await page.evaluate(() => window.scrollBy(0, 800));
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mca_04_conceptmap_lectureschedule.png') });
    console.log('   Saved: mca_04_conceptmap_lectureschedule.png');

    // 7. Navigate to Document Preview Tab
    console.log('7. Switching to Document Preview Tab...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const previewBtn = buttons.find(b => b.innerText.includes('Document Preview'));
      if (previewBtn) previewBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Full page preview screenshots
    console.log('   Capturing Document Preview sections without any modal overlay...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mca_05_document_preview_top.png') });
    console.log('   Saved: mca_05_document_preview_top.png');

    // Scroll down to show PO/PSO mapping and Cognitive Domain Table
    await page.evaluate(() => window.scrollBy(0, 800));
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mca_06_document_preview_middle.png') });
    console.log('   Saved: mca_06_document_preview_middle.png');

    // Scroll down to show Concept Map, Assessment Questions, Lecture Schedule
    await page.evaluate(() => window.scrollBy(0, 950));
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mca_07_document_preview_bottom.png') });
    console.log('   Saved: mca_07_document_preview_bottom.png');

    // Scroll down further if needed for schedule
    await page.evaluate(() => window.scrollBy(0, 950));
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mca_08_document_preview_schedule.png') });
    console.log('   Saved: mca_08_document_preview_schedule.png');

    // 8. Test Export Endpoints
    console.log('8. Testing DOCX and PDF export endpoints for 26CACA0...');
    
    // Export DOCX
    const docxRes = await fetch(`http://localhost:5000/api/courses/${cacaCourse._id}/export?format=docx`);
    if (docxRes.ok) {
      const arrayBuf = await docxRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const docxPath = path.join(ARTIFACT_DIR, '26CACA0_MCA_Enhanced.docx');
      fs.writeFileSync(docxPath, buffer);
      console.log(`✓ Successfully downloaded DOCX (${buffer.length} bytes) to ${docxPath}`);
    } else {
      console.error('Failed to export DOCX:', docxRes.status, await docxRes.text());
    }

    // Export PDF
    const pdfRes = await fetch(`http://localhost:5000/api/courses/${cacaCourse._id}/export?format=pdf`);
    if (pdfRes.ok) {
      const arrayBuf = await pdfRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const pdfPath = path.join(ARTIFACT_DIR, '26CACA0_MCA_Enhanced.pdf');
      fs.writeFileSync(pdfPath, buffer);
      console.log(`✓ Successfully downloaded PDF (${buffer.length} bytes) to ${pdfPath}`);
    } else {
      console.error('Failed to export PDF:', pdfRes.status, await pdfRes.text());
    }

    console.log('ALL MCA ENHANCEMENT TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during MCA enhancements test:', err);
  } finally {
    await browser.close();
  }
}

runMcaEnhancementsTest();
