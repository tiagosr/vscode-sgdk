module.exports = {
    "env": {
        "node": true
    },
    "extends": ["eslint:recommended"],
    "parserOptions": {
        "ecmaVersion": 2016,
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": 0,
        "quotes": [
            "warn",
            "double"
        ],
        "semi": 0,
        "no-unused-vars": 0
    },
    "globals": {
        "ArrayBuffer": false,
        "Uint8ClampedArray": false,
        "Uint8Array": false,
        "Uint16Array": false,
        "Float32Array": false,
        "Int16Array": false,
    }
};