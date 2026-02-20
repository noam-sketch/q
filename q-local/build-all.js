import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import https from 'https';

const NODE_VERSION = 'v22.2.0';

const targets = [
  { platform: 'darwin', arch: 'x64', binaryName: 'q-local-macos-x64', downloadName: `node-${NODE_VERSION}-darwin-x64.tar.gz`, nodeBinPath: `node-${NODE_VERSION}-darwin-x64/bin/node` },
  { platform: 'darwin', arch: 'arm64', binaryName: 'q-local-macos-arm64', downloadName: `node-${NODE_VERSION}-darwin-arm64.tar.gz`, nodeBinPath: `node-${NODE_VERSION}-darwin-arm64/bin/node` },
  { platform: 'linux', arch: 'x64', binaryName: 'q-local-linux-x64', downloadName: `node-${NODE_VERSION}-linux-x64.tar.xz`, nodeBinPath: `node-${NODE_VERSION}-linux-x64/bin/node` },
  { platform: 'win32', arch: 'x64', binaryName: 'q-local-windows-x64.exe', downloadName: `node-${NODE_VERSION}-win-x64.zip`, nodeBinPath: `node-${NODE_VERSION}-win-x64/node.exe` }
];

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve();
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
          return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
  });
}

async function buildAll() {
  console.log('1. Bundling with esbuild...');
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    outfile: 'dist/bundle.cjs',
    format: 'cjs',
    external: ['fsevents'],
  });

  console.log('2. Generating SEA config...');
  const seaConfig = { main: 'dist/bundle.cjs', output: 'dist/sea-prep.blob', disableExperimentalSEAWarning: true };
  fs.writeFileSync('sea-config.json', JSON.stringify(seaConfig, null, 2));

  console.log('3. Generating SEA Blob...');
  execSync('node --experimental-sea-config sea-config.json');

  const downloadsDir = path.join('dist', 'downloads');
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  for (const target of targets) {
      console.log(`\n--- Compiling for ${target.binaryName} ---`);
      const downloadPath = path.join(downloadsDir, target.downloadName);
      const url = `https://nodejs.org/dist/${NODE_VERSION}/${target.downloadName}`;

      console.log(`Downloading Node.js binary from ${url}...`);
      await downloadFile(url, downloadPath);

      const extractedNodeBin = path.join(downloadsDir, target.nodeBinPath);
      
      if (!fs.existsSync(extractedNodeBin)) {
          console.log(`Extracting ${target.downloadName}...`);
          try {
              if (target.downloadName.endsWith('.zip')) {
                  execSync(`unzip -j -q ${downloadPath} ${target.nodeBinPath} -d ${downloadsDir}`);
                  fs.mkdirSync(path.dirname(extractedNodeBin), { recursive: true });
                  fs.renameSync(path.join(downloadsDir, 'node.exe'), extractedNodeBin);
              } else {
                  execSync(`tar -xf ${downloadPath} -C ${downloadsDir} ${target.nodeBinPath}`);
              }
          } catch (e) {
              console.log("Extraction error, trying to clean up...", e.message);
          }
      }

      const finalBinPath = path.join('dist', target.binaryName);

      fs.copyFileSync(extractedNodeBin, finalBinPath);
      fs.chmodSync(finalBinPath, 0o755);

      if (target.platform === 'darwin') {
          console.log('Removing signature from MacOS binary...');
          try { execSync(`codesign --remove-signature ${finalBinPath}`); } catch(e) {}
      }

      console.log(`Injecting Blob into ${target.binaryName}...`);
      const machoSegment = target.platform === 'darwin' ? '--macho-segment-name NODE_SEA' : '';
      const cmd = `npx postject ${finalBinPath} NODE_SEA_BLOB dist/sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 ${machoSegment}`;
      execSync(cmd, { stdio: 'inherit' });

      if (target.platform === 'darwin') {
          console.log('Re-signing MacOS binary...');
          try { execSync(`codesign --sign - ${finalBinPath}`); } catch(e) {}
      }
      
      console.log(`✅ Compiled: ${finalBinPath}`);
  }
}

buildAll().catch(console.error);