import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

/** Public Firebase CLI OAuth client — same as firebase-tools uses for `firebase login`. */
const FIREBASE_CLI_CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLI_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

function configstorePath() {
  const candidates = [
    join(process.env.APPDATA || "", "configstore", "firebase-tools.json"),
    join(homedir(), ".config", "configstore", "firebase-tools.json"),
  ];
  return candidates.find((path) => existsSync(path)) || null;
}

export function readFirebaseCliRefreshToken() {
  const path = configstorePath();
  if (!path) return null;
  try {
    const config = JSON.parse(readFileSync(path, "utf8"));
    return config.tokens?.refresh_token || null;
  } catch {
    return null;
  }
}

export function firebaseCliAuthorizedUserCredentials() {
  const refreshToken = readFirebaseCliRefreshToken();
  if (!refreshToken) return null;
  return {
    type: "authorized_user",
    client_id: FIREBASE_CLI_CLIENT_ID,
    client_secret: FIREBASE_CLI_CLIENT_SECRET,
    refresh_token: refreshToken,
  };
}
