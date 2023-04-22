import { CompanySupplierHandShakingEvent } from '../types';
import { env } from '../helpers';

export class CompanySupplierHandShaking {
    public template: string;

    public constructor(data: CompanySupplierHandShakingEvent) {
        this.template = `
        <strong>Dear ${data.name},</strong>
        <p>
        Please <a href= ${env.PUBLIC_URL}/auth/supplier-confirm?key=${data.company_id}>click here</a> to start business with ${data.company_name}
        </p>

        Happy selling!<br>
        <i>Negobot</i>
        `;
    }
}
