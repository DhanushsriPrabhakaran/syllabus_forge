import sys
content = open('client/src/pages/CourseWizard.tsx', 'r', encoding='utf-8').read()

old_block = '''                      {/* Version */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Version (V)
                        </label>
                        <input
                          type="number"
                          readOnly
                          value={course.version}
                          className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-sm text-slate-600"
                        />'''

new_block = '''                      {/* Version */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Version (V)
                        </label>
                        <input
                          type="number"
                          value={course.version}
                          onChange={(e) => updateField('version', e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500"
                        />'''

content = content.replace(old_block, new_block)

with open('client/src/pages/CourseWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
