import { authApi } from "@/lib/api";
import type { AuthUser } from "@/types";

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authService = {
  sendOtp: (mobile: string) =>
    authApi.sendOtp(mobile),

  retryOtp: (reqId: string, type: "text" | "voice" = "text") =>
    authApi.retryOtp(reqId, type),

  verifyOtp: (reqId: string, otp: string): Promise<VerifyOtpResponse> =>
    authApi.verifyOtp(reqId, otp) as Promise<VerifyOtpResponse>,

  refresh: (refreshToken: string) =>
    authApi.refresh(refreshToken),

  logout: (refreshToken: string) =>
    authApi.logout(refreshToken),
};
