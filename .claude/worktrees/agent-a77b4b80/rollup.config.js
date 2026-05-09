import svelte from "rollup-plugin-svelte"
import resolve from "rollup-plugin-node-resolve"
import css from "rollup-plugin-css-only"

const pkg = require("./package.json");

export default {
    input: "src/Tables.svelte",
    output: [
        { file: pkg.module, format: "es" },
        { file: pkg.main, format: "umd", name: "Tables" },
    ],
    plugins: [svelte(), css({ output: 'tags.css' }), resolve()],
};
