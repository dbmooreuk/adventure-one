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
        basicSection.appendChild(this.createField('shortName', 'Short Name', item.shortName || '', 'text'));
        basicSection.appendChild(this.createTypeField(item));

        // Link To Scene field - appears for link items
        if (item.type === 'link') {
            basicSection.appendChild(this.createSceneSelectField('linkToScene', 'Link To Scene', item.linkToScene || ''));
        }

        form.appendChild(basicSection);

        // Interaction Section
        const interactionSection = this.createSection('Interaction');

        // Conditional fields based on type
        if (item.type !== 'decor') {
            interactionSection.appendChild(this.createField('lookAt', 'Look At Description', item.lookAt || '', 'textarea'));
        }

        if (item.type === 'item') {
            interactionSection.appendChild(this.createField('pickUpMessage', 'Pick Up Message', item.pickUpMessage || '', 'textarea'));
            interactionSection.appendChild(this.createField('unlockedMessage', 'Unlocked Message', item.unlockedMessage || '', 'textarea'));
            interactionSection.appendChild(this.createOutcomeField(item));
        }

        if (item.type === 'target') {
            interactionSection.appendChild(this.createField('pickUpMessage', 'Pick Up Message', item.pickUpMessage || '', 'textarea'));
            interactionSection.appendChild(this.createField('unlockedMessage', 'Unlocked Message', item.unlockedMessage || '', 'textarea'));
            interactionSection.appendChild(this.createItemSelectField('useWith', 'Use With Item', item.useWith || ''));
            interactionSection.appendChild(this.createField('useMessage', 'Use Message', item.useMessage || '', 'textarea'));
            interactionSection.appendChild(this.createItemSelectField('useResult', 'Use Result Item', item.useResult || ''));
            interactionSection.appendChild(this.createOutcomeField(item));
            interactionSection.appendChild(this.createSceneSelectField('nextScene', 'Next Scene', item.nextScene || ''));
            interactionSection.appendChild(this.createField('points', 'Points', item.points || '', 'number'));
        }

        if (interactionSection.children.length > 1) { // More than just the title
            form.appendChild(interactionSection);
        }

        // Character Quiz Section (for character type)
        if (item.type === 'character') {
            const quizSection = this.createSection('Character Quiz');
            quizSection.appendChild(this.createField('question', 'Question', item.question || '', 'textarea'));
            quizSection.appendChild(this.createAnswersListField(item.answers || []));
            quizSection.appendChild(this.createField('correctMessage', 'Correct Message', item.correctMessage || '', 'textarea'));
            quizSection.appendChild(this.createField('incorrectMessage', 'Incorrect Message', item.incorrectMessage || '', 'textarea'));
            quizSection.appendChild(this.createItemSelectField('reward', 'Reward Item', item.reward || ''));
            quizSection.appendChild(this.createOutcomeField(item));
            quizSection.appendChild(this.createField('achievement', 'Achievement', item.achievement || '', 'text'));
            quizSection.appendChild(this.createField('points', 'Points', item.points || '', 'number'));
            form.appendChild(quizSection);
        }

        // Achievement Section (for non-character types)
        if (item.type !== 'character' && item.type !== 'decor') {
            const achievementSection = this.createSection('Achievement');
            achievementSection.appendChild(this.createField('achievement', 'Achievement', item.achievement || '', 'text'));
            form.appendChild(achievementSection);
        }

        // Combine Section
        const combineSection = this.createSection('Combine Properties');
        combineSection.appendChild(this.createItemSelectField('combineWith', 'Combine With', item.combineWith || ''));
        combineSection.appendChild(this.createItemSelectField('combineResult', 'Combine Result', item.combineResult || ''));
        combineSection.appendChild(this.createField('combineMessage', 'Combine Message', item.combineMessage || '', 'textarea'));
        combineSection.appendChild(this.createField('combinePoints', 'Combine Points', item.combinePoints || '', 'number'));
        form.appendChild(combineSection);

        // Visual Properties Section
        const visualSection = this.createSection('Visual Properties');

        // Image
        visualSection.appendChild(this.createField('image', 'Image', item.image || '', 'text'));

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

        // Effects Section
        const effectsSection = this.createSection('Effects');
        effectsSection.appendChild(this.createField('onClickEffect', 'On Click Effect', item.onClickEffect || '', 'text'));
        effectsSection.appendChild(this.createField('onClickSound', 'On Click Sound', item.onClickSound || '', 'text'));
        form.appendChild(effectsSection);

        // Style Section
        const styleSection = this.createSection('Style');
        styleSection.appendChild(this.createStyleField(item.style));
        form.appendChild(styleSection);

        // Add change listeners to all inputs
        form.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('input', () => this.handlePropertyChange());
            input.addEventListener('change', () => this.handlePropertyChange());
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
     * Create animation section (new layered format)
     */
    createAnimationSection(item) {
        const section = this.createSection('Animation');

        // Normalize animation format (convert legacy to new format)
        const animation = this.normalizeAnimationFormat(item.animation || {});

        // Base Animation Section
        const baseGroup = document.createElement('div');
        baseGroup.className = 'form-group';

        const baseLabel = document.createElement('label');
        baseLabel.textContent = 'Base Animation';
        baseGroup.appendChild(baseLabel);

        const baseRadioContainer = document.createElement('div');
        baseRadioContainer.className = 'radio-group';

        // Base animation options: None, Sprite, Random
        ['none', 'sprite', 'random'].forEach(baseType => {
            const label = document.createElement('label');
            label.className = 'radio-label';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'animation-base';
            radio.value = baseType;
            radio.checked = (animation.base || 'none') === baseType;
            label.appendChild(radio);
            label.appendChild(document.createTextNode(' ' + baseType.charAt(0).toUpperCase() + baseType.slice(1)));
            baseRadioContainer.appendChild(label);
        });

        baseGroup.appendChild(baseRadioContainer);
        section.appendChild(baseGroup);

        // Transform Modifiers Section
        const transformGroup = document.createElement('div');
        transformGroup.className = 'form-group';

        const transformLabel = document.createElement('label');
        transformLabel.textContent = 'Transform Modifiers';
        transformGroup.appendChild(transformLabel);

        const transformCheckboxContainer = document.createElement('div');
        transformCheckboxContainer.className = 'checkbox-group';

        // Transform options: Bob, Pulse, Spin, Fade
        ['bob', 'pulse', 'spin', 'fade'].forEach(transform => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'animation-transforms';
            checkbox.value = transform;
            checkbox.checked = animation.transforms && animation.transforms.includes(transform);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + transform.charAt(0).toUpperCase() + transform.slice(1)));
            transformCheckboxContainer.appendChild(label);
        });

        transformGroup.appendChild(transformCheckboxContainer);
        section.appendChild(transformGroup);

        // Global Speed
        section.appendChild(this.createNumberInput('animation-speed', 'Speed', animation.speed || 1, 'Animation speed multiplier'));

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

        // Update fields when base or transforms change
        const updateFields = () => {
            const base = section.querySelector('input[name="animation-base"]:checked')?.value;
            const transforms = Array.from(section.querySelectorAll('input[name="animation-transforms"]:checked')).map(cb => cb.value);

            fieldsContainer.innerHTML = '';

            // Base-specific fields
            if (base === 'sprite') {
                fieldsContainer.appendChild(this.createSpriteFields(animation));
            } else if (base === 'random') {
                fieldsContainer.appendChild(this.createNumberInput('animation-count', 'Count', animation.count || 5, 'Number of items on screen'));
                fieldsContainer.appendChild(this.createNumberInput('animation-randomness', 'Randomness', animation.randomness || 50, 'How random the movement is (0-100)'));
                fieldsContainer.appendChild(this.createNumberInput('animation-rotation', 'Rotation', animation.rotation || 5, 'Rotation speed (0=none, 9=fast)'));
            }

            // Transform-specific fields
            if (transforms.includes('bob')) {
                fieldsContainer.appendChild(this.createNumberInput('animation-bobAmplitude', 'Bob Amplitude', animation.bobAmplitude || 10, 'Vertical movement distance in pixels'));
            }
            if (transforms.includes('pulse')) {
                fieldsContainer.appendChild(this.createNumberInput('animation-pulseAmplitude', 'Pulse Amplitude', animation.pulseAmplitude || 10, 'Scale change percentage'));
            }
            if (transforms.includes('fade')) {
                fieldsContainer.appendChild(this.createNumberInput('animation-fadeMin', 'Fade Min Opacity', animation.fadeMin || 0.5, 'Minimum opacity (0-1)'));
                fieldsContainer.appendChild(this.createNumberInput('animation-fadeMax', 'Fade Max Opacity', animation.fadeMax || 1, 'Maximum opacity (0-1)'));
            }

            // Show update button if animations are enabled in composer
            if (this.editor.sceneComposer && this.editor.sceneComposer.animationsEnabled) {
                updateBtnContainer.style.display = 'block';
            }
        };

        // Add event listeners
        section.querySelectorAll('input[name="animation-base"]').forEach(radio => {
            radio.addEventListener('change', updateFields);
        });
        section.querySelectorAll('input[name="animation-transforms"]').forEach(checkbox => {
            checkbox.addEventListener('change', updateFields);
        });

        // Initial render
        updateFields();

        return section;
    }

    /**
     * Normalize animation format (convert legacy to new format)
     */
    normalizeAnimationFormat(anim) {
        if (!anim || Object.keys(anim).length === 0) {
            return { base: 'none', transforms: [] };
        }

        // If already in new format, return as-is
        if (anim.base !== undefined || anim.transforms !== undefined) {
            return {
                base: anim.base || 'none',
                transforms: anim.transforms || [],
                ...anim
            };
        }

        // Convert legacy format
        const legacy = anim.type;
        if (!legacy) return { base: 'none', transforms: [], ...anim };

        // Legacy sprite or random becomes base
        if (legacy === 'sprite' || legacy === 'random') {
            return {
                base: legacy,
                transforms: [],
                ...anim
            };
        }

        // Legacy transform types become transforms
        return {
            base: 'none',
            transforms: [legacy],
            bobAmplitude: legacy === 'bob' ? anim.amplitude : undefined,
            pulseAmplitude: legacy === 'pulse' ? anim.amplitude : undefined,
            ...anim
        };
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
        modeLabel.textContent = 'Sprite Type';
        modeGroup.appendChild(modeLabel);

        const radioContainer = document.createElement('div');
        radioContainer.className = 'radio-group';

        // Determine current sprite type
        const isMultiple = animation?.frames && Array.isArray(animation.frames);
        const isSpriteSheet = animation?.spriteSheet;

        // Multiple Images option
        const multipleOption = document.createElement('label');
        multipleOption.className = 'radio-label';

        const multipleRadio = document.createElement('input');
        multipleRadio.type = 'radio';
        multipleRadio.name = 'sprite-mode';
        multipleRadio.value = 'multiple';
        multipleRadio.checked = isMultiple || (!isMultiple && !isSpriteSheet);

        multipleOption.appendChild(multipleRadio);
        multipleOption.appendChild(document.createTextNode(' Multiple Images (Frames)'));

        // Sprite Sheet option
        const sheetOption = document.createElement('label');
        sheetOption.className = 'radio-label';

        const sheetRadio = document.createElement('input');
        sheetRadio.type = 'radio';
        sheetRadio.name = 'sprite-mode';
        sheetRadio.value = 'spritesheet';
        sheetRadio.checked = isSpriteSheet;

        sheetOption.appendChild(sheetRadio);
        sheetOption.appendChild(document.createTextNode(' Sprite Sheet (Single Image)'));

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
            // Query within the container, not the entire document
            const mode = container.querySelector('input[name="sprite-mode"]:checked')?.value;
            spriteFieldsContainer.innerHTML = '';

            if (mode === 'multiple') {
                // FPS input
                spriteFieldsContainer.appendChild(this.createNumberInput('animation-fps', 'FPS', animation?.fps || 12, 'Frames per second'));

                // Frames list
                spriteFieldsContainer.appendChild(this.createFramesListField(animation?.frames || []));
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
     * Create frames list field for multiple sprite images
     */
    createFramesListField(frames) {
        const container = document.createElement('div');
        container.className = 'form-group frames-list-container';

        const label = document.createElement('label');
        label.textContent = 'Frame Images';
        container.appendChild(label);

        const framesList = document.createElement('div');
        framesList.className = 'frames-list';
        framesList.dataset.name = 'animation-frames';

        // Render existing frames
        if (frames && frames.length > 0) {
            frames.forEach((frame, index) => {
                const frameItem = this.createFrameItem(frame, index);
                framesList.appendChild(frameItem);

                // Add input listener to existing frame inputs
                const input = frameItem.querySelector('input');
                if (input) {
                    input.addEventListener('input', () => {
                        // Auto-save animation when frame value changes
                        this.updateAnimation(this.currentItem);
                    });
                }
            });
        }

        container.appendChild(framesList);

        // Add frame button
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn btn-secondary btn-sm';
        addBtn.textContent = '+ Add Frame';
        addBtn.addEventListener('click', () => {
            const newIndex = framesList.children.length;
            const newFrameItem = this.createFrameItem('', newIndex);
            framesList.appendChild(newFrameItem);

            // Add input listener to the new frame input
            const newInput = newFrameItem.querySelector('input');
            if (newInput) {
                newInput.addEventListener('input', () => {
                    // Auto-save animation when frame value changes
                    this.updateAnimation(this.currentItem);
                });
            }
        });
        container.appendChild(addBtn);

        const help = document.createElement('div');
        help.className = 'form-help';
        help.textContent = 'Add image filenames for each frame of the animation';
        container.appendChild(help);

        return container;
    }

    /**
     * Create a single frame item with input and remove button
     */
    createFrameItem(frameName, index) {
        const item = document.createElement('div');
        item.className = 'frame-item';

        const input = document.createElement('input');
        input.type = 'text';
        input.name = `frame-${index}`;
        input.value = frameName;
        input.placeholder = `e.g., butterfly-frame-${index + 1}.png`;
        item.appendChild(input);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-danger btn-sm';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
            item.remove();
            // Auto-save animation when frame is removed
            if (this.currentItem) {
                this.updateAnimation(this.currentItem);
            }
        });
        item.appendChild(removeBtn);

        return item;
    }

    /**
     * Create type select field
     */
    createTypeField(item) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = 'Type';
        formGroup.appendChild(label);

        const select = document.createElement('select');
        select.name = 'type';
        select.innerHTML = `
            <option value="item">Item</option>
            <option value="target">Target</option>
            <option value="link">Link</option>
            <option value="decor">Decor</option>
            <option value="character">Character</option>
        `;
        select.value = item.type || 'item';
        formGroup.appendChild(select);

        return formGroup;
    }

    /**
     * Create outcome select field
     */
    createOutcomeField(item) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = 'Outcome';
        formGroup.appendChild(label);

        const select = document.createElement('select');
        select.name = 'outcome';
        select.innerHTML = `
            <option value="">-- Select Outcome --</option>
            <option value="keep">Keep (stays in inventory)</option>
            <option value="remove">Remove (consumed after use)</option>
            <option value="removeTarget">Remove Target (removes target from scene)</option>
            <option value="scene">Scene (adds result to scene)</option>
        `;
        select.value = item.outcome || '';
        formGroup.appendChild(select);

        return formGroup;
    }

    /**
     * Create scene select field
     */
    createSceneSelectField(name, label, value) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        formGroup.appendChild(labelEl);

        const select = document.createElement('select');
        select.name = name;

        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Select Scene --';
        select.appendChild(emptyOption);

        // Add scene options
        if (this.editor.data && this.editor.data.scenes) {
            this.editor.data.scenes.forEach(scene => {
                const option = document.createElement('option');
                option.value = scene.sceneName;
                option.textContent = scene.sceneName;
                select.appendChild(option);
            });
        }

        select.value = value || '';
        formGroup.appendChild(select);

        return formGroup;
    }

    /**
     * Create item select field
     */
    createItemSelectField(name, label, value) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        formGroup.appendChild(labelEl);

        const select = document.createElement('select');
        select.name = name;

        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Select Item --';
        select.appendChild(emptyOption);

        // Add item options
        if (this.editor.data && this.editor.data.sceneItems) {
            this.editor.data.sceneItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.longName || item.name;
                select.appendChild(option);
            });
        }

        select.value = value || '';
        formGroup.appendChild(select);

        return formGroup;
    }

    /**
     * Create style field (JSON object)
     */
    createStyleField(style) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = 'Style (JSON)';
        formGroup.appendChild(label);

        const textarea = document.createElement('textarea');
        textarea.name = 'style';
        textarea.rows = 3;
        textarea.placeholder = '{"cursor": "pointer", "filter": "brightness(1.2)"}';

        if (style && Object.keys(style).length > 0) {
            textarea.value = JSON.stringify(style, null, 2);
        } else {
            textarea.value = '';
        }

        formGroup.appendChild(textarea);

        const help = document.createElement('div');
        help.className = 'form-help';
        help.textContent = 'CSS styles as JSON object';
        formGroup.appendChild(help);

        return formGroup;
    }

    /**
     * Create answers list field for character quiz
     */
    createAnswersListField(answers) {
        const container = document.createElement('div');
        container.className = 'form-group answers-list-container';

        const label = document.createElement('label');
        label.textContent = 'Answer Options';
        container.appendChild(label);

        const help = document.createElement('div');
        help.className = 'form-help';
        help.textContent = 'Add answer options. Mark one as correct.';
        container.appendChild(help);

        const answersList = document.createElement('div');
        answersList.className = 'answers-list';
        answersList.dataset.name = 'answers';

        // Render existing answers
        if (answers && answers.length > 0) {
            answers.forEach((answer, index) => {
                const answerItem = this.createAnswerItem(answer, index);
                answersList.appendChild(answerItem);

                // Add event listeners to answer inputs
                const input = answerItem.querySelector('input[type="text"]');
                const radio = answerItem.querySelector('input[type="radio"]');

                if (input) {
                    input.addEventListener('input', () => {
                        this.updateAnswers();
                    });
                }

                if (radio) {
                    radio.addEventListener('change', () => {
                        this.updateAnswers();
                    });
                }
            });
        } else {
            // Add two default empty answers
            for (let i = 0; i < 2; i++) {
                const answerItem = this.createAnswerItem({ text: '', isCorrect: false }, i);
                answersList.appendChild(answerItem);

                // Add event listeners
                const input = answerItem.querySelector('input[type="text"]');
                const radio = answerItem.querySelector('input[type="radio"]');

                if (input) {
                    input.addEventListener('input', () => {
                        this.updateAnswers();
                    });
                }

                if (radio) {
                    radio.addEventListener('change', () => {
                        this.updateAnswers();
                    });
                }
            }
        }

        container.appendChild(answersList);

        // Add answer button
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn btn-secondary btn-sm';
        addBtn.textContent = '+ Add Answer';
        addBtn.addEventListener('click', () => {
            const index = answersList.children.length;
            const answerItem = this.createAnswerItem({ text: '', isCorrect: false }, index);
            answersList.appendChild(answerItem);

            // Add event listeners to new answer
            const input = answerItem.querySelector('input[type="text"]');
            const radio = answerItem.querySelector('input[type="radio"]');

            if (input) {
                input.addEventListener('input', () => {
                    this.updateAnswers();
                });
            }

            if (radio) {
                radio.addEventListener('change', () => {
                    this.updateAnswers();
                });
            }
        });
        container.appendChild(addBtn);

        return container;
    }

    /**
     * Create a single answer item
     */
    createAnswerItem(answer, index) {
        const item = document.createElement('div');
        item.className = 'answer-item';

        // Radio button for correct answer
        const checkbox = document.createElement('input');
        checkbox.type = 'radio';
        checkbox.name = 'answer-correct';
        checkbox.value = index;
        checkbox.checked = answer.isCorrect || false;
        checkbox.title = 'Mark as correct answer';
        item.appendChild(checkbox);

        // Text input
        const input = document.createElement('input');
        input.type = 'text';
        input.name = `answer-${index}`;
        input.value = answer.text || '';
        input.placeholder = `Answer option ${index + 1}`;
        item.appendChild(input);

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-danger btn-sm';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
            item.remove();
            // Auto-save when answer is removed
            this.updateAnswers();
        });
        item.appendChild(removeBtn);

        return item;
    }

    /**
     * Update answers array from form inputs
     */
    updateAnswers() {
        if (!this.currentItem) return;

        const answersList = document.querySelector('.answers-list');
        if (!answersList) return;

        const answers = [];
        const answerItems = answersList.querySelectorAll('.answer-item');
        const correctIndex = document.querySelector('input[name="answer-correct"]:checked')?.value;

        answerItems.forEach((item, index) => {
            const input = item.querySelector('input[type="text"]');
            const text = input?.value.trim();

            if (text) {
                answers.push({
                    text: text,
                    isCorrect: String(index) === correctIndex
                });
            }
        });

        // Update the item in the data
        const itemIndex = this.editor.data.sceneItems.findIndex(i => i.name === this.currentItem.name);
        if (itemIndex !== -1) {
            this.editor.data.sceneItems[itemIndex].answers = answers;
            this.currentItem = this.editor.data.sceneItems[itemIndex];

            // Trigger auto-save
            this.editor.saveCurrentWork();

            // Refresh code editor if it's visible
            if (this.editor.codeEditor) {
                this.editor.codeEditor.refresh();
            }
        }
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
     * Update animation in real-time (new layered format)
     */
    updateAnimation(item) {
        const form = document.getElementById('item-properties-form');
        if (!form) return;

        // Get base and transforms
        const animationBase = form.querySelector('input[name="animation-base"]:checked')?.value;
        const animationTransforms = Array.from(form.querySelectorAll('input[name="animation-transforms"]:checked')).map(cb => cb.value);

        // Helper to get animation field value
        const getAnimField = (name) => {
            const input = form.querySelector(`[name="${name}"]`);
            return input ? input.value : null;
        };

        // Only create animation object if there's a base or transforms
        if ((animationBase && animationBase !== 'none') || animationTransforms.length > 0) {
            const animation = {};

            // Set base (only if not 'none')
            if (animationBase && animationBase !== 'none') {
                animation.base = animationBase;
            }

            // Set transforms (only if any selected)
            if (animationTransforms.length > 0) {
                animation.transforms = animationTransforms;
            }

            // Global speed
            const speed = getAnimField('animation-speed');
            if (speed) animation.speed = Number(speed);

            // Base-specific fields
            if (animationBase === 'sprite') {
                const spriteMode = form.querySelector('input[name="sprite-mode"]:checked')?.value;

                if (spriteMode === 'multiple') {
                    // Collect frames from frame inputs
                    const frames = [];
                    const frameInputs = form.querySelectorAll('.frames-list input[type="text"]');
                    frameInputs.forEach((input) => {
                        if (input.value.trim()) {
                            frames.push(input.value.trim());
                        }
                    });
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
            } else if (animationBase === 'random') {
                const count = getAnimField('animation-count');
                const randomness = getAnimField('animation-randomness');
                const rotation = getAnimField('animation-rotation');
                if (count !== undefined && count !== '') animation.count = Number(count);
                if (randomness !== undefined && randomness !== '') animation.randomness = Number(randomness);
                if (rotation !== undefined && rotation !== '') animation.rotation = Number(rotation);
            }

            // Transform-specific fields
            if (animationTransforms.includes('bob')) {
                const bobAmplitude = getAnimField('animation-bobAmplitude');
                if (bobAmplitude) animation.bobAmplitude = Number(bobAmplitude);
            }
            if (animationTransforms.includes('pulse')) {
                const pulseAmplitude = getAnimField('animation-pulseAmplitude');
                if (pulseAmplitude) animation.pulseAmplitude = Number(pulseAmplitude);
            }
            if (animationTransforms.includes('fade')) {
                const fadeMin = getAnimField('animation-fadeMin');
                const fadeMax = getAnimField('animation-fadeMax');
                if (fadeMin !== null && fadeMin !== '') animation.fadeMin = Number(fadeMin);
                if (fadeMax !== null && fadeMax !== '') animation.fadeMax = Number(fadeMax);
            }

            item.animation = animation;
        } else {
            // No animation
            delete item.animation;
        }

        // Update the item in the data
        const itemIndex = this.editor.data.sceneItems.findIndex(i => i.name === item.name);
        if (itemIndex !== -1) {
            this.editor.data.sceneItems[itemIndex] = item;
            this.currentItem = item;

            // Trigger auto-save
            this.editor.saveCurrentWork();

            // Refresh code editor if it's visible
            if (this.editor.codeEditor) {
                this.editor.codeEditor.refresh();
            }

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
            } else if (key === 'zIndex' || key === 'points' || key === 'combinePoints') {
                // Handle numeric fields - only set if not empty
                if (value !== '') {
                    updates[key] = Number(value);
                }
                if (key === 'zIndex') {
                    console.log(`🎨 Z-Index in updates object:`, updates[key]);
                }
            } else if (key === 'style') {
                // Parse JSON style
                if (value.trim()) {
                    try {
                        updates.style = JSON.parse(value);
                    } catch (e) {
                        console.warn('Invalid JSON in style field:', e);
                        // Keep the old style if JSON is invalid
                    }
                } else {
                    updates.style = {};
                }
            } else {
                // Regular text fields - only set if not empty
                if (value !== '') {
                    updates[key] = value;
                }
            }
        }

        console.log('📝 Updates object:', updates);

        // Update the item in the data
        const itemIndex = this.editor.data.sceneItems.findIndex(i => i.name === this.currentItem.name);
        if (itemIndex !== -1) {
            console.log(`📝 Before update - item data:`, JSON.parse(JSON.stringify(this.editor.data.sceneItems[itemIndex])));

            Object.assign(this.editor.data.sceneItems[itemIndex], updates);

            // Process animation fields into animation object
            this.updateAnimation(this.editor.data.sceneItems[itemIndex]);

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

            // Refresh code editor if it's visible
            if (this.editor.codeEditor) {
                this.editor.codeEditor.refresh();
            }

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

