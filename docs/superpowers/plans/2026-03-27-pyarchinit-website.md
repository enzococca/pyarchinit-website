# pyArchInit Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern Next.js website for pyArchInit with animated landing page, custom CMS admin, and integrated LMS.

**Architecture:** Next.js 14 App Router monorepo with route groups for public site, admin CMS, LMS, and animated landing. PostgreSQL via Prisma ORM. Custom admin panel with block-based page editor, drag-and-drop, and Tiptap rich text. Canvas 2D animated landing page. Stripe + PayPal payments for courses.

**Tech Stack:** Next.js 14, React 18, TypeScript, PostgreSQL, Prisma, NextAuth.js, Tiptap, @dnd-kit, Sharp, Stripe, Canvas 2D API, Docker Compose, Tailwind CSS

---

## Phase 1: Foundation (Scaffolding, DB, Auth, Docker)

### Task 1.1: Next.js Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `app/layout.tsx`
- Create: `app/(public)/layout.tsx`
- Create: `app/(public)/page.tsx`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-code-block-lowlight
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install sharp stripe @paypal/react-paypal-js
npm install lucide-react clsx tailwind-merge
npm install -D @types/node
```

- [ ] **Step 3: Create `.env.example`**

```env
DATABASE_URL="postgresql://pyarchinit:pyarchinit@localhost:5432/pyarchinit"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
BUNNY_API_KEY=""
BUNNY_LIBRARY_ID=""
BUNNY_CDN_HOSTNAME=""
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
ADMIN_EMAIL=""
```

- [ ] **Step 4: Configure Tailwind with custom theme**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0F1729",
        sand: "#E8DCC8",
        teal: "#00D4AA",
        terracotta: "#D4712A",
        ochre: "#8B7355",
        "code-bg": "#1A1E2E",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Create root layout with fonts**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "pyArchInit - Piattaforma Open Source per l'Archeologia",
  description: "Piattaforma open source per la gestione dei dati archeologici. Corsi, documentazione e strumenti per l'archeologia digitale.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans bg-primary text-sand antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Create globals.css**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  ::selection {
    background-color: rgba(0, 212, 170, 0.3);
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #0F1729;
  }

  ::-webkit-scrollbar-thumb {
    background: #8B7355;
    border-radius: 4px;
  }
}
```

- [ ] **Step 7: Create placeholder public page**

```tsx
// app/(public)/layout.tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

```tsx
// app/(public)/page.tsx
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-mono text-teal">pyArchInit</h1>
    </main>
  );
}
```

- [ ] **Step 8: Verify dev server runs**

```bash
npm run dev
```

Expected: Server starts at localhost:3000, shows "pyArchInit" in teal on dark background.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 14 project with Tailwind and dependencies"
```

---

### Task 1.2: Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init
```

- [ ] **Step 2: Write complete Prisma schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ AUTH ============

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?
  image         String?
  role          UserRole  @default(STUDENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  enrollments   Enrollment[]
  lessonProgress LessonProgress[]
}

enum UserRole {
  ADMIN
  STUDENT
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ============ CMS PAGES ============

model Page {
  id        String     @id @default(cuid())
  title     String
  slug      String     @unique
  blocks    Json       @default("[]")
  status    PageStatus @default(DRAFT)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

enum PageStatus {
  DRAFT
  PUBLISHED
}

// ============ MEDIA ============

model Media {
  id        String   @id @default(cuid())
  filename  String
  path      String
  mimeType  String
  size      Int
  width     Int?
  height    Int?
  alt       String?
  folder    String   @default("/")
  createdAt DateTime @default(now())
}

// ============ BLOG ============

model BlogPost {
  id          String         @id @default(cuid())
  title       String
  slug        String         @unique
  excerpt     String?
  blocks      Json           @default("[]")
  coverImage  String?
  status      BlogPostStatus @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  categories  BlogCategory[]
  tags        BlogTag[]
}

enum BlogPostStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
}

model BlogCategory {
  id    String     @id @default(cuid())
  name  String     @unique
  slug  String     @unique
  posts BlogPost[]
}

model BlogTag {
  id    String     @id @default(cuid())
  name  String     @unique
  slug  String     @unique
  posts BlogPost[]
}

// ============ COURSES / LMS ============

model Course {
  id          String       @id @default(cuid())
  title       String
  slug        String       @unique
  description String       @db.Text
  coverImage  String?
  price       Float
  level       CourseLevel
  category    String
  status      CourseStatus  @default(DRAFT)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  modules     Module[]
  enrollments Enrollment[]
}

enum CourseLevel {
  BASE
  INTERMEDIO
  AVANZATO
}

enum CourseStatus {
  DRAFT
  PUBLISHED
}

model Module {
  id       String   @id @default(cuid())
  title    String
  order    Int
  courseId String

  course   Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons  Lesson[]

  @@index([courseId])
}

model Lesson {
  id          String     @id @default(cuid())
  title       String
  type        LessonType
  content     Json
  duration    Int?       // minutes
  order       Int
  moduleId    String
  isFree      Boolean    @default(false)

  module      Module     @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress    LessonProgress[]

  @@index([moduleId])
}

enum LessonType {
  VIDEO
  TEXT
  QUIZ
  EXERCISE
}

model Enrollment {
  id        String           @id @default(cuid())
  userId    String
  courseId   String
  status    EnrollmentStatus @default(ACTIVE)
  paymentId String?
  createdAt DateTime         @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  REFUNDED
}

model LessonProgress {
  id          String   @id @default(cuid())
  userId      String
  lessonId    String
  completed   Boolean  @default(false)
  completedAt DateTime?
  quizScore   Float?

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
}

// ============ DOCUMENTATION ============

model DocSection {
  id       String @id @default(cuid())
  title    String
  slug     String @unique
  order    Int
  parentId String?

  parent   DocSection?  @relation("DocTree", fields: [parentId], references: [id])
  children DocSection[] @relation("DocTree")
  pages    DocPage[]
}

model DocPage {
  id        String       @id @default(cuid())
  title     String
  slug      String       @unique
  content   String       @db.Text
  order     Int
  sectionId String
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  section   DocSection   @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  versions  DocVersion[]
}

model DocVersion {
  id        String   @id @default(cuid())
  content   String   @db.Text
  pageId    String
  createdAt DateTime @default(now())

  page DocPage @relation(fields: [pageId], references: [id], onDelete: Cascade)
}

// ============ CONTACTS ============

model Contact {
  id        String        @id @default(cuid())
  name      String
  email     String
  type      String
  message   String        @db.Text
  status    ContactStatus @default(NEW)
  createdAt DateTime      @default(now())
}

enum ContactStatus {
  NEW
  READ
  REPLIED
}

// ============ SITE SETTINGS ============

model SiteSetting {
  key   String @id
  value Json
}

// ============ TESTIMONIALS ============

model Testimonial {
  id       String  @id @default(cuid())
  name     String
  role     String
  entity   String
  quote    String  @db.Text
  image    String?
  order    Int     @default(0)
  visible  Boolean @default(true)
}
```

- [ ] **Step 3: Create Prisma client singleton**

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Generate Prisma client and push schema**

```bash
cp .env.example .env
# Edit .env with actual DATABASE_URL
npx prisma generate
npx prisma db push
```

Expected: Schema pushed to PostgreSQL, client generated without errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma lib/db.ts .env.example
git commit -m "feat: add Prisma schema with all models (auth, CMS, LMS, docs, contacts)"
```

---

### Task 1.3: NextAuth.js Setup

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `lib/auth-utils.ts`

- [ ] **Step 1: Write auth configuration**

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});
```

- [ ] **Step 2: Install bcryptjs**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 3: Create auth route handler**

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Create auth utility helpers**

```typescript
// lib/auth-utils.ts
import { auth } from "./auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/admin/login");
  }
  return session;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function getSession() {
  return await auth();
}
```

- [ ] **Step 5: Verify auth compiles**

```bash
npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts lib/auth-utils.ts app/api/auth/
git commit -m "feat: configure NextAuth.js with credentials provider and admin guard"
```

---

