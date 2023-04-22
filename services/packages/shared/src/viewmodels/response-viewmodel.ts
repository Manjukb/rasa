import { SuccessResponse } from './response/success-response';

export class ErrorModel {
    public constructor(message: string, property?: string) {
        this.message = message;
        if (property) {
            this.property = property;
        }
    }
    public property = '';
    public message: string;
}

export class ResponseViewModel<T> {
    public errors: ErrorModel[] = [];
    public data: T | null = null;

    public static hasErrors<T>(viewModel: ResponseViewModel<T>): boolean {
        return !viewModel || !viewModel.data || (viewModel.errors && viewModel.errors.length > 0);
    }

    public static hasErrorsStrict<T>(viewModel: ResponseViewModel<T>): boolean {
        return viewModel && viewModel.errors && viewModel.errors.length > 0;
    }

    public static getData<T>(viewModel: ResponseViewModel<T>, defaultValue: T): T {
        return viewModel.data || defaultValue;
    }

    public static with<T>(response: T): ResponseViewModel<T> {
        const vm = new ResponseViewModel<T>();
        vm.data = response;
        return vm;
    }

    public static withError(error: string): ResponseViewModel<null> {
        const vm = new ResponseViewModel<null>();
        vm.data = null;
        vm.errors.push({ message: error, property: '' });

        return vm;
    }

    public static withErrors(errors: string[]): ResponseViewModel<null> {
        const vm = new ResponseViewModel<null>();
        vm.data = null;
        vm.errors.push(
            ...errors.map((message) => {
                return { message, property: '' };
            }),
        );

        return vm;
    }

    public static withErrorModels(errors: ErrorModel[]): ResponseViewModel<null> {
        const vm = new ResponseViewModel<null>();
        vm.data = null;
        vm.errors = errors;

        return vm;
    }

    public static withSuccess(really?: boolean): ResponseViewModel<SuccessResponse> {
        const success = new SuccessResponse();
        success.success = really || true;
        const vm = new ResponseViewModel<SuccessResponse>();
        vm.data = success;
        return vm;
    }
}
