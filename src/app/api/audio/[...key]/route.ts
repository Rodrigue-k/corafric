import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    const objectKey = key.join("/");

    if (!objectKey) {
      return new NextResponse("Key is required", { status: 400 });
    }

    // Fetch object from R2
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Convert S3 stream to Web ReadableStream
    const stream = response.Body.transformToWebStream();

    const headers = new Headers();
    headers.set("Content-Type", response.ContentType || "audio/webm");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }

    return new NextResponse(stream, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    console.error("Error serving audio from R2:", error);
    return new NextResponse("Audio file not found or inaccessible", { status: 404 });
  }
}
