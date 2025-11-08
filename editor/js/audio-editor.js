export class AudioEditor {
    constructor(editor) {
        this.editor = editor;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Audio form submission
        const audioForm = document.getElementById('audio-form');
        if (audioForm) {
            audioForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.save();
            });
        }
    }

    /**
     * Show audio editor
     */
    show() {
        this.editor.uiManager.showPanel('audio-editor');
        this.render();
    }

    /**
     * Render audio configuration form
     */
    render() {
        const form = document.getElementById('audio-form');
        if (!form) return;

        const gameData = this.editor.data;
        const audio = gameData.audio || { ambient: {}, sounds: {} };

        form.innerHTML = `
            <!-- Ambient Music Section -->
            <div class="form-section">
                <h3 class="form-section-title">🎵 Ambient Music</h3>
                <p class="form-section-description">Background music tracks that loop during gameplay</p>
                
                <div class="audio-list" id="ambient-list">
                    ${this.renderAudioList(audio.ambient || {}, 'ambient')}
                </div>
                <button type="button" id="add-ambient-btn" class="btn btn-secondary btn-sm">
                    ➕ Add Ambient Track
                </button>
            </div>

            <!-- Sound Effects Section -->
            <div class="form-section">
                <h3 class="form-section-title">🔔 Sound Effects</h3>
                <p class="form-section-description">Sound effects triggered by game events</p>
                
                <div class="audio-list" id="sounds-list">
                    ${this.renderAudioList(audio.sounds || {}, 'sounds')}
                </div>
                <button type="button" id="add-sound-btn" class="btn btn-secondary btn-sm">
                    ➕ Add Sound Effect
                </button>
            </div>
        `;

        // Setup add buttons
        document.getElementById('add-ambient-btn')?.addEventListener('click', () => {
            this.addAudioEntry('ambient');
        });

        document.getElementById('add-sound-btn')?.addEventListener('click', () => {
            this.addAudioEntry('sounds');
        });

        // Setup delete buttons
        form.querySelectorAll('.delete-audio-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                const type = e.target.dataset.type;
                this.deleteAudioEntry(type, key);
            });
        });
    }

    /**
     * Render audio list for a section
     */
    renderAudioList(audioObj, type) {
        const entries = Object.entries(audioObj);
        
        if (entries.length === 0) {
            return '<p class="empty-message">No audio files configured</p>';
        }

        return entries.map(([key, path]) => `
            <div class="audio-entry">
                <div class="audio-entry-fields">
                    <div class="form-group">
                        <label>Key</label>
                        <input 
                            type="text" 
                            class="audio-key" 
                            value="${key}" 
                            data-original-key="${key}"
                            data-type="${type}"
                        />
                    </div>
                    <div class="form-group">
                        <label>File Path</label>
                        <input 
                            type="text" 
                            class="audio-path" 
                            value="${path || ''}" 
                            placeholder="audio/filename.mp3"
                            data-key="${key}"
                            data-type="${type}"
                        />
                    </div>
                </div>
                <button 
                    type="button" 
                    class="btn btn-danger btn-sm delete-audio-btn" 
                    data-key="${key}"
                    data-type="${type}"
                    title="Delete"
                >
                    🗑️
                </button>
            </div>
        `).join('');
    }

    /**
     * Add new audio entry
     */
    addAudioEntry(type) {
        const gameData = this.editor.data;
        if (!gameData.audio) {
            gameData.audio = { ambient: {}, sounds: {} };
        }
        if (!gameData.audio[type]) {
            gameData.audio[type] = {};
        }

        // Generate unique key
        let counter = 1;
        let newKey = type === 'ambient' ? `ambient${counter}` : `sound${counter}`;
        while (gameData.audio[type][newKey]) {
            counter++;
            newKey = type === 'ambient' ? `ambient${counter}` : `sound${counter}`;
        }

        gameData.audio[type][newKey] = '';
        this.render();
        this.showAutoSaveFeedback();
    }

    /**
     * Delete audio entry
     */
    deleteAudioEntry(type, key) {
        if (!confirm(`Delete audio entry "${key}"?`)) {
            return;
        }

        const gameData = this.editor.data;
        if (gameData.audio && gameData.audio[type]) {
            delete gameData.audio[type][key];
            this.render();
            this.showAutoSaveFeedback();
        }
    }

    /**
     * Save audio configuration
     */
    save() {
        const gameData = this.editor.data;
        if (!gameData.audio) {
            gameData.audio = { ambient: {}, sounds: {} };
        }

        // Collect all audio entries
        const newAudio = { ambient: {}, sounds: {} };

        // Process ambient tracks
        document.querySelectorAll('.audio-key[data-type="ambient"]').forEach(keyInput => {
            const originalKey = keyInput.dataset.originalKey;
            const newKey = keyInput.value.trim();
            const pathInput = document.querySelector(`.audio-path[data-key="${originalKey}"][data-type="ambient"]`);
            const path = pathInput ? pathInput.value.trim() : '';

            if (newKey) {
                newAudio.ambient[newKey] = path;
            }
        });

        // Process sound effects
        document.querySelectorAll('.audio-key[data-type="sounds"]').forEach(keyInput => {
            const originalKey = keyInput.dataset.originalKey;
            const newKey = keyInput.value.trim();
            const pathInput = document.querySelector(`.audio-path[data-key="${originalKey}"][data-type="sounds"]`);
            const path = pathInput ? pathInput.value.trim() : '';

            if (newKey) {
                newAudio.sounds[newKey] = path;
            }
        });

        gameData.audio = newAudio;
        this.showAutoSaveFeedback();

        return true;
    }

    /**
     * Save if form is valid
     */
    saveIfValid() {
        return this.save();
    }

    /**
     * Show auto-save feedback
     */
    showAutoSaveFeedback() {
        const indicator = document.getElementById('autosave-indicator');
        if (indicator) {
            indicator.textContent = '✓ Audio saved';
            indicator.style.opacity = '1';
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 1500);
        }
    }
}

