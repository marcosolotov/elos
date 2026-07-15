import * as fs from 'fs';
import * as path from 'path';
import { app, BrowserWindow } from 'electron';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const CREDENTIALS = {
  installed: {
    client_id: '974723254338-34m08pq248a39piv1nnluhbreak1ovr6.apps.googleusercontent.com',
    project_id: 'concise-honor-273314',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_secret: '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',
    redirect_uris: ['http://localhost'],
  },
};

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(app.getPath('userData'), 'drive-token.json');
const BACKUP_FOLDER_NAME = 'Elos Backups';

export class GoogleDriveService {
  // @ts-ignore - version conflicts between googleapis dependencies
  private oAuth2Client: any;
  private drive: any = null;
  private backupFolderId: string | null = null;
  private authenticated = false;

  constructor() {
    const { client_id, client_secret, redirect_uris } = CREDENTIALS.installed;
    // @ts-ignore
    this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  }

  async initialize(): Promise<boolean> {
    try {
      // Tentar carregar token salvo
      if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
        this.oAuth2Client.setCredentials(token);
        this.drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
        this.authenticated = true;

        // Verificar se o token ainda é válido
        try {
          await this.drive.files.list({ pageSize: 1 });
        } catch {
          // Token expirado, tentar refresh
          try {
            const { credentials } = await this.oAuth2Client.refreshAccessToken();
            this.oAuth2Client.setCredentials(credentials);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials));
            this.drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
          } catch {
            this.authenticated = false;
          }
        }

        if (this.authenticated) {
          await this.ensureBackupFolder();
        }
      }
    } catch (err) {
      console.error('Erro ao inicializar Google Drive:', err);
      this.authenticated = false;
    }

    return this.authenticated;
  }

  async authenticate(mainWindow: BrowserWindow): Promise<boolean> {
    try {
      // Gerar URL de autenticação
      const authUrl = this.oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
      });

      // Abrir janela para o usuário autorizar
      const authCode = await this.getAuthCodeFromUser(mainWindow, authUrl);

      // Trocar código por token
      const { tokens } = await this.oAuth2Client.getToken(authCode);
      this.oAuth2Client.setCredentials(tokens);

      // Salvar token
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

      this.drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
      this.authenticated = true;

      await this.ensureBackupFolder();

      return true;
    } catch (err) {
      console.error('Erro na autenticação Google Drive:', err);
      this.authenticated = false;
      return false;
    }
  }

  private getAuthCodeFromUser(mainWindow: BrowserWindow, authUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Criar janela de autenticação
      const authWindow = new BrowserWindow({
        width: 800,
        height: 700,
        title: 'Conectar ao Google Drive',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      authWindow.loadURL(authUrl);

      authWindow.webContents.on('will-redirect', (_event: any, url: string) => {
        this.handleAuthRedirect(url, authWindow, resolve, reject);
      });

      authWindow.webContents.on('will-navigate', (_event: any, url: string) => {
        this.handleAuthRedirect(url, authWindow, resolve, reject);
      });

      authWindow.on('closed', () => {
        reject(new Error('Janela de autenticação fechada pelo usuário'));
      });
    });
  }

  private handleAuthRedirect(url: string, authWindow: BrowserWindow, resolve: Function, reject: Function): void {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const error = urlObj.searchParams.get('error');

    if (error) {
      authWindow.close();
      reject(new Error(`Erro na autenticação: ${error}`));
      return;
    }

    if (code) {
      authWindow.close();
      resolve(code);
    }
  }

  private async ensureBackupFolder(): Promise<void> {
    if (!this.drive) throw new Error('Drive não inicializado');

    try {
      // Procurar pasta existente
      const response = await this.drive.files.list({
        q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (response.data.files && response.data.files.length > 0) {
        this.backupFolderId = response.data.files[0].id!;
      } else {
        // Criar pasta
        const folder = await this.drive.files.create({
          requestBody: {
            name: BACKUP_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
          },
          fields: 'id',
        });
        this.backupFolderId = folder.data.id!;
      }
    } catch (err) {
      console.error('Erro ao criar/verificar pasta de backup:', err);
      throw err;
    }
  }

  async uploadBackup(dbPath: string, description?: string): Promise<{ id: string; name: string }> {
    if (!this.drive || !this.backupFolderId) throw new Error('Google Drive não conectado');
    if (!fs.existsSync(dbPath)) throw new Error('Arquivo de banco de dados não encontrado');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `elos-backup-${timestamp}.db`;

    try {
      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [this.backupFolderId],
          description: description || `Backup automático - ${new Date().toLocaleString('pt-BR')}`,
        },
        media: {
          mimeType: 'application/octet-stream',
          body: fs.createReadStream(dbPath),
        },
        fields: 'id, name',
      });

      console.log(`Backup enviado para o Google Drive: ${fileName}`);
      return { id: response.data.id!, name: response.data.name! };
    } catch (err) {
      console.error('Erro ao fazer upload do backup:', err);
      throw err;
    }
  }

  async listBackups(): Promise<Array<{ id: string; name: string; createdTime: string; size: string }>> {
    if (!this.drive || !this.backupFolderId) throw new Error('Google Drive não conectado');

    try {
      const response = await this.drive.files.list({
        q: `'${this.backupFolderId}' in parents and trashed=false`,
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc',
        pageSize: 50,
      });

      return (response.data.files || []).map((f: any) => ({
        id: f.id!,
        name: f.name!,
        createdTime: f.createdTime || new Date().toISOString(),
        size: f.size || '0',
      }));
    } catch (err) {
      console.error('Erro ao listar backups:', err);
      throw err;
    }
  }

  async downloadBackup(fileId: string, destinationPath: string): Promise<void> {
    if (!this.drive) throw new Error('Google Drive não conectado');

    try {
      const dest = fs.createWriteStream(destinationPath);
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      return new Promise((resolve, reject) => {
        response.data
          .on('end', () => {
            dest.end();
            resolve();
          })
          .on('error', (err: Error) => {
            reject(err);
          })
          .pipe(dest);
      });
    } catch (err) {
      console.error('Erro ao baixar backup:', err);
      throw err;
    }
  }

  async deleteBackup(fileId: string): Promise<void> {
    if (!this.drive) throw new Error('Google Drive não conectado');

    try {
      await this.drive.files.delete({ fileId });
      console.log(`Backup removido do Google Drive: ${fileId}`);
    } catch (err) {
      console.error('Erro ao remover backup:', err);
      throw err;
    }
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  async disconnect(): Promise<void> {
    try {
      if (fs.existsSync(TOKEN_PATH)) {
        fs.unlinkSync(TOKEN_PATH);
      }
      this.authenticated = false;
      this.drive = null;
      this.backupFolderId = null;
    } catch (err) {
      console.error('Erro ao desconectar:', err);
    }
  }
}