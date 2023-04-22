export type ProductParameter = {
    baseline?: number;
    inverse: boolean;
    max: number;
    min: number;
    name: string;
    step: string | number[];
    unit: string;
    weight: number;
    autoAcceptValue?: number;
    // step_offer: boolean;
    // negotiable: boolean;
};
