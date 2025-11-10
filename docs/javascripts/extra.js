// 自定义JavaScript文件

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    
    // 添加章节编号
    addChapterNumbers();
    
    // 添加返回顶部按钮
    addBackToTopButton();
    
    // 添加阅读进度条
    addReadingProgressBar();
    
    // 添加夜间模式切换动画
    addThemeTransition();
    
    // 添加搜索增强功能
    enhanceSearch();
    
    // 添加目录自动展开
    autoExpandTOC();
});

// 添加章节编号
function addChapterNumbers() {
    const chapterTitles = document.querySelectorAll('h1, h2, h3');
    let chapterCount = 0;
    
    chapterTitles.forEach(title => {
        if (title.textContent.includes('第') && title.textContent.includes('章')) {
            chapterCount++;
            const numberSpan = document.createElement('span');
            numberSpan.className = 'chapter-number';
            numberSpan.textContent = chapterCount;
            title.insertBefore(numberSpan, title.firstChild);
        }
    });
}

// 添加返回顶部按钮
function addBackToTopButton() {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'back-to-top';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: var(--md-primary-fg-color);
        color: white;
        border: none;
        cursor: pointer;
        display: none;
        z-index: 1000;
        font-size: 20px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(button);
    
    // 滚动时显示/隐藏按钮
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            button.style.display = 'block';
        } else {
            button.style.display = 'none';
        }
    });
}

// 添加阅读进度条
function addReadingProgressBar() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background-color: var(--md-accent-fg-color);
        z-index: 1001;
        transition: width 0.3s ease;
    `;
    
    document.body.appendChild(progressBar);
    
    // 更新进度条
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// 添加主题切换动画
function addThemeTransition() {
    const htmlElement = document.documentElement;
    const themeToggle = document.querySelector('[data-md-component="palette"]');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            htmlElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            setTimeout(() => {
                htmlElement.style.transition = '';
            }, 300);
        });
    }
}

// 增强搜索功能
function enhanceSearch() {
    const searchInput = document.querySelector('[data-md-component="search-query"]');
    
    if (searchInput) {
        // 添加搜索提示
        searchInput.addEventListener('focus', () => {
            if (searchInput.value === '') {
                searchInput.placeholder = '输入关键词搜索...';
            }
        });
        
        searchInput.addEventListener('blur', () => {
            searchInput.placeholder = '搜索';
        });
        
        // 添加搜索历史
        let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                const searchTerm = searchInput.value.trim();
                
                // 添加到搜索历史
                if (!searchHistory.includes(searchTerm)) {
                    searchHistory.unshift(searchTerm);
                    if (searchHistory.length > 5) {
                        searchHistory = searchHistory.slice(0, 5);
                    }
                    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
                }
            }
        });
    }
}

// 自动展开目录
function autoExpandTOC() {
    const tocLinks = document.querySelectorAll('.md-nav__link');
    
    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // 如果是当前页面的链接，自动展开子目录
            if (link.classList.contains('md-nav__link--active')) {
                const parentItem = link.closest('.md-nav__item');
                if (parentItem) {
                    const nestedNav = parentItem.querySelector('.md-nav');
                    if (nestedNav) {
                        nestedNav.classList.add('md-nav--expanded');
                    }
                }
            }
        });
    });
}

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K 聚焦搜索框
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-md-component="search-query"]');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Ctrl/Cmd + / 显示快捷键帮助
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        showKeyboardShortcuts();
    }
});

// 显示键盘快捷键帮助
function showKeyboardShortcuts() {
    const shortcuts = [
        { key: 'Ctrl/Cmd + K', description: '聚焦搜索框' },
        { key: 'Ctrl/Cmd + /', description: '显示快捷键帮助' },
        { key: 'Esc', description: '关闭搜索或模态框' },
        { key: '↑/↓', description: '导航搜索结果' },
        { key: 'Enter', description: '选择搜索结果' }
    ];
    
    let modal = document.createElement('div');
    modal.className = 'keyboard-shortcuts-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1002;
    `;
    
    let content = document.createElement('div');
    content.style.cssText = `
        background-color: var(--md-default-bg-color);
        padding: 2em;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    let title = document.createElement('h3');
    title.textContent = '键盘快捷键';
    title.style.cssText = 'margin-top: 0; color: var(--md-primary-fg-color);';
    
    let list = document.createElement('ul');
    list.style.cssText = 'list-style: none; padding: 0;';
    
    shortcuts.forEach(shortcut => {
        let item = document.createElement('li');
        item.style.cssText = 'margin: 0.5em 0; display: flex; justify-content: space-between;';
        
        let key = document.createElement('kbd');
        key.textContent = shortcut.key;
        key.style.cssText = `
            background-color: var(--md-default-fg-color--lightest);
            padding: 0.2em 0.4em;
            border-radius: 4px;
            font-family: monospace;
        `;
        
        let description = document.createElement('span');
        description.textContent = shortcut.description;
        
        item.appendChild(key);
        item.appendChild(description);
        list.appendChild(item);
    });
    
    let closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.cssText = `
        margin-top: 1em;
        padding: 0.5em 1em;
        background-color: var(--md-primary-fg-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;
    
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    content.appendChild(title);
    content.appendChild(list);
    content.appendChild(closeButton);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// 添加页面加载动画
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// 添加打印功能
function addPrintFunctionality() {
    const printButton = document.createElement('button');
    printButton.innerHTML = '🖨️ 打印';
    printButton.className = 'print-button';
    printButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 80px;
        padding: 10px 15px;
        background-color: var(--md-primary-fg-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        z-index: 1000;
        font-size: 14px;
        transition: all 0.3s ease;
    `;
    
    printButton.addEventListener('click', () => {
        window.print();
    });
    
    printButton.addEventListener('mouseenter', () => {
        printButton.style.transform = 'scale(1.05)';
    });
    
    printButton.addEventListener('mouseleave', () => {
        printButton.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(printButton);
}

// 初始化打印功能
addPrintFunctionality();