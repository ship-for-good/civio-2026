# Certificate Integration Guide — Agent Implementation

**For:** Teams building certificate-authenticated agents to automate transparency requests

**Data Source:** `scripts/explore-urls-output.json` in this repo

## Overview

This guide explains how to build an agent that:
1. Receives an entity ID (`idAmb`) and user intent
2. Navigates to the Portal de la Transparencia AGE
3. Authenticates with the user's X.509 certificate (FNMT, DNI-e, or Cl@ve)
4. Submits a transparency request form
5. Returns the submission proof to your system

## Architecture

The certificate authentication happens **entirely on the user's machine**, in their browser. Your agent should:

- Launch a real browser (not headless initially)
- Let the user select their certificate from the OS keychain
- Handle redirects during Cl@ve/FNMT authentication
- Fill and submit the form
- Extract proof of submission

**Critical:** Never attempt to handle private keys or certificate parsing server-side. The user's certificate stays on their machine.

## Step-by-Step Implementation

### Step 1: Get Entity Data

Load the entity mapping:

```json
{
  "idAmb": 101526,
  "name": "Ministerio de Transportes y Movilidad Sostenible",
  "baseUrl": "https://transparencia.sede.gob.es",
  "procedureId": 133628,
  "formEndpoint": "/procedimiento/formulario?idProc=133628&idAmb=101526",
  "signingEndpoint": "/procedimiento/firma?idProc=133628&idAmb=101526",
  "certAuthUrl": "https://transparencia.sede.gob.es/procedimiento/formulario?idProc=133628&idAmb=101526"
}
```

### Step 2: Navigate to Form Endpoint

```javascript
// Agent code (Node.js + Playwright or similar)
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: false }); // Show the window!
const page = await browser.newPage();
await page.goto(entity.certAuthUrl, { waitUntil: 'domcontentloaded' });
```

**Expected outcome:** Browser shows the Portal de la Transparencia portada or form page.

### Step 3: Handle Certificate Authentication

The portal will redirect to one of:

**Option A: Cl@ve (simplified)**
- URL: `https://pasarela-ident.clave.gob.es/clave/...`
- User may login with username/password or select a certificate
- Browser will show login page; wait for redirect back

**Option B: FNMT Certificate (direct)**
- Browser shows OS certificate picker
- User selects their FNMT certificate from Keychain/Credential Manager/GNOME Keyring
- User enters certificate password (if needed)
- Browser automatically includes certificate in subsequent requests
- Portal establishes session

**Option C: DNI-e**
- Similar to FNMT; user selects DNI card from reader
- Browser handles authentication

**Agent code:**
```javascript
// Wait for redirect back to Portal after cert selection
await page.waitForNavigation({ timeout: 60000 });
const url = page.url();
if (url.includes('/procedimiento/formulario')) {
  console.log('✓ Authenticated. Form visible.');
} else if (url.includes('clave') || url.includes('error')) {
  console.error('Auth failed or user cancelled');
  process.exit(1);
}
```

### Step 4: Fill Form Fields

Once authenticated, the form is visible. Common fields:

```javascript
// Example: fill requestor info
await page.fill('input[name="requestor-name"]', 'Juan Pérez');
await page.fill('input[name="requestor-email"]', 'juan@example.com');
await page.fill('input[name="requestor-phone"]', '+34912345678');

// Fill request subject
await page.fill('textarea[name="subject"]', 'Solicitud de contratos de limpieza 2024');

// Fill request description
await page.fill('textarea[name="description"]', 'Solicito acceso a todos los contratos de limpieza adjudicados por el Ministerio en 2024.');

// If CPV code input exists (for contract searches)
await page.fill('input[name="cpv-code"]', '90910000'); // Cleaning services
```

**Note:** Form field names vary per entity. Inspect the portal to find actual field names.

### Step 5: Submit Form (Create Draft)

```javascript
// Click "Siguiente" or "Enviar" button
await page.click('button:has-text("Siguiente")');

// Wait for confirmation page
await page.waitForNavigation({ timeout: 30000 });

// Extract draft ID (idBorr) from URL or page content
const idBorr = new URL(page.url()).searchParams.get('idBorr');
if (!idBorr) {
  // Try to find it in the page
  const content = await page.content();
  const match = content.match(/idBorr=([A-Z0-9]+)/);
  idBorr = match ? match[1] : null;
}
console.log('Draft created:', idBorr);
```

### Step 6: Sign the Submission

Navigate to the signing endpoint:

