require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const ClientError = require('./exceptions/ClientError');

// Albums
const albums = require('./api/albums');
const albumsValidator = require('./validator/albums');
const AlbumsService = require('./services/postgres/AlbumsService');

// Songs
const songs = require('./api/songs');
const songsValidator = require('./validator/songs');
const SongsService = require('./services/postgres/SongsService');

// Authentications
const authentications = require('./api/authentications');
const authenticationsValidator = require('./validator/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const tokenManager = require('./tokenize/TokenManager');

// Users
const users = require('./api/users');
const usersValidator = require('./validator/users');
const UsersService = require('./services/postgres/UsersService');

// Playlists
const playlists = require('./api/playlist');
const playlistsValidator = require('./validator/playlists');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistsSongsService = require('./services/postgres/PlaylistsSongsService');
const PlaylistsSongsActivitiesService = require('./services/postgres/PlaylistsSongsActivitiesService');

// Collaborations
const collaborations = require('./api/collaborations');
const CollaborationsValidator = require('./validator/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');


const init = async () => {
    const albumsService = new AlbumsService();
    const songsService = new SongsService();
    const authenticationsService = new AuthenticationsService();
    const usersService = new UsersService();
    const collaborationsService = new CollaborationsService();
    const playlistsService = new PlaylistsService(collaborationsService);
    const playlistsSongsService = new PlaylistsSongsService();
    const playlistsSongsActivitiesService = new PlaylistsSongsActivitiesService();

    const server = Hapi.server({
        port: 5000,
        host: process.env.HOST,
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    await server.register([
        {
            plugin: Jwt,
        },
    ]);

    server.auth.strategy('openmusic_jwt', 'jwt', {
        keys: process.env.ACCESS_TOKEN_KEY,
        verify: {
            aud: false,
            iss: false,
            sub: false,
            maxAgeSec: process.env.ACCESS_TOKEN_AGE,
        },
        validate: (artifacts) => ({
            isValid: true,
            credentials: {
                id: artifacts.decoded.payload.id,
            },
        }),
    });

    await server.register([
        {
            plugin: albums,
            options: {
                AlbumsService: albumsService,
                SongsService: songsService,
                AlbumsValidator: albumsValidator,
            },
        },
        {
            plugin: songs,
            options: {
                SongsService: songsService,
                SongsValidator: songsValidator,
            },
        },
        {
            plugin: authentications,
            options: {
                AuthenticationsService: authenticationsService,
                UsersService: usersService,
                TokenManager: tokenManager,
                AuthenticationsValidator: authenticationsValidator,
            },
        },
        {
            plugin: users,
            options: {
                UsersService: usersService,
                UsersValidator: usersValidator,
            },
        },
        {
            plugin: playlists,
            options: {
                PlaylistsService: playlistsService,
                PlaylistsSongsService: playlistsSongsService,
                PlaylistsSongsActivitiesService: playlistsSongsActivitiesService,
                PlaylistsValidator: playlistsValidator,
            },
        },
        {
            plugin: collaborations,
            options: {
                CollaborationsService: collaborationsService,
                PlaylistsService: playlistsService,
                CollaborationsValidator: CollaborationsValidator,
            },
        },
    ]);

    server.ext('onPreResponse', (request, h) => {
        const { response } = request;
        if (response instanceof Error) {
            if (response instanceof ClientError) {
                const newResponse = h.response({
                    status: 'fail',
                    message: response.message,
                });
                newResponse.code(response.statusCode);
                return newResponse;
            }

            if (!response.isServer) {
                return h.continue;
            }

            const newResponse = h.response({
                status: 'error',
                message: 'terjadi kegagalan pada server kami',
            });
            newResponse.code(500);
            return newResponse;
        }

        return h.continue;
    });

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
