export function clearFuseBrowserSession() {
  if (typeof window === "undefined") return;

  const directKeys = [
    "FUSE_LOCAL_SESSION",
    "fuse_session",
    "fuseRole",
    "fuseEmail",
    "fuseUser",
    "fuseSession",
    "fuseRestaurant",
    "fuseRestaurantId",
    "fuseRestaurantName",
  ];

  try {
    for (const key of directKeys) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }

    for (const storage of [window.localStorage, window.sessionStorage]) {
      Object.keys(storage).forEach((key) => {
        const lower = key.toLowerCase();
        if (
          lower.includes("firebase") ||
          lower.includes("fuse") ||
          lower.includes("restaurant") ||
          lower.includes("admin") ||
          lower.includes("driver") ||
          lower.includes("customer")
        ) {
          storage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.error("FUSE session storage clear failed", error);
  }

  const cookieNames = [
    "fuse_role",
    "fuse_email",
    "fuse_name",
    "fuse_restaurant",
    "fuse_phone",
  ];

  for (const name of cookieNames) {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}