### Task 1.4: Admin Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Create seed script with admin user**

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@pyarchinit.org" },
    update: {},
    create: {
      email: "admin@pyarchinit.org",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  // Default site settings
  const defaults = [
    { key: "site_name", value: JSON.stringify("pyArchInit") },
    { key: "site_description", value: JSON.stringify("Piattaforma Open Source per l'Archeologia") },
    { key: "social_github", value: JSON.stringify("https://github.com/pyarchinit") },
  ];

  for (const setting of defaults) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log("Seed completed: admin user + default settings");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add seed config to package.json**

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

```bash
npm install -D tsx
```

- [ ] **Step 3: Run seed**

```bash
npx prisma db seed
```

Expected: "Seed completed: admin user + default settings"

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed script with admin user and default site settings"
```

---

### Task 1.5: Docker Compose

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`
- Create: `nginx/nginx.conf`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: pyarchinit
      POSTGRES_PASSWORD: pyarchinit
      POSTGRES_DB: pyarchinit
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://pyarchinit:pyarchinit@db:5432/pyarchinit
    env_file:
      - .env
    depends_on:
      - db
    volumes:
      - uploads:/app/uploads
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - uploads:/app/uploads:ro
    depends_on:
      - app

volumes:
  pgdata:
  uploads:
```

- [ ] **Step 3: Create nginx config**

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;

    upstream nextjs {
        server app:3000;
    }

    server {
        listen 80;
        server_name _;

        client_max_body_size 100M;

        location /uploads/ {
            alias /app/uploads/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

- [ ] **Step 4: Create .dockerignore**

```
node_modules
.next
.env
.git
uploads
```

- [ ] **Step 5: Add standalone output to next.config.ts**

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.b-cdn.net" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 6: Test Docker Compose locally (db only for dev)**

```bash
docker compose up db -d
```

Expected: PostgreSQL running on port 5432.

- [ ] **Step 7: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore nginx/ next.config.ts
git commit -m "feat: add Docker Compose setup with PostgreSQL, Next.js, and Nginx"
```

---

## Phase 2: CMS Admin Panel

### Task 2.1: Admin Layout and Login

**Files:**
- Create: `app/(admin)/admin/layout.tsx`
- Create: `app/(admin)/admin/login/page.tsx`
- Create: `app/(admin)/admin/login/actions.ts`
- Create: `app/(admin)/admin/page.tsx`
- Create: `components/admin/sidebar.tsx`
- Create: `components/admin/topbar.tsx`

- [ ] **Step 1: Create admin login page**

```tsx
// app/(admin)/admin/login/page.tsx
"use client";

import { useState } from "react";
import { loginAction } from "./actions";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="bg-code-bg rounded-card p-8 w-full max-w-sm">
        <h1 className="text-2xl font-mono text-teal mb-6 text-center">pyArchInit Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full bg-primary border border-ochre/30 rounded-lg px-4 py-3 text-sand placeholder:text-ochre/50 focus:border-teal focus:outline-none"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full bg-primary border border-ochre/30 rounded-lg px-4 py-3 text-sand placeholder:text-ochre/50 focus:border-teal focus:outline-none"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal text-primary font-mono font-bold py-3 rounded-full hover:bg-teal/90 transition disabled:opacity-50"
          >
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create login server action**

```typescript
// app/(admin)/admin/login/actions.ts
"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch {
    return { error: "Credenziali non valide" };
  }
  redirect("/admin");
}
```

- [ ] **Step 3: Create admin sidebar**

```tsx
// components/admin/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, GraduationCap, PenSquare,
  ImageIcon, BookOpen, Users, Mail, Settings,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pagine", label: "Pagine", icon: FileText },
  { href: "/admin/corsi", label: "Corsi", icon: GraduationCap },
  { href: "/admin/blog", label: "Blog", icon: PenSquare },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/docs", label: "Documentazione", icon: BookOpen },
  { href: "/admin/studenti", label: "Studenti", icon: Users },
  { href: "/admin/contatti", label: "Contatti", icon: Mail },
  { href: "/admin/impostazioni", label: "Impostazioni", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-code-bg min-h-screen p-4 flex flex-col">
      <Link href="/admin" className="text-teal font-mono text-xl font-bold mb-8 px-3">
        pyArchInit
      </Link>
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                isActive
                  ? "bg-teal/10 text-teal"
                  : "text-sand/70 hover:text-sand hover:bg-white/5"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 4: Create admin topbar**

```tsx
// components/admin/topbar.tsx
import { auth, signOut } from "@/lib/auth";
import { LogOut } from "lucide-react";

export async function AdminTopbar() {
  const session = await auth();

  return (
    <header className="h-14 bg-code-bg/50 border-b border-ochre/10 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-sand/60">{session?.user?.email}</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <button className="text-sand/40 hover:text-sand transition">
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Create admin layout with auth guard**

```tsx
// app/(admin)/admin/layout.tsx
import { requireAdmin } from "@/lib/auth-utils";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminTopbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create admin dashboard page**

```tsx
// app/(admin)/admin/page.tsx
import { prisma } from "@/lib/db";

async function getStats() {
  const [students, courses, contacts, posts] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.enrollment.count({ where: { createdAt: { gte: new Date(new Date().setDate(1)) } } }),
    prisma.contact.count({ where: { status: "NEW" } }),
    prisma.blogPost.count({ where: { status: "DRAFT" } }),
  ]);
  return { students, courses, contacts, posts };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Studenti attivi", value: stats.students, color: "text-teal" },
    { label: "Iscrizioni mese", value: stats.courses, color: "text-terracotta" },
    { label: "Nuovi contatti", value: stats.contacts, color: "text-ochre" },
    { label: "Bozze blog", value: stats.posts, color: "text-sand" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-mono text-teal mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-code-bg rounded-card p-6">
            <p className="text-sand/50 text-sm">{card.label}</p>
            <p className={`text-3xl font-mono mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify admin login flow**

```bash
npm run dev
```

Navigate to `localhost:3000/admin` — should redirect to login.
Login with `admin@pyarchinit.org` / `admin123` — should show dashboard with stats.

- [ ] **Step 8: Commit**

```bash
git add app/(admin)/ components/admin/
git commit -m "feat: add admin layout with login, sidebar, topbar, and dashboard"
```

---

### Task 2.2: Media Library

**Files:**
- Create: `app/api/media/upload/route.ts`
- Create: `app/api/media/route.ts`
- Create: `app/(admin)/admin/media/page.tsx`
- Create: `components/admin/media-grid.tsx`
- Create: `components/admin/media-upload.tsx`
- Create: `components/admin/media-picker.tsx`
- Create: `lib/media.ts`

- [ ] **Step 1: Create media upload utility**

```typescript
// lib/media.ts
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "./db";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function processAndSaveMedia(file: File, folder: string = "/") {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const isImage = file.type.startsWith("image/");

  let finalBuffer = buffer;
  let width: number | undefined;
  let height: number | undefined;

  if (isImage && file.type !== "image/svg+xml") {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    width = metadata.width;
    height = metadata.height;

    // Resize if larger than 2000px
    if (width && width > 2000) {
      finalBuffer = await image.resize(2000, null, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    } else {
      finalBuffer = await image.webp({ quality: 85 }).toBuffer();
    }
  }

  const folderPath = path.join(UPLOAD_DIR, folder);
  await mkdir(folderPath, { recursive: true });

  const ext = isImage && file.type !== "image/svg+xml" ? ".webp" : path.extname(file.name);
  const savedFilename = filename.replace(path.extname(filename), ext);
  const filePath = path.join(folderPath, savedFilename);

  await writeFile(filePath, finalBuffer);

  const media = await prisma.media.create({
    data: {
      filename: savedFilename,
      path: `/uploads${folder === "/" ? "/" : folder + "/"}${savedFilename}`,
      mimeType: isImage ? "image/webp" : file.type,
      size: finalBuffer.length,
      width,
      height,
      folder,
    },
  });

  return media;
}
```

- [ ] **Step 2: Create upload API route**

```typescript
// app/api/media/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { processAndSaveMedia } from "@/lib/media";

export async function POST(req: NextRequest) {
  await requireAdmin();

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const folder = (formData.get("folder") as string) || "/";

  if (!files.length) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const results = await Promise.all(
    files.map((file) => processAndSaveMedia(file, folder))
  );

  return NextResponse.json(results);
}
```

- [ ] **Step 3: Create media list API route**

```typescript
// app/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  await requireAdmin();

  const folder = req.nextUrl.searchParams.get("folder") || undefined;

  const media = await prisma.media.findMany({
    where: folder ? { folder } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(media);
}
```

- [ ] **Step 4: Create media upload component**

```tsx
// components/admin/media-upload.tsx
"use client";

import { useState, useCallback } from "react";
import { Upload } from "lucide-react";

interface MediaUploadProps {
  folder: string;
  onUploadComplete: () => void;
}

export function MediaUpload({ folder, onUploadComplete }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = useCallback(
    async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const files = "dataTransfer" in e ? e.dataTransfer.files : e.target.files;
      if (!files?.length) return;

      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));
      formData.append("folder", folder);

      const res = await fetch("/api/media/upload", { method: "POST", body: formData });

      if (res.ok) {
        setProgress(100);
        onUploadComplete();
      }

      setUploading(false);
    },
    [folder, onUploadComplete]
  );

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="border-2 border-dashed border-ochre/30 rounded-card p-8 text-center hover:border-teal/50 transition cursor-pointer"
    >
      <input
        type="file"
        multiple
        onChange={handleDrop}
        className="hidden"
        id="media-upload"
      />
      <label htmlFor="media-upload" className="cursor-pointer">
        <Upload className="mx-auto mb-2 text-ochre/50" size={32} />
        <p className="text-sand/50 text-sm">
          {uploading ? `Caricamento... ${progress}%` : "Trascina file qui o clicca per caricare"}
        </p>
      </label>
    </div>
  );
}
```

- [ ] **Step 5: Create media grid component**

```tsx
// components/admin/media-grid.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { MediaUpload } from "./media-upload";

interface MediaItem {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export function MediaGrid() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [folder, setFolder] = useState("/");

  const loadMedia = useCallback(async () => {
    const res = await fetch(`/api/media?folder=${folder}`);
    if (res.ok) setMedia(await res.json());
  }, [folder]);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  return (
    <div className="space-y-6">
      <MediaUpload folder={folder} onUploadComplete={loadMedia} />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {media.map((item) => (
          <div
            key={item.id}
            className="bg-code-bg rounded-card overflow-hidden group"
          >
            {item.mimeType.startsWith("image/") ? (
              <div className="aspect-square relative">
                <Image
                  src={item.path}
                  alt={item.filename}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center text-ochre/50">
                <span className="text-xs">{item.mimeType}</span>
              </div>
            )}
            <div className="p-2">
              <p className="text-xs text-sand/60 truncate">{item.filename}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create media picker (reusable modal for editors)**

```tsx
// components/admin/media-picker.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { MediaUpload } from "./media-upload";

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

interface MediaItem {
  id: string;
  path: string;
  filename: string;
  mimeType: string;
}

export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);

  const loadMedia = useCallback(async () => {
    const res = await fetch("/api/media");
    if (res.ok) setMedia(await res.json());
  }, []);

  useEffect(() => {
    if (open) loadMedia();
  }, [open, loadMedia]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-primary rounded-card w-full max-w-4xl max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono text-teal">Seleziona media</h2>
          <button onClick={onClose} className="text-sand/40 hover:text-sand">
            <X size={20} />
          </button>
        </div>
        <MediaUpload folder="/" onUploadComplete={loadMedia} />
        <div className="grid grid-cols-4 gap-3 mt-4">
          {media
            .filter((m) => m.mimeType.startsWith("image/"))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => { onSelect(item.path); onClose(); }}
                className="aspect-square relative rounded-lg overflow-hidden ring-2 ring-transparent hover:ring-teal transition"
              >
                <Image src={item.path} alt={item.filename} fill className="object-cover" />
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create media admin page**

```tsx
// app/(admin)/admin/media/page.tsx
import { MediaGrid } from "@/components/admin/media-grid";

export default function AdminMediaPage() {
  return (
    <div>
      <h1 className="text-2xl font-mono text-teal mb-6">Media</h1>
      <MediaGrid />
    </div>
  );
}
```

- [ ] **Step 8: Verify media upload flow**

```bash
npm run dev
```

Navigate to `/admin/media`, upload an image, verify it appears in grid.

- [ ] **Step 9: Commit**

```bash
git add lib/media.ts app/api/media/ app/(admin)/admin/media/ components/admin/media-grid.tsx components/admin/media-upload.tsx components/admin/media-picker.tsx
git commit -m "feat: add media library with upload, optimization, grid, and picker"
```

---

### Task 2.3: Block-Based Page Editor

**Files:**
- Create: `app/(admin)/admin/pagine/page.tsx`
- Create: `app/(admin)/admin/pagine/[id]/page.tsx`
- Create: `app/api/pages/route.ts`
- Create: `app/api/pages/[id]/route.ts`
- Create: `components/admin/block-editor.tsx`
- Create: `components/admin/blocks/text-block.tsx`
- Create: `components/admin/blocks/image-block.tsx`
- Create: `components/admin/blocks/hero-block.tsx`
- Create: `components/admin/blocks/cta-block.tsx`
- Create: `components/admin/blocks/grid-block.tsx`
- Create: `components/admin/blocks/video-block.tsx`
- Create: `components/admin/blocks/code-block.tsx`
- Create: `lib/blocks.ts`

- [ ] **Step 1: Define block types**

```typescript
// lib/blocks.ts
export type BlockType = "text" | "image" | "hero" | "cta" | "grid" | "video" | "code";

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, any>;
}

export interface TextBlockData {
  content: string; // HTML from Tiptap
}

export interface ImageBlockData {
  src: string;
  alt: string;
  caption?: string;
}

export interface HeroBlockData {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  cta?: { label: string; href: string };
}

export interface CtaBlockData {
  title: string;
  description: string;
  buttons: { label: string; href: string; variant: "primary" | "outline" }[];
}

export interface GridBlockData {
  columns: number;
  items: { title: string; description: string; icon?: string; image?: string; href?: string }[];
}

export interface VideoBlockData {
  url: string;
  caption?: string;
}

export interface CodeBlockData {
  code: string;
  language: string;
}

export const blockLabels: Record<BlockType, string> = {
  text: "Testo",
  image: "Immagine",
  hero: "Hero",
  cta: "Call to Action",
  grid: "Griglia",
  video: "Video",
  code: "Codice",
};

export function createEmptyBlock(type: BlockType): Block {
  const id = crypto.randomUUID();
  const defaults: Record<BlockType, Record<string, any>> = {
    text: { content: "" },
    image: { src: "", alt: "" },
    hero: { title: "", subtitle: "" },
    cta: { title: "", description: "", buttons: [] },
    grid: { columns: 3, items: [] },
    video: { url: "", caption: "" },
    code: { code: "", language: "python" },
  };
  return { id, type, data: defaults[type] };
}
```

- [ ] **Step 2: Create individual block editor components**

```tsx
// components/admin/blocks/text-block.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface Props {
  data: { content: string };
  onChange: (data: { content: string }) => void;
}

export function TextBlockEditor({ data, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: data.content,
    onUpdate: ({ editor }) => {
      onChange({ content: editor.getHTML() });
    },
  });

  return (
    <div className="border border-ochre/20 rounded-lg overflow-hidden">
      <EditorContent editor={editor} className="prose prose-invert max-w-none p-4 min-h-[120px]" />
    </div>
  );
}
```

```tsx
// components/admin/blocks/image-block.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaPicker } from "../media-picker";
import { ImageIcon } from "lucide-react";

interface Props {
  data: { src: string; alt: string; caption?: string };
  onChange: (data: { src: string; alt: string; caption?: string }) => void;
}

export function ImageBlockEditor({ data, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-3">
      {data.src ? (
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <Image src={data.src} alt={data.alt} fill className="object-cover" />
          <button
            onClick={() => setPickerOpen(true)}
            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition flex items-center justify-center text-sand"
          >
            Cambia immagine
          </button>
        </div>
      ) : (
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full aspect-video bg-code-bg rounded-lg flex flex-col items-center justify-center text-ochre/50 hover:text-teal transition"
        >
          <ImageIcon size={32} />
          <span className="text-sm mt-2">Seleziona immagine</span>
        </button>
      )}
      <input
        value={data.alt}
        onChange={(e) => onChange({ ...data, alt: e.target.value })}
        placeholder="Testo alternativo"
        className="w-full bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sm text-sand"
      />
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(path) => onChange({ ...data, src: path })}
      />
    </div>
  );
}
```

```tsx
// components/admin/blocks/hero-block.tsx
"use client";

import { useState } from "react";
import { MediaPicker } from "../media-picker";

interface Props {
  data: { title: string; subtitle: string; backgroundImage?: string; cta?: { label: string; href: string } };
  onChange: (data: Props["data"]) => void;
}

export function HeroBlockEditor({ data, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-3">
      <input
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Titolo hero"
        className="w-full bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand font-mono text-lg"
      />
      <input
        value={data.subtitle}
        onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
        placeholder="Sottotitolo"
        className="w-full bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
      />
      <div className="flex gap-3">
        <input
          value={data.cta?.label || ""}
          onChange={(e) => onChange({ ...data, cta: { label: e.target.value, href: data.cta?.href || "" } })}
          placeholder="Testo bottone"
          className="flex-1 bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
        />
        <input
          value={data.cta?.href || ""}
          onChange={(e) => onChange({ ...data, cta: { label: data.cta?.label || "", href: e.target.value } })}
          placeholder="/link"
          className="flex-1 bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
        />
      </div>
      <button
        onClick={() => setPickerOpen(true)}
        className="text-sm text-teal hover:underline"
      >
        {data.backgroundImage ? "Cambia sfondo" : "Aggiungi sfondo"}
      </button>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(path) => onChange({ ...data, backgroundImage: path })}
      />
    </div>
  );
}
```

```tsx
// components/admin/blocks/cta-block.tsx
"use client";

interface Props {
  data: { title: string; description: string; buttons: { label: string; href: string; variant: "primary" | "outline" }[] };
  onChange: (data: Props["data"]) => void;
}

export function CtaBlockEditor({ data, onChange }: Props) {
  const addButton = () => {
    onChange({ ...data, buttons: [...data.buttons, { label: "", href: "", variant: "primary" }] });
  };

  const updateButton = (index: number, field: string, value: string) => {
    const buttons = [...data.buttons];
    buttons[index] = { ...buttons[index], [field]: value };
    onChange({ ...data, buttons });
  };

  return (
    <div className="space-y-3">
      <input
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Titolo CTA"
        className="w-full bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand font-mono"
      />
      <textarea
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        placeholder="Descrizione"
        rows={2}
        className="w-full bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
      />
      {data.buttons.map((btn, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={btn.label}
            onChange={(e) => updateButton(i, "label", e.target.value)}
            placeholder="Testo"
            className="flex-1 bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
          />
          <input
            value={btn.href}
            onChange={(e) => updateButton(i, "href", e.target.value)}
            placeholder="/link"
            className="flex-1 bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
          />
          <select
            value={btn.variant}
            onChange={(e) => updateButton(i, "variant", e.target.value)}
            className="bg-primary border border-ochre/20 rounded-lg px-2 text-sand text-sm"
          >
            <option value="primary">Primario</option>
            <option value="outline">Outline</option>
          </select>
        </div>
      ))}
      <button onClick={addButton} className="text-sm text-teal hover:underline">
        + Aggiungi bottone
      </button>
    </div>
  );
}
```

```tsx
// components/admin/blocks/grid-block.tsx
"use client";

interface GridItem {
  title: string;
  description: string;
  icon?: string;
  image?: string;
  href?: string;
}

interface Props {
  data: { columns: number; items: GridItem[] };
  onChange: (data: Props["data"]) => void;
}

export function GridBlockEditor({ data, onChange }: Props) {
  const addItem = () => {
    onChange({ ...data, items: [...data.items, { title: "", description: "" }] });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const items = [...data.items];
    items[index] = { ...items[index], [field]: value };
    onChange({ ...data, items });
  };

  return (
    <div className="space-y-3">
      <select
        value={data.columns}
        onChange={(e) => onChange({ ...data, columns: Number(e.target.value) })}
        className="bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
      >
        <option value={2}>2 colonne</option>
        <option value={3}>3 colonne</option>
        <option value={4}>4 colonne</option>
      </select>
      {data.items.map((item, i) => (
        <div key={i} className="bg-primary/50 rounded-lg p-3 space-y-2">
          <input
            value={item.title}
            onChange={(e) => updateItem(i, "title", e.target.value)}
            placeholder="Titolo"
            className="w-full bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
          />
          <textarea
            value={item.description}
            onChange={(e) => updateItem(i, "description", e.target.value)}
            placeholder="Descrizione"
            rows={2}
            className="w-full bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
          />
        </div>
      ))}
      <button onClick={addItem} className="text-sm text-teal hover:underline">
        + Aggiungi elemento
      </button>
    </div>
  );
}
```

```tsx
// components/admin/blocks/video-block.tsx
"use client";

interface Props {
  data: { url: string; caption?: string };
  onChange: (data: Props["data"]) => void;
}

export function VideoBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <input
        value={data.url}
        onChange={(e) => onChange({ ...data, url: e.target.value })}
        placeholder="URL video (YouTube, Bunny.net, ecc.)"
        className="w-full bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
      />
      <input
        value={data.caption || ""}
        onChange={(e) => onChange({ ...data, caption: e.target.value })}
        placeholder="Didascalia (opzionale)"
        className="w-full bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
      />
    </div>
  );
}
```

```tsx
// components/admin/blocks/code-block.tsx
"use client";

interface Props {
  data: { code: string; language: string };
  onChange: (data: Props["data"]) => void;
}

export function CodeBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <select
        value={data.language}
        onChange={(e) => onChange({ ...data, language: e.target.value })}
        className="bg-primary border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
      >
        <option value="python">Python</option>
        <option value="sql">SQL</option>
        <option value="bash">Bash</option>
        <option value="javascript">JavaScript</option>
      </select>
      <textarea
        value={data.code}
        onChange={(e) => onChange({ ...data, code: e.target.value })}
        rows={8}
        className="w-full bg-code-bg border border-ochre/20 rounded-lg px-4 py-3 text-teal font-mono text-sm"
        spellCheck={false}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create main block editor with drag-and-drop**

```tsx
// components/admin/block-editor.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Block, BlockType, blockLabels, createEmptyBlock } from "@/lib/blocks";
import { TextBlockEditor } from "./blocks/text-block";
import { ImageBlockEditor } from "./blocks/image-block";
import { HeroBlockEditor } from "./blocks/hero-block";
import { CtaBlockEditor } from "./blocks/cta-block";
import { GridBlockEditor } from "./blocks/grid-block";
import { VideoBlockEditor } from "./blocks/video-block";
import { CodeBlockEditor } from "./blocks/code-block";

const blockEditors: Record<BlockType, React.ComponentType<any>> = {
  text: TextBlockEditor,
  image: ImageBlockEditor,
  hero: HeroBlockEditor,
  cta: CtaBlockEditor,
  grid: GridBlockEditor,
  video: VideoBlockEditor,
  code: CodeBlockEditor,
};

function SortableBlock({
  block,
  onUpdate,
  onRemove,
}: {
  block: Block;
  onUpdate: (data: Record<string, any>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Editor = blockEditors[block.type];

  return (
    <div ref={setNodeRef} style={style} className="bg-code-bg rounded-card p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <button {...attributes} {...listeners} className="text-ochre/40 hover:text-ochre cursor-grab">
          <GripVertical size={16} />
        </button>
        <span className="text-xs font-mono text-teal/60 uppercase">{blockLabels[block.type]}</span>
        <div className="flex-1" />
        <button onClick={onRemove} className="text-red-400/40 hover:text-red-400">
          <Trash2 size={14} />
        </button>
      </div>
      <Editor data={block.data} onChange={onUpdate} />
    </div>
  );
}

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [showMenu, setShowMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const addBlock = (type: BlockType) => {
    onChange([...blocks, createEmptyBlock(type)]);
    setShowMenu(false);
  };

  const updateBlock = (id: string, data: Record<string, any>) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, data } : b)));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              onUpdate={(data) => updateBlock(block.id, data)}
              onRemove={() => removeBlock(block.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-full border-2 border-dashed border-ochre/20 rounded-card py-4 text-ochre/40 hover:border-teal/40 hover:text-teal transition flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Aggiungi blocco
        </button>
        {showMenu && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-code-bg rounded-card p-2 grid grid-cols-4 gap-2 z-10 shadow-xl">
            {(Object.keys(blockLabels) as BlockType[]).map((type) => (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="py-3 rounded-lg text-sm text-sand/70 hover:bg-teal/10 hover:text-teal transition"
              >
                {blockLabels[type]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create pages API routes**

```typescript
// app/api/pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET() {
  await requireAdmin();
  const pages = await prisma.page.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const { title, slug } = await req.json();
  const page = await prisma.page.create({
    data: { title, slug, blocks: [] },
  });
  return NextResponse.json(page);
}
```

```typescript
// app/api/pages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const page = await prisma.page.findUnique({ where: { id: params.id } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const data = await req.json();
  const page = await prisma.page.update({
    where: { id: params.id },
    data: {
      title: data.title,
      slug: data.slug,
      blocks: data.blocks,
      status: data.status,
    },
  });
  return NextResponse.json(page);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  await prisma.page.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Create pages list admin page**

```tsx
// app/(admin)/admin/pagine/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageItem[]>([]);

  useEffect(() => {
    fetch("/api/pages").then((r) => r.json()).then(setPages);
  }, []);

  const createPage = async () => {
    const title = prompt("Titolo della pagina:");
    if (!title) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug }),
    });
    if (res.ok) {
      const page = await res.json();
      window.location.href = `/admin/pagine/${page.id}`;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Pagine</h1>
        <button
          onClick={createPage}
          className="bg-teal text-primary font-mono text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2"
        >
          <Plus size={16} /> Nuova pagina
        </button>
      </div>
      <div className="space-y-2">
        {pages.map((page) => (
          <Link
            key={page.id}
            href={`/admin/pagine/${page.id}`}
            className="block bg-code-bg rounded-card p-4 hover:ring-1 hover:ring-teal/30 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sand font-medium">{page.title}</h2>
                <p className="text-sand/40 text-sm">/{page.slug}</p>
              </div>
              <span className={`text-xs font-mono px-2 py-1 rounded ${page.status === "PUBLISHED" ? "bg-teal/10 text-teal" : "bg-ochre/10 text-ochre"}`}>
                {page.status === "PUBLISHED" ? "Pubblicato" : "Bozza"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create page editor with autosave**

```tsx
// app/(admin)/admin/pagine/[id]/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { BlockEditor } from "@/components/admin/block-editor";
import { Block } from "@/lib/blocks";
import { Save, Eye } from "lucide-react";

export default function PageEditorPage() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [status, setStatus] = useState("DRAFT");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autosaveTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetch(`/api/pages/${id}`)
      .then((r) => r.json())
      .then((page) => {
        setTitle(page.title);
        setSlug(page.slug);
        setBlocks(page.blocks || []);
        setStatus(page.status);
      });
  }, [id]);

  const save = useCallback(async () => {
    setSaving(true);
    await fetch(`/api/pages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, blocks, status }),
    });
    setSaving(false);
    setLastSaved(new Date());
  }, [id, title, slug, blocks, status]);

  // Autosave every 30 seconds
  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(save, 30000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [blocks, title, slug, save]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-mono text-teal bg-transparent border-none outline-none flex-1"
          placeholder="Titolo pagina"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-code-bg border border-ochre/20 rounded-lg px-3 py-2 text-sand text-sm"
        >
          <option value="DRAFT">Bozza</option>
          <option value="PUBLISHED">Pubblicato</option>
        </select>
        <button
          onClick={save}
          disabled={saving}
          className="bg-teal text-primary font-mono text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2"
        >
          <Save size={14} /> {saving ? "Salvo..." : "Salva"}
        </button>
      </div>

      <div className="mb-4">
        <label className="text-sand/40 text-xs">Slug:</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="ml-2 bg-transparent border-b border-ochre/20 text-sand text-sm outline-none"
        />
      </div>

      {lastSaved && (
        <p className="text-sand/30 text-xs mb-4">
          Ultimo salvataggio: {lastSaved.toLocaleTimeString("it-IT")}
        </p>
      )}

      <BlockEditor blocks={blocks} onChange={setBlocks} />
    </div>
  );
}
```

- [ ] **Step 7: Verify page editor**

```bash
npm run dev
```

Navigate to `/admin/pagine`, create a new page, add blocks, drag to reorder, verify autosave.

- [ ] **Step 8: Commit**

```bash
git add lib/blocks.ts components/admin/blocks/ components/admin/block-editor.tsx app/api/pages/ app/(admin)/admin/pagine/
git commit -m "feat: add block-based page editor with drag-and-drop and autosave"
```

---

### Task 2.4: Blog Admin

**Files:**
- Create: `app/(admin)/admin/blog/page.tsx`
- Create: `app/(admin)/admin/blog/[id]/page.tsx`
- Create: `app/api/blog/route.ts`
- Create: `app/api/blog/[id]/route.ts`

- [ ] **Step 1: Create blog API routes**

```typescript
// app/api/blog/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET() {
  await requireAdmin();
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { categories: true, tags: true },
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const { title } = await req.json();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const post = await prisma.blogPost.create({ data: { title, slug, blocks: [] } });
  return NextResponse.json(post);
}
```

```typescript
// app/api/blog/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const post = await prisma.blogPost.findUnique({
    where: { id: params.id },
    include: { categories: true, tags: true },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const data = await req.json();
  const post = await prisma.blogPost.update({
    where: { id: params.id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      blocks: data.blocks,
      coverImage: data.coverImage,
      status: data.status,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });
  return NextResponse.json(post);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  await prisma.blogPost.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create blog list and editor pages**

The blog admin pages follow the exact same pattern as the page editor (Task 2.3 steps 5-6) but with additional fields for excerpt, cover image, and publish status. Create `app/(admin)/admin/blog/page.tsx` (list with create button) and `app/(admin)/admin/blog/[id]/page.tsx` (block editor with cover image picker, excerpt field, and status selector including SCHEDULED).

- [ ] **Step 3: Verify blog editor**

```bash
npm run dev
```

Navigate to `/admin/blog`, create a post, add blocks, set cover image, verify save.

- [ ] **Step 4: Commit**

```bash
git add app/api/blog/ app/(admin)/admin/blog/
git commit -m "feat: add blog admin with block editor, cover images, and publish status"
```

---

### Task 2.5: Contacts, Settings, and Remaining Admin Sections

**Files:**
- Create: `app/(admin)/admin/contatti/page.tsx`
- Create: `app/api/contacts/route.ts`
- Create: `app/api/contacts/[id]/route.ts`
- Create: `app/(admin)/admin/impostazioni/page.tsx`
- Create: `app/api/settings/route.ts`

- [ ] **Step 1: Create contacts API**

```typescript
// app/api/contacts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

// Public POST (no auth required)
export async function POST(req: NextRequest) {
  const { name, email, type, message } = await req.json();
  const contact = await prisma.contact.create({
    data: { name, email, type, message },
  });
  // TODO: send email notification to admin
  return NextResponse.json(contact);
}

// Admin GET
export async function GET() {
  await requireAdmin();
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(contacts);
}
```

```typescript
// app/api/contacts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const { status } = await req.json();
  const contact = await prisma.contact.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json(contact);
}
```

- [ ] **Step 2: Create contacts admin page**

```tsx
// app/(admin)/admin/contatti/page.tsx
"use client";

import { useState, useEffect } from "react";

interface ContactItem {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);

  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then(setContacts);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const statusColors: Record<string, string> = {
    NEW: "bg-terracotta/10 text-terracotta",
    READ: "bg-ochre/10 text-ochre",
    REPLIED: "bg-teal/10 text-teal",
  };

  return (
    <div>
      <h1 className="text-2xl font-mono text-teal mb-6">Contatti</h1>
      <div className="space-y-3">
        {contacts.map((c) => (
          <div key={c.id} className="bg-code-bg rounded-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sand font-medium">{c.name}</h3>
                <p className="text-sand/40 text-sm">{c.email} &middot; {c.type}</p>
              </div>
              <select
                value={c.status}
                onChange={(e) => updateStatus(c.id, e.target.value)}
                className={`text-xs font-mono px-2 py-1 rounded border-none ${statusColors[c.status]}`}
              >
                <option value="NEW">Nuovo</option>
                <option value="READ">Letto</option>
                <option value="REPLIED">Risposto</option>
              </select>
            </div>
            <p className="text-sand/70 text-sm">{c.message}</p>
            <p className="text-sand/30 text-xs mt-2">{new Date(c.createdAt).toLocaleString("it-IT")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create settings API and admin page**

```typescript
// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET() {
  await requireAdmin();
  const settings = await prisma.siteSetting.findMany();
  const map: Record<string, any> = {};
  settings.forEach((s) => { map[s.key] = s.value; });
  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  await requireAdmin();
  const data = await req.json();
  for (const [key, value] of Object.entries(data)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any },
    });
  }
  return NextResponse.json({ ok: true });
}
```

```tsx
// app/(admin)/admin/impostazioni/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
  }, []);

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
  };

  const fields = [
    { key: "site_name", label: "Nome sito" },
    { key: "site_description", label: "Descrizione" },
    { key: "social_github", label: "GitHub URL" },
    { key: "social_facebook", label: "Facebook URL" },
    { key: "social_twitter", label: "Twitter/X URL" },
    { key: "admin_email", label: "Email admin" },
    { key: "stripe_publishable_key", label: "Stripe Publishable Key" },
    { key: "paypal_client_id", label: "PayPal Client ID" },
  ];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Impostazioni</h1>
        <button
          onClick={save}
          disabled={saving}
          className="bg-teal text-primary font-mono text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2"
        >
          <Save size={14} /> {saving ? "Salvo..." : "Salva"}
        </button>
      </div>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="text-sand/50 text-sm block mb-1">{field.label}</label>
            <input
              value={(settings[field.key] as string) || ""}
              onChange={(e) => update(field.key, e.target.value)}
              className="w-full bg-code-bg border border-ochre/20 rounded-lg px-4 py-3 text-sand"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify contacts and settings**

