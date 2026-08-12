var ArkView = ArkView || {};

ArkView.ProjectData = {
    etaje: [
        {
            nume: 'DATABASE_LAYER',
            culoare: 0x00e5ff,
            functii: [
                { id: 'db_init', nume: 'initPool()', x: -25, z: -20 },
                { id: 'db_query', nume: 'executeQuery()', x: 0, z: -30 },
                { id: 'db_close', nume: 'closeConnection()', x: 25, z: -20 }
            ]
        },
        {
            nume: 'CORE_LOGIC_LAYER',
            culoare: 0xff44cc,
            functii: [
                { id: 'auth_main', nume: 'validateToken()', x: -30, z: 10 },
                { id: 'calc_salary', nume: 'calculateSalar()', x: 0, z: 0 },
                { id: 'pdf_gen', nume: 'generateReport()', x: 30, z: 10 }
            ]
        },
        {
            nume: 'API_GATEWAY_LAYER',
            culoare: 0xb026ff,
            functii: [
                { id: 'api_router', nume: 'routeRequest()', x: -15, z: 30 },
                { id: 'api_cors', nume: 'handleCORS()', x: 15, z: 30 }
            ]
        }
    ],
    legaturi: [
        { deLa: 'auth_main', la: 'db_query' },
        { deLa: 'calc_salary', la: 'db_query' },
        { deLa: 'api_router', la: 'auth_main' },
        { deLa: 'api_router', la: 'calc_salary' },
        { deLa: 'pdf_gen', la: 'db_query' }
    ]
};
