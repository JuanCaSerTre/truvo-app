# TRUVO beta release gate (Android + iOS)

This checklist applies to the **closed beta**, not public store release. Do not ship before the P0 checks pass on physical devices.

## Build and backend

- [ ] Configure real `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as EAS environment variables for preview builds (never commit secrets).
- [ ] Verify Supabase migrations, RLS, auth redirects (`truvo://auth-callback`) and invitation Edge Function are deployed.
- [ ] Verify email provider and invitation URL. The current default `truvo://` invitation only opens the app when installed; provide a fallback for new users.
- [ ] Run `npm ci`, `npm run typecheck`, `npm run lint`, and `npx expo-doctor`.
- [ ] Build Android preview APK and iOS internal build using EAS; verify signing, Expo account access and Apple developer provisioning.
- [ ] Install on at least one real Android and one real iPhone.

## Financial correctness and authorization

- [ ] Test month-end and leap-year payment schedules, total rounding, installment remainder, and once/weekly/biweekly/monthly frequencies.
- [ ] With two real accounts: signup, verification, create, invite, accept/reject, register payment, confirm/reject payment, and complete agreement.
- [ ] Verify unauthorized users cannot view or change another user's agreement, payment, or profile.
- [ ] Confirm notifications on both physical devices and check cold-start deep links.

## Privacy, safety, and tester support

- [ ] Publish accessible privacy policy and support email; document account/data deletion.
- [ ] Explain clearly that TRUVO records agreements and **does not lend or transfer money**.
- [ ] Review local legal requirements for any interest-bearing personal-loan features in target countries.
- [ ] Add a simple feedback path and crash reporting before inviting external testers.
- [ ] Do not enable Stripe/Premium until payments and store compliance are ready.

## Distribution

- [ ] Android: internal testing track in Google Play Console (or direct APK for a very small technical test), followed by closed testing.
- [ ] iOS: App Store Connect TestFlight internal/external testing as appropriate. External TestFlight builds may require Beta App Review.
- [ ] Prepare screenshots, beta description, tester instructions and demo credentials if requested.
- [ ] Confirm whether a new personal Google Play developer account is subject to closed-test requirements before production access.

## Learn from users

Measure activation, first agreement created, invite opened, agreement accepted, first payment recorded, and qualitative feedback. Avoid collecting amounts, names, or other sensitive financial data in analytics events.

**Go/no-go:** no known critical data integrity/security bugs; full agreement journey succeeds on Android and iOS; feedback and error reporting work.
