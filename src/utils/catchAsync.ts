import { Response, Request, RequestHandler, NextFunction } from "express";

export function catchAsync(fn: any) {
  const wrapped: any = (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  wrapped.__originalFn = fn;
  if (fn?.__zodSchema) {
    wrapped.__zodSchema = fn.__zodSchema;
  }
  return wrapped;
}
