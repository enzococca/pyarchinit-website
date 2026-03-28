import { prisma } from "./db";

const FLYOVER_API = "https://flyover.adarteinfo.it/wp-json/wc/store/v1/products";

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

interface FlyoverProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_code: string;
  };
  images: { id: number; src: string; alt: string }[];
  categories: { id: number; name: string; slug: string }[];
  permalink: string;
}

export async function syncFlyoverCourses() {
  let res: Response;
  try {
    res = await fetch(`${FLYOVER_API}?per_page=50&category=130`, {
      next: { revalidate: 0 },
    });
  } catch (err) {
    console.error("Failed to reach Flyover API:", err);
    return { synced: 0, removed: 0, errors: ["Network error: Flyover API unreachable"] };
  }

  if (!res.ok) {
    console.error("Failed to fetch Flyover courses:", res.status);
    return { synced: 0, removed: 0, errors: [`HTTP ${res.status} from Flyover API`] };
  }

  let products: FlyoverProduct[];
  try {
    products = await res.json();
  } catch (err) {
    console.error("Failed to parse Flyover response:", err);
    return { synced: 0, removed: 0, errors: ["Invalid JSON from Flyover API"] };
  }

  if (!Array.isArray(products)) {
    return { synced: 0, removed: 0, errors: ["Unexpected response format from Flyover API"] };
  }

  // Filter to only pyArchInit/QGIS-related courses
  const filteredProducts = products.filter((p) => {
    const titleLower = p.name.toLowerCase();
    const catNames = p.categories.map((c) => c.name.toLowerCase()).join(" ");
    const combined = `${titleLower} ${catNames}`;
    return combined.includes("pyarchinit") || combined.includes("qgis");
  });

  let synced = 0;
  const errors: string[] = [];

  for (const product of filteredProducts) {
    try {
      const price = parseInt(product.prices.price) / 100; // WC Store API returns cents
      const salePrice = product.prices.sale_price
        ? parseInt(product.prices.sale_price) / 100
        : price;

      const coverImage = product.images?.[0]?.src || null;

      // Determine category from product categories
      const catNames = product.categories.map((c) => c.name.toLowerCase());
      let category = "pyArchInit";
      if (catNames.some((c) => c.includes("gis"))) category = "GIS";
      if (catNames.some((c) => c.includes("drone"))) category = "Drone";
      if (catNames.some((c) => c.includes("restauro"))) category = "Restauro";
      if (catNames.some((c) => c.includes("architettura"))) category = "Architettura";
      if (catNames.some((c) => c.includes("archeologia"))) category = "Archeologia";
      if (catNames.some((c) => c.includes("pyarchinit"))) category = "pyArchInit";

      // Strip HTML from description
      const description = product.description
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;|&#8221;/g, '"')
        .trim();

      const slug = `flyover-${product.slug}`;
      const title = decodeHtmlEntities(product.name);

      await prisma.course.upsert({
        where: { slug },
        update: {
          title,
          description,
          price: salePrice || price,
          coverImage,
          category,
          status: "PUBLISHED",
        },
        create: {
          title,
          slug,
          description,
          price: salePrice || price,
          coverImage,
          level: "BASE",
          category,
          status: "PUBLISHED",
        },
      });

      synced++;
    } catch (err) {
      errors.push(`${product.name}: ${err}`);
    }
  }

  // Remove courses that no longer exist on Flyover (only among filtered/pyArchInit ones)
  const flyoverSlugs = filteredProducts.map((p) => `flyover-${p.slug}`);
  let removed = 0;
  try {
    const result = await prisma.course.deleteMany({
      where: {
        slug: { startsWith: "flyover-", notIn: flyoverSlugs },
      },
    });
    removed = result.count;
  } catch (err) {
    errors.push(`Cleanup error: ${err}`);
  }

  return { synced, removed, errors };
}
