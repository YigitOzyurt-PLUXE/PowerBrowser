from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psutil
import json
import os
import time
import threading
import requests
from datetime import datetime

app = Flask(__name__, static_folder='../frontend')
CORS(app)  # Enable CORS for all routes

# In-memory storage for browser state
browser_state = {
    "tabs": [
        {
            "id": "tab-1",
            "title": "New Tab",
            "url": "",
            "active": True,
            "favicon": "",
            "incognito": False
        }
    ],
    "history": [],
    "bookmarks": [],
    "settings": {
        "startPage": "home",
        "newTabPage": "blank",  # Changed default to blank
        "searchEngine": "google",
        "blockCookies": True,
        "blockTrackers": True,
        "blockAds": True,
        "forceHttps": True,
        "theme": "system",  # Changed default to system
        "fontSize": "medium",
        "incognitoByDefault": False
    },
    "security": {
        "trackersBlocked": 0,
        "adsBlocked": 0,
        "securityScore": 100,
        "lastScan": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
}

# System monitoring stats
system_stats = {
    "cpu_usage": 0,
    "memory_usage": 0,
    "last_updated": 0
}

# Thread for updating system stats
def update_system_stats():
    while True:
        system_stats["cpu_usage"] = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        system_stats["memory_usage"] = int(memory.used / (1024 * 1024))  # Convert to MB
        system_stats["last_updated"] = time.time()
        time.sleep(2)  # Update every 2 seconds

# Start the system monitoring thread
stats_thread = threading.Thread(target=update_system_stats, daemon=True)
stats_thread.start()

# Serve static files (frontend)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path == "" or path == "index.html":
        return send_from_directory(app.static_folder, 'index.html')
    return send_from_directory(app.static_folder, path)

# Routes
@app.route('/api/tabs', methods=['GET'])
def get_tabs():
    return jsonify(browser_state["tabs"])

@app.route('/api/tabs', methods=['POST'])
def create_tab():
    data = request.json
    
    # Set all tabs to inactive
    for tab in browser_state["tabs"]:
        tab["active"] = False
    
    # Create new tab with incognito mode if specified
    incognito = data.get("incognito", browser_state["settings"]["incognitoByDefault"])
    
    new_tab = {
        "id": f"tab-{len(browser_state['tabs']) + 1}",
        "title": "Incognito Tab" if incognito else "New Tab",
        "url": "",
        "active": True,
        "favicon": "",
        "incognito": incognito
    }
    
    browser_state["tabs"].append(new_tab)
    return jsonify(new_tab)

@app.route('/api/tabs/<tab_id>', methods=['PUT'])
def update_tab(tab_id):
    data = request.json
    
    for tab in browser_state["tabs"]:
        if tab["id"] == tab_id:
            if "url" in data:
                tab["url"] = data["url"]
                # Update title based on URL (in a real browser this would come from page title)
                if data["url"]:
                    try:
                        domain = data["url"].split("//")[1].split("/")[0]
                        tab["title"] = domain
                    except:
                        tab["title"] = data["url"]
                else:
                    tab["title"] = "New Tab"
            
            if "active" in data and data["active"]:
                # Set all tabs to inactive
                for t in browser_state["tabs"]:
                    t["active"] = False
                # Set this tab to active
                tab["active"] = True
            
            if "title" in data:
                tab["title"] = data["title"]
                
            return jsonify(tab)
    
    return jsonify({"error": "Tab not found"}), 404

@app.route('/api/tabs/<tab_id>', methods=['DELETE'])
def delete_tab(tab_id):
    for i, tab in enumerate(browser_state["tabs"]):
        if tab["id"] == tab_id:
            # Don't delete if it's the only tab
            if len(browser_state["tabs"]) <= 1:
                return jsonify({"error": "Cannot delete the only tab"}), 400
            
            # If we're deleting the active tab, activate another one
            was_active = tab["active"]
            deleted_tab = browser_state["tabs"].pop(i)
            
            if was_active and browser_state["tabs"]:
                # Activate the tab to the left, or the first tab if we deleted the leftmost
                new_active_index = max(0, i - 1)
                browser_state["tabs"][new_active_index]["active"] = True
            
            return jsonify(deleted_tab)
    
    return jsonify({"error": "Tab not found"}), 404

@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify(browser_state["history"])

@app.route('/api/history', methods=['POST'])
def add_history():
    data = request.json
    if "url" in data:
        return add_to_history(data["url"], data.get("title", data["url"]))
    return jsonify({"error": "URL is required"}), 400

# Helper function to add items to history
def add_to_history(url, title=None):
    if not title:
        title = url
        # Try to extract domain for better title
        try:
            domain = url.split("//")[1].split("/")[0]
            title = domain
        except:
            pass
    
    history_item = {
        "url": url,
        "title": title,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Add to beginning of history list (most recent first)
    browser_state["history"].insert(0, history_item)
    
    # Limit history size to 100 items
    if len(browser_state["history"]) > 100:
        browser_state["history"] = browser_state["history"][:100]
        
    return jsonify(history_item)

@app.route('/api/history', methods=['DELETE'])
def clear_history():
    browser_state["history"] = []
    # Also reset trackers and ads blocked counters
    browser_state["security"]["trackersBlocked"] = 0
    browser_state["security"]["adsBlocked"] = 0
    return jsonify({"message": "Browsing history cleared"})

@app.route('/api/bookmarks', methods=['GET'])
def get_bookmarks():
    return jsonify(browser_state["bookmarks"])

@app.route('/api/bookmarks', methods=['POST'])
def add_bookmark():
    data = request.json
    if "url" in data:
        # Check if bookmark already exists
        for bookmark in browser_state["bookmarks"]:
            if bookmark["url"] == data["url"]:
                return jsonify({"error": "Bookmark already exists"}), 400
        
        # Add bookmark
        bookmark = {
            "url": data["url"],
            "title": data.get("title", data["url"])
        }
        browser_state["bookmarks"].append(bookmark)
        return jsonify(bookmark)
    return jsonify({"error": "URL is required"}), 400

@app.route('/api/bookmarks/<int:index>', methods=['DELETE'])
def delete_bookmark(index):
    if 0 <= index < len(browser_state["bookmarks"]):
        deleted = browser_state["bookmarks"].pop(index)
        return jsonify(deleted)
    return jsonify({"error": "Bookmark not found"}), 404

@app.route('/api/settings', methods=['GET'])
def get_settings():
    return jsonify(browser_state["settings"])

@app.route('/api/settings', methods=['PUT'])
def update_settings():
    data = request.json
    for key, value in data.items():
        if key in browser_state["settings"]:
            browser_state["settings"][key] = value
    return jsonify(browser_state["settings"])

@app.route('/api/security', methods=['GET'])
def get_security():
    return jsonify(browser_state["security"])

@app.route('/api/security/scan', methods=['POST'])
def security_scan():
    # Simulate a security scan
    browser_state["security"]["lastScan"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Calculate security score based on settings
    score = 100
    if not browser_state["settings"]["blockCookies"]:
        score -= 10
    if not browser_state["settings"]["blockTrackers"]:
        score -= 15
    if not browser_state["settings"]["blockAds"]:
        score -= 10
    if not browser_state["settings"]["forceHttps"]:
        score -= 20
    
    browser_state["security"]["securityScore"] = score
    
    return jsonify({
        "status": "completed",
        "threats": 0,
        "message": "No threats detected",
        "score": score,
        "lastScan": browser_state["security"]["lastScan"]
    })

@app.route('/api/security/clear-cookies', methods=['POST'])
def clear_cookies():
    # Simulate clearing cookies
    return jsonify({
        "status": "completed",
        "message": "Cookies cleared"
    })

@app.route('/api/security/incognito', methods=['POST'])
def toggle_incognito():
    data = request.json
    tab_id = data.get("tabId")
    
    if not tab_id:
        return jsonify({"error": "Tab ID is required"}), 400
    
    for tab in browser_state["tabs"]:
        if tab["id"] == tab_id:
            tab["incognito"] = not tab.get("incognito", False)
            if tab["incognito"]:
                tab["title"] = "Incognito Tab"
            return jsonify({
                "status": "success",
                "incognito": tab["incognito"],
                "message": "Incognito mode " + ("enabled" if tab["incognito"] else "disabled")
            })
    
    return jsonify({"error": "Tab not found"}), 404

@app.route('/api/system-stats', methods=['GET'])
def get_system_stats():
    return jsonify(system_stats)

@app.route('/api/search', methods=['POST'])
def search(data=None):
    if data is None:
        data = request.json
        
    if "query" not in data:
        return jsonify({"error": "Query is required"}), 400
    
    query = data["query"]
    search_engine = browser_state["settings"]["searchEngine"]
    tab_id = data.get("tabId")
    
    search_urls = {
        "google": f"https://www.google.com/search?q={query}",
        "bing": f"https://www.bing.com/search?q={query}",
        "duckduckgo": f"https://duckduckgo.com/?q={query}",
        "yandex": f"https://yandex.com/search/?text={query}"
    }
    
    url = search_urls.get(search_engine, search_urls["google"])
    
    # Simulate security features
    if browser_state["settings"]["blockTrackers"]:
        browser_state["security"]["trackersBlocked"] += 1
    
    if browser_state["settings"]["blockAds"]:
        browser_state["security"]["adsBlocked"] += 1
    
    # Add to history if not in incognito mode
    if tab_id:
        tab = next((t for t in browser_state["tabs"] if t["id"] == tab_id), None)
        if tab and not tab.get("incognito", False):
            add_to_history(url, f"Search: {query}")
    else:
        # If no tab ID provided, check if active tab is incognito
        active_tab = next((t for t in browser_state["tabs"] if t["active"]), None)
        if active_tab and not active_tab.get("incognito", False):
            add_to_history(url, f"Search: {query}")
    
    return jsonify({"url": url})

@app.route('/api/navigate', methods=['POST'])
def navigate():
    data = request.json
    if "url" not in data:
        return jsonify({"error": "URL is required"}), 400
    
    url = data["url"]
    tab_id = data.get("tabId")
    
    # Add http:// if missing
    if not url.startswith('http://') and not url.startswith('https://'):
        # Check if it's a valid domain
        if '.' in url and ' ' not in url:
            url = 'https://' + url
        else:
            # Treat as search query
            search_data = {"query": url}
            return search(search_data)
    
    # Force HTTPS if enabled
    if browser_state["settings"]["forceHttps"] and url.startswith('http://'):
        url = url.replace('http://', 'https://')
    
    # Simulate security features
    if browser_state["settings"]["blockTrackers"]:
        browser_state["security"]["trackersBlocked"] += 1
    
    if browser_state["settings"]["blockAds"]:
        browser_state["security"]["adsBlocked"] += 1
    
    # Add to history if not in incognito mode
    if tab_id:
        tab = next((t for t in browser_state["tabs"] if t["id"] == tab_id), None)
        if tab and not tab.get("incognito", False):
            add_to_history(url)
    else:
        # If no tab ID provided, check if active tab is incognito
        active_tab = next((t for t in browser_state["tabs"] if t["active"]), None)
        if active_tab and not active_tab.get("incognito", False):
            add_to_history(url)
    
    return jsonify({"url": url})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
