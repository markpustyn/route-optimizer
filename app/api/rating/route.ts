import { db } from "@/db/client";
import { ratings } from "@/drizzle/schema";
import { NextResponse } from "next/server";

export type RatingRequestBody = {
  codeId: number;
  works: string;
  comment?: string;
};

export async function POST(request: Request) {
  let body: RatingRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const [createdRating] = await db.insert(ratings).values({
      codeId: body.codeId,
      works: body.works,
      comment: " ",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: "Gate code added successfully.",
        code: createdRating,
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
