import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface Msg91Response {
  type: string;
  message?: unknown;
}

interface SendOtpResponse extends Msg91Response {
  reqId: string;
}

interface VerifyOtpResponse extends Msg91Response {
  'access-token': string;
}

interface VerifyAccessTokenResponse extends Msg91Response {
  message: { mobile: string; email: string };
}

@Injectable()
export class Msg91Service {
  private readonly authKey: string;
  private readonly widgetId: string;
  private readonly base = 'https://control.msg91.com/api/v5/widget';

  constructor(config: ConfigService) {
    this.authKey = config.get<string>('msg91.authKey')!;
    this.widgetId = config.get<string>('msg91.widgetId')!;
  }

  async sendOtp(mobile: string): Promise<string> {
    const data = await this.post<SendOtpResponse>('sendOtp', {
      mobile: `91${mobile}`,
      widgetId: this.widgetId,
    });
    if (data.type !== 'success' || !data.reqId) {
      throw new InternalServerErrorException('Failed to send OTP');
    }
    return data.reqId;
  }

  async retryOtp(reqId: string, retryType: 'text' | 'voice'): Promise<void> {
    const data = await this.post<Msg91Response>('retryOtp', { reqId, retryType });
    if (data.type !== 'success') {
      throw new InternalServerErrorException('Failed to retry OTP');
    }
  }

  async verifyOtp(reqId: string, otp: string): Promise<string> {
    const data = await this.post<VerifyOtpResponse>('verifyOtp', { reqId, otp });
    if (data.type !== 'success' || !data['access-token']) {
      throw new BadRequestException('Invalid OTP');
    }
    return data['access-token'];
  }

  async verifyAccessToken(accessToken: string): Promise<string> {
    const data = await this.post<VerifyAccessTokenResponse>('verifyAccessToken', {
      'access-token': accessToken,
    });
    if (data.type !== 'success' || !data.message?.mobile) {
      throw new InternalServerErrorException('Failed to verify access token');
    }
    // MSG91 returns mobile with country code prefix — strip leading "91"
    return data.message.mobile.replace(/^91/, '');
  }

  private async post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.base}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authkey: this.authKey },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new InternalServerErrorException(`MSG91 ${endpoint} failed: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }
}
