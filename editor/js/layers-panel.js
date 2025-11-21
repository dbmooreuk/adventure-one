/**
 * Layers Panel - Manages scene layers (items) with drag-and-drop reordering
 */

export class LayersPanel {
    constructor(editor) {
        this.editor = editor;
        this.currentScene = null;
        this.draggedItem = null;
        this.draggedElement = null;
        this.touchDragging = false;
        this.currentDropTarget = null;

        // Locked items state (stored in editorState, not in game schema)
        this.lockedItems = new Set();

        // Bind touch handlers for document-level listeners
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

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
        this.loadLockedItemsState();
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
        li.dataset.itemName = item.name;
        li.dataset.zIndex = item.zIndex;

        const itemData = item.data;
        const typeClass = `type-${itemData?.type || 'item'}`;
        const isLocked = this.lockedItems.has(item.name);

        // Add locked class if item is locked
        if (isLocked) {
            li.classList.add('locked');
        }

        li.innerHTML = `
            <div class="layer-item-drag-handle" draggable="true">⋮⋮</div>
            <div class="layer-item-content">
                <div class="layer-item-name">${itemData?.longName || item.name}</div>
                <div class="layer-item-meta">
                    <span class="item-type-badge ${typeClass}">${itemData?.type || 'item'}</span>
                    <span class="layer-item-zindex">z: ${item.zIndex}</span>
                </div>
            </div>
            <button class="layer-item-lock-btn" title="${isLocked ? 'Unlock item' : 'Lock item'}">
                ${isLocked ? '🔒' : '🔓'}
            </button>
        `;

        // Get the drag handle
        const dragHandle = li.querySelector('.layer-item-drag-handle');
        const lockBtn = li.querySelector('.layer-item-lock-btn');

        // Click to select item in composer (but not on drag handle or lock button)
        li.addEventListener('click', (e) => {
            if (!e.target.closest('.layer-item-drag-handle') && !e.target.closest('.layer-item-lock-btn')) {
                this.editor.sceneComposer.selectItemByName(item.name);
            }
        });

        // Lock button click
        lockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleItemLock(item.name);
        });

        // Drag and drop events on the drag handle only (mouse / desktop)
        dragHandle.addEventListener('dragstart', (e) => this.handleDragStart(e, item, li));
        li.addEventListener('dragover', (e) => this.handleDragOver(e));
        li.addEventListener('drop', (e) => this.handleDrop(e, item));
        li.addEventListener('dragend', () => this.handleDragEnd());

        // Prevent dragging from other parts of the layer item
        li.addEventListener('dragstart', (e) => {
            if (!e.target.closest('.layer-item-drag-handle')) {
                e.preventDefault();
            }
        });

        // Touch-based drag-and-drop (for tablets) - only on drag handle
        dragHandle.addEventListener('touchstart', (e) => this.handleTouchStart(e, item, li), { passive: false });

        return li;
    }

    /**
     * Handle drag start
     */
    handleDragStart(e, item, li) {
        this.draggedItem = item;
        this.draggedElement = li;
        li.classList.add('dragging');
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
     * Handle drop (mouse / desktop)
     */
    handleDrop(e, targetItem) {
        e.preventDefault();
        e.stopPropagation();

        const target = e.currentTarget;
        target.classList.remove('drag-over');

        this.reorderItems(this.draggedItem, targetItem);
    }

    /**
     * Core reordering logic shared by mouse and touch DnD
     */
    reorderItems(draggedItem, targetItem) {
        if (!draggedItem || !targetItem || draggedItem.name === targetItem.name) {
            return;
        }

        // Reorder z-index values (shift items between dragged and target)
        const draggedData = this.editor.getItemByName(draggedItem.name);
        const targetData = this.editor.getItemByName(targetItem.name);

        if (draggedData && targetData) {
            const draggedZIndex = draggedData.zIndex || 1;
            const targetZIndex = targetData.zIndex || 1;

            // Get all items in the current scene
            const sceneItems = this.currentScene.items.map(itemName => {
                return this.editor.getItemByName(itemName);
            }).filter(item => item); // Filter out any null/undefined

            console.log(`Reordering: ${draggedItem.name} (z:${draggedZIndex}) → position of ${targetItem.name} (z:${targetZIndex})`);

            // Determine direction of shift
            if (draggedZIndex < targetZIndex) {
                // Moving up in z-index (dragging from lower to higher)
                // Shift items down between dragged and target
                sceneItems.forEach(item => {
                    const itemZ = item.zIndex || 1;
                    if (itemZ > draggedZIndex && itemZ <= targetZIndex) {
                        item.zIndex = itemZ - 1;
                        console.log(`  Shifted ${item.name}: ${itemZ} → ${item.zIndex}`);
                    }
                });
                draggedData.zIndex = targetZIndex;
            } else {
                // Moving down in z-index (dragging from higher to lower)
                // Shift items up between target and dragged
                sceneItems.forEach(item => {
                    const itemZ = item.zIndex || 1;
                    if (itemZ >= targetZIndex && itemZ < draggedZIndex) {
                        item.zIndex = itemZ + 1;
                        console.log(`  Shifted ${item.name}: ${itemZ} → ${item.zIndex}`);
                    }
                });
                draggedData.zIndex = targetZIndex;
            }

            console.log(`  Final: ${draggedData.name} z-index = ${draggedData.zIndex}`);

            // Re-render layers and composer
            this.render();
            this.editor.sceneComposer.renderSceneItems();

            // Update properties panel if the currently selected item's z-index changed
            if (this.editor.propertiesPanel && this.editor.propertiesPanel.currentItem) {
                const currentItemName = this.editor.propertiesPanel.currentItem.name;
                const updatedItem = this.editor.getItemByName(currentItemName);
                if (updatedItem) {
                    this.editor.propertiesPanel.showItemProperties(updatedItem);
                }
            }
        }
    }

    /**
     * Handle drag end (mouse / desktop)
     */
    handleDragEnd() {
        document.querySelectorAll('.layer-item').forEach(item => {
            item.classList.remove('dragging', 'drag-over');
        });
        this.draggedItem = null;
        this.draggedElement = null;
    }

    /**
     * Toggle lock state for an item
     */
    toggleItemLock(itemName) {
        if (this.lockedItems.has(itemName)) {
            this.lockedItems.delete(itemName);
        } else {
            this.lockedItems.add(itemName);
        }

        // Save locked state
        this.saveLockedItemsState();

        // Re-render layers panel
        this.render();

        // Update composer to reflect lock state
        if (this.editor.sceneComposer) {
            this.editor.sceneComposer.updateItemLockState(itemName, this.lockedItems.has(itemName));
        }
    }

    /**
     * Check if an item is locked
     */
    isItemLocked(itemName) {
        return this.lockedItems.has(itemName);
    }

    /**
     * Load locked items state from editor state
     */
    loadLockedItemsState() {
        this.lockedItems.clear();

        if (!this.editor.data.editorState) {
            this.editor.data.editorState = {};
        }

        if (!this.editor.data.editorState.lockedItems) {
            this.editor.data.editorState.lockedItems = {};
        }

        // Load locked items for current scene
        if (this.currentScene) {
            const sceneName = this.currentScene.sceneName;
            const lockedForScene = this.editor.data.editorState.lockedItems[sceneName] || [];
            lockedForScene.forEach(itemName => {
                this.lockedItems.add(itemName);
            });
        }
    }

    /**
     * Save locked items state to editor state
     */
    saveLockedItemsState() {
        if (!this.editor.data.editorState) {
            this.editor.data.editorState = {};
        }

        if (!this.editor.data.editorState.lockedItems) {
            this.editor.data.editorState.lockedItems = {};
        }

        // Save locked items for current scene
        if (this.currentScene) {
            const sceneName = this.currentScene.sceneName;
            this.editor.data.editorState.lockedItems[sceneName] = Array.from(this.lockedItems);
        }

        // Trigger auto-save
        this.editor.saveCurrentWork();
    }

    /**
     * Handle touch start (touch / tablet)
     */
    handleTouchStart(e, item, li) {
        e.preventDefault(); // Prevent scrolling

        this.draggedItem = item;
        this.draggedElement = li;
        this.touchDragging = true;

        li.classList.add('dragging');

        // Attach document-level touch listeners
        document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd);
        document.addEventListener('touchcancel', this.handleTouchEnd);
    }

    /**
     * Handle touch move (touch / tablet)
     */
    handleTouchMove(e) {
        if (!this.touchDragging) return;

        e.preventDefault(); // Prevent scrolling

        const touch = e.touches[0];
        const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);

        // Find the closest layer-item parent
        let targetLayerItem = elementUnderTouch;
        while (targetLayerItem && !targetLayerItem.classList.contains('layer-item')) {
            targetLayerItem = targetLayerItem.parentElement;
        }

        // Remove drag-over from all items
        document.querySelectorAll('.layer-item').forEach(item => {
            if (item !== this.draggedElement) {
                item.classList.remove('drag-over');
            }
        });

        // Add drag-over to the target item
        if (targetLayerItem && targetLayerItem !== this.draggedElement) {
            targetLayerItem.classList.add('drag-over');
            this.currentDropTarget = targetLayerItem;
        } else {
            this.currentDropTarget = null;
        }
    }

    /**
     * Handle touch end (touch / tablet)
     */
    handleTouchEnd(e) {
        if (!this.touchDragging) return;

        // Remove document-level touch listeners
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('touchcancel', this.handleTouchEnd);

        // If we have a valid drop target, perform the reorder
        if (this.currentDropTarget) {
            const targetItemName = this.currentDropTarget.dataset.itemName;
            const targetItem = {
                name: targetItemName,
                zIndex: parseInt(this.currentDropTarget.dataset.zIndex, 10)
            };

            this.reorderItems(this.draggedItem, targetItem);
        }

        // Clean up
        document.querySelectorAll('.layer-item').forEach(item => {
            item.classList.remove('dragging', 'drag-over');
        });

        this.draggedItem = null;
        this.draggedElement = null;
        this.touchDragging = false;
        this.currentDropTarget = null;
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

