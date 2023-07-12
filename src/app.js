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

const insertMappings = (m, data, range) => {
    const findMapping = mapping => {
        for (let j = 0; j < data.length; j += 1) {
            const dest = data[j].tvdb;
            if (dest.season === mapping.tvdb.season &&
                dest.episode === mapping.tvdb.episode &&
                dest.absolute === mapping.tvdb.absolute) {
                return dest;
            }
        }
        return null;
    };
    for (let i = 1; i <= range; i += 1) {
        const increment = i - 1;
        const newMapping = {
            "scene": {
                absolute: lodash.toInteger(m.scene.absolute) + increment,
                season: m.scene.season,
                episode: lodash.toInteger(m.scene.episode) + increment
            },
            "tvdb": {
                absolute: lodash.toInteger(m.tvdb.absolute) + increment,
                season: m.tvdb.season,
                episode: lodash.toInteger(m.tvdb.episode) + increment
            }
        };
        if (!findMapping(newMapping)) {
            data.push(newMapping);
        }
    }
};

const all = (body, yaml, tvdbid) => {
    const excludeEntries = yaml.exclude || [];
    console.log(`Exclude entries: ${excludeEntries.length}`);
    excludeEntries.forEach(key => {
        // eslint-disable-next-line prefer-reflect
        delete body.data[key];
    });
    const includeEntries = Object.values(yaml.include || []);
    console.info(`Include entries: ${includeEntries.length}`);
    includeEntries.forEach(entry => {
        const key = Object.keys(entry)[0];
        console.info(`Processing entry with TVDBID ${key}`);
        if (key === tvdbid) {
            const value = Object.values(entry)[0];
            if (lodash.has(value, "scene") && lodash.has(value, "tvdb")) {
                // Support ranges.
                if (lodash.has(value, "range") && lodash.isInteger(value.range)) {
                    const max = lodash.toInteger(value.range);
                    insertMappings(value, body.data, max);
                } else {
                    insertMappings(value, body.data, 1);
                }
            }
        }
    });
    if (includeEntries.length > 0 &&
        body.result === "failure" &&
        body.message === `no show with the tvdb_id ${tvdbid} found`) {
        body.result = "success";
        body.message = `full mapping for ${tvdbid} on tvdb.`;
    }
    return body;
};

const allNames = (body, yaml, seasonNumbers = false) => {
    const excludeEntries = yaml.exclude || [];
    console.log(`Exclude entries: ${excludeEntries.length}`);
    excludeEntries.forEach(key => {
        // eslint-disable-next-line prefer-reflect
        delete body.data[key];
    });
    const includeEntries = Object.values(yaml.include || []);
    console.log(`Include entries: ${includeEntries.length}`);
    includeEntries.forEach(entry => {
        const key = Object.keys(entry)[0];
        const value = Object.values(entry)[0];
        console.info(`Processing entry with TVDBID ${key}`);
        if (lodash.has(value, "names")) {
            if (seasonNumbers) {
                body.data[key] = value.names;
            } else {
                body.data[key] = value.names.map(el => Object.keys(el)[0]);
            }
        }
    });
    return body;
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
        // TheXem.info seems to care about case of query string parameters.
        const url = req.url.toLowerCase();
        Request.get(req.url).then(response => {
            res.set("Content-Type", "application/json");
            const body = response.body;
            const rawData = fs.readFileSync(path.join(__dirname, "config.yml"), "utf-8");
            const yaml = YAML.parse(rawData, { strict: true });
            if (req.query.origin && response.type === "application/json" && url.startsWith("/map/havemap")) {
                console.log("Getting all mappings thexem has to offer (+ mine)");
                res.send(haveMap(body, yaml));
            } else if (req.query.origin && response.type === "application/json" && url.startsWith("/map/allnames")) {
                console.log("Getting alternate names");
                res.send(allNames(body, yaml, req.query.seasonNumbers));
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
