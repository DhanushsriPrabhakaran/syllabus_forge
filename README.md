# SyllabusForge — Institutional Curriculum & Syllabus Engineering System

**SyllabusForge** is an institutional-grade, MERN-stack web application designed for universities to author, validate, review, and compile curriculum syllabi for **Regulation 2026**. It enforces every institutional guideline from the university regulations, guides faculty with real-time feedback, and produces publication-ready `.docx` and `.pdf` documents adhering strictly to Academic Council Meeting (ACM) standards.

---

## 🚀 Key Highlights & Architectural Features

1. **Shared Pure Validation Engine (`/shared`)**
   - Independent TypeScript engine imported by both frontend and backend.
   - Comprehensive test suite with **50 unit tests in Vitest** covering **100% of Section B institutional rules (B1 to B13)**.
   - Zero hard-coded assumptions: tolerances, assessment component weights, and category mappings are configurable in Master Data.

2. **Multi-Step Wizard Engine with Live Compliance Diagnostic**
   - Left sidebar with section completion ticks and step navigation.
   - Central form with inline helpers: TPS action verb suggestion dictionary, live word counter (60–90 words), character counters, and proportional weightage auto-suggester.
   - Right-hand sticky **Live Compliance Panel** providing instant pass / warn / fail status with plain-language fix hints and click-to-fix navigation.
   - **Document Preview Tab**: WYSIWYG view rendering the syllabus in the exact final Word layout (Arial 11, uppercase bold titles, autofit tables, and running BoS/ACM footer).
   - Automatic debounced draft saving every few seconds with instant timestamp feedback.

3. **Multi-Template Support**
   - **Theory Course**: 6–8 COs ($\ge 70\%$ at TPS $\ge 3$), CAT1/Assign1/CAT2/Assign2/Terminal assessment matrix, textbook recency checks, and auto-evaluated 17-point ACM compliance checklist.
   - **Practical (Laboratory) Course**: General CO Pool (Cognitive C1–C5, Affective A1–A7, Psychomotor P1–P6), 13 lab objectives reference, Schwab/Herron openness levels (1/2/3), Annexure 1 Course Plan (Pre/In/Post lab activity chips), and 75-mark continuous assessment split.
   - **Theory cum Practical (TCP)**: Combined theory and lab contact hours, TE Type selector (TCP-T or TCP-P), continuous assessment weightage lookup table, combined COs with PO6–PO11 mapping, and dual assessment matrices.

4. **Review & Governance Workflow**
   - States: `DRAFT` $\to$ `SUBMITTED` $\to$ `RETURNED` / `APPROVED` $\to$ `FINALIZED` (Locked).
   - Role-Based Access Control (RBAC): Faculty, HoD/Reviewer, and Academic Administrator.
   - Department Review Workspace with side-by-side document preview and section-anchored comments.
   - Course versioning: Revision cloning creates a new course record, increments the version digit $V$ in the course code (e.g. `26CACA0` $\to$ `26CACA1`), and preserves audit history.

5. **ACM Export & Programme Compilation Bundler**
   - Pixel-perfect Word (`.docx`) export using `docx` npm library with Arial 11 pt, 1-inch margins, autofit tables, and Arial 9 pt BoS/ACM footer.
   - High-fidelity PDF export via Puppeteer.
   - **Programme Bundler**: Compiles all approved syllabi for a programme and semester range into a single `.docx` file (`Annexure xx - <Programme>.docx`) with standard front cover page.
   - **ACM Readiness Report**: Pre-submission audit verifying all cross-document consistency rules across an entire academic programme.

---

## 🛠️ Tech Stack & Monorepo Structure

- **Monorepo**:
  - `/shared`: Pure TypeScript validation engine, types, constants, and Vitest test suite.
  - `/server`: Node.js, Express, Mongoose (MongoDB ODM), JWT authentication, bcryptjs, Puppeteer, docx generator.
  - `/client`: React 18, Vite, Tailwind CSS, React Router v6, TanStack Query, Lucide icons.
