/**
 * Layers Panel - Manages scene layers (items) with drag-and-drop reordering
 */

export class LayersPanel {
    constructor(editor) {
        this.editor = editor;
        this.currentScene = null;
        this.draggedItem = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add item button
        document.getElementById('add-item-to-scene-btn').addEventListener('click', () => {
            this.showAddItemDialog();
        });
    }

    /**
     * Show the layers panel for a scene
     */
    show(scene) {
        this.currentScene = scene;
        this.render();
    }

    /**
     * Hide the layers panel
     */
    hide() {
        this.currentScene = null;
        const container = document.getElementById('layers-list');
        container.innerHTML = '<p class="empty-message">No items in this scene</p>';
    }

    /**
     * Render the layers list
     */
    render() {
        if (!this.currentScene) return;

        const container = document.getElementById('layers-list');
        container.innerHTML = '';

        const sceneItems = this.currentScene.items || [];
        
        if (sceneItems.length === 0) {
            container.innerHTML = '<p class="empty-message">No items in this scene</p>';
            return;
        }

        // Get item data with z-index for sorting
        const itemsWithData = sceneItems.map(itemName => {
            const itemData = this.editor.getItemByName(itemName);
            return {
                name: itemName,
                data: itemData,
                zIndex: itemData?.zIndex || 1
            };
        });

        // Sort by z-index (highest first, as they appear on top)
        itemsWithData.sort((a, b) => b.zIndex - a.zIndex);

        // Create list items
        itemsWithData.forEach((item, index) => {
            const li = this.createLayerItem(item, index);
            container.appendChild(li);
        });
    }

    /**
     * Create a layer item element
     */
    createLayerItem(item, index) {
        const li = document.createElement('div');
        li.className = 'layer-item';
        li.draggable = true;
        li.dataset.itemName = item.name;
        li.dataset.zIndex = item.zIndex;

        const itemData = item.data;
        const typeClass = `type-${itemData?.type || 'item'}`;

        li.innerHTML = `
            <div class="layer-item-drag-handle">⋮⋮</div>
            <div class="layer-item-content">
                <div class="layer-item-name">${itemData?.longName || item.name}</div>
                <div class="layer-item-meta">
                    <span class="item-type-badge ${typeClass}">${itemData?.type || 'item'}</span>
                    <span class="layer-item-zindex">z: ${item.zIndex}</span>
                </div>
            </div>
        `;

        // Click to select item in composer
        li.addEventListener('click', () => {
            this.editor.sceneComposer.selectItemByName(item.name);
        });

        // Drag and drop events
        li.addEventListener('dragstart', (e) => this.handleDragStart(e, item));
        li.addEventListener('dragover', (e) => this.handleDragOver(e));
        li.addEventListener('drop', (e) => this.handleDrop(e, item));
        li.addEventListener('dragend', () => this.handleDragEnd());

        return li;
    }

