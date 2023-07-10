/* eslint-disable no-process-env */
import axios from "axios";

export default class Request {
    static headerHost = process.env.HEADER_HOST || "thexem.info";

    static userAgent = process.env.USER_AGENT || "okhttp/3.12.1";

    static get = url => {
        console.log(`AXIOS GET request for ${url}`);
        const options = {
            Host: this.headerHost,
            "user-agent": this.userAgent
        };
        return new Promise((resolve, reject) => {
            const fwdUrl = `https://${this.headerHost}${url}`;
            axios.get(fwdUrl, options).then(response => {
                if (response.data) {
                    console.log(`AXIOS response: ${JSON.stringify(response.data)}`);
                    resolve({
                        type: response.headers["content-type"],
                        body: response.data
                    });
                } else {
                    reject(new Error("No data body in response"));
                }
            }).
                catch(err => {
                    if (err.response) {
                        console.log(err.response.status);
                        console.log(err.message);
                    }
                    reject(err);
                });
        });
    };
}
