import 'reflect-metadata';
import { LocalBootstrapper as Bootstrapper } from './app/bootstrap/local-bootstrapper';

(async function () {
    await Bootstrapper.init();
})();
