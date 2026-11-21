// One-off dev script: ask Jev (TypeSafe) for a Box around Dylan in each image
// and write src/app/focal-points.json. Does nothing without TYPESAFE_API_KEY.
// Usage: TYPESAFE_API_KEY=... node scripts/jev-focal-points.mjs [indexes...]
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const KEY = process.env.TYPESAFE_API_KEY;
const MODEL = process.env.JEV_MODEL || "jev-latest";
const OUT = "src/app/focal-points.json";
const MIN_PRESENT = 0.7; // code decides: only store a box when Jev is confident Dylan is shown

const QUESTIONS = {
  present: { type: "noul", instructions: "Is a dog (Dylan, a chocolate labrador) clearly visible in IMAGE?" },
  dylan: { type: "box", instructions: "Draw a box around the dog (Dylan) in IMAGE, focusing on his face if visible." },
};

if (!KEY) { console.log("TYPESAFE_API_KEY not set; nothing to do."); process.exit(0); }

const args = process.argv.slice(2);
const indexes = args.length ? args : readdirSync("public/images").filter((f) => f.endsWith(".jpg")).map((f) => f.replace(".jpg", ""));
const out = JSON.parse(readFileSync(OUT, "utf8"));

for (const i of indexes) {
  try {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "TypeSafe-Danger-Zone-Images": "true" },
      body: JSON.stringify({
        model: MODEL,
        state: "IMAGE",
        questions: QUESTIONS,
        assets: { IMAGE: { type: "image", format: "jpg", data_base64: readFileSync(`public/images/${i}.jpg`).toString("base64") } },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const a = await res.json();
    const p = a?.present?.noul ?? a?.answers?.present?.noul;
    const b = a?.dylan?.box ?? a?.answers?.dylan?.box;
    if (typeof p !== "number" || p < MIN_PRESENT || !b) { console.log(i, "skip", p); continue; }
    const x = (b.left + b.right) / 2, y = (b.top + b.bottom) / 2;
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) { out[i] = { x: +x.toFixed(3), y: +y.toFixed(3) }; console.log(i, out[i]); }
    else console.log(i, "skip: box not normalised", b);
  } catch (e) { console.log(i, "error, keeping existing", e.message); }
}
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
