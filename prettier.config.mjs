/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
    printWidth: 100,
    proseWrap: 'always',
    endOfLine: 'lf',
    tabWidth: 4,
    semi: true,
    singleQuote: false,
    trailingComma: 'all',
    plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
