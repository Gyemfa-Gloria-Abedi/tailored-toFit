# Tailored toFit Connected Project

This archive contains the Tailored toFit React Native mobile project and backend API.

## Mobile
cd mobile
npm install
npx expo start

## Backend
cd backend
npm install

Configure backend `.env` from `.env.example`, then:
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev

For a physical phone, set the mobile API URL to the LAN IP of the computer running the backend.
