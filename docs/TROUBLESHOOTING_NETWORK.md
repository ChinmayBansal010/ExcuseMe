# Frontend connectivity troubleshooting

## 1. Confirm the backend is running

Open the health endpoint in a browser or use curl:

```bash
curl -i http://127.0.0.1:8000/health
```

Expected JSON: `{"status":"ok"}`.

## 2. Choose the correct API base URL

- Browser on the same computer: `http://127.0.0.1:8000`
- Android emulator: `http://10.0.2.2:8000`
- Physical phone: computer's LAN IP and port 8000
- Remote deployment: deployed HTTPS endpoint

The frontend reads `EXPO_PUBLIC_API_URL`. Restart Expo after changing it.

## 3. Physical-device checks

Confirm both devices share a network, the backend listens on an accessible interface, and the firewall permits port 8000. Do not expose the development server to untrusted networks.

## 4. Interpret failures

- Connection refused: server is stopped or host/port is incorrect.
- Timeout: model initialization, network path, or server load may be responsible.
- HTTP 422: request schema or input validation failed.
- HTTP 503: required model or retrieval service is unavailable.
- Browser-only CORS failure: review the configured CORS origins and browser console.

Do not solve connectivity errors by disabling all security controls on a public deployment.
