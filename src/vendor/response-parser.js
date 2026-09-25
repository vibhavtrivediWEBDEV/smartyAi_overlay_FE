/**
 * Response Parser Utility
 * Parses AI responses with Markdown code blocks into structured blocks
 * Supports streaming updates safely
 */

/**
 * Parse AI response text into structured blocks
 * @param {string} text - Raw AI response text
 * @returns {Array} - Array of {type: 'text'|'code', content: string, language?: string}
 */
function parseAIResponse(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const blocks = [];
  
  // Regex to match fenced code blocks with optional language
  // Matches: ```lang\ncode\n``` or ```\ncode\n```
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before the code block (if any)
    const textBefore = text.slice(lastIndex, match.index).trim();
    if (textBefore) {
      blocks.push({
        type: 'text',
        content: textBefore
      });
    }
    
    const language = match[1] || detectLanguage(match[2]) || '';
    const codeContent = match[2].trim();
    
    if (codeContent) {
      if (language === 'mermaid' || /^(graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph)/m.test(codeContent)) {
        blocks.push({
          type: 'mermaid',
          content: codeContent,
          language: 'mermaid'
        });
      } else {
        blocks.push({
          type: 'code',
          content: codeContent,
          language: language
        });
      }
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text after the last code block
  const remainingText = text.slice(lastIndex).trim();
  if (remainingText) {
    // Check if remaining text has incomplete code fence
    const incompleteFenceMatch = remainingText.match(/```(\w*)\n?([\s\S]*)$/);
    
    if (incompleteFenceMatch) {
      // Has incomplete fence - extract the code part
      const codePart = incompleteFenceMatch[2].trim();
      if (codePart) {
        const language = incompleteFenceMatch[1] || '';
        blocks.push({
          type: 'code',
          content: codePart,
          language: language,
          incomplete: true
        });
      }
      
      // Text before the incomplete fence
      const textBeforeFence = remainingText.slice(0, incompleteFenceMatch.index).trim();
      if (textBeforeFence) {
        blocks.push({
          type: 'text',
          content: textBeforeFence
        });
      }
    } else {
      blocks.push({
        type: 'text',
        content: remainingText
      });
    }
  }
  
  // Process text blocks to handle inline code, lists, etc.
  return blocks.map(block => {
    if (block.type === 'text') {
      return processTextBlock(block);
    }
    return block;
  });
}

/**
 * Process text block to detect inline code, lists, etc.
 * @param {Object} block - Text block
 * @returns {Object} - Processed block
 */
function processTextBlock(block) {
  return {
    ...block,
    hasInlineCode: /`[^`]+`/.test(block.content),
    hasList: /^[\s]*[-*+]\s/.test(block.content) || /^[\s]*\d+\.\s/.test(block.content),
    content: block.content
  };
}

/**
 * Detect programming language from code content
 * @param {string} code - Code content
 * @returns {string} - Detected language or empty string
 */
function detectLanguage(code) {
  if (!code || typeof code !== 'string') return '';
  
  // Simple heuristics for common languages
  const patterns = [
    { lang: 'javascript', test: /(const|let|var|function|=>|console\.log)/ },
    { lang: 'python', test: /(def |import |from |class |print\(|if __name__)/ },
    { lang: 'java', test: /(public class|private |void |System\.out\.println)/ },
    { lang: 'cpp', test: /(#include|std::|cout|cin|int main\(\))/ },
    { lang: 'c', test: /(printf|#include|int main\(\))/ },
    { lang: 'csharp', test: /(using System|namespace |class Program|Console\.Write)/ },
    { lang: 'go', test: /(package main|func main|fmt\.Print|import "fmt")/ },
    { lang: 'rust', test: /(fn main|let mut|println!|use std::)/ },
    { lang: 'ruby', test: /(def |end|puts |require |class )/ },
    { lang: 'php', test: /(<\?php|echo |function |class )/ },
    { lang: 'swift', test: /(import Foundation|func |var |let |print\()/ },
    { lang: 'kotlin', test: /(fun main|println\(|val |var )/ },
    { lang: 'typescript', test: /(interface |type |: string|: number|: boolean)/ },
    { lang: 'html', test: /(<!DOCTYPE|<html|<head|<body|<div)/ },
    { lang: 'css', test: /(@import|\.class|#id|{[\s\S]*:.*;[\s\S]*})/ },
    { lang: 'json', test: /^\s*[\[{]/ },
    { lang: 'yaml', test: /^\s*[\w-]+:\s/ },
    { lang: 'bash', test: /(^#!\/bin\/bash|^echo |npm |yarn |git )/ },
    { lang: 'sql', test: /(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|CREATE TABLE)/i },
  ];
  
  for (const pattern of patterns) {
    if (pattern.test.test(code)) {
      return pattern.lang;
    }
  }
  
  return '';
}

/**
 * Escape HTML entities to prevent XSS (for text content only)
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';

  return text.replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
}

/**
 * Unescape HTML entities (for code blocks)
 * @param {string} text - Text with HTML entities
 * @returns {string} - Unescaped text
 */
function unescapeHtml(text) {
  if (!text) return '';
  
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Process inline code in text (convert single backticks to styled spans)
 * @param {string} text - Text with potential inline code
 * @param {boolean} alreadyEscaped - true if text is already HTML-escaped/processed
 * @returns {string} - HTML string with inline code styled
 */
function processInlineCode(text, alreadyEscaped = false) {
  if (!text) return '';
  
  let processed = alreadyEscaped ? text : escapeHtml(text);
  
  // Replace inline code `code` with <code class="inline-code">code</code>
  processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  return processed;
}

/**
 * Process markdown-style lists in text
 * @param {string} text - Text with potential lists
 * @returns {string} - HTML string with lists formatted
 */
function processLists(text) {
  if (!text) return '';
  
  const lines = text.split('\n');
  let html = '';
  let inList = false;
  let listType = '';
  
  lines.forEach(line => {
    const ulMatch = line.match(/^(\s*)[-*+]\s(.+)$/);
    const olMatch = line.match(/^(\s*)\d+\.\s(.+)$/);
    
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) html += `</${listType}>`;
        html += '<ul>';
        inList = true;
        listType = 'ul';
      }
      html += `<li>${processInlineCode(ulMatch[2], true)}</li>`;
    } else if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) html += `</${listType}>`;
        html += '<ol>';
        inList = true;
        listType = 'ol';
      }
      html += `<li>${processInlineCode(olMatch[2], true)}</li>`;
    } else {
      if (inList) {
        html += `</${listType}>`;
        inList = false;
      }
      html += processInlineCode(line, true);
    }
  });
  
  if (inList) {
    html += `</${listType}>`;
  }
  
  return html;
}

/**
 * Process markdown formatting in text
 * @param {string} text - Text with markdown
 * @returns {string} - HTML string
 */
function processMarkdown(text) {
  if (!text) return '';
  
  let processed = text;
  
  // STEP 1: Convert safe HTML tags to Markdown FIRST (preserves formatting)
  // This handles responses that contain HTML formatting
  processed = processed.replace(/<strong>([^<]+)<\/strong>/gi, '**$1**');
  processed = processed.replace(/<b>([^<]+)<\/b>/gi, '**$1**');
  processed = processed.replace(/<em>([^<]+)<\/em>/gi, '*$1*');
  processed = processed.replace(/<i>([^<]+)<\/i>/gi, '*$1*');
  processed = processed.replace(/<code>([^<]+)<\/code>/gi, '`$1`');
  
  // Convert HTML lists
  processed = processed.replace(/<ul>/gi, '\n');
  processed = processed.replace(/<\/ul>/gi, '\n');
  processed = processed.replace(/<ol>/gi, '\n');
  processed = processed.replace(/<\/ol>/gi, '\n');
  processed = processed.replace(/<li>([^<]+)<\/li>/gi, '- $1\n');
  
  // Convert HTML headings
  processed = processed.replace(/<h1>([^<]+)<\/h1>/gi, '# $1\n');
  processed = processed.replace(/<h2>([^<]+)<\/h2>/gi, '## $1\n');
  processed = processed.replace(/<h3>([^<]+)<\/h3>/gi, '### $1\n');
  
  processed = processed.replace(/<header>([^<]*)<\/header>/gi, '\n---\n$1\n---\n');
  processed = processed.replace(/<footer>([^<]*)<\/footer>/gi, '\n---\n$1\n---\n');
  processed = processed.replace(/<section>([^<]*)<\/section>/gi, '\n\n$1\n\n');
  processed = processed.replace(/<article>([^<]*)<\/article>/gi, '\n\n$1\n\n');
  processed = processed.replace(/<main>([^<]*)<\/main>/gi, '\n\n$1\n\n');
  processed = processed.replace(/<nav>([^<]*)<\/nav>/gi, '\n$1\n');
  processed = processed.replace(/<aside>([^<]*)<\/aside>/gi, '\n> $1\n');

  // STEP 2: Remove ALL remaining HTML tags (XSS prevention)
  processed = processed.replace(/<[^>]+>/g, '');
  
  // STEP 3: NOW escape HTML entities (safety for any remaining special chars)
  processed = escapeHtml(processed);
  // Bold text **text** or __text__
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Italic text *text* or _text_
  processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  processed = processed.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // Headers (at start of line)
  processed = processed.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  processed = processed.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  processed = processed.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Lists
  processed = processLists(processed);
  
  // Line breaks (preserve paragraph structure)
  processed = processed.replace(/\n\n+/g, '</p><p>');
  processed = `<p>${processed}</p>`;
  
  // Clean up empty paragraphs
  processed = processed.replace(/<p>\s*<\/p>/g, '');
  
  return processed;
}

const ResponseParser = {
  parseAIResponse,
  processMarkdown,
  processInlineCode,
  detectLanguage,
  escapeHtml,
  unescapeHtml
};

// Export for Electron renderer pages and module consumers.
if (typeof window !== 'undefined') window.ResponseParser = ResponseParser;
if (typeof module !== 'undefined') module.exports = ResponseParser;
