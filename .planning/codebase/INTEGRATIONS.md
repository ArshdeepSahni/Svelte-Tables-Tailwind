# External Integrations

**Analysis Date:** 2026-03-19

## APIs & External Services

**None detected** - This is a self-contained UI component library with no external API integrations.

## Data Storage

**Databases:**

- Not applicable - This is a frontend UI component with no database backend

**File Storage:**

- Not applicable - Component operates entirely in browser memory

**Caching:**

- Not applicable - No server-side caching required

## Authentication & Identity

**Auth Provider:**

- None - This is a presentational component with no authentication requirements

## Monitoring & Observability

**Error Tracking:**

- None detected - No error tracking service integrated

**Logs:**

- Console logging only - Basic `console.log()` in `src/Tables.svelte` line 14 for debug output

## CI/CD & Deployment

**Hosting:**

- npm registry - Published as npm package
- GitHub repository: https://github.com/ArshdeepSahni/Svelte-Tables-Tailwind

**CI Pipeline:**

- None detected - No automated CI/CD configuration files present

## Environment Configuration

**Required env vars:**

- None - Component is stateless and configuration-free

**Secrets location:**

- Not applicable - No secrets required

## External CSS/Styling Resources

**Tailwind CSS:**

- Source: unpkg.com CDN (v2)
- URL: `https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css`
- Loaded in: `src/Tables.svelte` line 128
- Method: Injected via `<svelte:head>` at component initialization

## Webhooks & Callbacks

**Incoming:**

- None detected

**Outgoing:**

- None detected

## Component API Surface

**Props (from `src/Tables.svelte`):**

- `colname` - Object mapping column keys to display names and data types
- `rowdata` - Array of row data, each row is array of values
- `url` - Href attribute for table cell links
- `click` - Click event handler for table cells

**No external service calls or webhooks.**

## Dependencies with External Reach

All npm dependencies are dev-time only (build tools). Production bundle contains:

- Svelte runtime (self-contained)
- Generated component code
- Extracted CSS (contains Tailwind utility classes)

**No runtime dependencies on external services.**

---

_Integration audit: 2026-03-19_
