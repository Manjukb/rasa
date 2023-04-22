require('newrelic');

import * as cluster from 'cluster';
import * as corsMiddleware from 'restify-cors-middleware';
import * as os from 'os';
import * as restify from 'restify';

import { AutoAcceptReached, FinalRoundCompleted } from '../helpers/procurement-manager-event-observer';
import { Logger, env } from '../helpers';
import { Next, Request, Response } from 'restify';
import { SinkNewClientHandShaken, SinkNewSupplierOnBoarded } from '../helpers/company-supplier-event-observer';
import {
    negotiationSinkOnAgentMadeOffer,
    negotiationSinkOnCustomerAcceptedOffer,
    negotiationSinkOnCustomerRejectedOffer,
    negotiationSinkOnCustomerStartedEnquiry,
    negotiationSinkOnOfferAccepted,
    negotiationSinkOnOfferRejected,
} from '../helpers/negotiation-sink-observer';

import Bugsnag from '@bugsnag/js';
import { Container } from 'inversify';
import { CopilotOfferSubmitted } from '../helpers/co-pilot-offer-submit-event-observer';
import { InversifyRestifyServer } from 'inversify-restify-utils';
import { NegotiationRoundCompleted } from '../helpers/rfq-negotiation-round-completed-event-observer';
import { NewAllSupplierSubmitRound } from '../helpers/rfq-all-supplier-submit-round-event-observer';
import { NewRfqAwarded } from '../helpers/award-rfq-event-observer';
import { NewRfqAwardedAccept } from '../helpers/award-accept-rfq-event-observer';
import { NewRfqAwardedRejected } from '../helpers/award-reject-rfq-event-observer';
import { NewSupplierOfferSubmitted } from '../helpers/rfq-supplier-offer-submit-event-observer';
import { RfqExit } from '../helpers/rfq-exit-event-observer';

// import { NewRfqAwarded } from '../helpers/award-reject-rfq-event-observer';

export class Bootstrapper {
    private static container = new Container();

    public static getContainer(): Container {
        return Bootstrapper.container;
    }

    public static bootstrap(
        localBootstrapper: (container: Container) => void,
        setupServer?: (server: restify.Server, container: Container) => void,
    ): void {
        if (cluster.isMaster) {
            const numCpus = env.ENVIRONMENT !== 'local' ? os.cpus().length : 1;
            for (let i = 0; i < numCpus; i++) {
                cluster.fork();
            }
            cluster.on('exit', (): void => {
                cluster.fork();
            });
            return;
        }
        this.bootstrapWorker(localBootstrapper, setupServer);
    }

    private static bootstrapWorker(
        localBootstrapper: (container: Container) => void,
        setupServer?: (server: restify.Server, container: Container) => void,
    ): void {
        new Promise(
            async (resolve, reject): Promise<void> => {
                try {
                    const container = Bootstrapper.getContainer();
                    await localBootstrapper(container);

                    negotiationSinkOnOfferAccepted;
                    negotiationSinkOnCustomerAcceptedOffer;
                    negotiationSinkOnOfferRejected;
                    negotiationSinkOnCustomerRejectedOffer;
                    negotiationSinkOnCustomerStartedEnquiry;
                    negotiationSinkOnAgentMadeOffer;
                    SinkNewSupplierOnBoarded;
                    SinkNewClientHandShaken;
                    NewRfqAwarded;
                    NewRfqAwardedAccept;
                    NewRfqAwardedRejected;
                    NewSupplierOfferSubmitted;
                    NewAllSupplierSubmitRound;
                    NegotiationRoundCompleted;
                    FinalRoundCompleted;
                    AutoAcceptReached;
                    CopilotOfferSubmitted;
                    RfqExit;

                    // create server
                    const server = new InversifyRestifyServer(container, {
                        defaultRoot: '/api',
                        log: Logger.log,
                    });

                    const app = server.build();
                    if (setupServer) {
                        console.log('calling setupServer with restify.server');
                        setupServer(app, container);
                    }
                    let bugSnagMiddleware;

                    if (env.IS_BUGSNAG_ENABLED) {
                        Bugsnag.start({
                            apiKey: env.BUGSNAG_API_KEY,
                            releaseStage: env.ENVIRONMENT,
                        });
                        bugSnagMiddleware = Bugsnag.getPlugin('restify');

                        // This must be the first piece of middleware in the stack.
                        // It can only capture errors in downstream middleware
                        if (bugSnagMiddleware) {
                            app.pre(bugSnagMiddleware.requestHandler);
                        }
                    }
                    app.use(restify.plugins.acceptParser(app.acceptable));
                    app.use(
                        restify.plugins.bodyParser({
                            mapParams: true,
                        }),
                    );
                    app.use(restify.plugins.queryParser());

                    const cors = corsMiddleware({
                        origins: ['*'],
                        preflightMaxAge: 1000 * 60 * 10,
                        allowHeaders: ['Authorization'],
                        exposeHeaders: ['Authorization'],
                    });

                    app.pre(cors.preflight);
                    app.use(cors.actual);

                    app.get(
                        '/version',
                        restify.plugins.serveStatic({
                            directory: `${__dirname}/../.`,
                            file: 'version.txt',
                        }),
                    );

                    app.listen(env.PORT, () => {
                        console.info(`server started at port:${env.PORT}`);
                    });

                    if (bugSnagMiddleware && env.IS_BUGSNAG_ENABLED) {
                        app.on('restifyError', bugSnagMiddleware.errorHandler);
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    app.on('restifyError', (request: Request, res: Response, err: any, cb: Next) => {
                        if (env.ENVIRONMENT !== 'local') {
                            request.log.error({
                                error: err,
                                request_body: request.body,
                                header: request.headers,
                                query: request.params,
                                url: request.url,
                            });
                            res.send(500, 'something went wrong');
                        } else {
                            console.error(err);
                        }
                        return cb();
                    });

                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            },
        );
    }
}