```bash
npm run dev
```

Navigate to `/admin/contatti` and `/admin/impostazioni`, verify both render and save.

- [ ] **Step 5: Commit**

```bash
git add app/api/contacts/ app/api/settings/ app/(admin)/admin/contatti/ app/(admin)/admin/impostazioni/
git commit -m "feat: add contacts management and site settings admin"
```

---

## Phase 3: Public Site

### Task 3.1: Public Layout (Navbar + Footer)

**Files:**
- Create: `components/public/navbar.tsx`
- Create: `components/public/footer.tsx`
- Create: `components/public/section-divider.tsx`
- Modify: `app/(public)/layout.tsx`

- [ ] **Step 1: Create stratigraphic section divider SVG component**

```tsx
// components/public/section-divider.tsx
interface Props {
  variant?: "dark-to-light" | "light-to-dark";
  className?: string;
}

export function SectionDivider({ variant = "dark-to-light", className = "" }: Props) {
  const colors = variant === "dark-to-light"
    ? { top: "#0F1729", bottom: "#E8DCC8" }
    : { top: "#E8DCC8", bottom: "#0F1729" };

  return (
    <svg
      viewBox="0 0 1440 80"
      className={`w-full block ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M0,0 L1440,0 L1440,40 Q1200,80 960,50 Q720,20 480,55 Q240,90 0,45 Z"
        fill={colors.top}
      />
      <path
        d="M0,45 Q240,90 480,55 Q720,20 960,50 Q1200,80 1440,40 L1440,80 L0,80 Z"
        fill={colors.bottom}
      />
    </svg>
  );
}
```

- [ ] **Step 2: Create navbar**

```tsx
// components/public/navbar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { clsx } from "clsx";

