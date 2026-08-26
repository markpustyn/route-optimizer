import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { codes } from "@/drizzle/schema";

const codeSchema = z.object({
  gateCode: z.string().trim().min(1).max(255),
  street: z.string().trim().min(2).max(255),
  city: z.string().trim().min(2).max(255),
  state: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/)
    .transform((value) => value.toUpperCase()),
  zipCode: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/),
  latitude: z
    .string()
    .trim()
    .refine((value) => {
      const latitude = Number(value);

      return (
        Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90
      );
    }),
  longitude: z
    .string()
    .trim()
    .refine((value) => {
      const longitude = Number(value);

      return (
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180
      );
    }),
  notes: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const validation = codeSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Invalid gate code information.",
        fields: validation.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const [createdCode] = await db
      .insert(codes)
      .values({
        gateCode: validation.data.gateCode,
        street: validation.data.street,
        city: validation.data.city,
        state: validation.data.state,
        zipCode: validation.data.zipCode,
        latitude: validation.data.latitude,
        longitude: validation.data.longitude,
        notes: validation.data.notes || null,
      })
      .returning({
        id: codes.id,
        street: codes.street,
        city: codes.city,
        state: codes.state,
        zipCode: codes.zipCode,
      });

    return NextResponse.json(
      {
        message: "Gate code added successfully.",
        code: createdCode,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unable to create gate code:", error);

    return NextResponse.json(
      { error: "Unable to save gate code." },
      { status: 500 },
    );
  }
}

import { and, isNotNull, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const latitude = Number(searchParams.get("latitude"));
  const longitude = Number(searchParams.get("longitude"));
  const requestedRadius = Number(searchParams.get("radius") ?? 10);

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      {
        error: "Valid latitude and longitude are required.",
      },
      { status: 400 },
    );
  }

  const radius = Math.min(
    Math.max(
      Number.isFinite(requestedRadius) ? requestedRadius : 10,
      1,
    ),
    100,
  );

  const distance = sql<number>`
    3959 * acos(
      least(
        1,
        greatest(
          -1,
          cos(radians(${latitude})) *
          cos(
            radians(
              cast(nullif(${codes.latitude}, '') as double precision)
            )
          ) *
          cos(
            radians(
              cast(nullif(${codes.longitude}, '') as double precision)
            ) - radians(${longitude})
          ) +
          sin(radians(${latitude})) *
          sin(
            radians(
              cast(nullif(${codes.latitude}, '') as double precision)
            )
          )
        )
      )
    )
  `;

  try {
    const nearbyCodes = await db
      .select({
        id: codes.id,
        gateCode: codes.gateCode,
        street: codes.street,
        city: codes.city,
        state: codes.state,
        zipCode: codes.zipCode,
        latitude: codes.latitude,
        longitude: codes.longitude,
        notes: codes.notes,
        distance,
      })
      .from(codes)
      .where(
        and(
          isNotNull(codes.latitude),
          isNotNull(codes.longitude),
          sql`${codes.latitude} <> ''`,
          sql`${codes.longitude} <> ''`,
        ),
      )
      .orderBy(distance);

    return NextResponse.json({
      codes: nearbyCodes,
      radius,
      count: nearbyCodes.length,
    });
  } catch (error) {
    console.error("Unable to fetch nearby gate codes:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch nearby gate codes.",
      },
      { status: 500 },
    );
  }
}