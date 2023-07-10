export default (req, res) => {
    const context = {
        thisHostName: `http://${req.headers["x-forwarded-host"]
            ? req.headers["x-forwarded-host"]
            : req.hostname + ":8080"}`,
        status: 200,
        req,
        res
    };
    // Process the request.
    let jsonResult = { "message": "Nothing implemented" };
    console.info(`Request received for ${context.req.originalUrl}`);
    try {
        console.debug("Code goes here");
    } catch (err) {
        jsonResult = { "error": err.message };
    } finally {
        context.res.set("Content-Type", "application/json");
        context.res.status(context.status).send(jsonResult);
    }
};
