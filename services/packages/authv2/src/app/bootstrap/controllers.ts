import { TYPE, interfaces } from 'inversify-restify-utils';

import { AuthenticationController } from '../controllers';
import { Container } from 'inversify';

export class Controllers {
    public static bootstrap(container: Container): void {
        container
            .bind<interfaces.Controller>(TYPE.Controller)
            .to(AuthenticationController)
            .whenTargetNamed('AuthenticationController');
    }
}
