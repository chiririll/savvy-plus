<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Auth\PasswordTokenService;
use App\Services\UserService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

class UserController extends Controller
{
    public function __construct(
        private UserService $userService,
        private PasswordTokenService $passwordTokens,
    ) {}

    public function index(): AnonymousResourceCollection
    {
        $users = $this->userService->getAll();

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->create($request->validated());

        $token = null;
        $expiresAt = null;

        if ($user->isInactive()) {
            $issued = $this->passwordTokens->issue($user);
            $token = $issued['token'];
            $expiresAt = $issued['expiresAt'];
        }

        return $this->userPayload($user, $token, $expiresAt, 201);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user);
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $user = $this->userService->update($user, $request->validated());

        return new UserResource($user);
    }

    public function destroy(User $user): JsonResponse
    {
        try {
            $this->userService->delete($user, auth()->id());

            return response()->json(null, 204);
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function issuePasswordToken(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => __('messages.users.reset_self')], 422);
        }

        if ($user->is_sso_only) {
            return response()->json(['message' => __('messages.users.reset_sso_only')], 422);
        }

        $issued = $this->passwordTokens->issue($user);

        return $this->userPayload($user, $issued['token'], $issued['expiresAt']);
    }

    private function userPayload(User $user, ?string $token = null, ?Carbon $expiresAt = null, int $status = 200): JsonResponse
    {
        $data = (new UserResource($user))->resolve();

        if ($token) {
            $data['token'] = $token;
            $data['expiresAt'] = $expiresAt?->toISOString();
        }

        return response()->json(['data' => $data], $status);
    }
}
