let CACHE_NAME = 'country-v7';
let urlsToCache = [
    "./",
    
    "./imgs/icono1.png",
    "./imgs/icono2.png",
    "./imgs/sin_imagen.jpg",
    "./imgs/user.jpg",

    "./styles/main.css",
    
    "./scripts/Configurar.js",
    "./scripts/Globals.js",
    "./scripts/Index.js",
    "./scripts/IniciarSesion.js",
    "./scripts/MisTurnos.js",
    "./scripts/NuestroClub.js",
    "./scripts/Registrarse.js",
    "./scripts/ReservarTurno.js",
    "./scripts/Usuarios.js",
    "./scripts/VerTurnos.js",

    "./configurar",
    "./index",
    "./iniciar-sesion",
    "./mis-turnos",
    "./nuestro-club",
    "./registrarse",
    "./reservar-turno",
    "./usuarios",
    "./ver-turnos",

    "./resources/country_400x400.png",
    "./resources/Fechas.js",
    "./resources/logo.png",
    "./resources/Modal.js",

    "./resources/cdns/all.min.css",
    "./resources/cdns/bootstrap.min.css",
    "./resources/cdns/bootstrap.min.js",
    "./resources/cdns/brands.min.css",
    "./resources/cdns/jquery-3.6.1.min.js",
    "./resources/cdns/popper.min.js",
];

self.addEventListener('install', function(event) {
// Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
        .then(function(response) {
          // Cache hit - return response
            if (response) {
                    return response;
            }
            return fetch(event.request);
        })
    );
});

self.addEventListener('activate', function(event) {
    var cacheWhitelist = ['pigment'];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
                return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});