const links = [
  { href: "/corsi", label: "Corsi" },
  { href: "/docs", label: "Documentazione" },
  { href: "/servizi", label: "Servizi" },
  { href: "/community", label: "Community" },
  { href: "/blog", label: "Blog" },
  { href: "/contatti", label: "Contatti" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/80 backdrop-blur-md border-b border-ochre/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-teal font-mono font-bold text-lg">
          pyArchInit
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sand/70 hover:text-teal text-sm transition"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/corsi"
            className="bg-teal text-primary font-mono text-sm font-bold px-4 py-2 rounded-full hover:bg-teal/90 transition"
          >
            Inizia
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-sand">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile fullscreen menu */}
      <div
        className={clsx(
          "fixed inset-0 bg-primary z-40 flex flex-col items-center justify-center gap-8 transition-all duration-300 md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="text-sand text-2xl font-mono hover:text-teal transition"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Create footer**

```tsx
// components/public/footer.tsx
import Link from "next/link";

const footerSections = [
  {
    title: "Navigazione",
    links: [
      { href: "/", label: "Home" },
      { href: "/servizi", label: "Servizi" },
      { href: "/community", label: "Community" },
      { href: "/contatti", label: "Contatti" },
    ],
  },
  {
    title: "Corsi",
    links: [
      { href: "/corsi?cat=python", label: "Python" },
      { href: "/corsi?cat=gis", label: "GIS" },
      { href: "/corsi?cat=pyarchinit", label: "pyArchInit" },
      { href: "/corsi?cat=scavo", label: "Scavo" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "https://github.com/pyarchinit", label: "GitHub" },
      { href: "/docs", label: "Documentazione" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Contatti",
    links: [
      { href: "/contatti", label: "Scrivici" },
      { href: "mailto:info@pyarchinit.org", label: "info@pyarchinit.org" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-code-bg border-t border-ochre/10">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {footerSections.map((section) => (
          <div key={section.title}>
            <h3 className="font-mono text-teal text-sm mb-4">{section.title}</h3>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sand/50 text-sm hover:text-sand transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ochre/10 py-6 text-center">
        <p className="text-sand/30 text-sm">
          &copy; {new Date().getFullYear()} pyArchInit. Piattaforma Open Source per l'Archeologia.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Update public layout**

```tsx
// app/(public)/layout.tsx
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-16">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Verify**

```bash
npm run dev
```

Check navbar appears, mobile menu works, footer renders.

- [ ] **Step 6: Commit**

```bash
git add components/public/ app/(public)/layout.tsx
git commit -m "feat: add public navbar, footer, and stratigraphic section dividers"
```

---

### Task 3.2: Homepage

**Files:**
- Modify: `app/(public)/page.tsx`
- Create: `components/public/animated-counter.tsx`
- Create: `components/public/scroll-reveal.tsx`

- [ ] **Step 1: Create scroll reveal wrapper**

```tsx
// components/public/scroll-reveal.tsx
"use client";

import { useRef, useEffect, useState } from "react";

export function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create animated counter**

```tsx
// components/public/animated-counter.tsx
"use client";

import { useRef, useEffect, useState } from "react";

export function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}
```

- [ ] **Step 3: Build homepage with all sections**

```tsx
// app/(public)/page.tsx
import Link from "next/link";
import { SectionDivider } from "@/components/public/section-divider";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { AnimatedCounter } from "@/components/public/animated-counter";
import { Code, Building2, Users } from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary to-code-bg" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-mono text-sand mb-4 leading-tight">
            Piattaforma Open Source<br />
            per l'<span className="text-teal">Archeologia Digitale</span>
          </h1>
          <p className="text-sand/60 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Dove il codice incontra la terra. Strumenti, corsi e community per digitalizzare la ricerca archeologica.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/corsi" className="bg-teal text-primary font-mono font-bold px-6 py-3 rounded-full hover:bg-teal/90 transition">
              Esplora i Corsi
            </Link>
            <Link href="/docs" className="border border-sand/30 text-sand font-mono px-6 py-3 rounded-full hover:border-teal hover:text-teal transition">
              Documentazione
            </Link>
            <Link href="/community" className="border border-sand/30 text-sand font-mono px-6 py-3 rounded-full hover:border-teal hover:text-teal transition">
              Contribuisci
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider variant="dark-to-light" />

      {/* Cosa è pyArchInit */}
      <section className="bg-sand py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-mono text-primary mb-6 text-center">Cosa è pyArchInit</h2>
            <p className="text-primary/70 text-center max-w-3xl mx-auto mb-12">
              Un ecosistema open source che collega QGIS, database relazionali e strumenti di analisi
              per la gestione completa dei dati di scavo archeologico.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-mono text-terracotta">
                  <AnimatedCounter target={10} suffix="+" />
                </p>
                <p className="text-primary/50 text-sm mt-1">Anni di sviluppo</p>
              </div>
              <div>
                <p className="text-4xl font-mono text-terracotta">
                  <AnimatedCounter target={50} suffix="+" />
                </p>
                <p className="text-primary/50 text-sm mt-1">Contributori</p>
              </div>
              <div>
                <p className="text-4xl font-mono text-terracotta">
                  <AnimatedCounter target={200} suffix="+" />
                </p>
                <p className="text-primary/50 text-sm mt-1">Scavi gestiti</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <SectionDivider variant="light-to-dark" />

      {/* Per Chi */}
      <section className="bg-primary py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-mono text-teal mb-12 text-center">Per Chi</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Code, title: "Archeologi", desc: "Impara a digitalizzare il tuo scavo con corsi pratici e documentazione completa.", href: "/corsi" },
              { icon: Building2, title: "Enti e Istituzioni", desc: "Soluzioni su misura per la gestione dei dati archeologici del vostro ente.", href: "/servizi" },
              { icon: Users, title: "Sviluppatori", desc: "Contribuisci al progetto open source e fai crescere la community.", href: "/community" },
            ].map((item) => (
              <ScrollReveal key={item.title}>
                <Link
                  href={item.href}
                  className="block bg-code-bg rounded-card p-8 hover:ring-1 hover:ring-teal/30 hover:scale-[1.02] transition-all"
                >
                  <item.icon className="text-teal mb-4" size={32} />
                  <h3 className="text-sand font-mono text-lg mb-2">{item.title}</h3>
                  <p className="text-sand/50 text-sm">{item.desc}</p>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider variant="dark-to-light" />

      {/* CTA Finale */}
      <section className="bg-gradient-to-b from-sand to-primary py-20 px-4 text-center">
        <ScrollReveal>
          <h2 className="text-3xl font-mono text-primary mb-4">Pronto a iniziare?</h2>
          <p className="text-primary/60 mb-8">Esplora i corsi o contattaci per una consulenza personalizzata.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/corsi" className="bg-teal text-primary font-mono font-bold px-6 py-3 rounded-full">
              Inizia un corso
            </Link>
            <Link href="/contatti" className="border border-primary/30 text-primary font-mono px-6 py-3 rounded-full hover:border-primary transition">
              Contattaci
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Verify homepage renders all sections**

```bash
npm run dev
```

Check: hero, counters, "Per Chi" cards, CTA, scroll animations.

- [ ] **Step 5: Commit**

```bash
git add app/(public)/page.tsx components/public/animated-counter.tsx components/public/scroll-reveal.tsx
git commit -m "feat: build homepage with hero, animated counters, sections, and scroll reveal"
```

---

### Task 3.3: Public Pages Renderer, Blog, Docs, Contacts, Servizi, Community

**Files:**
- Create: `app/(public)/[slug]/page.tsx` (dynamic CMS pages)
- Create: `components/public/block-renderer.tsx`
- Create: `app/(public)/blog/page.tsx`
- Create: `app/(public)/blog/[slug]/page.tsx`
- Create: `app/(public)/docs/page.tsx`
- Create: `app/(public)/docs/[slug]/page.tsx`
- Create: `app/(public)/contatti/page.tsx`
- Create: `app/(public)/servizi/page.tsx`
- Create: `app/(public)/community/page.tsx`

- [ ] **Step 1: Create block renderer for public pages**

```tsx
// components/public/block-renderer.tsx
import Image from "next/image";
import Link from "next/link";
import { Block } from "@/lib/blocks";

function TextBlock({ data }: { data: { content: string } }) {
  return (
    <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: data.content }} />
  );
}

function ImageBlock({ data }: { data: { src: string; alt: string; caption?: string } }) {
  return (
    <figure>
      <div className="relative aspect-video rounded-card overflow-hidden">
        <Image src={data.src} alt={data.alt} fill className="object-cover" />
      </div>
      {data.caption && <figcaption className="text-sand/40 text-sm mt-2 text-center">{data.caption}</figcaption>}
    </figure>
  );
}

function HeroBlock({ data }: { data: { title: string; subtitle: string; backgroundImage?: string; cta?: { label: string; href: string } } }) {
  return (
    <section className="relative py-24 px-4 text-center rounded-card overflow-hidden">
      {data.backgroundImage && (
        <Image src={data.backgroundImage} alt="" fill className="object-cover opacity-30" />
      )}
      <div className="relative z-10">
        <h2 className="text-4xl font-mono text-sand mb-4">{data.title}</h2>
        <p className="text-sand/60 text-lg mb-6">{data.subtitle}</p>
        {data.cta && (
          <Link href={data.cta.href} className="bg-teal text-primary font-mono font-bold px-6 py-3 rounded-full">
            {data.cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}

function CtaBlock({ data }: { data: { title: string; description: string; buttons: { label: string; href: string; variant: string }[] } }) {
  return (
    <section className="text-center py-12">
      <h2 className="text-3xl font-mono text-teal mb-4">{data.title}</h2>
      <p className="text-sand/60 mb-6">{data.description}</p>
      <div className="flex gap-4 justify-center">
        {data.buttons.map((btn, i) => (
          <Link
            key={i}
            href={btn.href}
            className={btn.variant === "primary"
              ? "bg-teal text-primary font-mono font-bold px-6 py-3 rounded-full"
              : "border border-sand/30 text-sand font-mono px-6 py-3 rounded-full"
            }
          >
            {btn.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function CodeBlock({ data }: { data: { code: string; language: string } }) {
  return (
    <pre className="bg-code-bg rounded-card p-6 overflow-x-auto">
      <code className="text-teal font-mono text-sm">{data.code}</code>
    </pre>
  );
}

const renderers: Record<string, React.ComponentType<any>> = {
  text: TextBlock,
  image: ImageBlock,
  hero: HeroBlock,
  cta: CtaBlock,
  code: CodeBlock,
};

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-8">
      {blocks.map((block) => {
        const Renderer = renderers[block.type];
        if (!Renderer) return null;
        return <Renderer key={block.id} data={block.data} />;
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create dynamic CMS page route**

```tsx
// app/(public)/[slug]/page.tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/public/block-renderer";

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const page = await prisma.page.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
  });

  if (!page) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-mono text-teal mb-8">{page.title}</h1>
      <BlockRenderer blocks={page.blocks as any[]} />
    </div>
  );
}
```

- [ ] **Step 3: Create public blog pages**

```tsx
// app/(public)/blog/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-mono text-teal mb-12">Blog</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="bg-code-bg rounded-card overflow-hidden hover:ring-1 hover:ring-teal/30 hover:scale-[1.02] transition-all"
          >
            {post.coverImage && (
              <div className="relative aspect-video">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              </div>
            )}
            <div className="p-6">
              <h2 className="text-sand font-mono text-lg mb-2">{post.title}</h2>
              {post.excerpt && <p className="text-sand/50 text-sm mb-3">{post.excerpt}</p>}
              <p className="text-sand/30 text-xs">
                {post.publishedAt && new Date(post.publishedAt).toLocaleDateString("it-IT")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// app/(public)/blog/[slug]/page.tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/public/block-renderer";

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
  });

  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-mono text-teal mb-4">{post.title}</h1>
      <p className="text-sand/40 text-sm mb-12">
        {post.publishedAt && new Date(post.publishedAt).toLocaleDateString("it-IT")}
      </p>
      <BlockRenderer blocks={post.blocks as any[]} />
    </article>
  );
}
```

- [ ] **Step 4: Create contacts page**

```tsx
// app/(public)/contatti/page.tsx
"use client";