```javascript
const signingUrl = `${entity.baseUrl}${entity.signingEndpoint}?idBorr=${idBorr}`;
await page.goto(signingUrl, { waitUntil: 'domcontentloaded' });

// Portal will show signing options:
// - "Firma básica" (basic signature, server-side)
// - "Firma avanzada" (advanced, with Autofirma)

// For basic signature (simpler):
await page.click('input[value="basic-signature"]'); // Select radio button
await page.click('button:has-text("Firmar")');

// Wait for certificate re-authentication (may be required)
await page.waitForNavigation({ timeout: 60000 });

// Portal redirects to signing gateway
const signingGatewayUrl = page.url();
if (signingGatewayUrl.includes('pasarela-ident.clave.gob.es')) {
  // User re-authenticates (may re-enter cert password)
  // Wait for redirect back to portal
  await page.waitForNavigation({ timeout: 60000 });
}

const signValidation = new URL(page.url()).searchParams.get('signValidation');
console.log('Signature completed:', signValidation);
```

### Step 7: Extract Proof of Submission

After signing, the portal shows a confirmation page with:
- **expedienteRef:** Official case reference (e.g., `ES_E04996103_2026_EXP_AC2000000676676`)
- **justificante:** PDF proof of submission

```javascript
// Extract expedienteRef from page
const content = await page.content();
const expedienteMatch = content.match(/expedienteRef['":\s]+([ES_E0-9_AC]+)/);
const expedienteRef = expedienteMatch ? expedienteMatch[1] : null;

// Download justificante PDF
const downloadUrl = await page.$eval('a[href*="justificante.pdf"]', el => el.href);
const pdf = await page.context().newCDPSession(page).send('Page.captureScreenshot');

// OR use fetch to download
const pdfBuffer = await fetch(downloadUrl).then(r => r.buffer());
fs.writeFileSync('./justificante.pdf', pdfBuffer);

console.log('Submission complete:');
console.log('- Expediente:', expedienteRef);
console.log('- Proof:', './justificante.pdf');
```

### Step 8: Send to Your System

```javascript
// Post back to your webhook/API
const response = await fetch('https://your-app.com/api/webhook/transparency-submission', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    source: 'transparencia_age',
    entity: { idAmb: entity.idAmb, name: entity.name },
    expedienteRef: expedienteRef,
    documents: [
      {
        filename: 'justificante.pdf',
        contentType: 'application/pdf',
        content: pdfBuffer.toString('base64'),
        contentHash: crypto.createHash('sha256').update(pdfBuffer).digest('hex'),
        role: 'proof_of_submission'
      }
    ],
    metadata: {
      submittedAt: new Date().toISOString(),
      agentVersion: '1.0.0'
    }
  })
});

console.log('Webhook response:', response.status);
```

## Error Handling

### Authentication Failures

```javascript
// If cert selection is cancelled
if (page.url().includes('error') || page.url() === entity.certAuthUrl) {
  console.error('User cancelled authentication or cert not available');
  // Fall back to: show user a manual link
}
```

### Form Field Changes

If the portal updates and field names change:

```javascript
// Inspect page before filling
const fieldNames = await page.$$eval('input, textarea', els => 
  els.map(el => ({ name: el.name, type: el.type, placeholder: el.placeholder }))
);
console.log('Available fields:', fieldNames);
// Adapt your fill logic based on actual fields
```

### Timeouts

```javascript
// If portal is slow or certificate auth hangs
const timeout = 120000; // 2 minutes per step
try {
  await page.waitForNavigation({ timeout });
} catch (err) {
  console.error('Navigation timeout. Portal may be down or user inaction.');
  // Offer user to continue manually or cancel
}
```

## Testing Endpoints

Before deploying, test with a sandbox certificate:

1. **FNMT Test Certificates:** Available from CERES (http://www.cert.fnmt.es/)
2. **Cl@ve Sandbox:** Integration Cl@ve environment exists; contact INTECO
3. **Portal Sandbox:** Check if AGE offers a test transparency portal (unlikely; use real portal with test requests)

## Certificate Management

- **Private Key:** Never transmitted; stays in OS keychain
- **Certificate Chain:** Portal validates server-side
- **Session Token:** After cert auth, Portal sets secure HTTP-only cookies
- **Cert Revocation:** Portal checks CRL/OCSP; your agent doesn't need to

## Rate Limits & Compliance

- **One submission per request:** Don't batch multiple requests in one session
- **Session timeout:** Portal sessions expire after ~30 minutes of inactivity
- **User action required:** Every signature requires active user authentication (no automation of private key operations)

## References

- **Portal:** https://transparencia.sede.gob.es
- **Legal:** Ley 19/2013 de Transparencia, Acceso a la Información Pública y Buen Gobierno
- **FNMT:** http://www.cert.fnmt.es/
- **Cl@ve:** https://www.clave.gob.es/
- **PideInfo Source:** https://github.com/Naroh091/PideInfo (reference agent implementation)
