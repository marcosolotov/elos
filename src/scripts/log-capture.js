#!/usr/bin/env node
/**
 * Script para capturar logs do TypeScript Compiler e Vite
 * e escrevê-los em um arquivo de log compartilhado.
 * 
 * Uso: algum-comando | node log-capture.js [source]
 */

const fs = require('fs');
const path = require('path');

const source = process.argv[2] || 'typescript';
const homeDir = require('os').homedir();
const logDir = path.join(homeDir, 'Library', 'Application Support', 'elos', 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const today = new Date().toISOString().split('T')[0];
const logFile = path.join(logDir, `logs-${today}.txt`);

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  // Escreve no terminal (stdout original)
  process.stdout.write(line + '\n');

  // Escreve no arquivo de log
  const prefix = new Date().toLocaleString('pt-BR');
  
  // Detecta nível do log
  let level = 'INFO';
  if (line.toLowerCase().includes('error')) level = 'ERROR';
  else if (line.toLowerCase().includes('warn')) level = 'WARN';
  else if (line.toLowerCase().includes('fail')) level = 'ERROR';

  const logLine = `[${prefix}] [${level}] [${source}] ${line}\n`;
  
  try {
    fs.appendFileSync(logFile, logLine, 'utf-8');
  } catch (err) {
    // Silently fail - avoid recursion
  }
});

rl.on('close', () => {
  process.exit(0);
});