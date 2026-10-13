#!/usr/bin/env node
/**
 * Read-only comparison of repo Firestore rules with the deployed release.
 * Never deploys, updates, or deletes rules.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { GoogleAuth } from "google-auth-library";
import { firebaseCliAuthorizedUserCredentials } from "./firebase-cli-credentials.mjs";

const PROJECT_ID = "juda-food-app";

function hash(text) {
  return createHash("sha256").update(text.replace(/\r\n/g, "\n").trim()).digest("hex");
}

async function main() {
  const local = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
  const localHash = hash(local);
  console.log(`LOCAL_RULES_SHA256 ${localHash}`);

  const credentials = firebaseCliAuthorizedUserCredentials();
  if (!credentials) {
    console.log("DEPLOYED_RULES SKIP no Firebase CLI login");
    console.log("VERIFY npx firebase login, then node scripts/compare-deployed-rules.mjs");
    console.log("VERIFY_ALT Firebase console → Firestore → Rules, or Rules API projects/juda-food-app/releases");
    console.log("DO_NOT_DEPLOY this script does not call firebase deploy");
    return;
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/firebase", "https://www.googleapis.com/auth/cloud-platform"],
  });
  const token = await auth.getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };
  const releasesRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases`,
    { headers }
  );
  if (!releasesRes.ok) {
    console.log(`DEPLOYED_RULES SKIP rules API ${releasesRes.status}`);
    return;
  }

  const releases = await releasesRes.json();
  const firestoreRelease = (releases.releases || []).find((release) =>
    String(release.name || "").includes("cloud.firestore")
  );
  if (!firestoreRelease?.rulesetName) {
    console.log("DEPLOYED_RULES SKIP no cloud.firestore release");
    return;
  }

  const rulesetRes = await fetch(`https://firebaserules.googleapis.com/v1/${firestoreRelease.rulesetName}`, { headers });
  if (!rulesetRes.ok) {
    console.log(`DEPLOYED_RULES SKIP ruleset ${rulesetRes.status}`);
    return;
  }
  const ruleset = await rulesetRes.json();
  const deployed = String(ruleset.source?.files?.[0]?.content || "");
  const deployedHash = hash(deployed);
  console.log(`DEPLOYED_RULES_SHA256 ${deployedHash}`);
  console.log(`RELEASE ${firestoreRelease.name || ""}`);
  console.log(`UPDATE_TIME ${firestoreRelease.updateTime || firestoreRelease.createTime || ""}`);
  console.log(localHash === deployedHash ? "RULES_MATCH" : "RULES_DIFFER");
  console.log("DO_NOT_DEPLOY comparison only");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "rules comparison failed");
  process.exit(1);
});
