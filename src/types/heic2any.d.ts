declare module 'heic2any' {
  interface Heic2AnyOptions {
    blob: Blob | File;
    toType?: 'image/jpeg' | 'image/png';
    quality?: number;
  }

  function heic2any(options: Heic2AnyOptions): Promise<Blob | Blob[]>;

  export default heic2any;
}
