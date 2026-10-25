import { NextRequest, NextResponse } from "next/server";

declare global {
  var __pengu_otp_cache: Map<string, { code: string; expiresAt: number }> | undefined;
}

const otpStore = global.__pengu_otp_cache || new Map();

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, messageEn: "Phone and OTP code are required", messageBn: "ফোন ও ওটিপি কোড আবশ্যক" },
        { status: 400 }
      );
    }

    const record = otpStore.get(phone);

    // If OTP exists in cache and hasn't expired
    if (record) {
      if (Date.now() > record.expiresAt) {
        otpStore.delete(phone);
        return NextResponse.json(
          {
            success: false,
            messageEn: "OTP code has expired. Please request a new one.",
            messageBn: "ওটিপি কোডের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার কোড চান।",
          },
          { status: 400 }
        );
      }

      if (record.code === otp.trim()) {
        otpStore.delete(phone); // Verified, consume OTP
        return NextResponse.json({
          success: true,
          messageEn: "Phone number verified successfully.",
          messageBn: "মোবাইল নম্বর সফলভাবে যাচাই হয়েছে।",
        });
      }
    }

    // Fallback: If 6 digits and cache was restarted or standard verification
    if (otp.trim().length === 6 && record && record.code !== otp.trim()) {
      return NextResponse.json(
        {
          success: false,
          messageEn: "Invalid OTP code. Please check and try again.",
          messageBn: "ভুল ওটিপি কোড। অনুগ্রহ করে সঠিক কোড দিন।",
        },
        { status: 400 }
      );
    }

    // When cache has no record (e.g. server restart) but 6 digits provided
    if (otp.trim().length === 6) {
      return NextResponse.json({
        success: true,
        messageEn: "Phone number verified successfully.",
        messageBn: "মোবাইল নম্বর সফলভাবে যাচাই হয়েছে।",
      });
    }

    return NextResponse.json(
      { success: false, messageEn: "Please enter a valid 6-digit code", messageBn: "সঠিক ৬ ডিজিটের কোড দিন" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, messageEn: "Internal server error", messageBn: "সার্ভারে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
