export function createLazy<T>(factory: () => T): () => T {
  let instance: T | undefined;
  return () => {
    if (instance === undefined) {
      instance = factory();
    }
    return instance;
  };
}

export function createAsyncLazy<T>(factory: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | undefined;
  return () => {
    if (!promise) {
      promise = factory();
    }
    return promise;
  };
}


