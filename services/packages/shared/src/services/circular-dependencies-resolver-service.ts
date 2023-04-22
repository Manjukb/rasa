import { injectable } from 'inversify';
import { Rfq } from '../database/models';
import { getRepository } from 'typeorm';

export interface CircularDependenciesResolverServiceContract {
    getRfqsByIds(ids: string[]): Promise<Rfq[]>;
}

@injectable()
export class CircularDependenciesResolverService implements CircularDependenciesResolverServiceContract {
    public async getRfqsByIds(ids: string[]): Promise<Rfq[]> {
        const rfqs = await getRepository(Rfq)
            .createQueryBuilder('rfq')
            .where(`id in (:...ids)`, { ids: ids.length ? ids : [''] })
            .getMany();

        return rfqs;
    }
}
