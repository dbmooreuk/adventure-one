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
        // No event listeners needed here anymore
        // Hit area toggle is handled by the composer
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

        // Position (x and y)
        const positionRow = document.createElement('div');
        positionRow.className = 'form-row';
        const position = item.position || [0, 0];
        positionRow.appendChild(this.createField('positionX', 'X Position', position[0], 'number', false, { step: 1 }));
        positionRow.appendChild(this.createField('positionY', 'Y Position', position[1], 'number', false, { step: 1 }));
        visualSection.appendChild(positionRow);

        // Size (width and height)
        const sizeRow = document.createElement('div');
        sizeRow.className = 'form-row';
        const size = item.size || [100, 100];
        sizeRow.appendChild(this.createField('width', 'Width', size[0], 'number', false, { min: 1 }));
        sizeRow.appendChild(this.createField('height', 'Height', size[1], 'number', false, { min: 1 }));
        visualSection.appendChild(sizeRow);

        // Hit Area Section
        const hitAreaSection = this.createHitAreaSection(item);
        form.appendChild(visualSection);
        form.appendChild(hitAreaSection);

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
     * Create hit area section with polygon or rectangle controls
     */
    createHitAreaSection(item) {
        const section = this.createSection('Hit Area');

        // Hit area type selector
        const typeRow = document.createElement('div');
        typeRow.className = 'form-group';

        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Hit Area Type';
        typeRow.appendChild(typeLabel);

        const typeSelect = document.createElement('select');
        typeSelect.name = 'hitAreaType';
        typeSelect.innerHTML = `
            <option value="none">None</option>
            <option value="rectangle">Rectangle</option>
            <option value="polygon">Polygon</option>
        `;

        // Determine current type
        if (item.hitPolygon && item.hitPolygon.length > 0) {
            typeSelect.value = 'polygon';
        } else if (item.hitW || item.hitH) {
            typeSelect.value = 'rectangle';
        } else {
            typeSelect.value = 'none';
        }

        typeSelect.addEventListener('change', (e) => this.handleHitAreaTypeChange(e.target.value, item));
        typeRow.appendChild(typeSelect);
        section.appendChild(typeRow);

        // Rectangle controls
        const rectControls = document.createElement('div');
        rectControls.className = 'hit-area-rect-controls';
        rectControls.style.display = typeSelect.value === 'rectangle' ? 'block' : 'none';

        const hitRow = document.createElement('div');
        hitRow.className = 'form-row';
        const size = item.size || [100, 100];
        const hitW = item.hitW !== undefined ? item.hitW : '';
        const hitH = item.hitH !== undefined ? item.hitH : '';
        hitRow.appendChild(this.createField('hitW', 'Hit Width', hitW, 'number', false, { min: 1, placeholder: size[0] }));
        hitRow.appendChild(this.createField('hitH', 'Hit Height', hitH, 'number', false, { min: 1, placeholder: size[1] }));
        rectControls.appendChild(hitRow);
        section.appendChild(rectControls);

        // Polygon controls
        const polyControls = document.createElement('div');
        polyControls.className = 'hit-area-polygon-controls';
        polyControls.style.display = typeSelect.value === 'polygon' ? 'block' : 'none';

        const polyInfo = document.createElement('p');
        polyInfo.style.fontSize = '0.85rem';
        polyInfo.style.color = '#888';
        polyInfo.style.margin = '0.5rem 0';
        polyInfo.textContent = 'Drag nodes in the composer to edit polygon shape';
        polyControls.appendChild(polyInfo);

        // Polygon points list
        const pointsList = document.createElement('div');
        pointsList.className = 'polygon-points-list';
        pointsList.id = 'polygon-points-list';
        this.updatePolygonPointsList(pointsList, item.hitPolygon || []);
        polyControls.appendChild(pointsList);

        // Add/Remove node buttons
        const btnRow = document.createElement('div');
        btnRow.className = 'form-row';
        btnRow.style.gap = '0.5rem';

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn btn-small';
        addBtn.textContent = '+ Add Node';
        addBtn.addEventListener('click', () => this.addPolygonNode(item));
        btnRow.appendChild(addBtn);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-small';
        removeBtn.textContent = '− Remove Last';
        removeBtn.addEventListener('click', () => this.removePolygonNode(item));
        btnRow.appendChild(removeBtn);

        polyControls.appendChild(btnRow);
        section.appendChild(polyControls);

        return section;
    }

    /**
     * Handle hit area type change
     */
    handleHitAreaTypeChange(type, item) {
        const rectControls = document.querySelector('.hit-area-rect-controls');
        const polyControls = document.querySelector('.hit-area-polygon-controls');

        if (type === 'rectangle') {
            rectControls.style.display = 'block';
            polyControls.style.display = 'none';

            // Remove polygon data
            delete item.hitPolygon;

            // Initialize rectangle if not set
            if (!item.hitW && !item.hitH) {
                const size = item.size || [100, 100];
                item.hitW = size[0];
                item.hitH = size[1];
            }
        } else if (type === 'polygon') {
            rectControls.style.display = 'none';
            polyControls.style.display = 'block';

            // Remove rectangle data
            delete item.hitW;
            delete item.hitH;

            // Initialize polygon if not set (create rectangle shape)
            if (!item.hitPolygon || item.hitPolygon.length === 0) {
                const size = item.size || [100, 100];
                item.hitPolygon = [
                    [0, 0],
                    [size[0], 0],
                    [size[0], size[1]],
                    [0, size[1]]
                ];
                this.updatePolygonPointsList(document.getElementById('polygon-points-list'), item.hitPolygon);
            }
        } else {
            // None
            rectControls.style.display = 'none';
            polyControls.style.display = 'none';
            delete item.hitW;
            delete item.hitH;
            delete item.hitPolygon;
        }

        // Refresh composer visualization
        if (this.editor.sceneComposer) {
            this.editor.sceneComposer.refreshPolygonVisualization(item);
        }

        // Trigger save
        this.editor.saveCurrentWork();
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
            } else if (key === 'positionX' || key === 'positionY') {
                // Handle position array
                if (!updates.position) {
                    const currentPosition = this.currentItem.position || [0, 0];
                    updates.position = [...currentPosition];
                }
                if (key === 'positionX') updates.position[0] = Number(value);
                if (key === 'positionY') updates.position[1] = Number(value);
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
     * Update polygon points list display
     */
    updatePolygonPointsList(container, points) {
        container.innerHTML = '';

        if (!points || points.length === 0) {
            container.innerHTML = '<p style="color: #888; font-size: 0.85rem;">No polygon points</p>';
            return;
        }

        points.forEach(([x, y], index) => {
            const pointRow = document.createElement('div');
            pointRow.style.display = 'flex';
            pointRow.style.gap = '0.5rem';
            pointRow.style.alignItems = 'center';
            pointRow.style.marginBottom = '0.25rem';
            pointRow.style.fontSize = '0.85rem';

            const label = document.createElement('span');
            label.textContent = `${index + 1}:`;
            label.style.width = '2rem';
            label.style.color = '#888';
            pointRow.appendChild(label);

            const coords = document.createElement('span');
            coords.textContent = `(${x}, ${y})`;
            coords.style.fontFamily = 'monospace';
            pointRow.appendChild(coords);

            container.appendChild(pointRow);
        });
    }

    /**
     * Add a new polygon node
     */
    addPolygonNode(item) {
        if (!item.hitPolygon) {
            item.hitPolygon = [];
        }

        // Add a new point at the center of the item
        const size = item.size || [100, 100];
        const newPoint = [Math.round(size[0] / 2), Math.round(size[1] / 2)];
        item.hitPolygon.push(newPoint);

        // Update display
        const pointsList = document.getElementById('polygon-points-list');
        if (pointsList) {
            this.updatePolygonPointsList(pointsList, item.hitPolygon);
        }

        // Refresh composer visualization
        if (this.editor.sceneComposer) {
            this.editor.sceneComposer.refreshPolygonVisualization(item);
        }

        // Trigger save
        this.editor.saveCurrentWork();

        console.log(`✓ Added polygon node to ${item.name}`);
    }

    /**
     * Remove the last polygon node
     */
    removePolygonNode(item) {
        if (!item.hitPolygon || item.hitPolygon.length === 0) return;

        // Don't allow removing if less than 3 points (minimum for polygon)
        if (item.hitPolygon.length <= 3) {
            alert('A polygon must have at least 3 points');
            return;
        }

        item.hitPolygon.pop();

        // Update display
        const pointsList = document.getElementById('polygon-points-list');
        if (pointsList) {
            this.updatePolygonPointsList(pointsList, item.hitPolygon);
        }

        // Refresh composer visualization
        if (this.editor.sceneComposer) {
            this.editor.sceneComposer.refreshPolygonVisualization(item);
        }

        // Trigger save
        this.editor.saveCurrentWork();

        console.log(`✓ Removed polygon node from ${item.name}`);
    }

    /**
     * Update polygon display (called from composer when dragging nodes)
     */
    updatePolygonDisplay(points) {
        const pointsList = document.getElementById('polygon-points-list');
        if (pointsList) {
            this.updatePolygonPointsList(pointsList, points);
        }
    }
}

