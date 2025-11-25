<?php

use App\Services\CalculateService;
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

Route::post('/calculate', function (Request $request, CalculateService $service) {
    $matches = $request->json('matches', []);

    $graph = $service->buildGraph($matches);
    $sccs = $service->findSCCs($graph);
    $order = $service->getFinalOrder($matches);

    return response()->json(compact('order'));
});
