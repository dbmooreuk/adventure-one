/**
 * Project Manager - UI for managing multiple game projects
 */

export class ProjectManager {
    constructor(editor, storageManager) {
        this.editor = editor;
        this.storage = storageManager;
        this.autoSaveInterval = null;
        this.autoSaveDelay = 30000; // 30 seconds
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Projects button
        document.getElementById('projects-btn').addEventListener('click', () => {
            this.showProjectsModal();
        });
        
        // Save project button
        document.getElementById('save-project-btn').addEventListener('click', () => {
            this.saveCurrentProject();
        });
        
        // New project button
        document.getElementById('new-project-btn').addEventListener('click', () => {
            this.createNewProject();
        });
    }
    
    /**
     * Show projects management modal
     */
    async showProjectsModal() {
        const projects = await this.storage.getAllProjects();
        
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalActions = document.getElementById('modal-actions');
        
        modalTitle.textContent = '📁 Manage Projects';
        
        // Build projects list
        let html = '<div class="projects-list">';
        
        if (projects.length === 0) {
            html += '<p style="text-align: center; color: var(--text-muted); padding: 40px;">No saved projects yet.</p>';
        } else {
            projects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
            
            projects.forEach(project => {
                const isActive = project.id === this.storage.currentProjectId;
                const date = new Date(project.lastModified);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                
                html += `
                    <div class="project-item ${isActive ? 'active' : ''}" data-project-id="${project.id}">
                        <div class="project-info">
                            <div class="project-name">${this.escapeHtml(project.name)}</div>
                            <div class="project-meta">
                                ${project.gameData.scenes.length} scenes, ${project.gameData.sceneItems.length} items
                                <span class="project-date">Modified: ${dateStr}</span>
                            </div>
                        </div>
                        <div class="project-actions">
                            <button class="btn btn-sm" onclick="window.projectManager.loadProject(${project.id})" title="Load">
                                📂 Load
                            </button>
                            <button class="btn btn-sm" onclick="window.projectManager.renameProject(${project.id})" title="Rename">
                                ✏️
                            </button>
                            <button class="btn btn-sm" onclick="window.projectManager.duplicateProject(${project.id})" title="Duplicate">
                                📋
                            </button>
                            <button class="btn btn-sm" onclick="window.projectManager.exportProject(${project.id})" title="Export">
                                💾
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.projectManager.deleteProject(${project.id})" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        
        // Add storage stats
        const stats = await this.storage.getStats();
        html += `
            <div class="storage-stats">
                <strong>Storage:</strong> ${stats.projectCount} projects, ${stats.totalSizeKB} KB used
            </div>
        `;
        
        modalBody.innerHTML = html;
        
        // Modal actions
        modalActions.innerHTML = `
            <button class="btn btn-secondary" onclick="document.getElementById('modal').style.display='none'">Close</button>
        `;
        
        modal.style.display = 'flex';
    }
    
    /**
     * Create new project
     */
    async createNewProject() {
        const name = prompt('Enter project name:', 'New Game Project');
        if (!name) return;
        
        const newData = {
            title: name,
            version: "1.0.0",
            scenes: [],
            sceneItems: []
        };
        
        try {
            const id = await this.storage.saveProject(name, newData);
            await this.loadProject(id);
            this.editor.uiManager.setStatus(`Created new project: ${name}`, 'success');
        } catch (error) {
            console.error('Create project error:', error);
            this.editor.uiManager.setStatus('Failed to create project', 'danger');
        }
    }
    
    /**
     * Save current project
     */
    async saveCurrentProject() {
        // First, save any current work (scene/item/code being edited)
        this.editor.saveCurrentWork();

        if (!this.storage.currentProjectId) {
            // No current project, prompt for name
            const name = prompt('Enter project name:', this.editor.data.title || 'My Game Project');
            if (!name) return;

            try {
                console.log('Saving new project:', name);
                console.log('Data to save:', this.editor.data);
                console.log('Scenes count:', this.editor.data.scenes.length);
                console.log('Items count:', this.editor.data.sceneItems.length);

                const id = await this.storage.saveProject(name, this.editor.data);
                this.updateProjectTitle(name);
                this.editor.uiManager.setStatus(`Project saved: ${name}`, 'success');

                console.log('Project saved with ID:', id);
            } catch (error) {
                console.error('Save error:', error);
                this.editor.uiManager.setStatus('Failed to save project', 'danger');
            }
        } else {
            // Update existing project
            try {
                const project = await this.storage.getCurrentProject();
                console.log('Updating existing project:', project.name);
                console.log('Data to save:', this.editor.data);
                console.log('Scenes count:', this.editor.data.scenes.length);
                console.log('Items count:', this.editor.data.sceneItems.length);

                await this.storage.saveProject(project.name, this.editor.data, this.storage.currentProjectId);
                this.editor.uiManager.setStatus(`Project saved: ${project.name}`, 'success');

                console.log('Project updated successfully');
            } catch (error) {
                console.error('Save error:', error);
                this.editor.uiManager.setStatus('Failed to save project', 'danger');
            }
        }
    }
    
    /**
     * Load project
     */
    async loadProject(id) {
        try {
            console.log('Loading project with ID:', id);
            const project = await this.storage.loadProject(id);
            console.log('Loaded project:', project.name);
            console.log('Project data:', project.gameData);
            console.log('Scenes in loaded data:', project.gameData.scenes.length);
            console.log('Items in loaded data:', project.gameData.sceneItems.length);

            this.editor.loadData(project.gameData);
            this.updateProjectTitle(project.name);
            this.editor.uiManager.setStatus(`Loaded project: ${project.name}`, 'success');

            // Close modal if open
            document.getElementById('modal').style.display = 'none';

            // Start auto-save
            this.startAutoSave();
        } catch (error) {
            console.error('Load error:', error);
            this.editor.uiManager.setStatus('Failed to load project', 'danger');
        }
    }
    
    /**
     * Delete project
     */
    async deleteProject(id) {
        const project = await this.storage.loadProject(id);
        
        if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
            return;
        }
        
        try {
            await this.storage.deleteProject(id);
            this.editor.uiManager.setStatus(`Deleted project: ${project.name}`, 'success');
            
            // Refresh modal
            this.showProjectsModal();
            
            // If we deleted the current project, clear editor
            if (id === this.storage.currentProjectId) {
                this.editor.loadData({
                    title: "Adventure Game",
                    version: "2.0.0",
                    scenes: [],
                    sceneItems: []
                });
                this.updateProjectTitle('Untitled Project');
                this.stopAutoSave();
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.editor.uiManager.setStatus('Failed to delete project', 'danger');
        }
    }
    
    /**
     * Rename project
     */
    async renameProject(id) {
        const project = await this.storage.loadProject(id);
        const newName = prompt('Enter new name:', project.name);
        
        if (!newName || newName === project.name) return;
        
        try {
            await this.storage.renameProject(id, newName);
            this.editor.uiManager.setStatus(`Renamed to: ${newName}`, 'success');
            
            // Update title if this is current project
            if (id === this.storage.currentProjectId) {
                this.updateProjectTitle(newName);
            }
            
            // Refresh modal
            this.showProjectsModal();
        } catch (error) {
            console.error('Rename error:', error);
            this.editor.uiManager.setStatus('Failed to rename project', 'danger');
        }
    }
    
    /**
     * Duplicate project
     */
    async duplicateProject(id) {
        try {
            const newId = await this.storage.duplicateProject(id);
            this.editor.uiManager.setStatus('Project duplicated', 'success');
            
            // Refresh modal
            this.showProjectsModal();
        } catch (error) {
            console.error('Duplicate error:', error);
            this.editor.uiManager.setStatus('Failed to duplicate project', 'danger');
        }
    }
    
    /**
     * Export project as gameData.js
     */
    async exportProject(id) {
        try {
            const project = await this.storage.loadProject(id);
            this.storage.exportProject(project, this.editor.dataManager);
        } catch (error) {
            console.error('Export error:', error);
            this.editor.uiManager.setStatus('Failed to export project', 'danger');
        }
    }
    
    /**
     * Update project title in UI
     */
    updateProjectTitle(name) {
        const titleEl = document.getElementById('current-project-name');
        if (titleEl) {
            titleEl.textContent = name;
        }
    }
    
    /**
     * Start auto-save
     */
    startAutoSave() {
        this.stopAutoSave(); // Clear any existing interval
        
        this.autoSaveInterval = setInterval(async () => {
            if (this.storage.currentProjectId) {
                try {
                    console.log('Auto-saving project...');
                    console.log('Current data scenes:', this.editor.data.scenes.length);
                    console.log('Current data items:', this.editor.data.sceneItems.length);

                    await this.storage.autoSave(this.editor.data);
                    console.log('Auto-saved project successfully');

                    // Show subtle indicator
                    const indicator = document.getElementById('autosave-indicator');
                    if (indicator) {
                        indicator.style.opacity = '1';
                        setTimeout(() => {
                            indicator.style.opacity = '0';
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Auto-save error:', error);
                }
            }
        }, this.autoSaveDelay);
    }
    
    /**
     * Stop auto-save
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
    
    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

