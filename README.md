# Gloco (Hyper-Focused Diabetes Tracker)

Minimal mobile demo app to track blood glucose readings with auth and CRUD.

## Features

- Email/password auth (sign up, sign in, sign out) with Supabase Auth
- Session persistence across app restarts
- Local unit preference (`mg/dL`, `g/L`, `mmol/L`) with UI conversion
- Glucose log CRUD with fields:
  - `glucose_mgdl` (required, canonical storage)
  - `logged_at` (required, defaults to now in UI)
  - `meal_tag` (optional, expanded meal timing values)
  - `insulin_units` (optional)
  - `carbs_grams` (optional)
  - `notes` (optional)
- Home screen with lightweight daily stats:
  - today count
  - today average glucose
- Home glucose status card (low/normal/high) from latest reading
- Post-meal reminder timer with start/pause/reset and local notifications
- Emergency contacts CRUD with tap-to-call from Home
- Glucose PDF export with both actions: download or share
- Empty states, loading states, and network error messages
- Row Level Security so each user only accesses their own data

## Notes

- `user_id` is always set from the authenticated session in app code.
- Glucose values are always stored as `mg/dL`, even when users enter values in `g/L` or `mmol/L`.
- Form validation rules:
  - glucose > 0 (in selected unit)
  - insulin/carbs >= 0 when provided
- If Supabase email confirmation is enabled, users may need to verify email before sign in.
- On first reminder use, the app asks notification permission for local timer alerts.
- Emergency contacts are persisted in Supabase (`public.emergency_contacts`) and synced per user.
