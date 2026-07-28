"use client";

import { useEffect } from "react";
import { FUSE_LOCAL_SESSION } from "@/lib/fuse-auth";

const LEGACY_SESSION_KEY = "FUSE_LOCAL_SESSION";

export default function SessionStorageBridge() {
  useEffect(() => {
    const originalSetItem = Storage.prototype.setItem;

    Storage.prototype.setItem = function patchedSetItem(key: string, value: string) {
      originalSetItem.call(this, key, value);

      if (this === window.localStorage && key === LEGACY_SESSION_KEY) {
        originalSetItem.call(this, FUSE_LOCAL_SESSION, value);
      }

      if (this === window.localStorage && key === FUSE_LOCAL_SESSION) {
        originalSetItem.call(this, LEGACY_SESSION_KEY, value);
      }
    };

    const legacy = window.localStorage.getItem(LEGACY_SESSION_KEY);
    const current = window.localStorage.getItem(FUSE_LOCAL_SESSION);

    if (legacy && !current) {
      originalSetItem.call(window.localStorage, FUSE_LOCAL_SESSION, legacy);
    } else if (current && !legacy) {
      originalSetItem.call(window.localStorage, LEGACY_SESSION_KEY, current);
    }

    return () => {
      Storage.prototype.setItem = originalSetItem;
    };
  }, []);

  return null;
}
