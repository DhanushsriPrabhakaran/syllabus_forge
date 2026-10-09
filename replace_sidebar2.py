import sys
content = open('client/src/pages/CourseWizard.tsx', 'r', encoding='utf-8').read()

old_block = '''                  </div>
                </div>
              </div>

              {/* Main Form Area */}'''

new_block = '''                  </div>
                </div>
                </div>
                )}
              </div>

              {/* Main Form Area */}'''

content = content.replace(old_block, new_block)

with open('client/src/pages/CourseWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
