# PhonePe Payment Gateway Integration

This document describes the PhonePe payment gateway integration alongside the existing Stripe integration.

## Overview

The application now supports both Stripe and PhonePe payment gateways, with the ability to switch between them using environment variables. The integration follows a factory pattern to ensure clean separation of concerns.

## Architecture

### Payment Gateway Factory Pattern

- **PaymentGatewayFactory**: Central factory that returns the appropriate payment gateway based on environment configuration
- **PaymentGatewayInterface**: Common interface implemented by both Stripe and PhonePe services
- **StripeService**: Handles Stripe-specific payment operations
- **PhonePeService**: Handles PhonePe-specific payment operations

### Database Schema

New `PaymentOrder` model tracks all payment orders regardless of gateway:
- `gateway`: Enum (STRIPE | PHONEPE)
- `merchantOrderId`: Unique order identifier
- `gatewayOrderId`: Gateway-specific order ID
- `status`: Payment status (PENDING | COMPLETED | FAILED | CANCELLED)
- Gateway-specific fields for redirect URLs and deep links

## Environment Configuration

### Required Environment Variables

```env
# Payment Gateway Selection
PAYMENT_GATEWAY="phonepe"  # Options: "stripe" or "phonepe"

# PhonePe Configuration
PHONEPE_CLIENT_ID="your-phonepe-client-id"
PHONEPE_CLIENT_SECRET="your-phonepe-client-secret"
PHONEPE_CLIENT_VERSION="1.0"
PHONEPE_ENVIRONMENT="SANDBOX"  # Options: "SANDBOX" or "PRODUCTION"
PHONEPE_MERCHANT_ID="your-phonepe-merchant-id"
PHONEPE_CALLBACK_USERNAME="your-callback-username"
PHONEPE_CALLBACK_PASSWORD="your-callback-password"

# Stripe Configuration (existing)
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-stripe-webhook-secret"
```

## API Endpoints

### Payment Checkout
```
POST /subscriptions/checkout
```

**Request Body:**
```json
{
  "planId": "plan_id",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

**Response:**
```json
{
  "url": "https://payment-gateway-url",
  "deepLink": "phonepe://payment", // Only for PhonePe
  "gateway": "PHONEPE" // or "STRIPE"
}
```

### Order Status Check
```
GET /payments/status/:orderId
```

**Response:**
```json
{
  "success": true,
  "status": "COMPLETED",
  "orderId": "order_id",
  "gatewayOrderId": "gateway_order_id"
}
```

### Webhook Endpoints
```
POST /payments/webhook
```

Handles webhooks from both Stripe and PhonePe automatically based on the configured gateway.

## PhonePe Integration Details

### Order Creation Flow

1. **Request Creation**: Uses PhonePe SDK to create payment request
2. **Amount Conversion**: Converts amount to paisa (PhonePe uses paisa)
3. **Meta Information**: Includes user ID, plan ID, and subscription type
4. **Database Storage**: Stores order details in `PaymentOrder` table
5. **Response**: Returns redirect URL and deep link for mobile apps

### Webhook Handling

1. **Callback Validation**: Validates PhonePe callback using username/password
2. **Status Mapping**: Maps PhonePe status to internal status
3. **Database Update**: Updates order status in database
4. **Subscription Creation**: Creates subscription if payment is completed

### Mobile App Support

PhonePe provides deep links for mobile app integration:
- **Deep Link**: `phonepe://payment` - Opens PhonePe app directly
- **Fallback**: Redirect URL for web browsers

## Frontend Integration

### Payment Flow

```typescript
const response = await api.post('/subscriptions/checkout', {
  planId,
  successUrl: `${window.location.origin}/student/subscriptions?success=true`,
  cancelUrl: `${window.location.origin}/student/subscriptions?canceled=true`,
});

// Handle different payment gateways
if (response.data.deepLink) {
  // PhonePe - try deep link first, fallback to redirect URL
  if (window.location.protocol === 'https:' && response.data.deepLink) {
    window.location.href = response.data.deepLink;
  } else {
    window.location.href = response.data.url;
  }
} else {
  // Stripe or other gateways
  window.location.href = response.data.url;
}
```

## Testing

### PhonePe Sandbox

1. Set `PHONEPE_ENVIRONMENT="SANDBOX"`
2. Use PhonePe test credentials
3. Test with sandbox payment methods

### Production Setup

1. Set `PHONEPE_ENVIRONMENT="PRODUCTION"`
2. Use production PhonePe credentials
3. Configure webhook URLs in PhonePe dashboard

## Security Considerations

1. **Webhook Validation**: All PhonePe webhooks are validated using username/password
2. **Environment Separation**: Sandbox and production environments are completely separate
3. **Credential Management**: All sensitive credentials are stored in environment variables
4. **Order Tracking**: All orders are tracked in database for audit purposes

## Error Handling

The integration includes comprehensive error handling:
- Gateway-specific error messages
- Fallback mechanisms for failed payments
- Database transaction rollback on errors
- Detailed logging for debugging

## Migration from Stripe

To switch from Stripe to PhonePe:

1. Update environment variables
2. Set `PAYMENT_GATEWAY="phonepe"`
3. Configure PhonePe credentials
4. Update webhook URLs in PhonePe dashboard
5. Test thoroughly in sandbox environment

## Support

For PhonePe-specific issues, refer to:
- [PhonePe Developer Documentation](https://developer.phonepe.com/payment-gateway/backend-sdk/nodejs-be-sdk/api-reference-node-js/webhook-handling)
- PhonePe Integration Team (for UAT credentials)

## Files Modified/Created

### New Files
- `backend/src/payments/interfaces/payment-gateway.interface.ts`
- `backend/src/payments/services/phonepe.service.ts`
- `backend/src/payments/services/stripe.service.ts`
- `backend/src/payments/services/payment-gateway.factory.ts`
- `backend/src/payments/payments.module.ts`
- `backend/src/payments/payments.controller.ts`

### Modified Files
- `backend/prisma/schema.prisma` - Added PaymentOrder model
- `backend/src/subscriptions/subscriptions.service.ts` - Updated to use factory
- `backend/src/subscriptions/subscriptions.module.ts` - Added PaymentsModule
- `backend/src/app.module.ts` - Added PaymentsModule
- `backend/env.example` - Added PhonePe configuration
- `frontend/src/app/student/subscriptions/page.tsx` - Updated payment flow

### Dependencies
- Added PhonePe Node.js SDK: `pg-sdk-node`








