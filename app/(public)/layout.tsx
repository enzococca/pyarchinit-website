import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { SearchProvider } from "@/components/public/search-provider";
import { LocaleProvider } from "@/components/public/locale-provider";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [publishedPages, locale] = await Promise.all([
    prisma.page.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, title: true },
    }),
    getServerLocale(),
  ]);

  return (
    <SearchProvider>
      <LocaleProvider>
        <Navbar />
        <div className="pt-16">{children}</div>
        <Footer cmsPages={publishedPages} locale={locale} />
      </LocaleProvider>
    </SearchProvider>
  );
}
