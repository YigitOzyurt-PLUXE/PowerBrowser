// PowerBrowser - Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
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
    const settingsModal = document.getElementById('settings-modal');
    const securityModal = document.getElementById('security-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const saveSettingsButton = document.querySelector('.save-settings');
    const cancelSettingsButton = document.querySelector('.cancel-settings');
    const securityActionButtons = document.querySelectorAll('.security-action-button');
    const bookmarkButton = document.getElementById('bookmark-button');

    // Browser state
    let currentTabs = [{
        id: 'tab-1',
        title: 'Yeni Sekme',
        url: '',
        active: true
    }];
    let activeTabId = 'tab-1';
    let browserHistory = [];
    let currentHistoryIndex = -1;
    let bookmarks = [];
    let securityStats = {
        trackersBlocked: 0,
        adsBlocked: 0,
        securityScore: 100
    };

    // Settings
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
    function init() {
        renderTabs();
        updateNavButtons();
        updateSecurityStats();
        
        // Set up event listeners
        setupEventListeners();
    }

    // Setup Event Listeners
    function setupEventListeners() {
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
        
        // Settings and security buttons
        settingsButton.addEventListener('click', openSettings);
        securityButton.addEventListener('click', openSecurityCenter);
        
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
        
        // Close modals when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === settingsModal) {
                closeModals();
            }
            if (e.target === securityModal) {
                closeModals();
            }
        });
    }

    // Navigation Functions
    function navigateToUrl(url) {
        if (!url) return;
        
        // Add http:// if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            // Check if it's a valid domain
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                // Treat as search
                search(url);
                return;
            }
        }
        
        // Force HTTPS if enabled
        if (settings.forceHttps && url.startsWith('http://')) {
            url = url.replace('http://', 'https://');
        }
        
        try {
            // Update browser frame
            browserFrame.style.display = 'block';
            startPage.style.display = 'none';
            
            // In a real browser, we would navigate to the URL
            // For this demo, we'll simulate by showing the URL in the iframe
            // Note: Due to security restrictions, most sites won't load in an iframe
            browserFrame.src = url;
            
            // Update browser state
            updateTabUrl(activeTabId, url);
            addToHistory(url);
            updateNavButtons();
            
            // Update URL input
            urlInput.value = url;
            
            // Simulate security features
            simulateSecurityFeatures(url);
        } catch (error) {
            console.error('Navigation error:', error);
        }
    }

    function search(query) {
        if (!query) return;
        
        let searchUrl;
        switch (settings.searchEngine) {
            case 'google':
                searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                break;
            case 'bing':
                searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
                break;
            case 'duckduckgo':
                searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
                break;
            case 'yandex':
                searchUrl = `https://yandex.com/search/?text=${encodeURIComponent(query)}`;
                break;
            default:
                searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
        
        navigateToUrl(searchUrl);
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
    function createNewTab() {
        const tabId = 'tab-' + (currentTabs.length + 1);
        
        // Set all tabs to inactive
        currentTabs.forEach(tab => tab.active = false);
        
        // Add new tab
        currentTabs.push({
            id: tabId,
            title: 'Yeni Sekme',
            url: '',
            active: true
        });
        
        activeTabId = tabId;
        renderTabs();
        showStartPage();
    }

    function closeTab(tabId) {
        // Don't close if it's the only tab
        if (currentTabs.length <= 1) return;
        
        // Find the tab index
        const tabIndex = currentTabs.findIndex(tab => tab.id === tabId);
        
        // Remove the tab
        currentTabs.splice(tabIndex, 1);
        
        // If we closed the active tab, activate another one
        if (tabId === activeTabId) {
            // Activate the tab to the left, or the first tab if we closed the leftmost
            const newActiveIndex = Math.max(0, tabIndex - 1);
            currentTabs[newActiveIndex].active = true;
            activeTabId = currentTabs[newActiveIndex].id;
            
            // Show the tab content
            const activeTab = currentTabs[newActiveIndex];
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

    function activateTab(tabId) {
        // Set all tabs to inactive
        currentTabs.forEach(tab => tab.active = false);
        
        // Set the selected tab to active
        const tab = currentTabs.find(tab => tab.id === tabId);
        if (tab) {
            tab.active = true;
            activeTabId = tabId;
            
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

    function updateTabUrl(tabId, url, addToHistoryFlag = true) {
        const tab = currentTabs.find(tab => tab.id === tabId);
        if (tab) {
            tab.url = url;
            
            // Update tab title (in a real browser, this would come from the page title)
            try {
                const domain = new URL(url).hostname;
                tab.title = domain;
            } catch (e) {
                tab.title = url || 'Yeni Sekme';
            }
            
            renderTabs();
            
            if (addToHistoryFlag) {
                addToHistory(url);
            }
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
    function addToHistory(url) {
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
    function toggleBookmark() {
        const currentTab = getCurrentTab();
        if (!currentTab || !currentTab.url) return;
        
        const url = currentTab.url;
        const bookmarkIndex = bookmarks.findIndex(b => b.url === url);
        
        if (bookmarkIndex === -1) {
            // Add bookmark
            try {
                const domain = new URL(url).hostname;
                bookmarks.push({
                    url: url,
                    title: domain
                });
                bookmarkButton.style.color = 'var(--primary-color)';
            } catch (e) {
                console.error('Invalid URL for bookmark', e);
            }
        } else {
            // Remove bookmark
            bookmarks.splice(bookmarkIndex, 1);
            bookmarkButton.style.color = '';
        }
    }

    // Settings Functions
    function openSettings() {
        settingsModal.style.display = 'flex';
    }

    function saveSettings() {
        // In a real app, we would save the settings from the form inputs
        // For this demo, we'll just close the modal
        closeModals();
    }

    // Security Functions
    function openSecurityCenter() {
        securityModal.style.display = 'flex';
    }

    function handleSecurityAction(e) {
        const action = e.currentTarget.querySelector('span').textContent;
        
        switch(action) {
            case 'Tarama Geçmişini Temizle':
                browserHistory = [];
                currentHistoryIndex = -1;
                updateNavButtons();
                break;
            case 'Çerezleri Temizle':
                // Simulate cookie clearing
                console.log('Cookies cleared');
                break;
            case 'Güvenlik Taraması Yap':
                // Simulate security scan
                simulateSecurityScan();
                break;
            case 'Gizli Mod':
                // Toggle private mode
                document.body.classList.toggle('private-mode');
                break;
        }
        
        // Close the modal
        closeModals();
    }

    function simulateSecurityFeatures(url) {
        // Simulate blocking trackers and ads
        if (settings.blockTrackers) {
            const randomTrackers = Math.floor(Math.random() * 5);
            securityStats.trackersBlocked += randomTrackers;
        }
        
        if (settings.blockAds) {
            const randomAds = Math.floor(Math.random() * 3);
            securityStats.adsBlocked += randomAds;
        }
        
        // Update security stats display
        updateSecurityStats();
    }

    function simulateSecurityScan() {
        // Simulate a security scan
        alert('Güvenlik taraması tamamlandı. Herhangi bir tehdit bulunamadı.');
    }

    function updateSecurityStats() {
        // Update the stats on the start page
        const trackersElement = document.querySelector('.security-stats .stat:nth-child(1) .stat-number');
        const adsElement = document.querySelector('.security-stats .stat:nth-child(2) .stat-number');
        
        if (trackersElement) {
            trackersElement.textContent = securityStats.trackersBlocked;
        }
        
        if (adsElement) {
            adsElement.textContent = securityStats.adsBlocked;
        }
    }

    // Helper Functions
    function showStartPage() {
        browserFrame.style.display = 'none';
        startPage.style.display = 'flex';
        urlInput.value = '';
        
        // Update the active tab
        updateTabUrl(activeTabId, '', false);
    }

    function closeModals() {
        settingsModal.style.display = 'none';
        securityModal.style.display = 'none';
    }

    function getCurrentTab() {
        return currentTabs.find(tab => tab.id === activeTabId);
    }

    // Initialize the browser
    init();
});
