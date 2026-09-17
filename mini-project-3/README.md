🍔 BistroByte — Food Delivery & Real-Time Order Tracking

**BistroByte** is a full-stack, real-time food delivery and order management platform engineered to connect customers, restaurant operators, and delivery drivers within a unified digital ecosystem. Built with a modern, high-performance web stack, the platform bridges the gap between front-facing consumer convenience and back-of-house operational logistics, providing an end-to-end solution for modern food service workflows.

At the core of the customer experience is an intuitive ordering interface that allows users to explore dynamic restaurant menus, manage cart items seamlessly, and process orders with transparent, itemized checkouts. Once an order is placed, BistroByte shifts into its real-time tracking mode. Utilizing custom event listeners, synchronized browser storage streams, and live interval polling, the application delivers instant order status updates across multiple browser tabs and role-based interfaces without requiring hard page refreshes.

For platform operators and restaurant managers, BistroByte features an Executive Operations Admin Dashboard. This control panel provides total oversight of the platform's multi-role hierarchy, featuring user account governance, role permission management, and restaurant onboarding approval workflows. Beyond administrative access, the dashboard functions as an active dispatch controller. Administrators can view real-time incoming order streams, manually reassign delivery drivers, and track driver acceptance states in real time. 

The platform also includes an automated financial engine that computes real-time business metrics. It tracks gross order values, calculates platform commissions, aggregates delivery fee collections, and computes net payout figures owed to partner kitchens. Additionally, the platform’s data architecture features dynamic vendor resolution logic. This intelligent parsing system cross-references cart items, line-item metadata, and stored entity identifiers against live database profiles to guarantee accurate vendor mapping, eliminating hardcoded fallbacks and ensuring transparent order origin data.


🛠️ Tech Stack & Architecture

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **State & Synchronization:** LocalStorage API persistence, Custom EventEmitters for cross-tab state syncing, Axios
- **Backend:** Node.js, Express, RESTful API architecture

 ✨ Key Features

- **🛒 Customer Ordering Engine:** Dynamic menu rendering, interactive cart updates, itemized checkout calculation, and real-time order tracking.
- **⚡ Live Dispatch Controller:** Real-time driver assignments, status synchronization, and active order queue management.
- **📊 Executive Financial Metrics:** Real-time revenue analytics detailing gross order value, delivery fee breakdown, platform commissions, and vendor payout estimates.
- **🛡️ Admin Governance:** Multi-role management (Customer, Driver, Restaurant Admin, Admin), account suspensions, and vendor onboarding approvals.
- **🔍 Dynamic Vendor Parsing:** Smart payload resolution preventing fallback store names and mapping line items accurately to live vendor entities.

🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Archee01pal/bistrobyte-food-delivery-and-order-tracking.git](https://github.com/Archee01pal/bistrobyte-food-delivery-and-order-tracking.git)
   cd bistrobyte-food-delivery-and-order-tracking
