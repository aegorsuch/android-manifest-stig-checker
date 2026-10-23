import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { canonical, context, packageBundle, publishBundle, releaseBody, verifyBundle } from './release.mjs';

const sha = 'a'.repeat(40);
const pkg = { name: 'android-manifest-stig-checker', version: '1.0.0' };
const env = {
  CI_PROJECT_URL: canonical,
  CI_COMMIT_SHA: sha,
  CI_PIPELINE_ID: '101',
  CI_PIPELINE_URL: `${canonical}/-/pipelines/101`,
  CI_JOB_ID: '201',
  CI_JOB_URL: `${canonical}/-/jobs/201`,
  CI_DEFAULT_BRANCH: 'main',
  CI_COMMIT_BRANCH: 'main',
  CI_PIPELINE_SOURCE: 'push',
  CI_COMMIT_REF_PROTECTED: 'true',
  GITHUB_RELEASE_TOKEN: 'offline-test-value',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function fixture(run) {
  const original = process.cwd();
  const directory = await mkdtemp(path.join(original, 'node_modules', '.web-release-test-'));
  try {
    process.chdir(directory);
    await mkdir('release');
    await writeFile('package.json', JSON.stringify(pkg));
    const bytes = Buffer.from('offline archive fixture');
    const info = { ...context(env, pkg), sha256: hash(bytes), validationJob: `${canonical}/-/jobs/200` };
    await writeFile(path.join('release', info.archive), bytes);
    await writeFile(path.join('release', `${info.archive}.sha256`), `${info.sha256}  ${info.archive}\n`);
    await writeFile('release/provenance.json', JSON.stringify(info));
    await run(info);
  } finally {
    process.chdir(original);
    await rm(directory, { recursive: true, force: true });
  }
}

function mockGitHub(info, options = {}) {
  const calls = [];
  const assets = [];
  let draft;
  let reads = 0;
  let tagReads = 0;
  const request = async (address, init = {}) => {
    const url = new URL(address);
    const method = init.method ?? 'GET';
    calls.push({ url: url.pathname, method });
    const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
    if (url.hostname === 'uploads.github.com') {
      const bytes = Buffer.from(init.body);
      const asset = {
        name: url.searchParams.get('name'), state: 'uploaded',
        size: bytes.length, digest: `sha256:${hash(bytes)}`,
      };
      if (options.uploadFailure) return response({}, 500);
      if (options.badDigest) asset.digest = `sha256:${'0'.repeat(64)}`;
      assets.push(asset);
      return response(asset, 201);
    }
    const route = url.pathname.replace(`/repos/aegorsuch/android-manifest-stig-checker`, '');
    if (route === '') return response({ default_branch: 'main' });
    if (route === '/commits/main') {
      reads++;
      return response({ sha: options.staleMirror && reads > 1 ? 'b'.repeat(40) : sha });
    }
    if (route.startsWith('/releases/tags/')) return response({}, options.existingRelease ? 200 : 404);
    if (route.startsWith('/git/ref/tags/')) {
      tagReads++;
      return response({}, options.existingTag || (options.concurrentTag && tagReads > 1) ? 200 : 404);
    }
    if (route === '/releases' && method === 'POST') {
      draft = { ...JSON.parse(init.body), id: 7 };
      assert.equal(draft.draft, true);
      assert.equal(draft.prerelease, true);
      assert.equal(draft.make_latest, 'false');
      assert.equal(draft.target_commitish, info.sha);
      assert(draft.body.includes(info.sha));
      return response(draft, 201);
    }
    if (route === '/releases/7' && method === 'GET') {
      return response({
        ...draft, assets,
        ...(options.manualEdit ? { body: 'Manually maintained release notes' } : {}),
        ...(options.changedAsset ? { assets: assets.map(asset => ({ ...asset, digest: 'changed' })) } : {}),
      });
    }
    if (route === '/releases/7' && method === 'PATCH') return response({ ...draft, ...JSON.parse(init.body) });
    throw new Error(`Unexpected offline request ${method} ${url.pathname}`);
  };
  return { request, calls };
}

test('names and notes use actual package version, full SHA, pipeline and separate downloads', () => {
  const info = { ...context(env, pkg), sha256: '1'.repeat(64) };
  assert(info.tag.endsWith(sha));
  assert(info.archive.endsWith(`${sha}.zip`));
  const notes = releaseBody(info, env.CI_JOB_URL);
  for (const expected of [sha, '1.0.0', env.CI_PIPELINE_URL, env.CI_JOB_URL, '.sha256',
    'not an Android APK or STIG compliance certification', 'Download static web bundle']) {
    assert(notes.includes(expected));
  }
  assert.throws(() => context({ ...env, CI_PROJECT_URL: 'https://github.com/fork/repo' }, pkg));
  assert.throws(() => context({ ...env, CI_COMMIT_SHA: 'shortsha' }, pkg));
});

test('refuses mismatched source/version/pipeline and tampered checksum or ZIP', async () => {
  await fixture(async info => {
    await verifyBundle(env);
    for (const [key, value] of [['CI_COMMIT_SHA', 'b'.repeat(40)], ['CI_PIPELINE_URL', `${canonical}/-/pipelines/102`]]) {
      await assert.rejects(verifyBundle({ ...env, [key]: value }));
    }
    await writeFile('package.json', JSON.stringify({ ...pkg, version: '2.0.0' }));
    await assert.rejects(verifyBundle(env), /version/);
    await writeFile('package.json', JSON.stringify(pkg));
    await writeFile(path.join('release', `${info.archive}.sha256`), 'incorrect');
    await assert.rejects(verifyBundle(env), /Checksum/);
    await writeFile(path.join('release', info.archive), 'tampered');
    await assert.rejects(verifyBundle(env), /digest/);
  });
});

test('successful publisher uploads three labeled assets then publishes a prerelease', async () => {
  await fixture(async info => {
    const mock = mockGitHub(info);
    let checks = 0;
    await publishBundle({ env, ...mock, checkCanonical: () => { checks++; } });
    assert.equal(checks, 2);
    assert.equal(mock.calls.filter(call => call.url.endsWith('/assets')).length, 3);
    assert.equal(mock.calls.at(-1).method, 'PATCH');
  });
});

test('branch, pipeline, protection and credential gates reject before any API access', async () => {
  for (const [key, value] of [['CI_COMMIT_BRANCH', 'feature'], ['CI_PIPELINE_SOURCE', 'web'],
    ['CI_COMMIT_REF_PROTECTED', 'false'], ['GITHUB_RELEASE_TOKEN', '']]) {
    await assert.rejects(publishBundle({
      env: { ...env, [key]: value },
      request: () => { throw new Error('Must not call API'); },
    }));
  }
});

test('packaging creates a real ZIP with root HTML, assets and dotfiles; stale output is rejected', async () => {
  const source = process.cwd();
  const originalSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const directory = await mkdtemp(path.join(source, 'node_modules', '.web-package-test-'));
  try {
    process.chdir(directory);
    await writeFile('package.json', JSON.stringify(pkg));
    await mkdir('dist/assets', { recursive: true });
    await writeFile('dist/index.html', '<html>test</html>');
    await writeFile('dist/.nojekyll', '');
    await writeFile('dist/assets/app.js', 'console.log("test")');
    const buildEnv = { ...env, CI_COMMIT_SHA: originalSha };
    await packageBundle(buildEnv);
    const { info } = await verifyBundle(buildEnv);
    const listing = execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['-c', `
import sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as archive:
    assert archive.testzip() is None
    print("\\n".join(sorted(archive.namelist())))
`, path.join('release', info.archive)], { encoding: 'utf8' }).trim();
    assert.deepEqual(listing.split(/\r?\n/), ['.nojekyll', 'assets/app.js', 'index.html']);
    await assert.rejects(packageBundle(buildEnv), /EEXIST/);
  } finally {
    process.chdir(source);
    await rm(directory, { recursive: true, force: true });
  }
});

