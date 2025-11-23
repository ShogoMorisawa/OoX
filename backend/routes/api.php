<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Services\CalculateService;

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

    logger()->info('Generated Graph:', $graph);
    logger()->info('Detected SCCs:', $sccs);

    return response()->json([
        'graph' => $graph,
        'sccs' => $sccs,
    ]);
});
