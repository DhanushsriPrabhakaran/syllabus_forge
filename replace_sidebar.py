import sys
content = open('client/src/pages/CourseWizard.tsx', 'r', encoding='utf-8').read()

old_block = '''            <>
              {/* Left Stepper List */}
              <div className="w-64 flex-shrink-0 hidden md:block">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs sticky top-36">'''

new_block = '''            <>
              {/* Left Stepper List */}
              <div className={lex-shrink-0 transition-all duration-300  hidden md:block relative}>
                {!isSidebarOpen ? (
                  <button onClick={() => setIsSidebarOpen(true)} className="sticky top-36 bg-white border border-slate-200 p-2 rounded-r-xl shadow-xs hover:bg-slate-50">
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                ) : (
                  <div className="w-64">
                    <button onClick={() => setIsSidebarOpen(false)} className="absolute -right-3 top-10 bg-white border border-slate-200 p-1 rounded-full shadow-sm hover:bg-slate-50 z-10">
                      <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs sticky top-36">'''

content = content.replace(old_block, new_block)

with open('client/src/pages/CourseWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
