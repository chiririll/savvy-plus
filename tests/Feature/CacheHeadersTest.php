<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('tells CDNs not to cache the SPA shell', function () {
    $response = $this->get('/');

    $response->assertOk();
    expect($response->headers->get('Cache-Control'))->toContain('no-store');
    $response->assertHeader('CDN-Cache-Control', 'no-store');
    $response->assertHeader('Cloudflare-CDN-Cache-Control', 'no-store');
});

it('tells CDNs not to cache API responses', function () {
    $response = $this->getJson('/api/auth/status');

    $response->assertOk();
    expect($response->headers->get('Cache-Control'))->toContain('no-store');
    $response->assertHeader('CDN-Cache-Control', 'no-store');
    $response->assertHeader('Cloudflare-CDN-Cache-Control', 'no-store');
});
