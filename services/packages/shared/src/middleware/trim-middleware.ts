import { Next, Request, Response } from 'restify';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trimStringProperties(obj?: any): void {
    if (obj !== null && typeof obj === 'object') {
        for (const prop in obj) {
            // if the property is an object trim it too

            if (typeof obj[prop] === 'object') {
                return trimStringProperties(obj[prop]);
            }

            // if it's a string remove begin and end whitespace

            if (typeof obj[prop] === 'string') {
                if (prop === 'email') {
                    const email: string = obj[prop];

                    obj[prop] = email.toLowerCase();
                }

                obj[prop] = obj[prop].trim();
            }
        }
    }
}

export const TrimMiddleware = (request: Request, _: Response, next: Next): void => {
    trimStringProperties(request.body);

    next();
};
