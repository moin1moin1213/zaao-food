import { UserProfile } from "./types";
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from "@/lib/storage/safeStorage";

const USER_SESSION_KEY = "pengufood_customer_session";

export interface SendOtpResult {
  success: boolean;
  messageEn: string;
  messageBn: string;
  isLiveSms?: boolean;
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
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      return {
        success: data.success,
        messageEn: data.messageEn,
        messageBn: data.messageBn,
        isLiveSms: data.isLiveSms,
      };
    } catch (err) {
      return {
        success: false,
        messageEn: "Could not send OTP. Please check your connection.",
        messageBn: "ওটিপি পাঠানো যায়নি। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।",
      };
    }
  },

  async verifyOtp(phone: string, otp: string, name?: string): Promise<VerifyOtpResult> {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (data.success) {
        const user: UserProfile = {
          id: `usr-${Date.now()}`,
          name: name || "PenguFood Customer",
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
      }

      return {
        success: data.success,
        messageEn: data.messageEn,
        messageBn: data.messageBn,
      };
    } catch (err) {
      return {
        success: false,
        messageEn: "Failed to verify OTP.",
        messageBn: "ওটিপি যাচাই করা যায়নি।",
      };
    }
  },

  logout(): void {
    safeLocalStorageRemove(USER_SESSION_KEY);
  },
};
