/**
 * Diagram Viewer Component
 * Renders Mermaid diagrams for SmartyAI chat responses.
 * Mirrors the Code Viewer API so renderParsedResponse can call it conditionally.
 * Safe: renders Mermaid-generated SVG but does not execute any inline script.
 */

class DiagramViewer {
  /**
   * Create a diagram viewer instance.
   * @param {Object} options - Configuration options.
   */
  constructor(options = {}) {
    this.theme = options.theme || 'dark';
    this.mermaidLoaded = false;
    this.mermaidLoadingPromise = null;
    this.currentZoom = 1;
    this.minZoom = 0.4;
    this.maxZoom = 3;
    this.injectMermaid();
  }

  /**
   * Inject Mermaid.js library if not already present.
   * Uses the CDN build for simplicity; Mermaid is renderer-only.
   */
  async injectMermaid() {
    if (window.mermaid) {
      this.mermaidLoaded = true;
      this.initializeMermaid();
      return;
    }

    // Avoid double-injection
    if (document.querySelector('script[src*="mermaid"]')) {
      this.mermaidLoaded = !!(window.mermaid);
      if (this.mermaidLoaded) {
        this.initializeMermaid();
      }
      return;
    }

    const scriptId = 'mermaid-js-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.async = true;
      this.mermaidLoadingPromise = new Promise((resolve, reject) => {
        script.onload = () => {
          this.mermaidLoaded = true;
          this.initializeMermaid();
          console.log('✅ Mermaid loaded');
          resolve();
        };
        script.onerror = () => {
          console.error('❌ Failed to load Mermaid');
          resolve(); // Resolve anyway; render() will show graceful error.
        };
      });
      document.head.appendChild(script);
    }
  }

  /**
   * Initialize Mermaid configuration for the dark glassmorphism theme.
   */
  initializeMermaid() {
    if (!window.mermaid) return;
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
      themeVariables: {
        darkMode: true,
        background: '#0d0d0f',
        primaryColor: 'rgba(201, 162, 75, 0.28)',
        primaryTextColor: 'rgba(237, 234, 227, 0.9)',
        primaryBorderColor: 'rgba(201, 162, 75, 0.5)',
        lineColor: 'rgba(201, 162, 75, 0.6)',
        secondaryColor: 'rgba(201, 162, 75, 0.12)',
        tertiaryColor: 'rgba(201, 162, 75, 0.06)'
      },
      flowchart: {
        curve: 'basis',
        padding: 14,
        nodeSpacing: 28,
        rankSpacing: 44
      },
      sequence: {
        mirrorActors: false,
        bottomMarginAdj: 1,
        actorMargin: 40,
        boxMargin: 10
      }
    });
  }

  /**
   * Render a Mermaid diagram block.
   * @param {string} mermaidSource - Mermaid source code.
   * @param {boolean} incomplete - Whether the block is incomplete (streaming).
   * @returns {HTMLElement} - Diagram viewer element.
   */
  render(mermaidSource, incomplete = false) {
    const container = document.createElement('div');
    container.className = 'diagram-viewer';
    if (incomplete) {
      container.classList.add('incomplete');
    }

    const header = document.createElement('div');
    header.className = 'diagram-viewer-header';

    const typeLabel = document.createElement('div');
    typeLabel.className = 'diagram-type-label';
    const diagramType = this.detectDiagramType(mermaidSource);
    typeLabel.textContent = diagramType ? `${diagramType} diagram` : 'DIAGRAM';

    const toolbar = document.createElement('div');
    toolbar.className = 'diagram-toolbar';

    const zoomInBtn = this.createToolbarButton('+', 'Zoom in');
    const zoomOutBtn = this.createToolbarButton('–', 'Zoom out');
    const zoomLevel = document.createElement('span');
    zoomLevel.className = 'diagram-zoom-level';
    zoomLevel.textContent = '100%';
    const fitBtn = this.createToolbarButton('Fit', 'Fit to view');
    const fullscreenBtn = this.createToolbarButton('Expand', 'Fullscreen');
    const copyBtn = this.createToolbarButton('Copy', 'Copy Mermaid source');
    copyBtn.className += ' diagram-copy-btn';

    const diagramContainer = document.createElement('div');
    diagramContainer.className = 'diagram-container';
    const diagramSvgWrapper = document.createElement('div');
    diagramSvgWrapper.className = 'diagram-svg-wrapper';

    // Update zoom level display
    const updateZoomLevel = () => {
      zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
    };

    // Initial render
    const renderDiagram = async (resolveLoad = false) => {
      if (!mermaidSource || !mermaidSource.trim()) {
        diagramSvgWrapper.innerHTML = '<div class="diagram-empty">No diagram source provided.</div>';
        return;
      }

      // Loading state
      diagramSvgWrapper.innerHTML = '<div class="diagram-loading"></div>';

      // Ensure Mermaid ready
      if (this.mermaidLoadingPromise) {
        await this.mermaidLoadingPromise;
      }

      if (!window.mermaid) {
        diagramSvgWrapper.innerHTML = '<div class="diagram-error">Mermaid is not available. Could not render diagram.</div>';
        return;
      }

      const sanitizedSource = String(mermaidSource).trim();
      const uniqueId = `diagram-${Date.now()}-${Math.random().toString(16).slice(8)}`;

      try {
        const { svg } = await window.mermaid.render(uniqueId, sanitizedSource);
        diagramSvgWrapper.innerHTML = svg;
        // Ensure SVG does not carry any script-executing attributes.
        const svgEl = diagramSvgWrapper.querySelector('svg');
        if (svgEl) {
          svgEl.removeAttribute('onload');
          svgEl.querySelectorAll('script').forEach(s => s.remove());
        }
      } catch (err) {
        const message = err && err.message ? err.message : String(err);
        diagramSvgWrapper.innerHTML = `<div class="diagram-error">Invalid Mermaid syntax: ${this.escapeHtml(message)}</div>`;
      }
    };

    renderDiagram();

    // Toolbar actions
    zoomInBtn.onclick = () => this.zoomIn(diagramContainer);
    zoomOutBtn.onclick = () => this.zoomOut(diagramContainer);
    fitBtn.onclick = () => this.fitToView(diagramContainer);
    fullscreenBtn.onclick = () => this.toggleFullscreen(container, diagramContainer, fullscreenBtn);
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      this.copyToClipboard(mermaidSource, copyBtn);
    };

    toolbar.appendChild(zoomInBtn);
    toolbar.appendChild(zoomOutBtn);
    toolbar.appendChild(zoomLevel);
    toolbar.appendChild(fitBtn);
    toolbar.appendChild(fullscreenBtn);
    toolbar.appendChild(copyBtn);

    header.appendChild(typeLabel);
    header.appendChild(toolbar);

    diagramContainer.appendChild(diagramSvgWrapper);
    container.appendChild(header);
    container.appendChild(diagramContainer);

    return container;
  }

  /**
   * Detect diagram type from Mermaid source.
   * @param {string} source - Mermaid source.
   * @returns {string|null} - Diagram type name.
   */
  detectDiagramType(source) {
    if (!source) return null;
    const firstLine = source.split('\\n')[0].trim().toLowerCase();
    if (firstLine.startsWith('graph') || firstLine.startsWith('flowchart')) return 'Flowchart';
    if (firstLine.startsWith('sequencediagram')) return 'Sequence';
    if (firstLine.startsWith('classdiagram')) return 'Class';
    if (firstLine.startsWith('statediagram')) return 'State';
    if (firstLine.startsWith('erdiagram')) return 'Entity Relationship';
    if (firstLine.startsWith('journey')) return 'Journey';
    if (firstLine.startsWith('gantt')) return 'Gantt';
    if (firstLine.startsWith('pie')) return 'Pie Chart';
    if (firstLine.startsWith('gitgraph')) return 'Git Graph';
    return null;
  }

  /**
   * Create a toolbar button.
   * @param {string} label - Button label.
   * @param {string} title - Button title/tooltip.
   * @returns {HTMLButtonElement} - Button element.
   */
  createToolbarButton(label, title) {
    const button = document.createElement('button');
    button.className = 'diagram-toolbar-btn';
    button.textContent = label;
    button.title = title;
    button.setAttribute('aria-label', title);
    return button;
  }

  /**
   * Zoom in on the diagram.
   * @param {HTMLElement} container - Diagram container element.
   */
  zoomIn(container) {
    this.currentZoom = Math.min(this.maxZoom, this.currentZoom + 0.2);
    this.applyZoom(container);
  }

  /**
   * Zoom out on the diagram.
   * @param {HTMLElement} container - Diagram container element.
   */
  zoomOut(container) {
    this.currentZoom = Math.max(this.minZoom, this.currentZoom - 0.2);
    this.applyZoom(container);
  }

  /**
   * Apply current zoom level to the diagram.
   * @param {HTMLElement} container - Diagram container element.
   */
  applyZoom(container) {
    const svgWrapper = container.querySelector('.diagram-svg-wrapper');
    if (svgWrapper) {
      svgWrapper.style.transform = `scale(${this.currentZoom})`;
      svgWrapper.style.transformOrigin = 'top left';
    }
  }

  /**
   * Fit diagram to view.
   * @param {HTMLElement} container - Diagram container element.
   */
  fitToView(container) {
    this.currentZoom = 1;
    this.applyZoom(container);
  }

  /**
   * Toggle fullscreen mode.
   * @param {HTMLElement} viewerContainer - Full viewer container.
   * @param {HTMLElement} diagramContainer - Diagram container element.
   * @param {HTMLButtonElement} button - Fullscreen toggle button.
   */
  toggleFullscreen(viewerContainer, diagramContainer, button) {
    if (!document.fullscreenElement) {
      viewerContainer.requestFullscreen().then(() => {
        button.textContent = 'Exit';
        button.title = 'Exit fullscreen';
        button.setAttribute('aria-label', 'Exit fullscreen');
      }).catch(err => {
        console.warn('Fullscreen not available:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        button.textContent = 'Expand';
        button.title = 'Fullscreen';
        button.setAttribute('aria-label', 'Fullscreen');
      });
    }
  }

  /**
   * Copy text to clipboard.
   * @param {string} text - Text to copy.
   * @param {HTMLButtonElement} button - Copy button.
   */
  async copyToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      button.textContent = 'Error';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    }
  }

  /**
   * Escape HTML entities for safe rendering.
   * @param {string} text - Text to escape.
   * @returns {string} - Escaped text.
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for ES6 modules
export default DiagramViewer;
