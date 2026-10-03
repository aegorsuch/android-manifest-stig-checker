const test = require('node:test');
const assert = require('node:assert/strict');

test('detects common STIG issues from real XML structure', async () => {
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

  assert.ok(issues.some((issue) => issue.id === 'V-242851'));
  assert.ok(issues.some((issue) => issue.id === 'V-242852'));
  assert.ok(issues.some((issue) => issue.id === 'V-242854'));
  assert.ok(issues.some((issue) => issue.id === 'V-242855'));
  assert.ok(issues.some((issue) => issue.id === 'V-242857'));
});

test('summarizes severity counts for compliance reporting', async () => {
  const { getComplianceSummary } = await import('./stig-checker.js');
  const issues = [
    { id: 'V-242851', category: 'CAT I' },
    { id: 'V-242852', category: 'CAT II' },
    { id: 'V-242854', category: 'CAT I' },
  ];

  const summary = getComplianceSummary(issues);

  assert.equal(summary.total, 3);
  assert.equal(summary.catI, 2);
  assert.equal(summary.catII, 1);
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
  const debugFinding = analysis.issues.find((issue) => issue.id === 'V-242851');
  const exportedFinding = analysis.issues.find((issue) => issue.id === 'V-242855');
  const cameraFinding = analysis.issues.find((issue) => issue.id === 'V-242859');

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
