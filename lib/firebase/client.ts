// Single Firebase client entry point for the web/iOS customer app.
// Re-export the exact same Firebase app/auth instances used by the rest of
// the application so pages cannot accidentally create a second Auth context.
export { app as firebaseApp, auth as firebaseAuth } from "../../app/firebase";
