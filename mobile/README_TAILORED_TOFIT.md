# Tailored toFit — React Native UI

This project is an Expo Router / React Native implementation of the Tailored toFit mobile UI shown in the supplied reference image.

## Included screens

- Onboarding / splash
- Home dashboard
- Clients list
- Client profile / AI fit profile
- AI Style Studio
- Style details
- Customize style
- New measurement
- Saved designs
- Profile

## Run

```bash
npm install
npx expo start
```

Then open the project with Expo Go, an Android emulator, iOS simulator, or a development build.

## Project structure

- `src/app/` — Expo Router screens
- `src/components.tsx` — shared UI primitives and bottom navigation
- `src/theme.ts` — Tailored toFit color system and spacing
- `assets/images/` — reference-derived placeholder imagery used by the prototype

## Notes

This is a UI/prototype implementation. The measurement, AI recommendation, save-design, and client data flows currently use local mock data and navigation. Backend/API integration can be added later without replacing the screen structure.
