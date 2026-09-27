# QVAC Customer Complaint Response Writer

Paste a customer's complaint, get a professional, empathetic draft response that addresses the specific complaint — generated on-device. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:32024

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown.

The response never promises a refund, replacement, discount, or other specific resolution unless the customer's own complaint mentioned wanting one — this is checked deterministically in code, not left to the prompt alone.

## License

MIT