import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        type: form.get("type"),
        message: form.get("message"),
      }),
    });
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-mono text-teal mb-4">Messaggio inviato!</h1>
        <p className="text-sand/60">Ti risponderemo il prima possibile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-mono text-teal mb-8">Contatti</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" required placeholder="Nome" className="w-full bg-code-bg border border-ochre/20 rounded-lg px-4 py-3 text-sand" />
        <input name="email" type="email" required placeholder="Email" className="w-full bg-code-bg border border-ochre/20 rounded-lg px-4 py-3 text-sand" />
        <select name="type" required className="w-full bg-code-bg border border-ochre/20 rounded-lg px-4 py-3 text-sand">
          <option value="">Tipo di richiesta</option>
          <option value="info">Informazioni</option>
          <option value="corsi">Corsi</option>
          <option value="consulenza">Consulenza</option>
          <option value="supporto">Supporto tecnico</option>
          <option value="altro">Altro</option>
        </select>
        <textarea name="message" required rows={5} placeholder="Messaggio" className="w-full bg-code-bg border border-ochre/20 rounded-lg px-4 py-3 text-sand" />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal text-primary font-mono font-bold py-3 rounded-full hover:bg-teal/90 transition"
        >
          {loading ? "Invio..." : "Invia messaggio"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Create servizi and community pages (static for now, CMS-editable later)**

```tsx
// app/(public)/servizi/page.tsx
import { ScrollReveal } from "@/components/public/scroll-reveal";
import Link from "next/link";
import { Database, Map, GraduationCap, Wrench } from "lucide-react";

const services = [
  { icon: Database, title: "Gestione Dati Archeologici", desc: "Configurazione e personalizzazione di pyArchInit per il vostro ente. Migrazione dati, setup database, formazione staff." },
  { icon: Map, title: "GIS e Cartografia", desc: "Integrazione QGIS, configurazione layer cartografici, georeferenziazione dati di scavo." },
  { icon: GraduationCap, title: "Formazione", desc: "Corsi personalizzati in sede o da remoto per team di archeologi e tecnici." },
  { icon: Wrench, title: "Sviluppo Custom", desc: "Plugin e moduli personalizzati per esigenze specifiche del vostro progetto." },
];

export default function ServiziPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-mono text-teal mb-4 text-center">Servizi</h1>
      <p className="text-sand/60 text-center max-w-2xl mx-auto mb-16">
        Soluzioni su misura per enti, università e soprintendenze che vogliono digitalizzare la gestione dei dati archeologici.
      </p>
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {services.map((s) => (
          <ScrollReveal key={s.title}>
            <div className="bg-code-bg rounded-card p-8">
              <s.icon className="text-terracotta mb-4" size={28} />
              <h3 className="text-sand font-mono text-lg mb-3">{s.title}</h3>
              <p className="text-sand/50 text-sm">{s.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
      <div className="text-center">
        <Link href="/contatti" className="bg-teal text-primary font-mono font-bold px-6 py-3 rounded-full">
          Richiedi un preventivo
        </Link>
      </div>
    </div>
  );
}
```

```tsx
// app/(public)/community/page.tsx
import Link from "next/link";
import { Github, BookOpen, Users, GitPullRequest } from "lucide-react";
import { ScrollReveal } from "@/components/public/scroll-reveal";

export default function CommunityPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-mono text-teal mb-4 text-center">Community</h1>
      <p className="text-sand/60 text-center max-w-2xl mx-auto mb-16">
        pyArchInit è un progetto open source. Ogni contributo conta.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
        {[
          { icon: Github, title: "Codice sorgente", desc: "Esplora il repository, apri issue, proponi pull request.", href: "https://github.com/pyarchinit" },
          { icon: BookOpen, title: "Documentazione", desc: "Aiutaci a migliorare la documentazione per tutti.", href: "/docs" },
          { icon: GitPullRequest, title: "Come contribuire", desc: "Guida passo-passo per il tuo primo contributo al progetto.", href: "/docs" },
          { icon: Users, title: "Discussioni", desc: "Partecipa alle discussioni e proponi nuove funzionalità.", href: "https://github.com/pyarchinit/discussions" },
        ].map((item) => (
          <ScrollReveal key={item.title}>
            <Link
              href={item.href}
              className="block bg-code-bg rounded-card p-8 hover:ring-1 hover:ring-teal/30 transition"
            >
              <item.icon className="text-teal mb-4" size={28} />
              <h3 className="text-sand font-mono text-lg mb-2">{item.title}</h3>
              <p className="text-sand/50 text-sm">{item.desc}</p>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create docs public page (reads from DB)**

```tsx
// app/(public)/docs/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function DocsPage() {
  const sections = await prisma.docSection.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: {
      pages: { orderBy: { order: "asc" } },
      children: {
        orderBy: { order: "asc" },
        include: { pages: { orderBy: { order: "asc" } } },
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-mono text-teal mb-12">Documentazione</h1>
      <div className="grid md:grid-cols-3 gap-8">
        {sections.map((section) => (
          <div key={section.id} className="bg-code-bg rounded-card p-6">
            <h2 className="font-mono text-sand text-lg mb-4">{section.title}</h2>
            <ul className="space-y-2">
              {section.pages.map((page) => (
                <li key={page.id}>
                  <Link href={`/docs/${page.slug}`} className="text-sand/60 text-sm hover:text-teal transition">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// app/(public)/docs/[slug]/page.tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function DocPageView({ params }: { params: { slug: string } }) {
  const page = await prisma.docPage.findUnique({
    where: { slug: params.slug },
    include: { section: true },
  });

  if (!page) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <p className="text-teal/60 text-sm font-mono mb-2">{page.section.title}</p>
      <h1 className="text-4xl font-mono text-teal mb-8">{page.title}</h1>
      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  );
}
```

- [ ] **Step 7: Verify all public pages**

```bash
npm run dev
```

Check all routes: `/blog`, `/contatti`, `/servizi`, `/community`, `/docs`.

- [ ] **Step 8: Commit**

```bash
git add components/public/block-renderer.tsx app/(public)/
git commit -m "feat: add all public pages (blog, docs, contacts, services, community, CMS pages)"
```

---

## Phase 4: Landing Page Animata

### Task 4.1: Canvas Engine Core

**Files:**
- Create: `canvas/engine.ts`
- Create: `canvas/noise.ts`
- Create: `canvas/scene.ts`
- Create: `canvas/entities/luca.ts`
- Create: `canvas/entities/monitor.ts`
- Create: `canvas/entities/bubbles.ts`
- Create: `canvas/entities/particles.ts`
- Create: `canvas/interaction.ts`
- Create: `app/(landing)/page.tsx`

- [ ] **Step 1: Create noise utility**

```typescript
// canvas/noise.ts
// Simple Perlin-like noise for organic motion
export function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

export function fbm(x: number, y: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * (noise2D(x * frequency, y * frequency) * 2 - 1);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

export function smoothstep(a: number, b: number, t: number): number {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
```

- [ ] **Step 2: Create Luca entity**

```typescript
// canvas/entities/luca.ts
export interface LucaConfig {
  x: number;
  y: number;
  scale: number;
}

export function drawLuca(ctx: CanvasRenderingContext2D, config: LucaConfig, t: number) {
  const { x, y, scale } = config;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Chair
  ctx.fillStyle = "#2a2a3a";
  ctx.fillRect(-30, 40, 60, 50);
  ctx.fillRect(-35, 85, 70, 10);

  // Body (torso from behind)
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(-25, -20, 50, 60);

  // Shoulders
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.ellipse(0, -15, 35, 15, 0, Math.PI, 0);
  ctx.fill();

  // Head
  ctx.fillStyle = "#c4a882";
  ctx.beginPath();
  ctx.ellipse(0, -40, 18, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = "#2a1a0a";
  ctx.beginPath();
  ctx.ellipse(0, -48, 20, 16, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Headphones
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -45, 22, Math.PI * 0.8, Math.PI * 0.2);
  ctx.stroke();
  ctx.fillStyle = "#444";
  ctx.fillRect(-24, -42, 8, 14);
  ctx.fillRect(16, -42, 8, 14);

  // Arms typing animation
  const armOffset = Math.sin(t * 3) * 2;
  ctx.fillStyle = "#1a1a2e";
  // Left arm
  ctx.fillRect(-35, 0, 15, 40 + armOffset);
  // Right arm
  ctx.fillRect(20, 0, 15, 40 - armOffset);

  // Monitor glow on back
  const glowIntensity = 0.15 + Math.sin(t * 0.5) * 0.05;
  const gradient = ctx.createRadialGradient(0, -10, 10, 0, -10, 80);
  gradient.addColorStop(0, `rgba(0, 212, 170, ${glowIntensity})`);
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.fillRect(-50, -60, 100, 100);

  ctx.restore();
}
```

- [ ] **Step 3: Create monitor entity with auto-typing screens**

```typescript
// canvas/entities/monitor.ts
const screens = [
  {
    type: "code" as const,
    lines: [
      "class UnitaStratigrafica:",
      "    def __init__(self, us_id, tipo):",
      "        self.us_id = us_id",
      "        self.tipo = tipo",
      "        self.reperti = []",
      "",
      "    def aggiungi_reperto(self, rep):",
      "        self.reperti.append(rep)",
      "        return self",
    ],
  },
  {
    type: "ui" as const,
    lines: [
      "╔═══ Scheda US 1042 ═══╗",
      "║ Tipo: Riempimento     ║",
      "║ Quota sup: -1.45m     ║",
      "║ Quota inf: -1.82m     ║",
      "║ Colore: 7.5YR 4/6     ║",
      "║ Reperti: 12           ║",
      "║ Fase: III sec. a.C.   ║",
      "╚════════════════════════╝",
    ],
  },
  {
    type: "gis" as const,
    lines: [
      ">>> import geopandas as gpd",
      ">>> scavi = gpd.read_file('trenches.shp')",
      ">>> scavi.plot(column='phase',",
      "...     cmap='RdYlGn',",
      "...     legend=True)",
      ">>> print(f'Features: {len(scavi)}')",
      "Features: 847",
    ],
  },
];

export interface MonitorConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function drawMonitor(
  ctx: CanvasRenderingContext2D,
  config: MonitorConfig,
  t: number,
  detailLevel: number // 0-1, 1 = zoomed in
) {
  const { x, y, width, height } = config;
  const screenIndex = Math.floor(t / 8) % screens.length;
  const screen = screens[screenIndex];
  const charIndex = Math.floor((t % 8) * 12);

  ctx.save();
  ctx.translate(x, y);

  // Monitor frame
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.strokeRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10);

  // Screen background
  ctx.fillStyle = "#0a0e17";
  ctx.fillRect(-width / 2, -height / 2, width, height);

  // Screen content
  const fontSize = 8 + detailLevel * 6;
  ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
  ctx.textBaseline = "top";

  const lineHeight = fontSize * 1.4;
  let totalChars = 0;

  screen.lines.forEach((line, i) => {
    const yPos = -height / 2 + 10 + i * lineHeight;
    if (yPos > height / 2 - 10) return;

    const visibleChars = Math.max(0, Math.min(line.length, charIndex - totalChars));
    const visibleText = line.substring(0, visibleChars);
    totalChars += line.length;

    // Color based on content type
    if (screen.type === "code") {
      if (line.startsWith("class") || line.startsWith("    def")) {
        ctx.fillStyle = "#00D4AA";
      } else if (line.includes("self.")) {
        ctx.fillStyle = "#D4712A";
      } else {
        ctx.fillStyle = "#E8DCC8";
      }
    } else if (screen.type === "ui") {
      ctx.fillStyle = line.includes("═") || line.includes("║") ? "#8B7355" : "#E8DCC8";
    } else {
      ctx.fillStyle = line.startsWith(">>>") ? "#00D4AA" : "#E8DCC8";
    }

    ctx.fillText(visibleText, -width / 2 + 10, yPos);
  });

  // Cursor blink
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = "#00D4AA";
    ctx.fillRect(-width / 2 + 10 + (charIndex % 30) * (fontSize * 0.6), -height / 2 + 10 + Math.min(screen.lines.length - 1, Math.floor(charIndex / 30)) * lineHeight, fontSize * 0.6, fontSize);
  }

  // Stand
  ctx.fillStyle = "#333";
  ctx.fillRect(-10, height / 2 + 5, 20, 20);
  ctx.fillRect(-25, height / 2 + 25, 50, 5);

  ctx.restore();
}
```

- [ ] **Step 4: Create thought bubbles entity**

```typescript
// canvas/entities/bubbles.ts
import { fbm } from "../noise";

interface Bubble {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  age: number;
  maxAge: number;
  content: BubbleContent;
}

type BubbleContent =
  | { type: "code"; text: string }
  | { type: "harris"; }
  | { type: "artifact"; shape: "amphora" | "ceramic" }
  | { type: "chart"; };

const contentPool: BubbleContent[] = [
  { type: "code", text: "class UnitaStratigrafica:" },
  { type: "harris" },
  { type: "artifact", shape: "amphora" },
  { type: "chart" },
  { type: "code", text: "def analyze(layer):" },
  { type: "artifact", shape: "ceramic" },
];

let bubbles: Bubble[] = [];
let nextId = 0;
let lastSpawn = 0;

export function updateBubbles(t: number, originX: number, originY: number): Bubble[] {
  // Spawn new bubble every 4-5 seconds
  if (t - lastSpawn > 4 + Math.random()) {
    lastSpawn = t;
    bubbles.push({
      id: nextId++,
      x: originX + (Math.random() - 0.5) * 30,
      y: originY,
      opacity: 0,
      scale: 0,
      age: 0,
      maxAge: 4,
      content: contentPool[Math.floor(Math.random() * contentPool.length)],
    });
  }

  // Update bubbles
  bubbles = bubbles.filter((b) => b.age < b.maxAge);
  bubbles.forEach((b) => {
    b.age += 1 / 60;
    b.y -= 0.5 + fbm(b.x * 0.01, t, 2) * 0.3;
    b.x += fbm(t, b.y * 0.01, 2) * 0.2;

    // Fade in first 0.5s, visible 3s, fade out last 0.5s
    if (b.age < 0.5) {
      b.opacity = b.age / 0.5;
      b.scale = b.age / 0.5;
    } else if (b.age > b.maxAge - 0.5) {
      b.opacity = (b.maxAge - b.age) / 0.5;
    } else {
      b.opacity = 1;
      b.scale = 1;
    }
  });

  return bubbles;
}

export function drawBubbles(ctx: CanvasRenderingContext2D, bubbles: Bubble[], t: number) {
  bubbles.forEach((b) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(b.scale, b.scale);
    ctx.globalAlpha = b.opacity;

    // Bubble background
    const w = 120;
    const h = 60;
    ctx.fillStyle = "rgba(26, 30, 46, 0.85)";
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 212, 170, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Content
    if (b.content.type === "code") {
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = "#00D4AA";
      ctx.textAlign = "center";
      ctx.fillText(b.content.text, 0, 4);
    } else if (b.content.type === "harris") {
      // Simple Harris matrix diagram
      ctx.strokeStyle = "#D4712A";
      ctx.lineWidth = 1.5;
      const nodes = [{ x: 0, y: -15 }, { x: -20, y: 5 }, { x: 20, y: 5 }, { x: 0, y: 20 }];
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(0, -9); ctx.lineTo(-20, -1);
      ctx.moveTo(0, -9); ctx.lineTo(20, -1);
      ctx.moveTo(-20, 11); ctx.lineTo(0, 14);
      ctx.moveTo(20, 11); ctx.lineTo(0, 14);
      ctx.stroke();
    } else if (b.content.type === "artifact") {
      // Simple rotating artifact
      const rotation = t * 0.5;
      ctx.strokeStyle = "#D4712A";
      ctx.lineWidth = 1.5;
      ctx.translate(0, 2);
      ctx.rotate(Math.sin(rotation) * 0.2);
      if (b.content.shape === "amphora") {
        ctx.beginPath();
        ctx.moveTo(-8, -20); ctx.quadraticCurveTo(-15, 0, -8, 20);
        ctx.lineTo(8, 20); ctx.quadraticCurveTo(15, 0, 8, -20);
        ctx.closePath();
        ctx.stroke();
        // Handles
        ctx.beginPath();
        ctx.arc(-12, -10, 5, 0, Math.PI, true);
        ctx.arc(12, -10, 5, 0, Math.PI, true);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-12, -5); ctx.lineTo(12, -5);
        ctx.stroke();
      }
    } else if (b.content.type === "chart") {
      // Mini bar chart
      ctx.fillStyle = "#00D4AA";
      const bars = [15, 25, 12, 30, 20, 18];
      bars.forEach((h, i) => {
        ctx.fillRect(-35 + i * 12, 15 - h, 8, h);
      });
    }

    ctx.restore();
  });
}
```

- [ ] **Step 5: Create particles system**

```typescript
// canvas/entities/particles.ts
import { fbm } from "../noise";

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

let particles: Particle[] = [];

export function initParticles(width: number, height: number) {
  particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 1 + Math.random() * 2,
    opacity: 0.1 + Math.random() * 0.3,
    speed: 0.2 + Math.random() * 0.5,
  }));
}

export function updateAndDrawParticles(ctx: CanvasRenderingContext2D, t: number, width: number, height: number) {
  particles.forEach((p) => {
    p.y -= p.speed;
    p.x += fbm(p.x * 0.005, t * 0.5, 2) * 0.5;

    if (p.y < -10) {
      p.y = height + 10;
      p.x = Math.random() * width;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 212, 170, ${p.opacity * (0.5 + Math.sin(t + p.x) * 0.5)})`;
    ctx.fill();
  });
}
```

- [ ] **Step 6: Create magnifier interaction**

```typescript
// canvas/interaction.ts
export interface MagnifierState {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  zoom: number;
}

export function updateMagnifier(
  mouseX: number,
  mouseY: number,
  monitorBounds: { x: number; y: number; width: number; height: number },
  activationRadius: number
): MagnifierState {
  const dx = mouseX - monitorBounds.x;
  const dy = mouseY - monitorBounds.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  return {
    active: dist < activationRadius,
    x: mouseX,
    y: mouseY,
    radius: 80,
    zoom: 3,
  };
}

export function drawMagnifier(
  ctx: CanvasRenderingContext2D,
  state: MagnifierState,
  renderScene: (ctx: CanvasRenderingContext2D, detailLevel: number) => void
) {
  if (!state.active) return;

  ctx.save();

  // Clip to circle
  ctx.beginPath();
  ctx.arc(state.x, state.y, state.radius, 0, Math.PI * 2);
  ctx.clip();

  // Draw zoomed scene
  ctx.translate(state.x, state.y);
  ctx.scale(state.zoom, state.zoom);
  ctx.translate(-state.x, -state.y);
  renderScene(ctx, 1);

  ctx.restore();

  // Lens border
  ctx.beginPath();
  ctx.arc(state.x, state.y, state.radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0, 212, 170, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
}
```

- [ ] **Step 7: Create main scene orchestrator**

```typescript
// canvas/scene.ts
import { drawLuca } from "./entities/luca";
import { drawMonitor } from "./entities/monitor";
import { updateBubbles, drawBubbles } from "./entities/bubbles";
import { initParticles, updateAndDrawParticles } from "./entities/particles";
import { updateMagnifier, drawMagnifier, MagnifierState } from "./interaction";

export class LandingScene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private startTime: number = 0;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private animationId: number = 0;
  private onTransition: (() => void) | null = null;

  private lucaX = 0;
  private lucaY = 0;
  private monitorX = 0;
  private monitorY = 0;
  private monitorW = 200;
  private monitorH = 130;

  constructor(canvas: HTMLCanvasElement, onTransition: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.onTransition = onTransition;
    this.resize();
    this.setupEvents();
    initParticles(canvas.width, canvas.height);
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.scale(dpr, dpr);

    // Position entities relative to viewport
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.lucaX = w * 0.6;
    this.lucaY = h * 0.55;
    this.monitorX = w * 0.6 - 10;
    this.monitorY = h * 0.55 - 120;
  }

  private setupEvents() {
    window.addEventListener("resize", () => {
      this.resize();
      initParticles(this.canvas.width, this.canvas.height);
    });

    this.canvas.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }

  start() {
    this.startTime = performance.now();
    this.loop();
  }

  stop() {
    cancelAnimationFrame(this.animationId);
  }

  private loop = () => {
    const t = (performance.now() - this.startTime) / 1000;
    this.render(t);
    this.animationId = requestAnimationFrame(this.loop);
  };

  private renderSceneContent(ctx: CanvasRenderingContext2D, t: number, detailLevel: number) {
    drawMonitor(ctx, {
      x: this.monitorX,
      y: this.monitorY,
      width: this.monitorW,
      height: this.monitorH,
    }, t, detailLevel);
  }

  private render(t: number) {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0a0e1a");
    bg.addColorStop(0.5, "#0F1729");
    bg.addColorStop(1, "#1a1e2e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Particles
    updateAndDrawParticles(ctx, t, w, h);

    // Desk
    ctx.fillStyle = "#1a1510";
    ctx.fillRect(this.lucaX - 150, this.lucaY + 40, 300, 15);

    // Monitor (normal detail)
    this.renderSceneContent(ctx, t, 0);

    // Luca
    drawLuca(ctx, { x: this.lucaX, y: this.lucaY, scale: 1.2 }, t);

    // Bubbles
    const activeBubbles = updateBubbles(t, this.lucaX - 40, this.monitorY - 60);
    drawBubbles(ctx, activeBubbles, t);

    // Magnifier
    const magnifier = updateMagnifier(
      this.mouseX,
      this.mouseY,
      { x: this.monitorX, y: this.monitorY, width: this.monitorW, height: this.monitorH },
      150
    );
    drawMagnifier(ctx, magnifier, (ctx2, detail) => {
      this.renderSceneContent(ctx2, t, detail);
    });

    // "Scopri pyArchInit" text
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = '18px "Inter", sans-serif';
    ctx.fillStyle = `rgba(232, 220, 200, ${0.5 + Math.sin(t * 2) * 0.3})`;
    ctx.fillText("Scopri pyArchInit", w / 2, h - 60);

    // Pulsing arrow
    const arrowY = h - 35 + Math.sin(t * 2) * 5;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 10, arrowY);
    ctx.lineTo(w / 2, arrowY + 8);
    ctx.lineTo(w / 2 + 10, arrowY);
    ctx.strokeStyle = `rgba(0, 212, 170, ${0.5 + Math.sin(t * 2) * 0.3})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}
```

- [ ] **Step 8: Create landing page component**

```tsx
// app/(landing)/page.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LandingScene } from "@/canvas/scene";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<LandingScene | null>(null);
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new LandingScene(canvasRef.current, () => {
      setTransitioning(true);
      setTimeout(() => router.push("/home"), 1500);
    });

    sceneRef.current = scene;
    scene.start();

    return () => scene.stop();
  }, [router]);

  const handleEnter = () => {
    setTransitioning(true);
    setTimeout(() => router.push("/home"), 800);
  };

  return (
    <div className="fixed inset-0 bg-primary overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleEnter}
        onWheel={handleEnter}
      />
      <div
        className={`fixed inset-0 bg-primary transition-opacity duration-700 pointer-events-none ${
          transitioning ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
```

- [ ] **Step 9: Create landing layout (no navbar/footer)**

```tsx
// app/(landing)/layout.tsx
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 10: Verify landing page**

```bash
npm run dev
```

Navigate to `/` -- should show animated canvas scene with Luca, typing monitor, floating bubbles, particles, magnifier effect on hover near monitor.

- [ ] **Step 11: Commit**

```bash
git add canvas/ app/(landing)/
git commit -m "feat: add Canvas 2D animated landing page with Luca, bubbles, magnifier, and particles"
```

---

## Phase 5: LMS

### Task 5.1: Course Admin (CRUD + Module/Lesson Builder)

**Files:**
- Create: `app/(admin)/admin/corsi/page.tsx`
- Create: `app/(admin)/admin/corsi/[id]/page.tsx`
- Create: `app/api/courses/route.ts`
- Create: `app/api/courses/[id]/route.ts`
- Create: `components/admin/course-builder.tsx`

- [ ] **Step 1: Create course API routes**

```typescript
// app/api/courses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { enrollments: true } } },
  });
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const { title } = await req.json();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const course = await prisma.course.create({
    data: {
      title,
      slug,
      description: "",
      price: 0,
      level: "BASE",
      category: "pyArchInit",
    },
  });
  return NextResponse.json(course);
}
```

```typescript
// app/api/courses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const data = await req.json();

  // Update course info
  await prisma.course.update({
    where: { id: params.id },
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      price: data.price,
      level: data.level,
      category: data.category,
      coverImage: data.coverImage,
      status: data.status,
    },
  });

  // Sync modules and lessons
  if (data.modules) {
    // Delete removed modules
    const moduleIds = data.modules.filter((m: any) => m.id).map((m: any) => m.id);
    await prisma.module.deleteMany({
      where: { courseId: params.id, id: { notIn: moduleIds } },
    });

    for (const mod of data.modules) {
      if (mod.id) {
        await prisma.module.update({
          where: { id: mod.id },
          data: { title: mod.title, order: mod.order },
        });
      } else {
        const created = await prisma.module.create({
          data: { title: mod.title, order: mod.order, courseId: params.id },
        });
        mod.id = created.id;
      }

      // Sync lessons within module
      if (mod.lessons) {
        const lessonIds = mod.lessons.filter((l: any) => l.id).map((l: any) => l.id);
        await prisma.lesson.deleteMany({
          where: { moduleId: mod.id, id: { notIn: lessonIds } },
        });

        for (const lesson of mod.lessons) {
          const lessonData = {
            title: lesson.title,
            type: lesson.type,
            content: lesson.content || {},
            duration: lesson.duration,
            order: lesson.order,
            isFree: lesson.isFree || false,
          };

          if (lesson.id) {
            await prisma.lesson.update({ where: { id: lesson.id }, data: lessonData });
          } else {
            await prisma.lesson.create({ data: { ...lessonData, moduleId: mod.id } });
          }
        }
      }
    }
  }

  const updated = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });

  return NextResponse.json(updated);
}
```

- [ ] **Step 2: Create course builder component with module/lesson drag-and-drop**

```tsx
// components/admin/course-builder.tsx
"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Lesson {
  id?: string;
  title: string;
  type: "VIDEO" | "TEXT" | "QUIZ" | "EXERCISE";
  content: any;
  duration: number | null;
  order: number;
  isFree: boolean;
}

