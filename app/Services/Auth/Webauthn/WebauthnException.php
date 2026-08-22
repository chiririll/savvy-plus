<?php

namespace App\Services\Auth\Webauthn;

use RuntimeException;

class WebauthnException extends RuntimeException
{
    public static function invalidChallenge(): self
    {
        return new self(__('messages.passkey.challenge_invalid'));
    }

    public static function verificationFailed(): self
    {
        return new self(__('messages.passkey.verification_failed'));
    }

    public static function unknownCredential(): self
    {
        return new self(__('messages.passkey.not_registered'));
    }

    public static function limitReached(int $max): self
    {
        return new self(__('messages.passkey.limit_reached', ['max' => $max]));
    }
}
