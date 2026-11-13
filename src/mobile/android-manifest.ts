const ACTIVITY_OPEN = "<activity";
const ACTIVITY_CLOSE = "</activity>";
const LINK_FILTER_MARKER = 'android:host="frcp.net"';
const CAPACITOR_SPLASH = '<item name="android:background">@drawable/splash</item>';
const BLACK_LAUNCH = '<item name="android:background">@android:color/black</item>';

const LINK_FILTER = [
  '            <intent-filter android:autoVerify="true">',
  '                <action android:name="android.intent.action.VIEW" />',
  '                <category android:name="android.intent.category.DEFAULT" />',
  '                <category android:name="android.intent.category.BROWSABLE" />',
  '                <data android:scheme="https" />',
  '                <data android:host="frcp.net" />',
  '                <data android:path="/" />',
  "            </intent-filter>",
  "",
].join("\n");

const ACTIVITY_ATTRIBUTES = [
  'android:screenOrientation="portrait"',
  'android:windowSoftInputMode="adjustResize"',
];

function withLinkFilter(xml: string): string {
  if (xml.includes(LINK_FILTER_MARKER)) return xml;
  const lineStart = xml.lastIndexOf("\n", xml.indexOf(ACTIVITY_CLOSE)) + 1;
  return xml.slice(0, lineStart) + LINK_FILTER + xml.slice(lineStart);
}

function withActivityAttribute(xml: string, attribute: string): string {
  const name = attribute.slice(0, attribute.indexOf("=") + 1);
  if (xml.includes(name)) return xml;
  const at = xml.indexOf(ACTIVITY_OPEN) + ACTIVITY_OPEN.length;
  return `${xml.slice(0, at)}\n            ${attribute}${xml.slice(at)}`;
}

export function patchManifest(xml: string): string {
  if (!xml.includes(ACTIVITY_OPEN) || !xml.includes(ACTIVITY_CLOSE)) {
    throw new Error("AndroidManifest.xml has no <activity> element to patch");
  }
  const patched = ACTIVITY_ATTRIBUTES.reduce(withActivityAttribute, withLinkFilter(xml));
  return patched.replace('android:supportsRtl="true"', 'android:supportsRtl="false"');
}

export function patchStyles(xml: string): string {
  return xml.replace(CAPACITOR_SPLASH, BLACK_LAUNCH);
}
