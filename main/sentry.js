const Sentry = require('@sentry/electron');
const { DEV } = process.env

Sentry.init({
    dsn: 'https://5af676ee91b945a5aed4e106e339a204@sentry.io/1301366',
    environment: DEV?"development":"production",
    //enableNative: false,
});

if ( document ) {
    document.addEventListener("DOMContentLoaded", () => {
        document.body.addEventListener("track-error", e => {
            Sentry.captureException(e.detail);
        });

        document.body.addEventListener("track-user", e => {
            Sentry.configureScope((scope) => {
                scope.setUser(e.detail);
            });
        });

        document.body.addEventListener("track-extra", e => {
            Sentry.configureScope((scope) => {
                Object.keys(e.detail).forEach(k => {
                    scope.setExtra(k, e.detail[k]);
                });
            });
        });

        document.body.addEventListener("track-message", e => {
            Sentry.captureMessage(e.detail);
        });
    });
}