const RULES = [
  {
    id: 'V-242851',
    category: 'CAT I',
    label: 'debuggable="true"',
    description: 'The AndroidManifest.xml must not set android:debuggable="true" in production. This allows remote memory extraction and debugging.',
    matcher: ({ application }) => normalizeBoolean(application['android:debuggable'] || application.debuggable),
  },
  {
    id: 'V-242852',
    category: 'CAT II',
    label: 'allowBackup="true"',
    description: 'The AndroidManifest.xml must not set android:allowBackup="true". This permits local data extraction via ADB.',
    matcher: ({ application }) => normalizeBoolean(application['android:allowBackup'] || application.allowBackup),
  },
  {
    id: 'V-242854',
    category: 'CAT I',
    label: 'usesCleartextTraffic',
    description: 'The AndroidManifest.xml must not allow cleartext traffic. All network traffic must be encrypted.',
    matcher: ({ application }) => normalizeBoolean(application['android:usesCleartextTraffic'] || application.usesCleartextTraffic),
  },
  {
    id: 'V-242855',
    category: 'CAT II',
    label: 'Exported Components',
    description: 'Exported components must be restricted. android:exported="true" can allow malicious apps to hijack intents.',
    matcher: ({ exportedTags }) => exportedTags.some((tag) => normalizeBoolean(tag['android:exported'] || tag.exported)),
  },
  {
    id: 'V-242856',
    category: 'CAT II',
    label: 'WRITE_EXTERNAL_STORAGE',
    description: 'The app must not request WRITE_EXTERNAL_STORAGE permission unless absolutely necessary. This can expose sensitive data.',
    matcher: ({ permissions }) => permissions.includes('android.permission.WRITE_EXTERNAL_STORAGE'),
  },
  {
    id: 'V-242862',
    category: 'CAT I',
    label: 'READ_EXTERNAL_STORAGE',
    description: 'The app must not request READ_EXTERNAL_STORAGE permission unless absolutely necessary. This can expose sensitive data.',
    matcher: ({ permissions }) => permissions.includes('android.permission.READ_EXTERNAL_STORAGE'),
  },
  {
    id: 'V-242863',
    category: 'CAT I',
    label: 'INTERNET',
    description: 'The app must not request INTERNET permission unless required. Unrestricted internet access can expose sensitive data.',
    matcher: ({ permissions }) => permissions.includes('android.permission.INTERNET'),
  },
  {
    id: 'V-242864',
    category: 'CAT II',
    label: 'ACCESS_COARSE_LOCATION',
    description: 'The app must not request ACCESS_COARSE_LOCATION permission unless required. This can expose user location.',
    matcher: ({ permissions }) => permissions.includes('android.permission.ACCESS_COARSE_LOCATION'),
  },
  {
    id: 'V-242865',
    category: 'CAT II',
    label: 'ACCESS_BACKGROUND_LOCATION',
    description: 'The app must not request ACCESS_BACKGROUND_LOCATION permission unless required. This can expose user location in the background.',
    matcher: ({ permissions }) => permissions.includes('android.permission.ACCESS_BACKGROUND_LOCATION'),
  },
  {
    id: 'V-242866',
    category: 'CAT II',
    label: 'SYSTEM_ALERT_WINDOW',
    description: 'The app must not request SYSTEM_ALERT_WINDOW permission unless required. This can allow overlay attacks.',
    matcher: ({ permissions }) => permissions.includes('android.permission.SYSTEM_ALERT_WINDOW'),
  },
  {
    id: 'V-242867',
    category: 'CAT II',
    label: 'PACKAGE_USAGE_STATS',
    description: 'The app must not request PACKAGE_USAGE_STATS permission unless required. This can expose app usage data.',
    matcher: ({ permissions }) => permissions.includes('android.permission.PACKAGE_USAGE_STATS'),
  },
  {
    id: 'V-242868',
    category: 'CAT II',
    label: 'BLUETOOTH',
    description: 'The app must not request BLUETOOTH permission unless required. This can expose device connectivity.',
    matcher: ({ permissions }) => permissions.includes('android.permission.BLUETOOTH'),
  },
  {
    id: 'V-242869',
    category: 'CAT II',
    label: 'BLUETOOTH_ADMIN',
    description: 'The app must not request BLUETOOTH_ADMIN permission unless required. This can expose device connectivity.',
    matcher: ({ permissions }) => permissions.includes('android.permission.BLUETOOTH_ADMIN'),
  },
  {
    id: 'V-242870',
    category: 'CAT II',
    label: 'NFC',
    description: 'The app must not request NFC permission unless required. This can expose device connectivity.',
    matcher: ({ permissions }) => permissions.includes('android.permission.NFC'),
  },
  {
    id: 'V-242857',
    category: 'CAT II',
    label: 'READ_PHONE_STATE',
    description: 'The app must not request READ_PHONE_STATE permission unless required. This can expose device information.',
    matcher: ({ permissions }) => permissions.includes('android.permission.READ_PHONE_STATE'),
  },
  {
    id: 'V-242858',
    category: 'CAT II',
    label: 'ACCESS_FINE_LOCATION',
    description: 'The app must not request ACCESS_FINE_LOCATION permission unless required. This can expose user location.',
    matcher: ({ permissions }) => permissions.includes('android.permission.ACCESS_FINE_LOCATION'),
  },
  {
    id: 'V-242859',
    category: 'CAT II',
    label: 'CAMERA',
    description: 'The app must not request CAMERA permission unless required. This can expose user privacy.',
    matcher: ({ permissions }) => permissions.includes('android.permission.CAMERA'),
  },
  {
    id: 'V-242860',
    category: 'CAT II',
    label: 'RECORD_AUDIO',
    description: 'The app must not request RECORD_AUDIO permission unless required. This can expose user privacy.',
    matcher: ({ permissions }) => permissions.includes('android.permission.RECORD_AUDIO'),
  },
];

