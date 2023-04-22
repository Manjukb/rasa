import * as Yup from 'yup';

export const CustomerSessionValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        history: Yup.boolean().typeError('history can be either true or false').optional(),
        product_id: Yup.string()
            .trim()
            .test('product_id', 'Product id is required', function (value: string): boolean | Yup.ValidationError {
                const history = this.resolve(Yup.ref('history'));
                const ifq_id = this.resolve(Yup.ref('rfqId'));
                if (ifq_id) return true;
                if (!!!history && !value) {
                    return this.createError({ message: 'product_id is required', path: 'product_id' });
                }
                return true;
            })
            .optional(),
        // .when('history', {
        //     is: false,
        //     then: Yup.string().trim().required('Product Id is required'),
        // })
        // .optional(),
        // product_name: Yup.string()
        //     .when('history', {
        //         is: true,
        //         then: Yup.string().trim().required('Product Name is required'),
        //     })
        //     .optional(),
        // tenant_id: Yup.string()
        //     .when('history', {
        //         is: true,
        //         then: Yup.string().trim().required('Tenant Id is required'),
        //     })
        //     .optional(),
    })
    .required();
