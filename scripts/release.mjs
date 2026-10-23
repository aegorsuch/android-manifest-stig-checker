import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const canonical = 'https://git.tak.gov/aegorsuch/android-manifest-stig-checker';
export const repository = 'aegorsuch/android-manifest-stig-checker';
const marker = '<!-- canonical-validated-web-bundle:v1 -->';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export function context(env, pkg) {
  assert.equal(env.CI_PROJECT_URL, canonical, 'Only the canonical project may package/publish');
  assert.match(env.CI_COMMIT_SHA ?? '', /^[a-f0-9]{40}$/, 'Full source SHA required');
  assert.match(pkg.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/, 'Package version required');
  assert.equal(pkg.name, 'android-manifest-stig-checker');
  for (const key of ['CI_PIPELINE_ID', 'CI_JOB_ID']) {
    assert.match(env[key] ?? '', /^\d+$/, `${key} required`);
  }
  assert.equal(env.CI_PIPELINE_URL, `${canonical}/-/pipelines/${env.CI_PIPELINE_ID}`);
  assert.equal(env.CI_JOB_URL, `${canonical}/-/jobs/${env.CI_JOB_ID}`);
  return {
    version: pkg.version,
    sha: env.CI_COMMIT_SHA,
    tag: `web-v${pkg.version}-${env.CI_COMMIT_SHA}`,
    archive: `${pkg.name}-web-v${pkg.version}-${env.CI_COMMIT_SHA}.zip`,
    pipeline: env.CI_PIPELINE_URL,
    validationJob: env.CI_JOB_URL,
  };
}

async function regularFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), 'Bundle must not contain symlinks');
    if (entry.isDirectory()) files.push(...await regularFiles(filename));
    else {
      assert(entry.isFile(), 'Bundle must contain only regular files');
      files.push(filename);
    }
  }
  return files.sort();
}

export async function packageBundle(env = process.env) {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const info = context(env, pkg);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), info.sha);
  const files = await regularFiles('dist');
  assert(files.includes(path.join('dist', 'index.html')), 'Built index.html required');
  assert(files.some(file => file.endsWith('.js')), 'Built JavaScript required');
  await mkdir('release'); // Refuse to reuse stale output.
  execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['-c', `
import pathlib, sys, zipfile
with zipfile.ZipFile(sys.argv[1], "x", zipfile.ZIP_DEFLATED) as archive:
    for entry in sorted(pathlib.Path(".").rglob("*")):
        if entry.is_file():
            archive.write(entry, entry.as_posix())
`, path.resolve('release', info.archive)], { cwd: 'dist' });
  const bytes = await readFile(path.join('release', info.archive));
  const metadata = {
    ...info,
    sha256: digest(bytes),
    source: `${canonical}/-/commit/${info.sha}`,
    contents: 'Vite static web bundle; not an Android APK or STIG compliance certification',
  };
  await writeFile(path.join('release', `${info.archive}.sha256`), `${metadata.sha256}  ${info.archive}\n`);
  await writeFile('release/provenance.json', `${JSON.stringify(metadata, null, 2)}\n`);
}

export function releaseBody(info, publishJob) {
  const download = `https://github.com/${repository}/releases/download/${encodeURIComponent(info.tag)}`;
  return `${marker}
Validated static **web bundle**, not an Android APK or STIG compliance certification.
Host it under the existing /android-manifest-stig-checker/ base path.
This does not update GitHub Pages.

Version: **${info.version}**
Source commit: [${info.sha}](${canonical}/-/commit/${info.sha})
Canonical validation pipeline: ${info.pipeline}
Tests/build/package job: ${info.validationJob}
Publisher job: ${publishJob}

- [Download static web bundle (ZIP)](${download}/${encodeURIComponent(info.archive)})
- [Download separate SHA256 checksum](${download}/${encodeURIComponent(info.archive)}.sha256)
- [Download source and build provenance (JSON)](${download}/provenance.json)

SHA256 (\`${info.archive}\`): \`${info.sha256}\`
`;
}

export async function verifyBundle(env) {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const current = context(env, pkg);
  const info = JSON.parse(await readFile('release/provenance.json', 'utf8'));
  for (const key of ['version', 'sha', 'tag', 'archive', 'pipeline']) {
    assert.equal(info[key], current[key], `Stale or mismatched artifact: ${key}`);
  }
  assert.match(info.validationJob, new RegExp(`^${canonical.replaceAll('.', '\\.')}/-/jobs/\\d+$`));
  const files = (await readdir('release')).sort();
  assert.deepEqual(files, [info.archive, `${info.archive}.sha256`, 'provenance.json'].sort());
  const bytes = await readFile(path.join('release', info.archive));
  assert.equal(info.sha256, digest(bytes), 'Archive digest mismatch');
  assert.equal(await readFile(path.join('release', `${info.archive}.sha256`), 'utf8'),
    `${info.sha256}  ${info.archive}\n`, 'Checksum file mismatch');
  return { info, current };
}

