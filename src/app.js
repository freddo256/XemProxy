/* eslint-disable array-element-newline */
import YAML from "yaml";
import fs from "fs";
import path from "path";
import lodash from "lodash";
import { fileURLToPath } from "url";
import Request from "./request.js";

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const haveMap = (body, yaml) => {
    const excludeEntries = yaml.exclude || [];
    console.log(`Exclude entries: ${excludeEntries.length}`);
    excludeEntries.forEach(key => {
        // eslint-disable-next-line prefer-reflect
        delete body.data[key];
    });
    const includeEntries = Object.entries(yaml.include || []);
    console.log(`Include entries: ${includeEntries.length}`);
    // eslint-disable-next-line array-element-newline
    includeEntries.forEach(([key, value]) => {
        console.debug(JSON.stringify(value));
        if (!(key in body.data)) {
            body.data.push(key);
        }
    });
    return body;
};

const all = (body, yaml, tvdbid) => {
    const includeEntries = Object.values(yaml.include || []);
    console.info(`Include entries: ${includeEntries.length}`);
    includeEntries.forEach(entry => {
        const key = Object.keys(entry)[0];
        if (key === tvdbid) {
            const value = Object.values(entry)[0];
            if (lodash.hasIn(value, ["scene", "tvdb"])) {
                console.debug(entry);
            }
        }
    });
    return body;
};

const allNames = (body, yaml) => {
    throw new Error("Not implemented");
};

const processError = (err, res) => {
    if (err.response && err.response.status) {
        res.set("Content-Type", err.response.headers["content-type"]);
        res.status(err.response.status).send(err.response.data);
    } else {
        res.status(500).end();
    }
};

export default (req, res) => {
    // Process the request.
    console.info(`Request received for ${req.originalUrl}`);
    try {
        const url = req.url.toLowerCase();
        Request.get(url).then(response => {
            res.set("Content-Type", "application/json");
            const body = response.body;
            const rawData = fs.readFileSync(path.join(__dirname, "config.yml"), "utf-8");
            const yaml = YAML.parse(rawData, { strict: true });
            if (req.query.origin && response.type === "application/json" && url.startsWith("/map/havemap")) {
                console.log("Getting all mappings thexem has to offer (+ mine)");
                res.send(haveMap(body, yaml));
            } else if (req.query.origin && response.type === "application/json" && url.startsWith("/map/allnames")) {
                console.log("Getting alternate names");
                res.send(allNames(body, yaml));
            } else if (req.query.origin && response.type === "application/json" && url.startsWith("/map/all") && req.query.id) {
                console.log(`Getting TVDB mappings for TVDBID ${req.query.id}`);
                res.send(all(body, yaml, req.query.id));
            } else {
                res.set("Content-Type", response.type);
                res.send(body);
            }
        }).
            catch(err => processError(err, res));
    } catch (err) {
        processError(err, res);
    }
};
