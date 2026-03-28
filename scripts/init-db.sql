-- pyArchInit Website - Database Schema Init
CREATE TABLE IF NOT EXISTS "User" (id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE NOT NULL, "emailVerified" TIMESTAMP, "passwordHash" TEXT, image TEXT, role TEXT NOT NULL DEFAULT 'STUDENT', "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS "Account" (id TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, type TEXT NOT NULL, provider TEXT NOT NULL, "providerAccountId" TEXT NOT NULL, refresh_token TEXT, access_token TEXT, expires_at INT, token_type TEXT, scope TEXT, id_token TEXT, session_state TEXT, UNIQUE(provider, "providerAccountId"));
CREATE TABLE IF NOT EXISTS "Session" (id TEXT PRIMARY KEY, "sessionToken" TEXT UNIQUE NOT NULL, "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, expires TIMESTAMP NOT NULL);
CREATE TABLE IF NOT EXISTS "VerificationToken" (identifier TEXT NOT NULL, token TEXT UNIQUE NOT NULL, expires TIMESTAMP NOT NULL, UNIQUE(identifier, token));
CREATE TABLE IF NOT EXISTS "Page" (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, blocks JSONB NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'DRAFT', "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS "Media" (id TEXT PRIMARY KEY, filename TEXT NOT NULL, path TEXT NOT NULL, "mimeType" TEXT NOT NULL, size INT NOT NULL, width INT, height INT, alt TEXT, folder TEXT NOT NULL DEFAULT '/', "createdAt" TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS "BlogPost" (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, excerpt TEXT, blocks JSONB NOT NULL DEFAULT '[]', "coverImage" TEXT, status TEXT NOT NULL DEFAULT 'DRAFT', "publishedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS "BlogCategory" (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS "BlogTag" (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS "Course" (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT NOT NULL, "coverImage" TEXT, price FLOAT NOT NULL, level TEXT NOT NULL, category TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT', "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS "Module" (id TEXT PRIMARY KEY, title TEXT NOT NULL, "order" INT NOT NULL, "courseId" TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS "Lesson" (id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, content JSONB NOT NULL, duration INT, "order" INT NOT NULL, "moduleId" TEXT NOT NULL REFERENCES "Module"(id) ON DELETE CASCADE, "isFree" BOOLEAN NOT NULL DEFAULT false);
CREATE TABLE IF NOT EXISTS "Enrollment" (id TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, "courseId" TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'ACTIVE', "paymentId" TEXT, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), UNIQUE("userId", "courseId"));
CREATE TABLE IF NOT EXISTS "LessonProgress" (id TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, "lessonId" TEXT NOT NULL REFERENCES "Lesson"(id) ON DELETE CASCADE, completed BOOLEAN NOT NULL DEFAULT false, "completedAt" TIMESTAMP, "quizScore" FLOAT, UNIQUE("userId", "lessonId"));
CREATE TABLE IF NOT EXISTS "DocSection" (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, "order" INT NOT NULL, "parentId" TEXT REFERENCES "DocSection"(id));
CREATE TABLE IF NOT EXISTS "DocPage" (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, content TEXT NOT NULL, "order" INT NOT NULL, "sectionId" TEXT NOT NULL REFERENCES "DocSection"(id) ON DELETE CASCADE, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS "DocVersion" (id TEXT PRIMARY KEY, content TEXT NOT NULL, "pageId" TEXT NOT NULL REFERENCES "DocPage"(id) ON DELETE CASCADE, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS "Contact" (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'NEW', "createdAt" TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS "SiteSetting" (key TEXT PRIMARY KEY, value JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS "Testimonial" (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, entity TEXT NOT NULL, quote TEXT NOT NULL, image TEXT, "order" INT NOT NULL DEFAULT 0, visible BOOLEAN NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS "ForumCategory" (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT, "order" INT NOT NULL DEFAULT 0, color TEXT NOT NULL DEFAULT '#00D4AA');
CREATE TABLE IF NOT EXISTS "ForumThread" (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, content TEXT NOT NULL, pinned BOOLEAN NOT NULL DEFAULT false, locked BOOLEAN NOT NULL DEFAULT false, views INT NOT NULL DEFAULT 0, "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, "categoryId" TEXT NOT NULL REFERENCES "ForumCategory"(id) ON DELETE CASCADE, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS "ForumReply" (id TEXT PRIMARY KEY, content TEXT NOT NULL, "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, "threadId" TEXT NOT NULL REFERENCES "ForumThread"(id) ON DELETE CASCADE, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, confirmed BOOLEAN NOT NULL DEFAULT false, "confirmToken" TEXT UNIQUE, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "unsubscribedAt" TIMESTAMP);
CREATE TABLE IF NOT EXISTS "NewsletterCampaign" (id TEXT PRIMARY KEY, subject TEXT NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT', "sentAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS "_BlogCategoryToBlogPost" ("A" TEXT NOT NULL REFERENCES "BlogCategory"(id) ON DELETE CASCADE, "B" TEXT NOT NULL REFERENCES "BlogPost"(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS "_BlogPostToBlogTag" ("A" TEXT NOT NULL REFERENCES "BlogPost"(id) ON DELETE CASCADE, "B" TEXT NOT NULL REFERENCES "BlogTag"(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS "Module_courseId_idx" ON "Module"("courseId");
CREATE INDEX IF NOT EXISTS "Lesson_moduleId_idx" ON "Lesson"("moduleId");
CREATE INDEX IF NOT EXISTS "ForumThread_categoryId_idx" ON "ForumThread"("categoryId");
CREATE INDEX IF NOT EXISTS "ForumThread_userId_idx" ON "ForumThread"("userId");
CREATE INDEX IF NOT EXISTS "ForumReply_threadId_idx" ON "ForumReply"("threadId");
CREATE INDEX IF NOT EXISTS "ForumReply_userId_idx" ON "ForumReply"("userId");

-- Admin user (password: admin123, bcrypt hash)
INSERT INTO "User" (id, name, email, "passwordHash", role, "createdAt", "updatedAt")
VALUES ('admin-001', 'Admin', 'admin@pyarchinit.org', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO "SiteSetting" (key, value) VALUES ('site_name', '"pyArchInit"') ON CONFLICT (key) DO NOTHING;
INSERT INTO "SiteSetting" (key, value) VALUES ('site_description', '"Piattaforma Open Source per Archeologia"') ON CONFLICT (key) DO NOTHING;
INSERT INTO "SiteSetting" (key, value) VALUES ('social_github', '"https://github.com/pyarchinit"') ON CONFLICT (key) DO NOTHING;

INSERT INTO "ForumCategory" (id, name, slug, description, "order", color) VALUES ('fc-01', 'Generale', 'generale', 'Discussioni generali su pyArchInit', 0, '#00D4AA') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "ForumCategory" (id, name, slug, description, "order", color) VALUES ('fc-02', 'Supporto Tecnico', 'supporto', 'Problemi tecnici e richieste di aiuto', 1, '#D4712A') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "ForumCategory" (id, name, slug, description, "order", color) VALUES ('fc-03', 'Sviluppo', 'sviluppo', 'Discussioni sullo sviluppo del plugin', 2, '#8B7355') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "ForumCategory" (id, name, slug, description, "order", color) VALUES ('fc-04', 'Showcase', 'showcase', 'Condividi i tuoi progetti e risultati', 3, '#22C55E') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "ForumCategory" (id, name, slug, description, "order", color) VALUES ('fc-05', 'Proposte', 'proposte', 'Proponi nuove funzionalita e miglioramenti', 4, '#3B82F6') ON CONFLICT (slug) DO NOTHING;

SELECT 'Database initialized successfully!' as result;
