<?php

namespace App\Http\Controllers;

use App\DTOs\TransactionData;
use App\DTOs\TransactionFilterData;
use App\Http\Requests\Transaction\StoreTransactionRequest;
use App\Http\Requests\Transaction\TransactionFilterRequest;
use App\Http\Requests\Transaction\UpdateTransactionRequest;
use App\Http\Resources\TransactionCollection;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use App\Services\TransactionService;
use DomainException;
use Illuminate\Http\JsonResponse;

class TransactionController extends Controller
{
    public function __construct(
        private TransactionService $transactionService
    ) {}

    public function index(TransactionFilterRequest $request): TransactionCollection
    {
        $filters = TransactionFilterData::fromArray($request->validated());
        $transactions = $this->transactionService->getFiltered($filters);

        $collection = new TransactionCollection($transactions);

        if ($request->boolean('with_summary')) {
            $collection->additional([
                'summary' => $this->transactionService->getSummary($filters),
            ]);
        }

        return $collection;
    }

    public function store(StoreTransactionRequest $request): JsonResponse
    {
        $data = TransactionData::fromArray($request->validated());
        $transaction = $this->transactionService->create($data);

        return (new TransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Transaction $transaction): TransactionResource
    {
        return new TransactionResource($this->transactionService->findOrFail($transaction->id));
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction): TransactionResource|JsonResponse
    {
        $data = TransactionData::fromArray(array_merge(
            $transaction->toArray(),
            $request->validated()
        ));

        try {
            $transaction = $this->transactionService->update($transaction, $data);
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return new TransactionResource($transaction);
    }

    public function destroy(Transaction $transaction): JsonResponse
    {
        try {
            $this->transactionService->delete($transaction);
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(null, 204);
    }

    public function confirm(Transaction $transaction): TransactionResource|JsonResponse
    {
        try {
            return new TransactionResource(
                $this->transactionService->confirm($transaction)
            );
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function skip(Transaction $transaction): TransactionResource|JsonResponse
    {
        try {
            return new TransactionResource(
                $this->transactionService->skip($transaction)
            );
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function duplicate(Transaction $transaction): JsonResponse
    {
        $newTransaction = $this->transactionService->duplicate($transaction);

        return (new TransactionResource($newTransaction))
            ->response()
            ->setStatusCode(201);
    }

    public function summary(TransactionFilterRequest $request): JsonResponse
    {
        $filters = TransactionFilterData::fromArray($request->validated());

        return response()->json($this->transactionService->getSummary($filters));
    }
}
