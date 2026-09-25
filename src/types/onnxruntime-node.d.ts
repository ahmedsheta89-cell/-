declare module 'onnxruntime-node' {
  export interface SessionOptions {
    [key: string]: unknown;
  }
  export class Tensor {
    constructor(type: string, data: ArrayBufferView | ArrayLike<number> | ArrayLike<bigint>, dims?: readonly number[]);
    dims: readonly number[];
    type: string;
    data: ArrayBufferView | ArrayLike<number> | ArrayLike<bigint>;
  }
  export class InferenceSession {
    static create(path: string, options?: SessionOptions): Promise<InferenceSession>;
    inputNames: readonly string[];
    outputNames: readonly string[];
    run(feeds: Record<string, Tensor>): Promise<Record<string, Tensor>>;
  }
}
