

# Beat Beat — Full Flow Rebuild

## Overview
Restructure the app around the new 4-phase flow: Onboarding → Home (with scan history) → Scan (audio recording + analysis) → Results (5 branches). Remove the old manual BPM logging paradigm; the core interaction is now "scan your heartbeat via audio."

## Database Changes

Add a `scans` table to replace the concept of manual readings. The existing `recordings` table stores raw audio files; `scans` ties a recording to an analysis result.

```sql
CREATE TYPE public.scan_result AS ENUM ('normal', 'clear_classification', 'inconclusive', 'emergency', 'try_again');

CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid REFERENCES public.recordings(id) ON DELETE SET NULL,
  result scan_result NOT NULL,
  result_title text NOT NULL,
  result_description text NOT NULL,
  condition_name text,          -- for "clear classification" branch
  recommended_steps text,       -- for clear / inconclusive
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_to_kry boolean NOT NULL DEFAULT false
);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
-- Open RLS for now (no auth yet)
CREATE POLICY "Anyone can insert scans" ON public.scans FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can view scans" ON public.scans FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update scans" ON public.scans FOR UPDATE TO public USING (true);
```

## File Changes

### 1. Update types — `src/lib/types.ts`
- Add `ScanResult` type with the five branches and associated data.
- Update `UserSettings` to include `sex` and `knownConditions` fields for the new onboarding.

### 2. Rewrite Onboarding — `src/pages/Onboarding.tsx`
Three steps:
1. **Welcome**: Value prop screen with Beat Beat branding and pulsing heart.
2. **Profile**: Age, sex (select), known conditions (multi-select or text input).
3. **Tutorial**: Illustration/text showing how to hold phone to chest for audio capture.
All saved to localStorage. Marks `onboarded: true` on completion.

### 3. Rewrite Home Screen — `src/pages/Dashboard.tsx`
- **Top**: Large "Start Scan" CTA button (navigates to `/scan`).
- **Below**: Scan history list fetched from the `scans` table (most recent first).
- Each entry shows: date, result summary (badge colored by result type), tap to expand details.
- Expanded view shows full result description, condition info, and a "Send to Kry" button (mock action that sets `sent_to_kry = true`).

### 4. New Scan Flow — `src/pages/Scan.tsx`
Multi-step screen within a single page, using local state to progress:

1. **Pre-scan positioning prompt**: Instructions on holding the phone. "Ready" button.
2. **Recording phase**: Pulsing orb animation + countdown timer (e.g., 15 seconds). Uses `MediaRecorder` API (reuse logic from `Record.tsx`). Audio uploads to Supabase storage on stop.
3. **Analyzing**: Loading spinner/animation while a mock analysis runs (~2-3 seconds timeout). In the future this would call an AI edge function, but for now it randomly picks a result branch for demo purposes.
4. **Results**: Renders one of five result components based on the outcome.

### 5. Result Components — `src/components/results/`
Five sub-components, each rendered after analysis:

- **NormalResult**: Reassuring message, "Scan again in 1 week" prompt, optional reminder notification toggle, saved to history.
- **ClearClassificationResult**: Shows condition name + plain-language explanation, recommended next steps, "Send to Kry" button, saved to history.
- **InconclusiveResult**: "Needs professional review" message, "Send to Kry" mock, saved as "pending review."
- **EmergencyResult**: Red urgent screen, "Call Emergency Services" primary CTA (`tel:112`), "Share scan with responders" secondary, saved to history.
- **TryAgainResult**: What went wrong + guidance, "Retry" button (resets scan flow), NOT saved to history.

### 6. Update Navigation
- **BottomNav**: Simplify to Home / Settings (scan is accessed via the Home CTA, not a tab).
- **Routes in `App.tsx`**: Add `/scan` route. Remove `/log` and `/record` routes. Keep `/history` as an alias or remove it (history is now inline on home).

### 7. Cleanup
- Remove `src/pages/LogReading.tsx` (manual BPM entry — replaced by scan).
- Remove `src/pages/Record.tsx` (standalone record page — merged into Scan).
- Remove old `src/pages/History.tsx` (history now lives on Dashboard).
- Keep `src/lib/anomaly.ts` for notification utilities; remove BPM classification functions that are no longer used.

## Technical Notes
- The scan analysis is **mocked** for now — it randomly assigns a result branch with weighted probability (mostly "normal"). This is the hook point for a future AI/ML edge function.
- The "Send to Kry" action is a **mock** — it flips a flag in the database and shows a toast. No actual integration yet.
- Audio recording reuses the existing `MediaRecorder` + Supabase storage upload pattern from `Record.tsx`.
- The emergency CTA uses `window.open('tel:112')` for the call button.

