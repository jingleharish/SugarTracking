# SugarTracking

A blood sugar and insulin tracking app built with React, Vite, and Google Sheets (Apps Script backend).

## Features
- Add, view, and delete blood sugar readings
- Add, view, and delete insulin records
- Analytics and charts (Recharts)
- Admin and viewer modes
- Data stored in Google Sheets via Apps Script

## Local Development

1. Install dependencies:
   ```sh
   npm install --legacy-peer-deps
   ```
2. Start the dev server:
   ```sh
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deploy to Vercel
1. Push your code to GitHub.
2. Go to [Vercel](https://vercel.com/) and import your repo.
3. Vercel will auto-detect Vite. Use `vite build` as the build command and `dist` as the output directory.
4. Add the provided `vercel.json` for SPA routing.

## Google Apps Script Backend
- The app expects a deployed Apps Script web app with public access ("Anyone, even anonymous").
- The API URL is set in the code as `API_URL`.
- If you need to change the backend, update the `API_URL` in the React code.

## Environment Variables
- If you want to use different API URLs for dev/prod, use Vercel's Environment Variables and reference them in your code via `import.meta.env`.

## License
MIT
