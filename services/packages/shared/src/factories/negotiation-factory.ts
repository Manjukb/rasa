import { Bootstrapper } from '../bootstrap/bootstrapper';
import { BusinessType } from '../enum';
import { RfqProcurementNegotiationServiceContract } from '../services/rfq-procurement-negotiation-service';
import { RfqSalesNegotiationServiceContract } from '../services/rfq-sales-negotiation-service';

export class NegotiationFactory {
    public static getServiceByBusinessTypes(
        businessType: string,
    ): RfqProcurementNegotiationServiceContract | RfqSalesNegotiationServiceContract {
        const container = Bootstrapper.getContainer();
        if (businessType === BusinessType.procurement) {
            const procurementContract = container.get<RfqProcurementNegotiationServiceContract>(
                'RfqProcurementNegotiationService',
            );

            return procurementContract;
        }
        if (businessType === BusinessType.sales) {
            const salesServiceContract = container.get<RfqSalesNegotiationServiceContract>(
                'RfqSalesNegotiationService',
            );

            return salesServiceContract;
        }
    }
}
