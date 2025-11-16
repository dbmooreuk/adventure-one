/**
 * Scene Properties Panel - Edit scene-level properties in composer
 */

export class ScenePropertiesPanel {
    constructor(editor) {
        this.editor = editor;
        this.currentScene = null;
    }

    /**
     * Show properties for the current scene
     */
    showSceneProperties(scene) {
        this.currentScene = scene;
        const container = document.getElementById('scene-properties-container');
        if (!container) return;

        // Build the form
        container.innerHTML = '';

        const form = document.createElement('form');
        form.className = 'scene-properties-form';
        form.id = 'scene-properties-form';

        // Scene Name (read-only identifier)
        form.appendChild(this.createField('sceneName', 'Scene Name', scene.sceneName, 'text', true));

        // Title
        form.appendChild(this.createField('title', 'Title', scene.title || '', 'text'));

        // Text One
        form.appendChild(this.createField('textOne', 'Text One', scene.textOne || '', 'textarea'));

        // Stage
        form.appendChild(this.createField('stage', 'Stage', scene.stage || '', 'text'));

        // Background Color
        form.appendChild(this.createField('backgroundColor', 'Background Color', scene.backgroundColor || '', 'text'));

        // Background Image
        form.appendChild(this.createField('backgroundImage', 'Background Image', scene.backgroundImage || '', 'text'));

        // Add change listeners to all inputs
        form.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', () => this.handlePropertyChange());
        });

        container.appendChild(form);
    }

    /**
     * Create a form field
     */
    createField(name, label, value, type = 'text', readonly = false) {
        const group = document.createElement('div');
        group.className = 'form-group';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.htmlFor = `scene-${name}`;
        group.appendChild(labelEl);

        let input;
        if (type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
        } else {
            input = document.createElement('input');
            input.type = type;
        }

        input.id = `scene-${name}`;
        input.name = name;
        input.className = 'form-control';
        input.value = value || '';
        
        if (readonly) {
            input.readOnly = true;
            input.classList.add('readonly');
        }

        group.appendChild(input);

        return group;
    }

    /**
     * Handle property changes
     */
    handlePropertyChange() {
        if (!this.currentScene) return;

        const form = document.getElementById('scene-properties-form');
        if (!form) return;

        // Get form data
        const formData = new FormData(form);
        const updates = {};

        // Collect all values
        for (const [key, value] of formData.entries()) {
            if (key !== 'sceneName') { // Don't update sceneName (it's readonly)
                updates[key] = value;
            }
        }

        console.log('📝 Scene Properties - Updates:', updates);

        // Update the scene in the data
        const sceneIndex = this.editor.data.scenes.findIndex(s => s.sceneName === this.currentScene.sceneName);
        if (sceneIndex !== -1) {
            Object.assign(this.editor.data.scenes[sceneIndex], updates);

            // Update currentScene reference
            this.currentScene = this.editor.data.scenes[sceneIndex];

            // Trigger auto-save
            this.editor.saveCurrentWork();

            // Update the composer background if backgroundColor or backgroundImage changed
            if (updates.backgroundColor !== undefined || updates.backgroundImage !== undefined) {
                this.updateComposerBackground();
            }

            console.log('✓ Scene properties updated');
        }
    }

    /**
     * Update composer background
     */
    updateComposerBackground() {
        if (!this.editor.sceneComposer || !this.editor.sceneComposer.currentScene) return;

        // Reload the background using the scene composer's method
        this.editor.sceneComposer.loadBackground(this.currentScene.backgroundImage);
    }

    /**
     * Clear the scene properties panel
     */
    clear() {
        this.currentScene = null;
        const container = document.getElementById('scene-properties-container');
        if (container) {
            container.innerHTML = `
                <div class="properties-empty-state">
                    <p>Load a scene in the composer to edit its properties</p>
                </div>
            `;
        }
    }
}

