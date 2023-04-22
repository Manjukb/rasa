import { BusinessType, Roles, SessionStatus } from '../enum';
import {
    ProcurementProductCsvFields,
    ProcurementProductCsvSampleValue,
    ProductParameterCsvFields,
    ProductParameterCsvSampleValue,
} from './product-parameter-csv-fields';

export class Constant {
    public static readonly ERROR_MESSAGES = {
        JSON_WEB_TOKEN_ERROR: 'Invalid token',
        TOKEN_EXPIRED_ERROR: 'Token is expired',
        DEFAULT_TOKEN_ERROR: 'Invalid Token',
        INCORRECT_LOGIN_DETAIL: 'Incorrect username or password',
        ACCOUNT_DEACTIVATED: 'Your account is de-activated',
        UNAUTHORIZED_ACCESS: 'Un-Authorized Access',
    };
    public static readonly ERROR_TYPES = {
        JSON_WEB_TOKEN_ERROR: 'JsonWebTokenError',
        TOKEN_EXPIRED_ERROR: 'TokenExpiredError',
    };
    public static readonly TOKEN_PREFIX = 'Bearer ';
    public static readonly SUPER_ADMIN_ROLE = 'super_admin';

    public static readonly MAIL_TYPES = {
        WELCOME: 'welcome',
        RESET_PASSWORD: 'reset_password',
    };

    public static readonly seedData = {
        organisationName: 'test',
        superAdminName: 'super-admin',
        superAdminEmail: 'superadmin@test.com',
    };

    public static readonly clientAdminRoles: string[] = [Roles.enterprise_admin, Roles.saas_admin];

    public static readonly botSchemaFieldsTypes = {
        array: 'array',
        number: 'number',
        string: 'string',
    };

    public static readonly sessionTimeOut = 7;

    public static dbConstraintType = {
        foreignKey: 'FOREIGN KEY',
        primaryKey: 'PRIMARY KEY',
        uniqueKey: 'UNIQUE',
        checkKey: 'CHECK',
    };

    public static readonly productParameters = {
        price: 'price',
        quantity: 'quantity',
        paymentDate: 'payment_date',
        discount: 'discount',
        monthlyQuantity: 'monthly_quantity',
    };

    public static organisationUserRoles: string[] = [
        Roles.enterprise_admin,
        Roles.enterprise_user,
        Roles.org_admin,
        Roles.saas_admin,
        Roles.super_admin,
    ];
    public static tenantUserRoles: string[] = [Roles.tenant_admin, Roles.tenant_user];
    public static customerRoles: string[] = [Roles.customer];
    public static supplierRoles: string[] = [Roles.supplier];

    public static userGroupTypes = {
        organisationUser: 'organisation_user',
        tenantUser: 'tenant_user',
        customer: 'customer',
        supplier: 'supplier',
    };

    public static twilioBotUserName = 'bot';
    public static botActionTextOnCustomerOffer = [
        `Hmmm...that's a bit low. How about this?`,
        `We seem to be closing in on a deal. How about this?`,
        `We are so close to an agreement. Let me make you an improved offer:`,
        `Sorry, this is our final offer:`,
    ];
    public static pageSize = 10;
    public static saasNegotiationPageSize = 50;

    public static openStatuses: string[] = [
        SessionStatus.in_progress,
        SessionStatus.init,
        SessionStatus.customer_accepted,
    ];

    public static closedStatuses: string[] = [
        SessionStatus.rejected,
        SessionStatus.customer_rejected,
        SessionStatus.completed,
    ];

    public static offerBy = {
        bot: 'bot',
        user: 'user',
        supplier: 'supplier',
        agent: 'agent',
    };

    public static paymentTermsField = 'payment_terms';
    public static readonly paymentTermsWeight = 0.1;

    public static requiredParams = ['price', 'quantity'];
    public static optionalFields = [Constant.paymentTermsField + 'a']; // disabling for small time, need to rework for code stability

    public static channelUserRoles = {
        customer: 'customer',
        bot: 'bot',
        admin: 'admin',
        superAdmin: 'super_admin',
    };

    public static readonly SampleProductCode = 'TEST1290';
    public static readonly productParameterCSVFields = ProductParameterCsvFields;
    public static readonly productCSVFields = ProcurementProductCsvFields;
    public static readonly supplierCSVFields = [
        'company_name',
        'company_address',
        'supplier_name',
        'supplier_email',
        'supplier_phone',
    ];

    public static readonly supplierCSVSampleValues = {
        company_name: 'test-company',
        company_address: 'test-address',
        supplier_name: 'test-supplier',
        supplier_email: 'supplier@example.com',
        supplier_phone: '1234567890',
    };

    public static readonly categoryCSVFields = ['category_name', 'sub_category_name'];
    public static readonly productParameterCSVSampleValue = ProductParameterCsvSampleValue;
    public static readonly productCSVSampleValue = ProcurementProductCsvSampleValue;
    public static readonly categoryCSVSampleValue = { category_name: 'test', sub_category_name: 'test subcategory' };

