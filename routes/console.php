<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('currencies:update')->daily();
Schedule::command('uploads:prune')->hourly();
