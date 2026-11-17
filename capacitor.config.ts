import type { CapacitorConfig } from "@capacitor/cli";

/** Android app: the same web app, packaged with Capacitor (built by .github/workflows/android.yml). */
const config: CapacitorConfig = {
  appId: "io.github.aninditamondal303.naadai",
  appName: "Naad AI",
  webDir: "dist",
  android: { backgroundColor: "#062327" },
};

export default config;
