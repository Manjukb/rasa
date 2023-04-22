import * as Yup from 'yup';

import { UserOrganisationService } from '../services';

export const AdminInfoValidator = Yup.object()
    .shape({
        name: Yup.string().trim().min(3).max(20).required(),
        email: Yup.string()
            .email()
            .required()
            .test('admin_email', 'admin email already used', async function (email): Promise<
                boolean | Yup.ValidationError
            > {
                if (!email) {
                    return false;
                }
                const user = await new UserOrganisationService().getUser({ email });
                if (user && user.data) {
                    return false;
                }
                return true;
            }),
    })
    .required();
