<?php

it('exposes the laravel environment to the spa shell', function () {
    $this->get('/')
        ->assertOk()
        ->assertSee('<meta name="app-env" content="testing">', false);
});

it('exposes production as the spa environment when APP_ENV is production', function () {
    $this->app['env'] = 'production';

    $this->get('/')
        ->assertOk()
        ->assertSee('<meta name="app-env" content="production">', false)
        ->assertDontSee('<meta name="app-env" content="testing">', false);
});
