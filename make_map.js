import puppeteer from 'puppeteer';
import fs from 'fs';

async function generate() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 420 });
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { margin: 0; padding: 15px; font-family: Arial, sans-serif; background: #ffffff; display: flex; justify-content: center; align-items: center; }
      .diagram { border: 2px solid #1e40af; border-radius: 8px; padding: 16px; width: 740px; background: #f8fafc; box-sizing: border-box; }
      .title { text-align: center; font-weight: bold; font-size: 15px; color: #1e3a8a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 10px; }
      .box { border: 1.5px solid #3b82f6; background: #ffffff; border-radius: 6px; padding: 8px; font-size: 11px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
      .box-head { font-weight: bold; color: #1d4ed8; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; font-size: 11px; }
      .center-hub { background: #1e40af; color: white; padding: 10px; border-radius: 6px; text-align: center; font-weight: bold; font-size: 12px; margin: 8px 0; letter-spacing: 0.5px; }
      .box-desc { color: #475569; font-size: 10px; line-height: 1.3; }
    </style>
  </head>
  <body>
    <div class="diagram">
      <div class="title">Concept Map: Data Structures and Applications</div>
      <div class="grid">
        <div class="box">
          <div class="box-head">Linear Structures</div>
          <div class="box-desc">Arrays, SLL, DLL, Circular Lists, Stacks & Queues</div>
        </div>
        <div class="box">
          <div class="box-head">Hierarchical Trees</div>
          <div class="box-desc">Binary Trees, BST, AVL Trees, Red-Black Trees, B-Trees</div>
        </div>
        <div class="box">
          <div class="box-head">Priority Queues</div>
          <div class="box-desc">Binary Heap, Leftist Heap, Binomial Heap, Winner Trees</div>
        </div>
        <div class="box">
          <div class="box-head">Sets & Hashing</div>
          <div class="box-desc">Disjoint Sets, Union-Find, Open/Closed Hashing, Rehashing</div>
        </div>
      </div>
      <div class="center-hub">FOUNDATION: ASYMPTOTIC COMPLEXITY ANALYSIS (O, &Omega;, &Theta;) & MEMORY TRADEOFFS</div>
      <div class="grid">
        <div class="box">
          <div class="box-head">CO1: Linear ADTs</div>
          <div class="box-desc">Space & Time Tradeoffs in Sequential Memory</div>
        </div>
        <div class="box">
          <div class="box-head">CO2 & CO3: Trees</div>
          <div class="box-desc">Rotations, Balancing & Priority Queue Heaps</div>
        </div>
        <div class="box">
          <div class="box-head">CO4 & CO5: Sets/Maps</div>
          <div class="box-desc">Disjoint Set Forest & Collision Avoidance</div>
        </div>
        <div class="box">
          <div class="box-head">CO6: Synthesis</div>
          <div class="box-desc">Algorithmic Tradeoffs in Enterprise Systems</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  await page.setContent(html);
  const buffer = await page.screenshot({ type: 'png' });
  const base64 = 'data:image/png;base64,' + buffer.toString('base64');
  fs.writeFileSync('d:/project/concept_map_base64.txt', base64);
  console.log('Concept map generated, base64 length:', base64.length);
  await browser.close();
}

generate().catch(console.error);

