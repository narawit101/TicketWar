import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePassword } from "@/lib/validation";
import { uploadUserProfileImage, deleteCloudinaryImage } from "@/lib/cloudinary";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, name, avatarUrl, newPassword } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "ไม่พบรหัสผู้ใช้งาน (User ID)" },
        { status: 400 }
      );
    }

    // Find existing user in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลผู้ใช้งานในระบบ" },
        { status: 404 }
      );
    }

    const updateData: {
      name?: string;
      avatarUrl?: string | null;
      passwordHash?: string;
    } = {};

    // 1. Update Name
    if (typeof name === "string") {
      const trimmed = name.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: "ชื่อที่แสดงไม่สามารถเว้นว่างได้" },
          { status: 400 }
        );
      }
      updateData.name = trimmed;
    }

    // 2. Update Avatar (Cloudinary: folder ticketwar/userprofile)
    if (avatarUrl !== undefined) {
      if (typeof avatarUrl === "string" && avatarUrl.startsWith("data:image/")) {
        // Delete previous Cloudinary image if exists
        if (user.avatarUrl) {
          await deleteCloudinaryImage(user.avatarUrl);
        }
        // Upload new image to folder ticketwar/userprofile
        const uploadedUrl = await uploadUserProfileImage(avatarUrl, user.id);
        updateData.avatarUrl = uploadedUrl;
      } else if (avatarUrl === null) {
        // User removed photo: delete previous image from Cloudinary
        if (user.avatarUrl) {
          await deleteCloudinaryImage(user.avatarUrl);
        }
        updateData.avatarUrl = null;
      }
    }

    // 3. Update Password (if requested)
    if (newPassword) {
      // Validate new password rules (8+ chars, upper, lower, number)
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    // Execute database update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      message: "อัปเดตข้อมูลสำเร็จ",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[Profile Update Error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
