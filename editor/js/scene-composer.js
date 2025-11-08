/**
 * Scene Composer - Visual drag-and-drop scene editor
 * Allows visual positioning of items on scene backgrounds
 */

export class SceneComposer {
    constructor(editor) {
        this.editor = editor;
        this.currentScene = null;
        this.canvas = null;
        this.ctx = null;
        this.itemsLayer = null;
        this.backgroundImage = null;

        // Viewport settings (matches game: 1280x720)
        this.baseWidth = 1280;
        this.baseHeight = 720;
        this.scale = 1.0;
        this.minScale = 0.25;
        this.maxScale = 2.0;

        // Drag state
        this.draggedItem = null;
        this.draggedElement = null;
        this.dragOffset = { x: 0, y: 0 };
        this.selectedItem = null;

        // Grid settings
        this.gridEnabled = false;
        this.gridSize = 10;

        this.init();
    }

    /**
     * Initialize the composer
     */
    init() {
        this.canvas = document.getElementById('composer-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.itemsLayer = document.getElementById('composer-items-layer');

        // Set canvas size to match game viewport
        this.canvas.width = this.baseWidth;
        this.canvas.height = this.baseHeight;

        this.setupEventListeners();
        console.log('🎨 Scene Composer initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Zoom controls
        document.getElementById('composer-zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('composer-zoom-out')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('composer-fit')?.addEventListener('click', () => this.fitToView());
        document.getElementById('composer-grid-toggle')?.addEventListener('click', () => this.toggleGrid());

        // Canvas wrapper for panning and deselection
        const wrapper = document.querySelector('.composer-canvas-wrapper');
        if (wrapper) {
            wrapper.addEventListener('wheel', (e) => this.handleWheel(e));

            // Click on canvas background to deselect
            wrapper.addEventListener('click', (e) => {
                // Only deselect if clicking directly on wrapper or canvas (not on items)
                if (e.target === wrapper || e.target === this.canvas) {
                    this.deselectItem();
                }
            });
        }
    }

    /**
     * Load a scene into the composer
     */
    async loadScene(sceneName) {
        console.log('🎨 Loading scene into composer:', sceneName);

        const scene = this.editor.data.scenes.find(s => s.sceneName === sceneName);
        if (!scene) {
            console.error('Scene not found:', sceneName);
            return;
        }

        this.currentScene = scene;

        // Update UI
        const sceneNameEl = document.getElementById('composer-scene-name');
        if (sceneNameEl) {
            sceneNameEl.textContent = scene.title || scene.sceneName;
        }

        // Load background image
        await this.loadBackground(scene.backgroundImage);

        // Render scene items
        this.renderSceneItems();

        // Fit to view initially
        this.fitToView();
    }

    /**
     * Load background image
     */
    async loadBackground(backgroundPath) {
        return new Promise((resolve) => {
            if (!backgroundPath) {
                console.log('No background image specified, using black background');
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);
                resolve();
                return;
            }

            const img = new Image();
            img.onload = () => {
                this.backgroundImage = img;
                this.drawBackground();
                console.log('✓ Background loaded:', backgroundPath);
                resolve();
            };
            img.onerror = () => {
                console.warn('Failed to load background:', backgroundPath, '- using black background');
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);
                // Still resolve (don't reject) so the scene can load
                resolve();
            };

            // Construct path - backgrounds are in backgrounds/ subdirectory
            // Use relative path from editor directory
            img.src = `../src/assets/images/backgrounds/${backgroundPath}`;
        });
    }

    /**
     * Draw background on canvas
     */
    drawBackground() {
        this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

        if (this.backgroundImage) {
            this.ctx.drawImage(this.backgroundImage, 0, 0, this.baseWidth, this.baseHeight);
        } else {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);
        }

        // Draw grid if enabled
        if (this.gridEnabled) {
            this.drawGrid();
        }
    }

    /**
     * Draw grid overlay
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.baseWidth; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.baseHeight);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.baseHeight; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.baseWidth, y);
            this.ctx.stroke();
        }
    }

    /**
     * Render scene items as draggable elements
     */
    renderSceneItems() {
        if (!this.currentScene) return;

        // Clear existing items
        this.itemsLayer.innerHTML = '';

        // Get scene items
        const sceneItems = this.currentScene.items || [];

        sceneItems.forEach(itemName => {
            const item = this.editor.data.sceneItems.find(i => i.name === itemName);
            if (item) {
                this.createItemElement(item);
            }
        });

        // Update items layer scale
        this.updateItemsLayerTransform();
    }

