import { PartialType } from '@nestjs/swagger';
import { CreateDispatchAddressDto } from './create-dispatch-address.dto';

export class UpdateDispatchAddressDto extends PartialType(CreateDispatchAddressDto) {}
