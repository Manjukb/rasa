import * as restify from 'restify';

import {
    ApiKey,
    Bot,
    Category,
    Customer,
    Dashboard,
    EmailTemplate,
    MailQueue,
    Negotiation,
    Organisation,
    OrganisationCompany,
    OrganisationCompanySupplier,
    Product,
    ProductParameter,
    Rfq,
    RfqItem,
    RfqSupplier,
    Setting,
    Supplier,
    SupplierCategoryProduct,
    SupplierCompany,
    SupplierOrganisation,
    SupplierUser,
    Tenant,
    TenantUser,
    User,
} from '@negobot/shared';
import { ConnectionOptionsReader, createConnection } from 'typeorm';

import { Bootstrapper } from '@negobot/shared/';
import { Container } from 'inversify';
import { Controllers } from './controllers';
import { Server } from 'socket.io';
import { Services } from './services';

const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

export class LocalBootstrapper {
    public static init(): void {
        Bootstrapper.bootstrap(
            async (container: Container): Promise<void> => {
                Controllers.bootstrap(container);
                container.get;
                Services.bootstrap(container);
                const connectionOptionsReader = new ConnectionOptionsReader();
                const entities = [
                    ApiKey,
                    Bot,
                    Category,
                    Customer,
                    Dashboard,
                    Organisation,
                    Negotiation,
                    User,
                    Tenant,
                    TenantUser,
                    Setting,
                    ProductParameter,
                    Product,
                    OrganisationCompany,
                    OrganisationCompanySupplier,
                    Supplier,
                    SupplierCategoryProduct,
                    SupplierUser,
                    SupplierCompany,
                    SupplierOrganisation,
                    Rfq,
                    RfqItem,
                    RfqSupplier,
                    MailQueue,
                    EmailTemplate,
                ];
                const connectionOptions = (await connectionOptionsReader.all())[0];
                connectionOptions.entities.push(...entities);
                await createConnection(connectionOptions);
            },

            async (server: restify.Server, container: Container): Promise<void> => {
                // const action = container.get<ActionServiceContract>('ActionService');

                const io = new Server(server.server, {
                    path: '/socket.io',
                    cors: {
                        origin: '*',
                        methods: ['GET', 'POST'],
                    },
                });
                const pubClient = createClient({ host: process.env.redis_host, port: process.env.redis_port });
                const subClient = pubClient.duplicate();
                Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
                    io.adapter(createAdapter(pubClient, subClient));
                });
                io.sockets.on('connection', (socket) => {
                    console.log('Connected', socket.handshake.query);
                    // try {
                    //     const token = new DecodedTokenResponse();
                    //     Object.assign(
                    //         token,
                    //         JWT.verify((socket.handshake.query.token || '').toString(), env.JWT_SECRET),
                    //     );
                    // } catch (error) {
                    //     console.log('token invalid');
                    //     return;
                    // }
                    socket.join(`user-${socket.handshake.query.user_id}`);
                    // socket.on('message', async (ws) => {
                    //     console.log(ws, 'WS data ********');
                    //     const result = await action.negotiateSalesBot({
                    //         rfqId: ws.rfqId,
                    //         payload: ws.payload,
                    //         user: ws.user,
                    //         accept: ws.accept,
                    //         exitNegotiation: ws.exitNegotiation,
                    //     });
                    //     console.log('message*****************', result);
                    //     socket.emit('message-response', { data: result.data.data });
                    // });
                });

                global.io = io;
            },
        );
    }
}
