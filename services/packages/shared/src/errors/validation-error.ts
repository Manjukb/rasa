import * as HttpErrors from 'restify-errors';
import { ResponseViewModel } from '../viewmodels/response-viewmodel';

export class ValidationError extends HttpErrors.HttpError {
    /**
     *
     */
    public constructor(private readonly errorModel: ResponseViewModel<null>) {
        super('');
    }

    public toJSON(): ResponseViewModel<null> {
        return this.errorModel;
    }
}
