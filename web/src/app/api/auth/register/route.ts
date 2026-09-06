import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePassword } from "@/lib/validation";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, อีเมล, รหัสผ่าน)" },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานในระบบแล้ว กรุณาเข้าสู่ระบบ" },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in PostgreSQL database
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "สมัครสมาชิกสำเร็จ",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Register Error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
