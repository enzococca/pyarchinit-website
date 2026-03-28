import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}

interface LessonInput {
  id?: string;
  title: string;
  type: "VIDEO" | "TEXT" | "QUIZ" | "EXERCISE";
  isFree: boolean;
  order: number;
  duration?: number;
  content?: object;
}

interface ModuleInput {
  id?: string;
  title: string;
  order: number;
  lessons: LessonInput[];
}


export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const body = await req.json();
  const {
    title,
    slug,
    description,
    price,
    level,
    category,
    coverImage,
    status,
    modules,
  } = body;

  // 1. Update course fields
  await prisma.course.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(level !== undefined && { level }),
      ...(category !== undefined && { category }),
      ...(coverImage !== undefined && { coverImage }),
      ...(status !== undefined && { status }),
    },
  });

  // 2. Sync modules and lessons
  if (Array.isArray(modules)) {
    const incomingModuleIds = (modules as ModuleInput[])
      .filter((m) => m.id)
      .map((m) => m.id as string);

    // Delete modules not in request
    await prisma.module.deleteMany({
      where: {
        courseId: params.id,
        id: { notIn: incomingModuleIds },
      },
    });

    for (const mod of modules as ModuleInput[]) {
      let moduleId: string;

      if (mod.id) {
        // Update existing module
        await prisma.module.update({
          where: { id: mod.id },
          data: { title: mod.title, order: mod.order },
        });
        moduleId = mod.id;
      } else {
        // Create new module
        const newMod = await prisma.module.create({
          data: {
            title: mod.title,
            order: mod.order,
            courseId: params.id,
          },
        });
        moduleId = newMod.id;
      }

      // Sync lessons for this module
      if (Array.isArray(mod.lessons)) {
        const incomingLessonIds = mod.lessons
          .filter((l) => l.id)
          .map((l) => l.id as string);

        await prisma.lesson.deleteMany({
          where: {
            moduleId,
            id: { notIn: incomingLessonIds },
          },
        });

        for (const lesson of mod.lessons) {
          if (lesson.id) {
            await prisma.lesson.update({
              where: { id: lesson.id },
              data: {
                title: lesson.title,
                type: lesson.type,
                isFree: lesson.isFree,
                order: lesson.order,
                ...(lesson.duration !== undefined && { duration: lesson.duration }),
              },
            });
          } else {
            await prisma.lesson.create({
              data: {
                title: lesson.title,
                type: lesson.type,
                isFree: lesson.isFree ?? false,
                order: lesson.order,
                content: lesson.content ?? {},
                moduleId,
              },
            });
          }
        }
      }
    }
  }

  // 3. Return full course with modules+lessons
  const updated = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  return NextResponse.json(updated);
}


export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  await prisma.course.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
