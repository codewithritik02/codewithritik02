import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const SPEED_FACTOR = 4.5; // 4.5x faster, smooth and lively arcade pace (~50s loop instead of ~4min)

function smoothPacman(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  let svg = fs.readFileSync(filePath, 'utf8');

  // 1. Add viewBox and responsive scaling so browser can GPU-render without lagging/hanging
  if (!svg.includes('viewBox=')) {
    svg = svg.replace(
      /<svg\s+width="1166"\s+height="184"/,
      '<svg viewBox="0 0 1166 184" width="100%" height="100%" style="max-width: 100%; height: auto;"'
    );
  }

  // 2. Scale all animation durations to remove stuttering (5 FPS crawl -> 22+ FPS smooth motion)
  svg = svg.replace(/dur="(\d+(?:\.\d+)?)(ms|s)"/g, (match, val, unit) => {
    const num = parseFloat(val);
    const newNum = unit === 'ms' ? Math.round(num / SPEED_FACTOR) : (num / SPEED_FACTOR).toFixed(2);
    return `dur="${newNum}${unit}"`;
  });

  // 3. Update durationMs metadata if present
  svg = svg.replace(/<durationMs>(\d+)<\/durationMs>/, (match, ms) => {
    return `<durationMs>${Math.round(parseFloat(ms) / SPEED_FACTOR)}</durationMs>`;
  });

  fs.writeFileSync(filePath, svg, 'utf8');
  console.log(`Successfully smoothed and optimized ${path.basename(filePath)}!`);
}

// Target dist directory (created by abozanona/pacman-contribution-graph before ghaction-github-pages)
const distDir = path.resolve(root, 'dist');
if (fs.existsSync(distDir)) {
  const files = fs.readdirSync(distDir).filter((f) => f.endsWith('.svg'));
  for (const f of files) {
    smoothPacman(path.resolve(distDir, f));
  }
} else {
  // If run locally or with output folder
  const outputDir = path.resolve(root, 'output');
  if (fs.existsSync(outputDir)) {
    const files = fs.readdirSync(outputDir).filter((f) => f.includes('pacman') && f.endsWith('.svg'));
    for (const f of files) {
      smoothPacman(path.resolve(outputDir, f));
    }
  }
}
