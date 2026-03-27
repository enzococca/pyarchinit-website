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
