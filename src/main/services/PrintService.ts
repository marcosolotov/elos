import { BrowserWindow } from 'electron';

export class PrintService {
  /**
   * Abre o diálogo de impressão nativo do sistema operacional
   * com a etiqueta renderizada, permitindo selecionar a impressora
   * Elgin L42 PRO nos 3 sistemas operacionais (Windows, macOS, Linux)
   */
  async imprimirEtiqueta(dados: {
    codigoLote: string;
    itemNome: string;
    dataValidade: string;
    dataFabricacao?: string;
    saldoAtual: number;
    qrCodeDataUrl: string;
  }): Promise<void> {
    const htmlContent = this.gerarEtiquetaHTML(dados);
    
    // Criar uma janela VISÍVEL com a etiqueta para teste no navegador
    const printWindow = new BrowserWindow({
      width: 400,
      height: 600,
      show: true, // Mostra a janela para visualização
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    return new Promise((resolve, reject) => {
      printWindow.webContents.on('did-finish-load', () => {
        try {
          // Abre o diálogo de impressão NATIVO do sistema operacional
          // O usuário pode selecionar a Elgin L42 PRO e configurar o papel
          printWindow.webContents.print(
            {
              printBackground: true,
              margins: { marginType: 'none' },
              pageSize: 'A4', // Usa A4 por ser compatível universalmente
              copies: 1,
            },
            (success: boolean, failureReason?: string) => {
              if (success) {
                console.log('[PrintService] Impressão concluída com sucesso');
                resolve();
              } else {
                console.error('[PrintService] Impressão cancelada ou falhou:', failureReason);
                resolve(); // Não rejeita - usuário pode ter cancelado
              }
              
              setTimeout(() => {
                if (!printWindow.isDestroyed()) {
                  printWindow.close();
                }
              }, 1000);
            }
          );
        } catch (error) {
          console.error('[PrintService] Erro ao abrir impressão:', error);
          reject(error);
          if (!printWindow.isDestroyed()) {
            printWindow.close();
          }
        }
      });

      printWindow.webContents.on('did-fail-load', (_: any, errorCode: number, errorDescription: string) => {
        console.error('[PrintService] Falha ao carregar HTML:', errorCode, errorDescription);
        reject(new Error(`Falha ao carregar etiqueta: ${errorDescription}`));
        if (!printWindow.isDestroyed()) {
          printWindow.close();
        }
      });

      // Carregar o HTML
      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    });
  }

  private gerarEtiquetaHTML(dados: {
    codigoLote: string;
    itemNome: string;
    dataValidade: string;
    dataFabricacao?: string;
    saldoAtual: number;
    qrCodeDataUrl: string;
  }): string {
    const dataValidadeFormatada = new Date(dados.dataValidade).toLocaleDateString('pt-BR');
    const dataFabricacaoFormatada = dados.dataFabricacao 
      ? new Date(dados.dataFabricacao).toLocaleDateString('pt-BR') 
      : 'N/A';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Courier New', monospace;
    width: 100mm;
    height: 150mm;
    padding: 5mm;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .header {
    text-align: center;
    width: 100%;
    border-bottom: 2px solid #000;
    padding-bottom: 2mm;
    margin-bottom: 2mm;
  }
  
  .header h1 {
    font-size: 16px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  
  .qr-section {
    text-align: center;
    margin: 2mm 0;
  }
  
  .qr-section img {
    width: 75mm;
    height: 75mm;
    image-rendering: pixelated;
  }
  
  .info-section {
    width: 100%;
    border-top: 2px solid #000;
    padding-top: 2mm;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    padding: 0.5mm 0;
  }
  
  .info-row .label {
    font-weight: bold;
  }
  
  .info-row .value {
    text-align: right;
    max-width: 60%;
    word-break: break-all;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>ELOS</h1>
  </div>
  
  <div class="qr-section">
    <img src="${dados.qrCodeDataUrl}" alt="QR Code" />
  </div>
  
  <div class="info-section">
    <div class="info-row">
      <span class="label">Lote:</span>
      <span class="value">${dados.codigoLote}</span>
    </div>
    <div class="info-row">
      <span class="label">Item:</span>
      <span class="value">${dados.itemNome}</span>
    </div>
    <div class="info-row">
      <span class="label">Fabrica\u00e7\u00e3o:</span>
      <span class="value">${dataFabricacaoFormatada}</span>
    </div>
    <div class="info-row">
      <span class="label">Validade:</span>
      <span class="value">${dataValidadeFormatada}</span>
    </div>
    <div class="info-row">
      <span class="label">Saldo:</span>
      <span class="value">${dados.saldoAtual.toFixed(2)}</span>
    </div>
  </div>
</body>
</html>`;
  }
}
