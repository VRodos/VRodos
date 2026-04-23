module.exports = [
    {
        ignores: ['**/node_modules/**', 'assets/js/runtime/master/lib/**/*.js']
    },
    {
        files: ['assets/js/runtime/master/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: {
                AFRAME: 'readonly',
                Blob: 'readonly',
                CustomEvent: 'readonly',
                Element: 'readonly',
                File: 'readonly',
                FormData: 'readonly',
                MediaRecorder: 'readonly',
                NAF: 'readonly',
                Stats: 'readonly',
                THREE: 'readonly',
                URL: 'readonly',
                alert: 'readonly',
                console: 'readonly',
                dat: 'readonly',
                document: 'readonly',
                easyrtc: 'readonly',
                fetch: 'readonly',
                gtag: 'readonly',
                mdc: 'readonly',
                navigator: 'readonly',
                performance: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                window: 'readonly'
            }
        },
        rules: {}
    }
];
