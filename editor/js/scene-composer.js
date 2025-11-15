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

        // Resize state
        this.resizing = false;
        this.resizeHandle = null; // 'nw', 'ne', 'sw', 'se'
        this.resizeStartPos = { x: 0, y: 0 };
        this.resizeStartSize = { width: 0, height: 0 };
        this.resizeStartItemPos = { x: 0, y: 0 };

        // Grid settings
        this.gridEnabled = false;
        this.gridSize = 10;

        // Hit area visualization
        this.hitAreaVisible = false;

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
     * Cleanup - remove event listeners
     */
    cleanup() {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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
        document.getElementById('composer-hitarea-toggle')?.addEventListener('click', () => this.toggleHitAreas());

        // Window resize handler - recalculate scale to maintain aspect ratio
        this.resizeHandler = this.debounce(() => {
            if (this.currentScene) {
                this.fitToView();
            }
        }, 250);
        window.addEventListener('resize', this.resizeHandler);

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

        // Fit to view initially (with small delay to ensure layout is ready)
        setTimeout(() => this.fitToView(), 100);
    }

    /**
     * Load background image
     */
    async loadBackground(backgroundPath) {
        return new Promise((resolve) => {
            // Get background color from current scene
            const bgColor = this.currentScene?.backgroundColor || '#000000';

            if (!backgroundPath) {
                console.log('No background image specified, using background color:', bgColor);
                this.ctx.fillStyle = bgColor;
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
                console.warn('Failed to load background:', backgroundPath, '- using background color:', bgColor);
                this.ctx.fillStyle = bgColor;
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

        // Get background color from current scene
        const bgColor = this.currentScene?.backgroundColor || '#000000';

        // Fill with background color first
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

        // Draw image on top if available
        if (this.backgroundImage) {
            this.ctx.drawImage(this.backgroundImage, 0, 0, this.baseWidth, this.baseHeight);
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

        // Normalize hitPolygon if it's an object (from IndexedDB)
        if (item.hitPolygon && typeof item.hitPolygon === 'object' && !Array.isArray(item.hitPolygon)) {
            item.hitPolygon = Object.values(item.hitPolygon);
        }

        // Hit area visualization overlay
        if (item.hitPolygon && Array.isArray(item.hitPolygon) && item.hitPolygon.length > 0) {
            // Polygon hit area
            this.createPolygonVisualization(itemEl, item);
        } else if (item.hitW || item.hitH) {
            // Rectangular hit area (legacy)
            const hitW = item.hitW || width;
            const hitH = item.hitH || height;
            const offsetX = (hitW - width) / 2;
            const offsetY = (hitH - height) / 2;

            const hitArea = document.createElement('div');
            hitArea.className = 'composer-hit-area';
            hitArea.style.position = 'absolute';
            hitArea.style.left = `${-offsetX}px`;
            hitArea.style.top = `${-offsetY}px`;
            hitArea.style.width = `${hitW}px`;
            hitArea.style.height = `${hitH}px`;
            hitArea.style.border = '2px dashed rgba(255, 0, 0, 0.6)';
            hitArea.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            hitArea.style.pointerEvents = 'none';
            hitArea.style.display = this.hitAreaVisible ? 'block' : 'none';
            itemEl.appendChild(hitArea);
        }

        // Label
        const label = document.createElement('div');
        label.className = 'composer-item-label';
        label.textContent = item.longName || item.name;
        itemEl.appendChild(label);

        // Resize handles (will be shown when selected)
        const handles = ['nw', 'ne', 'sw', 'se'];
        handles.forEach(position => {
            const handle = document.createElement('div');
            handle.className = `composer-resize-handle composer-resize-${position}`;
            handle.dataset.handle = position;
            handle.addEventListener('mousedown', (e) => this.startResize(e, item, itemEl, position));
            itemEl.appendChild(handle);
        });

        // Event listeners
        itemEl.addEventListener('mousedown', (e) => {
            // Don't start drag if hit areas are visible (editing mode)
            if (this.hitAreaVisible) {
                return;
            }
            // Don't start drag if clicking on a resize handle
            if (e.target.classList.contains('composer-resize-handle')) {
                return;
            }
            this.startDrag(e, item, itemEl);
        });
        itemEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectItem(item, itemEl);
        });

        this.itemsLayer.appendChild(itemEl);
    }

    /**
     * Start resizing an item
     */
    startResize(e, item, element, handle) {
        e.preventDefault();
        e.stopPropagation();

        // Don't allow resizing if hit areas are visible (editing mode)
        if (this.hitAreaVisible) {
            return;
        }

        this.resizing = true;
        this.resizeHandle = handle;
        this.draggedItem = item;
        this.draggedElement = element;

        // Store starting state
        const wrapper = document.querySelector('.composer-canvas-wrapper');
        const wrapperRect = wrapper.getBoundingClientRect();
        this.resizeStartPos.x = (e.clientX - wrapperRect.left) / this.scale;
        this.resizeStartPos.y = (e.clientY - wrapperRect.top) / this.scale;

        this.resizeStartSize.width = parseFloat(element.style.width) || 100;
        this.resizeStartSize.height = parseFloat(element.style.height) || 100;

        this.resizeStartItemPos.x = parseFloat(element.style.left) || 0;
        this.resizeStartItemPos.y = parseFloat(element.style.top) || 0;

        // Calculate aspect ratio
        this.aspectRatio = this.resizeStartSize.width / this.resizeStartSize.height;

        element.classList.add('resizing');

        // Add document-level listeners
        document.addEventListener('mousemove', this.handleResizeMove);
        document.addEventListener('mouseup', this.handleResizeEnd);
    }

    /**
     * Handle resize move
     */
    handleResizeMove = (e) => {
        if (!this.resizing || !this.draggedElement) return;

        const wrapper = document.querySelector('.composer-canvas-wrapper');
        const wrapperRect = wrapper.getBoundingClientRect();

        const mouseCanvasX = (e.clientX - wrapperRect.left) / this.scale;
        const mouseCanvasY = (e.clientY - wrapperRect.top) / this.scale;

        const deltaX = mouseCanvasX - this.resizeStartPos.x;
        const deltaY = mouseCanvasY - this.resizeStartPos.y;

        let newWidth = this.resizeStartSize.width;
        let newHeight = this.resizeStartSize.height;
        let newX = this.resizeStartItemPos.x;
        let newY = this.resizeStartItemPos.y;

        // Calculate new dimensions based on handle
        switch (this.resizeHandle) {
            case 'se': // Bottom-right
                newWidth = this.resizeStartSize.width + deltaX;
                newHeight = newWidth / this.aspectRatio;
                break;
            case 'sw': // Bottom-left
                newWidth = this.resizeStartSize.width - deltaX;
                newHeight = newWidth / this.aspectRatio;
                newX = this.resizeStartItemPos.x + deltaX;
                break;
            case 'ne': // Top-right
                newWidth = this.resizeStartSize.width + deltaX;
                newHeight = newWidth / this.aspectRatio;
                newY = this.resizeStartItemPos.y - (newHeight - this.resizeStartSize.height);
                break;
            case 'nw': // Top-left
                newWidth = this.resizeStartSize.width - deltaX;
                newHeight = newWidth / this.aspectRatio;
                newX = this.resizeStartItemPos.x + deltaX;
                newY = this.resizeStartItemPos.y - (newHeight - this.resizeStartSize.height);
                break;
        }

        // Enforce minimum size
        const minSize = 20;
        if (newWidth < minSize) {
            newWidth = minSize;
            newHeight = minSize / this.aspectRatio;
        }

        // Apply new dimensions
        this.draggedElement.style.width = `${newWidth}px`;
        this.draggedElement.style.height = `${newHeight}px`;
        this.draggedElement.style.left = `${newX}px`;
        this.draggedElement.style.top = `${newY}px`;
    }

    /**
     * Handle resize end
     */
    handleResizeEnd = (e) => {
        if (!this.resizing || !this.draggedElement || !this.draggedItem) return;

        this.draggedElement.classList.remove('resizing');

        // Update item data
        const width = Math.round(parseFloat(this.draggedElement.style.width));
        const height = Math.round(parseFloat(this.draggedElement.style.height));
        const x = Math.round(parseFloat(this.draggedElement.style.left));
        const y = Math.round(parseFloat(this.draggedElement.style.top));

        // Always use array format (create if doesn't exist)
        if (!this.draggedItem.position) {
            this.draggedItem.position = [0, 0];
        }
        this.draggedItem.position[0] = x;
        this.draggedItem.position[1] = y;

        if (!this.draggedItem.size) {
            this.draggedItem.size = [0, 0];
        }
        this.draggedItem.size[0] = width;
        this.draggedItem.size[1] = height;

        // Remove old x/y/width/height properties if they exist
        delete this.draggedItem.x;
        delete this.draggedItem.y;
        delete this.draggedItem.width;
        delete this.draggedItem.height;

        // Scale hit area proportionally
        if (this.draggedItem.hitArea) {
            const scaleX = width / this.resizeStartSize.width;
            const scaleY = height / this.resizeStartSize.height;

            const currentHitWidth = this.draggedItem.hitArea[0] || width;
            const currentHitHeight = this.draggedItem.hitArea[1] || height;

            this.draggedItem.hitArea = [
                Math.round(currentHitWidth * scaleX),
                Math.round(currentHitHeight * scaleY)
            ];
        }

        console.log(`✓ Resized ${this.draggedItem.name} to ${width}x${height} at (${x}, ${y})`);

        // Update properties panel if visible
        this.updatePropertiesPanel();

        // Trigger auto-save
        this.editor.saveCurrentWork();

        // Clean up
        document.removeEventListener('mousemove', this.handleResizeMove);
        document.removeEventListener('mouseup', this.handleResizeEnd);

        this.resizing = false;
        this.resizeHandle = null;
        this.draggedItem = null;
        this.draggedElement = null;
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

        // Always use position array format (create if doesn't exist)
        if (!this.draggedItem.position) {
            this.draggedItem.position = [0, 0];
        }
        this.draggedItem.position[0] = x;
        this.draggedItem.position[1] = y;

        // Remove old x/y properties if they exist
        delete this.draggedItem.x;
        delete this.draggedItem.y;

        console.log(`📍 Updated ${this.draggedItem.name} position:`, { x, y });

        // Update properties panel if visible
        this.updatePropertiesPanel();

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
     * Update properties panel with current item values
     */
    updatePropertiesPanel() {
        if (this.selectedItem && this.editor.propertiesPanel) {
            // Refresh the properties panel with updated values
            this.editor.propertiesPanel.showItemProperties(this.selectedItem);
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
     * Update canvas and items layer transforms together
     * This ensures they're always perfectly aligned
     */
    updateCanvasTransform() {
        const wrapper = document.querySelector('.composer-canvas-wrapper');
        if (!wrapper) return;

        const wrapperRect = wrapper.getBoundingClientRect();
        const canvasWidth = this.baseWidth * this.scale;
        const canvasHeight = this.baseHeight * this.scale;

        // Center both canvas and items layer using CSS positioning
        const offsetX = (wrapperRect.width - canvasWidth) / 2;
        const offsetY = (wrapperRect.height - canvasHeight) / 2;

        // Position using left/top and scale using transform
        // This prevents overflow issues
        this.canvas.style.left = `${offsetX}px`;
        this.canvas.style.top = `${offsetY}px`;
        this.canvas.style.transform = `scale(${this.scale})`;
        this.canvas.style.transformOrigin = '0 0';

        this.itemsLayer.style.left = `${offsetX}px`;
        this.itemsLayer.style.top = `${offsetY}px`;
        this.itemsLayer.style.transform = `scale(${this.scale})`;
        this.itemsLayer.style.transformOrigin = '0 0';
        this.itemsLayer.style.width = `${this.baseWidth}px`;
        this.itemsLayer.style.height = `${this.baseHeight}px`;
    }

    /**
     * Update items layer transform (calls updateCanvasTransform for consistency)
     */
    updateItemsLayerTransform() {
        // Both transforms are now updated together in updateCanvasTransform
        // This method is kept for backwards compatibility
        this.updateCanvasTransform();
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
     * Toggle hit area visualization
     */
    toggleHitAreas() {
        this.hitAreaVisible = !this.hitAreaVisible;

        // Update all item elements to show/hide hit areas
        const items = this.itemsLayer.querySelectorAll('.composer-item');
        items.forEach(itemEl => {
            // Toggle rectangle hit areas
            const hitAreaOverlay = itemEl.querySelector('.composer-hit-area');
            if (hitAreaOverlay) {
                hitAreaOverlay.style.display = this.hitAreaVisible ? 'block' : 'none';
            }

            // Toggle polygon hit areas
            const polygonOverlay = itemEl.querySelector('.composer-polygon-hit-area');
            if (polygonOverlay) {
                polygonOverlay.style.display = this.hitAreaVisible ? 'block' : 'none';
            }

            // Hide/show resize handles when in hit area editing mode
            const resizeHandles = itemEl.querySelectorAll('.composer-resize-handle');
            resizeHandles.forEach(handle => {
                handle.style.display = this.hitAreaVisible ? 'none' : 'block';
            });

            // Add visual indicator that item is locked
            if (this.hitAreaVisible) {
                itemEl.style.cursor = 'default';
            } else {
                itemEl.style.cursor = 'move';
            }
        });

        const btn = document.getElementById('composer-hitarea-toggle');
        if (btn) {
            btn.classList.toggle('active', this.hitAreaVisible);
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

    /**
     * Create polygon hit area visualization with editable nodes
     */
    createPolygonVisualization(itemEl, item) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('composer-polygon-hit-area');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.overflow = 'visible';
        svg.style.pointerEvents = 'none';
        svg.style.display = this.hitAreaVisible ? 'block' : 'none';

        // Set viewBox to match item dimensions so polygon coordinates are relative to item
        const width = item.size ? item.size[0] : (item.width || 100);
        const height = item.size ? item.size[1] : (item.height || 100);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('preserveAspectRatio', 'none');

        // Create polygon element
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pointsStr = item.hitPolygon.map(([x, y]) => `${x},${y}`).join(' ');
        polygon.setAttribute('points', pointsStr);
        polygon.style.fill = 'rgba(255, 0, 0, 0.1)';
        polygon.style.stroke = 'rgba(255, 0, 0, 0.6)';
        polygon.style.strokeWidth = '2';
        polygon.style.strokeDasharray = '5,5';
        // Scale stroke width to be visible at any size
        polygon.style.vectorEffect = 'non-scaling-stroke';
        svg.appendChild(polygon);

        // Create draggable nodes for each point
        item.hitPolygon.forEach(([x, y], index) => {
            const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            node.setAttribute('cx', x);
            node.setAttribute('cy', y);
            node.setAttribute('r', '6');
            node.style.fill = '#ff0000';
            node.style.stroke = '#ffffff';
            node.style.strokeWidth = '2';
            node.style.cursor = 'move';
            node.style.pointerEvents = 'auto';
            node.style.vectorEffect = 'non-scaling-stroke';
            node.dataset.nodeIndex = index;

            // Add drag handlers for the node
            node.addEventListener('mousedown', (e) => this.startPolygonNodeDrag(e, item, index, polygon));

            svg.appendChild(node);
        });

        itemEl.appendChild(svg);
    }

    /**
     * Start dragging a polygon node
     */
    startPolygonNodeDrag(e, item, nodeIndex, polygon) {
        e.preventDefault();
        e.stopPropagation();

        const svg = polygon.parentElement;
        const itemEl = svg.parentElement;

        const handleMouseMove = (e) => {
            const wrapper = document.querySelector('.composer-canvas-wrapper');
            const wrapperRect = wrapper.getBoundingClientRect();
            const itemRect = itemEl.getBoundingClientRect();

            // Calculate mouse position relative to item
            const x = (e.clientX - itemRect.left) / this.scale;
            const y = (e.clientY - itemRect.top) / this.scale;

            // Update the point in the data
            item.hitPolygon[nodeIndex] = [Math.round(x), Math.round(y)];

            // Update polygon points
            const pointsStr = item.hitPolygon.map(([px, py]) => `${px},${py}`).join(' ');
            polygon.setAttribute('points', pointsStr);

            // Update node position
            const nodes = svg.querySelectorAll('circle');
            nodes[nodeIndex].setAttribute('cx', Math.round(x));
            nodes[nodeIndex].setAttribute('cy', Math.round(y));

            // Update properties panel if visible
            if (this.editor.propertiesPanel && this.selectedItem === item) {
                this.editor.propertiesPanel.updatePolygonDisplay(item.hitPolygon);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            // Trigger auto-save
            this.editor.saveCurrentWork();
            console.log(`📍 Updated polygon node ${nodeIndex} for ${item.name}`);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    /**
     * Refresh polygon visualization for an item
     */
    refreshPolygonVisualization(item) {
        const itemEl = this.itemsLayer.querySelector(`[data-item-name="${item.name}"]`);
        if (!itemEl) return;

        // Remove old polygon visualization
        const oldSvg = itemEl.querySelector('.composer-polygon-hit-area');
        if (oldSvg) {
            oldSvg.remove();
        }

        // Normalize hitPolygon if it's an object (from IndexedDB)
        if (item.hitPolygon && typeof item.hitPolygon === 'object' && !Array.isArray(item.hitPolygon)) {
            item.hitPolygon = Object.values(item.hitPolygon);
        }

        // Create new one if polygon exists
        if (item.hitPolygon && Array.isArray(item.hitPolygon) && item.hitPolygon.length > 0) {
            this.createPolygonVisualization(itemEl, item);
        }
    }
}