interface Module {
  id?: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Props {
  modules: Module[];
  onChange: (modules: Module[]) => void;
}

function SortableLesson({ lesson, moduleIndex, lessonIndex, onUpdate, onRemove }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `lesson-${moduleIndex}-${lessonIndex}`,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-primary/50 rounded-lg p-3 ml-6">
      <button {...attributes} {...listeners} className="text-ochre/30 cursor-grab"><GripVertical size={14} /></button>
      <input
        value={lesson.title}
        onChange={(e) => onUpdate({ ...lesson, title: e.target.value })}
        placeholder="Titolo lezione"
        className="flex-1 bg-transparent text-sand text-sm outline-none"
      />
      <select
        value={lesson.type}
        onChange={(e) => onUpdate({ ...lesson, type: e.target.value })}
        className="bg-primary border border-ochre/20 rounded px-2 py-1 text-sand text-xs"
      >
        <option value="VIDEO">Video</option>
        <option value="TEXT">Testo</option>
        <option value="QUIZ">Quiz</option>
        <option value="EXERCISE">Esercizio</option>
      </select>
      <label className="flex items-center gap-1 text-xs text-sand/40">
        <input
          type="checkbox"
          checked={lesson.isFree}
          onChange={(e) => onUpdate({ ...lesson, isFree: e.target.checked })}
        />
        Free
      </label>
      <button onClick={onRemove} className="text-red-400/30 hover:text-red-400"><Trash2 size={14} /></button>
    </div>
  );
}

