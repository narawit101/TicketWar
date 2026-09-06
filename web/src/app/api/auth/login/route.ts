import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกอีเมลและรหัสผ่าน" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้นี้ หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Return sanitized user
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };

    return NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: sanitizedUser,
    });
  } catch (error) {
    console.error("[Login Error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
