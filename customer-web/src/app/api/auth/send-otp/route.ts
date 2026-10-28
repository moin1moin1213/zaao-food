import { NextRequest, NextResponse } from "next/server";

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

    // Generate real random 6-digit OTP code
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    otpStore.set(phone, { code: generatedCode, expiresAt });

    const smsProviderUrl = process.env.SMS_GATEWAY_PROVIDER || "https://api.rtcom.xyz/onetomany";
    const smsApiKey = process.env.SMS_GATEWAY_API_KEY;
    const smsAcode = process.env.SMS_GATEWAY_ACODE || "30000562";
    const smsSenderId = process.env.SMS_SENDER_ID || "8809648906860";

    // Call Real RTCOM SMS Gateway
    if (smsApiKey && smsApiKey.length > 10) {
      try {
        const smsMessage = `PenguFood: আপনার লগইন ওটিপি কোড হলো ${generatedCode}। মেয়াদ ৫ মিনিট।`;
        
        const params = new URLSearchParams({
          api_key: smsApiKey,
          acode: smsAcode,
          senderid: smsSenderId,
          contacts: phone,
          msg: smsMessage,
        });

        const gatewayResponse = await fetch(`${smsProviderUrl}?${params.toString()}`);
        const result = await gatewayResponse.json();

        if (result?.response?.code === 200 || result?.response?.message === "Success") {
          return NextResponse.json({
            success: true,
            isLiveSms: true,
            messageEn: `A 6-digit OTP code has been sent via SMS to ${phone}.`,
            messageBn: `${phone} নম্বরে ৬ ডিজিটের ওটিপি এসএমএস পাঠানো হয়েছে।`,
          });
        } else {
          console.error("RTCOM API Gateway Error:", result);
          return NextResponse.json({
            success: false,
            messageEn: `Failed to deliver SMS (${result?.response?.message || "Gateway Error"}).`,
            messageBn: `এসএমএস পাঠানো যায়নি (${result?.response?.message || "গেটওয়ে সমস্যা"})।`,
          });
        }
      } catch (smsErr: any) {
        console.error("SMS Dispatch Network Error:", smsErr);
        return NextResponse.json(
          { success: false, messageEn: "SMS gateway connection failed", messageBn: "এসএমএস গেটওয়ে কানেকশন ব্যর্থ হয়েছে" },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      success: false,
      messageEn: "SMS Gateway is not configured.",
      messageBn: "এসএমএস গেটওয়ে কনফিগার করা নেই।",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, messageEn: "Failed to dispatch OTP", messageBn: "ওটিপি পাঠাতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
