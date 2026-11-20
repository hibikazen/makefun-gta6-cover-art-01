// Sunset Cover Studio — the entrypoint. It stages the app and its screenshots
// into the output directory and writes the dossier the judge reads, using the
// vendored make.fun library. Node 22, standard library only; run it with
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (outside the grader MAKEFUN_OUTPUT_DIR stands in for /output).
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy one top-level directory of the repository into the output, when it
// exists. The app is required; screenshots are staged the same way.
function stage(name: string): void {
  const from = join(repoRoot, name);
  if (!existsSync(from)) return;
  cpSync(from, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
stage('app');
stage('screenshots');

// The scorer's caps, from the competition's gate: the dossier text is capped
// at 160 KiB; screenshots are at most 4 files of 256 KiB each; app/ holds at
// most 993 files and 48 MiB, with no path over 1000 bytes.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
