import { IpcRenderer } from 'electron';

declare module 'electron' {
  interface IpcRenderer {
    invoke(channel: string, ...args: any[]): Promise<any>;
  }
}