export async function publishBundle({
  env = process.env,
  request = fetch,
  checkCanonical = () => {
    const origin = new URL(execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim());
    assert.equal(origin.origin + origin.pathname.replace(/\.git$/, ''), canonical);
    const line = execFileSync('git', ['ls-remote', 'origin', `refs/heads/${env.CI_DEFAULT_BRANCH}`],
      { encoding: 'utf8' }).trim();
    assert.equal(line.split(/\s+/)[0], env.CI_COMMIT_SHA, 'Canonical default moved; refusing stale release');
    assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), env.CI_COMMIT_SHA);
  },
} = {}) {
  assert.equal(env.CI_PIPELINE_SOURCE, 'push', 'Only push pipelines may publish');
  assert.equal(env.CI_COMMIT_REF_PROTECTED, 'true', 'Protected default branch required');
  assert.match(env.CI_DEFAULT_BRANCH ?? '', /^[A-Za-z0-9][A-Za-z0-9._/-]*$/);
  assert.equal(env.CI_COMMIT_BRANCH, env.CI_DEFAULT_BRANCH, 'Only default branch may publish');
  assert(env.GITHUB_RELEASE_TOKEN, 'Missing protected GITHUB_RELEASE_TOKEN; publishing is not configured');
  const { info, current } = await verifyBundle(env);
  const headers = {
    Authorization: `Bearer ${env.GITHUB_RELEASE_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  async function api(route, method = 'GET', body) {
    const response = await request(`https://api.github.com/repos/${repository}${route}`, {
      method, headers: { ...headers, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      redirect: 'error',
    });
    if (!response.ok) throw new Error(`GitHub ${method} ${route}: HTTP ${response.status}`);
    return response.json();
  }
  async function fresh() {
    await checkCanonical();
    const repo = await api('');
    assert.equal(repo.default_branch, env.CI_DEFAULT_BRANCH, 'GitHub mirror default differs');
    const commit = await api(`/commits/${encodeURIComponent(repo.default_branch)}`);
    assert.equal(commit.sha, info.sha, 'GitHub mirror has not synchronized canonical default');
  }
  await fresh();
  // Never edit an existing release/tag, including a draft left by a failed run.
  for (const route of [`/releases/tags/${encodeURIComponent(info.tag)}`, `/git/ref/tags/${encodeURIComponent(info.tag)}`]) {
    const response = await request(`https://api.github.com/repos/${repository}${route}`, { headers, redirect: 'error' });
    assert.equal(response.status, 404, `Existing release/tag or inaccessible target: ${route}; inspect manually`);
  }
  const body = releaseBody(info, current.validationJob);
  const draft = await api('/releases', 'POST', {
    tag_name: info.tag, target_commitish: info.sha,
    name: `Static web bundle v${info.version} (${info.sha.slice(0, 12)})`,
    body, draft: true, prerelease: true, make_latest: 'false',
  });
  assert(Number.isSafeInteger(draft.id), 'Invalid draft ID');
  const labels = {
    [info.archive]: 'Static web bundle (ZIP; not APK)',
    [`${info.archive}.sha256`]: 'SHA256 checksum',
    'provenance.json': 'Source and validation provenance',
  };
  for (const [name, label] of Object.entries(labels)) {
    const bytes = await readFile(path.join('release', name));
    const query = new URLSearchParams({ name, label });
    const response = await request(`https://uploads.github.com/repos/${repository}/releases/${draft.id}/assets?${query}`, {
      method: 'POST', headers: { ...headers, 'Content-Type': name.endsWith('.zip') ? 'application/zip' : 'text/plain' },
      body: bytes, redirect: 'error',
    });
    assert(response.ok, `Upload ${name}: HTTP ${response.status}; draft retained for inspection`);
    const asset = await response.json();
    assert.equal(asset.name, name);
    assert.equal(asset.state, 'uploaded');
    assert.equal(asset.size, bytes.length, 'Uploaded size mismatch');
    assert.equal(asset.digest, `sha256:${digest(bytes)}`, 'GitHub asset digest mismatch');
  }
  await fresh();
  const live = await api(`/releases/${draft.id}`);
  assert.equal(live.draft, true);
  assert.equal(live.body, body, 'Draft changed concurrently');
  assert.equal(live.tag_name, info.tag);
  assert.equal(live.target_commitish, info.sha);
  assert.deepEqual(live.assets.map(asset => asset.name).sort(), Object.keys(labels).sort(), 'Draft assets changed');
  for (const asset of live.assets) {
    const bytes = await readFile(path.join('release', asset.name));
    assert.equal(asset.state, 'uploaded');
    assert.equal(asset.size, bytes.length);
    assert.equal(asset.digest, `sha256:${digest(bytes)}`, 'Draft asset changed concurrently');
  }
  const tag = await request(`https://api.github.com/repos/${repository}/git/ref/tags/${encodeURIComponent(info.tag)}`,
    { headers, redirect: 'error' });
  assert.equal(tag.status, 404, 'Tag appeared concurrently; inspect the retained draft manually');
  const published = await api(`/releases/${draft.id}`, 'PATCH', { draft: false, make_latest: 'false' });
  assert.equal(published.draft, false, 'Release was not published');
  console.log(`Published static web bundle ${info.tag}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'package') await packageBundle();
  else if (process.argv[2] === 'publish') await publishBundle();
  else throw new Error('Usage: node scripts/release.mjs package|publish');
}
