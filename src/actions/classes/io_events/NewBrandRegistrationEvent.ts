import { IoEvent } from '../IoEvent';
import { IBrand } from '../../types/index';
import { v4 as uuidv4 } from 'uuid';

export class NewBrandRegistrationEvent extends IoEvent {
    constructor(brand: IBrand) {
        super();
        this.type = 'brand.registration.received';
        this.datacontenttype = 'application/json';
        this.data = brand;
    }
} 