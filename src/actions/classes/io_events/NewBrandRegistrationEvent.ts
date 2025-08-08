import { IoEvent } from '../IoEvent';
import { IBrand } from '../../types/index';
import { AGENCY_BRAND_REGISTRATION_EVENT_CODE } from '../../constants';

export class NewBrandRegistrationEvent extends IoEvent {
    constructor(brand: IBrand) {
        super();
        this.type = AGENCY_BRAND_REGISTRATION_EVENT_CODE.RECEIVED;
        this.data = brand;
    }
} 