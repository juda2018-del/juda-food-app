import "./firebase";
import { getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const app = getApps()[0];

export const fuseAuth = app ? getAuth(app) : getAuth();
