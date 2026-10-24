import { UserProfile } from "./types";
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from "@/lib/storage/safeStorage";

const USER_SESSION_KEY = "auth_dev_preview_session";

export interface SendOtpResult {
  success: boolean;
  messageEn: string;
  messageBn: string;
  isMock: true;
}

export interface VerifyOtpResult {
  success: boolean;
  messageEn: string;
  messageBn: string;
}

/**
 * Authentication Service boundary.
 * Phase 1 implements the typed interface with RTCOM SMS OTP countdown/preview hooks.
 * Does not simulate false production credentials.
 */
export const authService = {
  getCurrentUser(): UserProfile | null {
    return safeLocalStorageGet<UserProfile | null>(USER_SESSION_KEY, {
      id: "usr-guest",
      name: "Guest Customer",
      phone: "01712345678",
      isLoggedIn: true,
      addresses: [
        {
          id: "addr-1",
          labelEn: "Home",
          labelBn: "বাসা",
          address: "Holding 24, College Road, Mathbaria",
          area: "College Road, Ward 4",
          isDefault: true,
        },
        {
          id: "addr-2",
          labelEn: "Work / Shop",
          labelBn: "দোকান / অফিস",
          address: "Shop 12, Mathbaria Central Market",
          area: "Mathbaria Bazar (Center)",
        },
      ],
    });
  },

  async sendOtp(phone: string): Promise<SendOtpResult> {
    // RTCOM OTP provider integration boundary
    // In Phase 1 development preview, we honestly notify that this is a simulated verification request
    return {
      success: true,
      isMock: true,
      messageEn: `[Dev Preview] OTP verification code requested for ${phone}. RTCOM gateway will be connected in Phase 2.`,
      messageBn: `[ডেমো প্রিভিউ] ${phone} নম্বরে ওটিপি যাচাই কোড অনুরোধ করা হয়েছে। ফেজ ২-এ আরটিকম গেটওয়ে সংযুক্ত হবে।`,
    };
  },

  async verifyOtp(phone: string, otp: string): Promise<VerifyOtpResult> {
    if (otp.length === 6) {
      return {
        success: true,
        messageEn: "OTP verified successfully in preview mode.",
        messageBn: "প্রিভিউ মোডে ওটিপি সফলভাবে যাচাই হয়েছে।",
      };
    }
    return {
      success: false,
      messageEn: "Please enter a valid 6-digit code.",
      messageBn: "অনুগ্রহ করে সঠিক ৬-সংখ্যার কোড লিখুন।",
    };
  },

  logout(): void {
    safeLocalStorageRemove(USER_SESSION_KEY);
  },
};
