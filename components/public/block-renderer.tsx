import Image from "next/image";
import Link from "next/link";
import type { Block } from "@/lib/blocks";

interface BlockRendererProps {
  blocks: Block[];
}

function TextBlock({ data }: { data: Record<string, any> }) {
  return (
    <div
      className="prose prose-invert max-w-none prose-headings:font-mono prose-headings:text-teal prose-p:text-sand/80 prose-a:text-teal prose-strong:text-sand prose-code:text-teal prose-pre:bg-code-bg"
      dangerouslySetInnerHTML={{ __html: data.content ?? "" }}
    />
  );
}

function ImageBlock({ data }: { data: Record<string, any> }) {
  if (!data.src) return null;
  return (
    <figure className="my-6">
      <div className="relative aspect-video rounded-card overflow-hidden">
        <Image
          src={data.src}
          alt={data.alt ?? ""}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </div>
      {data.caption && (
        <figcaption className="text-center text-sm text-sand/50 mt-2 italic">
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}

function HeroBlock({ data }: { data: Record<string, any> }) {
  return (
    <section
      className="relative w-full py-24 flex items-center justify-center text-center overflow-hidden"
      style={
        data.bgImage
          ? {
              backgroundImage: `url(${data.bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : { background: "linear-gradient(135deg, #0F1729 0%, #1A1E2E 100%)" }
      }
    >
      {data.bgImage && <div className="absolute inset-0 bg-primary/70" />}
      <div className="relative z-10 max-w-3xl mx-auto px-4">
        {data.title && (
          <h1 className="text-4xl sm:text-5xl font-mono font-bold text-sand mb-4">
            {data.title}
          </h1>
        )}
        {data.subtitle && (
          <p className="text-lg text-sand/70 mb-8">{data.subtitle}</p>
        )}
        {data.cta && (
          <Link
            href={data.cta.href ?? "#"}
            className="inline-flex items-center px-6 py-3 rounded-card bg-teal text-primary font-medium hover:bg-teal/90 transition-colors"
          >
            {data.cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}

function CtaBlock({ data }: { data: Record<string, any> }) {
  const buttons: Array<{ label: string; href: string; variant?: string }> =
    data.buttons ?? [];
  return (
    <section className="py-16 text-center">
      {data.title && (
        <h2 className="text-3xl font-mono font-bold text-sand mb-4">{data.title}</h2>
      )}
      {data.description && (
        <p className="text-sand/60 mb-8 max-w-xl mx-auto">{data.description}</p>
      )}
      {buttons.length > 0 && (
        <div className="flex flex-wrap gap-4 justify-center">
          {buttons.map((btn, i) => (
            <Link
              key={i}
              href={btn.href ?? "#"}
              className={
                btn.variant === "outline"
                  ? "inline-flex items-center px-6 py-3 rounded-card border border-sand/20 text-sand hover:border-sand/40 transition-colors"
                  : "inline-flex items-center px-6 py-3 rounded-card bg-teal text-primary font-medium hover:bg-teal/90 transition-colors"
              }
            >
              {btn.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function CodeBlock({ data }: { data: Record<string, any> }) {
  return (
    <div className="my-6">
      {data.language && (
        <div className="flex items-center gap-2 bg-code-bg/80 rounded-t-card px-4 py-2 border-b border-sand/10">
          <span className="text-xs font-mono text-teal/70">{data.language}</span>
        </div>
      )}
      <pre className="bg-code-bg rounded-b-card rounded-t-none p-4 overflow-x-auto">
        <code className="text-sm font-mono text-sand/80 whitespace-pre">
          {data.code ?? ""}
        </code>
      </pre>
    </div>
  );
}

function GridBlock({ data }: { data: Record<string, any> }) {
  const items: Array<{ title?: string; description?: string; image?: string }> =
    data.items ?? [];
  const cols = data.columns ?? 3;
  return (
    <div
      className={`grid gap-6 my-6`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {items.map((item, i) => (
        <div key={i} className="bg-code-bg rounded-card p-6 border border-sand/10">
          {item.image && (
            <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
              <Image
                src={item.image}
                alt={item.title ?? ""}
                fill
                className="object-cover"
                sizes="400px"
              />
            </div>
          )}
          {item.title && (
            <h3 className="font-mono font-bold text-sand mb-2">{item.title}</h3>
          )}
          {item.description && (
            <p className="text-sm text-sand/60">{item.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function VideoBlock({ data }: { data: Record<string, any> }) {
  if (!data.url) return null;

  // Handle YouTube embeds
  let embedUrl = data.url;
  const ytMatch = data.url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/
  );
  if (ytMatch) {
    embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  return (
    <figure className="my-6">
      <div className="relative aspect-video rounded-card overflow-hidden">
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={data.caption ?? "Video"}
        />
      </div>
      {data.caption && (
        <figcaption className="text-center text-sm text-sand/50 mt-2 italic">
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        switch (block.type) {
          case "text":
            return <TextBlock key={block.id} data={block.data} />;
          case "image":
            return <ImageBlock key={block.id} data={block.data} />;
          case "hero":
            return <HeroBlock key={block.id} data={block.data} />;
          case "cta":
            return <CtaBlock key={block.id} data={block.data} />;
          case "code":
            return <CodeBlock key={block.id} data={block.data} />;
          case "grid":
            return <GridBlock key={block.id} data={block.data} />;
          case "video":
            return <VideoBlock key={block.id} data={block.data} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
