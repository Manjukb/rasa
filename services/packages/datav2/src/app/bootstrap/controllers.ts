import {
    ApiKeyController,
    BotController,
    CategoryController,
    EmbedController,
    MetaController,
    NegotiationSessionController,
    NotificationController,
    OrganisationController,
    ProductController,
    ProductParameterController,
    RfqController,
    SeedController,
    SettingController,
    SupplierController,
    UserController,
} from '../controllers';
import { TYPE, interfaces } from 'inversify-restify-utils';

import { Container } from 'inversify';

export class Controllers {
    public static bootstrap(container: Container): void {
        container.bind<interfaces.Controller>(TYPE.Controller).to(ApiKeyController).whenTargetNamed('ApiKeyController');
        container.bind<interfaces.Controller>(TYPE.Controller).to(BotController).whenTargetNamed('BotController');
        container
            .bind<interfaces.Controller>(TYPE.Controller)
            .to(CategoryController)
            .whenTargetNamed('CategoryController');
        container.bind<interfaces.Controller>(TYPE.Controller).to(EmbedController).whenTargetNamed('EmbedController');
        container.bind<interfaces.Controller>(TYPE.Controller).to(MetaController).whenTargetNamed('MetaController');
        container
            .bind<interfaces.Controller>(TYPE.Controller)
            .to(NegotiationSessionController)
            .whenTargetNamed('NegotiationSessionController');
        container
            .bind<interfaces.Controller>(TYPE.Controller)
            .to(OrganisationController)
            .whenTargetNamed('OrganisationController');
        container
            .bind<interfaces.Controller>(TYPE.Controller)
            .to(ProductController)
            .whenTargetNamed('ProductController');
        container
            .bind<interfaces.Controller>(TYPE.Controller)
            .to(ProductParameterController)
            .whenTargetNamed('ProductParameterController');
        container.bind<interfaces.Controller>(TYPE.Controller).to(SeedController).whenTargetNamed('SeedController');
        container
            .bind<interfaces.Controller>(TYPE.Controller)
            .to(SettingController)
            .whenTargetNamed('SettingController');
        container.bind<interfaces.Controller>(TYPE.Controller).to(UserController).whenTargetNamed('UserController');
        container.bind<interfaces.Controller>(TYPE.Controller).to(RfqController).whenTargetNamed('RfqController');
        container
            .bind<interfaces.Controller>(TYPE.Controller)
            .to(SupplierController)
            .whenTargetNamed('SupplierController');

        container
            .bind<interfaces.Controller>(TYPE.Controller)
            .to(NotificationController)
            .whenTargetNamed('NotificationController');
    }
}
