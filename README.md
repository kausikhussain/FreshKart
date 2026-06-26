# FreshKart — Groceries Delivered in Minutes

FreshKart is a startup-grade, commercial-ready grocery delivery ecosystem inspired by Blinkit and Zepto. It is built with a decoupled architecture featuring a TypeScript/Express backend and a Next.js 15 App Router frontend.

## 🚀 Key Features

* **⚡ Lightning Fast Delivery Map**: Live order tracking showing a courier bike pin traversing streets in real-time using Socket.io WebSockets.
* **🧠 AI Smart Search & Recommendations**: Natural language search analyzer (simulating semantic categorizing and filtering) and item-to-item recommendation widgets.
* **🔒 Dual Simulation Systems**: Integrated Stripe/Razorpay credit card gateways and driver delivery run simulators.
* **🏢 Portals (Admins, Customers & Drivers)**: Unified role-based accounts (Admin, Customer, Delivery Driver) with dedicated consoles.
* **📊 Analytics Panel**: Administrative dashboards rendering revenue AreaCharts and category distributions using Recharts.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 15, TypeScript, Tailwind CSS v4, Zustand, TanStack React Query, Recharts, Socket.io-client, Framer Motion.
* **Backend**: Node.js, Express.js, TypeScript, Socket.io, Mongoose (MongoDB).

---

## 📂 Directory Structure

```
FreshKart/
├── backend/            # Express, Mongoose & Socket.io Server
│   ├── src/
│   │   ├── config/     # Database and Seeder scripts
│   │   ├── controllers/# Auth, Products, Orders & Admin logic
│   │   ├── middleware/ # JWT & Role authorization policy checking
│   │   ├── models/     # Mongoose Schemas (User, Product, Order, etc.)
│   │   └── socket.ts   # Live Socket broadcasting & Trip simulators
├── frontend/           # Next.js 15 App Router Single Page App
│   ├── src/
│   │   ├── app/        # Pages (Home, Search, Details, Cart, Tracking)
│   │   ├── components/ # Custom Navbar, Footer, Product Cards & Layouts
│   │   ├── store/      # Zustand Cart & Authentication states
│   │   └── lib/        # API request wrappers
└── README.md
```

---

## ⚙️ Environmental Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/freshkart
JWT_SECRET=freshkart_super_secret_key_123
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🚥 Local Launch Quickstart

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally (Default port `27017`)

### 1. Initialize and Seed Backend
```bash
# Navigate to backend directory
cd backend

# Compile TypeScript and verify syntax
npm run build

# Boot the Express + WebSockets server (Automatic seeding triggered on empty database)
npm run dev
```

The database seeder will automatically create three test accounts:
* **Admin Profile**: `admin@freshkart.com` / Password: `admin123`
* **Customer Profile**: `user@freshkart.com` / Password: `user123`
* **Courier Profile**: `driver@freshkart.com` / Password: `driver123`

And populated categories: *Fruits & Vegetables*, *Dairy & Bread*, *Snacks*, *Bakery*, *Beverages*, alongside promo coupon codes: `WELCOME100` and `FRESH30`.

### 2. Launch Next.js Frontend
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Boot up the next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your browser.

---

## 🧪 E2E Manual Testing Checklist

1. **Sign In**: Go to `/login` and submit the default credentials (`user@freshkart.com` / `user123`) or use the **Google Login Simulator**.
2. **Browse & Cart**: Add items (e.g. *Fresh Red Onion* or *Fresh Malai Paneer*) to the basket. Observe the inline quantity adjusters on the cards.
3. **Apply Code**: Navigate to `/cart` -> **Checkout**. Type `WELCOME100` in the coupon field and apply. Notice the ₹100 discount deduction.
4. **Place Order**: Select **Stripe Card** payment. Click **Place Order**. Observe the simulated checkout loading and checkmark screen.
5. **Simulate Ride**: On the Order Tracking page, click **Simulate Delivery Ride**. The order status transitions to *Out for Delivery*, and the blue driver map marker starts moving along the green line in real-time.
6. **OTP Verification**: Log out, sign in as driver (`driver@freshkart.com` / `driver123`). Navigate to `/delivery/dashboard`. In the active deliveries column, enter the 4-digit code displayed on the tracking screen. Click **Confirm OTP**. The client order tracking page instantly updates to *Delivered* using socket events!
7. **Inspect Metrics**: Sign in as admin (`admin@freshkart.com` / `admin123`). Open `/admin/dashboard` to check your revenue curves and inventory levels.
