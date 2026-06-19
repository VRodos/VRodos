const browserGlobals = {
    window: 'readonly',
    document: 'readonly',
    navigator: 'readonly',
    console: 'readonly',
    performance: 'readonly',
    fetch: 'readonly',
    alert: 'readonly',
    setTimeout: 'readonly',
    clearTimeout: 'readonly',
    setInterval: 'readonly',
    clearInterval: 'readonly',
    requestAnimationFrame: 'readonly',
    cancelAnimationFrame: 'readonly',

    Blob: 'readonly',
    CustomEvent: 'readonly',
    Element: 'readonly',
    HTMLElement: 'readonly',
    HTMLAnchorElement: 'readonly',
    File: 'readonly',
    FileReader: 'readonly',
    FormData: 'readonly',
    Image: 'readonly',
    ImageData: 'readonly',
    MediaRecorder: 'readonly',
    MutationObserver: 'readonly',
    Option: 'readonly',
    TextDecoder: 'readonly',
    URL: 'readonly',
    URLSearchParams: 'readonly'
};

const baseRules = {
    'constructor-super': 'error',
    'for-direction': 'error',
    'getter-return': 'error',
    'no-async-promise-executor': 'error',
    'no-case-declarations': 'warn',
    'no-class-assign': 'error',
    'no-compare-neg-zero': 'error',
    'no-cond-assign': 'error',
    'no-const-assign': 'error',
    'no-constant-binary-expression': 'error',
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-control-regex': 'error',
    'no-debugger': 'error',
    'no-delete-var': 'error',
    'no-dupe-args': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-else-if': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-empty-character-class': 'error',
    'no-empty-pattern': 'error',
    'no-ex-assign': 'error',
    'no-fallthrough': 'error',
    'no-func-assign': 'error',
    'no-global-assign': 'error',
    'no-import-assign': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-loss-of-precision': 'error',
    'no-misleading-character-class': 'error',
    'no-new-native-nonconstructor': 'error',
    'no-nonoctal-decimal-escape': 'error',
    'no-obj-calls': 'error',
    'no-octal': 'error',
    'no-prototype-builtins': 'error',
    'no-redeclare': 'warn',
    'no-regex-spaces': 'error',
    'no-self-assign': 'error',
    'no-setter-return': 'error',
    'no-shadow-restricted-names': 'error',
    'no-sparse-arrays': 'error',
    'no-this-before-super': 'error',
    'no-undef': 'error',
    'no-unexpected-multiline': 'error',
    'no-unreachable': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',
    'no-unsafe-optional-chaining': 'error',
    'no-unused-labels': 'error',
    'no-useless-backreference': 'error',
    'no-useless-catch': 'error',
    'no-useless-escape': 'warn',
    'no-with': 'error',
    'require-yield': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',

    'no-unused-vars': ['warn', {
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none'
    }],

    'array-callback-return': 'error',
    'block-scoped-var': 'error',
    'consistent-return': 'warn',
    'curly': ['error', 'multi-line'],
    'default-case': 'warn',
    'dot-notation': 'warn',
    'eqeqeq': ['warn', 'smart'],
    'guard-for-in': 'warn',
    /*'no-alert': 'warn',*/
    'no-caller': 'error',
    'no-else-return': 'warn',
    'no-empty-function': 'warn',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'warn',
    'no-floating-decimal': 'error',
    'no-implicit-coercion': 'warn',
    'no-implied-eval': 'error',
    'no-invalid-this': 'off',
    'no-iterator': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-loop-func': 'warn',
    'no-multi-assign': 'warn',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-octal-escape': 'error',
    'no-param-reassign': 'off',
    'no-proto': 'error',
    'no-return-assign': ['error', 'except-parens'],
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-template-curly-in-string': 'warn',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'warn',
    'no-unused-expressions': 'warn',
    'no-use-before-define': ['warn', { functions: false, classes: true, variables: false }],
    'no-useless-call': 'warn',
    'no-useless-concat': 'warn',
    'no-var': 'warn',
    'object-shorthand': ['warn', 'properties'],
    'one-var': ['warn', 'never'],
    'prefer-const': 'warn',
    'prefer-template': 'error',
    'arrow-body-style': ['warn', 'as-needed'],
    'prefer-arrow-callback': 'warn',
    'radix': 'warn',
    'yoda': 'warn'
};

const runtimeRules = {
    ...baseRules,
    curly: ['warn', 'multi-line'],
    'no-floating-decimal': 'warn',
    'no-lone-blocks': 'warn',
    'no-prototype-builtins': 'warn',
    'no-return-assign': ['warn', 'except-parens'],
    'no-sequences': 'warn',
    'prefer-template': 'warn'
};

const runtimeGlobals = {
    ...browserGlobals,
    AFRAME: 'readonly',
    THREE: 'readonly',
    NAF: 'readonly',
    Stats: 'readonly',
    lil: 'readonly',
    easyrtc: 'readonly',
    gtag: 'readonly',
    VRODOSMaster: 'readonly',
    VRODOS_TAKRAM_ATMOSPHERE: 'readonly',
    browsingModeVR: 'writable',
    vrodosDecodeDisplayText: 'readonly',
    getChatCurrentTimeString: 'readonly',
    publicChatIsActive: 'writable',
    chatLogPublicHistory: 'writable',
    sendPublicMessage: 'readonly'
};

module.exports = [
    {
        ignores: ['**/node_modules/**', 'assets/js/runtime/master/lib/**/*.js', 'assets/js/runtime/**/*.min.js']
    },
    {
        files: ['assets/js/editor/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: {
                ...browserGlobals,
                THREE: 'readonly',
                Stats: 'readonly',
                lucide: 'readonly',
                lil: 'readonly',
                VRODOS: 'readonly',
                VRodosCompileUI: 'readonly',
                VRODOS_TAKRAM_ATMOSPHERE: 'readonly'
            }
        },
        rules: baseRules
    },
    {
        files: [
            'assets/js/runtime/*.js',
            'assets/js/runtime/assessment/**/*.js',
            'assets/js/runtime/components/**/*.js'
        ],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: runtimeGlobals
        },
        rules: runtimeRules
    },
    {
        files: ['assets/js/runtime/spatial-ui/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: runtimeGlobals
        },
        rules: runtimeRules
    },
    {
        files: ['assets/js/runtime/master/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: runtimeGlobals
        },
        rules: baseRules
    }
];
