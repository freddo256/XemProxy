import axios from "axios";

export class TorznabRegexError extends Error {
    constructor(code, desc) {
        super(desc);
        this.code = code;
    }
}

export const apiRequestAsync = (url, apiKey) => {
    console.log(`AXIOS GET request for ${url}`);
    const options = apiKey ? { apiKey } : {};
    return new Promise((resolve, reject) => {
        axios.get(url, options).then(response => {
            if (response.data) {
                // Axios converts to a JSON object.
                // eslint-disable-next-line capitalized-comments
                // console.log(`AXIOS response: ${JSON.stringify(response.data)}`);
                resolve(response.data);
            } else {
                reject(new Error("No data body in response"));
            }
        }).
            catch(err => {
                if (err.response) {
                    if (404 === err.response.status) {
                        // 404 doesn't necessarily mean an error, just that a search failed.
                        reject(new TorznabRegexError(300, `Cannot find match for ${url}`));
                    } else {
                        console.log(err.response.status);
                        console.log(err.message);
                        reject(err);
                    }
                }
            });
    });
};
