'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

exports['default'] = App;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _stigChecker = require('./stig-checker');

function App() {
  var _useState = (0, _react.useState)('');

  var _useState2 = _slicedToArray(_useState, 2);

  var manifest = _useState2[0];
  var setManifest = _useState2[1];

  var _useState3 = (0, _react.useState)([]);

  var _useState32 = _slicedToArray(_useState3, 2);

  var issues = _useState32[0];
  var setIssues = _useState32[1];

  var _useState4 = (0, _react.useState)(true);

  var _useState42 = _slicedToArray(_useState4, 2);

  var darkMode = _useState42[0];
  var setDarkMode = _useState42[1];

  var _useState5 = (0, _react.useState)(false);

  var _useState52 = _slicedToArray(_useState5, 2);

  var feedbackSent = _useState52[0];
  var setFeedbackSent = _useState52[1];

  var summary = (0, _stigChecker.getComplianceSummary)(issues);

  var compliantSample = '<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    package="com.example.stigcompliant">\n    <uses-permission android:name="android.permission.INTERNET" />\n    <application\n        android:allowBackup="false"\n        android:debuggable="false"\n        android:exported="false"\n        android:usesCleartextTraffic="false">\n        <activity android:name=".MainActivity" android:exported="false" />\n    </application>\n</manifest>';

  var noncompliantSample = '<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    package="com.example.stigviolations">\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />\n    <uses-permission android:name="android.permission.READ_PHONE_STATE" />\n    <application\n        android:allowBackup="true"\n        android:debuggable="true"\n        android:exported="true"\n        android:usesCleartextTraffic="true">\n        <activity android:name=".MainActivity" android:exported="true" />\n    </application>\n</manifest>';

  var handleCheck = function handleCheck() {
    setIssues((0, _stigChecker.checkSTIG)(manifest));
  };

  var handleLoadCompliant = function handleLoadCompliant() {
    return setManifest(compliantSample);
  };
  var handleLoadNoncompliant = function handleLoadNoncompliant() {
    return setManifest(noncompliantSample);
  };

  return _react2['default'].createElement(
    'div',
    {
      className: 'stig-root',
      style: {
        padding: 24,
        maxWidth: 800,
        margin: 'auto',
        background: darkMode ? '#222' : '#fff',
        color: darkMode ? '#fff' : '#222',
        boxSizing: 'border-box',
        transition: 'background 0.2s, color 0.2s'
      },
      role: 'main',
      'aria-label': 'Android Manifest STIG Checker Main Content'
    },
    _react2['default'].createElement(
      'div',
      { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } },
      _react2['default'].createElement(
        'button',
        {
          onClick: function () {
            return setDarkMode(function (value) {
              return !value;
            });
          },
          style: {
            padding: '6px 18px',
            fontSize: 15,
            borderRadius: 6,
            background: darkMode ? '#444' : '#eee',
            color: darkMode ? '#fff' : '#222',
            border: '1px solid #888',
            cursor: 'pointer'
          },
          'aria-label': darkMode ? 'Switch to light mode' : 'Switch to dark mode'
        },
        darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'
      )
    ),
    _react2['default'].createElement(
      'h1',
      { tabIndex: 0, 'aria-label': 'Android Manifest STIG Checker', style: { display: 'flex', alignItems: 'center', gap: 12 } },
      _react2['default'].createElement(
        'span',
        { role: 'img', 'aria-label': 'Shield', style: { fontSize: 32 } },
        '🛡️'
      ),
      'Android Manifest STIG Checker'
    ),
    _react2['default'].createElement(
      'div',
      { style: { marginBottom: 16 } },
      _react2['default'].createElement('input', {
        type: 'file',
        accept: '.xml,text/xml',
        style: { marginBottom: 8 },
        onChange: function (event) {
          var file = event.target.files && event.target.files[0];
          if (file) {
            var reader = new FileReader();
            reader.onload = function (loadEvent) {
              return setManifest(loadEvent.target && loadEvent.target.result ? loadEvent.target.result : '');
            };
            reader.readAsText(file);
          }
        }
      }),
      _react2['default'].createElement('textarea', {
        rows: 12,
        style: { width: '100%', fontFamily: 'monospace', fontSize: 16 },
        placeholder: 'Paste your AndroidManifest.xml here',
        value: manifest,
        onChange: function (event) {
          return setManifest(event.target.value);
        }
      })
    ),
    _react2['default'].createElement(
      'div',
      { style: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' } },
      _react2['default'].createElement(
        'button',
        { onClick: handleCheck, style: { padding: '8px 24px', fontSize: 16, flex: '1 1 180px', minWidth: 120 }, title: 'Check your manifest for STIG compliance' },
        _react2['default'].createElement(
          'span',
          { role: 'img', 'aria-label': 'Check' },
          '✅'
        ),
        ' Check STIG Compliance'
      ),
      _react2['default'].createElement(
        'button',
        { onClick: handleLoadNoncompliant, style: { padding: '8px 24px', fontSize: 16, flex: '1 1 180px', minWidth: 120 }, title: 'Load a sample manifest with common STIG violations' },
        _react2['default'].createElement(
          'span',
          { role: 'img', 'aria-label': 'Warning' },
          '⚠️'
        ),
        ' Load Noncompliant Sample'
      ),
      _react2['default'].createElement(
        'button',
        { onClick: handleLoadCompliant, style: { padding: '8px 24px', fontSize: 16, flex: '1 1 180px', minWidth: 120 }, title: 'Load a sample manifest that is STIG compliant' },
        _react2['default'].createElement(
          'span',
          { role: 'img', 'aria-label': 'Shield' },
          '🛡️'
        ),
        ' Load Compliant Sample'
      )
    ),
    _react2['default'].createElement(
      'style',
      null,
      '\n          @media (max-width: 600px) {\n            .stig-root {\n              padding: 8px !important;\n              max-width: 100vw !important;\n            }\n            textarea {\n              font-size: 14px !important;\n              min-width: 0 !important;\n            }\n            table {\n              font-size: 12px !important;\n            }\n            button {\n              font-size: 14px !important;\n              padding: 8px 12px !important;\n              min-width: 80px !important;\n            }\n          }\n          body, .stig-root {\n            background: ' + (darkMode ? '#222' : '#fff') + ' !important;\n            color: ' + (darkMode ? '#fff' : '#222') + ' !important;\n          }\n        '
    ),
    _react2['default'].createElement(
      'div',
      { style: { marginTop: 24 }, 'aria-live': 'polite', 'aria-label': 'STIG Issues Table' },
      _react2['default'].createElement(
        'h2',
        { tabIndex: 0, 'aria-label': 'STIG Issues' },
        'STIG Issues'
      ),
      _react2['default'].createElement(
        'div',
        { style: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 } },
        _react2['default'].createElement(
          'div',
          { style: { background: '#2d2d2d', border: '1px solid #444', borderRadius: 8, padding: '8px 12px', minWidth: 120 } },
          _react2['default'].createElement(
            'div',
            { style: { fontSize: 12, opacity: 0.8 } },
            'Total'
          ),
          _react2['default'].createElement(
            'div',
            { style: { fontSize: 22, fontWeight: 700 } },
            summary.total
          )
        ),
        _react2['default'].createElement(
          'div',
          { style: { background: '#3d1a1a', border: '1px solid #7a2a2a', borderRadius: 8, padding: '8px 12px', minWidth: 120 } },
          _react2['default'].createElement(
            'div',
            { style: { fontSize: 12, opacity: 0.8 } },
            'CAT I'
          ),
          _react2['default'].createElement(
            'div',
            { style: { fontSize: 22, fontWeight: 700 } },
            summary.catI
          )
        ),
        _react2['default'].createElement(
          'div',
          { style: { background: '#3d3a1a', border: '1px solid #7a6a2a', borderRadius: 8, padding: '8px 12px', minWidth: 120 } },
          _react2['default'].createElement(
            'div',
            { style: { fontSize: 12, opacity: 0.8 } },
            'CAT II'
          ),
          _react2['default'].createElement(
            'div',
            { style: { fontSize: 22, fontWeight: 700 } },
            summary.catII
          )
        )
      ),
      issues.length === 0 ? _react2['default'].createElement(
        'p',
        null,
        'No issues found.'
      ) : _react2['default'].createElement(
        _react2['default'].Fragment,
        null,
        _react2['default'].createElement(
          'table',
          { style: { width: '100%', background: '#333', color: '#fff', borderCollapse: 'collapse' } },
          _react2['default'].createElement(
            'thead',
            null,
            _react2['default'].createElement(
              'tr',
              null,
              _react2['default'].createElement(
                'th',
                { style: { border: '1px solid #444', padding: 8 } },
                'Category'
              ),
              _react2['default'].createElement(
                'th',
                { style: { border: '1px solid #444', padding: 8 } },
                'STIG ID'
              ),
              _react2['default'].createElement(
                'th',
                { style: { border: '1px solid #444', padding: 8 } },
                'Issue'
              ),
              _react2['default'].createElement(
                'th',
                { style: { border: '1px solid #444', padding: 8 } },
                'Impact'
              ),
              _react2['default'].createElement(
                'th',
                { style: { border: '1px solid #444', padding: 8 } },
                'Details'
              )
            )
          ),
          _react2['default'].createElement(
            'tbody',
            null,
            issues.map(function (issue, idx) {
              var rowStyle = issue.category === 'CAT I' ? { background: '#440000' } : issue.category === 'CAT II' ? { background: '#444000' } : {};
              var stigUrl = 'https://www.stigviewer.com/stig/android_os/' + issue.id.toLowerCase();

              return _react2['default'].createElement(
                'tr',
                { key: issue.id + '-' + idx, style: rowStyle },
                _react2['default'].createElement(
                  'td',
                  { style: { border: '1px solid #444', padding: 8 } },
                  issue.category
                ),
                _react2['default'].createElement(
                  'td',
                  { style: { border: '1px solid #444', padding: 8 } },
                  issue.id
                ),
                _react2['default'].createElement(
                  'td',
                  { style: { border: '1px solid #444', padding: 8 } },
                  issue.label
                ),
                _react2['default'].createElement(
                  'td',
                  { style: { border: '1px solid #444', padding: 8 } },
                  issue.description
                ),
                _react2['default'].createElement(
                  'td',
                  { style: { border: '1px solid #444', padding: 8 } },
                  _react2['default'].createElement(
                    'a',
                    { href: stigUrl, target: '_blank', rel: 'noopener noreferrer', style: { color: '#4eaaff', textDecoration: 'underline' } },
                    'View STIG'
                  )
                )
              );
            })
          )
        ),
        _react2['default'].createElement(
          'div',
          { style: { display: 'flex', gap: 12, marginTop: 16 } },
          _react2['default'].createElement(
            'button',
            {
              onClick: function () {
                var csv = [['Category', 'STIG ID', 'Issue', 'Impact']].concat(_toConsumableArray(issues.map(function (item) {
                  return [item.category, item.id, item.label, item.description];
                }))).map(function (row) {
                  return row.map(function (cell) {
                    return '"' + String(cell).replace(/"/g, '""') + '"';
                  }).join(',');
                }).join('\n');

                var blob = new Blob([csv], { type: 'text/csv' });
                var url = URL.createObjectURL(blob);
                var link = document.createElement('a');
                link.href = url;
                link.download = 'stig-issues.csv';
                link.click();
                URL.revokeObjectURL(url);
              },
              style: { padding: '8px 24px', fontSize: 16 }
            },
            'Export CSV'
          ),
          _react2['default'].createElement(
            'button',
            { onClick: function () {
                return window.print();
              }, style: { padding: '8px 24px', fontSize: 16 } },
            'Export PDF'
          )
        )
      )
    ),
    _react2['default'].createElement(
      'div',
      { style: { marginTop: 40, background: '#282828', padding: 24, borderRadius: 8 }, 'aria-label': 'Feedback & Suggestions' },
      _react2['default'].createElement(
        'h2',
        { tabIndex: 0, 'aria-label': 'Feedback & Suggestions' },
        'Feedback & Suggestions'
      ),
      _react2['default'].createElement(
        'form',
        {
          action: 'https://github.com/aegorsuch/Android-Manifest-STIG-Checker/issues',
          target: '_blank',
          style: { marginBottom: 16 },
          'aria-label': 'Feedback Form',
          onSubmit: function (event) {
            event.preventDefault();
            setFeedbackSent(true);
            setTimeout(function () {
              return setFeedbackSent(false);
            }, 4000);
          }
        },
        _react2['default'].createElement(
          'label',
          { htmlFor: 'feedback', style: { display: 'block', marginBottom: 8 } },
          'Suggest a new rule or report an issue:'
        ),
        _react2['default'].createElement('textarea', {
          id: 'feedback',
          name: 'feedback',
          rows: 4,
          style: { width: '100%', fontFamily: 'monospace', fontSize: 16, marginBottom: 12 },
          placeholder: 'Describe your suggestion or issue...',
          'aria-label': 'Feedback Input'
        }),
        _react2['default'].createElement(
          'button',
          { type: 'submit', style: { padding: '8px 24px', fontSize: 16 }, 'aria-label': 'Submit Feedback' },
          'Submit Feedback'
        )
      ),
      feedbackSent && _react2['default'].createElement(
        'div',
        { style: { color: '#4eaaff', fontWeight: 'bold', marginBottom: 8 }, 'aria-live': 'polite' },
        'Thank you for your feedback!'
      )
    )
  );
}

module.exports = exports['default'];