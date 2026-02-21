import { qLocal } from './q_local_client';

export const FBC_DIR_HANDLE_KEY = 'q-fbc-dir';

export interface FBCService {
  init(): Promise<void>;
  append(message: string): Promise<void>;
  read(startPos: number): Promise<{ content: string; newPos: number }>;
  getSize(): Promise<number>;
  clear(): Promise<void>;
  setFilename(name: string): Promise<void>;
  getFilename(): string;
  listChannels(): Promise<string[]>;
}

export class QLocalFBCService implements FBCService {
  private currentFilename: string = '-q(0001@SphereQID)-.fbc.md'; // Default channel
  private basePath: string = './fbc';

  private getFullPath(): string {
      // Handle case where filename is already an absolute path or relative path from fractal tree root
      if (this.currentFilename.startsWith('/')) return this.currentFilename;
      if (this.currentFilename.startsWith('./fbc')) return this.currentFilename;
      return `${this.basePath}/${this.currentFilename}`;
  }

  async init(): Promise<void> {
    if (!qLocal.isConnected()) throw new Error('QLocal is not connected');
    await qLocal.executeCommand(`mkdir -p "${this.basePath}"`);
    await qLocal.executeCommand(`touch "${this.getFullPath()}"`);
  }

  async setFilename(name: string): Promise<void> {
    this.currentFilename = name;
    await this.init();
  }

  getFilename(): string {
    return this.currentFilename;
  }

  async listChannels(): Promise<string[]> {
    // Relying on the ChannelModal Fractal Tree for navigation instead of this flat list
    return [];
  }

  async clear(): Promise<void> {
    await qLocal.executeCommand(`> "${this.getFullPath()}"`);
  }

  async append(message: string): Promise<void> {
    // Use base64 encoding to safely append multiline/special character messages via shell
    const base64Message = btoa(unescape(encodeURIComponent(message)));
    await qLocal.executeCommand(`echo "${base64Message}" | base64 --decode >> "${this.getFullPath()}"`);
  }

  async read(startPos: number): Promise<{ content: string; newPos: number }> {
    try {
        // Read file size first
        const sizeStr = await qLocal.executeCommand(`wc -c < "${this.getFullPath()}"`);
        const size = parseInt(sizeStr.trim(), 10) || 0;
        
        if (startPos >= size) return { content: '', newPos: startPos };
        
        // Use tail to read from byte position (tail -c +startPos reads from byte N, 1-indexed)
        const bytesToRead = size - startPos;
        if (bytesToRead <= 0) return { content: '', newPos: startPos };
        
        const content = await qLocal.executeCommand(`tail -c +${startPos + 1} "${this.getFullPath()}"`);
        return { content, newPos: size };
    } catch {
        return { content: '', newPos: startPos };
    }
  }

  async getSize(): Promise<number> {
    try {
        const sizeStr = await qLocal.executeCommand(`wc -c < "${this.getFullPath()}"`);
        return parseInt(sizeStr.trim(), 10) || 0;
    } catch {
        return 0;
    }
  }
}

export class OPFSService implements FBCService {
  private root: FileSystemDirectoryHandle | null = null;
  private fileHandle: FileSystemFileHandle | null = null;
  private currentFilename: string = 'q-fbc.md';

  async init(): Promise<void> {
    this.root = await navigator.storage.getDirectory();
    this.fileHandle = await this.root.getFileHandle(this.currentFilename, { create: true });
  }

  async setFilename(name: string): Promise<void> {
    this.currentFilename = name;
    if (this.root) {
      this.fileHandle = await this.root.getFileHandle(this.currentFilename, { create: true });
    } else {
      await this.init();
    }
  }

  getFilename(): string {
    return this.currentFilename;
  }

  async listChannels(): Promise<string[]> {
    if (!this.root) {
      this.root = await navigator.storage.getDirectory();
    }
    const channels: string[] = [];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    for await (const [name, handle] of this.root.entries()) {
      if (handle.kind === 'file' && name.endsWith('.md')) {
        channels.push(name);
      }
    }
    return channels;
  }

  async clear(): Promise<void> {
    if (!this.fileHandle) await this.init();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const writable = await this.fileHandle!.createWritable({ keepExistingData: false });
    await writable.truncate(0);
    await writable.close();
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

export class UnifiedFBCService implements FBCService {
    private qLocalFbc = new QLocalFBCService();
    private opfsFbc = new OPFSService();

    private get activeService(): FBCService {
        return qLocal.isConnected() ? this.qLocalFbc : this.opfsFbc;
    }

    async init(): Promise<void> {
        await this.qLocalFbc.init().catch(() => {});
        await this.opfsFbc.init();
    }

    async append(message: string): Promise<void> {
        await this.activeService.append(message);
    }

    async read(startPos: number): Promise<{ content: string; newPos: number }> {
        return await this.activeService.read(startPos);
    }

    async getSize(): Promise<number> {
        return await this.activeService.getSize();
    }

    async clear(): Promise<void> {
        await this.activeService.clear();
    }

    async setFilename(name: string): Promise<void> {
        await this.qLocalFbc.setFilename(name);
        await this.opfsFbc.setFilename(name);
    }

    getFilename(): string {
        return this.activeService.getFilename();
    }

    async listChannels(): Promise<string[]> {
        return await this.activeService.listChannels();
    }
}
