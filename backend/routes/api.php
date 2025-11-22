<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/hello', function () {
    return response()->json([
        'message' => 'Hello from Lambda!',
        'status' => 'success',
    ]);
});

Route::get('/calculate', function (Request $request) {
    $mockResponse = [
        'order' => [
            'Ni',
            'Ti',
            ['Fe', 'Fi', 'Ne'],
            'Se',
            ['Te', 'Si'],
        ],
    ];

    return response()->json($mockResponse);
});
