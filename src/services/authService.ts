import { UserProfile } from "./types";
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from "@/lib/storage/safeStorage";

const USER_SESSION_KEY = "pengufood_customer_session";

export interface SendOtpResult {
  success: boolean;
  messageEn: string;
  messageBn: string;
}

export interface VerifyOtpResult {
  success: boolean;
  messageEn: string;
  messageBn: string;
}

export const authService = {
  getCurrentUser(): UserProfile | null {
    return safeLocalStorageGet<UserProfile | null>(USER_SESSION_KEY, null);
  },

  login(phone: string, name?: string): UserProfile {
    const existing = this.getCurrentUser();
    const user: UserProfile = {
      id: existing?.id || `usr-${Date.now()}`,
      name: name || existing?.name || "PenguFood Customer",
      phone,
      isLoggedIn: true,
      addresses: existing?.addresses || [
        {
          id: `addr-${Date.now()}`,
          labelEn: "Home",
          labelBn: "বাসা",
          address: "Mathbaria, Pirojpur",
          area: "Mathbaria Bazar (Center)",
          isDefault: true,
        },
      ],
    };
    safeLocalStorageSet(USER_SESSION_KEY, user);
    return user;
  },

  async sendOtp(phone: string): Promise<SendOtpResult> {
    return {
      success: true,
      messageEn: `Verification code has been dispatched to ${phone}.`,
      messageBn: `${phone} নম্বরে ওটিপি কোড পাঠানো হয়েছে।`,
    };
  },

  async verifyOtp(phone: string, otp: string, name?: string): Promise<VerifyOtpResult> {
    if (otp.length === 6) {
      const user: UserProfile = {
        id: `usr-${Date.now()}`,
        name: name || "Customer",
        phone,
        isLoggedIn: true,
        addresses: [
          {
            id: `addr-${Date.now()}`,
            labelEn: "Home",
            labelBn: "বাসা",
            address: "Mathbaria, Pirojpur",
            area: "Mathbaria Bazar (Center)",
            isDefault: true,
          },
        ],
      };
      safeLocalStorageSet(USER_SESSION_KEY, user);

      return {
        success: true,
        messageEn: "OTP verified successfully. You are now logged in.",
        messageBn: "ওটিপি সফলভাবে যাচাই হয়েছে। আপনি লগইন সম্পন্ন করেছেন।",
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
