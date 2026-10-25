import { NextRequest, NextResponse } from "next/server";

// In-memory OTP storage for verification (or Redis / DB in high-volume production)
// Key: phone, Value: { code: string, expiresAt: number }
declare global {
  var __pengu_otp_cache: Map<string, { code: string; expiresAt: number }> | undefined;
}

if (!global.__pengu_otp_cache) {
  global.__pengu_otp_cache = new Map();
}
const otpStore = global.__pengu_otp_cache;

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^01[3-9]\d{8}$/.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          messageEn: "Please enter a valid 11-digit Bangladeshi mobile number.",
          messageBn: "সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন।",
        },
        { status: 400 }
      );
    }

    // Generate random 6-digit OTP code
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    otpStore.set(phone, { code: generatedCode, expiresAt });

    const smsApiKey = process.env.SMS_GATEWAY_API_KEY;
    const smsSenderId = process.env.SMS_SENDER_ID || "PenguFood";

    // If a real SMS API Key is configured in .env.local:
    if (smsApiKey && smsApiKey !== "your-sms-api-key") {
      try {
        const smsMessage = `PenguFood: আপনার ওটিপি কোড হলো ${generatedCode}। মেয়াদ ৫ মিনিট।`;
        
        // Example integration for RTCOM / Greenweb / BulkSMS BD
        const endpoint = process.env.SMS_GATEWAY_ENDPOINT || "https://api.sms-gateway.com/send";
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: smsApiKey,
            sender: smsSenderId,
            number: phone,
            message: smsMessage,
          }),
        });

        return NextResponse.json({
          success: true,
          isLiveSms: true,
          messageEn: `Verification code sent via SMS to ${phone}.`,
          messageBn: `${phone} নম্বরে এসএমএস ওটিপি কোড পাঠানো হয়েছে।`,
        });
      } catch (smsErr) {
        console.error("SMS Dispatch Error:", smsErr);
      }
    }

    // When SMS Gateway is not yet configured, return informative status
    return NextResponse.json({
      success: true,
      isLiveSms: false,
      devCode: generatedCode, // Available for development until SMS key is set in .env.local
      messageEn: `SMS gateway not configured yet. Your verification code is ${generatedCode}`,
      messageBn: `এসএমএস কী দেওয়া হয়নি। আপনার ওটিপি কোড হলো ${generatedCode}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, messageEn: "Failed to dispatch OTP", messageBn: "ওটিপি পাঠাতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}
