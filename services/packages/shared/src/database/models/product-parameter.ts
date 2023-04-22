import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { BuyerParameters } from '../../types/parameter';
import { Organisation } from './organisation';
import { ParameterConfiguration } from '../../types/parameter-configuration';
import { Product } from './product';

@Entity('parameter')
export class ProductParameter {
    @PrimaryColumn({ name: 'id' })
    public id: string;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @Column()
    public organisation_id: string;

    @ManyToOne(() => Organisation, (organisation) => organisation.organisation_id)
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public organisation: Organisation;

    @Column()
    public product_id: string;

    @ManyToOne(() => Product, (product) => product.id)
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    public product: Product;

    @Column({ type: 'simple-json' })
    public parameter: ParameterConfiguration[];

    @Column({ type: 'simple-json' })
    public saving_parameters: BuyerParameters;

    @Column({ type: 'simple-json' })
    public step_count: BuyerParameters;
}
