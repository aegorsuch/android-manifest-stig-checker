import React, { useState } from 'react';
import { checkSTIG, getComplianceSummary } from './stig-checker';

export default function App() {
  const [manifest, setManifest] = useState('');
  const [issues, setIssues] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const summary = getComplianceSummary(issues);

  const compliantSample = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.stigcompliant">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:allowBackup="false"
        android:debuggable="false"
        android:exported="false"
        android:usesCleartextTraffic="false">
        <activity android:name=".MainActivity" android:exported="false" />
    </application>
</manifest>`;

  const noncompliantSample = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.stigviolations">
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <application
        android:allowBackup="true"
        android:debuggable="true"
        android:exported="true"
        android:usesCleartextTraffic="true">
        <activity android:name=".MainActivity" android:exported="true" />
    </application>
</manifest>`;

  const handleCheck = () => {
    setIssues(checkSTIG(manifest));
  };

  const handleLoadCompliant = () => setManifest(compliantSample);
  const handleLoadNoncompliant = () => setManifest(noncompliantSample);

  return (
    <div
      className="stig-root"
      style={{
        padding: 24,
        maxWidth: 800,
        margin: 'auto',
        background: darkMode ? '#222' : '#fff',
        color: darkMode ? '#fff' : '#222',
        boxSizing: 'border-box',
        transition: 'background 0.2s, color 0.2s',
      }}
      role="main"
      aria-label="Android Manifest STIG Checker Main Content"
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => setDarkMode((value) => !value)}
          style={{
            padding: '6px 18px',
            fontSize: 15,
            borderRadius: 6,
            background: darkMode ? '#444' : '#eee',
            color: darkMode ? '#fff' : '#222',
            border: '1px solid #888',
            cursor: 'pointer',
          }}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </div>

      <h1 tabIndex={0} aria-label="Android Manifest STIG Checker" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span role="img" aria-label="Shield" style={{ fontSize: 32 }}>🛡️</span>
        Android Manifest STIG Checker
      </h1>

      <div style={{ marginBottom: 16 }}>
        <input
          type="file"
          accept=".xml,text/xml"
          style={{ marginBottom: 8 }}
          onChange={(event) => {
            const file = event.target.files && event.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (loadEvent) => setManifest(loadEvent.target && loadEvent.target.result ? loadEvent.target.result : '');
              reader.readAsText(file);
            }
          }}
        />
        <textarea
          rows={12}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: 16 }}
          placeholder="Paste your AndroidManifest.xml here"
          value={manifest}
          onChange={(event) => setManifest(event.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={handleCheck} style={{ padding: '8px 24px', fontSize: 16, flex: '1 1 180px', minWidth: 120 }} title="Check your manifest for STIG compliance">
          <span role="img" aria-label="Check">✅</span> Check STIG Compliance
        </button>
        <button onClick={handleLoadNoncompliant} style={{ padding: '8px 24px', fontSize: 16, flex: '1 1 180px', minWidth: 120 }} title="Load a sample manifest with common STIG violations">
          <span role="img" aria-label="Warning">⚠️</span> Load Noncompliant Sample
        </button>
        <button onClick={handleLoadCompliant} style={{ padding: '8px 24px', fontSize: 16, flex: '1 1 180px', minWidth: 120 }} title="Load a sample manifest that is STIG compliant">
          <span role="img" aria-label="Shield">🛡️</span> Load Compliant Sample
        </button>
      </div>

      <style>
        {`
          @media (max-width: 600px) {
            .stig-root {
              padding: 8px !important;
              max-width: 100vw !important;
            }
            textarea {
              font-size: 14px !important;
              min-width: 0 !important;
            }
            table {
              font-size: 12px !important;
            }
            button {
              font-size: 14px !important;
              padding: 8px 12px !important;
              min-width: 80px !important;
            }
          }
          body, .stig-root {
            background: ${darkMode ? '#222' : '#fff'} !important;
            color: ${darkMode ? '#fff' : '#222'} !important;
          }
        `}
      </style>

      <div style={{ marginTop: 24 }} aria-live="polite" aria-label="STIG Issues Table">
        <h2 tabIndex={0} aria-label="STIG Issues">STIG Issues</h2>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ background: '#2d2d2d', border: '1px solid #444', borderRadius: 8, padding: '8px 12px', minWidth: 120 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Total</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{summary.total}</div>
          </div>
          <div style={{ background: '#3d1a1a', border: '1px solid #7a2a2a', borderRadius: 8, padding: '8px 12px', minWidth: 120 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>CAT I</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{summary.catI}</div>
          </div>
          <div style={{ background: '#3d3a1a', border: '1px solid #7a6a2a', borderRadius: 8, padding: '8px 12px', minWidth: 120 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>CAT II</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{summary.catII}</div>
          </div>
        </div>

        {issues.length === 0 ? (
          <p>No issues found.</p>
        ) : (
          <React.Fragment>
            <table style={{ width: '100%', background: '#333', color: '#fff', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Category</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>STIG ID</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Issue</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Impact</th>
                  <th style={{ border: '1px solid #444', padding: 8 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue, idx) => {
                  const rowStyle = issue.category === 'CAT I' ? { background: '#440000' } : issue.category === 'CAT II' ? { background: '#444000' } : {};
                  const stigUrl = `https://www.stigviewer.com/stig/android_os/${issue.id.toLowerCase()}`;

                  return (
                    <tr key={`${issue.id}-${idx}`} style={rowStyle}>
                      <td style={{ border: '1px solid #444', padding: 8 }}>{issue.category}</td>
                      <td style={{ border: '1px solid #444', padding: 8 }}>{issue.id}</td>
                      <td style={{ border: '1px solid #444', padding: 8 }}>{issue.label}</td>
                      <td style={{ border: '1px solid #444', padding: 8 }}>{issue.description}</td>
                      <td style={{ border: '1px solid #444', padding: 8 }}>
                        <a href={stigUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4eaaff', textDecoration: 'underline' }}>View STIG</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                onClick={() => {
                  const csv = [
                    ['Category', 'STIG ID', 'Issue', 'Impact'],
                    ...issues.map((item) => [item.category, item.id, item.label, item.description]),
                  ]
                    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                    .join('\n');

                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'stig-issues.csv';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                style={{ padding: '8px 24px', fontSize: 16 }}
              >
                Export CSV
              </button>
              <button onClick={() => window.print()} style={{ padding: '8px 24px', fontSize: 16 }}>
                Export PDF
              </button>
            </div>
          </React.Fragment>
        )}
      </div>

      <div style={{ marginTop: 40, background: '#282828', padding: 24, borderRadius: 8 }} aria-label="Feedback & Suggestions">
        <h2 tabIndex={0} aria-label="Feedback & Suggestions">Feedback & Suggestions</h2>
        <form
          action="https://github.com/aegorsuch/Android-Manifest-STIG-Checker/issues"
          target="_blank"
          style={{ marginBottom: 16 }}
          aria-label="Feedback Form"
          onSubmit={(event) => {
            event.preventDefault();
            setFeedbackSent(true);
            setTimeout(() => setFeedbackSent(false), 4000);
          }}
        >
          <label htmlFor="feedback" style={{ display: 'block', marginBottom: 8 }}>
            Suggest a new rule or report an issue:
          </label>
          <textarea
            id="feedback"
            name="feedback"
            rows={4}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 16, marginBottom: 12 }}
            placeholder="Describe your suggestion or issue..."
            aria-label="Feedback Input"
          />
          <button type="submit" style={{ padding: '8px 24px', fontSize: 16 }} aria-label="Submit Feedback">
            Submit Feedback
          </button>
        </form>

        {feedbackSent && (
          <div style={{ color: '#4eaaff', fontWeight: 'bold', marginBottom: 8 }} aria-live="polite">
            Thank you for your feedback!
          </div>
        )}
      </div>
      <footer style={{ marginTop: 24, fontSize: 12, opacity: 0.8, textAlign: 'right' }}>
        Release (source commit): <code>{__SOURCE_COMMIT__}</code>
      </footer>
    </div>
  );
}
