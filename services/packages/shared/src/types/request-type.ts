import { Request } from 'restify';
import { RequestUserResponse } from '../viewmodels/response/request-user-response';

// import { User } from '../database/models/user';

export type WithUserRequest = Request & { user: RequestUserResponse };
