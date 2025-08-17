import { IoEvent } from '../IoEvent';
import { IBrand } from '../../types/index';
import { AGENCY_BRAND_REGISTRATION_EVENT_CODE } from '../../constants';

export class NewBrandRegistrationEvent extends IoEvent {
    constructor(brand: IBrand, sourceProviderId: string) {
        super();
        this.type = AGENCY_BRAND_REGISTRATION_EVENT_CODE.RECEIVED;
        this.data = brand;

        if(typeof sourceProviderId !== 'string' || sourceProviderId?.length < 35) {
            throw new Error('NewBrandRegistrationEvent: constructor: sourceProviderId is required and must be a valid UUID');
        }
        // set the event provider source id
        super.setSource(sourceProviderId);
    }
} 