const test = require('node:test');
const assert = require('node:assert/strict');

test('detects configured checks from Android manifest XML', async () => {
  const { checkSTIG } = await import('./stig-checker.js');
  const manifest = `
    <manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.test">
      <application
          android:debuggable="true"
          android:allowBackup="true"
          android:usesCleartextTraffic="true"
          android:exported="true">
        <activity android:name=".MainActivity" android:exported="true" />
      </application>

      <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    </manifest>
  `;

  const issues = checkSTIG(manifest);

  assert.ok(issues.some((issue) => issue.id === 'manifest-debuggable'));
  assert.ok(issues.some((issue) => issue.id === 'manifest-backup-enabled'));
  assert.ok(issues.some((issue) => issue.id === 'manifest-cleartext-traffic'));
  assert.ok(issues.some((issue) => issue.id === 'component-exported'));
  assert.ok(issues.some((issue) => issue.id === 'permission-read-phone-state'));
  assert.ok(issues.every((issue) => !issue.id.startsWith('V-')));
});

test('summarizes failed and review check counts', async () => {
  const { getComplianceSummary } = await import('./stig-checker.js');
  const issues = [
    { id: 'manifest-debuggable', category: 'Manifest', status: 'fail' },
    { id: 'manifest-backup-enabled', category: 'Manifest', status: 'review' },
    { id: 'permission-camera', category: 'Permission', status: 'review' },
  ];

  const summary = getComplianceSummary(issues);

  assert.equal(summary.total, 3);
  assert.equal(summary.failures, 1);
  assert.equal(summary.reviews, 2);
  assert.equal(summary.catI, undefined);
  assert.equal(summary.compliant, false);
});

test('does not treat empty or malformed XML as compliant', async () => {
  const { analyzeManifest } = await import('./stig-checker.js');

  const empty = analyzeManifest('');
  const malformed = analyzeManifest('<manifest><application></manifest>');

  assert.equal(empty.status, 'empty');
  assert.equal(malformed.status, 'invalid');
  assert.notEqual(empty.status, 'compliant');
  assert.notEqual(malformed.status, 'compliant');
});

test('marks permission findings for review instead of objective failure', async () => {
  const { analyzeManifest } = await import('./stig-checker.js');
  const analysis = analyzeManifest(`
    <manifest xmlns:android="http://schemas.android.com/apk/res/android">
      <uses-permission android:name="android.permission.CAMERA" />
      <application android:debuggable="false" />
    </manifest>
  `);

  assert.equal(analysis.status, 'review');
  assert.equal(analysis.summary.failures, 0);
  assert.equal(analysis.summary.reviews, 1);
  assert.equal(analysis.issues[0].status, 'review');
});

test('includes exact XML evidence for each matching attribute and permission', async () => {
  const { analyzeManifest, formatEvidence } = await import('./stig-checker.js');
  const analysis = analyzeManifest(`
    <manifest xmlns:android="http://schemas.android.com/apk/res/android">
      <application android:debuggable="true">
        <activity android:name=".MainActivity" android:exported="true" />
        <receiver android:name=".BootReceiver" android:exported="true" />
      </application>
      <uses-permission android:name="android.permission.CAMERA" />
      <uses-permission android:name="android.permission.CAMERA" />
    </manifest>
  `);
  const debugFinding = analysis.issues.find((issue) => issue.id === 'manifest-debuggable');
  const exportedFinding = analysis.issues.find((issue) => issue.id === 'component-exported');
  const cameraFinding = analysis.issues.find((issue) => issue.id === 'permission-camera');

  assert.equal(formatEvidence(debugFinding.evidence[0]), '<application android:debuggable="true">');
  assert.deepEqual(exportedFinding.evidence.map(formatEvidence), [
    '<activity android:name=".MainActivity" android:exported="true">',
    '<receiver android:name=".BootReceiver" android:exported="true">',
  ]);
  assert.deepEqual(cameraFinding.evidence.map(formatEvidence), [
    '<uses-permission android:name="android.permission.CAMERA">',
    '<uses-permission android:name="android.permission.CAMERA">',
  ]);
});