test('existing releases/tags, failed uploads, stale source and manual edits never publish', async () => {
  await fixture(async info => {
    for (const options of [
      { existingRelease: true }, { existingTag: true }, { uploadFailure: true },
      { badDigest: true }, { staleMirror: true }, { manualEdit: true }, { changedAsset: true },
      { concurrentTag: true },
    ]) {
      const mock = mockGitHub(info, options);
      await assert.rejects(publishBundle({ env, ...mock, checkCanonical: () => {} }));
      assert(!mock.calls.some(call => call.method === 'PATCH'), JSON.stringify(options));
      assert(!mock.calls.some(call => call.method === 'DELETE'));
    }
    const mock = mockGitHub(info);
    await assert.rejects(publishBundle({
      env, ...mock, checkCanonical: () => { throw new Error('Canonical default moved'); },
    }), /Canonical default moved/);
    assert.equal(mock.calls.length, 0);
  });
});

test('CI validates before packaging and publishes only from protected canonical default pushes', async () => {
  const pipeline = await readFile(new URL('../.gitlab-ci.yml', import.meta.url), 'utf8');
  assert(pipeline.indexOf('npm test') < pipeline.indexOf('node scripts/release.mjs package'));
  assert(pipeline.indexOf('npm run build') < pipeline.indexOf('node scripts/release.mjs package'));
  assert(pipeline.includes('job: validate_web'));
  assert(pipeline.includes(`$CI_PROJECT_URL == "${canonical}"`));
  assert(pipeline.includes('$CI_PIPELINE_SOURCE == "push"'));
  assert(pipeline.includes('$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'));
  assert(pipeline.includes('$CI_COMMIT_REF_PROTECTED == "true"'));
  assert(pipeline.includes('resource_group: canonical-web-publisher'));
  assert(!pipeline.includes('outDir docs'));
});
