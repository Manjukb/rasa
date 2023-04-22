A basic TypeScript starter template on using restify, inversify, inversify-restify-utils, and Joi for building RESTful APIs in node.

**Overview

* IoC Container using inversify
* JOI Middleware and explicit validation
* Annotated (aka decorators) routes in restify

**Steps:

* npm install
* npm run build
* npm start

**TODO: 
* Unit tests
* Introduce cache managers
* Exception handling using bunyan or winston
* The npm scripts are placeholders and haven't been tested (apart from the ones listed above)

This is more like a "hello world" starter and doesn't include any data persistence. Depending on the backend being used, mongoose or typeORM should be used in either service class or (if you like repository pattern), in a repository.
