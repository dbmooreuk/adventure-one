/**
 * Code Editor - Direct JSON/JS editing with syntax highlighting
 */

export class CodeEditor {
    constructor(editor) {
        this.editor = editor;
        this.textarea = null;
        this.isDirty = false;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Code view tab
        const codeTab = document.querySelector('[data-tab="code"]');
        if (codeTab) {
            codeTab.addEventListener('click', () => {
                this.show();
            });
        }
        
        // Apply changes button
        document.getElementById('apply-code-btn')?.addEventListener('click', () => {
            this.applyChanges();
        });
        
        // Format code button
        document.getElementById('format-code-btn')?.addEventListener('click', () => {
            this.formatCode();
        });
        
        // Revert changes button
        document.getElementById('revert-code-btn')?.addEventListener('click', () => {
            this.revertChanges();
        });
    }
    
    /**
     * Show code editor view
     */
    show() {
        this.textarea = document.getElementById('code-textarea');
        if (!this.textarea) return;
        
        // Generate current code
        const code = this.generateCode();
        this.textarea.value = code;
        this.isDirty = false;
        
        // Add change listener
        this.textarea.addEventListener('input', () => {
            this.isDirty = true;
            this.updateStatus();
        });
        
        this.updateStatus();
        this.updateLineNumbers();
        
        // Update line numbers on scroll
        this.textarea.addEventListener('scroll', () => {
            this.syncScroll();
        });
        
        // Update line numbers on input
        this.textarea.addEventListener('input', () => {
            this.updateLineNumbers();
        });
    }
    
    /**
     * Generate code from current data
     */
    generateCode() {
        return this.editor.dataManager.generateGameDataFile();
    }
    
    /**
     * Apply code changes to editor data
     */
    applyChanges() {
        const code = this.textarea.value;

        try {
            // Parse the code
            const data = this.parseCode(code);

            // Validate structure
            if (!data.scenes || !data.sceneItems) {
                throw new Error('Invalid structure: missing scenes or sceneItems');
            }

            // Apply to editor
            this.editor.loadData(data);
            this.isDirty = false;
            this.updateStatus();

            this.editor.uiManager.setStatus('Code changes applied successfully', 'success');
            return true;
        } catch (error) {
            console.error('Parse error:', error);
            this.editor.uiManager.setStatus('Error: ' + error.message, 'danger');
            this.showError(error);
            return false;
        }
    }

    /**
     * Save code if valid (for auto-save)
     */
    saveIfValid() {
        if (!this.isDirty) return;

        const code = this.textarea.value;

        try {
            // Parse the code
            const data = this.parseCode(code);

            // Validate structure
            if (!data.scenes || !data.sceneItems) {
                console.log('Auto-save skipped: invalid structure');
                return;
            }

            // Apply to editor
            this.editor.loadData(data);
            this.isDirty = false;
            this.updateStatus();
            console.log('Code auto-saved');

            // Show subtle feedback
            this.showAutoSaveFeedback();
        } catch (error) {
            // Don't show error for auto-save, just skip
            console.log('Auto-save skipped: parse error');
        }
    }

    /**
     * Show auto-save feedback
     */
    showAutoSaveFeedback() {
        const indicator = document.getElementById('autosave-indicator');
        if (indicator) {
            indicator.textContent = '✓ Code saved';
            indicator.style.opacity = '1';
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 1500);
        }
    }
    
    /**
     * Parse code string to data object
     */
    parseCode(code) {
        try {
            // Remove export statement
            let cleaned = code.replace(/export\s+(const|let|var)\s+gameData\s*=\s*/, '');
            
            // Remove comments
            cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
            cleaned = cleaned.replace(/\/\/.*/g, '');
            
            // Find the main object
            const objectStart = cleaned.indexOf('{');
            if (objectStart === -1) {
                throw new Error('Could not find gameData object');
            }
            
            cleaned = cleaned.substring(objectStart);
            cleaned = cleaned.replace(/;?\s*$/, '');
            
            // Use Function constructor to evaluate
            const gameData = new Function('return ' + cleaned)();
            
            return gameData;
        } catch (error) {
            throw new Error('Failed to parse code: ' + error.message);
        }
    }
    
    /**
     * Format code (pretty print)
     */
    formatCode() {
        try {
            const data = this.parseCode(this.textarea.value);
            const formatted = this.editor.dataManager.generateGameDataFile();
            this.textarea.value = formatted;
            this.isDirty = true;
            this.updateStatus();
            this.updateLineNumbers();
            this.editor.uiManager.setStatus('Code formatted', 'success');
        } catch (error) {
            this.editor.uiManager.setStatus('Cannot format invalid code', 'danger');
        }
    }
    
    /**
     * Revert changes
     */
    revertChanges() {
        if (!this.isDirty) return;
        
        if (confirm('Revert all code changes? This cannot be undone.')) {
            const code = this.generateCode();
            this.textarea.value = code;
            this.isDirty = false;
            this.updateStatus();
            this.updateLineNumbers();
            this.editor.uiManager.setStatus('Changes reverted', 'success');
        }
    }
    
    /**
     * Update status message
     */
    updateStatus() {
        const statusEl = document.getElementById('code-status');
        if (!statusEl) return;
        
        if (this.isDirty) {
            statusEl.textContent = '⚠️ Unsaved changes - Click "Apply Changes" to update';
            statusEl.className = 'code-status warning';
        } else {
            statusEl.textContent = '✓ Code is in sync with editor';
            statusEl.className = 'code-status success';
        }
    }
    
    /**
     * Show error in code
     */
    showError(error) {
        const errorEl = document.getElementById('code-error');
        if (!errorEl) return;
        
        errorEl.textContent = error.message;
        errorEl.style.display = 'block';
        
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
    
    /**
     * Update line numbers
     */
    updateLineNumbers() {
        const lineNumbers = document.getElementById('line-numbers');
        if (!lineNumbers || !this.textarea) return;
        
        const lines = this.textarea.value.split('\n').length;
        const numbers = [];
        
        for (let i = 1; i <= lines; i++) {
            numbers.push(i);
        }
        
        lineNumbers.textContent = numbers.join('\n');
    }
    
    /**
     * Sync scroll between line numbers and textarea
     */
    syncScroll() {
        const lineNumbers = document.getElementById('line-numbers');
        if (!lineNumbers || !this.textarea) return;
        
        lineNumbers.scrollTop = this.textarea.scrollTop;
    }
    
    /**
     * Get current code
     */
    getCode() {
        return this.textarea ? this.textarea.value : '';
    }
    
    /**
     * Set code
     */
    setCode(code) {
        if (this.textarea) {
            this.textarea.value = code;
            this.updateLineNumbers();
            this.isDirty = false;
            this.updateStatus();
        }
    }
    
    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges() {
        return this.isDirty;
    }
}

