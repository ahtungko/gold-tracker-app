# Push notification & PWA guide

This guide explains how to configure web push notifications for Gold Tracker, generate the required VAPID keys, and validate the end-to-end experience on desktop browsers and iOS 18+ devices.

## 1. Generate VAPID keys
Web push relies on VAPID (Voluntary Application Server Identification) keys to authorise notifications. Use the `web-push` CLI to generate them once per environment:

```bash
pnpm dlx web-push generate-vapid-keys
```

The command prints a **public** and **private** key. Store them somewhere secure – the private key must never be committed to source control.

## 2. Configure environment variables
Update your `.env` file with the generated values and a contact email that the push service can surface to end users.

```dotenv
# Client – exposed in the browser when building the subscription payload
VITE_WEB_PUSH_PUBLIC_KEY="<base64-url-encoded-public-key>"

# Server – used when signing outbound notifications
WEB_PUSH_PUBLIC_KEY="<same-public-key-as-above>"
WEB_PUSH_PRIVATE_KEY="<private-key-from-cli>"
WEB_PUSH_CONTACT="mailto:alerts@example.com"
```

Restart the development server after changing environment variables so the client receives the updated public key.

## 3. Confirm service worker assets
The service worker and manifest reference the following static files under `client/public/`:

- `pwa-icon-192.png`
- `pwa-icon-512.png`
- `pwa-icon-maskable-512.png`
- `apple-touch-icon.png`
- `notification-icon-192.png`
- `notification-badge-256.png`

`pnpm build` copies these into `dist/public/` automatically. If you rename or relocate any assets, update `vite.config.ts` and the constants in `client/src/lib/pwa/pushPayload.ts` accordingly.

## 4. Installing on iOS 18+
Safari on iOS 18 supports push-capable PWAs with a few requirements:

1. Open the production or development URL in Safari.
2. Tap the **Share** icon and choose **Add to Home Screen**.
3. Confirm the name/icon – they come from the manifest and `apple-touch-icon.png`.
4. Launch Gold Tracker from the Home Screen shortcut (do not open it from Safari’s tab switcher).
5. On first launch the app can call `Notification.requestPermission()`; accept the prompt. If you dismiss it, open **Settings → Notifications → Gold Tracker** and enable **Allow Notifications**.
6. Leave Gold Tracker open for a few seconds to allow the service worker to activate, then return to the Home Screen. Background pushes will now display like native notifications.

## 5. Verifying deliveries
During development you can use the browser and the CLI to validate the full round trip:

1. Run `pnpm dev` and open `http://localhost:3000` in a desktop browser.
2. In DevTools, open **Application → Service Workers** and check **Update on reload**.
3. Subscribe the client by running the following in the console (replace the placeholder with your `VITE_WEB_PUSH_PUBLIC_KEY` value):
   ```js
   const vapidKey = "<VITE_WEB_PUSH_PUBLIC_KEY>";
   const registration = await navigator.serviceWorker.ready;
   const subscription = await registration.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: vapidKey,
   });
   console.log(subscription);
   ```
4. Trigger a test push from another terminal using your preferred tooling, for example:
   ```bash
   pnpm dlx web-push send-notification \
     --subscription '<stringified-subscription>' \
     --payload '{"title":"Spot price alert","body":"Gold moved 1.0%"}' \
     --vapid-subject "$WEB_PUSH_CONTACT" \
     --vapid-pubkey "$WEB_PUSH_PUBLIC_KEY" \
     --vapid-pvtkey "$WEB_PUSH_PRIVATE_KEY"
   ```
5. A notification should appear with the Gold Tracker icon and badge. Clicking it focuses or opens the app at the URL included in the payload.
6. Repeat the same process after installing the PWA on iOS 18. Use the share sheet’s **Send to Device** button in Xcode’s Safari Web Inspector or any server-based push integration to deliver real payloads.

## 6. Manual QA checklist
Follow this quick sweep before releasing:

- **Happy path:** Receive three consecutive minute-by-minute notifications and verify that each updates the existing notification (same tag) instead of creating duplicates.
- **Foreground handling:** When the app is open, confirm the broadcast channel (`gold-tracker-notifications`) receives `NOTIFICATION_RECEIVED` events with the payload metadata.
- **Click behaviour:** Tapping a notification focuses an existing tab or opens a new window at the target URL.
- **Subscription revoked:** After calling `navigator.serviceWorker.ready.then(r => r.pushManager.getSubscription()).then(sub => sub?.unsubscribe())`, the next push attempt should fail with `410 Gone` (and the UI should prompt the user to resubscribe).
- **Permission denied:** If notifications are denied, the service surfaces a toast or inline message instructing the user to enable them in system settings, and no additional permission prompts appear.
- **Badge reset:** Dismissing notifications clears the badge count the next time the user opens the app.

Document the results of each check in your release notes so the team can trace regressions quickly.
