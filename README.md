# Android Manifest Checks

Scan your AndroidManifest.xml for configured Android STIG checks.

## Project Information

### Rights
Unlimited Rights granted to TAK Product Center.

### Point of Contact
Alex Gorsuch on chat.tak.gov or Signal.

### Repositories
The TAK Forge repository is canonical; GitHub is a secondary repository.

## Usage
1. Start the app with `npm start` to launch the local server (Vite's default is port 5173).
2. Paste your AndroidManifest.xml in the input box.
3. Click "Run Manifest Checks" to review the results.
4. Optionally, load sample manifests for quick testing.

The checker does not treat an empty or malformed manifest as compliant. Permission findings such as camera, location, and internet access are reported for human review because their acceptability depends on the application's mission and authorization.

## Rule Provenance and Limitations

Findings include the XML element and attribute values that triggered each configured check. The former V-IDs and CAT levels were not verified as Android STIG mappings and have been removed. Checks currently use local identifiers and are not mapped to a pinned DISA STIG release or revision. Verify each check against the applicable DISA publication before using results for an authorization or compliance decision. The checker is a static-manifest aid, not an authoritative compliance determination.

## Features
- Manifest input
- Unmapped Android manifest checks (permissions, debuggable, backup, cleartext traffic, exported components, and more)
- Issue reporting
- Dark mode UI
- Sample manifest loader
- XML validation with explicit empty and malformed-input states
- Separate objective failures from permissions requiring human review
- Evidence and status included in CSV exports

## Deployment

To deploy as a GitHub Pages site:
1. Commit source changes, then build the static site with `npm run build`.
2. Commit the generated files in the `docs` folder and push to GitHub `main`.
3. In your GitHub repo settings, set GitHub Pages source to the `main` branch, `/docs` folder.
4. Ensure a `.nojekyll` file exists in the `docs` folder.

The page displays the short source commit hash used for the build as its release version.
Your app will be available at: https://aegorsuch.github.io/android-manifest-stig-checker/
## Recommended VS Code Extensions

- Vite (antfu.vite)
- VSCode React Refactor (planbcoding.vscode-react-refactor)
- Auto Import - ES6, TS, JSX, TSX (nucllear.vscode-extension-auto-import)
- LintLens — ESLint rules made easier (ghmcadams.lintlens)
- VSCode FE Helper (yutengjing.vscode-fe-helper)
- Set Auto Formatting (codamasoftware.set-auto-formatting)

## Verification

After any code change, run:
- `npm test` (rule and parsing tests)
- `npm run build` (compile)
- `npm start` (launch)
Check app at http://localhost:5173
Lint and format code with recommended extensions.

## Automated downloadable web bundles

The canonical TAK Forge repository uses `.gitlab-ci.yml` for validation and an
GitHub Releases publisher. There is no competing GitHub Actions publisher.
This is separate from the existing Pages deployment: it does not change `docs`,
the runtime base path, Pages settings, or the site URL.

`validate_web` restores the committed npm lockfile, runs the manifest and offline
publisher tests, builds Vite into `dist`, and packages its contents into a ZIP.
GitLab retains the ZIP, a separate SHA256 file, and `provenance.json` as pipeline
artifacts for 30 days. The ZIP contains a static **web bundle**, not an Android
APK and not a STIG compliance certification. Serve it under the existing
`/android-manifest-stig-checker/` base path; opening `index.html` as a local file
is not the supported deployment method.

A successful push pipeline on the protected canonical default
branch (`main` at discovery) may publish a GitHub prerelease. Names include the
actual `package.json` version and full source SHA, for example
`android-manifest-stig-checker-web-v1.0.0-<40-character-SHA>.zip`. Notes link to the
full canonical commit, validation pipeline, tests/build job, publisher job, ZIP,
separate checksum, and provenance. These continuous web bundles do not claim to
be a new semantic-version milestone or replace manually maintained releases.

The publisher requires the following existing infrastructure. Missing credentials
or stale mirrors cause explicit failures, not unvalidated fallback releases:

- TAK Forge GitLab CI is enabled with a Linux runner able to use the Node
  container and install Python 3 for standard-library ZIP packaging;
  runner/CI availability is not verified by local tests.
- The canonical default branch is protected. The job requires a push pipeline,
  protected default ref, and the exact canonical project URL.
- GitHub has synchronized the same full default-branch SHA before publication.
  This publisher does not push source or tags to synchronize hosts.
- A protected, masked `GITHUB_RELEASE_TOKEN` variable exists in canonical GitLab
  CI, scoped only to this GitHub repository with **Contents: write** permission
  (and any required organization approval). It is not an npm publishing token.

No token, variable, branch protection, runner, or account permission is created
by this implementation.

The publisher rechecks both default-branch tips before creating a draft and
before making it public. It checks ZIP checksums and GitHub asset digests and
refuses mismatched pipeline/source artifacts. Existing tags or releases are
never updated or deleted, including failed-run drafts. New drafts must still
have the expected notes and exactly the expected assets before publication;
manual edits cause an explicit failure. Failed runs leave their draft for
maintainer inspection rather than erasing content or silently retrying.
Cross-host tip checks are not an atomic lock against commits landing immediately
after the last check; releases identify immutable full SHAs, not an asserted
forever-current "latest" build.

Offline publisher checks (no credentials or network):
Run after dependency restoration; Node, Git and Python 3 (`python` on Windows,
`python3` on Linux) are required for the real ZIP packaging test.

```text
node --test scripts/release.test.mjs
```

To reproduce the canonical packaging stage on Linux, run `npm ci`, `npm test`,
the offline checks above, and `npm run build -- --outDir dist`, then run
`node scripts/release.mjs package` with genuine canonical GitLab job metadata.
Packaging requires Python 3 and refuses to reuse an existing `release` directory.
Do not run `publish` locally: it is reserved for the guarded canonical CI job.

## To Do
- Add more STIG checks
- Improve UI

## Sample AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
	package="com.example.stigtest">

	<application
		android:debuggable="true"
		android:allowBackup="true"
		android:usesCleartextTraffic="true"
		android:exported="true">
		<!-- MTD Hook missing -->
	</application>
	<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
	<uses-permission android:name="android.permission.READ_PHONE_STATE" />
	<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
	<uses-permission android:name="android.permission.CAMERA" />
	<uses-permission android:name="android.permission.RECORD_AUDIO" />
	<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
</manifest>
```
