# Unity Report Explorer

An interactive plain-language guide for Unity prenatal test results, designed for patients and providers. This tool allows users to explore carrier screen and aneuploidy (NIPT) results in plain language, with condition-specific explanations, risk context, and follow-up guidance.

---

## What this is

A single-page React app built for internal piloting. It simulates how a patient or provider would navigate Unity test results — including carrier screen, aneuploidy NIPT, 22q microdeletion, fetal RhD, and fetal antigen panels.

This is a **prototype**, not connected to live patient data. All results shown are pre-configured test scenarios for evaluation purposes.

---

## Pilot scenarios available

**Carrier Screen**
- Low risk (HBB panel)
- High risk fetal result (sickle cell)
- DMD carrier

**Aneuploidy NIPT**
- Low risk singleton
- Low risk twins with 22q and RhD
- High risk T21 singleton
- Low risk with fetal antigen

Switch between scenarios using the toolbar at the top of the screen. Toggle between desktop and mobile views using the 🖥 / 📱 buttons.

---

## Feedback

This tool is in active development. If you're piloting this, please share feedback on:
- Clarity of the plain-language explanations
- Accuracy of clinical content
- Navigation and UX across desktop and mobile views
- Any results or scenarios that feel missing or incomplete

Send feedback to: cwagner@billiontoone.com

---

## Running locally

If you'd prefer to run this on your own machine:

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## Stack

- React 18
- Vite
- No external UI libraries — all styling is inline using BillionToOne brand tokens

---

*For internal use only. Do not share externally or use with real patient data.*
