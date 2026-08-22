<?php

namespace App\Services\Sso\Presets;

use App\Enums\SsoPreset;
use App\Models\IdentityProvider;

class CustomOidcPreset extends AbstractOidcPreset
{
    public function key(): SsoPreset
    {
        return SsoPreset::CustomOidc;
    }

    public function fields(): array
    {
        return [
            ['key' => 'discovery_url', 'label' => __('messages.sso.fields.discovery_url'), 'type' => 'url', 'required' => true, 'group' => 'config', 'placeholder' => 'https://idp.example.com/.well-known/openid-configuration'],
            ['key' => 'scopes', 'label' => __('messages.sso.fields.scopes'), 'type' => 'text', 'required' => false, 'group' => 'config', 'placeholder' => __('messages.sso.placeholders.scopes')],
            ...$this->clientFields(),
        ];
    }

    protected function discoveryUrl(IdentityProvider $provider): string
    {
        return (string) $provider->config('discovery_url');
    }
}
