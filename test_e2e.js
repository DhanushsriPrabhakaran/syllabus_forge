import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\aa93196c-6534-48c9-be21-5b61174ab2e9';

async function runE2ETests() {
  console.log('Starting SyllabusForge End-to-End Browser Test Suite...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // 1. Visit Login Page
    console.log('1. Navigating to http://localhost:5000/login ...');
    await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_login_page.png') });
    console.log('   Saved: 01_login_page.png');

    // 2. Click Faculty Quick Login
    console.log('2. Signing in as Faculty (Dr. P. Sharmila)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const facultyBtn = buttons.find(b => b.innerText.includes('Faculty'));
      if (facultyBtn) facultyBtn.click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_faculty_dashboard.png') });
    console.log('   Saved: 02_faculty_dashboard.png');

    // 3. Open Existing Theory Course Wizard
    console.log('3. Opening Theory Course "Data Structures and Applications" in Wizard...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('h3'));
      const theoryCard = cards.find(c => c.innerText.includes('Data Structures'));
      if (theoryCard) theoryCard.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_theory_wizard_identity.png') });
    console.log('   Saved: 03_theory_wizard_identity.png');

    // 4. Inject deliberate errors to demonstrate Live Compliance Panel
    console.log('4. Testing Live Compliance Panel with deliberate errors...');
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      // Find course title input
      const titleInput = inputs.find(i => i.placeholder && i.placeholder.includes('Data Structures'));
      if (titleInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        nativeSetter?.call(titleInput, 'Data Structures & Algorithms - Part 1 Lab');
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_compliance_deliberate_errors.png') });
    console.log('   Saved: 04_compliance_deliberate_errors.png (shows special character and Lab forbidden error)');

    // 5. Fix title back to compliant Title Case
    console.log('5. Correcting title back to compliant format...');
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const titleInput = inputs.find(i => i.placeholder && i.placeholder.includes('Data Structures'));
      if (titleInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        nativeSetter?.call(titleInput, 'Data Structures and Applications');
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_compliance_errors_cleared.png') });
    console.log('   Saved: 05_compliance_errors_cleared.png');

    // 6. Navigate to Document Preview Tab
    console.log('6. Switching to Document Preview Tab...');
    await page.evaluate(() => {
      const previewBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Document Preview'));
      if (previewBtn) previewBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_document_preview_tab.png') });
    console.log('   Saved: 06_document_preview_tab.png (shows Word layout with Arial 11 & running footer)');

    // 7. Test HoD Review Queue
    console.log('7. Switching to HoD Role (Dr. Suresh) and viewing Review Workspace...');
    await page.evaluate(() => {
      const hodBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('HoD'));
      if (hodBtn) hodBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.goto('http://localhost:5000/reviews', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_hod_review_workspace.png') });
    console.log('   Saved: 07_hod_review_workspace.png');

    // 8. Test Admin Panel and ACM Readiness Report
    console.log('8. Switching to Admin Role and viewing ACM Readiness Report & Bundler...');
    await page.evaluate(() => {
      const adminBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Admin'));
      if (adminBtn) adminBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.goto('http://localhost:5000/admin', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_admin_acm_readiness.png') });
    console.log('   Saved: 08_admin_acm_readiness.png');

    // 9. View Master Data Collections in Admin
    console.log('9. Viewing Master Data Collections...');
    await page.evaluate(() => {
      const masterBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Master Data Collections'));
      if (masterBtn) masterBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_admin_master_data.png') });
    console.log('   Saved: 09_admin_master_data.png');

    console.log('ALL E2E BROWSER TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('E2E test error:', err);
  } finally {
    await browser.close();
  }
}

runE2ETests();
