export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Image from "next/image";
import { PlayCircle, ExternalLink } from "lucide-react";
import { getServerLocale, t } from "@/lib/i18n";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Video Tutorial | pyArchInit",
  description: "Video tutorial ufficiali di pyArchInit: guide passo-passo per imparare ad usare il plugin QGIS per l'archeologia.",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export default async function VideoPage() {
  const locale = await getServerLocale();

  const videos: Array<{
    id: string;
    youtubeId: string;
    title: string;
    category: string;
    description: string | null;
    order: number;
  }> = await db.video.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });

  const categories = Array.from(new Set(videos.map((v) => v.category)));

  return (
    <main>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-16 border-b border-sand/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/images/logo_pyarchinit_official.png"
              alt="pyArchInit"
              width={40}
              height={40}
            />
            <p className="text-teal font-mono text-xs tracking-widest uppercase">
              {t(locale, "video.header.label")}
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold text-sand mb-3">
            {t(locale, "video.learn")}
          </h1>
          <p className="text-sand/60 text-base max-w-xl mb-4">
            {t(locale, "video.desc.prefix")}
            {videos.length}
            {t(locale, "video.desc.suffix")}
          </p>
          <a
            href="https://www.youtube.com/@pyarchinit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-teal text-sm font-mono hover:underline"
          >
            <PlayCircle size={16} />
            {t(locale, "video.channel")}
            <ExternalLink size={12} />
          </a>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {categories.map((cat) => (
          <div key={cat} className="mb-12">
            <h2 className="text-sm font-mono text-teal uppercase tracking-widest mb-6 flex items-center gap-2">
              <PlayCircle size={14} />
              {t(locale, `video.cat.${cat}`) || cat}
              <span className="text-sand/20 font-normal">
                ({videos.filter((v) => v.category === cat).length})
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.filter((v) => v.category === cat).map((video) => (
                <a
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-code-bg border border-sand/8 hover:border-teal/25 rounded-card overflow-hidden transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-primary">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:opacity-80 transition"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center group-hover:bg-teal/90 transition">
                        <PlayCircle size={24} className="text-teal group-hover:text-primary transition" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm text-sand/80 group-hover:text-teal transition font-medium leading-snug">
                      {video.title}
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
