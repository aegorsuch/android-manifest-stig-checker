# Android Manifest STIG Checker

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
3. Click "Check STIG" to see issues.
4. Optionally, load sample manifests for quick testing.

The checker does not treat an empty or malformed manifest as compliant. Permission findings such as camera, location, and internet access are reported for human review because their acceptability depends on the application's mission and authorization.

## Rule Provenance and Limitations

Findings include the XML element and attribute values that triggered each configured check. Rule IDs, categories, and descriptions in this repository have not been verified against a pinned DISA STIG release or revision, and their current deep links are unavailable. Verify each mapping against the applicable DISA publication before using results for an authorization or compliance decision. The checker is a static-manifest aid, not an authoritative compliance determination.

## Features
- Manifest input
- Configured Android manifest checks (permissions, debuggable, backup, cleartext traffic, exported components, and more)
- Issue reporting
- Dark mode UI
- Sample manifest loader
- XML validation with explicit empty and malformed-input states
- Separate objective failures from permissions requiring human review
- Evidence and status included in CSV exports

## Deployment

To deploy as a GitHub Pages site:
1. Commit source changes, then build the static site with `npm run build`.
2. Commit the generated files in the `docs` folder and push to GitHub `develop`.
3. In your GitHub repo settings, set GitHub Pages source to the `develop` branch, `/docs` folder.
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
Check app at http://localhost:3000
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
