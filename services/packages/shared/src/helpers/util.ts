import * as bcrypt from 'bcryptjs';
import * as jsonwebtoken from 'jsonwebtoken';

import { Parameter as BotParamter, DbIndex } from '../types';
import { QueryRunner, TableForeignKey } from 'typeorm';
import { parse as parseUuid, v4 } from 'uuid';

import { Constant } from './constant';
import { NegotiationActionResponse } from '../viewmodels/response/negotiation-response';
import { ParameterConfiguration } from '../types/parameter-configuration';
import { Parser } from 'json2csv';
import { ProductResponse } from '../viewmodels/response';
import { RfqResponseItem } from '../viewmodels/response/rfq-response';
import { ValidationError } from 'yup';
import { env } from './env';

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export class Util {
    public static capitalize(text: string): string {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    public static isValidUrl(str: string): boolean {
        const regexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
        if (regexp.test(str)) {
            return true;
        }
        return false;
    }

    public static guid(length = 32): string {
        const buffer: string[] = [];
        const chars = 'abcdef0123456789';
        const characterLength = chars.length;

        for (let i = 0; i < length; i++) {
            buffer[i] = chars.charAt(Math.floor(Math.random() * characterLength));
        }

        return buffer.join('');
    }

    public static async checkDbIndexAlreadyCreated(queryRunner: QueryRunner, indexName: string): Promise<boolean> {
        const indexes: DbIndex[] = await queryRunner.query(
            `SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname`,
        );

        const isIndexAlreadyCreated = indexes.find((index) => index.indexname === indexName);

        return !!isIndexAlreadyCreated;
    }

    public static async checkDbIndexAlreadyCreatedV2(
        queryRunner: QueryRunner,
        indexName: string,
        tableName: string,
        constraintType: string,
    ): Promise<boolean> {
        const result: [
            {
                cnt: string;
            },
        ] = await queryRunner.query(`SELECT count(*) as cnt FROM information_schema.table_constraints 
        WHERE table_name='${tableName}' 
        AND constraint_type = '${constraintType}'
        AND constraint_name = '${indexName}'`);

        const count = Number(result[0].cnt);

        return !!count;
    }

    public static generateToken(object: Record<string, string>): string {
        const data = {};
        Object.assign(data, object);
        const jwtToken = jsonwebtoken.sign(
            {
                ...data,
            },
            env.JWT_SECRET,
            {
                expiresIn: '1d',
            },
        );

        return jwtToken;
    }

    public static newId(): string {
        return Util.removeAllDashes(v4());
    }

    public static insertDashes(value: string, at: number[]): string {
        const newValue = value.split('');
        at.forEach((a) => newValue.splice(a, 0, '-'));
        return newValue.join('');
    }

    public static validateUuid(value: string) {
        if (!value || (value.length !== 32 && value.length !== 36)) {
            return false;
        }
        let toCheck = value;
        // we have a uuid w/o dashes
        if (value.length === 32) {
            toCheck = Util.insertDashes(value, [8, 13, 18, 23]);
        }
        try {
            parseUuid(toCheck);
        } catch (e) {
            return false;
        }
        return true;
    }

    public static removeAllDashes(text: string): string {
        return text.replace(/-/g, '');
    }

    public static async runValidation(value: any, cb: any, i?: number): Promise<string[] | boolean> {
        try {
            await cb.validate(value, { abortEarly: false });
        } catch (validationErrors) {
            if (!(validationErrors as ValidationError).inner) {
                throw validationErrors;
            }
            const prefix = i ? `Row#${i}` : '';
            return (validationErrors as ValidationError).inner.map((v) => `${prefix} ${v.message}`);
        }
        return true;
    }

    public static getUserGroupTypeByRole(userRole: string): string {
        if (Constant.tenantUserRoles.includes(userRole)) {
            return Constant.userGroupTypes.tenantUser;
        }
        if (Constant.customerRoles.includes(userRole)) {
            return Constant.userGroupTypes.customer;
        }
        if (Constant.supplierRoles.includes(userRole)) {
            return Constant.userGroupTypes.supplier;
        }
        return Constant.userGroupTypes.organisationUser;
    }

    public static resumeOptions(): NegotiationActionResponse[] {
        const response: NegotiationActionResponse[] = [];
        response.push({ id: 'resume', type: 'primary', text: 'Yes', block: false, subtext: 'Negotiation Resumed' });

        return response;
    }

    public static actionOptions(isMakeOfferDisable = false, hideAcceptOffer = false): NegotiationActionResponse[] {
        const response: NegotiationActionResponse[] = [];
        if (!isMakeOfferDisable && !hideAcceptOffer) {
            response.push({
                id: 'affirm',
                type: 'default',
                text: 'Confirm Offer',
                block: null,
                subtext: 'Confirmed Offer',
            });
            response.push({
                id: 'offer',
                type: 'primary',
                text: 'Negotiate',
                block: null,
                subtext: 'Offer Form Requested',
            });
            response.push({
                id: 'deny',
                type: 'danger',
                text: 'Exit Negotiation',
                block: null,
                subtext: 'Exited from Negotiation',
            });

            return response;
        }
        if (hideAcceptOffer) {
            response.push({
                id: 'offer',
                type: 'primary',
                text: 'Negotiate',
                block: false,
                subtext: 'Made Counter Offer',
            });
            response.push({
                id: 'deny',
                type: 'danger',
                text: 'Exit Negotiation',
                block: false,
                subtext: 'Exited from Negotiation',
            });

            return response;
        }
        response.push({
            id: 'affirm',
            type: 'primary',
            text: 'Confirm Offer',
            block: false,
            subtext: 'Confirmed Offer',
        });
        response.push({
            id: 'deny',
            type: 'danger',
            text: 'Exit Negotiation',
            block: false,
            subtext: 'Exited from Negotiation',
        });

        return response;
    }

    public static getProductDisplayName(rfqItems?: RfqResponseItem[] | ProductResponse, productCode?: string): string {
        // if name is not set in productInfo then return product_code
        if (!rfqItems) {
            return productCode;
        }
        return Array.isArray(rfqItems)
            ? rfqItems.map((r) => r.name).toString()
            : rfqItems.productInfo.name || rfqItems.product_code;
    }

    public static getParameterDisplayName(name: string): string {
        if (name === 'quantity') {
            return 'Order Quantity';
        }
        return name
            .split('_')
            .map((n) => Util.capitalize(n))
            .join(' ');
    }

    public static closestNumber(value: number, step: number, max: number, min: number): number {
        const arr = Array.from({ length: (max - min) / step + 1 }, (_, i) => min + i * step);

        const nearestValue =
            arr.reduce((p, n) => (Math.abs(p) > Math.abs(n - value) ? n - value : p), Infinity) + value;

        const nearestValue1 =
            arr.reduce((p, n) => (Math.abs(p) < Math.abs(n - value) ? p : n - value), Infinity) + value;

        const diffFromMin = +(value - nearestValue).toFixed(2);
        const diffFromMax = +(nearestValue1 - value).toFixed(2);
        const finalValue =
            diffFromMin === diffFromMax ? nearestValue1 : diffFromMin < diffFromMax ? nearestValue : nearestValue1;

        return finalValue < max ? finalValue : max;
    }

    public static closestNumberFromArray(
        value: number,
        step: number[],
        max: number,
        min: number,
        inverse: boolean,
    ): number {
        const arr = step.map((s) => +s);

        const nearestValue =
            arr.reduce((p, n) => (Math.abs(p) > Math.abs(n - value) ? n - value : p), Infinity) + value;

        const nearestValue1 =
            arr.reduce((p, n) => (Math.abs(p) < Math.abs(n - value) ? p : n - value), Infinity) + value;

        const diffFromMin = +(value - nearestValue).toFixed(2);
        const diffFromMax = +(nearestValue1 - value).toFixed(2);
        const finalValue =
            diffFromMin === diffFromMax ? nearestValue1 : diffFromMin < diffFromMax ? nearestValue : nearestValue1;

        return inverse ? (finalValue > min ? finalValue : min) : finalValue < max ? finalValue : max;
    }

    public static shuffle<T>(array: T[]): T[] {
        return array.sort(() => Math.random() - 0.5);
    }

    public static checkProductHasPaymentTerms(product: ProductResponse, botParamter: BotParamter): boolean {
        if (product.has_payment_terms && botParamter.payment_term_pattern) {
            return true;
        }

        return false;
    }

    public static getParameterWithUnit(productParameters: ParameterConfiguration[]): { [key: string]: string } {
        const parameterNameAndUnit: { [key: string]: string } = {};
        productParameters.forEach((parameter): void => {
            parameterNameAndUnit[parameter.name] = parameter.unit;
        });

        return parameterNameAndUnit;
    }

    public static getQuantityUnit(parameterNameAndUnit: { [key: string]: string }): string | null {
        return parameterNameAndUnit[Constant.productParameters.quantity] ?? null;
    }

    public static transformToCSV(headers: string[], data: any[]): string {
        const json2csvParser = new Parser({ fields: headers });
        const csv = json2csvParser.parse(data);

        return csv;
    }

    public static getTrackTime(text?: string): void {
        const hour = new Date().getHours();
        const min = new Date().getMinutes();
        const sec = new Date().getSeconds();
        const ms = new Date().getMilliseconds();
        console.error(`############### ${text} ############### ${hour}:${min}:${sec} --${ms} ###############`);
    }

    public static async getEnumValues(queryRunner: QueryRunner, enumName: string): Promise<string[]> {
        const values: { enumlabel: string }[] = await queryRunner.query(
            `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = '${enumName}'`,
        );

        return values.map((v) => v.enumlabel);
    }

    public static hashPassword(password: string): string {
        return bcrypt.hashSync(password, 8);
    }

    public static async createForeignKey(
        queryRunner: QueryRunner,
        tableName: string,
        name: string,
        columnNames: string[],
        refTable: string,
        referencedColumnNames: string[],
    ): Promise<void> {
        await queryRunner.createForeignKey(
            tableName,
            new TableForeignKey({
                name,
                columnNames,
                referencedTableName: refTable,
                referencedColumnNames,
            }),
        );
    }

    public static async createSearchIndex(
        queryRunner: QueryRunner,
        tableName: string,
        name: string,
        columnNames: string[],
    ): Promise<void> {
        await queryRunner.createIndex(tableName, {
            name,
            columnNames,
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });
    }

    public static padDigits(number: number, digits: number): string {
        return Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
    }

    public static round(num: number, precision: number): number {
        return Number(Math.round(Number(num + 'e+' + precision)) + 'e-' + precision);
    }

    public static deepClone(obj: any): any {
        return JSON.parse(JSON.stringify(obj));
    }

    public static sumProduct(first: number[], second: number[]): number {
        if (first.length !== second.length) {
            throw new Error('Sum product can only be calculated for same length arrays');
        }
        return first.reduce((p, c, i) => p + c * second[i], 0);
    }

    public static sum(numbers: number[]): number {
        return numbers.reduce((agg, curr) => agg + curr, 0);
    }

    public static nearestNeighbor(numbers: number[], value: number) {
        return numbers.reduce(
            (nearest, current) => (Math.abs(current - value) < Math.abs(nearest - value) ? current : nearest),
            numbers[0],
        );
    }

    public static async allSettled<T>(promises: Promise<T>[]): Promise<any[]> {
        return Promise.all(
            promises.map((promise) => {
                return promise
                    .then((value) => ({
                        status: 'fulfilled',
                        value,
                    }))
                    .catch((reason) => ({
                        status: 'rejected',
                        reason,
                    }));
            }),
        );
    }
}
