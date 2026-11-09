# Kala

Internal HR web app for attendance and leave management. Employees clock in with a selfie and server time, request leave, and managers and HR approve it in two steps.

**Live demo:** https://kala-hris.vercel.app (use the one-click demo buttons on the login page)

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Employee | karyawan@kala.test | kala12345 |
| Manager | manager@kala.test | kala12345 |
| HR | hr@kala.test | kala12345 |

## Features

- Login with JWT in an httpOnly cookie and role-based access (Employee, Manager, HR). The session is checked against the database on every request, so deactivated accounts lose access immediately.
- Attendance with a selfie from the live camera and time taken from the server. Late status is calculated automatically.
- Leave requests with workday counting (weekends excluded), balance check, and two-step approval (manager, then HR).
- Notification bell, refreshed every 15 seconds.
- HR tools: employee management, monthly attendance report with CSV export, and an audit log.

## Tech stack

Next.js 16, TypeScript, Tailwind CSS, Prisma 7 with MySQL (Aiven), Cloudinary for photos, Vitest, GitHub Actions for CI, deployed on Vercel.

## Design decisions

- Clock times come from the server, not the browser, so changing the device clock has no effect.
- Photos can only be taken from the camera, not uploaded from the gallery.
- Leave balance is deducted only when a request is approved. Pending requests still count when checking available days, so balance cannot be overbooked.
- Approval is done inside a transaction that checks the current status, so a request can only be processed once.
- Passwords are hashed with bcrypt, and the API never returns password hashes.

## Run locally

```bash
git clone https://github.com/axelzarraa/kala-hris.git
cd kala-hris
npm install
```

Create a `.env` file:

```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/kala_hris"
JWT_SECRET="any-long-random-string"
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
```

Create an empty database named `kala_hris`, then:

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Run the tests with `npm test`.

## Roadmap

- Smart leave: team conflict warning and national holidays
- Dina, an assistant that answers questions about the employee's own attendance and leave