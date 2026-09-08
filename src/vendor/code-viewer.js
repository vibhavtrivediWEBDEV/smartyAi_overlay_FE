/**
 * Code Viewer Component
 * Rendered code blocks with syntax highlighting and copy functionality
 * Uses highlight.js for syntax highlighting
 */

class CodeViewer {
  /**
   * Create a code viewer instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.theme = options.theme || 'monokai-sublime';
    this.showLineNumbers = options.showLineNumbers !== false;
    this.highlightJsLoaded = false;
    
    // Inject highlight.js if not already present
    this.injectHighlightJs();
  }
  
  /**
   * Inject highlight.js library and theme
   */
  injectHighlightJs() {
    // Check if already loaded
    if (document.querySelector('script[src*="highlight.js"]')) {
      this.highlightJsLoaded = true;
      return;
    }
    
    // Inject highlight.js CSS theme
    const cssLinkId = 'highlight-js-css';
    if (!document.getElementById(cssLinkId)) {
      const cssLink = document.createElement('link');
      cssLink.id = cssLinkId;
      cssLink.rel = 'stylesheet';
      cssLink.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${this.theme}.min.css`;
      document.head.appendChild(cssLink);
    }
    
    // Inject highlight.js script
    const scriptId = 'highlight-js-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
      script.onload = () => {
        this.highlightJsLoaded = true;
        console.log('✅ highlight.js loaded');
      };
      script.onerror = () => {
        console.error('❌ Failed to load highlight.js');
      };
      document.head.appendChild(script);
    }
  }
  
  /**
   * Render a code block
   * @param {string} code - Code content
   * @param {string} language - Programming language
   * @param {boolean} incomplete - Whether the block is incomplete (streaming)
   * @returns {HTMLElement} - Code viewer element
   */
  render(code, language = '', incomplete = false) {
    const container = document.createElement('div');
    container.className = 'code-viewer';
    if (incomplete) {
      container.classList.add('incomplete');
    }
    
    // Header (language label + copy button)
    const header = document.createElement('div');
    header.className = 'code-viewer-header';
    
    const langLabel = document.createElement('div');
    langLabel.className = 'code-language-label';
    langLabel.textContent = language.toUpperCase() || 'CODE';
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      this.copyToClipboard(code, copyBtn);
    };
    
    header.appendChild(langLabel);
    header.appendChild(copyBtn);
    
    // Code container
    const codeContainer = document.createElement('div');
    codeContainer.className = 'code-container';
    
    // Code element
    const pre = document.createElement('pre');
    const codeEl = document.createElement('code');
    codeEl.className = language ? `language-${language}` : '';
    
    // Set code content (use textContent to preserve exact formatting)
    // This prevents double-escaping of HTML entities
    codeEl.textContent = code;
    
    // Apply syntax highlighting if highlight.js is loaded
    if (this.highlightJsLoaded && window.hljs) {
      try {
        if (language) {
          // Use specified language
          window.hljs.highlightElement(codeEl);
        } else {
          // Auto-detect language
          window.hljs.highlightElement(codeEl);
        }
      } catch (e) {
        console.warn('Syntax highlighting failed:', e);
      }
    } else {
      // Wait for highlight.js to load, then highlight
      const checkInterval = setInterval(() => {
        if (this.highlightJsLoaded && window.hljs) {
          clearInterval(checkInterval);
          try {
            window.hljs.highlightElement(codeEl);
          } catch (e) {
            console.warn('Delayed syntax highlighting failed:', e);
          }
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => clearInterval(checkInterval), 5000);
    }
    
    pre.appendChild(codeEl);
    codeContainer.appendChild(pre);
    
    container.appendChild(header);
    container.appendChild(codeContainer);
    
    return container;
  }
  
  /**
   * Copy code to clipboard
   * @param {string} code - Code to copy
   * @param {HTMLElement} button - Copy button element
   */
  async copyToClipboard(code, button) {
    try {
      await navigator.clipboard.writeText(code);
      
      // Visual feedback
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('copied');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
      
    } catch (err) {
      console.error('Failed to copy:', err);
      button.textContent = 'Failed';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    }
  }
  
  /**
   * Update existing code viewer (for streaming)
   * @param {HTMLElement} container - Code viewer container
   * @param {string} code - New code content
   */
  update(container, code) {
    if (!container) return;
    
    const codeEl = container.querySelector('code');
    if (codeEl) {
      // Use textContent to preserve exact formatting
      codeEl.textContent = code;
      
      // Re-highlight if highlight.js is loaded
      if (this.highlightJsLoaded && window.hljs) {
        try {
          window.hljs.highlightElement(codeEl);
        } catch (e) {
          console.warn('Re-highlighting failed:', e);
        }
      }
    }
  }
  
  /**
   * Inject Code Viewer CSS styles
   */
  static injectStyles() {
    const styleId = 'code-viewer-styles';
    if (document.getElementById(styleId)) return;
    
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .code-viewer {
        background: rgba(28, 28, 30, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        margin: 12px 0;
        overflow: hidden;
      }
      
      .code-viewer.incomplete {
        border-color: rgba(255, 193, 7, 0.3);
      }
      
      .code-viewer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .code-language-label {
        color: rgba(255, 255, 255, 0.6);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .code-copy-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.8);
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .code-copy-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .code-copy-btn.copied {
        background: rgba(76, 175, 80, 0.9);
        color: white;
      }
      
      .code-container {
        padding: 16px;
        overflow-x: auto;
        max-height: 500px;
        overflow-y: auto;
      }
      
      .code-container pre {
        margin: 0;
        padding: 0;
        background: transparent;
      }
      
      .code-container code {
        font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
        font-size: 13px;
        line-height: 1.6;
        color: #e5e5e5;
      }
      
      /* Custom scrollbar for code */
      .code-container::-webkit-scrollbar {
        height: 8px;
        width: 8px;
      }
      
      .code-container::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.02);
      }
      
      .code-container::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }
      
      .code-container::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      /* Inline code styling */
      .inline-code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
        font-size: 0.9em;
        color: #ff9800;
      }
      
      /* Paragraph and list styling */
      .message-text p {
        margin: 12px 0;
        line-height: 1.6;
      }
      
      .message-text p:first-child {
        margin-top: 0;
      }
      
      .message-text p:last-child {
        margin-bottom: 0;
      }
      
      .message-text ul, .message-text ol {
        margin: 12px 0;
        padding-left: 24px;
      }
      
      .message-text ul:first-child, .message-text ol:first-child {
        margin-top: 0;
      }
      
      .message-text li {
        margin: 6px 0;
        line-height: 1.5;
      }
      
      .message-text h1, .message-text h2, .message-text h3 {
        margin: 16px 0 8px 0;
        color: #fff;
        font-weight: 600;
      }
      
      .message-text h1:first-child, .message-text h2:first-child, .message-text h3:first-child {
        margin-top: 0;
      }
      
      .message-text h1 { 
        font-size: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 6px;
      }
      
      .message-text h2 { 
        font-size: 14px;
        font-weight: 700;
        margin-top: 16px;
        margin-bottom: 6px;
      }
      
      .message-text h3 { 
        font-size: 13px;
        font-weight: 600;
      }
      
      .message-text strong {
        font-weight: 600;
        color: #fff;
      }
      
      /* Section emphasis - stronger headings */
      .message-text h2:only-child,
      .message-text h2:first-child {
        font-size: 13px;
        letter-spacing: 0.3px;
        text-transform: uppercase;
        opacity: 0.9;
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Auto-inject styles on load
if (typeof window !== 'undefined') {
  CodeViewer.injectStyles();
  window.CodeViewer = CodeViewer;
}

// Export for module consumers such as the website demo.
if (typeof module !== 'undefined') module.exports = CodeViewer;
