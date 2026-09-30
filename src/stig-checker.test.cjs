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
