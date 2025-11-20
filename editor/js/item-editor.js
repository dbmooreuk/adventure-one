/**
 * Item Editor - Handles item editing UI and logic
 */

import { itemSchema, animationSchema, styleSchema, validateObject, ITEM_TYPES } from './schema.js';

export class ItemEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentItem = null;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Delete button
        document.getElementById('delete-item-btn').addEventListener('click', () => {
            if (this.currentItem) {
                this.delete(this.currentItem);
            }
        });
        
        // Duplicate button
        document.getElementById('duplicate-item-btn').addEventListener('click', () => {
            if (this.currentItem) {
                this.duplicate(this.currentItem);
            }
        });
    }
    
    /**
     * Create a new item
     */
    createNew() {
        const newItem = {
            name: `item${this.editor.data.sceneItems.length + 1}`,
            longName: "New Item",
            shortName: "",
            type: "item",
            lookAt: "An interesting item.",
            pickUpMessage: "You pick up the item.",
            useWith: "",
            useMessage: "",
            useResult: "",
            outcome: "keep",
            points: 0,
            image: "",
            position: [100, 100],
            size: [50, 50]
        };
        
        this.editor.addItem(newItem);
        this.edit(newItem.name);
        this.editor.uiManager.setStatus('New item created', 'success');
    }
    
    /**
     * Edit an existing item
     */
    edit(itemName) {
        // Stop any running animation preview
        this.stopAnimationPreview();

        const item = this.editor.getItemByName(itemName);
        if (!item) return;
        
        this.currentItem = itemName;
        this.renderForm(item);
        this.editor.uiManager.showPanel('item-editor');
        
        // Update title
        document.getElementById('item-editor-title').textContent = `Edit Item: ${item.longName || item.name}`;
    }
    
    /**
     * Render the item editing form
     */
    renderForm(item) {
        const form = document.getElementById('item-form');
        form.innerHTML = '';

        // Basic Information Section
        const basicSection = this.createSection('Basic Information');
        basicSection.appendChild(this.editor.uiManager.createFormField('name', itemSchema.name, item.name, item));
        basicSection.appendChild(this.editor.uiManager.createFormField('longName', itemSchema.longName, item.longName, item));
        basicSection.appendChild(this.editor.uiManager.createFormField('shortName', itemSchema.shortName, item.shortName, item));
        basicSection.appendChild(this.editor.uiManager.createFormField('type', itemSchema.type, item.type, item));

        // Link To Scene field - appears right after Type for link items
        const linkField = this.editor.uiManager.createFormField('linkToScene', itemSchema.linkToScene, item.linkToScene, item);
        if (linkField) basicSection.appendChild(linkField);

        form.appendChild(basicSection);

        // Interaction Section
        const interactionSection = this.createSection('Interaction');

        // Conditional fields based on type - check for null before appending
        const lookAtField = this.editor.uiManager.createFormField('lookAt', itemSchema.lookAt, item.lookAt, item);
        if (lookAtField) interactionSection.appendChild(lookAtField);

        const unlockedMsgField = this.editor.uiManager.createFormField('unlockedMessage', itemSchema.unlockedMessage, item.unlockedMessage, item);
        if (unlockedMsgField) interactionSection.appendChild(unlockedMsgField);

        const pickUpField = this.editor.uiManager.createFormField('pickUpMessage', itemSchema.pickUpMessage, item.pickUpMessage, item);
        if (pickUpField) interactionSection.appendChild(pickUpField);

        const useWithField = this.editor.uiManager.createFormField('useWith', itemSchema.useWith, item.useWith, item);
        if (useWithField) interactionSection.appendChild(useWithField);

        const useMessageField = this.editor.uiManager.createFormField('useMessage', itemSchema.useMessage, item.useMessage, item);
        if (useMessageField) interactionSection.appendChild(useMessageField);

        const useResultField = this.editor.uiManager.createFormField('useResult', itemSchema.useResult, item.useResult, item);
        if (useResultField) interactionSection.appendChild(useResultField);

        const outcomeField = this.editor.uiManager.createFormField('outcome', itemSchema.outcome, item.outcome, item);
        if (outcomeField) interactionSection.appendChild(outcomeField);

        const nextSceneField = this.editor.uiManager.createFormField('nextScene', itemSchema.nextScene, item.nextScene, item);
        if (nextSceneField) interactionSection.appendChild(nextSceneField);

        const pointsField = this.editor.uiManager.createFormField('points', itemSchema.points, item.points, item);
        if (pointsField) interactionSection.appendChild(pointsField);

        form.appendChild(interactionSection);

        // Achievement Section
        const achievementSection = this.createSection('Achievement');
        achievementSection.appendChild(this.editor.uiManager.createFormField('achievement', itemSchema.achievement, item.achievement, item));
        form.appendChild(achievementSection);

        // Combine Section
        const combineSection = this.createSection('Combine Properties (Optional)');
        combineSection.appendChild(this.editor.uiManager.createFormField('combineWith', itemSchema.combineWith, item.combineWith, item));
        combineSection.appendChild(this.editor.uiManager.createFormField('combineResult', itemSchema.combineResult, item.combineResult, item));
        combineSection.appendChild(this.editor.uiManager.createFormField('combineMessage', itemSchema.combineMessage, item.combineMessage, item));
        combineSection.appendChild(this.editor.uiManager.createFormField('combinePoints', itemSchema.combinePoints, item.combinePoints, item));
        form.appendChild(combineSection);

        // Visual Section
        const visualSection = this.createSection('Visual Properties');
        visualSection.appendChild(this.editor.uiManager.createFormField('image', itemSchema.image, item.image, item));
        visualSection.appendChild(this.editor.uiManager.createFormField('zIndex', itemSchema.zIndex, item.zIndex, item));

        // Position and Size
        const positionField = this.createPositionField(item.position || [0, 0]);
        visualSection.appendChild(positionField);

        const sizeField = this.createSizeField(item.size || [50, 50]);
        visualSection.appendChild(sizeField);

        // Hit area fields - conditional based on type
        const hitWField = this.editor.uiManager.createFormField('hitW', itemSchema.hitW, item.hitW, item);
        const hitHField = this.editor.uiManager.createFormField('hitH', itemSchema.hitH, item.hitH, item);

        if (hitWField && hitHField) {
            const hitRow = document.createElement('div');
            hitRow.className = 'form-row';
            hitRow.appendChild(hitWField);
            hitRow.appendChild(hitHField);
            visualSection.appendChild(hitRow);
        }

        // Hit polygon field - conditional based on type
        const hitPolygonField = this.editor.uiManager.createFormField('hitPolygon', itemSchema.hitPolygon, item.hitPolygon, item);
        if (hitPolygonField) visualSection.appendChild(hitPolygonField);

        // Non-interactive field - conditional for decor
        const nonInteractiveField = this.editor.uiManager.createFormField('nonInteractive', itemSchema.nonInteractive, item.nonInteractive, item);
        if (nonInteractiveField) visualSection.appendChild(nonInteractiveField);

        form.appendChild(visualSection);
        
        // Animation Section
        const animationSection = this.createSection('Animation (Optional)');
        const animationField = this.createAnimationField(item.animation);
        animationSection.appendChild(animationField);
        form.appendChild(animationSection);
        
        // Effects Section
        const effectsSection = this.createSection('Effects');
        effectsSection.appendChild(this.editor.uiManager.createFormField('onClickEffect', itemSchema.onClickEffect, item.onClickEffect, item));
        effectsSection.appendChild(this.editor.uiManager.createFormField('onClickSound', itemSchema.onClickSound, item.onClickSound, item));
        form.appendChild(effectsSection);
        
        // Style Section
        const styleSection = this.createSection('Style');
        const styleField = this.createStyleField(item.style);
        styleSection.appendChild(styleField);
        form.appendChild(styleSection);

        // Add change listener for type to re-render form
        const typeSelect = form.querySelector('[name="type"]');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                const formData = this.getFormData();
                this.renderForm(formData);
            });
        }
        
        // Add change listener for outcome to re-render form
        const outcomeSelect = form.querySelector('[name="outcome"]');
        if (outcomeSelect) {
            outcomeSelect.addEventListener('change', () => {
                const formData = this.getFormData();
                this.renderForm(formData);
            });
        }
    }
    
    /**
     * Create a form section
     */
    createSection(title) {
        const section = document.createElement('div');
        section.className = 'form-section';
        
        const titleEl = document.createElement('h3');
        titleEl.className = 'form-section-title';
        titleEl.textContent = title;
        section.appendChild(titleEl);
        
        return section;
    }
    
    /**
     * Create position field [X, Y]
     */
    createPositionField(position) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = 'Position [X, Y]';
        formGroup.appendChild(label);
        
        const row = document.createElement('div');
        row.className = 'form-row';
        
        const xInput = document.createElement('input');
        xInput.type = 'number';
        xInput.name = 'position-x';
        xInput.value = position[0];
        xInput.placeholder = 'X';
        
        const yInput = document.createElement('input');
        yInput.type = 'number';
        yInput.name = 'position-y';
        yInput.value = position[1];
        yInput.placeholder = 'Y';
        
        row.appendChild(xInput);
        row.appendChild(yInput);
        formGroup.appendChild(row);
        
        const help = document.createElement('div');
        help.className = 'form-help';
        help.textContent = 'Position on scene canvas (pixels from top-left)';
        formGroup.appendChild(help);
        
        return formGroup;
    }
    
    /**
     * Create size field [W, H]
     */
    createSizeField(size) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = 'Size [W, H]';
        formGroup.appendChild(label);
        
        const row = document.createElement('div');
        row.className = 'form-row';
        
        const wInput = document.createElement('input');
        wInput.type = 'number';
        wInput.name = 'size-w';
        wInput.value = size[0];
        wInput.placeholder = 'Width';
        
        const hInput = document.createElement('input');
        hInput.type = 'number';
        hInput.name = 'size-h';
        hInput.value = size[1];
        hInput.placeholder = 'Height';
        
        row.appendChild(wInput);
        row.appendChild(hInput);
        formGroup.appendChild(row);
        
        const help = document.createElement('div');
        help.className = 'form-help';
        help.textContent = 'Width and height in pixels';
        formGroup.appendChild(help);
        
        return formGroup;
    }
    
    /**
     * Create animation field
     */
    createAnimationField(animation) {
        console.log('🎨 createAnimationField called with animation:', animation);

        const container = document.createElement('div');
        container.className = 'animation-editor';

        // Create a wrapper for fields and preview
        const editorWrapper = document.createElement('div');
        editorWrapper.className = 'animation-editor-wrapper';
        container.appendChild(editorWrapper);

        // Left side: Animation controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'animation-controls';
        editorWrapper.appendChild(controlsContainer);

        // Right side: Preview
        const previewContainer = document.createElement('div');
        previewContainer.className = 'animation-preview-container';
        previewContainer.innerHTML = `
            <div class="animation-preview-header">Preview</div>
            <div class="animation-preview-canvas-wrapper">
                <canvas id="animation-preview-canvas" width="200" height="200"></canvas>
            </div>
        `;
        editorWrapper.appendChild(previewContainer);

        // Animation Type dropdown
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

        ['bob', 'pulse', 'spin', 'fade', 'sprite', 'random'].forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            if (animation && animation.type === type) {
                option.selected = true;
            }
            typeSelect.appendChild(option);
        });

        typeGroup.appendChild(typeSelect);
        controlsContainer.appendChild(typeGroup);

        // Dynamic fields container
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'animation-fields';
        controlsContainer.appendChild(fieldsContainer);

        // Animation preview manager
        let animationPreview = null;

        // Update fields when type changes
        const updateFields = () => {
            const type = typeSelect.value;
            fieldsContainer.innerHTML = '';

            if (!type) {
                // Stop preview
                if (animationPreview) {
                    animationPreview.stop();
                    animationPreview = null;
                }
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

            // Random animation
            if (type === 'random') {
                fieldsContainer.appendChild(this.createNumberInput('animation-speed', 'Speed', animation?.speed !== undefined ? animation.speed : 1, 'Movement speed multiplier'));
                fieldsContainer.appendChild(this.createNumberInput('animation-count', 'Count', animation?.count !== undefined ? animation.count : 5, 'Number of items on screen'));
                fieldsContainer.appendChild(this.createNumberInput('animation-randomness', 'Randomness', animation?.randomness !== undefined ? animation.randomness : 50, 'How random the movement is (0-100)'));
                fieldsContainer.appendChild(this.createNumberInput('animation-rotation', 'Rotation', animation?.rotation !== undefined ? animation.rotation : 5, 'Rotation speed (0=none, 9=fast)'));
            }

            // Sprite animation
            if (type === 'sprite') {
                fieldsContainer.appendChild(this.createSpriteFields(animation));
            }

            // Start preview
            this.startAnimationPreview(type, animation);
        };

        // Listen for input changes to update preview
        container.addEventListener('input', () => {
            const type = typeSelect.value;
            if (type) {
                this.updateAnimationPreview(type);
            }
        });

        typeSelect.addEventListener('change', updateFields);

        // Initial render
        updateFields();

        return container;
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
        console.log('🎬 createSpriteFields called with animation:', animation);

        const container = document.createElement('div');
        container.className = 'sprite-fields';

        // Radio buttons for sprite type
        const radioGroup = document.createElement('div');
        radioGroup.className = 'form-group';

        const radioLabel = document.createElement('label');
        radioLabel.textContent = 'Sprite Type';
        radioGroup.appendChild(radioLabel);

        const radioContainer = document.createElement('div');
        radioContainer.className = 'radio-group';

        // Determine current sprite type
        const isMultiple = animation?.frames && Array.isArray(animation.frames);
        const isSpriteSheet = animation?.spriteSheet;

        console.log('🎬 isMultiple:', isMultiple, 'isSpriteSheet:', isSpriteSheet);
        console.log('🎬 animation.frames:', animation?.frames);

        // Multiple frames radio
        const multipleLabel = document.createElement('label');
        multipleLabel.className = 'radio-label';
        const multipleRadio = document.createElement('input');
        multipleRadio.type = 'radio';
        multipleRadio.name = 'sprite-mode';
        multipleRadio.value = 'multiple';
        multipleRadio.checked = isMultiple || (!isMultiple && !isSpriteSheet);
        multipleLabel.appendChild(multipleRadio);
        multipleLabel.appendChild(document.createTextNode(' Multiple Images (Frames)'));
        radioContainer.appendChild(multipleLabel);

        // Sprite sheet radio
        const sheetLabel = document.createElement('label');
        sheetLabel.className = 'radio-label';
        const sheetRadio = document.createElement('input');
        sheetRadio.type = 'radio';
        sheetRadio.name = 'sprite-mode';
        sheetRadio.value = 'spritesheet';
        sheetRadio.checked = isSpriteSheet;
        sheetLabel.appendChild(sheetRadio);
        sheetLabel.appendChild(document.createTextNode(' Sprite Sheet (Single Image)'));
        radioContainer.appendChild(sheetLabel);

        radioGroup.appendChild(radioContainer);
        container.appendChild(radioGroup);

        // Dynamic sprite fields container
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
        console.log('📋 createFramesListField called with frames:', frames);

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
            console.log('📋 Rendering', frames.length, 'existing frames');
            frames.forEach((frame, index) => {
                console.log(`  Creating frame ${index}:`, frame);
                framesList.appendChild(this.createFrameItem(frame, index));
            });
        } else {
            console.log('📋 No existing frames to render');
        }

        container.appendChild(framesList);

        // Add frame button
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn btn-secondary btn-sm';
        addBtn.textContent = '+ Add Frame';
        addBtn.addEventListener('click', () => {
            const newIndex = framesList.children.length;
            framesList.appendChild(this.createFrameItem('', newIndex));
        });
        container.appendChild(addBtn);

        const help = document.createElement('div');
        help.className = 'form-help';
        help.textContent = 'Add image filenames for each frame of the animation';
        container.appendChild(help);

        return container;
    }

    /**
     * Create a single frame item
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
        });
        item.appendChild(removeBtn);

        return item;
    }

    /**
     * Create style field
     */
    createStyleField(style) {
        const container = document.createElement('div');
        container.className = 'style-fields';

        // CSS Class Name field
        const classGroup = document.createElement('div');
        classGroup.className = 'form-group';

        const classLabel = document.createElement('label');
        classLabel.textContent = 'CSS Class Name';
        classGroup.appendChild(classLabel);

        const classInput = document.createElement('input');
        classInput.type = 'text';
        classInput.name = 'style-className';
        classInput.value = style?.className || '';
        classInput.placeholder = 'e.g., item--torch';
        classGroup.appendChild(classInput);

        const classHelp = document.createElement('div');
        classHelp.className = 'form-help';
        classHelp.textContent = 'Custom CSS class for styling (optional)';
        classGroup.appendChild(classHelp);

        container.appendChild(classGroup);

        // Hover Effect dropdown
        const hoverGroup = document.createElement('div');
        hoverGroup.className = 'form-group';

        const hoverLabel = document.createElement('label');
        hoverLabel.textContent = 'Hover Effect';
        hoverGroup.appendChild(hoverLabel);

        const hoverSelect = document.createElement('select');
        hoverSelect.name = 'style-hoverEffect';

        // Add empty option
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = '-- No Effect --';
        hoverSelect.appendChild(noneOption);

        // Add hover effect options
        const hoverEffects = ['glow', 'pulse', 'shine', 'swing'];
        hoverEffects.forEach(effect => {
            const option = document.createElement('option');
            option.value = effect;
            option.textContent = effect.charAt(0).toUpperCase() + effect.slice(1);
            if (style?.hoverEffect === effect) {
                option.selected = true;
            }
            hoverSelect.appendChild(option);
        });

        hoverGroup.appendChild(hoverSelect);

        const hoverHelp = document.createElement('div');
        hoverHelp.className = 'form-help';
        hoverHelp.textContent = 'Visual effect when hovering over the item';
        hoverGroup.appendChild(hoverHelp);

        container.appendChild(hoverGroup);

        return container;
    }
    
    /**
     * Get form data
     */
    getFormData() {
        const form = document.getElementById('item-form');
        const formData = {};
        
        // Get all input values
        form.querySelectorAll('input, select, textarea').forEach(input => {
            const name = input.name;
            if (!name) return;

            // Handle special fields (skip these, they're handled separately)
            if (name === 'position-x' || name === 'position-y' ||
                name === 'size-w' || name === 'size-h' ||
                name.startsWith('frame-') || name === 'sprite-mode' ||
                name.startsWith('style-')) {
                return; // Handle separately
            }

            // Skip animation sub-fields but NOT animation-type
            if (name.startsWith('animation-') && name !== 'animation-type') {
                return; // Handle separately in animation processing
            }

            if (input.type === 'checkbox') {
                formData[name] = input.checked;
            } else if (input.type === 'number') {
                formData[name] = input.value ? Number(input.value) : null;
            } else if (input.tagName === 'SELECT' && input.multiple) {
                // Handle multi-select - get array of selected values
                const selected = Array.from(input.selectedOptions).map(opt => opt.value);
                // If only one value selected, store as string; if multiple, store as array
                formData[name] = selected.length === 1 ? selected[0] : (selected.length > 1 ? selected : null);
            } else {
                formData[name] = input.value || null;
            }
        });

        // Handle multi-select-dropdown fields
        form.querySelectorAll('.multi-select-dropdown').forEach(dropdown => {
            const fieldName = dropdown.dataset.fieldName;
            const selected = Array.from(dropdown.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            // If only one value selected, store as string; if multiple, store as array
            formData[fieldName] = selected.length === 1 ? selected[0] : (selected.length > 1 ? selected : null);
        });
        
        // Handle position
        const posX = form.querySelector('[name="position-x"]');
        const posY = form.querySelector('[name="position-y"]');
        if (posX && posY) {
            formData.position = [Number(posX.value) || 0, Number(posY.value) || 0];
        }
        
        // Handle size
        const sizeW = form.querySelector('[name="size-w"]');
        const sizeH = form.querySelector('[name="size-h"]');
        if (sizeW && sizeH) {
            formData.size = [Number(sizeW.value) || 50, Number(sizeH.value) || 50];
        }
        
        // Build animation object from fields
        const animationType = formData['animation-type'];
        console.log('🎨 Animation Type:', animationType);
        console.log('🎨 Form Data before animation processing:', { ...formData });

        if (animationType) {
            const animation = { type: animationType };

            // Helper to get animation field value
            const getAnimField = (name) => {
                const input = form.querySelector(`[name="${name}"]`);
                return input ? input.value : null;
            };

            // Add fields based on type
            if (animationType === 'bob' || animationType === 'pulse') {
                const amplitude = getAnimField('animation-amplitude');
                const speed = getAnimField('animation-speed');
                if (amplitude) animation.amplitude = Number(amplitude);
                if (speed) animation.speed = Number(speed);
            } else if (animationType === 'spin' || animationType === 'fade') {
                const speed = getAnimField('animation-speed');
                if (speed) animation.speed = Number(speed);
            } else if (animationType === 'random') {
                const speed = getAnimField('animation-speed');
                const count = getAnimField('animation-count');
                const randomness = getAnimField('animation-randomness');
                const rotation = getAnimField('animation-rotation');
                console.log('🎲 Random animation fields:', { speed, count, randomness, rotation });
                if (speed !== undefined && speed !== '') animation.speed = Number(speed);
                if (count !== undefined && count !== '') animation.count = Number(count);
                if (randomness !== undefined && randomness !== '') animation.randomness = Number(randomness);
                if (rotation !== undefined && rotation !== '') animation.rotation = Number(rotation);
                console.log('🎲 Animation object:', animation);
            } else if (animationType === 'sprite') {
                const spriteMode = form.querySelector('input[name="sprite-mode"]:checked')?.value;
                console.log('🎬 Sprite Mode:', spriteMode);

                if (spriteMode === 'multiple') {
                    // Collect frames from frame inputs
                    const frames = [];
                    const frameInputs = form.querySelectorAll('.frames-list input[type="text"]');
                    console.log('🎬 Found frame inputs:', frameInputs.length);
                    frameInputs.forEach((input, index) => {
                        console.log(`  Frame ${index}:`, input.value);
                        if (input.value.trim()) {
                            frames.push(input.value.trim());
                        }
                    });
                    console.log('🎬 Collected frames:', frames);
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

            console.log('🎨 Final animation object:', animation);
            formData.animation = animation;
        } else {
            formData.animation = null;
        }

        // Clean up animation-related fields from formData
        Object.keys(formData).forEach(key => {
            if (key.startsWith('animation-') || key.startsWith('frame-')) {
                delete formData[key];
            }
        });

        console.log('🎨 Form Data after animation processing:', { ...formData });

        // Build style object from separate fields
        const styleClassName = form.querySelector('[name="style-className"]')?.value;
        const styleHoverEffect = form.querySelector('[name="style-hoverEffect"]')?.value;

        if (styleClassName || styleHoverEffect) {
            formData.style = {};
            if (styleClassName) formData.style.className = styleClassName;
            if (styleHoverEffect) formData.style.hoverEffect = styleHoverEffect;
        } else {
            formData.style = null;
        }

        return formData;
    }
    
    /**
     * Save item
     */
    save() {
        const formData = this.getFormData();

        // Basic validation
        if (!formData.name || !formData.longName || !formData.type) {
            this.editor.uiManager.setStatus('Please fill in required fields', 'danger');
            return false;
        }

        // Update or add
        this.editor.updateItem(this.currentItem, formData);
        this.currentItem = formData.name;
        this.editor.uiManager.setStatus('Item saved successfully', 'success');
        return true;
    }

    /**
     * Save item if valid (for auto-save)
     */
    saveIfValid() {
        if (!this.currentItem) return;

        const formData = this.getFormData();

        // Basic validation
        if (!formData.name || !formData.longName || !formData.type) {
            // Don't show error for auto-save, just skip
            console.log('Auto-save skipped: validation errors');
            return;
        }

        // Update or add
        this.editor.updateItem(this.currentItem, formData);
        this.currentItem = formData.name;
        console.log('Item auto-saved');

        // Show subtle feedback
        this.showAutoSaveFeedback();
    }

    /**
     * Show auto-save feedback
     */
    showAutoSaveFeedback() {
        const indicator = document.getElementById('autosave-indicator');
        if (indicator) {
            indicator.textContent = '✓ Item saved';
            indicator.style.opacity = '1';
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 1500);
        }
    }
    
    /**
     * Delete item
     */
    delete(itemName) {
        this.editor.uiManager.showModal(
            'Delete Item',
            `Are you sure you want to delete "${itemName}"? This will also remove it from all scenes. This cannot be undone.`,
            () => {
                this.editor.deleteItem(itemName);
                this.editor.uiManager.setStatus('Item deleted', 'success');
            }
        );
    }
    
    /**
     * Duplicate item
     */
    duplicate(itemName) {
        const item = this.editor.getItemByName(itemName);
        if (!item) return;

        const newItem = { ...item };
        newItem.name = `${item.name}_copy`;
        newItem.longName = `${item.longName} (Copy)`;

        this.editor.addItem(newItem);
        this.edit(newItem.name);
        this.editor.uiManager.setStatus('Item duplicated', 'success');
    }

    /**
     * Start animation preview
     */
    startAnimationPreview(type, animationData) {
        console.log('🎬 startAnimationPreview called with type:', type);

        const canvas = document.getElementById('animation-preview-canvas');
        if (!canvas) {
            console.log('❌ Canvas not found!');
            return;
        }

        console.log('✓ Canvas found, starting animation');

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Stop any existing animation
        if (this.previewAnimationId) {
            cancelAnimationFrame(this.previewAnimationId);
        }

        // Get current item image
        const form = document.getElementById('item-form');
        const imageInput = form?.querySelector('[name="image"]');
        const imagePath = imageInput?.value;

        this.previewStartTime = Date.now();
        this.previewImage = null;

        // Load image if available
        if (imagePath) {
            const img = new Image();
            img.onload = () => {
                this.previewImage = img;
            };
            img.src = `../src/assets/images/items/${imagePath}`;
        }

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Get current animation settings from form
            const settings = this.getAnimationSettings();
            const elapsed = (Date.now() - this.previewStartTime) * (settings.speed || 1);
            const t = elapsed / 1000;

            ctx.save();
            ctx.translate(centerX, centerY);

            // Apply animation transform
            switch (type) {
                case 'bob': {
                    const bobY = Math.sin(t * 2) * (settings.amplitude || 10);
                    ctx.translate(0, bobY);
                    break;
                }
                case 'pulse': {
                    const scale = 1 + (Math.sin(t * 2) * (settings.amplitude || 10) / 100);
                    ctx.scale(scale, scale);
                    break;
                }
                case 'spin': {
                    const rotation = (t * 60 * (settings.speed || 1)) % 360;
                    ctx.rotate((rotation * Math.PI) / 180);
                    break;
                }
                case 'fade': {
                    const opacity = 0.5 + (Math.sin(t * 2) * 0.5);
                    ctx.globalAlpha = opacity;
                    break;
                }
                case 'sprite': {
                    // Sprite animation handled separately
                    this.drawSpriteFrame(ctx, settings, t);
                    ctx.restore();
                    this.previewAnimationId = requestAnimationFrame(animate);
                    return;
                }
            }

            // Draw preview box or image
            if (this.previewImage) {
                ctx.drawImage(this.previewImage, -40, -40, 80, 80);
            } else {
                ctx.fillStyle = '#4a9eff';
                ctx.fillRect(-40, -40, 80, 80);
                ctx.strokeStyle = '#6bb0ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(-40, -40, 80, 80);
            }

            ctx.restore();

            this.previewAnimationId = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Update animation preview with current settings
     */
    updateAnimationPreview(type) {
        // Restart preview with current settings
        this.startAnimationPreview(type, null);
    }

    /**
     * Get current animation settings from form
     */
    getAnimationSettings() {
        const form = document.getElementById('item-form');
        if (!form) return {};

        return {
            amplitude: parseFloat(form.querySelector('[name="animation-amplitude"]')?.value) || 10,
            speed: parseFloat(form.querySelector('[name="animation-speed"]')?.value) || 1,
            fps: parseFloat(form.querySelector('[name="animation-fps"]')?.value) || 12
        };
    }

    /**
     * Draw sprite animation frame
     */
    drawSpriteFrame(ctx, settings, t) {
        const form = document.getElementById('item-form');
        const mode = form?.querySelector('input[name="sprite-mode"]:checked')?.value;

        console.log('🎬 drawSpriteFrame - mode:', mode, 'fps:', settings.fps);

        if (mode === 'multiple') {
            // Get frame inputs - they have name="frame-0", "frame-1", etc.
            const frameInputs = form?.querySelectorAll('[name^="frame-"]');
            const frames = Array.from(frameInputs || []).map(input => input.value).filter(v => v);

            console.log('🎬 Frame inputs found:', frameInputs?.length);
            console.log('🎬 Frames with values:', frames.length, frames);

            if (frames.length > 0) {
                const fps = settings.fps || 12;
                const frameIndex = Math.floor(t * fps) % frames.length;
                const framePath = frames[frameIndex];

                console.log('🎬 Current frame index:', frameIndex, 'path:', framePath);

                // Load and cache frame images
                if (!this.spriteFrameImages) this.spriteFrameImages = {};

                if (this.spriteFrameImages[framePath]) {
                    ctx.drawImage(this.spriteFrameImages[framePath], -40, -40, 80, 80);
                } else {
                    const img = new Image();
                    img.onload = () => {
                        this.spriteFrameImages[framePath] = img;
                        console.log('✓ Loaded frame image:', framePath);
                    };
                    img.onerror = () => {
                        console.log('❌ Failed to load frame image:', framePath);
                    };
                    img.src = `../src/assets/images/items/${framePath}`;

                    // Draw placeholder while loading
                    ctx.fillStyle = '#4a9eff';
                    ctx.fillRect(-40, -40, 80, 80);
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Loading...', 0, 0);
                }
            } else {
                // No frames - draw placeholder
                ctx.fillStyle = '#4a9eff';
                ctx.fillRect(-40, -40, 80, 80);
                ctx.fillStyle = '#fff';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Add frames', 0, 0);
            }
        } else {
            // Sprite sheet mode - simplified for now
            ctx.fillStyle = '#4a9eff';
            ctx.fillRect(-40, -40, 80, 80);
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Sprite Sheet', 0, 0);
        }
    }

    /**
     * Stop animation preview
     */
    stopAnimationPreview() {
        if (this.previewAnimationId) {
            cancelAnimationFrame(this.previewAnimationId);
            this.previewAnimationId = null;
        }
    }
}

