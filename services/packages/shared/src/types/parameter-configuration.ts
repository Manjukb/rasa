import { BuyerParameters } from './parameter';

export type ParameterConfiguration = {
    baseline?: number;
    inverse: boolean;
    name: string;
    min: number;
    max: number;
    weight: number;
    unit: string;
    saving_parameters?: BuyerParameters;
    step: string | number[];
};

export type NegoParameterConfiguration = {
    baseline?: number;
    inverse: boolean;
    name: string;
    min: number;
    max: number;
    weight: number;
    unit: string;
    saving_parameters?: BuyerParameters;
    step: string | number[];
};