    /**
     * Create draggable item element
     */
    createItemElement(item) {
        const itemEl = document.createElement('div');
        itemEl.className = 'composer-item';
        itemEl.dataset.itemName = item.name;

        // Handle both position formats: [x, y] array or x/y properties
        const x = item.position ? item.position[0] : (item.x || 0);
        const y = item.position ? item.position[1] : (item.y || 0);
        const width = item.size ? item.size[0] : (item.width || 100);
        const height = item.size ? item.size[1] : (item.height || 100);

        // Position
        itemEl.style.left = `${x}px`;
        itemEl.style.top = `${y}px`;
        itemEl.style.width = `${width}px`;
        itemEl.style.height = `${height}px`;

        // Apply z-index if specified
        if (item.zIndex !== undefined) {
            itemEl.style.zIndex = item.zIndex;
        }

        // Background image - handle both 'image' and 'imageSrc' properties
        const imageFile = item.image || item.imageSrc;
        if (imageFile) {
            // Items are in items/ subdirectory
            // Use relative path from editor directory
            itemEl.style.backgroundImage = `url(../src/assets/images/items/${imageFile})`;
            itemEl.style.backgroundSize = 'contain';
            itemEl.style.backgroundRepeat = 'no-repeat';
            itemEl.style.backgroundPosition = 'center';
        }

        // Label
        const label = document.createElement('div');
        label.className = 'composer-item-label';
        label.textContent = item.longName || item.name;
        itemEl.appendChild(label);

        // Event listeners
        itemEl.addEventListener('mousedown', (e) => this.startDrag(e, item, itemEl));
        itemEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectItem(item, itemEl);
        });

        this.itemsLayer.appendChild(itemEl);
    }

    /**
     * Start dragging an item
     */
    startDrag(e, item, element) {
        e.preventDefault();
        e.stopPropagation();

        this.draggedItem = item;
        this.draggedElement = element;

        // Get current item position from the element's style
        const currentX = parseFloat(element.style.left) || 0;
        const currentY = parseFloat(element.style.top) || 0;

        // Calculate mouse position in canvas coordinates
        const wrapper = document.querySelector('.composer-canvas-wrapper');
        const wrapperRect = wrapper.getBoundingClientRect();
        const mouseCanvasX = (e.clientX - wrapperRect.left) / this.scale;
        const mouseCanvasY = (e.clientY - wrapperRect.top) / this.scale;

        // Calculate offset from mouse to item position
        this.dragOffset.x = mouseCanvasX - currentX;
        this.dragOffset.y = mouseCanvasY - currentY;

        element.classList.add('dragging');

        // Add document-level listeners
        document.addEventListener('mousemove', this.handleDragMove);
        document.addEventListener('mouseup', this.handleDragEnd);
    }

    /**
     * Handle drag move
     */
    handleDragMove = (e) => {
        if (!this.draggedElement || !this.draggedItem) return;

        const wrapper = document.querySelector('.composer-canvas-wrapper');
        const wrapperRect = wrapper.getBoundingClientRect();

        // Calculate mouse position in canvas coordinates
        const mouseCanvasX = (e.clientX - wrapperRect.left) / this.scale;
        const mouseCanvasY = (e.clientY - wrapperRect.top) / this.scale;

        // Apply the offset (already in canvas coordinates)
        let x = mouseCanvasX - this.dragOffset.x;
        let y = mouseCanvasY - this.dragOffset.y;

        // Snap to grid if enabled
        if (this.gridEnabled) {
            x = Math.round(x / this.gridSize) * this.gridSize;
            y = Math.round(y / this.gridSize) * this.gridSize;
        }

        // Update element position
        this.draggedElement.style.left = `${x}px`;
        this.draggedElement.style.top = `${y}px`;
    }

    /**
     * Handle drag end
     */
    handleDragEnd = (e) => {
        if (!this.draggedElement || !this.draggedItem) return;

        this.draggedElement.classList.remove('dragging');

        // Update item data
        const x = parseInt(this.draggedElement.style.left);
        const y = parseInt(this.draggedElement.style.top);

        // Update position in the correct format (array)
        if (this.draggedItem.position) {
            this.draggedItem.position[0] = x;
            this.draggedItem.position[1] = y;
        } else {
            // Fallback to x/y properties if position array doesn't exist
            this.draggedItem.x = x;
            this.draggedItem.y = y;
        }

        console.log(`📍 Updated ${this.draggedItem.name} position:`, { x, y });

        // Trigger auto-save
        this.editor.saveCurrentWork();

        // Clean up
        document.removeEventListener('mousemove', this.handleDragMove);
        document.removeEventListener('mouseup', this.handleDragEnd);

        this.draggedItem = null;
        this.draggedElement = null;
    }

    /**
     * Select an item
     */
    selectItem(item, element) {
        // Deselect previous
        if (this.selectedItem) {
            const prevEl = this.itemsLayer.querySelector(`[data-item-name="${this.selectedItem.name}"]`);
            if (prevEl) prevEl.classList.remove('selected');
        }

        this.selectedItem = item;
        element.classList.add('selected');

        console.log('✓ Selected item:', item.name);

        // Show properties in the properties panel
        if (this.editor.propertiesPanel) {
            // Switch to properties tab
            this.editor.switchPreviewTab('properties');
            // Show item properties
            this.editor.propertiesPanel.showItemProperties(item);
        }
    }



    /**
     * Handle canvas drag over
     */
    handleCanvasDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    /**
     * Handle canvas drop
     */
    handleCanvasDrop = (e) => {
        e.preventDefault();

        const itemData = JSON.parse(e.dataTransfer.getData('application/json'));

        const wrapper = document.querySelector('.composer-canvas-wrapper');
        const wrapperRect = wrapper.getBoundingClientRect();

        // Calculate drop position
        let x = (e.clientX - wrapperRect.left) / this.scale;
        let y = (e.clientY - wrapperRect.top) / this.scale;

        // Snap to grid if enabled
        if (this.gridEnabled) {
            x = Math.round(x / this.gridSize) * this.gridSize;
            y = Math.round(y / this.gridSize) * this.gridSize;
        }

        // Update item position in the actual item data
        const actualItem = this.editor.data.sceneItems.find(i => i.name === itemData.name);
        if (actualItem) {
            // Update position in the correct format (array)
            if (actualItem.position) {
                actualItem.position[0] = Math.round(x);
                actualItem.position[1] = Math.round(y);
            } else {
                // Fallback to x/y properties
                actualItem.x = Math.round(x);
                actualItem.y = Math.round(y);
            }
        }

        // Add item to scene
        if (!this.currentScene.items) {
            this.currentScene.items = [];
        }

        if (!this.currentScene.items.includes(itemData.name)) {
            this.currentScene.items.push(itemData.name);
            console.log(`✓ Added ${itemData.name} to scene at (${actualItem.x}, ${actualItem.y})`);

            // Re-render
            this.renderSceneItems();

            // Trigger auto-save
            this.editor.saveCurrentWork();
        }
    }

    /**
     * Zoom in
     */
    zoomIn() {
        this.setZoom(Math.min(this.scale * 1.2, this.maxScale));
    }

    /**
     * Zoom out
     */
    zoomOut() {
        this.setZoom(Math.max(this.scale / 1.2, this.minScale));
    }

    /**
     * Set zoom level
     */
    setZoom(newScale) {
        this.scale = newScale;
        this.updateCanvasTransform();
        this.updateItemsLayerTransform();
        this.updateZoomDisplay();
    }

    /**
     * Fit canvas to view
     */
    fitToView() {
        const wrapper = document.querySelector('.composer-canvas-wrapper');
        if (!wrapper) return;

        const wrapperRect = wrapper.getBoundingClientRect();
        const scaleX = wrapperRect.width / this.baseWidth;
        const scaleY = wrapperRect.height / this.baseHeight;
        const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

        this.setZoom(scale);
    }

    /**
     * Update canvas transform
     */
    updateCanvasTransform() {
        this.canvas.style.transform = `scale(${this.scale})`;
    }

    /**
     * Update items layer transform
     */
    updateItemsLayerTransform() {
        const wrapper = document.querySelector('.composer-canvas-wrapper');
        if (!wrapper) return;

        const wrapperRect = wrapper.getBoundingClientRect();
        const canvasWidth = this.baseWidth * this.scale;
        const canvasHeight = this.baseHeight * this.scale;

        // Center the items layer
        const offsetX = (wrapperRect.width - canvasWidth) / 2;
        const offsetY = (wrapperRect.height - canvasHeight) / 2;

        this.itemsLayer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${this.scale})`;
        this.itemsLayer.style.width = `${this.baseWidth}px`;
        this.itemsLayer.style.height = `${this.baseHeight}px`;
    }

    /**
     * Update zoom display
     */
    updateZoomDisplay() {
        const zoomEl = document.getElementById('composer-zoom-level');
        if (zoomEl) {
            zoomEl.textContent = `${Math.round(this.scale * 100)}%`;
        }
    }

    /**
     * Toggle grid
     */
    toggleGrid() {
        this.gridEnabled = !this.gridEnabled;
        this.drawBackground();

        const btn = document.getElementById('composer-grid-toggle');
        if (btn) {
            btn.classList.toggle('active', this.gridEnabled);
        }
    }

    /**
     * Handle mouse wheel for zooming
     */
    handleWheel(e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();

            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        }
    }

    /**
     * Show composer
     */
    show() {
        const container = document.getElementById('composer-container');
        if (container) {
            container.classList.add('active');
        }

        // Reload current scene to reflect any data changes, or load selected scene
        if (this.currentScene) {
            // Reload the current scene to pick up any item changes
            this.loadScene(this.currentScene.sceneName);
        } else {
            // If no scene loaded, try to load the selected scene from the list
            const selectedScene = document.querySelector('#scenes-list-items .list-item.active');
            if (selectedScene) {
                const sceneId = selectedScene.dataset.sceneId;
                this.loadScene(sceneId);
            }
        }
    }

    /**
     * Hide composer
     */
    hide() {
        const container = document.getElementById('composer-container');
        if (container) {
            container.classList.remove('active');
        }

        // Clear properties panel
        if (this.editor.propertiesPanel) {
            this.editor.propertiesPanel.clear();
        }

        // Clear selection
        this.selectedItem = null;
    }

    /**
     * Deselect current item
     */
    deselectItem() {
        if (this.selectedItem) {
            const prevEl = this.itemsLayer.querySelector(`[data-item-name="${this.selectedItem.name}"]`);
            if (prevEl) prevEl.classList.remove('selected');
            this.selectedItem = null;

            // Clear properties panel
            if (this.editor.propertiesPanel) {
                this.editor.propertiesPanel.clear();
            }
        }
    }
}

