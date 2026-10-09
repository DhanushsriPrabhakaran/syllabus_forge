import sys
content = open('client/src/components/Navbar.tsx', 'r', encoding='utf-8').read()

old_block = '''              <button
                onClick={() => handleSelectType('TCP')}
                className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                  TCP
                </div>
                <div>
                  <div className="font-semibold text-slate-900 group-hover:text-indigo-700">3. Theory cum Practical (TCP)</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Combined theory & lab contact hours. TE type (TCP-T or TCP-P), continuous assessment weightage table, combined COs with PO6-PO11 mapping.
                  </div>
                </div>
              </button>
            </div>'''

new_block = '''              <button
                onClick={() => handleSelectType('TCP')}
                className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                  TCP
                </div>
                <div>
                  <div className="font-semibold text-slate-900 group-hover:text-indigo-700">3. Theory cum Practical (TCP)</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Combined theory & lab contact hours. TE type (TCP-T or TCP-P), continuous assessment weightage table, combined COs with PO6-PO11 mapping.
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSelectType('AUDIT')}
                className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                  AU
                </div>
                <div>
                  <div className="font-semibold text-slate-900 group-hover:text-orange-700">4. Audit Course</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    No credits assigned (Credits: 0). Evaluated only via Continuous Assessment (CA) or specified criteria without terminal examinations counting to CGPA.
                  </div>
                </div>
              </button>
            </div>'''

content = content.replace("PO6?""PO11", "PO6-PO11")
content = content.replace(old_block, new_block)
with open('client/src/components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
