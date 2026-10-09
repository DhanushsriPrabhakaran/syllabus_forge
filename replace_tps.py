import sys
content = open('shared/src/constants.ts', 'r', encoding='utf-8').read()

old_block = '''export const TPS_VERBS: Record<number, string[]> = {
  2: ['Explain', 'Describe', 'Interpret', 'Classify'],
  3: ['Solve', 'Compute', 'Demonstrate', 'Use', 'Apply', 'Operate', 'Measure', 'Execute'],
  4: ['Compare', 'Differentiate', 'Examine', 'Break down', 'Analyse', 'Analyze'],
  5: ['Assess', 'Conclude', 'Critique', 'Decide', 'Evaluate', 'Justify', 'Prioritise', 'Prioritize', 'Recommend', 'Validate', 'Verify'],
};'''

new_block = '''export const TPS_VERBS: Record<number, string[]> = {
  1: ['Define', 'Identify', 'List', 'Name', 'Recall', 'Recognize', 'Record', 'Relate', 'Repeat', 'Underline'],
  2: ['Explain', 'Describe', 'Interpret', 'Classify'],
  3: ['Solve', 'Compute', 'Demonstrate', 'Use', 'Apply', 'Operate', 'Measure', 'Execute'],
  4: ['Compare', 'Differentiate', 'Examine', 'Break down', 'Analyse', 'Analyze'],
  5: ['Assess', 'Conclude', 'Critique', 'Decide', 'Evaluate', 'Justify', 'Prioritise', 'Prioritize', 'Recommend', 'Validate', 'Verify'],
  6: ['Construct', 'Design', 'Develop', 'Formulate', 'Invent', 'Create', 'Plan', 'Produce'],
};'''

content = content.replace(old_block, new_block)

with open('shared/src/constants.ts', 'w', encoding='utf-8') as f:
    f.write(content)
