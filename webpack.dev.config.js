import { merge } from "webpack-merge";
import Dotenv from "dotenv-webpack";
import common from "./webpack.common.config.js";
import dotenv from "dotenv";
import webpack from "webpack";

// Load the environment from our .env file.
dotenv.config();

const webpackConfig = {
    mode: "development",
    devtool: "source-map",
    plugins: [
        new Dotenv(),
        new webpack.BannerPlugin(
            "require('source-map-support').install();",
            {
                raw: true,
                entryOnly: false
            }
        )
    ]
};

export default merge(common, webpackConfig);
