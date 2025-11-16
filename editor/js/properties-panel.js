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
        // Remove from scene button
        const removeBtn = document.getElementById('remove-item-from-scene-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                if (this.currentItem && confirm(`Remove "${this.currentItem.longName || this.currentItem.name}" from this scene?`)) {
                    this.editor.layersPanel.removeItemFromScene(this.currentItem.name);
                }
            });
        }
    }

    /**
     * Show properties for a selected item
     */
    showItemProperties(item) {
        this.currentItem = item;
        const container = document.getElementById('properties-form-container');
        if (!container) return;

        // Show remove button
        const removeBtn = document.getElementById('remove-item-from-scene-btn');
        if (removeBtn) {
            removeBtn.style.display = '';
        }

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

        // Animation Section
        const animationSection = this.createAnimationSection(item);
        form.appendChild(animationSection);

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
     * Create animation section
     */
    createAnimationSection(item) {
        const section = this.createSection('Animation');

        const animation = item.animation || {};

        // Animation type selector
        const typeGroup = document.createElement('div');
        typeGroup.className = 'form-group';

        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Animation Type';
        typeGroup.appendChild(typeLabel);

        const typeSelect = document.createElement('select');
        typeSelect.name = 'animation-type';
        typeSelect.className = 'animation-type-select';

        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = '-- No Animation --';
        typeSelect.appendChild(noneOption);

        ['bob', 'pulse', 'spin', 'fade', 'sprite'].forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            if (animation && animation.type === type) {
                option.selected = true;
            }
            typeSelect.appendChild(option);
        });

        typeGroup.appendChild(typeSelect);
        section.appendChild(typeGroup);

        // Container for conditional fields
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'animation-fields-container';
        section.appendChild(fieldsContainer);

        // Update button (only shown when animations are enabled in composer)
        const updateBtnContainer = document.createElement('div');
        updateBtnContainer.className = 'form-group';
        updateBtnContainer.style.display = 'none';
        updateBtnContainer.id = 'animation-update-btn-container';

        const updateBtn = document.createElement('button');
        updateBtn.type = 'button';
        updateBtn.className = 'btn btn-primary';
        updateBtn.textContent = '↻ Update Animation';
        updateBtn.addEventListener('click', () => this.updateAnimation(item));
        updateBtnContainer.appendChild(updateBtn);
        section.appendChild(updateBtnContainer);

        // Update fields when type changes
        const updateFields = () => {
            const type = typeSelect.value;
            fieldsContainer.innerHTML = '';

            if (!type) {
                return;
            }

            // Common fields for bob and pulse
            if (type === 'bob' || type === 'pulse') {
                fieldsContainer.appendChild(this.createNumberInput('animation-amplitude', 'Amplitude', animation?.amplitude || 10, 'Pixels to move (bob) or percentage to scale (pulse)'));
                fieldsContainer.appendChild(this.createNumberInput('animation-speed', 'Speed', animation?.speed || 1, 'Speed multiplier'));
            }

            // Speed only for spin and fade
            if (type === 'spin' || type === 'fade') {
                fieldsContainer.appendChild(this.createNumberInput('animation-speed', 'Speed', animation?.speed || 1, type === 'spin' ? 'Rotations per second' : 'Fade cycle speed'));
            }

            // Sprite animation
            if (type === 'sprite') {
                fieldsContainer.appendChild(this.createSpriteFields(animation));
            }

            // Show update button if animations are enabled in composer
            if (this.editor.sceneComposer && this.editor.sceneComposer.animationsEnabled) {
                updateBtnContainer.style.display = 'block';
            }
        };

        typeSelect.addEventListener('change', updateFields);

        // Initial render
        updateFields();

        return section;
    }

    /**
     * Create number input helper
     */
    createNumberInput(name, label, value, help) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        formGroup.appendChild(labelEl);

        const input = document.createElement('input');
        input.type = 'number';
        input.name = name;
        input.value = value || '';
        input.step = '0.1';
        input.min = '0';
        formGroup.appendChild(input);

        if (help) {
            const helpEl = document.createElement('div');
            helpEl.className = 'form-help';
            helpEl.textContent = help;
            formGroup.appendChild(helpEl);
        }

        return formGroup;
    }

    /**
     * Create sprite animation fields
     */
    createSpriteFields(animation) {
        const container = document.createElement('div');
        container.className = 'sprite-fields-container';

        // Radio buttons for sprite mode
        const modeGroup = document.createElement('div');
        modeGroup.className = 'form-group';

        const modeLabel = document.createElement('label');
        modeLabel.textContent = 'Sprite Mode';
        modeGroup.appendChild(modeLabel);

        const radioContainer = document.createElement('div');
        radioContainer.className = 'radio-group';

        // Multiple Images option
        const multipleOption = document.createElement('label');
        multipleOption.className = 'radio-label';

        const multipleRadio = document.createElement('input');
        multipleRadio.type = 'radio';
        multipleRadio.name = 'sprite-mode';
        multipleRadio.value = 'multiple';
        multipleRadio.id = 'sprite-mode-multiple';
        multipleRadio.checked = animation?.frames && animation.frames.length > 0;

        const multipleText = document.createElement('span');
        multipleText.textContent = 'Multiple Images';

        multipleOption.appendChild(multipleRadio);
        multipleOption.appendChild(multipleText);

        // Sprite Sheet option
        const sheetOption = document.createElement('label');
        sheetOption.className = 'radio-label';

        const sheetRadio = document.createElement('input');
        sheetRadio.type = 'radio';
        sheetRadio.name = 'sprite-mode';
        sheetRadio.value = 'spritesheet';
        sheetRadio.id = 'sprite-mode-sheet';
        sheetRadio.checked = animation?.spriteSheet;

        const sheetText = document.createElement('span');
        sheetText.textContent = 'Sprite Sheet';

        sheetOption.appendChild(sheetRadio);
        sheetOption.appendChild(sheetText);

        radioContainer.appendChild(multipleOption);
        radioContainer.appendChild(sheetOption);
        modeGroup.appendChild(radioContainer);
        container.appendChild(modeGroup);

        // Container for mode-specific fields
        const spriteFieldsContainer = document.createElement('div');
        spriteFieldsContainer.className = 'sprite-mode-fields';
        container.appendChild(spriteFieldsContainer);

        // Update sprite fields based on radio selection
        const updateSpriteFields = () => {
            const mode = document.querySelector('input[name="sprite-mode"]:checked')?.value;
            spriteFieldsContainer.innerHTML = '';

            if (mode === 'multiple') {
                // FPS input
                spriteFieldsContainer.appendChild(this.createNumberInput('animation-fps', 'FPS', animation?.fps || 12, 'Frames per second'));

                // Frames list (simplified - just a textarea for now)
                const framesGroup = document.createElement('div');
                framesGroup.className = 'form-group';
                const framesLabel = document.createElement('label');
                framesLabel.textContent = 'Frame Images (one per line)';
                framesGroup.appendChild(framesLabel);
                const framesTextarea = document.createElement('textarea');
                framesTextarea.name = 'animation-frames';
                framesTextarea.rows = 4;
                framesTextarea.placeholder = 'butterfly-1.png\nbutterfly-2.png\nbutterfly-3.png';
                framesTextarea.value = animation?.frames ? animation.frames.join('\n') : '';
                framesGroup.appendChild(framesTextarea);
                spriteFieldsContainer.appendChild(framesGroup);
            } else if (mode === 'spritesheet') {
                // Sprite sheet image
                const sheetGroup = document.createElement('div');
                sheetGroup.className = 'form-group';
                const sheetLabel = document.createElement('label');
                sheetLabel.textContent = 'Sprite Sheet Image';
                sheetGroup.appendChild(sheetLabel);
                const sheetInput = document.createElement('input');
                sheetInput.type = 'text';
                sheetInput.name = 'animation-spritesheet';
                sheetInput.value = animation?.spriteSheet || '';
                sheetInput.placeholder = 'e.g., fan-sprite-sheet.png';
                sheetGroup.appendChild(sheetInput);
                spriteFieldsContainer.appendChild(sheetGroup);

                // Frame dimensions and count
                const row = document.createElement('div');
                row.className = 'form-row';
                row.appendChild(this.createNumberInput('animation-framewidth', 'Frame Width', animation?.frameWidth || 64, 'Width of each frame'));
                row.appendChild(this.createNumberInput('animation-frameheight', 'Frame Height', animation?.frameHeight || 64, 'Height of each frame'));
                spriteFieldsContainer.appendChild(row);

                spriteFieldsContainer.appendChild(this.createNumberInput('animation-framecount', 'Frame Count', animation?.frameCount || 1, 'Total frames in sheet'));
                spriteFieldsContainer.appendChild(this.createNumberInput('animation-fps', 'FPS', animation?.fps || 12, 'Frames per second'));
            }
        };

        multipleRadio.addEventListener('change', updateSpriteFields);
        sheetRadio.addEventListener('change', updateSpriteFields);

        // Initial render
        updateSpriteFields();

        return container;
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
     * Update animation in real-time
     */
    updateAnimation(item) {
        const form = document.getElementById('item-properties-form');
        if (!form) return;

        const animationType = form.querySelector('[name="animation-type"]')?.value;

        if (!animationType) {
            // Remove animation
            delete item.animation;
        } else {
            // Build animation object
            const animation = { type: animationType };

            const getAnimField = (name) => form.querySelector(`[name="${name}"]`)?.value;

            // Add fields based on type
            if (animationType === 'bob' || animationType === 'pulse') {
                const amplitude = getAnimField('animation-amplitude');
                const speed = getAnimField('animation-speed');
                if (amplitude) animation.amplitude = Number(amplitude);
                if (speed) animation.speed = Number(speed);
            } else if (animationType === 'spin' || animationType === 'fade') {
                const speed = getAnimField('animation-speed');
                if (speed) animation.speed = Number(speed);
            } else if (animationType === 'sprite') {
                const spriteMode = form.querySelector('input[name="sprite-mode"]:checked')?.value;

                if (spriteMode === 'multiple') {
                    const framesText = getAnimField('animation-frames');
                    const frames = framesText ? framesText.split('\n').map(f => f.trim()).filter(f => f) : [];
                    if (frames.length > 0) animation.frames = frames;

                    const fps = getAnimField('animation-fps');
                    if (fps) animation.fps = Number(fps);
                } else if (spriteMode === 'spritesheet') {
                    const spriteSheet = getAnimField('animation-spritesheet');
                    const frameWidth = getAnimField('animation-framewidth');
                    const frameHeight = getAnimField('animation-frameheight');
                    const frameCount = getAnimField('animation-framecount');
                    const fps = getAnimField('animation-fps');

                    if (spriteSheet) animation.spriteSheet = spriteSheet;
                    if (frameWidth) animation.frameWidth = Number(frameWidth);
                    if (frameHeight) animation.frameHeight = Number(frameHeight);
                    if (frameCount) animation.frameCount = Number(frameCount);
                    if (fps) animation.fps = Number(fps);
                }
            }

            item.animation = animation;
        }

        // Update the item in the data
        const itemIndex = this.editor.data.sceneItems.findIndex(i => i.name === item.name);
        if (itemIndex !== -1) {
            this.editor.data.sceneItems[itemIndex] = item;
            this.currentItem = item;

            // Trigger auto-save
            this.editor.saveCurrentWork();

            // Restart animations in composer if enabled
            if (this.editor.sceneComposer && this.editor.sceneComposer.animationsEnabled) {
                this.editor.sceneComposer.stopAnimations();
                this.editor.sceneComposer.startAnimations();
            }
        }
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

            // Update the layers panel if it's active
            if (this.editor.layersPanel && this.editor.layersPanel.currentScene) {
                this.editor.layersPanel.render();
            }
        }
    }

    /**
     * Clear the properties panel
     */
    clear() {
        this.currentItem = null;

        // Hide remove button
        const removeBtn = document.getElementById('remove-item-from-scene-btn');
        if (removeBtn) {
            removeBtn.style.display = 'none';
        }

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

