/**
 * @tablecraft/core — All Tier 1 renderers barrel export
 *
 * CORE-07: Importing this file registers all 17 renderers in the global registry.
 * This is the side-effect-based auto-registration for the main @tablecraft/core entry point.
 *
 * For tree-shaking: import individual renderers directly:
 *   import '@tablecraft/core/renderers/currency'  // registers only currency
 *   import '@tablecraft/core/renderers/image'      // registers only image
 */

// Re-export all renderer functions AND trigger self-registration via module initialization
export { textRenderer } from './text.js';
export { numberRenderer } from './number.js';
export { integerRenderer } from './integer.js';
export { currencyRenderer } from './currency.js';
export { percentageRenderer } from './percentage.js';
export { booleanRenderer } from './boolean.js';
export { dateRenderer } from './date.js';
export { datetimeRenderer } from './datetime.js';
export { timeRenderer } from './time.js';
export { emailRenderer } from './email.js';
export { urlRenderer } from './url.js';
export { phoneRenderer } from './phone.js';
export { imageRenderer } from './image.js';
export { badgeRenderer } from './badge.js';
export { statusRenderer } from './status.js';
export { codeRenderer } from './code.js';
export { htmlRenderer, configure as configureHtmlRenderer } from './html.js';
