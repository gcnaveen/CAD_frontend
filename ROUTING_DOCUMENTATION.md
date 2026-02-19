# North Cot CAD Platform - Routing Documentation

**Document Version:** 1.0  
**Last Updated:** February 5, 2026  
**Purpose:** Complete routing structure for client review and content updates

---

## 📋 Table of Contents

1. [Public Routes](#public-routes)
2. [User Dashboard Routes](#user-dashboard-routes)
3. [CAD Center Dashboard Routes](#cad-center-dashboard-routes)
4. [Super Admin Dashboard Routes](#super-admin-dashboard-routes)
5. [Quick Reference Table](#quick-reference-table)

---

## 🌐 Public Routes

These routes are accessible to all visitors without authentication.

### 1. Landing Page

- **Route:** `/`
- **Component:** Homepage
- **Description:** Main landing page with platform information
- **Sections:**
  - Hero section with call-to-action
  - How it works section (`#how-it-works`)
  - Benefits section (`#benefits`)
  - Client testimonials (`#testimonials`)
  - About platform
  - Video demonstration

### 2. Login Pages

- **User Login:** `/login`
  - Component: LoginPage
  - For regular users (surveyors)
- **Admin Login:** `/admin-login`
  - Component: LoginPageEmail
  - For administrators and CAD center staff

### 3. Registration

- **Route:** `/register`
- **Component:** RegisterPage
- **Description:** New user registration page

---

## 👤 User Dashboard Routes

Routes for authenticated surveyors/users who submit survey projects.

**Base Path:** `/dashboard/user`

### User Routes Structure:

| Route                           | Component         | Description                | Access              |
| ------------------------------- | ----------------- | -------------------------- | ------------------- |
| `/dashboard/user`               | HomePage          | User dashboard home        | Authenticated Users |
| `/dashboard/user/upload`        | UserUploadForm    | Upload new survey project  | Authenticated Users |
| `/dashboard/user/track-order`   | TrackCurrentOrder | Track current order status | Authenticated Users |
| `/dashboard/user/order-history` | OrderHistoryTable | View past orders           | Authenticated Users |

### User Dashboard Features:

- **Home Dashboard:** Overview of user activities and quick actions
- **Upload Survey:** Form to submit new CAD survey projects with:
  - Survey information
  - File uploads
  - Project details
- **Track Order:** Real-time tracking of current orders
- **Order History:** Complete history of submitted and completed projects

---

## 🏢 CAD Center Dashboard Routes

Routes for CAD center staff to manage assigned projects and payments.

**Base Path:** `/dashboard/cad`  
**Layout:** CADLayout (with sidebar navigation)

### CAD Center Routes Structure:

| Route                           | Component         | Description                    | Icon        | Access    |
| ------------------------------- | ----------------- | ------------------------------ | ----------- | --------- |
| `/dashboard/cad`                | CADHomePage       | CAD center home dashboard      | 🏠 Home     | CAD Staff |
| `/dashboard/cad/current-orders` | ViewCurrentOrders | Active projects to work on     | 📋 Projects | CAD Staff |
| `/dashboard/cad/order-history`  | ViewAllOrders     | Completed project history      | 📜 History  | CAD Staff |
| `/dashboard/cad/wallet`         | Wallet            | Payment statistics and history | 💰 Wallet   | CAD Staff |

### CAD Center Features:

#### 1. Home Dashboard (`/dashboard/cad`)

- Overview of assigned projects
- Quick statistics
- Recent activities

#### 2. Current Orders (`/dashboard/cad/current-orders`)

- View all active/assigned projects
- Filter and search functionality
- Order details drawer
- Status updates

#### 3. Order History (`/dashboard/cad/order-history`)

- Complete project history
- Completed and delivered projects
- Historical data and reports

#### 4. Wallet (`/dashboard/cad/wallet`)

- **Payment Statistics:**
  - Pending Payment (in yellow/amber)
  - Received Payment (in green)
  - Total Payment (Pending + Received, in blue)
- **Transaction History Table:**
  - Order ID and project name
  - Payment amounts
  - Order date and payment date
  - Payment status (Pending/Received)
  - View details and download invoices
- **Features:**
  - Searchable and filterable transaction list
  - Export functionality
  - Payment tracking

### CAD Center Navigation Menu:

```
┌─────────────────────────────┐
│  North Cot CAD             │
│  CAD Center                │
├─────────────────────────────┤
│  🏠 Home                    │
│  📋 View Current Projects   │
│  📜 View Order History      │
│  💰 View Wallet             │
└─────────────────────────────┘
```

---

## 👨‍💼 Super Admin Dashboard Routes

Routes for platform administrators with full system access.

**Base Path:** `/superadmin`  
**Layout:** SuperAdminLayout (with sidebar navigation)

### Super Admin Routes Structure:

| Route                               | Component          | Description                | Icon        | Access      |
| ----------------------------------- | ------------------ | -------------------------- | ----------- | ----------- |
| `/superadmin`                       | SuperAdminHome     | Super admin home dashboard | 🏠 Home     | Super Admin |
| `/superadmin/home`                  | SuperAdminHome     | Alternative home route     | 🏠 Home     | Super Admin |
| `/superadmin/admin-users`           | ViewAdminUsers     | Manage admin users         | 👤 Users    | Super Admin |
| `/superadmin/cad-centers`           | ViewCadCenters     | Manage CAD centers         | 🏢 Centers  | Super Admin |
| `/superadmin/projects`              | ViewCurrentProject | View active projects       | 📋 Projects | Super Admin |
| `/superadmin/projects-history`      | ViewProjectHistory | View project history       | 📜 History  | Super Admin |
| `/superadmin/user-surveyor-details` | ViewUserDetails    | View user/surveyor info    | 🔍 Details  | Super Admin |

### Super Admin Features:

#### 1. Home Dashboard (`/superadmin` or `/superadmin/home`)

- Platform-wide statistics
- System overview
- Quick actions

#### 2. Admin Users Management (`/superadmin/admin-users`)

- View all admin users
- Add new admin users
- Edit admin user details
- Manage permissions

#### 3. CAD Centers Management (`/superadmin/cad-centers`)

- View all registered CAD centers
- Add new CAD centers
- Edit CAD center information
- Assign projects to centers

#### 4. Projects Management (`/superadmin/projects`)

- View all current active projects
- Monitor project status
- Assign projects to CAD centers
- Project details and tracking

#### 5. Projects History (`/superadmin/projects-history`)

- Complete project archive
- Historical data and analytics
- Completed project details
- Performance reports

#### 6. User/Surveyor Details (`/superadmin/user-surveyor-details`)

- View all registered users/surveyors
- User profile management
- Activity tracking
- User statistics

### Super Admin Navigation Menu:

```
┌─────────────────────────────────┐
│  North Cot CAD                 │
│  Super Admin                   │
├─────────────────────────────────┤
│  🏠 Home                        │
│  👤 View Admin Users            │
│  🏢 View CAD Centers            │
│  📋 View Projects               │
│  📜 View Projects History       │
│  🔍 View User/Surveyor Details  │
└─────────────────────────────────┘
```

---

## 📊 Quick Reference Table

Complete routing structure at a glance:

### Public Routes

```
/                    → Landing Page
/login               → User Login
/admin-login         → Admin/CAD Login
/register            → User Registration
```

### User Routes (Authenticated)

```
/dashboard/user                  → User Home
/dashboard/user/upload           → Upload Survey
/dashboard/user/track-order      → Track Order
/dashboard/user/order-history    → Order History
```

### CAD Center Routes (Authenticated)

```
/dashboard/cad                   → CAD Home
/dashboard/cad/current-orders    → Current Projects
/dashboard/cad/order-history     → Order History
/dashboard/cad/wallet            → Wallet & Payments
```

### Super Admin Routes (Authenticated)

```
/superadmin                           → Admin Home
/superadmin/home                      → Admin Home (Alt)
/superadmin/admin-users               → Admin Users
/superadmin/cad-centers               → CAD Centers
/superadmin/projects                  → Current Projects
/superadmin/projects-history          → Project History
/superadmin/user-surveyor-details     → User Details
```

---

## 🎨 UI/UX Features

### Navigation Features:

- **Responsive Design:** All routes work on desktop, tablet, and mobile
- **Sidebar Navigation:** CAD and Super Admin dashboards use collapsible sidebars
- **Breadcrumbs:** Easy navigation tracking
- **Cursor Pointers:** All clickable elements have cursor pointer for better UX

### Color Scheme:

- **Primary Blue:** `#0ea5e9` (Sky Blue)
- **Dark Background:** `#0f172a` (Slate)
- **Success Green:** `#10b981` (Emerald)
- **Warning Yellow:** `#fbbf24` (Amber)
- **Active/Hover:** `#38bdf8` (Light Blue)

### Authentication:

- Protected routes require login
- Role-based access control
- Automatic redirects for unauthorized access

---

## 🔄 Content Update Guidelines

### For Content Changes:

1. **Landing Page Sections:**
   - Edit components in `/src/sections/`
   - Hero section: `Hero.jsx`
   - How it works: `HowItWorks.jsx`
   - Benefits: `Benefits.jsx`
   - Testimonials: `ClientTestimonials.jsx`

2. **Dashboard Content:**
   - User dashboard: `/src/dashboard/user/`
   - CAD dashboard: `/src/dashboard/cad/`
   - Admin dashboard: `/src/dashboard/superadmin/`

3. **Headers and Footers:**
   - Main header: `/src/components/Header.jsx`
   - Footer: `/src/components/Footer.jsx`
   - Dashboard headers: Within respective layout files

### Testing Routes:

To test routes in development:

```bash
# Start development server
npm run dev

# Then navigate to:
http://localhost:5173/              # Landing page
http://localhost:5173/login         # Login page
http://localhost:5173/dashboard/user      # User dashboard
http://localhost:5173/dashboard/cad       # CAD dashboard
http://localhost:5173/superadmin          # Admin dashboard
```

---

## 📝 Notes for Clients

1. **Static Content:** All text, images, and styling can be updated without affecting routing
2. **Test Environment:** Use development server to preview changes before deployment
3. **Responsive:** All routes are mobile-friendly and responsive
4. **Browser Support:** Compatible with modern browsers (Chrome, Firefox, Safari, Edge)
5. **Performance:** Optimized for fast loading with code splitting

---

## 🚀 Deployment Information

- **Build Command:** `npm run build`
- **Development:** `npm run dev`
- **Preview Build:** `npm run preview`
- **Port:** Default 5173 (development)

---

## 📞 Support & Questions

For questions about routing, navigation, or content updates:

- Review this documentation
- Test changes in development environment first
- Contact technical team for route modifications
- All existing routes are production-ready

---

**Document End**

_This documentation covers all routes as of February 5, 2026. For technical implementation details, refer to the source code in `/src/App.jsx` and respective component files._
