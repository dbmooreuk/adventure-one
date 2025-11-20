/**
 * Assets Manager
 * Handles loading and displaying project assets from src/assets/images
 */

export class AssetsManager {
    constructor(editor) {
        this.editor = editor;
        this.assets = [];
        this.container = null;
        this.init();
    }
    
    /**
     * Initialize the assets manager
     */
    init() {
        this.container = document.getElementById('assets-container');

        if (!this.container) {
            console.error('Assets container not found');
            return;
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-assets-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                // Add visual feedback
                const originalText = refreshBtn.textContent;
                refreshBtn.textContent = '🔄 Refreshing...';
                refreshBtn.disabled = true;

                await this.loadAssets();

                // Restore button
                refreshBtn.textContent = originalText;
                refreshBtn.disabled = false;
            });
        }

        // Don't load assets immediately - wait for tab to be shown
        // this.loadAssets();
    }
    
    /**
     * Load assets from src/assets/images directory
     */
    async loadAssets() {
        console.log('🖼️ Loading assets...');

        if (!this.container) {
            console.error('Assets container not found!');
            return;
        }

        try {
            this.showLoading();

            // Try to fetch the asset manifest with cache-busting
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`../src/assets/images/asset-manifest.json${cacheBuster}`, {
                cache: 'no-cache'
            });

            if (response.ok) {
                const manifest = await response.json();
                this.assets = manifest.assets || [];
                console.log(`✓ Loaded ${this.assets.length} assets from manifest`);
                this.renderAssets();
            } else {
                // Fallback to hardcoded list if manifest doesn't exist
                console.warn('Asset manifest not found, using fallback list');
                this.loadFallbackAssets();
            }

        } catch (error) {
            console.error('Error loading assets:', error);
            // Fallback to hardcoded list
            this.loadFallbackAssets();
        }
    }

    /**
     * Load fallback hardcoded asset list
     */
    loadFallbackAssets() {
        // All image files in the project (updated list)
        const knownAssets = [
            // Backgrounds
            'backgrounds/screen-splash.png',
            'backgrounds/screen-stasis.png',
            'backgrounds/splash.png',
            // Items
            'items/boat-without-oar.png',
            'items/bottle-complete.png',
            'items/butterfly1.png',
            'items/butterfly2.png',
            'items/butterfly3.png',
            'items/butterfly4.png',
            'items/butterfly5.png',
            'items/gear.png',
            'items/karibiner.png',
            'items/rope.png',
            'items/sea-1.png',
            'items/starburst-one.png',
            'items/torch.png',
            'items/tower-one.png',
            // UI
            'ui/fingerprint.svg',
            'ui/icon-monachus.png',
            'ui/icon-monachus.svg'
        ];

        // Convert to asset objects
        this.assets = knownAssets.map(assetPath => ({
            name: assetPath.split('/').pop(),
            path: assetPath,
            category: assetPath.split('/')[0]
        }));

        console.log(`✓ Found ${this.assets.length} assets (fallback)`);
        this.renderAssets();
    }
    
    /**
     * Fallback: Load assets using File System Access API
     */
    async loadAssetsFromFileSystem() {
        try {
            // For now, show a message that this requires manual setup
            this.showManualInstructions();
        } catch (error) {
            console.error('File system access error:', error);
            this.showError('Unable to access file system.');
        }
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        this.container.innerHTML = '<p class="loading-message">Loading assets...</p>';
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.container.innerHTML = `
            <div class="assets-error">
                <p>⚠️ ${message}</p>
                <p class="help-text">To use this feature, you need to:</p>
                <ol class="help-list">
                    <li>Run the editor through a local development server</li>
                    <li>Ensure the server can access <code>src/assets/images</code></li>
                </ol>
            </div>
        `;
    }
    
    /**
     * Show manual instructions
     */
    showManualInstructions() {
        this.container.innerHTML = `
            <div class="assets-manual">
                <h4>📁 Asset Browser</h4>
                <p>This feature displays images from <code>src/assets/images/</code></p>
                <p class="help-text">Images in your project:</p>
                <div class="asset-path-info">
                    <code>src/assets/images/</code>
                </div>
                <p class="help-text">
                    To enable automatic asset loading, run this editor through a development server
                    that provides directory listing API.
                </p>
                <button id="browse-assets-btn" class="btn btn-primary">
                    📂 Browse Assets Folder
                </button>
            </div>
        `;
        
        // Add event listener for browse button
        const browseBtn = document.getElementById('browse-assets-btn');
        if (browseBtn) {
            browseBtn.addEventListener('click', () => this.browseAssetsFolder());
        }
    }
    
    /**
     * Browse assets folder using File System Access API
     */
    async browseAssetsFolder() {
        try {
            if (!('showDirectoryPicker' in window)) {
                alert('File System Access API is not supported in this browser. Please use Chrome or Edge.');
                return;
            }
            
            const dirHandle = await window.showDirectoryPicker({
                mode: 'read',
                startIn: 'documents'
            });
            
            const files = [];
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file' && this.isImageFile(entry.name)) {
                    files.push({
                        name: entry.name,
                        handle: entry
                    });
                }
            }
            
            this.assets = files;
            await this.renderAssetsFromHandles();
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error browsing folder:', error);
                alert('Error accessing folder: ' + error.message);
            }
        }
    }
    
    /**
     * Check if file is an image
     */
    isImageFile(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
    }
    
    /**
     * Render assets from file handles
     */
    async renderAssetsFromHandles() {
        if (this.assets.length === 0) {
            this.container.innerHTML = '<p class="empty-message">No image files found in selected folder.</p>';
            return;
        }
        
        this.container.innerHTML = `
            <div class="assets-grid">
                ${await Promise.all(this.assets.map(asset => this.renderAssetFromHandle(asset)))}
            </div>
        `;
    }
    
    /**
     * Render single asset from file handle
     */
    async renderAssetFromHandle(asset) {
        try {
            const file = await asset.handle.getFile();
            const url = URL.createObjectURL(file);
            
            return `
                <div class="asset-item" data-filename="${asset.name}">
                    <div class="asset-image">
                        <img src="${url}" alt="${asset.name}" loading="lazy">
                    </div>
                    <div class="asset-info">
                        <div class="asset-name" title="${asset.name}">${asset.name}</div>
                        <button class="btn btn-sm copy-filename-btn" data-filename="${asset.name}">
                            Copy Name
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading asset:', asset.name, error);
            return '';
        }
    }
    
    /**
     * Render assets grid
     */
    renderAssets() {
        console.log('Rendering assets...', this.assets.length);

        if (this.assets.length === 0) {
            this.container.innerHTML = '<p class="empty-message">No assets found in src/assets/images/</p>';
            return;
        }

        // Group assets by category
        const grouped = {};
        this.assets.forEach(asset => {
            if (!grouped[asset.category]) {
                grouped[asset.category] = [];
            }
            grouped[asset.category].push(asset);
        });

        console.log('📁 Categories:', Object.keys(grouped));

        let html = '';
        for (const [category, assets] of Object.entries(grouped)) {
            html += `
                <div class="assets-category">
                    <h4 class="category-title">${category}</h4>
                    <div class="assets-grid">
                        ${assets.map(asset => this.renderAsset(asset)).join('')}
                    </div>
                </div>
            `;
        }

        this.container.innerHTML = html;
        console.log('✓ Assets rendered');

        // Add event listeners for copy buttons
        this.container.querySelectorAll('.copy-filename-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filename = e.target.dataset.filename;
                this.copyToClipboard(filename);
            });
        });
    }

    /**
     * Render single asset
     */
    renderAsset(asset) {
        const imagePath = `../src/assets/images/${asset.path}`;

        return `
            <div class="asset-item" data-filename="${asset.name}">
                <div class="asset-image">
                    <img src="${imagePath}" alt="${asset.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'asset-error\\'>❌</div>'">
                </div>
                <div class="asset-info">
                    <div class="asset-name" title="${asset.name}">${asset.name}</div>
                    <button class="btn btn-sm copy-filename-btn" data-filename="${asset.name}">
                        Copy Name
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Copy filename to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.editor.uiManager.setStatus(`Copied: ${text}`, 'success');
        } catch (error) {
            console.error('Failed to copy:', error);
            this.editor.uiManager.setStatus('Failed to copy to clipboard', 'danger');
        }
    }
}

