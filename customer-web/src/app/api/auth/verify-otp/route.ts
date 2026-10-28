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

    const trimmedOtp = String(otp).trim();
    const record = otpStore.get(phone);

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          messageEn: "No active OTP request found for this number. Please request a new code.",
          messageBn: "এই নম্বরে কোনো সচল ওটিপি পাওয়া যায়নি। নতুন কোড রিকোয়েস্ট করুন।",
        },
        { status: 400 }
      );
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(phone);
      return NextResponse.json(
        {
          success: false,
          messageEn: "OTP code has expired. Please request a new code.",
          messageBn: "ওটিপি কোডের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার কোড চান।",
        },
        { status: 400 }
      );
    }

    if (record.code !== trimmedOtp) {
      return NextResponse.json(
        {
          success: false,
          messageEn: "Incorrect OTP code. Please enter the exact code received via SMS.",
          messageBn: "ভুল ওটিপি কোড। অনুগ্রহ করে এসএমএসে আসা সঠিক কোডটি লিখুন।",
        },
        { status: 400 }
      );
    }

    // Code matches! Consume it so it cannot be re-used
    otpStore.delete(phone);

    return NextResponse.json({
      success: true,
      messageEn: "Mobile number verified successfully.",
      messageBn: "মোবাইল নম্বর সফলভাবে যাচাই হয়েছে।",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, messageEn: "Internal server error", messageBn: "সার্ভারে ত্রুটি হয়েছে" },
      { status: 500 }
    );
  }
}
