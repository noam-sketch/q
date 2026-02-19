export const FBC_FILENAME = 'q-fbc.md';
export const FBC_DIR_HANDLE_KEY = 'q-fbc-dir';

export interface FBCService {
  init(): Promise<void>;
  append(message: string): Promise<void>;
  read(startPos: number): Promise<{ content: string; newPos: number }>;
  getSize(): Promise<number>;
}

export class OPFSService implements FBCService {
  private root: FileSystemDirectoryHandle | null = null;
  private fileHandle: FileSystemFileHandle | null = null;

  async init(): Promise<void> {
    this.root = await navigator.storage.getDirectory();
    this.fileHandle = await this.root.getFileHandle(FBC_FILENAME, { create: true });
  }

  async append(message: string): Promise<void> {
    if (!this.fileHandle) await this.init();
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - types for createWritable are still evolving
    const writable = await this.fileHandle!.createWritable({ keepExistingData: true });
    
    // Get current size to append
    const file = await this.fileHandle!.getFile();
    const size = file.size;
    
    await writable.write({ type: 'write', position: size, data: message });
    await writable.close();
  }

  async read(startPos: number): Promise<{ content: string; newPos: number }> {
     if (!this.fileHandle) await this.init();
     
     const file = await this.fileHandle!.getFile();
     const blob = file.slice(startPos);
     const text = await blob.text();
     
     return {
         content: text,
         newPos: startPos + text.length
     };
  }
  
  async getSize(): Promise<number> {
      if (!this.fileHandle) await this.init();
      const file = await this.fileHandle!.getFile();
      return file.size;
  }
}