export function CourseBuilder({ modules, onChange }: Props) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));

  const addModule = () => {
    onChange([...modules, { title: "", order: modules.length, lessons: [] }]);
    setExpandedModules((prev) => new Set([...prev, modules.length]));
  };

  const updateModule = (index: number, mod: Module) => {
    const updated = [...modules];
    updated[index] = mod;
    onChange(updated);
  };

  const removeModule = (index: number) => {
    onChange(modules.filter((_, i) => i !== index));
  };

  const addLesson = (moduleIndex: number) => {
    const mod = { ...modules[moduleIndex] };
    mod.lessons = [...mod.lessons, { title: "", type: "VIDEO" as const, content: {}, duration: null, order: mod.lessons.length, isFree: false }];
    updateModule(moduleIndex, mod);
  };

  const toggleModule = (index: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {modules.map((mod, mi) => (
        <div key={mi} className="bg-code-bg rounded-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => toggleModule(mi)} className="text-ochre/40">
              {expandedModules.has(mi) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <span className="text-teal/40 text-xs font-mono">Modulo {mi + 1}</span>
            <input
              value={mod.title}
              onChange={(e) => updateModule(mi, { ...mod, title: e.target.value })}
              placeholder="Titolo modulo"
              className="flex-1 bg-transparent text-sand font-medium outline-none"
            />
            <button onClick={() => removeModule(mi)} className="text-red-400/30 hover:text-red-400"><Trash2 size={14} /></button>
          </div>
          {expandedModules.has(mi) && (
            <div className="space-y-2">
              {mod.lessons.map((lesson, li) => (
                <SortableLesson
                  key={li}
                  lesson={lesson}
                  moduleIndex={mi}
                  lessonIndex={li}
                  onUpdate={(updated: Lesson) => {
                    const newLessons = [...mod.lessons];
                    newLessons[li] = updated;
                    updateModule(mi, { ...mod, lessons: newLessons });
                  }}
                  onRemove={() => {
                    updateModule(mi, { ...mod, lessons: mod.lessons.filter((_, i) => i !== li) });
                  }}
                />
              ))}
              <button onClick={() => addLesson(mi)} className="text-sm text-teal/60 hover:text-teal ml-6">
                + Aggiungi lezione
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addModule}
        className="w-full border-2 border-dashed border-ochre/20 rounded-card py-3 text-ochre/40 hover:border-teal/40 hover:text-teal transition"
      >
        + Aggiungi modulo
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create course admin list and editor pages**

Create `app/(admin)/admin/corsi/page.tsx` (list with create) and `app/(admin)/admin/corsi/[id]/page.tsx` (course info form + CourseBuilder component + save). Follow the same pattern as page editor (Task 2.3) but with course-specific fields: title, slug, description (Tiptap), price, level select, category select, cover image, status, and the CourseBuilder for modules/lessons.

- [ ] **Step 4: Verify course admin**

```bash
npm run dev
```

Create a course, add modules and lessons, save, reload to verify persistence.

- [ ] **Step 5: Commit**

```bash
git add app/api/courses/ app/(admin)/admin/corsi/ components/admin/course-builder.tsx
git commit -m "feat: add course admin with module/lesson builder"
```

---

### Task 5.2: Public Course Pages + Stripe Checkout

**Files:**
- Create: `app/(public)/corsi/page.tsx`
- Create: `app/(public)/corsi/[slug]/page.tsx`
- Create: `app/api/checkout/route.ts`
- Create: `app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Create public courses listing**

```tsx
// app/(public)/corsi/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export default async function CoursesPage({ searchParams }: { searchParams: { cat?: string; level?: string } }) {
  const where: any = { status: "PUBLISHED" };
  if (searchParams.cat) where.category = searchParams.cat;
  if (searchParams.level) where.level = searchParams.level;

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      modules: { include: { lessons: true } },
      _count: { select: { enrollments: true } },
    },
  });

  const categories = ["Python", "GIS", "QGIS", "pyArchInit", "Scavo"];
  const levels = [
    { value: "BASE", label: "Base" },
    { value: "INTERMEDIO", label: "Intermedio" },
    { value: "AVANZATO", label: "Avanzato" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-mono text-teal mb-8">Corsi</h1>

      <div className="flex gap-2 mb-8 flex-wrap">
        <Link href="/corsi" className={`px-3 py-1 rounded-full text-sm ${!searchParams.cat ? "bg-teal text-primary" : "border border-ochre/30 text-sand/60"}`}>
          Tutti
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/corsi?cat=${cat}`}
            className={`px-3 py-1 rounded-full text-sm ${searchParams.cat === cat ? "bg-teal text-primary" : "border border-ochre/30 text-sand/60"}`}
          >
            {cat}
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
          const totalDuration = course.modules.reduce(
            (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.duration || 0), 0), 0
          );

          return (
            <Link
              key={course.id}
              href={`/corsi/${course.slug}`}
              className="bg-code-bg rounded-card overflow-hidden hover:ring-1 hover:ring-teal/30 hover:scale-[1.02] transition-all"
            >
              {course.coverImage && (
                <div className="relative aspect-video">
                  <Image src={course.coverImage} alt={course.title} fill className="object-cover" />
                </div>
              )}
              <div className="p-6">
                <div className="flex gap-2 mb-3">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-terracotta/10 text-terracotta">{course.level}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-ochre/10 text-ochre">{course.category}</span>
                </div>
                <h2 className="text-sand font-mono text-lg mb-2">{course.title}</h2>
                <p className="text-sand/40 text-sm mb-4">{totalLessons} lezioni &middot; {totalDuration} min</p>
                <p className="text-teal font-mono text-xl">
                  {course.price === 0 ? "Gratuito" : `€${course.price}`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create course detail page**

```tsx
// app/(public)/corsi/[slug]/page.tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";

async function CheckoutButton({ courseId, price }: { courseId: string; price: number }) {
  const session = await auth();

  if (price === 0) {
    return (
      <form action={`/api/checkout`} method="POST">
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="free" value="true" />
        <button className="w-full bg-teal text-primary font-mono font-bold py-3 rounded-full">
          Iscriviti gratis
        </button>
      </form>
    );
  }

  return (
    <form action="/api/checkout" method="POST">
      <input type="hidden" name="courseId" value={courseId} />
      <button className="w-full bg-teal text-primary font-mono font-bold py-3 rounded-full">
        Acquista €{price}
      </button>
    </form>
  );
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!course) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          {course.coverImage && (
            <div className="relative aspect-video rounded-card overflow-hidden mb-8">
              <Image src={course.coverImage} alt={course.title} fill className="object-cover" />
            </div>
          )}
          <div className="flex gap-2 mb-4">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-terracotta/10 text-terracotta">{course.level}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-ochre/10 text-ochre">{course.category}</span>
          </div>
          <h1 className="text-4xl font-mono text-teal mb-4">{course.title}</h1>
          <div className="prose prose-invert max-w-none mb-12" dangerouslySetInnerHTML={{ __html: course.description }} />

          <h2 className="text-2xl font-mono text-sand mb-6">Programma</h2>
          <div className="space-y-4">
            {course.modules.map((mod, mi) => (
              <details key={mod.id} className="bg-code-bg rounded-card" open={mi === 0}>
                <summary className="p-4 cursor-pointer text-sand font-medium hover:text-teal transition">
                  <span className="text-teal/40 font-mono text-sm mr-2">Modulo {mi + 1}</span>
                  {mod.title}
                  <span className="text-sand/30 text-sm ml-2">({mod.lessons.length} lezioni)</span>
                </summary>
                <div className="px-4 pb-4 space-y-2">
                  {mod.lessons.map((lesson, li) => (
                    <div key={lesson.id} className="flex items-center gap-3 py-2 border-t border-ochre/10">
                      <span className="text-sand/30 text-xs font-mono w-6">{li + 1}</span>
                      <span className="text-sand/70 text-sm flex-1">{lesson.title}</span>
                      <span className="text-xs text-ochre/50">{lesson.type}</span>
                      {lesson.isFree && <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded">Free</span>}
                      {lesson.duration && <span className="text-xs text-sand/30">{lesson.duration} min</span>}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-code-bg rounded-card p-6">
            <p className="text-3xl font-mono text-teal mb-4">
              {course.price === 0 ? "Gratuito" : `€${course.price}`}
            </p>
            <CheckoutButton courseId={course.id} price={course.price} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Stripe checkout API**

```typescript
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const formData = await req.formData();
  const courseId = formData.get("courseId") as string;
  const isFree = formData.get("free") === "true";

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id!, courseId } },
  });
  if (existing) {
    return NextResponse.redirect(new URL(`/dashboard`, req.url));
  }

  if (isFree || course.price === 0) {
    await prisma.enrollment.create({
      data: { userId: session.user.id!, courseId },
    });
    return NextResponse.redirect(new URL(`/dashboard`, req.url));
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: course.title },
          unit_amount: Math.round(course.price * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?enrolled=${courseId}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/corsi/${course.slug}`,
    metadata: { userId: session.user.id!, courseId },
  });

  return NextResponse.redirect(checkoutSession.url!);
}
```

- [ ] **Step 4: Create Stripe webhook handler**

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, courseId } = session.metadata!;

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { paymentId: session.payment_intent as string },
      create: {
        userId,
        courseId,
        paymentId: session.payment_intent as string,
      },
    });
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 5: Commit**

```bash
git add app/(public)/corsi/ app/api/checkout/ app/api/webhooks/
git commit -m "feat: add public course pages with Stripe checkout and webhook"
```

---

### Task 5.3: Student Dashboard + Lesson Player + Progress

**Files:**
- Create: `app/(lms)/dashboard/page.tsx`
- Create: `app/(lms)/dashboard/layout.tsx`
- Create: `app/(lms)/corsi/[slug]/lezioni/[id]/page.tsx`
- Create: `app/api/progress/route.ts`
- Create: `lib/lms.ts`

- [ ] **Step 1: Create LMS utility functions**

```typescript
// lib/lms.ts
import { prisma } from "./db";

export async function getCourseProgress(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: { lessons: true },
      },
    },
  });

  if (!course) return null;

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  if (totalLessons === 0) return { percentage: 0, completed: 0, total: 0 };

  const completedLessons = await prisma.lessonProgress.count({
    where: { userId, completed: true, lesson: { module: { courseId } } },
  });

  return {
    percentage: Math.round((completedLessons / totalLessons) * 100),
    completed: completedLessons,
    total: totalLessons,
  };
}
```

- [ ] **Step 2: Create student dashboard**

```tsx
// app/(lms)/dashboard/layout.tsx
import { requireAuth } from "@/lib/auth-utils";
import { Navbar } from "@/components/public/navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return (
    <>
      <Navbar />
      <main className="pt-16">{children}</main>
    </>
  );
}
```

```tsx
// app/(lms)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCourseProgress } from "@/lib/lms";
import Link from "next/link";
import Image from "next/image";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: { course: true },
    orderBy: { createdAt: "desc" },
  });

  const coursesWithProgress = await Promise.all(
    enrollments.map(async (e) => ({
      ...e,
      progress: await getCourseProgress(userId, e.courseId),
    }))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <h1 className="text-3xl font-mono text-teal mb-8">I miei corsi</h1>
      {coursesWithProgress.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sand/50 mb-4">Non sei iscritto a nessun corso.</p>
          <Link href="/corsi" className="bg-teal text-primary font-mono font-bold px-6 py-3 rounded-full">
            Esplora i corsi
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesWithProgress.map(({ course, progress }) => (
            <Link
              key={course.id}
              href={`/corsi/${course.slug}`}
              className="bg-code-bg rounded-card overflow-hidden hover:ring-1 hover:ring-teal/30 transition"
            >
              {course.coverImage && (
                <div className="relative aspect-video">
                  <Image src={course.coverImage} alt={course.title} fill className="object-cover" />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-sand font-mono mb-3">{course.title}</h2>
                <div className="w-full bg-primary rounded-full h-2 mb-2">
                  <div
                    className="bg-teal h-2 rounded-full transition-all"
                    style={{ width: `${progress?.percentage || 0}%` }}
                  />
                </div>
                <p className="text-sand/40 text-sm">
                  {progress?.completed}/{progress?.total} lezioni &middot; {progress?.percentage}%
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create lesson player page**

```tsx
// app/(lms)/corsi/[slug]/lezioni/[id]/page.tsx
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

async function MarkCompleteButton({ lessonId, userId, completed }: { lessonId: string; userId: string; completed: boolean }) {
  if (completed) {
    return <p className="text-teal font-mono text-sm">Completata</p>;
  }

  async function markComplete() {
    "use server";
    const { prisma: db } = await import("@/lib/db");
    await db.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { completed: true, completedAt: new Date() },
      create: { userId, lessonId, completed: true, completedAt: new Date() },
    });
  }

  return (
    <form action={markComplete}>
      <button className="bg-teal text-primary font-mono text-sm font-bold px-4 py-2 rounded-full">
        Segna come completata
      </button>
    </form>
  );
}

export default async function LessonPage({ params }: { params: { slug: string; id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: {
      module: {
        include: {
          course: true,
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!lesson) notFound();

  // Check enrollment (unless lesson is free)
  if (!lesson.isFree) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: session.user.id!, courseId: lesson.module.courseId },
      },
    });
    if (!enrollment) redirect(`/corsi/${params.slug}`);
  }

  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id!, lessonId: lesson.id } },
  });

  // Find next lesson
  const currentIndex = lesson.module.lessons.findIndex((l) => l.id === lesson.id);
  const nextLesson = lesson.module.lessons[currentIndex + 1];

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <p className="text-teal/40 text-sm font-mono mb-2">
        <Link href={`/corsi/${params.slug}`} className="hover:text-teal">{lesson.module.course.title}</Link>
        {" > "}{lesson.module.title}
      </p>
      <h1 className="text-3xl font-mono text-teal mb-8">{lesson.title}</h1>

      {/* Content based on type */}
      {lesson.type === "VIDEO" && (lesson.content as any).url && (
        <div className="aspect-video bg-code-bg rounded-card overflow-hidden mb-8">
          <iframe
            src={(lesson.content as any).url}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      )}

      {lesson.type === "TEXT" && (
        <div
          className="prose prose-invert max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: (lesson.content as any).html || "" }}
        />
      )}

      {lesson.type === "QUIZ" && (
        <div className="bg-code-bg rounded-card p-8 mb-8">
          <p className="text-sand/50">Quiz interattivo</p>
          {/* Quiz rendering would go here - questions from lesson.content */}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-ochre/10 pt-6">
        <MarkCompleteButton
          lessonId={lesson.id}
          userId={session.user.id!}
          completed={progress?.completed || false}
        />
        {nextLesson && (
          <Link
            href={`/corsi/${params.slug}/lezioni/${nextLesson.id}`}
            className="text-teal font-mono text-sm hover:underline"
          >
            Prossima lezione &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create progress API for client-side updates**

```typescript
// app/api/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId, completed, quizScore } = await req.json();

  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id!, lessonId } },
    update: {
      completed,
      completedAt: completed ? new Date() : null,
      quizScore,
    },
    create: {
      userId: session.user.id!,
      lessonId,
      completed,
      completedAt: completed ? new Date() : null,
      quizScore,
    },
  });

  return NextResponse.json(progress);
}
```

- [ ] **Step 5: Create certificate PDF generation**

```bash
npm install @react-pdf/renderer
```

```typescript
// lib/certificate.ts
import { prisma } from "./db";

export async function generateCertificateData(userId: string, courseId: string) {
  const [user, course, progress] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.course.findUnique({ where: { id: courseId } }),
    prisma.lessonProgress.count({
      where: { userId, completed: true, lesson: { module: { courseId } } },
    }),
  ]);

  const totalLessons = await prisma.lesson.count({
    where: { module: { courseId } },
  });

  if (!user || !course || progress < totalLessons) return null;

  return {
    studentName: user.name || user.email,
    courseName: course.title,
    completionDate: new Date().toLocaleDateString("it-IT"),
    courseLevel: course.level,
  };
}
```

Create `app/api/certificate/[courseId]/route.ts` that calls `generateCertificateData`, renders a PDF with course name, student name, date, and pyArchInit branding, returns it as `application/pdf`. Add a "Scarica certificato" button in the dashboard when a course is 100% complete.

- [ ] **Step 6: Verify LMS flow**

```bash
npm run dev
```

Test: enroll in free course, view dashboard, open lesson, mark complete, check progress bar updates. Complete all lessons, verify certificate download appears.

- [ ] **Step 7: Commit**

```bash
git add app/(lms)/ app/api/progress/ app/api/certificate/ lib/lms.ts lib/certificate.ts
git commit -m "feat: add student dashboard, lesson player, progress tracking, and certificates"
```

---

### Task 5.4: Students Admin

**Files:**
- Create: `app/(admin)/admin/studenti/page.tsx`
- Create: `app/api/students/route.ts`

- [ ] **Step 1: Create students API**

```typescript
// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const courseId = req.nextUrl.searchParams.get("course") || undefined;

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(courseId ? { enrollments: { some: { courseId } } } : {}),
    },
    include: {
      enrollments: {
        include: { course: { select: { title: true } } },
      },
      _count: { select: { lessonProgress: { where: { completed: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(students);
}

// Manual enrollment
export async function POST(req: NextRequest) {
  await requireAdmin();
  const { userId, courseId } = await req.json();

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });

  return NextResponse.json(enrollment);
}
```

- [ ] **Step 2: Create students admin page**

```tsx
// app/(admin)/admin/studenti/page.tsx
"use client";

import { useState, useEffect } from "react";

interface Student {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  enrollments: { course: { title: string }; createdAt: string }[];
  _count: { lessonProgress: number };
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetch("/api/students").then((r) => r.json()).then(setStudents);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-mono text-teal mb-6">Studenti</h1>
      <div className="space-y-3">
        {students.map((s) => (
          <div key={s.id} className="bg-code-bg rounded-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sand font-medium">{s.name || s.email}</h3>
                <p className="text-sand/40 text-sm">{s.email}</p>
              </div>
              <span className="text-sand/30 text-xs">
                {new Date(s.createdAt).toLocaleDateString("it-IT")}
              </span>
            </div>
            {s.enrollments.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {s.enrollments.map((e, i) => (
                  <span key={i} className="text-xs bg-teal/10 text-teal px-2 py-1 rounded">
                    {e.course.title}
                  </span>
                ))}
              </div>
            )}
            <p className="text-sand/30 text-xs mt-2">{s._count.lessonProgress} lezioni completate</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/students/ app/(admin)/admin/studenti/
git commit -m "feat: add students admin with enrollment list and manual assignment"
```

---

### Task 5.5: Documentation Admin

**Files:**
- Create: `app/(admin)/admin/docs/page.tsx`
- Create: `app/api/docs/route.ts`
- Create: `app/api/docs/[id]/route.ts`

- [ ] **Step 1: Create docs API routes**

```typescript
// app/api/docs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET() {
  await requireAdmin();
  const sections = await prisma.docSection.findMany({
    orderBy: { order: "asc" },
    include: {
      pages: { orderBy: { order: "asc" } },
      children: {
        orderBy: { order: "asc" },
        include: { pages: { orderBy: { order: "asc" } } },
      },
    },
  });
  return NextResponse.json(sections);
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const { type, title, sectionId } = await req.json();

  if (type === "section") {
    const count = await prisma.docSection.count();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const section = await prisma.docSection.create({
      data: { title, slug, order: count },
    });
    return NextResponse.json(section);
  }

  if (type === "page" && sectionId) {
    const count = await prisma.docPage.count({ where: { sectionId } });
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const page = await prisma.docPage.create({
      data: { title, slug, content: "", order: count, sectionId },
    });
    return NextResponse.json(page);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
```

```typescript
// app/api/docs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const { title, content } = await req.json();

  // Save version before updating
  const current = await prisma.docPage.findUnique({ where: { id: params.id } });
  if (current && current.content) {
    await prisma.docVersion.create({
      data: { content: current.content, pageId: params.id },
    });
  }

  const page = await prisma.docPage.update({
    where: { id: params.id },
    data: { title, content },
  });

  return NextResponse.json(page);
}
```

- [ ] **Step 2: Create docs admin page with tree view and markdown editor**

Build `app/(admin)/admin/docs/page.tsx` as a split-pane layout: left side shows a collapsible tree of sections and pages (with add section/page buttons), right side shows a markdown editor (textarea with preview toggle) for the selected page. Save triggers PUT to `/api/docs/[id]` which auto-versions.

- [ ] **Step 3: Verify docs admin**

```bash
npm run dev
```

Create a section, add a page, write markdown, save, verify versioning.

- [ ] **Step 4: Commit**

```bash
git add app/api/docs/ app/(admin)/admin/docs/
git commit -m "feat: add documentation admin with tree structure and versioning"
```

---

## Final Verification

### Task 6.1: Full Integration Test

- [ ] **Step 1: Verify Docker Compose builds**

```bash
docker compose build
```

Expected: Build completes successfully.

- [ ] **Step 2: Verify full stack runs**

```bash
docker compose up -d
docker compose exec app npx prisma db push
docker compose exec app npx prisma db seed
```

- [ ] **Step 3: Smoke test all routes**

Navigate to:
- `/` — landing page animation
- `/home` — homepage with all sections
- `/corsi` — course listing
- `/docs` — documentation
- `/blog` — blog listing
- `/servizi` — services page
- `/community` — community page
- `/contatti` — contact form
- `/admin` — admin dashboard (after login)
- `/admin/pagine` — page editor
- `/admin/corsi` — course builder
- `/admin/media` — media library
- `/admin/blog` — blog editor
- `/admin/docs` — docs editor
- `/admin/studenti` — students list
- `/admin/contatti` — contacts
- `/admin/impostazioni` — settings

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration fixes from full stack smoke test"
```
