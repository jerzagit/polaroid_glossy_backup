# Backend Architecture - Polaroid Glossy

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Security & Authentication](#7-security--authentication)
8. [File Storage (Supabase)](#8-file-storage-supabase)
9. [Payment Integration (ToyyibPay)](#9-payment-integration-toyyibpay)
10. [Product Management](#10-product-management)
11. [Project Structure](#11-project-structure)
12. [Configuration](#12-configuration)
13. [Implementation Phases](#13-implementation-phases)

---

## 1. Project Overview

**Project Name:** Polaroid Glossy Backend  
**Purpose:** REST API backend for e-commerce platform specializing in polaroid photo printing  
**Port:** 8080 (default Spring Boot)  
**Frontend:** Next.js 16 running on port 3000

---

## 2. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Spring Boot | 3.4.x (Latest) |
| Language | Java | 21 (LTS) |
| Build Tool | Maven | 3.9.x |
| Database | PostgreSQL | 15+ (Supabase) |
| ORM | Spring Data JPA | - |
| Security | Spring Security + JWT | - |
| File Storage | Supabase Storage | - |
| Payment | ToyyibPay | API v1 |
| Documentation | SpringDoc OpenAPI | 2.5.x |
| Validation | Jakarta Validation | - |

### Dependencies (pom.xml)
```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- Database -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.5</version>
        <scope>runtime</scope>
    </dependency>
    
    <!-- HTTP client for Supabase REST API -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    
    <!-- Utilities -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-lang3</artifactId>
    </dependency>
    <dependency>
        <groupId>com.fasterxml.jackson.datatype</groupId>
        <artifactId>jackson-datatype-jsr310</artifactId>
    </dependency>
    
    <!-- PDF Generation (for invoices) -->
    <dependency>
        <groupId>com.itextpdf</groupId>
        <artifactId>itext7-core</artifactId>
        <version>8.0.5</version>
        <type>pom</type>
    </dependency>
    
    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                            │
│                         http://localhost:3000                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/REST
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     SPRING BOOT BACKEND                                 │
│                       http://localhost:8080                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  CONTROLLER │  │   SERVICE   │  │  REPOSITORY │  │    MODEL    │  │
│  │             │  │             │  │             │  │             │  │
│  │ AuthCtlr    │  │ AuthService │  │ UserRepo    │  │ User        │  │
│  │ OrderCtlr   │  │ OrderService│  │ OrderRepo   │  │ Order       │  │
│  │ AdminCtlr   │  │ PaymentSvc  │  │ OrderItemR  │  │ OrderItem   │  │
│  │ FileCtlr    │  │ FileService │  │ StatsRepo   │  │ StatusHist  │  │
│  │ SystemCtlr  │  │ SystemSvc   │  │             │  │ SystemInfo  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    SECURITY LAYER                                │   │
│  │  JWT Token Filter → Authentication Manager → Role Checker       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
          │  SUPABASE    │  │  TOYYIBPAY  │  │  SUPABASE   │
          │  PostgreSQL  │  │   Payment   │  │   Storage   │
          │   (DB)      │  │   Gateway   │  │  (Images)   │
          └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      USER       │       │     ORDER       │       │   ORDER_ITEM    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (UUID) PK   │◄──┐   │ id (UUID) PK    │◄──────│ id (UUID) PK   │
│ email (unique) │   │   │ order_number    │       │ order_id (FK)  │
│ password_hash  │   │   │ user_id (FK)    │       │ size_id         │
│ name           │   │   │ affiliate_id(FK)│       │ quantity        │
│ phone          │   │   │ customer_name   │       │ unit_price      │
│ avatar_url     │   │   │ customer_email  │       │ total_price     │
│ role           │   │   │ customer_phone  │       │ images (JSONB)  │
│ affiliate_code │   │   │ customer_state │       │ custom_texts    │
│ referred_by    │   │   │ status         │       │ s3_keys (JSONB) │
│ created_at     │   │   │ payment_status │       │ created_at      │
│ updated_at     │   │   │ payment_method │       └─────────────────┘
└─────────────────┘   │   │ toyyibpay_ref │
                       │   │ subtotal      │
┌─────────────────┐   │   │ shipping      │
│  USER (referral)│   │   │ total         │
├─────────────────┤   │   │ paid_at       │
│ id (UUID) PK   │───┘   │ tracking_num  │
│ affiliate_code  │       │ shipped_at    │
└─────────────────┘       │ delivered_at  │
                          │ notes         │
                          │ created_at    │
                          │ updated_at    │
                          └───────────────┘
                                  │
                                  │ 1:N
                                  ▼
                          ┌─────────────────┐
                          │STATUS_HISTORY  │
                          ├─────────────────┤
                          │ id (UUID) PK   │
                          │ order_id (FK)  │
                          │ status         │
                          │ message        │
                          │ created_at     │
                          └─────────────────┘
```

### 4.2 SQL Schema (PostgreSQL)

```sql
-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    affiliate_code VARCHAR(50) UNIQUE,
    referred_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_affiliate_code ON users(affiliate_code);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    affiliate_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_state VARCHAR(10) DEFAULT 'w',
    
    -- Status: PENDING, PROCESSING, POSTED, ON_DELIVERY, DELIVERED, CANCELLED, REFUNDED
    status VARCHAR(20) DEFAULT 'PENDING',
    
    -- Payment: PENDING, PAID, FAILED
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    payment_method VARCHAR(20), -- BANK_TRANSFER, TOYYIBPAY
    toyyibpay_ref VARCHAR(100),
    
    subtotal DECIMAL(10,2) NOT NULL,
    shipping DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    
    paid_at TIMESTAMP WITH TIME ZONE,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- =============================================
-- ORDER ITEMS TABLE
-- =============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    size_id VARCHAR(10) NOT NULL,
    size_name VARCHAR(20) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    images JSONB NOT NULL DEFAULT '[]',
    custom_texts JSONB DEFAULT '[]',
    s3_keys JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- =============================================
-- ORDER STATUS HISTORY TABLE
-- =============================================
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- =============================================
-- PRINT SIZES TABLE (Reference Data)
-- =============================================
CREATE TABLE print_sizes (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    width DECIMAL(5,2) NOT NULL,
    height DECIMAL(5,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default print sizes
INSERT INTO print_sizes (id, name, display_name, width, height, price, description) VALUES
('2r', '2R', '2R (2.5 x 3.5 inches)', 2.5, 3.5, 0.50, 'Wallet size - Perfect for keepsakes'),
('3r', '3R', '3R (3.5 x 5 inches)', 3.5, 5.0, 0.75, 'Standard photo size - Great for albums'),
('4r', '4R', '4R (4 x 6 inches)', 4.0, 6.0, 1.00, 'Most popular - Classic polaroid style'),
('a4', 'A4', 'A4 (8.3 x 11.7 inches)', 8.3, 11.7, 3.50, 'Poster size - Perfect for displays');

-- =============================================
-- PRODUCT METADATA TABLE
-- Stores marketing content per print size.
-- Decoupled from print_sizes (pricing layer).
-- Currently driven by products-meta.json in
-- Next.js; admin backend will own this table.
-- =============================================
CREATE TABLE product_meta (
    id VARCHAR(10) PRIMARY KEY REFERENCES print_sizes(id) ON DELETE CASCADE,
    short_description TEXT,
    full_description TEXT,
    tag VARCHAR(30) NOT NULL DEFAULT 'STANDARD',        -- e.g. MINI, CLASSIC, BESTSELLER, PREMIUM
    accent_color VARCHAR(10) NOT NULL DEFAULT '#6366f1', -- hex color for UI highlights
    images JSONB NOT NULL DEFAULT '[]',                 -- ordered array of image URLs
    features JSONB NOT NULL DEFAULT '[]',               -- string array of feature chips
    tiktok_videos JSONB NOT NULL DEFAULT '[]',          -- [{videoId, url, caption}]
    rating DECIMAL(3,2) DEFAULT 4.8,                    -- aggregated or manually set
    review_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_meta_id ON product_meta(id);

-- Seed default metadata (mirrors products-meta.json)
INSERT INTO product_meta (id, short_description, full_description, tag, accent_color, images, features, rating, review_count) VALUES
('2r', 'Wallet-size polaroid, perfect for keepsakes and gifting.', 'The 2R print is our smallest and most affordable format — designed to fit perfectly in wallets, scrapbooks, and photo albums.', 'MINI', '#6366f1', '["images/customer-1.png","images/customer-2.png"]', '["Wallet-size","Keepsake ready","Pocket-friendly"]', 4.7, 312),
('3r', 'Standard photo size, ideal for albums and framing.', 'The 3R is our standard format, matching the classic photo size most people grew up with.', 'CLASSIC', '#0ea5e9', '["images/product-custom.png","images/customer-3.png"]', '["Album-ready","Standard format","Gift-perfect"]', 4.8, 541),
('4r', 'Classic polaroid look and feel — our most loved size.', 'The 4R is the definitive polaroid experience. Its iconic 4 × 6 proportion delivers the perfect balance of detail and portability.', 'BESTSELLER', '#f59e0b', '["images/hero-polaroids.png","images/product-collection.png"]', '["True polaroid feel","Best value","Frame-ready","Custom text support"]', 4.9, 1204),
('a4', 'Poster-grade quality — built for walls and statement displays.', 'The A4 is our largest and most premium format, engineered for customers who demand wall-art quality.', 'PREMIUM', '#10b981', '["images/product-collection.png","images/product-printing.png"]', '["Wall-art quality","Hi-res output","Display-worthy","Frame-ready"]', 4.8, 187);
```

---

## 5. API Endpoints

### 5.1 Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new customer | Public |
| POST | `/api/auth/login` | Login, returns JWT | Public |
| POST | `/api/auth/refresh` | Refresh JWT token | Auth |
| GET | `/api/auth/me` | Get current user | Auth |
| PUT | `/api/auth/profile` | Update profile | Auth |
| POST | `/api/auth/google` | Google OAuth callback | Public |

### 5.2 Orders (Public)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/orders` | Create new order | Auth |
| GET | `/api/orders/{orderNumber}` | Get order by number | Public |
| GET | `/api/orders/my` | Get my orders | Auth |
| POST | `/api/orders/{id}/pay` | Initiate payment | Auth |

### 5.3 Orders (Admin/Packer/Marketing)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/orders` | List orders (paginated, filtered) | Packer+ |
| GET | `/api/admin/orders/{id}` | Get order details | Packer+ |
| PATCH | `/api/admin/orders/{id}/status` | Update status | Marketing+ |
| PATCH | `/api/admin/orders/{id}/tracking` | Add tracking # | Packer+ |
| POST | `/api/admin/orders/{id}/notes` | Add internal notes | Marketing+ |

### 5.4 Stats & Analytics

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/stats/overview` | Dashboard stats | Marketing+ |
| GET | `/api/admin/stats/sales` | Sales data | Marketing+ (no revenue for Marketing) |
| GET | `/api/admin/stats/orders-by-status` | Orders count by status | Marketing+ |
| GET | `/api/admin/stats/top-sizes` | Best selling sizes | Marketing+ |
| GET | `/api/admin/stats/by-state` | Orders by state | Admin only |

### 5.5 System Info (Super Admin Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/system/storage` | Storage usage (S3/Supabase) | Super Admin |
| GET | `/api/admin/system/database` | Database size & health | Super Admin |
| GET | `/api/admin/system/payment-costs` | ToyyibPay transaction fees | Super Admin |
| GET | `/api/admin/system/server` | Server health & metrics | Super Admin |

### 5.6 File Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/upload` | Upload image to Supabase | Auth |
| GET | `/api/orders/{id}/download` | Download all images as ZIP | Packer+ |
| DELETE | `/api/files/{key}` | Delete image | Auth |

### 5.7 ToyyibPay Webhook

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/webhooks/toyyibpay` | Payment callback | ToyyibPay |

### 5.8 User Management (Admin)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/users` | List users | Admin |
| GET | `/api/admin/users/{id}` | Get user details | Admin |
| PATCH | `/api/admin/users/{id}/role` | Update user role | Admin |
| POST | `/api/admin/affiliates/generate-code` | Generate affiliate code | Admin |

### 5.9 Product Management (Admin)

Two layers — **print sizes** (pricing/dimensions) and **product metadata** (marketing content):

#### Print Sizes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/sizes` | List all print sizes | Marketing+ |
| POST | `/api/admin/sizes` | Create new print size | Admin |
| PUT | `/api/admin/sizes/{id}` | Update price / name | Admin |
| PATCH | `/api/admin/sizes/{id}/toggle` | Enable / disable size | Admin |
| DELETE | `/api/admin/sizes/{id}` | Soft delete (deactivate) | Admin |

#### Product Metadata

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/products` | List all products (size + meta merged) | Marketing+ |
| GET | `/api/admin/products/{id}` | Get single product detail | Marketing+ |
| PUT | `/api/admin/products/{id}/meta` | Update marketing metadata | Marketing+ |
| POST | `/api/admin/products/{id}/images` | Upload product image | Marketing+ |
| DELETE | `/api/admin/products/{id}/images` | Remove product image by URL | Marketing+ |
| PUT | `/api/admin/products/{id}/images/reorder` | Reorder image carousel | Marketing+ |
| POST | `/api/admin/products/{id}/tiktok` | Add TikTok video | Marketing+ |
| DELETE | `/api/admin/products/{id}/tiktok/{videoId}` | Remove TikTok video | Marketing+ |
| GET | `/api/admin/products/{id}/analytics` | Sales stats per product | Admin |

---

## 6. User Roles & Permissions

### 6.1 Role Enum
```java
public enum Role {
    CUSTOMER,    // Regular customer - place orders, view own orders
    AFFILIATE,  // Marketing affiliate - view referred orders only
    PACKER,     // Warehouse staff - update to POSTED/DELIVERED only
    MARKETING,  // Marketing team - view all orders, update status
    ADMIN       // Super Admin - full system access including billing, storage, server
}
```

### 6.2 Permission Matrix

| Feature | Customer | Affiliate | Packer | Marketing | Admin |
|---------|:--------:|:---------:|:------:|:---------:|:-----:|
| **Auth** | | | | | |
| Register/Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Profile | Own | Own | Own | Own | ✅ |
| **Orders** | | | | | |
| Place Order | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Own Orders | ✅ | Own | ❌ | ✅ | ✅ |
| View All Orders | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Order Management** | | | | | |
| Update Status | ❌ | ❌ | 🚫 P/D only | ✅ | ✅ |
| Add Tracking | ❌ | ❌ | ✅ | ✅ | ✅ |
| Cancel Order | Own | Own | ❌ | ✅ | ✅ |
| Add Notes | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Files** | | | | | |
| Upload Images | ✅ | ✅ | ✅ | ✅ | ✅ |
| Download Order Images | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete Images | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Analytics** | | | | | |
| View Dashboard | ❌ | ❌ | ❌ | 🚫 No Rev | ✅ |
| View Sales Stats | ❌ | ❌ | ❌ | ❌ | ✅ |
| View by State | ❌ | ❌ | ❌ | ❌ | ✅ |
| **System (Super Admin)** | | | | | |
| Storage Usage | ❌ | ❌ | ❌ | ❌ | ✅ |
| Database Health | ❌ | ❌ | ❌ | ❌ | ✅ |
| Payment Costs | ❌ | ❌ | ❌ | ❌ | ✅ |
| Server Metrics | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Users** | | | | | |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Change Roles | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Product Management** | | | | | |
| View products / sizes | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit metadata (copy, images, TikTok) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create / update print sizes | ❌ | ❌ | ❌ | ❌ | ✅ |
| Set pricing | ❌ | ❌ | ❌ | ❌ | ✅ |
| Enable / disable sizes | ❌ | ❌ | ❌ | ❌ | ✅ |
| View product analytics | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Settings** | | | | | |
| Site Settings | ❌ | ❌ | ❌ | ❌ | ✅ |
| Print Sizes | ❌ | ❌ | ❌ | ❌ | ✅ |

*🚫 P/D only = Posted/Delivered only  
🚫 No Rev = Can see orders but not revenue*

---

## 7. Security & Authentication

### 7.1 JWT Configuration

```java
// JWT Properties (application.yml)
jwt:
  secret: ${JWT_SECRET:your-256-bit-secret-key-here-min-32-chars}
  expiration: 86400000  // 24 hours in milliseconds
  refresh-expiration: 604800000  // 7 days
```

### 7.2 Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
                .requestMatchers("/api/orders/*/track").permitAll()
                .requestMatchers("/api/webhooks/**").permitAll()
                .requestMatchers("/api/auth/google").permitAll()
                .requestMatchers("/api/upload").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                
                // Admin endpoints
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "MARKETING", "PACKER")
                
                // Super Admin endpoints
                .requestMatchers("/api/admin/system/**").hasRole("ADMIN")
                
                // Authenticated endpoints
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

### 7.3 Role-Based Access Control

```java
// Example: Admin only
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/admin/users")
public ResponseEntity<List<User>> getAllUsers() { ... }

// Example: Marketing and above
@PreAuthorize("hasAnyRole('ADMIN', 'MARKETING')")
@GetMapping("/admin/stats/overview")
public ResponseEntity<StatsOverview> getStats() { ... }

// Example: Packer can only update to POSTED or DELIVERED
@PreAuthorize("hasAnyRole('ADMIN', 'MARKETING', 'PACKER')")
@PatchMapping("/admin/orders/{id}/status")
public ResponseEntity<Order> updateStatus(
    @PathVariable UUID id,
    @Valid @RequestBody OrderStatusUpdateDto dto
) {
    // Validate packer can only set specific statuses
    if (currentUser.getRole() == Role.PACKER) {
        if (!List.of("POSTED", "DELIVERED").contains(dto.getStatus())) {
            throw new AccessDeniedException("Packer can only update to POSTED or DELIVERED");
        }
    }
    // ... proceed
}

// Example: Super Admin system endpoints
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/admin/system/storage")
public ResponseEntity<StorageInfo> getStorageUsage() { ... }
```

---

## 8. File Storage (Supabase)

### 8.1 Bucket Structure

```
polaroid-glossy-bucket/
├── original/
│   └── {orderId}/
│       └── {uuid}.jpg
├── processed/
│   └── {orderId}/
│       └── {uuid}_{size}.jpg
└── thumbnails/
    └── {orderId}/
        └── {uuid}_thumb.jpg
```

### 8.2 Storage Service (Super Admin Can View)

```java
@Service
public class StorageService {
    
    public StorageInfo getStorageUsage() {
        // Get bucket info from Supabase
        // Return: total size, file count, bandwidth used
        
        return StorageInfo.builder()
            .totalSizeGB(0.5)
            .usedSizeGB(0.15)
            .fileCount(234)
            .bandwidthGB(2.5)
            .build();
    }
}
```

---

## 9. Payment Integration (ToyyibPay)

### 9.1 Create Bill

```java
@Service
public class PaymentService {
    
    private final String toyyibpaySecretKey;
    private final String categoryCode;
    private final String returnUrl;
    private final String callbackUrl;
    
    public PaymentResponse createBill(Order order) {
        // Create bill with ToyyibPay API
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("userSecretKey", toyyibpaySecretKey);
        params.add("categoryCode", categoryCode);
        params.add("billName", order.getOrderNumber().substring(0, 30));
        params.add("billDescription", "Polaroid Glossy - " + order.getOrderNumber());
        params.add("billPriceSetting", "1");
        params.add("billPayorInfo", "1");
        params.add("billAmount", String.valueOf(order.getTotal().multiply(new BigDecimal("100")).intValue()));
        params.add("billReturnUrl", returnUrl + "?order_id=" + order.getOrderNumber());
        params.add("billCallbackUrl", callbackUrl);
        params.add("billExternalReferenceNo", order.getOrderNumber());
        params.add("billTo", order.getCustomerName());
        params.add("billEmail", order.getCustomerEmail());
        params.add("billPhone", order.getCustomerPhone() != null ? order.getCustomerPhone() : "");
        params.add("billPaymentChannel", "0");
        params.add("billChargeToCustomer", "1");
        
        // Call ToyyibPay API
        // Returns BillCode
        
        // Update order with toyyibpay reference
        // Return payment URL: https://toyyibpay.com/{billCode}
    }
}
```

### 9.2 Payment Cost Tracking (Super Admin)

```java
@Service
public class PaymentCostService {
    
    public PaymentCostInfo getPaymentCosts(LocalDate from, LocalDate to) {
        // Calculate ToyyibPay fees based on transactions
        // 2.5% per transaction (example rate)
        
        List<Order> paidOrders = orderRepository.findByPaymentStatusAndPaidAtBetween(
            PaymentStatus.PAID, from, to
        );
        
        BigDecimal totalAmount = paidOrders.stream()
            .map(Order::getTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal feeRate = new BigDecimal("0.025"); // 2.5%
        BigDecimal totalFee = totalAmount.multiply(feeRate);
        
        return PaymentCostInfo.builder()
            .periodFrom(from)
            .periodTo(to)
            .totalTransactions(paidOrders.size())
            .totalAmount(totalAmount)
            .feeRate(feeRate)
            .totalFee(totalFee)
            .netAmount(totalAmount.subtract(totalFee))
            .build();
    }
}
```

---

## 10. Product Management

### 10.1 Architecture Overview

Product data is split into two tables to separate **business logic** (pricing) from **marketing content**:

```
┌──────────────────────────────────────────────────────────────┐
│                   PRODUCT DATA LAYERS                        │
│                                                              │
│  print_sizes (Admin → pricing)                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ id | name | width | height | price | isActive       │     │
│  └─────────────────────────────────────────────────────┘     │
│                         +                                    │
│  product_meta (Marketing → content)                          │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ id | tag | accentColor | images | features          │     │
│  │    | shortDesc | fullDesc | tiktokVideos | rating   │     │
│  └─────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│            GET /api/products  (merged response)              │
│            consumed by ProductCatalog + /products/[id]       │
└──────────────────────────────────────────────────────────────┘
```

**Who manages what:**
- **Admin** — creates print sizes, sets prices, enables/disables sizes
- **Marketing** — edits descriptions, uploads product images, manages TikTok videos, updates tags and feature chips

**Current state (Next.js monolith):**
Product metadata lives in `src/data/products-meta.json` and is merged with DB data in `/api/products/route.ts`. The Spring Boot admin backend will replace this file with a proper `product_meta` DB table managed via admin UI.

---

### 10.2 Print Size Management

```java
@RestController
@RequestMapping("/api/admin/sizes")
public class PrintSizeController {

    // GET /api/admin/sizes — list all (including inactive)
    @PreAuthorize("hasAnyRole('ADMIN', 'MARKETING')")
    @GetMapping
    public ResponseEntity<List<PrintSizeResponse>> listAll() { ... }

    // POST /api/admin/sizes — create new size (Admin only)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<PrintSizeResponse> create(@Valid @RequestBody PrintSizeRequest req) { ... }

    // PUT /api/admin/sizes/{id} — update price / display name
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<PrintSizeResponse> update(
        @PathVariable String id,
        @Valid @RequestBody PrintSizeRequest req) { ... }

    // PATCH /api/admin/sizes/{id}/toggle — enable or disable
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<PrintSizeResponse> toggle(@PathVariable String id) { ... }
}
```

**PrintSizeRequest DTO:**
```json
{
  "name": "5R",
  "displayName": "5R (5 x 7 inches)",
  "width": 5.0,
  "height": 7.0,
  "price": 2.00,
  "description": "Larger format prints",
  "isActive": true
}
```

---

### 10.3 Product Metadata Management

```java
@RestController
@RequestMapping("/api/admin/products")
public class ProductMetaController {

    // GET /api/admin/products — merged list (size + meta)
    @PreAuthorize("hasAnyRole('ADMIN', 'MARKETING')")
    @GetMapping
    public ResponseEntity<List<ProductAdminResponse>> listAll() { ... }

    // GET /api/admin/products/{id} — single product full detail
    @PreAuthorize("hasAnyRole('ADMIN', 'MARKETING')")
    @GetMapping("/{id}")
    public ResponseEntity<ProductAdminResponse> getOne(@PathVariable String id) { ... }

    // PUT /api/admin/products/{id}/meta — update copy, tag, color, features
    @PreAuthorize("hasAnyRole('ADMIN', 'MARKETING')")
    @PutMapping("/{id}/meta")
    public ResponseEntity<ProductAdminResponse> updateMeta(
        @PathVariable String id,
        @Valid @RequestBody ProductMetaRequest req) { ... }

    // POST /api/admin/products/{id}/images — upload image to Supabase, append URL
    @PreAuthorize("hasAnyRole('ADMIN', 'MARKETING')")
    @PostMapping("/{id}/images")
    public ResponseEntity<ImageUploadResponse> uploadImage(
        @PathVariable String id,
        @RequestParam("file") MultipartFile file) { ... }

    // DELETE /api/admin/products/{id}/images — remove by URL
    @PreAuthorize("hasAnyRole('ADMIN', 'MARKETING')")
    @DeleteMapping("/{id}/images")
    public ResponseEntity<Void> removeImage(
        @PathVariable String id,
        @RequestParam String imageUrl) { ... }

    // PUT /api/admin/products/{id}/images/reorder — reorder carousel
    @PreAuthorize("hasAnyRole('ADMIN', 'MARKETING')")
    @PutMapping("/{id}/images/reorder")
    public ResponseEntity<ProductAdminResponse> reorderImages(
        @PathVariable String id,
        @RequestBody List<String> orderedUrls) { ... }

    // POST /api/admin/products/{id}/tiktok — add TikTok video
    @PreAuthorize("hasAnyRole('ADMIN', 'MARKETING')")
    @PostMapping("/{id}/tiktok")
    public ResponseEntity<ProductAdminResponse> addTikTok(
        @PathVariable String id,
        @Valid @RequestBody TikTokVideoRequest req) { ... }

    // DELETE /api/admin/products/{id}/tiktok/{videoId}
    @PreAuthorize("hasAnyRole('ADMIN', 'MARKETING')")
    @DeleteMapping("/{id}/tiktok/{videoId}")
    public ResponseEntity<Void> removeTikTok(
        @PathVariable String id,
        @PathVariable String videoId) { ... }

    // GET /api/admin/products/{id}/analytics
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}/analytics")
    public ResponseEntity<ProductAnalyticsResponse> getAnalytics(@PathVariable String id) { ... }
}
```

**ProductMetaRequest DTO:**
```json
{
  "shortDescription": "Wallet-size polaroid, perfect for keepsakes.",
  "fullDescription": "Full long marketing copy here...",
  "tag": "MINI",
  "accentColor": "#6366f1",
  "features": ["Wallet-size", "Keepsake ready", "Pocket-friendly"]
}
```

**TikTokVideoRequest DTO:**
```json
{
  "videoId": "7123456789012345678",
  "url": "https://www.tiktok.com/@polaroidglossymy/video/7123456789012345678",
  "caption": "Customer unboxing 📦"
}
```

**ProductAnalyticsResponse:**
```json
{
  "productId": "4r",
  "totalOrderItems": 1204,
  "totalQuantitySold": 8932,
  "totalRevenue": 8932.00,
  "averageOrderQuantity": 7.4,
  "salesByMonth": [
    { "month": "2026-02", "quantity": 412, "revenue": 412.00 }
  ],
  "topCustomerStates": [
    { "state": "Selangor", "orders": 340 }
  ]
}
```

---

### 10.4 Migration Plan (JSON → Database)

When the Spring Boot backend goes live, the product metadata migration is:

1. Run the `product_meta` SQL table creation
2. Execute the seed `INSERT` statements (pre-populated from `products-meta.json`)
3. Update `/api/products/route.ts` in Next.js to call `http://localhost:8080/api/products` instead of merging `products-meta.json` locally
4. Archive `src/data/products-meta.json` — it becomes the Spring Boot DB's source of truth

---

## 11. Project Structure

```
polaroid-backend/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/polaroid/
│   │   │   ├── PolaroidApplication.java
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── CorsConfig.java
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── JwtConfig.java
│   │   │   │   ├── SupabaseConfig.java
│   │   │   │   └── SwaggerConfig.java
│   │   │   │
│   │   │   ├── controller/
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── OrderController.java
│   │   │   │   ├── AdminController.java
│   │   │   │   ├── ProductMetaController.java    ← product metadata + images + TikTok
│   │   │   │   ├── PrintSizeController.java      ← pricing + enable/disable
│   │   │   │   ├── FileController.java
│   │   │   │   ├── SystemController.java
│   │   │   │   └── WebhookController.java
│   │   │   │
│   │   │   ├── service/
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── OrderService.java
│   │   │   │   ├── PaymentService.java
│   │   │   │   ├── ProductMetaService.java       ← metadata CRUD, image upload, TikTok management
│   │   │   │   ├── PrintSizeService.java         ← size CRUD, analytics
│   │   │   │   ├── FileService.java
│   │   │   │   ├── StatsService.java
│   │   │   │   └── SystemService.java
│   │   │   │
│   │   │   ├── repository/
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── OrderRepository.java
│   │   │   │   ├── OrderItemRepository.java
│   │   │   │   ├── OrderStatusHistoryRepository.java
│   │   │   │   ├── PrintSizeRepository.java
│   │   │   │   └── ProductMetaRepository.java
│   │   │   │
│   │   │   ├── model/
│   │   │   │   ├── User.java
│   │   │   │   ├── Order.java
│   │   │   │   ├── OrderItem.java
│   │   │   │   ├── OrderStatusHistory.java
│   │   │   │   ├── PrintSize.java
│   │   │   │   ├── ProductMeta.java              ← tag, accentColor, images[], features[], tiktokVideos[]
│   │   │   │   └── enums/
│   │   │   │       ├── Role.java
│   │   │   │       ├── OrderStatus.java
│   │   │   │       └── PaymentStatus.java
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── request/
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   ├── OrderRequest.java
│   │   │   │   │   ├── OrderStatusUpdate.java
│   │   │   │   │   ├── PrintSizeRequest.java
│   │   │   │   │   ├── ProductMetaRequest.java
│   │   │   │   │   └── TikTokVideoRequest.java
│   │   │   │   │
│   │   │   │   └── response/
│   │   │   │       ├── AuthResponse.java
│   │   │   │       ├── OrderResponse.java
│   │   │   │       ├── StatsResponse.java
│   │   │   │       ├── SystemInfoResponse.java
│   │   │   │       ├── ProductAdminResponse.java ← merged size + meta
│   │   │   │       ├── ProductAnalyticsResponse.java
│   │   │   │       └── ImageUploadResponse.java
│   │   │   │
│   │   │   ├── security/
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── CustomUserDetailsService.java
│   │   │   │
│   │   │   └── exception/
│   │   │       ├── GlobalExceptionHandler.java
│   │   │       ├── ResourceNotFoundException.java
│   │   │       └── AccessDeniedException.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       └── application-prod.yml
│   │
│   └── test/
│       └── java/com/polaroid/
│           ├── controller/
│           ├── service/
│           └── repository/
│
└── README.md
```

---

## 12. Configuration

### 11.1 application.yml

```yaml
server:
  port: 8080

spring:
  application:
    name: polaroid-backend
  
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/polaroid}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

# JWT Configuration
jwt:
  secret: ${JWT_SECRET:your-256-bit-secret-key-minimum-32-characters-long}
  expiration: 86400000
  refresh-expiration: 604800000

# Supabase Configuration
supabase:
  url: ${SUPABASE_URL:https://your-project.supabase.co}
  key: ${SUPABASE_KEY:your-anon-key}
  storage-bucket: polaroid-glossy

# ToyyibPay Configuration
toyyibpay:
  secret-key: ${TOYYIBPAY_SECRET_KEY:your-secret-key}
  category-code: ${TOYYIBPAY_CATEGORY_CODE:your-category}
  return-url: ${TOYYIBPAY_RETURN_URL:http://localhost:3000/payment-status}
  callback-url: ${TOYYIBPAY_CALLBACK_URL:http://localhost:8080/api/webhooks/toyyibpay}
  fee-percentage: 2.5

# CORS
cors:
  allowed-origins: ${CORS_ORIGINS:http://localhost:3000}

# Logging
logging:
  level:
    com.polaroid: DEBUG
    org.springframework.security: DEBUG
```

### 11.2 Environment Variables

```bash
# Database
DATABASE_URL=jdbc:postgresql://your-supabase-url.supabase.co:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=your-db-password

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# ToyyibPay
TOYYIBPAY_SECRET_KEY=your-secret-key
TOYYIBPAY_CATEGORY_CODE=your-category-code
TOYYIBPAY_RETURN_URL=http://localhost:3000/payment-status
TOYYIBPAY_CALLBACK_URL=http://localhost:8080/api/webhooks/toyyibpay

# CORS
CORS_ORIGINS=http://localhost:3000
```

---

## 13. Implementation Phases

### Phase 1: Project Setup (Week 1)
- [ ] Create Spring Boot project with Maven
- [ ] Configure pom.xml with dependencies
- [ ] Set up application.yml configuration
- [ ] Configure CORS for Next.js frontend
- [ ] Set up PostgreSQL connection (Supabase)
- [ ] Create base project structure

### Phase 2: Authentication (Week 1-2)
- [ ] Implement User entity and repository
- [ ] Configure Spring Security
- [ ] Implement JWT token provider
- [ ] Create login/register endpoints
- [ ] Add role-based access control
- [ ] Test authentication flow

### Phase 3: Database Models (Week 2)
- [ ] Create Order, OrderItem, StatusHistory entities
- [ ] Set up JPA repositories
- [ ] Create print sizes reference data
- [ ] Add database indexes for performance

### Phase 4: Order Management (Week 2-3)
- [ ] Create order endpoints (public)
- [ ] Implement order creation with items
- [ ] Add order tracking endpoint
- [ ] Implement ToyyibPay bill creation
- [ ] Implement webhook callback handler
- [ ] Add order status updates

### Phase 5: Admin Features (Week 3)
- [ ] Create admin endpoints
- [ ] Implement order filtering/pagination
- [ ] Build stats/analytics endpoints
- [ ] Add status update with validation
- [ ] Add tracking number management

### Phase 5b: Product Management (Week 3)
- [ ] Create `product_meta` table and run seed SQL
- [ ] Implement `PrintSizeController` (CRUD, toggle active)
- [ ] Implement `ProductMetaController` (metadata CRUD)
- [ ] Image upload endpoint → Supabase Storage → append URL to `images` JSONB
- [ ] Image reorder + delete endpoints
- [ ] TikTok video add / remove endpoints
- [ ] Product analytics endpoint (sales by size, revenue)
- [ ] Update Next.js `/api/products` to call Spring Boot instead of reading `products-meta.json`

### Phase 6: File Storage (Week 3-4)
- [ ] Integrate Supabase Storage
- [ ] Implement image upload
- [ ] Create ZIP download for orders
- [ ] Add image deletion

### Phase 7: Super Admin System Features (Week 4)
- [ ] Storage usage endpoint
- [ ] Database health endpoint
- [ ] Payment cost tracking
- [ ] Server metrics endpoint

### Phase 8: Frontend Integration (Week 4)
- [ ] Update Next.js to call Spring Boot
- [ ] Update environment variables
- [ ] Test end-to-end flow
- [ ] Fix any integration issues

### Phase 9: Testing & Deployment (Week 5)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Deploy to production
- [ ] Configure CI/CD
- [ ] Monitor and fix issues

---

## Summary

This architecture document provides a complete blueprint for building the Polaroid Glossy backend with:

- ✅ **5 User Roles** with granular permissions
- ✅ **Supabase** for database and storage
- ✅ **JWT Authentication** with Spring Security
- ✅ **ToyyibPay** payment integration
- ✅ **Admin features** (stats, order management)
- ✅ **Super Admin features** (storage, database health, payment costs, server metrics)
- ✅ **Role-based access control** at every level
- ✅ **Product Management** — two-layer system (print sizes for pricing, product_meta for marketing content, images, TikTok)

---

## Quick Reference - Role Summary

| Role | Description |
|------|-------------|
| **CUSTOMER** | Place orders, view own orders |
| **AFFILIATE** | View only their referred orders |
| **PACKER** | Update status to POSTED/DELIVERED, download images |
| **MARKETING** | View all orders, update status, download images (no financials) |
| **ADMIN** | Full access including system health, storage, payment costs |
