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

GitHub Pages remains configured to serve `main`, `/docs`, using GitHub's existing
automatic `pages-build-deployment` workflow. Source changes must land in canonical
TAK Forge first, then be synchronized to GitHub.

1. Commit source changes on TAK Forge, then build with `npm run build`.
2. Commit the generated `docs` files through the normal canonical branch/MR flow.
3. After successful validation and merge on TAK Forge, synchronize the verified
   canonical `main` SHA to GitHub `main` without force-pushing.
4. GitHub automatically builds and deploys the committed `docs` folder.

Keep `public/.nojekyll` so Vite carries it into `docs`. No GitHub-only generated
source commits, new release tokens, or GitHub Releases are required.
`.gitlab-ci.yml` runs `npm ci`, `npm test`, and an isolated Vite build only.
Cross-host synchronization and refreshing the committed `docs` output are not
automated by that validation job. Fresh source-to-Pages artifact deployment would
require an explicitly approved change from branch-based Pages to Actions-based
Pages; this configuration does not change the repository's Pages settings.

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