- **Database**: MongoDB (local service or MongoDB Atlas).

```
/syllabusforge
├── client/                 # React 18 frontend (Vite + Tailwind CSS)
│   ├── src/components/     # Navbar, LiveCompliancePanel, DocumentPreview
│   ├── src/pages/          # Dashboard, CourseWizard, ReviewWorkspace, AdminDashboard, Login
│   └── src/services/       # API client
├── server/                 # Express backend & Mongoose ODM
│   ├── src/models/         # User, Programme, Course, MasterData schemas
│   ├── src/routes/         # Auth, Courses, Master, Programmes
│   ├── src/services/       # DOCX generator, PDF generator, seed data
│   └── src/scripts/        # Database seeder (seed.ts)
└── shared/                 # Pure TypeScript validation engine & constants
    ├── src/constants.ts    # Institutional codes, verbs, objectives, SDGs
    ├── src/validation.ts   # Rules B1 to B13 implementation
    └── src/validation.test.ts # 50 unit tests
```

---

## 📋 Institutional Rules Enforced (/shared/src/validation.ts)

| Rule ID | Guideline Area | Description & Enforcement |
|---------|----------------|---------------------------|
| **B1** | Course Name | Alphanumeric and spaces only (no hyphens, ampersands, colons). Max 60 characters, Title Case. Standalone "Lab" rejected (auto-suggest "Laboratory"). Practical course must end with "Laboratory". |
| **B2** | Course Code | $RR\ AA\ C\ U\ V$ format (e.g. `26CACA0`). $RR = 26$, $AA \in \text{ProgrammeCodes}$, $C \in \text{CategoryCodes}$, $U \in [A-Z] \setminus \{I, O\}$, $V \in [0-9]$. Uniqueness enforced within programme. |
| **B3** | LTP & Credits | $\text{Credits} = L + T + P/2$. Practical requires $L=0, T=0$. Computed read-only. |
| **B4** | Preamble | Single paragraph, 3–4 lines, 60–90 words. Rejects cliches ("This course covers important topics", "Students will learn about") and verbatim CO copies. |
| **B5** | Course Outcomes | Theory: 6–8 COs, $\ge 70\%$ at TPS $\ge 3$, no TPS 1. CO verbs match TPS dictionary. PI format $x.y.z$ matching CO TPS level. Weightage sums to 100%, 8–20% each, non-uniform, higher TPS $\implies$ higher weightage. Practical: Cognitive 2–4, Affective 2–3, Psychomotor 2–3. TCP: $\ge 2$ COs addressing PO6–PO11. |
| **B6** | Assessment Pattern | Columns (CAT1, Assign1, CAT2, Assign2, Terminal) each sum to 100%. CO share matches weightage within $\pm 3\%$ tolerance. Question split $\ge 70\%$ own TPS, $\le 30\%$ lower TPS. Practical fixed at 75 CA + 25 Model = 100 Internal, 100 ESE. |
| **B7** | Syllabus Modules | Ordered subtopics formatted as "Topic – Subtopic". Every CO covered by at least one module. |
| **B8** | Lab Experiments | Openness levels 1/2/3, objectives 1–13, CO mapping. Annexure 1 Pre/In/Post lab marks sum to 75. |
| **B9** | Lecture Schedule | Theory periods equal $12 \times \text{Credits}$. TCP period check. |
| **B10** | Learning Resources | 1–2 Textbooks, 3–6 Reference books. Mandatory publication year. 5-year recency rule for Advanced/Electives. |
| **B11** | SDG Alignment | Active SDGs must have concrete academic activity, deliverable (Report, Presentation, etc.), and linked module. |
| **B12** | Designers & Prereqs | Valid institutional email and department. Prerequisites catalog or "Nil". |
| **B13** | Compliance Checklist | 17-point auto-evaluated theory checklist. |

---

## 🔑 Demo User Credentials

The database seed script configures 3 standard personas for instant testing:

