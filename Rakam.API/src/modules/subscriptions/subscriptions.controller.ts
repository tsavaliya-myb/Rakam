import { Controller } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService) {}
  // TODO: current plan, upgrade, Razorpay webhook (implement later per stack doc)
}
