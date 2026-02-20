import esbuild from 'esbuild';
import fs from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';

async function buildSEA() {
  console.log('1. Bundling with esbuild...');
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    outfile: 'dist/bundle.cjs', // SEA requires CommonJS
    format: 'cjs',
    external: ['fsevents'], // Common optional dep for ws/chokidar
  });

  console.log('2. Generating SEA config...');
  const seaConfig = {
    main: 'dist/bundle.cjs',
    output: 'dist/sea-prep.blob',
    disableExperimentalSEAWarning: true
  };
  await fs.writeFile('sea-config.json', JSON.stringify(seaConfig, null, 2));

  console.log('3. Generating SEA Blob...');
  execSync('node --experimental-sea-config sea-config.json');

  console.log('4. Copying Node executable...');
  const isWindows = process.platform === 'win32';
  const binName = isWindows ? 'q-local-windows.exe' : (process.platform === 'darwin' ? 'q-local-macos' : 'q-local-linux');
  const binPath = path.join('dist', binName);
  
  execSync(`cp $(command -v node) ${binPath}`);

  console.log('5. Injecting Blob into Executable...');
  if (process.platform === 'darwin') {
      execSync(`codesign --remove-signature ${binPath}`);
  }

  // Injecting the blob using postject (Requires Node 20+ with npx postject)
  try {
      console.log('Executing postject...');
      const cmd = `npx postject ${binPath} NODE_SEA_BLOB dist/sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 ` + (process.platform === 'darwin' ? '--macho-segment-name NODE_SEA' : '');
      execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
      console.error('Failed to inject blob:', err);
      process.exit(1);
  }

  if (process.platform === 'darwin') {
      console.log('Signing MacOS Executable...');
      execSync(`codesign --sign - ${binPath}`);
  }

  console.log(`
✅ Q-Local successfully compiled into standalone binary: ${binPath}`);
}

buildSEA().catch(console.error);