'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var RULES = [{
  id: 'V-242851',
  category: 'CAT I',
  label: 'debuggable="true"',
  description: 'The AndroidManifest.xml must not set android:debuggable="true" in production. This allows remote memory extraction and debugging.',
  matcher: function matcher(_ref) {
    var application = _ref.application;
    return normalizeBoolean(application['android:debuggable'] || application.debuggable);
  }
}, {
  id: 'V-242852',
  category: 'CAT II',
  label: 'allowBackup="true"',
  description: 'The AndroidManifest.xml must not set android:allowBackup="true". This permits local data extraction via ADB.',
  matcher: function matcher(_ref2) {
    var application = _ref2.application;
    return normalizeBoolean(application['android:allowBackup'] || application.allowBackup);
  }
}, {
  id: 'V-242854',
  category: 'CAT I',
  label: 'usesCleartextTraffic',
  description: 'The AndroidManifest.xml must not allow cleartext traffic. All network traffic must be encrypted.',
  matcher: function matcher(_ref3) {
    var application = _ref3.application;
    return normalizeBoolean(application['android:usesCleartextTraffic'] || application.usesCleartextTraffic);
  }
}, {
  id: 'V-242855',
  category: 'CAT II',
  label: 'Exported Components',
  description: 'Exported components must be restricted. android:exported="true" can allow malicious apps to hijack intents.',
  matcher: function matcher(_ref4) {
    var exportedTags = _ref4.exportedTags;
    return exportedTags.some(function (tag) {
      return normalizeBoolean(tag['android:exported'] || tag.exported);
    });
  }
}, {
  id: 'V-242856',
  category: 'CAT II',
  label: 'WRITE_EXTERNAL_STORAGE',
  description: 'The app must not request WRITE_EXTERNAL_STORAGE permission unless absolutely necessary. This can expose sensitive data.',
  matcher: function matcher(_ref5) {
    var permissions = _ref5.permissions;
    return permissions.includes('android.permission.WRITE_EXTERNAL_STORAGE');
  }
}, {
  id: 'V-242862',
  category: 'CAT I',
  label: 'READ_EXTERNAL_STORAGE',
  description: 'The app must not request READ_EXTERNAL_STORAGE permission unless absolutely necessary. This can expose sensitive data.',
  matcher: function matcher(_ref6) {
    var permissions = _ref6.permissions;
    return permissions.includes('android.permission.READ_EXTERNAL_STORAGE');
  }
}, {
  id: 'V-242863',
  category: 'CAT I',
  label: 'INTERNET',
  description: 'The app must not request INTERNET permission unless required. Unrestricted internet access can expose sensitive data.',
  matcher: function matcher(_ref7) {
    var permissions = _ref7.permissions;
    return permissions.includes('android.permission.INTERNET');
  }
}, {
  id: 'V-242864',
  category: 'CAT II',
  label: 'ACCESS_COARSE_LOCATION',
  description: 'The app must not request ACCESS_COARSE_LOCATION permission unless required. This can expose user location.',
  matcher: function matcher(_ref8) {
    var permissions = _ref8.permissions;
    return permissions.includes('android.permission.ACCESS_COARSE_LOCATION');
  }
}, {
  id: 'V-242865',
  category: 'CAT II',
  label: 'ACCESS_BACKGROUND_LOCATION',
  description: 'The app must not request ACCESS_BACKGROUND_LOCATION permission unless required. This can expose user location in the background.',
  matcher: function matcher(_ref9) {
    var permissions = _ref9.permissions;
    return permissions.includes('android.permission.ACCESS_BACKGROUND_LOCATION');
  }
}, {
  id: 'V-242866',
  category: 'CAT II',
  label: 'SYSTEM_ALERT_WINDOW',
  description: 'The app must not request SYSTEM_ALERT_WINDOW permission unless required. This can allow overlay attacks.',
  matcher: function matcher(_ref10) {
    var permissions = _ref10.permissions;
    return permissions.includes('android.permission.SYSTEM_ALERT_WINDOW');
  }
}, {
  id: 'V-242867',
  category: 'CAT II',
  label: 'PACKAGE_USAGE_STATS',
  description: 'The app must not request PACKAGE_USAGE_STATS permission unless required. This can expose app usage data.',
  matcher: function matcher(_ref11) {
    var permissions = _ref11.permissions;
    return permissions.includes('android.permission.PACKAGE_USAGE_STATS');
  }
}, {
  id: 'V-242868',
  category: 'CAT II',
  label: 'BLUETOOTH',
  description: 'The app must not request BLUETOOTH permission unless required. This can expose device connectivity.',
  matcher: function matcher(_ref12) {
    var permissions = _ref12.permissions;
    return permissions.includes('android.permission.BLUETOOTH');
  }
}, {
  id: 'V-242869',
  category: 'CAT II',
  label: 'BLUETOOTH_ADMIN',
  description: 'The app must not request BLUETOOTH_ADMIN permission unless required. This can expose device connectivity.',
  matcher: function matcher(_ref13) {
    var permissions = _ref13.permissions;
    return permissions.includes('android.permission.BLUETOOTH_ADMIN');
  }
}, {
  id: 'V-242870',
  category: 'CAT II',
  label: 'NFC',
  description: 'The app must not request NFC permission unless required. This can expose device connectivity.',
  matcher: function matcher(_ref14) {
    var permissions = _ref14.permissions;
    return permissions.includes('android.permission.NFC');
  }
}, {
  id: 'V-242857',
  category: 'CAT II',
  label: 'READ_PHONE_STATE',
  description: 'The app must not request READ_PHONE_STATE permission unless required. This can expose device information.',
  matcher: function matcher(_ref15) {
    var permissions = _ref15.permissions;
    return permissions.includes('android.permission.READ_PHONE_STATE');
  }
}, {
  id: 'V-242858',
  category: 'CAT II',
  label: 'ACCESS_FINE_LOCATION',
  description: 'The app must not request ACCESS_FINE_LOCATION permission unless required. This can expose user location.',
  matcher: function matcher(_ref16) {
    var permissions = _ref16.permissions;
    return permissions.includes('android.permission.ACCESS_FINE_LOCATION');
  }
}, {
  id: 'V-242859',
  category: 'CAT II',
  label: 'CAMERA',
  description: 'The app must not request CAMERA permission unless required. This can expose user privacy.',
  matcher: function matcher(_ref17) {
    var permissions = _ref17.permissions;
    return permissions.includes('android.permission.CAMERA');
  }
}, {
  id: 'V-242860',
  category: 'CAT II',
  label: 'RECORD_AUDIO',
  description: 'The app must not request RECORD_AUDIO permission unless required. This can expose user privacy.',
  matcher: function matcher(_ref18) {
    var permissions = _ref18.permissions;
    return permissions.includes('android.permission.RECORD_AUDIO');
  }
}];