    /**
     * Handle drag start
     */
    handleDragStart(e, item) {
        this.draggedItem = item;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    /**
     * Handle drag over
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const target = e.currentTarget;
        if (target.classList.contains('layer-item') && !target.classList.contains('dragging')) {
            target.classList.add('drag-over');
        }
    }

    /**
     * Handle drop
     */
    handleDrop(e, targetItem) {
        e.preventDefault();
        e.stopPropagation();

        const target = e.currentTarget;
        target.classList.remove('drag-over');

        if (!this.draggedItem || this.draggedItem.name === targetItem.name) {
            return;
        }

        // Swap z-index values
        const draggedData = this.editor.getItemByName(this.draggedItem.name);
        const targetData = this.editor.getItemByName(targetItem.name);

        if (draggedData && targetData) {
            const tempZIndex = draggedData.zIndex || 1;
            draggedData.zIndex = targetData.zIndex || 1;
            targetData.zIndex = tempZIndex;

            console.log(`Swapped z-index: ${this.draggedItem.name} (${draggedData.zIndex}) ↔ ${targetItem.name} (${targetData.zIndex})`);

            // Re-render layers and composer
            this.render();
            this.editor.sceneComposer.renderSceneItems();
        }
    }

    /**
     * Handle drag end
     */
    handleDragEnd() {
        document.querySelectorAll('.layer-item').forEach(item => {
            item.classList.remove('dragging', 'drag-over');
        });
        this.draggedItem = null;
    }

    /**
     * Show dialog to add an item to the scene
     */
    showAddItemDialog() {
        if (!this.currentScene) return;

        // Get all items
        const allItems = this.editor.data.sceneItems || [];
        const sceneItems = this.currentScene.items || [];

        // Filter out items already in the scene
        const availableItems = allItems.filter(item => !sceneItems.includes(item.name));

        if (availableItems.length === 0) {
            this.editor.uiManager.setStatus('All items are already in this scene!', 'warning');
            return;
        }

        // Create modal dialog
        this.showAddItemModal(availableItems);
    }

    /**
     * Show modal with available items to add
     */
    showAddItemModal(availableItems) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-dialog add-item-modal">
                <div class="modal-header">
                    <h3>Add Item to Scene</h3>
                    <button class="modal-close-btn" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="add-item-search">
                        <input type="text" id="add-item-search-input" placeholder="Search items..." class="form-control">
                    </div>
                    <div class="add-item-list" id="add-item-list">
                        <!-- Items will be populated here -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Populate items list
        this.renderAddItemList(availableItems, availableItems);

        // Setup event listeners
        const closeBtn = overlay.querySelector('.modal-close-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        // Search functionality
        const searchInput = overlay.querySelector('#add-item-search-input');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = availableItems.filter(item =>
                item.name.toLowerCase().includes(query) ||
                (item.longName && item.longName.toLowerCase().includes(query)) ||
                (item.type && item.type.toLowerCase().includes(query))
            );
            this.renderAddItemList(filtered, availableItems);
        });

        // Focus search input
        searchInput.focus();

        // Store reference for cleanup
        this.addItemModal = overlay;
    }

    /**
     * Render the list of items in the add item modal
     */
    renderAddItemList(items, allAvailableItems) {
        const container = document.getElementById('add-item-list');
        if (!container) return;

        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = '<p class="empty-message">No items found</p>';
            return;
        }

        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'add-item-list-item';

            const typeClass = `type-${item.type || 'item'}`;

            itemEl.innerHTML = `
                <div class="add-item-info">
                    <div class="add-item-name">${item.longName || item.name}</div>
                    <div class="add-item-meta">
                        <span class="item-type-badge ${typeClass}">${item.type || 'item'}</span>
                        <span class="add-item-id">${item.name}</span>
                    </div>
                </div>
                <button class="btn btn-primary btn-sm add-item-btn">Add</button>
            `;

            // Add button click
            const addBtn = itemEl.querySelector('.add-item-btn');
            addBtn.addEventListener('click', () => {
                this.addItemToScene(item);
            });

            // Click on item to add
            itemEl.addEventListener('click', (e) => {
                if (!e.target.classList.contains('add-item-btn')) {
                    this.addItemToScene(item);
                }
            });

            container.appendChild(itemEl);
        });
    }

    /**
     * Add an item to the current scene
     */
    addItemToScene(item) {
        if (!this.currentScene) return;

        // Add item to scene
        if (!this.currentScene.items) {
            this.currentScene.items = [];
        }
        this.currentScene.items.push(item.name);

        console.log(`Added item "${item.name}" to scene "${this.currentScene.sceneName}"`);

        // Close modal
        if (this.addItemModal) {
            document.body.removeChild(this.addItemModal);
            this.addItemModal = null;
        }

        // Re-render layers and composer
        this.render();
        this.editor.sceneComposer.renderSceneItems();
        this.editor.uiManager.setStatus(`Added ${item.longName || item.name} to scene`, 'success');
    }

    /**
     * Remove an item from the scene
     */
    removeItemFromScene(itemName) {
        if (!this.currentScene) return;

        const index = this.currentScene.items.indexOf(itemName);
        if (index > -1) {
            this.currentScene.items.splice(index, 1);
            console.log(`Removed item "${itemName}" from scene "${this.currentScene.sceneName}"`);

            // Clear selection in composer
            this.editor.sceneComposer.deselectItem();

            // Re-render layers and composer
            this.render();
            this.editor.sceneComposer.renderSceneItems();
            this.editor.uiManager.setStatus(`Removed item from scene`, 'success');
        }
    }

    /**
     * Highlight a layer item
     */
    highlightItem(itemName) {
        document.querySelectorAll('.layer-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.itemName === itemName);
        });
    }
}

