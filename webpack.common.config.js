import ESLintPlugin from "eslint-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Exclude node_modules from server-side bundling.
const nodeModules = {};
fs.readdirSync("node_modules").
    filter(x => [".bin"].indexOf(x) === -1).
    forEach(mod => {
        nodeModules[mod] = "module " + mod;
    });

const webpackConfig = {
    // Context is the root of the project
    context: __dirname,
    stats: {
        errorDetails: true,
        children: true
    },
    entry: {
        express: "./src/express.js"
    },
    experiments: {
        outputModule: true
    },
    output: {
        // Output is the dist folder.
        path: path.resolve(__dirname, "dist"),
        filename: "[name].bundle.js",
        chunkFilename: "[name].bundle.js",
        publicPath: "/dist",
        library: {
            type: "module"
        }
    },
    target: "node12.2",
    externals: nodeModules,
    module: {
        parser: {
            javascript: { importMeta: false }
        }
    },
    plugins: [
        new ESLintPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "./config.yml",
                    to: path.join(__dirname, "dist")
                }
            ]
        })
    ]
};

export default webpackConfig;
