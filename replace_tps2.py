import sys
content = open('client/src/pages/CourseWizard.tsx', 'r', encoding='utf-8').read()

old_block = '''                                <select
                                  value={co.tpsLevel}
                                  onChange={e => {
                                    const level = parseInt(e.target.value);
                                    const updated = [...(course.courseOutcomes || [])];
                                    updated[idx] = { ...updated[idx], tpsLevel: level };
                                    updateField('courseOutcomes', updated);
                                  }}
                                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                                >
                                  <option value={2}>TPS 2 (Understand)</option>
                                  <option value={3}>TPS 3 (Apply)</option>
                                  <option value={4}>TPS 4 (Analyze)</option>
                                  <option value={5}>TPS 5 (Evaluate)</option>
                                </select>'''

new_block = '''                                <select
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
                                </select>'''

content = content.replace(old_block, new_block)
with open('client/src/pages/CourseWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
