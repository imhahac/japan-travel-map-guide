import React, { useState } from 'react';
import { X, Database, CheckCircle, ExternalLink, Copy } from 'lucide-react';

export default function SyncModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyGasPath = () => {
    navigator.clipboard?.writeText('gas/Code.gs');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        borderRadius: '16px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        border: '1px solid var(--border)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: '#e0f2fe', color: '#00489d', padding: '0.4rem', borderRadius: '8px' }}>
              <Database size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Google Sheet 資料庫設定說明</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>免申請 Google Cloud，3 分鐘完成自動寫入與同步</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flex_direction: 'column', gap: '1.1rem', fontSize: '0.88rem', lineHeight: 1.6 }}>
          
          <div style={{ background: 'var(--bg-page)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={16} /> 目前狀態：內建 347+ 間東橫 INN 種子資料
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              本網站已內建完整日本東橫 INN 官方經緯度與車站資訊。若您希望自由新增自訂飯店、在地餐廳、便利商店或手動編輯，可隨時綁定您的 Google Sheet。
            </p>
          </div>

          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginTop: '0.5rem' }}>📌 串接三步驟：</h3>

          <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li>
              <strong>建立 Google 試算表</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                在 Google 雲端硬碟建立一份新的空白 Google Sheet。
              </div>
            </li>
            <li>
              <strong>貼上 Apps Script 程式碼</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                點選上方選單「擴充功能」→「Apps Script」，將本專案中的 <code>gas/Code.gs</code> 內容複製貼上。
                <button
                  onClick={handleCopyGasPath}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    marginLeft: '0.5rem',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    border: 'none',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={11} /> {copied ? '已複製檔名' : 'gas/Code.gs'}
                </button>
              </div>
            </li>
            <li>
              <strong>發布為 Web App 並取得網址</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                點擊「部署」→「新部署」→ 選擇「網頁應用程式 (Web app)」，將「誰可以存取」設為<strong>任何人 (Anyone)</strong>。
              </div>
            </li>
            <li>
              <strong>設定至 GitHub Secrets (全雲端自動化)</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                前往您的 GitHub Repo → <strong>Settings</strong> → <strong>Secrets and variables</strong> → <strong>Actions</strong>，新增 Secret <code>GAS_WEBHOOK_URL</code> 填入上述網址。
              </div>
            </li>
          </ol>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.85rem', borderRadius: '8px', fontSize: '0.82rem' }}>
            ☁️ <strong>全雲端自動處理 (無需任何本機指令)</strong>：
            <ul style={{ paddingLeft: '1.1rem', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li><strong>一鍵同步至 Google Sheet</strong>：至 Actions 頁籤執行 <code>Cloud Sync Seed to Google Sheet</code>。</li>
              <li><strong>雲端網址爬蟲</strong>：至 Actions 頁籤執行 <code>Cloud Crawl URL to Google Sheet</code>，直接輸入網址即自動寫入試算表！</li>
              <li><strong>待爬清單排程</strong>：在試算表「待爬清單」貼上網址，GitHub Actions 每 6 小時全自動爬取歸檔。</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            className="btn-action btn-primary"
            style={{ padding: '0.5rem 1.25rem' }}
          >
            了解並關閉
          </button>
        </div>
      </div>
    </div>
  );
}
