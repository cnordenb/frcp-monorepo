import assert from "node:assert/strict";
import { test } from "node:test";
import { patchManifest } from "../../src/mobile/android-manifest.ts";

const GENERATED_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|uiMode|navigation|density"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
        </provider>
    </application>

    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
`;

const KOTLIN_APP_DECLARES = [
  '<intent-filter android:autoVerify="true">',
  '<action android:name="android.intent.action.VIEW" />',
  '<category android:name="android.intent.category.DEFAULT" />',
  '<category android:name="android.intent.category.BROWSABLE" />',
  '<data android:scheme="https" />',
  '<data android:host="frcp.net" />',
  '<data android:path="/" />',
  'android:screenOrientation="portrait"',
  'android:windowSoftInputMode="adjustResize"',
  'android:supportsRtl="false"',
];

test("Test 63: the generated manifest gains the frcp.net link filter and the portrait screen", () => {
  const patched = patchManifest(GENERATED_MANIFEST);
  assert.deepEqual(KOTLIN_APP_DECLARES.filter((part) => !patched.includes(part)), []);
});

test("Test 64: patching the manifest a second time changes nothing more", () => {
  const once = patchManifest(GENERATED_MANIFEST);
  assert.equal(patchManifest(once), once);
});
