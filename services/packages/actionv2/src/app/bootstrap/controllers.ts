import { ActionController, RfqController, SessionController } from '../controllers';
import { TYPE, interfaces } from 'inversify-restify-utils';

import { Container } from 'inversify';

export class Controllers {
    public static bootstrap(container: Container): void {
        container.bind<interfaces.Controller>(TYPE.Controller).to(ActionController).whenTargetNamed('ActionController');
        container.bind<interfaces.Controller>(TYPE.Controller).to(RfqController).whenTargetNamed('RfqController');
        container
            .bind<interfaces.Controller>(TYPE.Controller)
            .to(SessionController)
            .whenTargetNamed('SessionController');
    }
}
