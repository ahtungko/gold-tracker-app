# UI Redesign QA Report

## Scope
- Home and Tracker screens across mobile (≤640px), tablet (~768px), desktop (≥1024px), and large desktop (≥1440px) breakpoints
- Global navigation (header + bottom navigation), dialogs, charts, and form-heavy tracker experience
- Critical flows: currency/unit switching, language switching, purchase CRUD, CSV import/export, and toast feedback in both light/dark themes

## Findings & Resolutions
1. **Language selector inaccessible on mobile**  
   • Affected areas: Home & Tracker headers (mobile/tablet)  
   • Fix: Reworked header layout to keep the language selector outside the desktop-only nav, added responsive wrapping, and introduced sr-only labels for accessibility.  
   • Status: ✅ Resolved – selector is now reachable across viewports.

2. **Bottom navigation overlapped content & ignored safe areas**  
   • Affected areas: Mobile bottom nav  
   • Fix: Expanded touch targets, added safe-area padding, aria-current highlighting, and increased page bottom padding (Home & Tracker) so primary content no longer sits beneath the bar.  
   • Status: ✅ Resolved – content remains visible and touch targets meet 48px guidance.

3. **Navigation links triggered full page reloads and lacked active state**  
   • Affected areas: Home & Tracker desktop navigation  
   • Fix: Swapped anchor tags for Wouter `Link`, added active styling, focus rings, and shared `primaryNavigation` aria labelling.  
   • Status: ✅ Resolved – navigation stays within the SPA and clearly indicates current route.

4. **Purchase summary miscalculated current value**  
   • Root cause: Summary used ounce pricing directly without converting to grams, inflating totals by ~31×.  
   • Fix: Normalised API prices to per-gram when aggregating and documented the Troy ounce conversion constant.  
   • Status: ✅ Resolved – summary values align with card calculations.

5. **CSV import accepted blank rows and required hard reload**  
   • Issues: Trailing empty lines created NaN purchases; UI forced `window.location.reload()`.  
   • Fixes: Hardened CSV parser (trim/filter/validate rows), persisted currency from imported data, exposed `refreshPurchases()` in hook, and refreshed state post-import without reloading.  
   • Status: ✅ Resolved – imports hydrate immediately and ignore malformed data.

6. **Tracker feedback relied on inline banners/alerts**  
   • Affected flows: Add, update, delete, import failure states  
   • Fix: Replaced ad-hoc banners/alerts with Sonner toasts for success/error, ensuring consistent notifications in light and dark themes. Dialog close also clears editing state.  
   • Status: ✅ Resolved – toast feedback now mirrors redesign expectations.

## Functional Flow Verification
- ✅ Currency switching (Home) – updates pricing cards and persists to tracker storage.  
- ✅ Unit toggle (Home) – price display converts correctly between gram/oz.  
- ✅ Language toggle – available on all breakpoints; text updates immediately.  
- ✅ Purchase CRUD (Tracker) – toasts fire for add/edit/delete, summary updates with corrected math.  
- ✅ CSV import/export – import refreshes list without reload, export unchanged.  
- ✅ Toast themes – Sonner inherits theme context ensuring contrast in light/dark.  
- ✅ Responsive layout – inspected at 360×720, 768×1024, 1280×800, and 1440×900; no overflow or clipped controls after fixes.

## Automated Checks
- `pnpm test`
- `pnpm build`

(Queued via project tooling prior to merge.)
