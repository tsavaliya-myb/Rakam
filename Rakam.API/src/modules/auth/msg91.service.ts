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

const MOCK_OTP = '123456';
const MOCK_TOKEN_PREFIX = 'MOCK_TOKEN_';
const MOCK_REQ_PREFIX = 'MOCK_REQ_';

@Injectable()
export class Msg91Service {
  private readonly authKey: string;
  private readonly widgetId: string;
  private readonly base = 'https://control.msg91.com/api/v5/widget';
  // TODO: remove before going live — set MOCK_OTP=false in .env to disable
  private readonly mockEnabled: boolean;

  constructor(config: ConfigService) {
    this.authKey = config.get<string>('msg91.authKey')!;
    this.widgetId = config.get<string>('msg91.widgetId')!;
    this.mockEnabled = config.get<string>('mockOtp') === 'true';
  }

  async sendOtp(mobile: string): Promise<string> {
    if (this.mockEnabled) {
      return `${MOCK_REQ_PREFIX}${mobile}`;
    }
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
    if (this.mockEnabled) return;
    const data = await this.post<Msg91Response>('retryOtp', { reqId, retryType });
    if (data.type !== 'success') {
      throw new InternalServerErrorException('Failed to retry OTP');
    }
  }

  async verifyOtp(reqId: string, otp: string): Promise<string> {
    if (this.mockEnabled) {
      if (otp !== MOCK_OTP || !reqId.startsWith(MOCK_REQ_PREFIX)) {
        throw new BadRequestException('Invalid OTP');
      }
      const mobile = reqId.slice(MOCK_REQ_PREFIX.length);
      return `${MOCK_TOKEN_PREFIX}${mobile}`;
    }
    const data = await this.post<VerifyOtpResponse>('verifyOtp', { reqId, otp });
    if (data.type !== 'success' || !data['access-token']) {
      throw new BadRequestException('Invalid OTP');
    }
    return data['access-token'];
  }

  async verifyAccessToken(accessToken: string): Promise<string> {
    if (this.mockEnabled && accessToken.startsWith(MOCK_TOKEN_PREFIX)) {
      return accessToken.slice(MOCK_TOKEN_PREFIX.length);
    }
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
