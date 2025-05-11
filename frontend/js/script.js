// PowerBrowser - Main JavaScript functionality with Backend API Integration
// Version 1.0.2 - Enhanced with animations and improved performance
document.addEventListener('DOMContentLoaded', function() {
    // API Base URL
    const API_BASE_URL = 'http://localhost:5000/api';
    const MOCK_GOOGLE_SEARCH = true; // Set to true to use mock Google search instead of real Google
    
    // DOM Elements
    const urlInput = document.getElementById('url-input');
    const searchInput = document.getElementById('search-input');
    const browserFrame = document.getElementById('browser-frame');
    const startPage = document.querySelector('.start-page');
    const backButton = document.getElementById('back-button');
    const forwardButton = document.getElementById('forward-button');
    const refreshButton = document.getElementById('refresh-button');
    const homeButton = document.getElementById('home-button');
    const searchButton = document.getElementById('search-button');
    const mainSearchButton = document.getElementById('main-search-button');
    const newTabButton = document.getElementById('new-tab-button');
    const tabsContainer = document.querySelector('.tabs-container');
    const settingsButton = document.getElementById('settings-button');
    const securityButton = document.getElementById('security-button');
    const aboutButton = document.getElementById('about-button');
    const settingsModal = document.getElementById('settings-modal');
    const securityModal = document.getElementById('security-modal');
    const aboutModal = document.getElementById('about-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const saveSettingsButton = document.querySelector('.save-settings');
    const cancelSettingsButton = document.querySelector('.cancel-settings');
    const securityActionButtons = document.querySelectorAll('.security-action-button');
    const bookmarkButton = document.getElementById('bookmark-button');
    const memoryUsage = document.getElementById('memory-usage');
    const cpuUsage = document.getElementById('cpu-usage');
    const emptyTabTemplate = document.getElementById('empty-tab-template');

    // Browser state (will be synced with backend)
    let currentTabs = [];
    let activeTabId = '';
    let browserHistory = [];
    let currentHistoryIndex = -1;
    let bookmarks = [];
    let securityStats = {
        trackersBlocked: 0,
        adsBlocked: 0,
        securityScore: 100
    };

    // Settings (will be synced with backend)
    let settings = {
        startPage: 'home',
        newTabPage: 'home',
        searchEngine: 'google',
        blockCookies: true,
        blockTrackers: true,
        blockAds: true,
        forceHttps: true,
        theme: 'light',
        fontSize: 'medium'
    };

    // Initialize
    async function init() {
        try {
            // Show loading screen
            showLoadingScreen();
            
            // Fetch initial data from backend
            await Promise.all([
                fetchTabs(),
                fetchSettings(),
                fetchSecurityStats()
            ]);
            
            // Start system monitoring
            startSystemMonitoring();
            
            // Set up event listeners
            setupEventListeners();
            
            // Update UI
            renderTabs();
            updateNavButtons();
            updateSecurityStats();
            
            // Add version information to the footer
            addVersionInfo();
            
            // Hide loading screen with animation
            hideLoadingScreen();
        } catch (error) {
            console.error('Initialization error:', error);
            // Show error in loading screen
            showInitError(error);
        }
    }
    
    function showLoadingScreen() {
        // Create loading screen if it doesn't exist
        if (!document.querySelector('.loading-screen')) {
            const loadingScreen = document.createElement('div');
            loadingScreen.className = 'loading-screen';
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <img src="images/logo-large.svg" alt="PowerBrowser Logo" class="loading-logo">
                    <h2>PowerBrowser</h2>
                    <div class="loading-spinner" style="width: 40px; height: 40px; margin: 20px auto;"></div>
                    <p>Yükleniyor...</p>
                </div>
            `;
            
            // Add styles if not already in CSS
            if (!document.querySelector('#loading-styles')) {
                const style = document.createElement('style');
                style.id = 'loading-styles';
                style.textContent = `
                    .loading-screen {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: var(--card-bg);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 2000;
                        transition: opacity 0.5s ease-in-out;
                    }
                    .loading-content {
                        text-align: center;
                        padding: 20px;
                    }
                    .loading-logo {
                        width: 120px;
                        height: 120px;
                        animation: pulse 2s infinite;
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(loadingScreen);
        }
    }
    
    function hideLoadingScreen() {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                if (loadingScreen.parentNode) {
                    loadingScreen.parentNode.removeChild(loadingScreen);
                }
            }, 500);
        }
    }
    
    function showInitError(error) {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            const loadingContent = loadingScreen.querySelector('.loading-content');
            if (loadingContent) {
                loadingContent.innerHTML = `
                    <img src="images/logo-large.svg" alt="PowerBrowser Logo" class="loading-logo">
                    <h2>PowerBrowser</h2>
                    <div style="color: var(--danger-color); margin: 20px 0;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 40px;"></i>
                        <p>Başlatma hatası: ${error.message}</p>
                    </div>
                    <button id="retry-init" class="retry-button">Tekrar Dene</button>
                `;
                
                // Add retry button styles
                if (!document.querySelector('#retry-styles')) {
                    const style = document.createElement('style');
                    style.id = 'retry-styles';
                    style.textContent = `
                        .retry-button {
                            background-color: var(--primary-color);
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                            transition: background-color 0.3s;
                        }
                        .retry-button:hover {
                            background-color: var(--secondary-color);
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                // Add retry button event listener
                setTimeout(() => {
                    const retryButton = document.getElementById('retry-init');
                    if (retryButton) {
                        retryButton.addEventListener('click', () => {
                            // Show loading again
                            loadingContent.innerHTML = `
                                <img src="images/logo-large.svg" alt="PowerBrowser Logo" class="loading-logo">
                                <h2>PowerBrowser</h2>
                                <div class="loading-spinner" style="width: 40px; height: 40px; margin: 20px auto;"></div>
                                <p>Yükleniyor...</p>
                            `;
                            
                            // Try initialization again
                            setTimeout(init, 500);
                        });
                    }
                }, 0);
            }
        }
    }
    
    function addVersionInfo() {
        // Add version info to the footer
        const versionInfo = document.createElement('div');
        versionInfo.className = 'version-info';
        versionInfo.innerHTML = '<span><i class="fas fa-code-branch"></i> Sürüm 1.0.2</span>';
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .version-info {
                margin-left: 15px;
                font-size: 12px;
                color: var(--text-light);
            }
            .version-info i {
                margin-right: 5px;
            }
        `;
        document.head.appendChild(style);
        
        // Add to footer
        const statusInfo = document.querySelector('.status-info');
        if (statusInfo) {
            statusInfo.appendChild(versionInfo);
        }
    }

    // Setup Event Listeners
    function setupEventListeners() {
        // Apply theme on page load
        applyTheme();
        // URL input
        urlInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                navigateToUrl(urlInput.value);
            }
        });

        // Search input
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                search(searchInput.value);
            }
        });

        // Navigation buttons
        backButton.addEventListener('click', goBack);
        forwardButton.addEventListener('click', goForward);
        refreshButton.addEventListener('click', refresh);
        homeButton.addEventListener('click', goHome);
        
        // Search buttons
        searchButton.addEventListener('click', function() {
            navigateToUrl(urlInput.value);
        });
        
        mainSearchButton.addEventListener('click', function() {
            search(searchInput.value);
        });
        
        // New tab button
        newTabButton.addEventListener('click', createNewTab);
        
        // Settings, security, and about buttons
        settingsButton.addEventListener('click', openSettings);
        securityButton.addEventListener('click', openSecurityCenter);
        aboutButton.addEventListener('click', openAboutModal);
        
        // Modal close buttons
        closeModalButtons.forEach(button => {
            button.addEventListener('click', closeModals);
        });
        
        // Settings buttons
        saveSettingsButton.addEventListener('click', saveSettings);
        cancelSettingsButton.addEventListener('click', closeModals);
        
        // Security action buttons
        securityActionButtons.forEach(button => {
            button.addEventListener('click', handleSecurityAction);
        });
        
        // Bookmark button
        bookmarkButton.addEventListener('click', toggleBookmark);
        
        // Tab events (delegation)
        tabsContainer.addEventListener('click', handleTabsClick);
        
        // Empty tab quick action buttons (delegation)
        document.addEventListener('click', function(e) {
            const quickActionButton = e.target.closest('.quick-action-button');
            if (quickActionButton) {
                const url = quickActionButton.getAttribute('data-url');
                if (url) {
                    navigateToUrl(url);
                }
            }
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === settingsModal || e.target === securityModal || e.target === aboutModal) {
                closeModals();
            }
        });
        
        // Apply system theme if selected
        applyTheme();
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
            if (settings.theme === 'system') {
                applyTheme();
            }
        });
    }

    // API Functions
    async function fetchTabs() {
        try {
            const response = await fetch(`${API_BASE_URL}/tabs`);
            if (response.ok) {
                currentTabs = await response.json();
                // Find active tab
                const activeTab = currentTabs.find(tab => tab.active);
                if (activeTab) {
                    activeTabId = activeTab.id;
                } else if (currentTabs.length > 0) {
                    activeTabId = currentTabs[0].id;
                }
            }
        } catch (error) {
            console.error('Error fetching tabs:', error);
        }
    }
    
    async function fetchSettings() {
        try {
            const response = await fetch(`${API_BASE_URL}/settings`);
            if (response.ok) {
                settings = await response.json();
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    }
    
    async function fetchSecurityStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/security`);
            if (response.ok) {
                securityStats = await response.json();
            }
        } catch (error) {
            console.error('Error fetching security stats:', error);
        }
    }
    
    async function startSystemMonitoring() {
        // Poll system stats every 2 seconds
        setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/system-stats`);
                if (response.ok) {
                    const stats = await response.json();
                    updateSystemStats(stats);
                }
            } catch (error) {
                console.error('Error fetching system stats:', error);
            }
        }, 2000);
    }
    
    function updateSystemStats(stats) {
        if (cpuUsage) {
            cpuUsage.innerHTML = `<i class="fas fa-microchip"></i> CPU: ${stats.cpu_usage}%`;
        }
        if (memoryUsage) {
            memoryUsage.innerHTML = `<i class="fas fa-memory"></i> Bellek: ${stats.memory_usage}MB`;
        }
    }
    
    // Navigation Functions
    async function navigateToUrl(url) {
        if (!url) return;
        
        try {
            // Show loading indicator
            showLoadingIndicator();
            
            // Call the backend to process the URL
            const response = await fetch(`${API_BASE_URL}/navigate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            
            if (response.ok) {
                const data = await response.json();
                url = data.url;
                
                // Update browser frame
                browserFrame.style.display = 'block';
                startPage.style.display = 'none';
                
                // Special handling for Google search
                if (url.includes('google.com/search')) {
                    // For Google search, we can use a special approach to make it work better
                    // In a real browser, we'd handle this differently
                    const searchTerm = url.split('q=')[1]?.split('&')[0] || '';
                    if (searchTerm) {
                        // Create a more user-friendly display for Google search
                        showGoogleSearchResults(decodeURIComponent(searchTerm));
                    } else {
                        browserFrame.src = url;
                    }
                } else {
                    // For other URLs, use the iframe
                    browserFrame.src = url;
                }
                
                // Update browser state
                await updateTabUrl(activeTabId, url);
                await addToHistory(url);
                updateNavButtons();
                
                // Update URL input
                urlInput.value = url;
                
                // Update security stats
                await fetchSecurityStats();
                updateSecurityStats();
            }
            
            // Hide loading indicator
            hideLoadingIndicator();
        } catch (error) {
            console.error('Navigation error:', error);
            hideLoadingIndicator();
            showErrorMessage('Bağlantı hatası: ' + error.message);
        }
    }
    
    function showGoogleSearchResults(searchTerm) {
        // Create a simulated Google search results page
        // This is just for demonstration - in a real browser this wouldn't be needed
        const googleHTML = `
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                    <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" alt="Google" style="height: 30px; margin-right: 20px;">
                    <div style="flex: 1; position: relative;">
                        <input type="text" value="${searchTerm}" style="width: 100%; padding: 10px; border-radius: 24px; border: 1px solid #dfe1e5; outline: none; font-size: 16px;">
                    </div>
                </div>
                
                <div style="color: #70757a; font-size: 14px; margin-bottom: 12px;">Yaklaşık 1.234.567 sonuç bulundu (0,42 saniye)</div>
                
                <div style="margin-bottom: 30px;">
                    <div style="margin-bottom: 20px;">
                        <div style="color: #1a0dab; font-size: 20px; margin-bottom: 5px; cursor: pointer;">${searchTerm} - Vikipedi</div>
                        <div style="color: #006621; font-size: 14px;">https://tr.wikipedia.org › wiki › ${searchTerm.replace(/ /g, '_')}</div>
                        <div style="font-size: 14px;">${searchTerm} hakkında bilgi içeren Wikipedia sayfası...</div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="color: #1a0dab; font-size: 20px; margin-bottom: 5px; cursor: pointer;">${searchTerm} | Resmi Site</div>
                        <div style="color: #006621; font-size: 14px;">https://${searchTerm.toLowerCase().replace(/ /g, '')}.com</div>
                        <div style="font-size: 14px;">${searchTerm} resmi web sitesi. En güncel bilgiler ve haberler için ziyaret edin.</div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="color: #1a0dab; font-size: 20px; margin-bottom: 5px; cursor: pointer;">${searchTerm} nedir? - Bilgi Portalı</div>
                        <div style="color: #006621; font-size: 14px;">https://bilgiportali.com › ${searchTerm.toLowerCase().replace(/ /g, '-')}</div>
                        <div style="font-size: 14px;">${searchTerm} hakkında detaylı bilgi, tarihçe ve güncel gelişmeler...</div>
                    </div>
                </div>
                
                <div style="font-size: 12px; color: #70757a; text-align: center;">
                    Bu sayfa PowerBrowser tarafından simüle edilmiştir. Gerçek Google araması için lütfen google.com'u ziyaret edin.
                </div>
            </div>
        `;
        
        // Set the content to the iframe
        browserFrame.srcdoc = googleHTML;
    }
    
    function showLoadingIndicator() {
        // Create loading indicator if it doesn't exist
        let loadingIndicator = document.querySelector('.url-loading-indicator');
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-spinner url-loading-indicator';
            document.querySelector('.url-container').insertBefore(
                loadingIndicator, 
                document.querySelector('#search-button')
            );
        } else {
            loadingIndicator.style.display = 'inline-block';
        }
    }
    
    function hideLoadingIndicator() {
        const loadingIndicator = document.querySelector('.url-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
    
    function showErrorMessage(message) {
        showToast(message, 'error');
    }
    
    function showSuccessMessage(message) {
        showToast(message, 'success');
    }
    
    function showToast(message, type = 'error') {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = `${type}-toast toast`;
        
        let icon = 'exclamation-circle';
        if (type === 'success') {
            icon = 'check-circle';
        }
        
        toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
        document.body.appendChild(toast);
        
        // Add styles if not already in CSS
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    z-index: 2000;
                    animation: toastIn 0.3s, toastOut 0.3s 3.7s;
                    animation-fill-mode: forwards;
                }
                .error-toast {
                    background-color: var(--danger-color);
                }
                .success-toast {
                    background-color: var(--success-color);
                }
                @keyframes toastIn {
                    from { transform: translate(-50%, 100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                @keyframes toastOut {
                    from { transform: translate(-50%, 0); opacity: 1; }
                    to { transform: translate(-50%, 100px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove after 4 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 4000);
    }

    async function search(query) {
        if (!query) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });
            
            if (response.ok) {
                const data = await response.json();
                navigateToUrl(data.url);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    function goBack() {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            const url = browserHistory[currentHistoryIndex];
            browserFrame.src = url;
            urlInput.value = url;
            updateTabUrl(activeTabId, url, false);
            updateNavButtons();
        }
    }

    function goForward() {
        if (currentHistoryIndex < browserHistory.length - 1) {
            currentHistoryIndex++;
            const url = browserHistory[currentHistoryIndex];
            browserFrame.src = url;
            urlInput.value = url;
            updateTabUrl(activeTabId, url, false);
            updateNavButtons();
        }
    }

    function refresh() {
        const currentTab = getCurrentTab();
        if (currentTab && currentTab.url) {
            browserFrame.src = currentTab.url;
        } else {
            // If on start page, just refresh the stats
            updateSecurityStats();
        }
    }

    function goHome() {
        showStartPage();
    }

    // Tab Functions
    async function createNewTab() {
        try {
            // Add a temporary tab with loading animation
            const tempTabId = 'temp-' + Date.now();
            const tempTab = document.createElement('div');
            tempTab.className = 'tab';
            tempTab.dataset.tabId = tempTabId;
            tempTab.innerHTML = `
                <div class="loading-spinner" style="width: 12px; height: 12px;"></div>
                <span class="tab-title">Yeni Sekme</span>
            `;
            tabsContainer.insertBefore(tempTab, newTabButton);
            
            // Create the actual tab via API
            const response = await fetch(`${API_BASE_URL}/tabs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            if (response.ok) {
                const newTab = await response.json();
                await fetchTabs(); // Refresh tabs from backend
                activeTabId = newTab.id;
                renderTabs();
                showStartPage();
            }
        } catch (error) {
            console.error('Error creating tab:', error);
            showErrorMessage('Sekme oluşturulurken hata oluştu');
        }
    }

    async function closeTab(tabId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tabs/${tabId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await fetchTabs(); // Refresh tabs from backend
                
                // Find the active tab
                const activeTab = currentTabs.find(tab => tab.active);
                if (activeTab) {
                    activeTabId = activeTab.id;
                    
                    // Show the tab content
                    if (activeTab.url) {
                        browserFrame.src = activeTab.url;
                        browserFrame.style.display = 'block';
                        startPage.style.display = 'none';
                        urlInput.value = activeTab.url;
                    } else {
                        showStartPage();
                    }
                }
                
                renderTabs();
            }
        } catch (error) {
            console.error('Error closing tab:', error);
        }
    }

    async function activateTab(tabId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tabs/${tabId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ active: true })
            });
            
            if (response.ok) {
                await fetchTabs(); // Refresh tabs from backend
                activeTabId = tabId;
                
                // Find the tab
                const tab = currentTabs.find(tab => tab.id === tabId);
                if (tab) {
                    // Show the tab content
                    if (tab.url) {
                        browserFrame.src = tab.url;
                        browserFrame.style.display = 'block';
                        startPage.style.display = 'none';
                        urlInput.value = tab.url;
                    } else {
                        showStartPage();
                    }
                }
                
                renderTabs();
            }
        } catch (error) {
            console.error('Error activating tab:', error);
        }
    }

    async function updateTabUrl(tabId, url, addToHistoryFlag = true) {
        try {
            const response = await fetch(`${API_BASE_URL}/tabs/${tabId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            
            if (response.ok) {
                await fetchTabs(); // Refresh tabs from backend
                renderTabs();
            }
        } catch (error) {
            console.error('Error updating tab URL:', error);
        }
    }

    function handleTabsClick(e) {
        // Close tab button
        if (e.target.closest('.tab-close')) {
            const tab = e.target.closest('.tab');
            if (tab) {
                closeTab(tab.dataset.tabId);
            }
            return;
        }
        
        // Activate tab
        const tab = e.target.closest('.tab');
        if (tab) {
            activateTab(tab.dataset.tabId);
        }
    }

    function renderTabs() {
        // Clear existing tabs (except the new tab button)
        const tabs = tabsContainer.querySelectorAll('.tab');
        tabs.forEach(tab => tab.remove());
        
        // Add tabs
        currentTabs.forEach(tab => {
            const tabElement = document.createElement('div');
            tabElement.className = `tab${tab.active ? ' active' : ''}`;
            tabElement.dataset.tabId = tab.id;
            
            tabElement.innerHTML = `
                <span class="tab-title">${tab.title}</span>
                <button class="tab-close"><i class="fas fa-times"></i></button>
            `;
            
            // Insert before the new tab button
            tabsContainer.insertBefore(tabElement, newTabButton);
        });
    }

    // History Functions
    async function addToHistory(url) {
        try {
            // Get title from active tab
            const activeTab = currentTabs.find(tab => tab.id === activeTabId);
            const title = activeTab ? activeTab.title : url;
            
            const response = await fetch(`${API_BASE_URL}/history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, title })
            });
            
            if (response.ok) {
                // For local navigation
                // If we're not at the end of the history, remove forward entries
                if (currentHistoryIndex < browserHistory.length - 1) {
                    browserHistory = browserHistory.slice(0, currentHistoryIndex + 1);
                }
                
                // Add the URL to history
                browserHistory.push(url);
                currentHistoryIndex = browserHistory.length - 1;
                
                // Update navigation buttons
                updateNavButtons();
            }
        } catch (error) {
            console.error('Error adding to history:', error);
        }
    }

    function updateNavButtons() {
        // Back button
        if (currentHistoryIndex > 0) {
            backButton.removeAttribute('disabled');
            backButton.style.opacity = '1';
        } else {
            backButton.setAttribute('disabled', 'true');
            backButton.style.opacity = '0.5';
        }
        
        // Forward button
        if (currentHistoryIndex < browserHistory.length - 1) {
            forwardButton.removeAttribute('disabled');
            forwardButton.style.opacity = '1';
        } else {
            forwardButton.setAttribute('disabled', 'true');
            forwardButton.style.opacity = '0.5';
        }
    }

    // Bookmark Functions
    async function toggleBookmark() {
        const currentTab = getCurrentTab();
        if (!currentTab || !currentTab.url) return;
        
        const url = currentTab.url;
        
        try {
            // Get current bookmarks
            const response = await fetch(`${API_BASE_URL}/bookmarks`);
            if (response.ok) {
                const bookmarks = await response.json();
                const bookmarkIndex = bookmarks.findIndex(b => b.url === url);
                
                if (bookmarkIndex === -1) {
                    // Add bookmark
                    const addResponse = await fetch(`${API_BASE_URL}/bookmarks`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            url: url, 
                            title: currentTab.title 
                        })
                    });
                    
                    if (addResponse.ok) {
                        bookmarkButton.style.color = 'var(--primary-color)';
                    }
                } else {
                    // Remove bookmark
                    const deleteResponse = await fetch(`${API_BASE_URL}/bookmarks/${bookmarkIndex}`, {
                        method: 'DELETE'
                    });
                    
                    if (deleteResponse.ok) {
                        bookmarkButton.style.color = '';
                    }
                }
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    }

    // Settings Functions
    async function openSettings() {
        // Fetch latest settings before showing modal
        fetchSettings().then(() => {
            // Update form values with current settings
            updateSettingsForm();
            
            // Show modal with animation
            settingsModal.style.display = 'flex';
            setTimeout(() => {
                settingsModal.classList.add('show');
            }, 10);
        });
    }
    
    function updateSettingsForm() {
        // Update all form fields with current settings values
        document.querySelector('select[name="searchEngine"]').value = settings.searchEngine;
        document.querySelector('select[name="theme"]').value = settings.theme;
        document.querySelector('select[name="fontSize"]').value = settings.fontSize;
        document.querySelector('select[name="newTabPage"]').value = settings.newTabPage;
        document.querySelector('input[name="startPage"]').value = settings.startPage;
        document.querySelector('input[name="blockCookies"]').checked = settings.blockCookies;
        document.querySelector('input[name="blockTrackers"]').checked = settings.blockTrackers;
        document.querySelector('input[name="blockAds"]').checked = settings.blockAds;
        document.querySelector('input[name="forceHttps"]').checked = settings.forceHttps;
    }
    
    // Theme Functions
    function applyTheme() {
        const theme = settings.theme;
        
        if (theme === 'system') {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        } else if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    async function saveSettings() {
        // Collect all form values
        const updatedSettings = {
            searchEngine: document.querySelector('select[name="searchEngine"]')?.value || settings.searchEngine,
            theme: document.querySelector('select[name="theme"]')?.value || settings.theme,
            fontSize: document.querySelector('select[name="fontSize"]')?.value || settings.fontSize,
            newTabPage: document.querySelector('select[name="newTabPage"]')?.value || settings.newTabPage,
            startPage: document.querySelector('input[name="startPage"]')?.value || settings.startPage,
            blockCookies: document.querySelector('input[name="blockCookies"]')?.checked,
            blockTrackers: document.querySelector('input[name="blockTrackers"]')?.checked,
            blockAds: document.querySelector('input[name="blockAds"]')?.checked,
            forceHttps: document.querySelector('input[name="forceHttps"]')?.checked
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedSettings)
            });
            
            if (response.ok) {
                await fetchSettings(); // Refresh settings from backend
                
                // Apply theme changes immediately
                applyTheme();
                
                // Show success message
                showSuccessMessage('Ayarlar kaydedildi');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showErrorMessage('Ayarlar kaydedilirken hata oluştu');
        }
        
        closeModals();
    }

    // Security Functions
    async function openSecurityCenter() {
        // Fetch latest security stats before showing modal
        fetchSecurityStats().then(() => {
            // Update security center with current stats
            const scoreElement = document.querySelector('.score-circle span');
            if (scoreElement) {
                scoreElement.textContent = securityStats.securityScore + '%';
            }
            
            // Show modal with animation
            securityModal.style.display = 'flex';
            setTimeout(() => {
                securityModal.classList.add('show');
            }, 10);
        });
    }

    async function handleSecurityAction(e) {
        const action = e.currentTarget.querySelector('span').textContent;
        
        try {
            switch(action) {
                case 'Tarama Geçmişini Temizle':
                    await fetch(`${API_BASE_URL}/history`, {
                        method: 'DELETE'
                    });
                    browserHistory = [];
                    currentHistoryIndex = -1;
                    updateNavButtons();
                    break;
                case 'Çerezleri Temizle':
                    await fetch(`${API_BASE_URL}/security/clear-cookies`, {
                        method: 'POST'
                    });
                    break;
                case 'Güvenlik Taraması Yap':
                    const response = await fetch(`${API_BASE_URL}/security/scan`, {
                        method: 'POST'
                    });
                    if (response.ok) {
                        const result = await response.json();
                        alert(result.message);
                    }
                    break;
                case 'Gizli Mod':
                    // Toggle private mode (client-side only)
                    document.body.classList.toggle('private-mode');
                    break;
            }
        } catch (error) {
            console.error('Error handling security action:', error);
        }
        
        // Close the modal
        closeModals();
    }

    // These functions are now handled by the backend API

    function updateSecurityStats() {
        // Update the stats on the start page
        const trackersElement = document.querySelector('.security-stats .stat:nth-child(1) .stat-number');
        const adsElement = document.querySelector('.security-stats .stat:nth-child(2) .stat-number');
        const scoreElement = document.querySelector('.security-stats .stat:nth-child(3) .stat-number');
        
        if (trackersElement) {
            trackersElement.textContent = securityStats.trackersBlocked;
        }
        
        if (adsElement) {
            adsElement.textContent = securityStats.adsBlocked;
        }
        
        if (scoreElement) {
            scoreElement.textContent = securityStats.securityScore + '%';
        }
    }

    // Helper Functions
    async function showStartPage() {
        // Check the newTabPage setting
        const newTabPage = settings.newTabPage;
        
        if (newTabPage === 'blank') {
            // Show empty tab
            showEmptyTab();
        } else if (newTabPage === 'custom' && settings.startPage) {
            // Navigate to custom URL
            navigateToUrl(settings.startPage);
        } else {
            // Show default start page
            browserFrame.style.display = 'none';
            startPage.style.display = 'flex';
            urlInput.value = '';
        }
        
        // Update the active tab
        await updateTabUrl(activeTabId, '', false);
        
        // Refresh security stats
        await fetchSecurityStats();
        updateSecurityStats();
    }
    
    function showEmptyTab() {
        // Hide other content
        browserFrame.style.display = 'none';
        startPage.style.display = 'none';
        urlInput.value = '';
        
        // Clone the empty tab template
        if (emptyTabTemplate) {
            const emptyTabContent = document.importNode(emptyTabTemplate.content, true);
            
            // Clear any existing empty tab
            const existingEmptyTab = document.querySelector('.empty-tab');
            if (existingEmptyTab) {
                existingEmptyTab.remove();
            }
            
            // Append to browser content
            document.querySelector('.browser-content').appendChild(emptyTabContent);
        }
    }

    function closeModals() {
        // Hide modals with animation
        settingsModal.classList.remove('show');
        securityModal.classList.remove('show');
        aboutModal.classList.remove('show');
        
        // After animation completes, hide the modal
        setTimeout(() => {
            settingsModal.style.display = 'none';
            securityModal.style.display = 'none';
            aboutModal.style.display = 'none';
        }, 300);
    }
    
    function openAboutModal() {
        // Show modal with animation
        aboutModal.style.display = 'flex';
        setTimeout(() => {
            aboutModal.classList.add('show');
        }, 10);
    }

    function getCurrentTab() {
        return currentTabs.find(tab => tab.id === activeTabId);
    }

    // Initialize the browser
    init();
});