function normalizeBoolean(value) {
  if (value === undefined || value === null) {
    return false;
  }

  return String(value).trim().toLowerCase() === 'true';
}

function parseXmlAttributes(attrString) {
  const attributes = {};
  const regex = /([A-Za-z0-9:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match;

  while ((match = regex.exec(attrString)) !== null) {
    const name = match[1];
    const value = match[2] || match[3] || match[4] || '';
    attributes[name] = value;
  }

  return attributes;
}

function listTags(xml, tagNames) {
  const tags = [...xml.matchAll(/<([A-Za-z0-9:_-]+)(\s[^>]*)?>/g)];

  return tags
    .filter(([_, tagName]) => tagNames.includes(tagName))
    .map((match) => ({
      name: match[1],
      ...parseXmlAttributes(match[2] || ''),
    }));
}

function collectPermissions(xml) {
  const matches = [...xml.matchAll(/<uses-permission\b[^>]*(?:android:name|name)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)];
  return matches
    .map((match) => match[1] || match[2] || match[3])
    .filter(Boolean)
    .map((value) => value.trim());
}

function collectManifestData(xml) {
  const normalizedXml = xml || '';
  const applicationTags = listTags(normalizedXml, ['application']);
  const exportedTags = listTags(normalizedXml, ['activity', 'service', 'receiver', 'provider']);
  const permissions = collectPermissions(normalizedXml);
  const application = applicationTags[0] || {};

  return { application, exportedTags, permissions };
}

function getComplianceSummary(issues) {
  const total = Array.isArray(issues) ? issues.length : 0;
  const catI = issues.filter((issue) => issue.category === 'CAT I').length;
  const catII = issues.filter((issue) => issue.category === 'CAT II').length;
  const catIII = issues.filter((issue) => issue.category === 'CAT III').length;

  return {
    total,
    catI,
    catII,
    catIII,
    compliant: total === 0,
  };
}

function checkSTIG(manifest) {
  if (!manifest || typeof manifest !== 'string') {
    return [];
  }

  const { application, exportedTags, permissions } = collectManifestData(manifest);
  const issues = [];
  const seen = new Set();

  const pushIssue = (rule) => {
    const key = rule.id;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    issues.push({
      id: rule.id,
      category: rule.category,
      label: rule.label,
      description: rule.description,
    });
  };

  RULES.forEach((rule) => {
    const shouldFlag = rule.matcher({ application, exportedTags, permissions });
    if (shouldFlag) {
      pushIssue(rule);
    }
  });

  return issues;
}

module.exports = {
  checkSTIG,
  getComplianceSummary,
};
