"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeIndianPhone = normalizeIndianPhone;
exports.isValidIndianMobile = isValidIndianMobile;
exports.formatPhoneForDisplay = formatPhoneForDisplay;
function normalizeIndianPhone(phone) {
    if (!phone)
        return phone;
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+91')) {
        return cleaned;
    }
    if (cleaned.startsWith('91')) {
        return '+' + cleaned;
    }
    if (cleaned.startsWith('0')) {
        return '+91' + cleaned.substring(1);
    }
    return '+91' + cleaned;
}
function isValidIndianMobile(phone) {
    if (!phone)
        return false;
    const normalized = normalizeIndianPhone(phone);
    const indianMobileRegex = /^\+91[6-9]\d{9}$/;
    return indianMobileRegex.test(normalized);
}
function formatPhoneForDisplay(phone) {
    if (!phone)
        return '';
    const normalized = normalizeIndianPhone(phone);
    if (normalized.length === 13) {
        return normalized.replace(/(\+91)(\d{5})(\d{4})(\d{1})/, '$1 $2****$4');
    }
    return normalized;
}
//# sourceMappingURL=phone.utils.js.map