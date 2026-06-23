const fs = require('fs');

// Mock localStorage and sessionStorage
const storageMock = () => {
    let storage = {};
    return {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => { storage[key] = String(value); },
        removeItem: (key) => { delete storage[key]; },
        clear: () => { storage = {}; }
    };
};

// Mock Document and elements
class MockElement {
    constructor(tagName = 'div') {
        this.tagName = tagName;
        this.id = '';
        this.className = '';
        this.attributes = {};
        this.childNodes = [];
        this._innerHTML = '';
        this.style = {};
    }
    setAttribute(name, val) { this.attributes[name] = val; }
    getAttribute(name) { return this.attributes[name] || null; }
    appendChild(node) { this.childNodes.push(node); }
    removeChild(node) {
        const idx = this.childNodes.indexOf(node);
        if (idx !== -1) this.childNodes.splice(idx, 1);
    }
    querySelectorAll(selector) {
        if (selector === '.filter-btn') {
            return [
                new MockElement('button'),
                new MockElement('button'),
                new MockElement('button'),
                new MockElement('button')
            ];
        }
        if (selector === '.skills-list .progress') {
            return [];
        }
        if (selector === '.suggest-btn') {
            return [];
        }
        if (selector === '.stem-checkbox input') {
            return [];
        }
        return [];
    }
    querySelector(selector) {
        return null;
    }
    addEventListener(event, callback) {}
    removeEventListener(event, callback) {}
    set innerHTML(val) {
        this._innerHTML = val;
    }
    get innerHTML() {
        return this._innerHTML;
    }
    getContext(type) {
        return {
            clearRect: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            createLinearGradient: () => {
                return { addColorStop: () => {} };
            }
        };
    }
}

global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: () => {},
    location: { href: '' },
    scrollY: 0
};
global.document = {
    readyState: 'complete',
    addEventListener: (event, callback) => {
        if (event === 'DOMContentLoaded') {
            setTimeout(callback, 0);
        }
    },
    getElementById: (id) => {
        console.log(`[Mock DOM] getElementById: ${id}`);
        const el = new MockElement();
        el.id = id;
        return el;
    },
    querySelectorAll: (selector) => {
        console.log(`[Mock DOM] querySelectorAll: ${selector}`);
        return [];
    },
    createElement: (tag) => {
        return new MockElement(tag);
    },
    createElementNS: (ns, tag) => {
        return new MockElement(tag);
    },
    body: new MockElement('body')
};
global.localStorage = storageMock();
global.sessionStorage = storageMock();

// Mock fetch to return projects.json content
global.fetch = (url) => {
    console.log(`[Mock fetch] Fetching URL: ${url}`);
    return Promise.resolve({
        ok: true,
        status: 200,
        json: () => {
            if (url === 'projects.json') {
                return Promise.resolve(JSON.parse(fs.readFileSync('projects.json', 'utf8')));
            }
            return Promise.resolve({ count: 123 });
        }
    });
};

global.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 16);
global.cancelAnimationFrame = () => {};

// Load script.js
console.log('Loading script.js...');
require('../script.js');
console.log('script.js loaded.');
