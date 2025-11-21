/**
 * Storage Manager - IndexedDB wrapper for managing multiple game projects
 */

export class StorageManager {
    constructor() {
        this.dbName = 'GameDataEditorDB';
        this.dbVersion = 1;
        this.storeName = 'projects';
        this.db = null;
        this.currentProjectId = null;
        this.lastProjectKey = 'lastOpenedProjectId';
    }
    
    /**
     * Initialize IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create projects store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('lastModified', 'lastModified', { unique: false });
                    console.log('Created projects object store');
                }
            };
        });
    }
    
    /**
     * Save project to IndexedDB
     */
    async saveProject(name, gameData, id = null) {
        if (!this.db) await this.init();

        console.log('[StorageManager] saveProject called');
        console.log('[StorageManager] Name:', name);
        console.log('[StorageManager] ID:', id);
        console.log('[StorageManager] GameData:', gameData);
        console.log('[StorageManager] Scenes in gameData:', gameData.scenes?.length || 0);
        console.log('[StorageManager] Items in gameData:', gameData.sceneItems?.length || 0);

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);

            const project = {
                name: name,
                gameData: gameData,
                lastModified: new Date().toISOString(),
                created: id ? undefined : new Date().toISOString(),
                editorState: gameData.editorState || {} // Store editor-specific state (like locked items)
            };

            if (id) {
                project.id = id;
            }

            console.log('[StorageManager] Project object to save:', project);

            const request = objectStore.put(project);

            request.onsuccess = () => {
                const savedId = request.result;
                this.currentProjectId = savedId;
                console.log('[StorageManager] Project saved successfully with ID:', savedId);
                resolve(savedId);
            };

            request.onerror = () => {
                console.error('[StorageManager] Save error:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Load project from IndexedDB
     */
    async loadProject(id) {
        if (!this.db) await this.init();

        console.log('[StorageManager] loadProject called with ID:', id);

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(id);

            request.onsuccess = () => {
                if (request.result) {
                    this.currentProjectId = id;
                    console.log('[StorageManager] Project loaded:', id);
                    console.log('[StorageManager] Loaded data:', request.result);
                    console.log('[StorageManager] Scenes in loaded data:', request.result.gameData?.scenes?.length || 0);
                    console.log('[StorageManager] Items in loaded data:', request.result.gameData?.sceneItems?.length || 0);

                    // Restore editorState if it exists
                    if (request.result.editorState) {
                        request.result.gameData.editorState = request.result.editorState;
                    }

                    resolve(request.result);
                } else {
                    console.error('[StorageManager] Project not found:', id);
                    reject(new Error('Project not found'));
                }
            };

            request.onerror = () => {
                console.error('[StorageManager] Load error:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Delete project from IndexedDB
     */
    async deleteProject(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete(id);
            
            request.onsuccess = () => {
                if (this.currentProjectId === id) {
                    this.currentProjectId = null;
                }
                console.log('Project deleted:', id);
                resolve();
            };
            
            request.onerror = () => {
                console.error('Delete error:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Get all projects
     */
    async getAllProjects() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAll();
            
            request.onsuccess = () => {
                console.log('Retrieved all projects:', request.result.length);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('GetAll error:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Rename project
     */
    async renameProject(id, newName) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const getRequest = objectStore.get(id);
            
            getRequest.onsuccess = () => {
                const project = getRequest.result;
                if (!project) {
                    reject(new Error('Project not found'));
                    return;
                }
                
                project.name = newName;
                project.lastModified = new Date().toISOString();
                
                const putRequest = objectStore.put(project);
                
                putRequest.onsuccess = () => {
                    console.log('Project renamed:', id, newName);
                    resolve();
                };
                
                putRequest.onerror = () => {
                    console.error('Rename error:', putRequest.error);
                    reject(putRequest.error);
                };
            };
            
            getRequest.onerror = () => {
                console.error('Get error:', getRequest.error);
                reject(getRequest.error);
            };
        });
    }
    
    /**
     * Duplicate project
     */
    async duplicateProject(id) {
        if (!this.db) await this.init();
        
        const project = await this.loadProject(id);
        const newName = `${project.name} (Copy)`;
        const newId = await this.saveProject(newName, project.gameData);
        return newId;
    }
    
    /**
     * Auto-save current project
     */
    async autoSave(gameData) {
        if (!this.currentProjectId) {
            console.warn('No current project to auto-save');
            return null;
        }
        
        const project = await this.loadProject(this.currentProjectId);
        return await this.saveProject(project.name, gameData, this.currentProjectId);
    }
    
    /**
     * Export project as gameData.js file
     */
    exportProject(project, dataManager) {
        // Use the existing data manager's export functionality
        const tempData = dataManager.editor.data;
        dataManager.editor.data = project.gameData;
        dataManager.exportData();
        dataManager.editor.data = tempData;
    }
    
    /**
     * Get current project info
     */
    async getCurrentProject() {
        if (!this.currentProjectId) return null;
        return await this.loadProject(this.currentProjectId);
    }
    
    /**
     * Clear all projects (for testing/reset)
     */
    async clearAllProjects() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.clear();
            
            request.onsuccess = () => {
                this.currentProjectId = null;
                console.log('All projects cleared');
                resolve();
            };
            
            request.onerror = () => {
                console.error('Clear error:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Get storage statistics
     */
    async getStats() {
        const projects = await this.getAllProjects();

        let totalSize = 0;
        projects.forEach(project => {
            const jsonStr = JSON.stringify(project.gameData);
            totalSize += jsonStr.length;
        });

        return {
            projectCount: projects.length,
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            currentProjectId: this.currentProjectId
        };
    }

    /**
     * Save last opened project ID to localStorage
     */
    setLastOpenedProject(projectId) {
        try {
            localStorage.setItem(this.lastProjectKey, projectId);
            console.log('💾 Last opened project saved:', projectId);
        } catch (error) {
            console.warn('Failed to save last opened project:', error);
        }
    }

    /**
     * Get last opened project ID from localStorage
     */
    getLastOpenedProject() {
        try {
            const projectId = localStorage.getItem(this.lastProjectKey);
            if (projectId) {
                console.log('💾 Last opened project found:', projectId);
                return parseInt(projectId, 10);
            }
            return null;
        } catch (error) {
            console.warn('Failed to get last opened project:', error);
            return null;
        }
    }

    /**
     * Clear last opened project from localStorage
     */
    clearLastOpenedProject() {
        try {
            localStorage.removeItem(this.lastProjectKey);
            console.log('💾 Last opened project cleared');
        } catch (error) {
            console.warn('Failed to clear last opened project:', error);
        }
    }
}

