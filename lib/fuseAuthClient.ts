import { getAuth } from "firebase/auth";
import { app } from "../app/firebase";

export const fuseAuth = getAuth(app);
