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

    if (!phone || !/^(\+?88)?01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ""))) {
      return NextResponse.json(
        {
          success: false,
          messageEn: "Please enter a valid 11-digit Bangladeshi mobile number.",
          messageBn: "সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন।",
        },
        { status: 400 }
      );
    }

    // Clean phone to standard 11 digits (01XXXXXXXXX)
    const cleanDigits = phone.replace(/[\s-]/g, "");
    const localPhone = cleanDigits.endsWith(cleanDigits.slice(-11)) && cleanDigits.slice(-11).startsWith("01")
      ? cleanDigits.slice(-11)
      : cleanDigits;

    // Format for RTCOM Gateway (8801XXXXXXXXX)
    const rtcomContact = localPhone.startsWith("88")
      ? localPhone
      : localPhone.startsWith("+88")
      ? localPhone.slice(1)
      : "88" + localPhone;

    // Generate real random 6-digit OTP code
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    otpStore.set(localPhone, { code: generatedCode, expiresAt });

    const smsProviderUrl = process.env.SMS_GATEWAY_PROVIDER || "https://api.rtcom.xyz/onetomany";
    const smsApiKey = process.env.SMS_GATEWAY_API_KEY || "39bf58e2f444e4eac09f020de2585e8565d33aee";
    const smsAcode = process.env.SMS_GATEWAY_ACODE || "30000562";
    const smsSenderId = process.env.SMS_SENDER_ID || "8809648906860";

    // Call Real RTCOM SMS Gateway according to official API specification
    if (smsApiKey && smsApiKey.length > 10) {
      try {
        const smsMessage = `PenguFood OTP: ${generatedCode} is your verification code. Valid for 5 mins.`;

        const smsPayload = {
          acode: smsAcode,
          api_key: smsApiKey,
          senderid: smsSenderId,
          type: "text",
          msg: smsMessage,
          contacts: rtcomContact,
          transactionType: "T",
          contentID: "",
        };

        const gatewayResponse = await fetch(smsProviderUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(smsPayload),
        });

        const result = await gatewayResponse.json();

        if (result?.response?.code === 200 || result?.response?.message === "Success") {
          return NextResponse.json({
            success: true,
            isLiveSms: true,
            messageEn: `A 6-digit OTP code has been sent via SMS to ${localPhone}.`,
            messageBn: `${localPhone} নম্বরে ৬ ডিজিটের ওটিপি এসএমএস পাঠানো হয়েছে।`,
          });
        }

        // Low balance scenario (RTCOM code 301)
        if (result?.response?.code === 301) {
          console.warn("RTCOM Gateway Low Balance:", result);
          const isDev = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_APP_ENV !== "production";
          return NextResponse.json({
            success: isDev,
            isLiveSms: false,
            devOtp: isDev ? generatedCode : undefined,
            code: 301,
            messageEn: isDev
              ? `[Dev Mode] RTCOM SMS balance is low (৳0.10). Use test code: ${generatedCode}`
              : "Failed to send SMS: Low balance on SMS gateway. Please recharge.",
            messageBn: isDev
              ? `[টেস্ট মোড] আরটিকম গেটওয়েতে পর্যাপ্ত ব্যালেন্স নেই (বর্তমান ব্যালেন্স ৳০.১০)। আপনার টেস্ট ওটিপি: ${generatedCode}`
              : "এসএমএস পাঠানো যায়নি: আরটিকম অ্যাকাউন্টে ব্যালেন্স শেষ (বর্তমান ব্যালেন্স ৳০.১০)। অনুগ্রহ করে রিচার্জ করুন।",
          });
        }

        console.error("RTCOM API Gateway Error:", result);
        return NextResponse.json({
          success: false,
          messageEn: `Failed to deliver SMS (${result?.response?.message || "Gateway Error"}).`,
          messageBn: `এসএমএস পাঠানো যায়নি (${result?.response?.message || "গেটওয়ে সমস্যা"})।`,
        });
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
