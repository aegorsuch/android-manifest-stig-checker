import { XMLParser, XMLValidator } from 'fast-xml-parser';

const REVIEW_PERMISSIONS = new Set([
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.INTERNET',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.PACKAGE_USAGE_STATS',
  'android.permission.BLUETOOTH',
  'android.permission.BLUETOOTH_ADMIN',
  'android.permission.NFC',
  'android.permission.READ_PHONE_STATE',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
]);

const RULES = [
  {
    id: 'manifest-debuggable',
    category: 'Manifest',
    label: 'debuggable="true"',
    description: 'The AndroidManifest.xml must not set android:debuggable="true" in production. This allows remote memory extraction and debugging.',
    matcher: (context) => applicationBooleanEvidence(context, 'debuggable'),
  },
  {
    id: 'manifest-backup-enabled',
    category: 'Manifest',
    label: 'allowBackup="true"',
    description: 'The AndroidManifest.xml must not set android:allowBackup="true". This permits local data extraction via ADB.',
    matcher: (context) => applicationBooleanEvidence(context, 'allowBackup'),
  },
  {
    id: 'manifest-cleartext-traffic',
    category: 'Manifest',
    label: 'usesCleartextTraffic',
    description: 'The AndroidManifest.xml must not allow cleartext traffic. All network traffic must be encrypted.',
    matcher: (context) => applicationBooleanEvidence(context, 'usesCleartextTraffic'),
  },
  {
    id: 'component-exported',
    category: 'Manifest',
    label: 'Exported Components',
    description: 'Exported components must be restricted. android:exported="true" can allow malicious apps to hijack intents.',
    matcher: exportedComponentEvidence,
  },
  {
    id: 'permission-write-external-storage',
    category: 'Permission',
    label: 'WRITE_EXTERNAL_STORAGE',
    description: 'The app must not request WRITE_EXTERNAL_STORAGE permission unless absolutely necessary. This can expose sensitive data.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.WRITE_EXTERNAL_STORAGE'),
  },
  {
    id: 'permission-read-external-storage',
    category: 'Permission',
    label: 'READ_EXTERNAL_STORAGE',
    description: 'The app must not request READ_EXTERNAL_STORAGE permission unless absolutely necessary. This can expose sensitive data.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.READ_EXTERNAL_STORAGE'),
  },
  {
    id: 'permission-internet',
    category: 'Permission',
    label: 'INTERNET',
    description: 'The app must not request INTERNET permission unless required. Unrestricted internet access can expose sensitive data.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.INTERNET'),
  },
  {
    id: 'permission-coarse-location',
    category: 'Permission',
    label: 'ACCESS_COARSE_LOCATION',
    description: 'The app must not request ACCESS_COARSE_LOCATION permission unless required. This can expose user location.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.ACCESS_COARSE_LOCATION'),
  },
  {
    id: 'permission-background-location',
    category: 'Permission',
    label: 'ACCESS_BACKGROUND_LOCATION',
    description: 'The app must not request ACCESS_BACKGROUND_LOCATION permission unless required. This can expose user location in the background.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.ACCESS_BACKGROUND_LOCATION'),
  },
  {
    id: 'permission-system-alert-window',
    category: 'Permission',
    label: 'SYSTEM_ALERT_WINDOW',
    description: 'The app must not request SYSTEM_ALERT_WINDOW permission unless required. This can allow overlay attacks.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.SYSTEM_ALERT_WINDOW'),
  },
  {
    id: 'permission-package-usage-stats',
    category: 'Permission',
    label: 'PACKAGE_USAGE_STATS',
    description: 'The app must not request PACKAGE_USAGE_STATS permission unless required. This can expose app usage data.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.PACKAGE_USAGE_STATS'),
  },
  {
    id: 'permission-bluetooth',
    category: 'Permission',
    label: 'BLUETOOTH',
    description: 'The app must not request BLUETOOTH permission unless required. This can expose device connectivity.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.BLUETOOTH'),
  },
  {
    id: 'permission-bluetooth-admin',
    category: 'Permission',
    label: 'BLUETOOTH_ADMIN',
    description: 'The app must not request BLUETOOTH_ADMIN permission unless required. This can expose device connectivity.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.BLUETOOTH_ADMIN'),
  },
  {
    id: 'permission-nfc',
    category: 'Permission',
    label: 'NFC',
    description: 'The app must not request NFC permission unless required. This can expose device connectivity.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.NFC'),
  },
  {
    id: 'permission-read-phone-state',
    category: 'Permission',
    label: 'READ_PHONE_STATE',
    description: 'The app must not request READ_PHONE_STATE permission unless required. This can expose device information.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.READ_PHONE_STATE'),
  },
  {
    id: 'permission-fine-location',
    category: 'Permission',
    label: 'ACCESS_FINE_LOCATION',
    description: 'The app must not request ACCESS_FINE_LOCATION permission unless required. This can expose user location.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.ACCESS_FINE_LOCATION'),
  },
  {
    id: 'permission-camera',
    category: 'Permission',
    label: 'CAMERA',
    description: 'The app must not request CAMERA permission unless required. This can expose user privacy.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.CAMERA'),
  },
  {
    id: 'permission-record-audio',
    category: 'Permission',
    label: 'RECORD_AUDIO',
    description: 'The app must not request RECORD_AUDIO permission unless required. This can expose user privacy.',
    status: 'review',
    matcher: (context) => permissionEvidence(context, 'android.permission.RECORD_AUDIO'),
  },
];

