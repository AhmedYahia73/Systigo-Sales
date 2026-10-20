"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = catchAsync;
function catchAsync(fn) {
    const wrapped = (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
    wrapped.__originalFn = fn;
    if (fn?.__zodSchema) {
        wrapped.__zodSchema = fn.__zodSchema;
    }
    return wrapped;
}
