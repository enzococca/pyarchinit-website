import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { SearchProvider } from "@/components/public/search-provider";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const publishedPages = await prisma.page.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    select: { slug: true, title: true },
  });

  return (
    <SearchProvider>
      <Navbar />
      <div className="pt-16">{children}</div>
      <Footer cmsPages={publishedPages} />
    </SearchProvider>
  );
}
