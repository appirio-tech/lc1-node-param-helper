serenity param helper
---

Common module for serenity applications.

This module abstracts the url filtering methods.

List of methods

- parseLimitOffset
- parseOrderBy
- parseFilter

Each of the method takes last argument as next function. This function is passed an error object in case error occured. Applicaiton should handle this error condition.
Applications can add an global error handler middleware to process this error and return to client.

### How to install?

Install via npm and git

```
npm install git+https://github.com/riteshsangwan/serenity-param-helper.git
```

### How to use?

Add the module to your file via ```require```

```
var paramHelper = require('serenity-param-helper');
```

### Examples

In any controller file

```
var paramHelper = require('serenity-param-helper');
// some controller logic

// Some route handler funtion
function handleGet(req, res, next) {
  // To know about each method parameters see implementation docs
  paramHelper.parseLimitOffset(req, filters, key, req.query[key], next);  
}
```

NOTICE above next function is passed as the last argument. In this case application should define an error handler middleware.

To know more about error handling visit [express error handling](http://expressjs.com/guide/error-handling.html)