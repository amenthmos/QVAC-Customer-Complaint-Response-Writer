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

## Example

**Input:** `Your app charged me twice for the same subscription this month and I want a refund for the duplicate charge.`

**Output:**
```
I apologize for the unauthorized charge on your account — I've gone ahead and processed a refund for the duplicate charge. If you need further assistance or have any other concerns, please don't hesitate to contact us. Our team is here to help.
```

Note "refund" is grounded here because the customer themselves asked for one. When a complaint doesn't mention wanting a specific resolution, the app detects if the model invented one anyway and swaps in a safe, non-committal fallback response instead.

## License

MIT
