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
        this.updateTitle();
    }

    /**
     * Update the panel title with current item name
     */
    updateTitle() {
        const form = document.getElementById('item-form');
        if (!form) return;

        const longName = form.querySelector('[name="longName"]')?.value;
        const name = form.querySelector('[name="name"]')?.value;
        const displayName = longName || name || 'Item';

        document.getElementById('item-editor-title').textContent = `Edit Item: ${displayName}`;
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

        // Character Quiz Section (for character type)
        if (item.type === 'character') {
            const quizSection = this.createSection('Character Quiz');

            const questionField = this.editor.uiManager.createFormField('question', itemSchema.question, item.question, item);
            if (questionField) quizSection.appendChild(questionField);

            // Custom answers field (array of objects)
            quizSection.appendChild(this.createAnswersListField(item.answers || []));

            const correctMsgField = this.editor.uiManager.createFormField('correctMessage', itemSchema.correctMessage, item.correctMessage, item);
            if (correctMsgField) quizSection.appendChild(correctMsgField);

            const incorrectMsgField = this.editor.uiManager.createFormField('incorrectMessage', itemSchema.incorrectMessage, item.incorrectMessage, item);
            if (incorrectMsgField) quizSection.appendChild(incorrectMsgField);

            const rewardField = this.editor.uiManager.createFormField('reward', itemSchema.reward, item.reward, item);
            if (rewardField) quizSection.appendChild(rewardField);

            const outcomeField = this.editor.uiManager.createFormField('outcome', itemSchema.outcome, item.outcome, item);
            if (outcomeField) quizSection.appendChild(outcomeField);

            const charAchievementField = this.editor.uiManager.createFormField('achievement', itemSchema.achievement, item.achievement, item);
            if (charAchievementField) quizSection.appendChild(charAchievementField);

            const charPointsField = this.editor.uiManager.createFormField('points', itemSchema.points, item.points, item);
            if (charPointsField) quizSection.appendChild(charPointsField);

            form.appendChild(quizSection);
        }

        // Achievement Section (for non-character types)
        if (item.type !== 'character') {
            const achievementSection = this.createSection('Achievement');
            const achievementField = this.editor.uiManager.createFormField('achievement', itemSchema.achievement, item.achievement, item);
            if (achievementField) {
                achievementSection.appendChild(achievementField);
                form.appendChild(achievementSection);
            }
        }

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

        // Add change listener for longName to update title
        const longNameInput = form.querySelector('[name="longName"]');
        if (longNameInput) {
            longNameInput.addEventListener('input', () => {
                this.updateTitle();
            });
        }

        // Add change listener for name to update title (fallback if no longName)
        const nameInput = form.querySelector('[name="name"]');
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                this.updateTitle();
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

        // Normalize animation format (convert legacy to new)
        const normalizedAnim = this.normalizeAnimationFormat(animation);

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

        // Base Animation (radio buttons)
        const baseGroup = document.createElement('div');
        baseGroup.className = 'form-group';

        const baseLabel = document.createElement('label');
        baseLabel.textContent = 'Base Animation';
        baseGroup.appendChild(baseLabel);

        const baseRadioContainer = document.createElement('div');
        baseRadioContainer.className = 'radio-group';

        ['none', 'sprite', 'random'].forEach(baseType => {
            const radioWrapper = document.createElement('label');
            radioWrapper.className = 'radio-label';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'animation-base';
            radio.value = baseType;
            radio.checked = normalizedAnim.base === baseType;

            const radioText = document.createElement('span');
            radioText.textContent = baseType.charAt(0).toUpperCase() + baseType.slice(1);

            radioWrapper.appendChild(radio);
            radioWrapper.appendChild(radioText);
            baseRadioContainer.appendChild(radioWrapper);
        });

        baseGroup.appendChild(baseRadioContainer);
        controlsContainer.appendChild(baseGroup);

        // Transform Modifiers (checkboxes)
        const transformsGroup = document.createElement('div');
        transformsGroup.className = 'form-group';

        const transformsLabel = document.createElement('label');
        transformsLabel.textContent = 'Transform Modifiers';
        transformsGroup.appendChild(transformsLabel);

        const transformsCheckboxContainer = document.createElement('div');
        transformsCheckboxContainer.className = 'checkbox-group';

        ['bob', 'pulse', 'spin', 'fade'].forEach(transformType => {
            const checkboxWrapper = document.createElement('label');
            checkboxWrapper.className = 'checkbox-label';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'animation-transforms';
            checkbox.value = transformType;
            checkbox.checked = normalizedAnim.transforms && normalizedAnim.transforms.includes(transformType);

            const checkboxText = document.createElement('span');
            checkboxText.textContent = transformType.charAt(0).toUpperCase() + transformType.slice(1);

            checkboxWrapper.appendChild(checkbox);
            checkboxWrapper.appendChild(checkboxText);
            transformsCheckboxContainer.appendChild(checkboxWrapper);
        });

        transformsGroup.appendChild(transformsCheckboxContainer);
        controlsContainer.appendChild(transformsGroup);

        // Dynamic fields container
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'animation-fields';
        controlsContainer.appendChild(fieldsContainer);

        // Update fields when base or transforms change
        const updateFields = () => {
            const base = container.querySelector('input[name="animation-base"]:checked')?.value || 'none';
            const transforms = Array.from(container.querySelectorAll('input[name="animation-transforms"]:checked')).map(cb => cb.value);

            // Get current animation data from form (to preserve user changes)
            const currentAnimData = this.getCurrentAnimationData(container, normalizedAnim);

            fieldsContainer.innerHTML = '';

            // Global speed field (if any animation is active)
            if (base !== 'none' || transforms.length > 0) {
                fieldsContainer.appendChild(this.createNumberInput('animation-speed', 'Speed', currentAnimData.speed || 1, 'Animation speed multiplier'));
            }

            // Base-specific fields
            if (base === 'sprite') {
                fieldsContainer.appendChild(this.createSpriteFields(currentAnimData));
            } else if (base === 'random') {
                fieldsContainer.appendChild(this.createNumberInput('animation-count', 'Count', currentAnimData.count !== undefined ? currentAnimData.count : 5, 'Number of items on screen'));
                fieldsContainer.appendChild(this.createNumberInput('animation-randomness', 'Randomness', currentAnimData.randomness !== undefined ? currentAnimData.randomness : 50, 'How random the movement is (0-100)'));
                fieldsContainer.appendChild(this.createNumberInput('animation-rotation', 'Rotation', currentAnimData.rotation !== undefined ? currentAnimData.rotation : 5, 'Rotation speed (0=none, 9=fast)'));
            }

            // Transform-specific fields
            if (transforms.includes('bob')) {
                fieldsContainer.appendChild(this.createNumberInput('animation-bobAmplitude', 'Bob Amplitude', currentAnimData.bobAmplitude || 10, 'Vertical movement distance in pixels'));
            }
            if (transforms.includes('pulse')) {
                fieldsContainer.appendChild(this.createNumberInput('animation-pulseAmplitude', 'Pulse Amplitude', currentAnimData.pulseAmplitude || 10, 'Scale change percentage'));
            }
            if (transforms.includes('fade')) {
                fieldsContainer.appendChild(this.createNumberInput('animation-fadeMin', 'Fade Min Opacity', currentAnimData.fadeMin !== undefined ? currentAnimData.fadeMin : 0.5, 'Minimum opacity (0-1)', 0, 1, 0.1));
                fieldsContainer.appendChild(this.createNumberInput('animation-fadeMax', 'Fade Max Opacity', currentAnimData.fadeMax !== undefined ? currentAnimData.fadeMax : 1.0, 'Maximum opacity (0-1)', 0, 1, 0.1));
            }

            // Start preview
            this.startAnimationPreview(base, transforms, currentAnimData);
        };

        // Listen for changes
        container.addEventListener('change', updateFields);
        container.addEventListener('input', () => {
            const base = container.querySelector('input[name="animation-base"]:checked')?.value || 'none';
            const transforms = Array.from(container.querySelectorAll('input[name="animation-transforms"]:checked')).map(cb => cb.value);
            this.updateAnimationPreview(base, transforms);
        });

        // Initial render
        updateFields();

        return container;
    }

    /**
     * Normalize animation format - convert legacy to new format
     */
    normalizeAnimationFormat(animation) {
        if (!animation) return { base: 'none', transforms: [] };

        // If already in new format, return as-is
        if (animation.base !== undefined || animation.transforms !== undefined) {
            return {
                base: animation.base || 'none',
                transforms: animation.transforms || [],
                ...animation
            };
        }

        // Convert legacy format
        const legacy = animation.type;
        if (!legacy) return { base: 'none', transforms: [], ...animation };

        // Legacy sprite or random becomes base
        if (legacy === 'sprite' || legacy === 'random') {
            return {
                base: legacy,
                transforms: [],
                ...animation
            };
        }

        // Legacy transform types (bob, pulse, spin, fade) become transforms
        return {
            base: 'none',
            transforms: [legacy],
            bobAmplitude: legacy === 'bob' ? animation.amplitude : undefined,
            pulseAmplitude: legacy === 'pulse' ? animation.amplitude : undefined,
            ...animation
        };
    }

    /**
     * Get current animation data from form fields
     * This preserves user changes when re-rendering fields
     */
    getCurrentAnimationData(container, fallbackData) {
        const form = document.getElementById('item-form');
        if (!form) return fallbackData;

        const data = { ...fallbackData };

        // Get speed
        const speedInput = form.querySelector('[name="animation-speed"]');
        if (speedInput && speedInput.value) {
            data.speed = Number(speedInput.value);
        }

        // Get sprite frames (if they exist)
        const frameInputs = form.querySelectorAll('.frames-list input[type="text"]');
        if (frameInputs.length > 0) {
            const frames = [];
            frameInputs.forEach(input => {
                if (input.value.trim()) {
                    frames.push(input.value.trim());
                }
            });
            if (frames.length > 0) {
                data.frames = frames;
            }
        }

        // Get sprite sheet data
        const spriteSheetInput = form.querySelector('[name="animation-spritesheet"]');
        if (spriteSheetInput && spriteSheetInput.value) {
            data.spriteSheet = spriteSheetInput.value;
        }

        const frameWidthInput = form.querySelector('[name="animation-framewidth"]');
        if (frameWidthInput && frameWidthInput.value) {
            data.frameWidth = Number(frameWidthInput.value);
        }

        const frameHeightInput = form.querySelector('[name="animation-frameheight"]');
        if (frameHeightInput && frameHeightInput.value) {
            data.frameHeight = Number(frameHeightInput.value);
        }

        const frameCountInput = form.querySelector('[name="animation-framecount"]');
        if (frameCountInput && frameCountInput.value) {
            data.frameCount = Number(frameCountInput.value);
        }

        const fpsInput = form.querySelector('[name="animation-fps"]');
        if (fpsInput && fpsInput.value) {
            data.fps = Number(fpsInput.value);
        }

        // Get random animation data
        const countInput = form.querySelector('[name="animation-count"]');
        if (countInput && countInput.value) {
            data.count = Number(countInput.value);
        }

        const randomnessInput = form.querySelector('[name="animation-randomness"]');
        if (randomnessInput && randomnessInput.value) {
            data.randomness = Number(randomnessInput.value);
        }

        const rotationInput = form.querySelector('[name="animation-rotation"]');
        if (rotationInput && rotationInput.value) {
            data.rotation = Number(rotationInput.value);
        }

        // Get transform-specific data
        const bobAmplitudeInput = form.querySelector('[name="animation-bobAmplitude"]');
        if (bobAmplitudeInput && bobAmplitudeInput.value) {
            data.bobAmplitude = Number(bobAmplitudeInput.value);
        }

        const pulseAmplitudeInput = form.querySelector('[name="animation-pulseAmplitude"]');
        if (pulseAmplitudeInput && pulseAmplitudeInput.value) {
            data.pulseAmplitude = Number(pulseAmplitudeInput.value);
        }

        const fadeMinInput = form.querySelector('[name="animation-fadeMin"]');
        if (fadeMinInput && fadeMinInput.value !== '') {
            data.fadeMin = Number(fadeMinInput.value);
        }

        const fadeMaxInput = form.querySelector('[name="animation-fadeMax"]');
        if (fadeMaxInput && fadeMaxInput.value !== '') {
            data.fadeMax = Number(fadeMaxInput.value);
        }

        return data;
    }

    /**
     * Create number input helper
     */
    createNumberInput(name, label, value, help, min = 0, max = null, step = 0.1) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        formGroup.appendChild(labelEl);

        const input = document.createElement('input');
        input.type = 'number';
        input.name = name;
        input.value = value !== undefined && value !== null ? value : '';
        input.step = step.toString();
        input.min = min.toString();
        if (max !== null) {
            input.max = max.toString();
        }
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
        console.log('🎬 createSpriteFields called with animation:', JSON.stringify(animation, null, 2));

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
        console.log('🎬 animation.frames length:', animation?.frames?.length);

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
            // Query within the container, not the entire document
            const mode = container.querySelector('input[name="sprite-mode"]:checked')?.value;
            console.log('🔧 updateSpriteFields called, mode:', mode);
            console.log('🔧 animation object:', animation);
            console.log('🔧 animation.frames:', animation?.frames);
            spriteFieldsContainer.innerHTML = '';

            if (mode === 'multiple') {
                console.log('🔧 Creating multiple sprite fields');
                // FPS input
                spriteFieldsContainer.appendChild(this.createNumberInput('animation-fps', 'FPS', animation?.fps || 12, 'Frames per second'));

                // Frames list
                console.log('🔧 About to call createFramesListField with:', animation?.frames);
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
        console.log('📋 createFramesListField called with frames:', JSON.stringify(frames, null, 2));
        console.log('📋 frames is array?', Array.isArray(frames));
        console.log('📋 frames length:', frames?.length);

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
            console.log('📋 No existing frames to render - frames:', frames);
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
                answersList.appendChild(this.createAnswerItem(answer, index));
            });
        } else {
            // Add two default empty answers
            answersList.appendChild(this.createAnswerItem({ text: '', isCorrect: false }, 0));
            answersList.appendChild(this.createAnswerItem({ text: '', isCorrect: false }, 1));
        }

        container.appendChild(answersList);

        // Add answer button
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn btn-secondary btn-sm';
        addBtn.textContent = '+ Add Answer';
        addBtn.addEventListener('click', () => {
            const index = answersList.children.length;
            answersList.appendChild(this.createAnswerItem({ text: '', isCorrect: false }, index));
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

        // Radio button for correct answer (styled like checkbox)
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
                name.startsWith('answer-') || name === 'answer-correct' ||
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
        
        // Build animation object from fields (new layered format)
        const animationBase = form.querySelector('input[name="animation-base"]:checked')?.value;
        const animationTransforms = Array.from(form.querySelectorAll('input[name="animation-transforms"]:checked')).map(cb => cb.value);

        console.log('🎨 Animation Base:', animationBase);
        console.log('🎨 Animation Transforms:', animationTransforms);

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
                console.log('🎬 Sprite Mode:', spriteMode);

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

        // Build answers array from answer fields (for character type)
        const answersList = form.querySelector('.answers-list');
        if (answersList) {
            const answers = [];
            const answerItems = answersList.querySelectorAll('.answer-item');

            // Find which answer item has the checked radio button
            let correctItemIndex = -1;
            answerItems.forEach((answerItem, idx) => {
                const radio = answerItem.querySelector('input[type="radio"]');
                if (radio && radio.checked) {
                    correctItemIndex = idx;
                }
            });

            // Build answers array
            answerItems.forEach((answerItem, index) => {
                const textInput = answerItem.querySelector('input[type="text"]');
                const text = textInput?.value?.trim();

                if (text) {
                    answers.push({
                        text: text,
                        isCorrect: index === correctItemIndex
                    });
                }
            });

            if (answers.length > 0) {
                formData.answers = answers;
            }
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
     * @param {string} base - Base animation type (sprite/random/none)
     * @param {Array} transforms - Array of transform types (bob/pulse/spin/fade)
     * @param {Object} animationData - Full animation configuration
     */
    startAnimationPreview(base, transforms, animationData) {
        console.log('🎬 startAnimationPreview called with base:', base, 'transforms:', transforms);

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
     * @param {string} base - Base animation type
     * @param {Array} transforms - Array of transform types
     */
    updateAnimationPreview(base, transforms) {
        // Restart preview with current settings
        this.startAnimationPreview(base, transforms, null);
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

