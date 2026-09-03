declare module '@playwright/test' {
  export interface APIRequestContext {
    get(url: string, options?: any): Promise<any>;
    post(url: string, options?: any): Promise<any>;
    put(url: string, options?: any): Promise<any>;
    patch(url: string, options?: any): Promise<any>;
    delete(url: string, options?: any): Promise<any>;
    dispose(): Promise<void>;
  }

  export interface PlaywrightTestArgs {
    request: APIRequestContext;
  }

  export interface TestType<T = any, W = any> {
    (name: string, testFunction: (args: T & PlaywrightTestArgs) => Promise<void>): void;
    describe(name: string, fn: () => void): void;
    extend<U>(fixtures: any): TestType<T & U, W>;
  }

  export const test: TestType;
  export const expect: any;
  export function defineConfig(config: any): any;
  export const devices: Record<string, any>;

  export const request: {
    newContext(options?: any): Promise<APIRequestContext>;
  };
}
