/**
 * Properties Panel - Quick property editor for selected items in composer
 */

export class PropertiesPanel {
    constructor(editor) {
        this.editor = editor;
        this.currentItem = null;
        this.hitAreasVisible = false;
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Hit areas toggle button
        const toggleBtn = document.getElementById('toggle-hit-areas-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleHitAreas());
        }
    }

    /**
     * Show properties for a selected item
     */
    showItemProperties(item) {
        this.currentItem = item;
        const container = document.getElementById('properties-form-container');
        if (!container) return;

        // Build the form
        container.innerHTML = '';

        const form = document.createElement('form');
        form.className = 'properties-form';
        form.id = 'item-properties-form';

        // Basic Info Section
        const basicSection = this.createSection('Basic Information');
        basicSection.appendChild(this.createField('name', 'Name', item.name, 'text', true));
        basicSection.appendChild(this.createField('longName', 'Display Name', item.longName || '', 'text'));
        form.appendChild(basicSection);

        // Description Section
        const descSection = this.createSection('Descriptions');
        descSection.appendChild(this.createField('lookAt', 'Look At Description', item.lookAt || '', 'textarea'));
        descSection.appendChild(this.createField('pickUpMessage', 'Pick Up Message', item.pickUpMessage || '', 'textarea'));
        form.appendChild(descSection);

        // Visual Properties Section
        const visualSection = this.createSection('Visual Properties');

        // Z-Index - show actual value or empty string if not set
        const zIndexValue = item.zIndex !== undefined && item.zIndex !== null ? item.zIndex : '';
        visualSection.appendChild(this.createField('zIndex', 'Layer (Z-Index)', zIndexValue, 'number', false, { min: 0, max: 100, placeholder: 'auto' }));
        
        // Size (width and height)
        const sizeRow = document.createElement('div');
        sizeRow.className = 'form-row';
        const size = item.size || [100, 100];
        sizeRow.appendChild(this.createField('width', 'Width', size[0], 'number', false, { min: 1 }));
        sizeRow.appendChild(this.createField('height', 'Height', size[1], 'number', false, { min: 1 }));
        visualSection.appendChild(sizeRow);

        // Hit area (hitW and hitH)
        const hitRow = document.createElement('div');
        hitRow.className = 'form-row';
        const hitW = item.hitW !== undefined ? item.hitW : size[0];
        const hitH = item.hitH !== undefined ? item.hitH : size[1];
        hitRow.appendChild(this.createField('hitW', 'Hit Width', hitW, 'number', false, { min: 1 }));
        hitRow.appendChild(this.createField('hitH', 'Hit Height', hitH, 'number', false, { min: 1 }));
        visualSection.appendChild(hitRow);

        form.appendChild(visualSection);

        // Add change listeners to all inputs
        form.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', () => this.handlePropertyChange());
        });

        container.appendChild(form);
    }

    /**
     * Create a form section
     */
    createSection(title) {
        const section = document.createElement('div');
        section.className = 'form-section';

        const header = document.createElement('h4');
        header.className = 'section-header';
        header.textContent = title;
        section.appendChild(header);

        return section;
    }

    /**
     * Create a form field
     */
    createField(name, label, value, type = 'text', readonly = false, attrs = {}) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.htmlFor = `prop-${name}`;
        formGroup.appendChild(labelEl);

        let input;
        if (type === 'textarea') {
            input = document.createElement('textarea');
            input.value = value || '';
            input.rows = 3;
        } else {
            input = document.createElement('input');
            input.type = type;
            input.value = value !== null && value !== undefined ? value : '';
            
            // Apply additional attributes
            Object.keys(attrs).forEach(attr => {
                input[attr] = attrs[attr];
            });
        }

        input.name = name;
        input.id = `prop-${name}`;
        if (readonly) {
            input.readOnly = true;
            input.className = 'readonly';
        }

        formGroup.appendChild(input);
        return formGroup;
    }

    /**
     * Handle property changes
     */
    handlePropertyChange() {
        if (!this.currentItem) return;

        const form = document.getElementById('item-properties-form');
        if (!form) return;

        // Get form data
        const formData = new FormData(form);
        const updates = {};

        console.log('📝 Properties Panel - Form Data Entries:');
        for (const [key, value] of formData.entries()) {
            console.log(`  ${key}: ${value}`);
        }

        // Collect all values
        for (const [key, value] of formData.entries()) {
            if (key === 'name') {
                updates[key] = value;
            } else if (key === 'width' || key === 'height') {
                // Handle size array
                if (!updates.size) {
                    const currentSize = this.currentItem.size || [100, 100];
                    updates.size = [...currentSize];
                }
                if (key === 'width') updates.size[0] = Number(value);
                if (key === 'height') updates.size[1] = Number(value);
            } else if (key === 'hitW' || key === 'hitH') {
                // Handle hit dimensions
                if (key === 'hitW') updates.hitW = Number(value);
                if (key === 'hitH') updates.hitH = Number(value);
            } else if (key === 'zIndex') {
                updates[key] = Number(value);
                console.log(`🎨 Z-Index in updates object:`, updates[key]);
            } else {
                updates[key] = value;
            }
        }

        console.log('📝 Updates object:', updates);

        // Update the item in the data
        const itemIndex = this.editor.data.sceneItems.findIndex(i => i.name === this.currentItem.name);
        if (itemIndex !== -1) {
            console.log(`📝 Before update - item data:`, JSON.parse(JSON.stringify(this.editor.data.sceneItems[itemIndex])));

            Object.assign(this.editor.data.sceneItems[itemIndex], updates);

            console.log(`📝 After update - item data:`, JSON.parse(JSON.stringify(this.editor.data.sceneItems[itemIndex])));

            // Debug log for z-index changes
            if (updates.zIndex !== undefined) {
                console.log(`🎨 Z-Index updated for ${this.currentItem.name}:`, updates.zIndex);
                console.log(`🎨 Item data after update:`, this.editor.data.sceneItems[itemIndex]);
            }

            // Update currentItem reference
            this.currentItem = this.editor.data.sceneItems[itemIndex];

            // Trigger auto-save
            this.editor.saveCurrentWork();

            // Update the composer if it's active
            if (this.editor.sceneComposer && this.editor.sceneComposer.currentScene) {
                this.editor.sceneComposer.renderSceneItems();

                // Refresh hit areas if they're visible
                if (this.hitAreasVisible) {
                    this.showHitAreas();
                }
            }
        }
    }

    /**
     * Clear the properties panel
     */
    clear() {
        this.currentItem = null;
        const container = document.getElementById('properties-form-container');
        if (container) {
            container.innerHTML = `
                <div class="properties-empty-state">
                    <p>Select an item in the composer to edit its properties</p>
                </div>
            `;
        }
    }

    /**
     * Toggle hit area visualization
     */
    toggleHitAreas() {
        this.hitAreasVisible = !this.hitAreasVisible;
        const btn = document.getElementById('toggle-hit-areas-btn');
        
        if (this.hitAreasVisible) {
            btn.textContent = '👁️ Hide Hit Areas';
            btn.classList.add('active');
            this.showHitAreas();
        } else {
            btn.textContent = '👁️ Show Hit Areas';
            btn.classList.remove('active');
            this.hideHitAreas();
        }
    }

    /**
     * Show hit areas on all items in composer
     */
    showHitAreas() {
        const itemsLayer = document.getElementById('composer-items-layer');
        if (!itemsLayer) return;

        // Add hit area overlays to all items
        itemsLayer.querySelectorAll('.composer-item').forEach(itemEl => {
            const itemName = itemEl.dataset.itemName;
            const item = this.editor.data.sceneItems.find(i => i.name === itemName);
            if (!item) return;

            // Remove existing overlay if any
            const existingOverlay = itemEl.querySelector('.hit-area-overlay');
            if (existingOverlay) existingOverlay.remove();

            // Create hit area overlay
            const overlay = document.createElement('div');
            overlay.className = 'hit-area-overlay';

            const size = item.size || [100, 100];
            const hitW = item.hitW !== undefined ? item.hitW : size[0];
            const hitH = item.hitH !== undefined ? item.hitH : size[1];

            overlay.style.width = `${hitW}px`;
            overlay.style.height = `${hitH}px`;
            overlay.style.position = 'absolute';
            overlay.style.top = '50%';
            overlay.style.left = '50%';
            overlay.style.transform = 'translate(-50%, -50%)';
            overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
            overlay.style.border = '2px dashed red';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '1000';

            itemEl.appendChild(overlay);
        });
    }

    /**
     * Hide hit areas
     */
    hideHitAreas() {
        const itemsLayer = document.getElementById('composer-items-layer');
        if (!itemsLayer) return;

        itemsLayer.querySelectorAll('.hit-area-overlay').forEach(overlay => {
            overlay.remove();
        });
    }
}

