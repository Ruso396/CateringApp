# Grocery & Vegetable Note Management App

React Native (Expo) + TypeScript frontend and PHP + MySQL backend.

## Backend (PHP + MySQL)

API base URL: **http://192.168.0.100/** (mobile device and server on same WiFi; no localhost).

1. Create DB and tables: run `backend/sql/schema.sql` in MySQL.
2. Configure `backend/api/config/database.php` (or env) with `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.
3. Point document root to `backend/api/` at **192.168.0.100**, or run: `cd backend && php -S 192.168.0.100:80 -t api`

See `backend/README.md` for full setup and endpoints.

## Get started (Frontend)

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

Backend URL is in `src/config/api.ts` (BASE_URL). All API calls use that config: BASE_URL is "http://192.168.0.100/"; no hardcoded URLs elsewhere (`http://10.0.2.2:8080` for Android emulator, or your machine’s IP for a physical device).

**App features:** Home (event list, profile in header, FAB to create), Create/Edit event (title, date, Grocery/Vegetable tabs with Sheets-style table, auto-add rows, Save), Profile (name, mobile, address, Save), Export (3-dot menu on event → Grocery or Vegetable → PDF with 40 rows per page, two-column layout).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
