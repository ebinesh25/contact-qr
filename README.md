# Contact QR

A static, mobile-first contact QR generator. Create a unique WhatsApp or email QR for each contact, switch recipients instantly, and download a PNG. No account or backend is required; contacts and preferences stay in the current browser's local storage.

## Run locally

Open `index.html` for a quick preview. For PWA installation and offline caching, serve this folder over HTTPS or localhost. For example:

```sh
cd contact-qr
python3 -m http.server 8000
```

Then open `http://localhost:8000`. The QR generator library is included locally in `vendor/`, so QR generation works offline once the app shell has been cached.

The default primary contact is prefilled with the provided WhatsApp number and email address. The secondary contact is a sample entry; replace its details before sharing. Data is saved per browser/device and does not sync between devices.

## Cloudflare Workers Builds

This repository uses an assets-only Wrangler configuration. Set the production branch to `main`, leave the build command empty, use `npx wrangler deploy` as the deploy command, and set the root directory to the folder containing `wrangler.jsonc` and `index.html`.