| Role | Name | Email | Password | Access / Department |
|------|------|-------|----------|---------------------|
| **Faculty** | Dr. P. Sharmila | `psaca@tce.edu` | `FacultyPassword2026!` | Computer Applications (CA) |
| **HoD / Reviewer** | Dr. K. Suresh | `hod.ca@syllabusforge.edu` | `HodPassword2026!` | Department Review Queue |
| **Administrator** | Dean Academics | `admin@syllabusforge.edu` | `AdminPassword2026!` | All Programmes & ACM Panel |

*Tip: You can switch between personas with 1-click in the top navigation bar!*

---

## 🏃 Run Instructions

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally on `localhost:27017`

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Unit Tests (Shared Validation Engine)
```bash
npm test
# Runs 50 comprehensive Vitest tests across all Section B rules
```

### 4. Seed Database
```bash
npm run seed
# Populates institutional master data and 3 compliant demo courses (Theory, Practical, TCP)
```

### 5. Start the Application

You have three simple ways to start the project:

#### Option A: One-Click Windows Launcher (Easiest)
Simply double-click **`start.bat`** in the project folder. It will ensure MongoDB is running, open `http://localhost:5000` in your default browser, and start the app automatically.

#### Option B: Single Terminal Command
From the project root (`D:\project`):
```bash
npm start
```
This launches the server and automatically serves the full React frontend and API on **`http://localhost:5000`**.

#### Option C: Full Development Mode (Hot-Reloading)
To edit frontend or backend code with instant live reload:
```bash
npm run dev
```
This runs Vite on `http://localhost:3000` (with HMR and auto-proxying) and the Express API server on `http://localhost:5000`.

### 6. Stop the Application
- **Terminal Keyboard Shortcut**: In the terminal window where the app is running, press `Ctrl + C` (type `Y` if prompted to terminate batch job).
- **One-Click Stop**: Double-click **`stop.bat`** in `D:\project` to terminate any running server processes on ports 5000 and 3000.
- **PowerShell Command**:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force -ErrorAction SilentlyContinue
  ```

---

## 📄 Export & Verification Features

- **Direct Export**: In the Course Wizard, switch to the "Document Preview" tab and click **"Export .docx"** or **"Export PDF"**.
- **Programme Compilation**: In the Admin Dashboard under "Programme Bundler", select a programme (e.g. CA), regulation (2026), and semester range to download `Annexure 01 - CA.docx` with official front page.
- **ACM Readiness Report**: In the Admin Dashboard under "ACM Readiness Report", view a complete audit of all course codes, titles, and syllabus components for Academic Council submission.

---

## ⚖️ Documented Guideline Assumptions & Resolutions

1. **TPS 1 Discrepancy**: The Theory syllabus format footer mentions "TPS1–TPS5", while Section 3.2 explicitly dictates "At least 70% of COs >= TPS 3. Remaining (up to 30%) at TPS 2 (NOT in TPS 1)." **Resolution**: Default disallows TPS 1 for theory courses; configurable via `ConfigSettings.allowTps1`.
2. **Lab Assessment Plan Marks vs. Level Table**: In Annexure 1 sample table, rows do not sum to 75 (20/30/25=75, 15/35/20=70, 10/40/15=65). **Resolution**: Default follows Section 8 Table 9 where every row strictly sums to 75 marks (Level 1: 20/35/20; Level 2: 15/30/30; Level 3: 10/25/40).
3. **TCP Lecture Schedule Period Rule**: The guideline specifies $12 \times \text{Credits}$ for theory courses, but does not state whether practical credits count towards lecture periods in TCP. **Resolution**: Theory requires exact $12 \times \text{Credits}$ match; TCP issues an advisory warning.
4. **Assessment Component Weights**: Theory guideline defines 5 columns each totaling 100% and checks overall CO share against CO weightage. **Resolution**: Weights are admin-configurable in `AssessmentComponentWeights` (default: CAT1=15, Assign1=10, CAT2=15, Assign2=10, Terminal=50) with $\pm 3\%$ tolerance.

