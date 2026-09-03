<?php

use App\Enums\TransactionKind;
use App\Enums\TransactionStatus;
use App\Models\Transaction;

it('classifies a transaction by status and recurring link', function (
    TransactionStatus $status,
    ?int $recurringId,
    TransactionKind $expected,
) {
    $transaction = new Transaction([
        'status' => $status,
        'recurring_transaction_id' => $recurringId,
    ]);

    expect($transaction->kind())->toBe($expected);
})->with([
    [TransactionStatus::Pending, null, TransactionKind::OneOffPending],
    [TransactionStatus::Pending, 1, TransactionKind::RecurringPending],
    [TransactionStatus::Confirmed, null, TransactionKind::Confirmed],
    [TransactionStatus::Confirmed, 1, TransactionKind::Confirmed],
    [TransactionStatus::Skipped, null, TransactionKind::OneOffSkipped],
    [TransactionStatus::Skipped, 1, TransactionKind::RecurringSkipped],
]);

it('exposes actions for each kind', function (TransactionKind $kind, array $actions) {
    expect($kind->actions())->toBe($actions);
})->with([
    [TransactionKind::OneOffPending, [
        'edit' => true,
        'duplicate' => true,
        'delete' => true,
        'confirm' => true,
        'skip' => false,
    ]],
    [TransactionKind::RecurringPending, [
        'edit' => false,
        'duplicate' => false,
        'delete' => false,
        'confirm' => true,
        'skip' => true,
    ]],
    [TransactionKind::Confirmed, [
        'edit' => true,
        'duplicate' => true,
        'delete' => true,
        'confirm' => false,
        'skip' => false,
    ]],
    [TransactionKind::OneOffSkipped, [
        'edit' => false,
        'duplicate' => false,
        'delete' => true,
        'confirm' => false,
        'skip' => false,
    ]],
    [TransactionKind::RecurringSkipped, [
        'edit' => false,
        'duplicate' => false,
        'delete' => false,
        'confirm' => false,
        'skip' => false,
    ]],
]);