export function normalizeBoolean(value) {
  if (value === undefined || value === null) {
    return false;
  }

  return String(value).trim().toLowerCase() === 'true';
}

function findAttribute(attributes, name) {
  const key = [`android:${name}`, name].find((candidate) => Object.hasOwn(attributes, candidate));
  return key ? { key, value: String(attributes[key]) } : null;
}

function applicationBooleanEvidence({ application }, name) {
  const attribute = findAttribute(application, name);
  return attribute && normalizeBoolean(attribute.value)
    ? [{ element: 'application', attribute: attribute.key, value: attribute.value }]
    : [];
}

function exportedComponentEvidence({ exportedTags }) {
  return exportedTags.flatMap(({ tagName, attributes }) => {
    const exported = findAttribute(attributes, 'exported');
    if (!exported || !normalizeBoolean(exported.value)) return [];

    const componentName = findAttribute(attributes, 'name');
    return [{
      element: tagName,
      component: componentName?.value,
      nameAttribute: componentName?.key,
      attribute: exported.key,
      value: exported.value,
    }];
  });
}

function permissionEvidence({ permissions }, name) {
  return permissions
    .filter((permission) => permission.name === name)
    .map(({ evidence }) => evidence);
}

export function formatEvidence(evidence) {
  const component = evidence.component
    ? ` ${evidence.nameAttribute}="${evidence.component}"`
    : '';
  return `<${evidence.element}${component} ${evidence.attribute}="${evidence.value}">`;
}

export function parseXmlAttributes(attrString) {
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

export function listTags(xml, tagNames) {
  const tags = [...xml.matchAll(/<([A-Za-z0-9:_-]+)(\s[^>]*)?>/g)];

  return tags
    .filter(([_, tagName]) => tagNames.includes(tagName))
    .map((match) => ({
      name: match[1],
      ...parseXmlAttributes(match[2] || ''),
    }));
}

export function collectPermissions(xml) {
  const matches = [...xml.matchAll(/<uses-permission\b[^>]*(?:android:name|name)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)];
  return matches
    .map((match) => match[1] || match[2] || match[3])
    .filter(Boolean)
    .map((value) => value.trim());
}

export function collectManifestData(xml) {
  const parser = new XMLParser({
    attributeNamePrefix: '',
    ignoreAttributes: false,
    preserveOrder: true,
    processEntities: false,
    trimValues: true,
  });
  const parsed = parser.parse(xml);
  const applicationTags = [];
  const exportedTags = [];
  const permissions = [];

  const visit = (nodes) => {
    if (!Array.isArray(nodes)) return;

    nodes.forEach((node) => {
      Object.entries(node).forEach(([name, children]) => {
        if (name === ':@' || name === '#text') return;

        const attributes = node[':@'] || {};
        if (name === 'application') applicationTags.push(attributes);
        if (['activity', 'service', 'receiver', 'provider'].includes(name)) {
          exportedTags.push({ tagName: name, attributes });
        }
        if (name === 'uses-permission') {
          const permission = findAttribute(attributes, 'name');
          if (permission) {
            permissions.push({
              name: permission.value.trim(),
              evidence: {
                element: name,
                attribute: permission.key,
                value: permission.value.trim(),
              },
            });
          }
        }

        visit(children);
      });
    });
  };

  visit(parsed);

  return { application: applicationTags[0] || {}, exportedTags, permissions };
}

export function getComplianceSummary(issues) {
  const total = Array.isArray(issues) ? issues.length : 0;
  const failures = issues.filter((issue) => issue.status === 'fail').length;
  const reviews = issues.filter((issue) => issue.status === 'review').length;

  return {
    total,
    failures,
    reviews,
    compliant: total === 0,
  };
}

export function checkSTIG(manifest) {
  return analyzeManifest(manifest).issues;
}

export function analyzeManifest(manifest) {
  if (typeof manifest !== 'string' || !manifest.trim()) {
    return { status: 'empty', errors: ['Paste or upload an AndroidManifest.xml before checking.'], issues: [], summary: getComplianceSummary([]) };
  }

  const validation = XMLValidator.validate(manifest);
  if (validation !== true) {
    const message = validation?.err?.msg || 'The manifest is not valid XML.';
    return { status: 'invalid', errors: [message], issues: [], summary: getComplianceSummary([]) };
  }

  let data;
  try {
    data = collectManifestData(manifest);
  } catch (error) {
    return { status: 'invalid', errors: [error.message || 'The manifest could not be parsed.'], issues: [], summary: getComplianceSummary([]) };
  }

  const { application, exportedTags, permissions } = data;
  const issues = [];
  const pushIssue = (rule, evidence) => {
    issues.push({
      id: rule.id,
      category: rule.category,
      label: rule.label,
      description: rule.description,
      status: rule.status || 'fail',
      evidence,
    });
  };

  RULES.forEach((rule) => {
    const evidence = rule.matcher({ application, exportedTags, permissions });
    if (evidence.length) {
      pushIssue(rule, evidence);
    }
  });

  return { status: issues.some((issue) => issue.status === 'fail') ? 'failed' : issues.length ? 'review' : 'compliant', errors: [], issues, summary: getComplianceSummary(issues) };
}
