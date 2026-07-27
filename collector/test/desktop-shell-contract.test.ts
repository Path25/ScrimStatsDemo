import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const collectorRoot = path.resolve(import.meta.dirname, '..');
const mainSource = fs.readFileSync(path.join(collectorRoot, 'src', 'main.ts'), 'utf8');
const packageConfig = JSON.parse(fs.readFileSync(path.join(collectorRoot, 'package.json'), 'utf8'));

test('desktop shell removes the native menu and uses the branded icon', () => {
  assert.match(mainSource, /Menu\.setApplicationMenu\(null\)/);
  assert.match(mainSource, /window\.removeMenu\(\)/);
  assert.match(mainSource, /icon: appIconPath\(\)/);
  assert.doesNotMatch(mainSource, /new Tray\(nativeImage\.createEmpty\(\)\)/);
  assert.equal(fs.existsSync(path.join(collectorRoot, 'build', 'icon.png')), true);
  assert.equal(fs.existsSync(path.join(collectorRoot, 'build', 'icon.ico')), true);
});

test('Windows package has stable identity and upgrade-safe storage', () => {
  assert.equal(packageConfig.build.appId, 'gg.scrimstats.collector');
  assert.equal(packageConfig.build.productName, 'ScrimStats Game Capture');
  assert.equal(packageConfig.build.win.icon, 'build/icon.ico');
  assert.match(mainSource, /ScrimStats Collector/);
  assert.match(mainSource, /requestSingleInstanceLock\(\)/);
});
