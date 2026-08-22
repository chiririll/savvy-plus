<?php

return [
    'unauthenticated' => 'Unauthenticated.',
    'forbidden' => 'Forbidden',
    'read_only' => 'Read-only access',
    'csrf' => 'CSRF token mismatch.',
    'logged_out' => 'Logged out.',
    'registration_closed' => 'Registration is closed.',
    'password_login_locked' => 'Enable at least one SSO provider before turning off password sign-in.',
    'password_signin_disabled' => 'Password sign-in is disabled. Use single sign-on instead.',
    'invalid_credentials' => 'Invalid credentials.',

    'accounts' => [
        'delete_has_transactions' => 'Cannot delete account that has transactions.',
    ],

    'categories' => [
        'delete_has_transactions' => 'Cannot delete category that has transactions.',
        'delete_last' => 'Cannot delete the last category of this type.',
    ],

    'users' => [
        'demote_last_admin' => 'Cannot demote the last admin.',
        'delete_self' => 'Cannot delete yourself.',
        'delete_last_admin' => 'Cannot delete the last admin.',
    ],

    'currencies' => [
        'cannot_unset_base' => 'Cannot unset base currency. Set another currency as base first.',
        'base_rate_must_be_one' => 'Base currency rate must always be 1.',
        'delete_in_use' => 'Cannot delete currency that is used by accounts.',
        'delete_base' => 'Cannot delete base currency. Set another currency as base first.',
        'delete_last' => 'Cannot delete the last currency.',
    ],

    'debts' => [
        'not_a_debt' => 'Account is not a debt.',
        'payment_i_owe_only' => 'Payment can only be made for "I owe" debts.',
        'already_paid_off' => 'Debt is already paid off.',
        'cannot_use_debt_source' => 'Cannot use debt account as payment source.',
        'collection_owed_only' => 'Collection can only be made for "Owed to me" debts.',
        'cannot_use_debt_target' => 'Cannot use debt account as target.',
        'delete_with_history' => 'Cannot delete debt with payment history.',
        'not_paid_off' => 'Debt is not paid off.',
    ],

    'sso' => [
        'delete_sso_only_users' => 'Cannot delete: SSO-only users would be left without a way to sign in.',
    ],

    'two_factor' => [
        'already_enabled' => 'Two-factor authentication is already enabled.',
        'not_pending' => 'Two-factor authentication is not pending confirmation.',
        'not_enabled' => 'Two-factor authentication is not enabled.',
        'invalid_code' => 'Invalid verification code.',
        'enabled' => 'Two-factor authentication has been enabled.',
        'disabled' => 'Two-factor authentication has been disabled.',
        'invalid_token' => 'Invalid or expired token.',
        'codes_regenerated' => 'Recovery codes have been regenerated.',
    ],

    'passkey' => [
        'challenge_invalid' => 'Passkey challenge is invalid or has expired.',
        'verification_failed' => 'Passkey verification failed.',
        'not_registered' => 'This passkey is not registered.',
        'limit_reached' => 'You can register at most :max passkeys.',
    ],

    'validation' => [
        'transfer_destination' => 'Destination account is required for transfers.',
        'transfer_no_category' => 'Category should not be set for transfers.',
        'category_type_mismatch' => 'Category type must match transaction type.',
        'items_total' => 'Items total (:items) must equal transaction amount (:amount).',
        'insufficient_funds' => 'Insufficient funds. Available balance: :available',
        'cannot_use_debt_account' => 'Cannot use debt account for payments.',
        'payment_exceeds_remaining' => 'Payment amount (:amount) exceeds remaining debt (:remaining).',
        'condition_required' => 'At least one condition is required.',
        'action_required' => 'At least one action is required.',
        'upload_required' => 'An uploaded file is required to start an import.',
        'upload_not_found' => 'The uploaded file could not be found.',
        'custom_range_exceeded' => 'Custom range cannot exceed :days days.',
        'invalid_period_value' => 'Invalid period_value format for period_type ":type".',
    ],
];
