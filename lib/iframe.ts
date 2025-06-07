import { createAppIframeSDK } from "@whop-apps/sdk";

export const iframeSdk = createAppIframeSDK({
  onMessage: {},
  // This is the app id of your whop app. You can find it in the dashboard.
  // defaults to process.env.NEXT_PUBLIC_WHOP_APP_ID if not provided.
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
});