function normalizeBoolean(value) {
  if (value === undefined || value === null) {
    return false;
  }

  return String(value).trim().toLowerCase() === 'true';
}

function parseXmlAttributes(attrString) {
  var attributes = {};
  var regex = /([A-Za-z0-9:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  var match = undefined;

  while ((match = regex.exec(attrString)) !== null) {
    var _name = match[1];
    var value = match[2] || match[3] || match[4] || '';
    attributes[_name] = value;
  }

  return attributes;
}

function listTags(xml, tagNames) {
  var tags = [].concat(_toConsumableArray(xml.matchAll(/<([A-Za-z0-9:_-]+)(\s[^>]*)?>/g)));

  return tags.filter(function (_ref19) {
    var _ref192 = _slicedToArray(_ref19, 2);

    var _ = _ref192[0];
    var tagName = _ref192[1];
    return tagNames.includes(tagName);
  }).map(function (match) {
    return _extends({
      name: match[1]
    }, parseXmlAttributes(match[2] || ''));
  });
}

function collectPermissions(xml) {
  var matches = [].concat(_toConsumableArray(xml.matchAll(/<uses-permission\b[^>]*(?:android:name|name)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)));
  return matches.map(function (match) {
    return match[1] || match[2] || match[3];
  }).filter(Boolean).map(function (value) {
    return value.trim();
  });
}

function collectManifestData(xml) {
  var normalizedXml = xml || '';
  var applicationTags = listTags(normalizedXml, ['application']);
  var exportedTags = listTags(normalizedXml, ['activity', 'service', 'receiver', 'provider']);
  var permissions = collectPermissions(normalizedXml);
  var application = applicationTags[0] || {};

  return { application: application, exportedTags: exportedTags, permissions: permissions };
}

function getComplianceSummary(issues) {
  var total = Array.isArray(issues) ? issues.length : 0;
  var catI = issues.filter(function (issue) {
    return issue.category === 'CAT I';
  }).length;
  var catII = issues.filter(function (issue) {
    return issue.category === 'CAT II';
  }).length;
  var catIII = issues.filter(function (issue) {
    return issue.category === 'CAT III';
  }).length;

  return {
    total: total,
    catI: catI,
    catII: catII,
    catIII: catIII,
    compliant: total === 0
  };
}

function checkSTIG(manifest) {
  if (!manifest || typeof manifest !== 'string') {
    return [];
  }

  var _collectManifestData = collectManifestData(manifest);

  var application = _collectManifestData.application;
  var exportedTags = _collectManifestData.exportedTags;
  var permissions = _collectManifestData.permissions;

  var issues = [];
  var seen = new Set();

  var pushIssue = function pushIssue(rule) {
    var key = rule.id;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    issues.push({
      id: rule.id,
      category: rule.category,
      label: rule.label,
      description: rule.description
    });
  };

  RULES.forEach(function (rule) {
    var shouldFlag = rule.matcher({ application: application, exportedTags: exportedTags, permissions: permissions });
    if (shouldFlag) {
      pushIssue(rule);
    }
  });

  return issues;
}

module.exports = {
  checkSTIG: checkSTIG,
  getComplianceSummary: getComplianceSummary
};