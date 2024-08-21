class SongsHandler {
    constructor(SongsService, SongsValidator) {
        this._songsService = SongsService;
        this._songsValidator = SongsValidator;

        (async () => {
            const autoBind = (await import('auto-bind')).default;
        })();
    }

    async postSongHandler(request, h) {
        this._songsValidator.validateSongsPayload(request.payload);

        const songId = await this._songsService.addSong(request.payload);

        const response = h.response({
            status: 'success',
            message: 'Lagu berhasil ditambahkan',
            data: {
                songId,
            },
        });
        response.code(201);
        return response;
    }

    async getSongsHandler(request) {
        const {title, performer} = request.query;

        const songs = await this._songsService.getSongs(title, performer);

        return {
            status: 'success',
            data: {
                songs,
            },
        };
    }

    async getSongByIdHandler(request, h) {
        const {id} = request.params;

        const song = await this._songsService.getSongById(id);

        return h.response({
            status: 'success',
            data: {
                song,
            },
        });
    }

    async putSongByIdHandler(request, h) {
        this._songsValidator.validateSongsPayload(request.payload);

        const {id} = request.params;
        await this._songsService.editSongById(id, request.payload);

        return h.response({
            status: 'success',
            message: 'Lagu berhasil diperbarui',
        });
    }

    async deleteSongByIdHandler(request, h) {
        const {id} = request.params;

        await this._songsService.deleteSongById(id);

        return h.response({
            status: 'success',
            message: 'Lagu berhasil dihapus',
        });
    }
}

module.exports = SongsHandler;
