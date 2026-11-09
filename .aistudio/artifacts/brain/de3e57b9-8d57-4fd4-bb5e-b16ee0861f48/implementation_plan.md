# SiHub — Phase 2: Final Navigation & Organizational Identity Implementation Plan

## Executive Summary
This document provides the authoritative, corrected implementation plan for finalizing the Somali Innovation Hub (SiHub) public navigation hierarchy and organizational identity integration.

All existing website visual styling, branding, color tokens, and database schemas remain strictly preserved. This plan resolves all five specific audit findings: query parameter synchronization, anchor targets, safe public certification routing, demonstration data disclaimers, and real footer routing without inventing dead links or fake authentication.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     OFFICIAL PUBLIC NAVIGATION                                         │
│  [Home]                                                                                                │
│  [About SiHub ▾]          -> Who We Are (#who-we-are) | Vision & Mission (#vision-mission) | Our Team   │
│  [Our Programmes ▾]       -> 8 Subprogrammes (?track=) synced with Courses/Programs filters            │
│  [Entrepreneurship ▾]     -> Incubation | Directory (#directory) | Mentorship | Pitch Modal            │
│  [SiHub Institute ▾]      -> Digital Skills | Training | AI Tech (?category=) | Certification (#cert)  │
│  [Events & Media ▾]       -> SiHub Talks | Summit (?type=conference) | Expo (?type=demoday) | News      │
│  [Our Impact ▾]           -> Success Stories (#our-impact) | Demo Data Disclaimer                      │
│  [Partnerships ▾]         -> Partner Roster (#donors) | Inbound Proposal Desk (#become-partner)        │
└───────────────────────────────────┬────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │                DEDICATED PORTAL ACCESS                 │
       │   (Separate, clearly delineated access section)        │
       │   - Learner Portal  (/learner_portal)                  │
       │   - Startup Portal  (/startup_portal)                  │
       │   - Partner Portal  (/partner_portal)                  │
       │   - Campus Visits   (/visitor_portal)                  │
       └────────────────────────────────────────────────────────┘
```

---

## 1. Query Parameter Synchronization Strategy

Destination pages will mount a lightweight `useEffect` to read `window.location.search` via `URLSearchParams` on load, synchronizing the active tab with the incoming URL query parameter without modifying existing storage data or schemas.

### 1.1 `ProgramsPage.tsx` (`?track=`)
Maps the 8 official subprogrammes to existing cohort categories:
- `?track=digital-skills` -> `'Digital Skills Development'`
- `?track=youth-empowerment` -> `'Youth Empowerment'`
- `?track=social-innovation` -> `'Social Innovation'`
- `?track=women-in-innovation` or `?track=women-innovation` -> `'Women in Innovation'`
- `?track=digital-inclusion` or `?track=inclusive-digital` -> `'Inclusive Digital Inclusion'`
- `?track=green-innovation` or `?track=green-sustainability` -> `'Green Innovation & Sustainability'`
- `?track=youth-peace` -> `'Youth Peace Innovation'`
- `?track=community-development` or `?track=community-dev` -> `'Community Development'`
- *Default / Unmapped:* `'All'`

### 1.2 `CoursesPage.tsx` (`?category=`)
Maps official SiHub Institute submenu destinations to existing catalog categories:
- `?category=technology-software` or `?category=Technology+%26+Software` -> `'Technology & Software'`
- `?category=digital-entrepreneurship` or `?category=Digital+Entrepreneurship` -> `'Digital Entrepreneurship'`
- `?category=data-ai` or `?category=Data+%26+AI` -> `'Data & AI'`
- `?category=renewable-energy` -> `'Renewable Energy & Climate'`
- `?category=agritech` -> `'AgriTech & Food Security'`
- `?category=health` -> `'Health & MedTech'`
- *Default / Unmapped:* `'All'`

### 1.3 `EventsPage.tsx` (`?type=`)
Maps official Events & Media submenu destinations to existing event types:
- `?type=conference` or `?type=summit` or `?type=talks` -> `'Conference'`
- `?type=hackathon` -> `'Hackathon'`
- `?type=demoday` or `?type=expo` -> `'Demo Day'`
- *Default / Unmapped:* `'All'`

---

## 2. Missing Anchor Targets Integration

Non-destructive additions of standard anchor `id` attributes with scroll margin offsets (`scroll-mt-28`):
1. **`src/components/public/StartupHubPage.tsx`**:
   - Add `id="directory"` to the startup directory grid container (line 100).
2. **`src/components/public/PartnershipsPage.tsx`**:
   - Add `id="donors"` to the strategic partners roster container (line 77).
   - Add `id="become-partner"` to the institutional proposal form container (line 115).

---

## 3. Public Certification Destination Design

### Audit Finding
`CoursesPage.tsx` does not currently contain a dedicated public certification section. Routing public visitors to `/learner_portal` exposes authenticated student workflows (lesson progress, quiz scores, and unissued personal credential records).

### Proposed Safe Minimal Solution
Add an informational public section to the bottom of `CoursesPage.tsx` with `id="certification"`:
- **Title**: *SiHub Academy Certification Standards & Verification*
- **Public Information**:
  - Explains the rigorous academic requirements for credential issuance (100% lesson completion, practical project submission, and verified quiz scores).
  - Outlines the verifiable certificate format (`SIHUB-CERT-YYYY-XXXX`).
  - Explains that active enrolled students access and export their issued certificates inside the private **Learner Portal**.
  - Clearly clarifies that certificates represent verified workforce and technical competency.
- **Routing**: Public navigation submenu item *Certification* routes to `courses` and scrolls smoothly to `#certification`.

---

## 4. Impact Statistics Verification & Transparency

- **Source Data**: The live ecosystem counter on `Home.tsx` draws directly from `INITIAL_IMPACT_METRICS` in `src/data/initialData.ts`:
  - `totalBeneficiaries: 184500` (rendered as `185k+`)
  - `startupsSupported: 86` (rendered as `86`)
  - `grantsDisbursedUSD: 460000` (rendered as `$460k`)
  - `womenParticipationRate: 44` (rendered as `44%`)
- **Correction**: The previously assumed plan narrative of "$245k grants, 28 startups" is retracted as erroneous text.
- **Disclaimer**: Add an explicit, professional footnote on the `Home.tsx` impact card:
  > *"Note: Figures reflect demonstration metrics initialized for ecosystem simulation and prototype evaluation."*

---

## 5. Footer Route Alignment & Legal Link Handling

- **Contact Us**: Route exists (`case 'contact': return <ContactPage />;` in `App.tsx`). Add explicit link `<button onClick={() => navigateTo('contact')}>Contact Us</button>`.
- **Privacy Policy & Terms of Service**: Neither route nor component exists in the application.
  - In accordance with strict audit instructions, **NO** fake or dead anchor links (`href="#"`) will be added.
  - The footer bottom bar will display the verified copyright, ISO alignment notice, and strategic tagline.

---

## 6. Portal Isolation & Security Policy

- **Isolation Enforced**: Neither `/admin` nor `/education` will appear anywhere in public header or footer navigation.
- **Security Boundary**: Hiding navigation items is recognized as a clean presentation layout discipline, **not** an access control boundary. Existing demonstration persona switching remains intact for developmental evaluation.

---

## 7. File Modification Scope & Execution Order

| Step | Target File | Nature of Edit |
| :--- | :--- | :--- |
| **1** | `src/components/public/StartupHubPage.tsx` | Add `id="directory"` to startups grid. |
| **2** | `src/components/public/PartnershipsPage.tsx` | Add `id="donors"` to partner roster and `id="become-partner"` to proposal form. |
| **3** | `src/components/public/ProgramsPage.tsx` | Add `useEffect` to read `?track=` and set `selectedCategory`. |
| **4** | `src/components/public/CoursesPage.tsx` | Add `useEffect` to read `?category=` and append `#certification` info section. |
| **5** | `src/components/public/EventsPage.tsx` | Add `useEffect` to read `?type=` and set `filterCategory`. |
| **6** | `src/components/public/Home.tsx` | Add demonstration disclaimer notice to the impact metrics card. |
| **7** | `src/components/public/Footer.tsx` | Add working `Contact Us` link; preserve verified portal directory. |
| **8** | `src/components/public/Header.tsx` | Ensure submenu clicks set query parameters / scroll to real anchors. |
