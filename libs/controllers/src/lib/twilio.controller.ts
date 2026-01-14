import twilio from 'twilio';
import { ChatGrant, VideoGrant } from 'twilio/lib/jwt/AccessToken';

const AccessToken = twilio.jwt.AccessToken;
export type TwilioTokenType = 'video' | 'chat';

export class TwilioController {
  private token = new AccessToken(
    process.env.BACKEND_TWILIO_ACCOUNT_SID,
    process.env.BACKEND_TWILIO_API_KEY_SID,
    process.env.BACKEND_TWILIO_SECRET
  );

  public getAuthToken(identity: string, type: TwilioTokenType, room?: string): string {
    this.token.identity = identity;
    let grant;
    if (type === 'video') {
      grant = new VideoGrant();
      grant.room = room;
    } else {
      grant = new ChatGrant({
        serviceSid: process.env.BACKEND_TWILIO_CHAT_SERVICE_SID
      });
    }
    this.token.addGrant(grant);
    return this.token.toJwt();
  }

  public async getChannelName(requester: string, invited:string): Promise<string> {
    return [requester, invited].sort().join('.');
  }
}