    public static readonly NegotiationEvents = {
        onOfferRejected: 'onOfferRejected',
        onOfferAccepted: 'onOfferAccepted',
        onCustomerAcceptedOffer: 'onCustomerAcceptedOffer',
        onCustomerStartedEnquiry: 'onCustomerStartedEnquiry',
        onCustomerRejectedOffer: 'onCustomerRejectedOffer',
        onAgentMadeOffer: 'onAgentMadeOffer',
    };

    public static readonly SupplierImportEvents = {
        onSupplierOnBoarded: 'onSupplierOnBoarded',
        onNewClientHandShaken: 'onNewClientHandShaken',
    };

    public static readonly RfqStatus = {
        awardrequested: 'awardrequested',
        awardRejected: 'awardRejected',
        awarded: 'awarded',
    };

    public static readonly StepCount = {
        price: 0.5,
        quantity: 1,
    };

    public static readonly RfqAwardStatus = {
        accepted: 'accepted',
        rejected: 'rejected',
    };
    public static readonly SupplierOfferEvents = {
        onSupplierOfferSubmitted: 'onSupplierOfferSubmitted',
        onRfqNegotiationRoundCompleted: 'onRfqNegotiationRoundCompleted',
        onRfqFinalRoundCompleted: 'onRfqFinalRoundCompleted',
        onAutoAcceptScoreReached: 'onAutoAcceptScoreReached',
        onAllSuppliersRoundOfferSubmitted: 'onAllSuppliersRoundOfferSubmitted',
    };

    public static readonly CopilotOfferEvents = {
        onCopilotOfferSubmitted: 'onCopilotOfferSubmitted',
    };

    public static readonly PMEvents = {
        onRfqExit: 'onRfqExit',
    };

    public static readonly SupplierNotificationMessage = {
        RFQAwardedReject: '{{Procurement_Manager_Name}}, {{Organisation_Name}} has rejected your RFQ request',
        RFQAwardedPending: '{{Procurement_Manager_Name}}, {{Organisation_Name}} has sent you a RFQ request to Accept',
        RFQOpened: '{{Procurement_Manager_Name}}, {{Organisation_Name}} has sent you a RFQ invitation',
        RFQDeadlineApproaching: '{{Procurement_Manager_Name}}, {{Organisation_Name}} has sent you a deadline reminder',
        RFQSupplierOfferSubmitted:
            '{{Procurement_Manager_Name}}, {{Organisation_Name}} has sent you an acknowledgement message',
        RFQRoundCompleted: '{{Procurement_Manager_Name}}, {{Organisation_Name}} has sent you the RFQ response',
        RFQAwardedWon: '{{Procurement_Manager_Name}}, {{Organisation_Name}} has sent you the RFQ status',
        RFQAwardedLost: '{{Procurement_Manager_Name}}, {{Organisation_Name}} has sent you the RFQ status',
        RFQCopilotOfferSubmitted: '{{Procurement_Manager_Name}}, {{Organisation_Name}} has sent you the RFQ response',
        RFQCopilotDeadlineApproaching:
            '{{Procurement_Manager_Name}}, {{Organisation_Name}} has sent you a deadline reminder',
        RFQExited:
            '{{Procurement_Manager_Name}}, {{Organisation_Name}} has closed the RFQ without awarding it to any supplier',
    };

    public static readonly ProcurementManagerNotificationMessage = {
        SupplierRoundOfferSubmittedProcurement:
            '{{Supplier_Name}}, {{Supplier_Organisation_Name}} has submitted an RFQ offer',
        AllSuppliersRoundOfferSubmittedProcurement: 'RFQ Reference No: {{RFQ_Reference_No}} is ready for next step',
        FinalRoundOfferSubmittedProcurement:
            'RFQ Reference No: {{RFQ_Reference_No}} final round is completed and ready to be awarded',
        AutoAcceptanceScoreReached: 'RFQ Reference No: {{RFQ_Reference_No}} is completed and ready to be awarded',
        RFQAwardAccept:
            '{{Supplier_Name}}, {{Supplier_Organisation_Name}} has accepted the offer for the RFQ Reference No: {{RFQ_Reference_No}}',
        RFQAwardedReject:
            '{{Supplier_Name}}, {{Supplier_Organisation_Name}} has rejected the offer for the RFQ Reference No: {{RFQ_Reference_No}}',
    };

    public static readonly EzySourceNegotiationEvents = {
        negotiationAccepted: 'negotiationAccepted',
        negotiationRejected: 'negotiationRejected',
        negotiationCustomerAcceptedOffer: 'negotiationCustomerAcceptedOffer',
        negotiationCustomerStartedEnquiry: 'negotiationCustomerStartedEnquiry',
        negotiationCustomerRejectedOffer: 'negotiationCustomerRejectedOffer',
        negotiationAgentMadeOffer: 'negotiationAgentMadeOffer',
    };

    public static readonly BusinessTypes: string[] = [
        BusinessType.collections,
        BusinessType.procurement,
        BusinessType.sales,
    ];
}
