# @logseq/libs@0.2.3 Library Documentation

## Overview

`@logseq/libs` is an SDK library for developing Logseq plugins. By using this library you can access Logseq features and build custom plugins.

### Basic info
- **Version**: 0.2.3
- **Description**: Logseq SDK libraries
- **Main file**: `dist/lsplugin.user.js`
- **Type definitions**: `index.d.ts`
- **License**: MIT (estimated)
- **Dependencies**: csstype, debug, deepmerge, dompurify, eventemitter3, fast-deep-equal, lodash-es, path, snake-case

### Tech stack

#### About important dependencies
- **eventemitter3**: foundation for the event management system
- **dompurify**: HTML sanitization to prevent XSS
- **deepmerge**: deep merge for objects
- **fast-deep-equal**: fast object comparison
- **csstype**: CSS typings for TypeScript
- **debug**: debug logging helper

### Installation

```bash
# yarn
yarn add @logseq/libs

# npm
npm install @logseq/libs

# pnpm
pnpm add @logseq/libs
```

### Basic usage

```javascript
import "@logseq/libs"

// a global `logseq` object becomes available
console.log(logseq)

// TypeScript typed usage
import { ILSPluginUser } from '@logseq/libs/dist/LSPlugin'
declare global {
  const logseq: ILSPluginUser
}
```

### Plugin lifecycle

```typescript
// 1. initialize plugin
import '@logseq/libs'

// 2. optional: define settings schema
logseq.useSettingsSchema([...])

// 3. provide model and UI
logseq.provideModel({...})
logseq.provideUI({...})
logseq.provideStyle('...')

// 4. ready
logseq.ready(() => {
  console.log('Plugin is ready!')
}).catch(console.error)

// 5. cleanup (optional)
logseq.beforeunload(async () => {
  // release resources
})
```

## Architecture

### Main interface structure

```
ILSPluginUser (main interface)
├── App: IAppProxy          - app-level APIs
│   ├── info retrieval (getInfo, getUserInfo, getCurrentGraph)
│   ├── command management (registerCommand, registerCommandShortcut)
│   ├── state management (getStateFromStore, setStateFromStore)
│   ├── templates (getTemplate, createTemplate, insertTemplate)
│   ├── navigation (pushState, replaceState)
│   └── event hooks (onCurrentGraphChanged, onThemeModeChanged)
│
├── Editor: IEditorProxy    - editor-related APIs
│   ├── block operations (getBlock, insertBlock, updateBlock, removeBlock)
│   ├── page operations (getPage, createPage, deletePage, renamePage)
│   ├── editing state (checkEditing, insertAtEditingCursor, exitEditingMode)
│   ├── selection operations (getSelectedBlocks, clearSelectedBlocks)
│   ├── properties (upsertBlockProperty, getBlockProperty)
│   └── command registrations (registerSlashCommand, registerBlockContextMenuItem)
│
├── DB: IDBProxy            - database / datascript APIs
│   ├── queries (q - DSL queries, datascriptQuery)
│   └── change watching (onChanged, onBlockChanged)
│
├── Git: IGitProxy          - Git-related APIs
│   ├── run commands (execCommand)
│   └── manage settings (loadIgnoreFile, saveIgnoreFile)
│
├── UI: IUIProxy            - UI-related APIs
│   ├── messages (showMsg, closeMsg)
│   ├── DOM queries (queryElementRect, queryElementById)
│   └── theme (resolveThemeCssPropsVals)
│
├── Assets: IAssetsProxy    - assets management APIs
│   ├── file listing (listFilesOfCurrentGraph, makeUrl)
│   ├── storage (makeSandboxStorage)
│   └── system integrations (builtInOpen)
│
├── Request: LSPluginRequest    - HTTP request APIs
│   ├── HTTP calls (_request)
│   └── task management (LSPluginRequestTask)
│
├── FileStorage: LSPluginFileStorage - file storage APIs
│   ├── CRUD (setItem, getItem, removeItem)
│   └── management (allKeys, clear, hasItem)
│
└── Experiments: LSPluginExperiments - experimental APIs
    ├── React/ReactDOM access
    ├── Clojure/JS conversion utilities
    ├── custom renderer registration
    └── extension enhancers
```

### Event system details

Logseq plugins use an EventEmitter-based event system:

```typescript
// plugin internal events
logseq.on('ui:visible:changed', (visible: boolean) => {
  console.log('UI visibility changed:', visible)
})

logseq.on('settings:changed', (newSettings, oldSettings) => {
  console.log('Settings updated:', newSettings)
})

// App-level events
logseq.App.onCurrentGraphChanged(({ graph }) => {
  console.log('Graph changed:', graph.name)
})

logseq.App.onThemeModeChanged(({ mode }) => {
  console.log('Theme mode:', mode) // 'light' | 'dark'
})

logseq.App.onGraphAfterIndexed(({ repo }) => {
  console.log('Graph indexed:', repo)
})
```

### Plugin modes

```typescript
// plugin sandboxing mode
interface LSPluginPkgConfig {
  mode: 'shadow' | 'iframe'  // sandboxing level
}

// shadow mode: lighter, runs in same context as host page
// iframe mode: safer, runs in isolated context
```

### Data flow architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Logseq Core   │◄──►│  Plugin Bridge   │◄──►│  Plugin Code    │
│                 │    │                  │    │                 │
│ • Graph Data    │    │ • API Proxy      │    │ • UI Components │
│ • User Settings │    │ • Event Routing  │    │ • Business Logic│
│ • Theme System  │    │ • Security Layer │    │ • Data Processing│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Major API categories

### 1. App API (`logseq.App`)

Provides operations related to the entire application.

#### Basic info retrieval
```typescript
// get app info
const appInfo = await logseq.App.getInfo()
console.log('Logseq version:', appInfo.version)
console.log('DB support:', appInfo.supportDb)

const userInfo = await logseq.App.getUserInfo()
console.log('User:', userInfo)

const userConfigs = await logseq.App.getUserConfigs()
console.log('Preferred format:', userConfigs.preferredFormat) // 'markdown' | 'org'
console.log('Theme mode:', userConfigs.preferredThemeMode)   // 'light' | 'dark'
console.log('Current graph:', userConfigs.currentGraph)

// current graph info
const currentGraph = await logseq.App.getCurrentGraph()
if (currentGraph) {
  console.log('Graph name:', currentGraph.name)
  console.log('Graph path:', currentGraph.path)
  console.log('Graph URL:', currentGraph.url)
}

const isDbGraph = await logseq.App.checkCurrentIsDbGraph()
console.log('Is database graph:', isDbGraph)

// graph-specific configs
const graphConfigs = await logseq.App.getCurrentGraphConfigs()
console.log('Graph configs:', graphConfigs)

// favorites and recent pages
const favorites = await logseq.App.getCurrentGraphFavorites()
console.log('Favorite pages:', favorites)

const recent = await logseq.App.getCurrentGraphRecent()
console.log('Recent pages:', recent)
```

#### Advanced state management
```typescript
// access internal app states
const docMode = await logseq.App.getStateFromStore('document/mode?')
const currentRoute = await logseq.App.getStateFromStore(['route-match', 'data'])
const leftSidebarOpen = await logseq.App.getStateFromStore('ui/left-sidebar-open?')

// update states
await logseq.App.setStateFromStore('ui/left-sidebar-open?', true)
await logseq.App.setStateFromStore(['ui', 'zoom-factor'], 1.2)

// complex state paths
const editorState = await logseq.App.getStateFromStore(['editor', 'editing?'])
const blockEditingState = await logseq.App.getStateFromStore(['editor', 'block'])
```

#### Registering commands
```typescript
// general command registration
logseq.App.registerCommand('plugin-id', {
  key: 'my-command',
  label: 'My Command',
  desc: 'My custom command',
  palette: true,  // show in command palette
  keybinding: {
    binding: 'mod+shift+c',
    mode: 'global'  // 'global' | 'non-editing' | 'editing'
  }
}, (e) => {
  console.log('Command executed!', e)
})

// command palette only
logseq.App.registerCommandPalette({
  key: 'palette-only-command',
  label: '🎨 Palette Only Command',
  keybinding: {
    binding: 'mod+alt+p'
  }
}, () => {
  logseq.UI.showMsg('Palette command executed!', 'success')
})

// register keyboard shortcuts (multiple bindings supported)
logseq.App.registerCommandShortcut({
  binding: ['mod+shift+t', 'ctrl+alt+t'],
  mac: 'cmd+shift+t'
}, () => {
  console.log('Shortcut triggered!')
}, {
  key: 'custom-shortcut',
  label: 'Custom Shortcut',
  desc: 'A custom keyboard shortcut'
})

// invoke external commands or other plugins
await logseq.App.invokeExternalCommand('logseq.editor/cycle-todo')
await logseq.App.invokeExternalPlugin('plugin-id.commands.command-key', arg1, arg2)

// get external plugin info
const externalPlugin = await logseq.App.getExternalPlugin('some-plugin-id')
if (externalPlugin) {
  console.log('External plugin found:', externalPlugin)
}
```

#### UI control and navigation
```typescript
// sidebars
logseq.App.setLeftSidebarVisible(true)   // or false, 'toggle'
logseq.App.setRightSidebarVisible('toggle')

// clear right sidebar blocks
logseq.App.clearRightSidebarBlocks({ close: true })

// full screen
logseq.App.setFullScreen(true)  // or false, 'toggle'

// zoom
logseq.App.setZoomFactor(1.5)

// navigation
logseq.App.pushState('page', { name: 'My Page' }, { query: 'search term' })
logseq.App.replaceState('journals', {}, { date: '2024-01-01' })

// open external link
await logseq.App.openExternalLink('https://example.com')

// relaunch / quit
await logseq.App.relaunch()
await logseq.App.quit()
```

#### Template management
```typescript
// check template
const templateExists = await logseq.App.existTemplate('daily-note')

// get template
const template = await logseq.App.getTemplate('daily-note')
if (template) {
  console.log('Template content:', template.content)
}

// create and insert template
await logseq.App.createTemplate(blockUuid, 'my-template', { overwrite: true })
await logseq.App.insertTemplate(targetBlockUuid, 'daily-note')

// remove template or get all templates
await logseq.App.removeTemplate('unused-template')
const allTemplates = await logseq.App.getCurrentGraphTemplates()
console.log('Available templates:', Object.keys(allTemplates || {}))
```

#### Register custom UI items
```typescript
// toolbar item
logseq.App.registerUIItem('toolbar', {
  key: 'my-toolbar-button',
  template: `
    <a class="button" data-on-click="handleToolbarClick">
      <i class="ti ti-calendar"></i>
      <span>Calendar</span>
    </a>
  `
})

// pagebar item
logseq.App.registerUIItem('pagebar', {
  key: 'page-info',
  template: `
    <div class="page-info">
      <span data-on-click="showPageInfo">ℹ️ Info</span>
    </div>
  `
})

// page menu item
logseq.App.registerPageMenuItem('🔗 Copy Page Link', (e) => {
  const pageName = e.page
  const pageUrl = `logseq://graph/${logseq.baseInfo.id}?page=${encodeURIComponent(pageName)}`
  navigator.clipboard.writeText(pageUrl)
  logseq.UI.showMsg(`Page link copied: ${pageName}`, 'success')
})
```

#### Event hooks (examples)
```typescript
// monitor graph changes
const unsubscribeGraphChanged = logseq.App.onCurrentGraphChanged(({ graph }) => {
  console.log('Graph changed:', graph)
  initializeForGraph(graph)
})

// graph indexed
logseq.App.onGraphAfterIndexed(({ repo }) => {
  console.log('Graph indexing completed:', repo)
  performPostIndexTasks()
})

// theme changes
logseq.App.onThemeModeChanged(({ mode }) => {
  console.log('Theme mode changed to:', mode) // 'light' | 'dark'
  updatePluginTheme(mode)
})

// today journal created
logseq.App.onTodayJournalCreated(({ title }) => {
  console.log('Today journal created:', title)
  addDailyTemplate(title)
})

// route changed
logseq.App.onRouteChanged(({ path, template }) => {
  console.log('Route changed:', { path, template })
  updateUIForRoute(path)
})

// sidebar visibility
logseq.App.onSidebarVisibleChanged(({ visible }) => {
  console.log('Sidebar visibility:', visible)
  adjustPluginLayout(visible)
})

// before/after command hooks
const unsubscribeBefore = logseq.App.onBeforeCommandInvoked('logseq.editor.cycle-todo', (e) => {
  console.log('About to cycle todo:', e)
})

const unsubscribeAfter = logseq.App.onAfterCommandInvoked('logseq.editor.cycle-todo', (e) => {
  console.log('Todo cycled:', e)
})

// block renderer slot example
logseq.App.onBlockRendererSlotted('specific-block-uuid', ({ slot, payload }) => {
  const blockData = payload
  logseq.provideUI({
    key: `block-renderer-${blockData.uuid}`,
    slot,
    template: `
      <div class="custom-block-renderer">
        <h3>${blockData.title}</h3>
        <div class="block-meta">
          Created: ${new Date(blockData.createdAt).toLocaleDateString()}
        </div>
      </div>
    `
  })
})

// macro renderer slot example
logseq.App.onMacroRendererSlotted(({ slot, payload: { arguments, uuid } }) => {
  let [type, ...args] = arguments
  
  switch (type) {
    case ':chart':
      const [chartType, data] = args
      logseq.provideUI({
        key: `chart-${uuid}`,
        slot,
        template: `
          <div class="chart-container" data-chart-type="${chartType}">
            <canvas id="chart-${uuid}"></canvas>
          </div>
        `
      })
      setTimeout(() => renderChart(uuid, chartType, data), 100)
      break
      
    case ':countdown':
      const [targetDate] = args
      logseq.provideUI({
        key: `countdown-${uuid}`,
        slot,
        template: `
          <div class="countdown-timer" id="countdown-${uuid}">
            <span class="countdown-display"></span>
          </div>
        `
      })
      startCountdownTimer(uuid, targetDate)
      break
      
    case ':weather':
      const [location] = args
      logseq.provideUI({
        key: `weather-${uuid}`,
        slot,
        template: `
          <div class="weather-widget" id="weather-${uuid}">
            <div class="loading">Loading weather...</div>
          </div>
        `
      })
      fetchAndDisplayWeather(uuid, location)
      break
  }
})

// page head actions slot
logseq.App.onPageHeadActionsSlotted(({ slot }) => {
  logseq.provideUI({
    key: 'page-head-action',
    slot,
    template: `
      <a class="page-action-btn" data-on-click="handlePageAction">
        <i class="ti ti-share"></i>
        Share
      </a>
    `
  })
})

// cleanup example
function cleanupEventListeners() {
  unsubscribeGraphChanged()
  unsubscribeBefore()
  unsubscribeAfter()
}

logseq.beforeunload(async () => {
  cleanupEventListeners()
})
```

### 2. Editor API (`logseq.Editor`)

Provides editor and block manipulation features.

#### Block operations
```typescript
// get current or specific block
const currentBlock = await logseq.Editor.getCurrentBlock()
const block = await logseq.Editor.getBlock(blockUuid)

// include children
const blockWithChildren = await logseq.Editor.getBlock(blockUuid, { includeChildren: true })

// get by entity id
const blockByEntityId = await logseq.Editor.getBlock(12345)

// insert block with options
const newBlock = await logseq.Editor.insertBlock(parentBlock, 'New content', {
  before: false,
  sibling: true,
  start: false,
  end: true,
  isPageBlock: false,
  focus: true,
  customUUID: 'custom-uuid-here',
  properties: {
    tags: ['important', 'todo'],
    priority: 'high',
    deadline: '2024-12-31'
  }
})

// insert batch (hierarchical)
const batchBlocks = await logseq.Editor.insertBatchBlock(parentBlock, [
  {
    content: 'Parent Block 1',
    properties: { type: 'section' },
    children: [
      {
        content: 'Child Block 1.1',
        children: [
          { content: 'Grandchild Block 1.1.1' }
        ]
      },
      {
        content: 'Child Block 1.2',
        properties: { status: 'done' }
      }
    ]
  },
  {
    content: 'Parent Block 2',
    properties: { priority: 'low' }
  }
], {
  before: false,
  sibling: true,
  keepUUID: true
})

// update, remove, move
await logseq.Editor.updateBlock(blockUuid, 'Updated content', {
  properties: {
    lastModified: new Date().toISOString(),
    modifiedBy: 'plugin'
  }
})

await logseq.Editor.removeBlock(blockUuid)

await logseq.Editor.moveBlock(sourceBlockUuid, targetBlockUuid, { before: true, children: false })

// collapse control
await logseq.Editor.setBlockCollapsed(blockUuid, true)
await logseq.Editor.setBlockCollapsed(blockUuid, false)
await logseq.Editor.setBlockCollapsed(blockUuid, 'toggle')

// previous/next sibling
const prevSibling = await logseq.Editor.getPreviousSiblingBlock(blockUuid)
const nextSibling = await logseq.Editor.getNextSiblingBlock(blockUuid)

// selection and focus
await logseq.Editor.selectBlock(blockUuid)
await logseq.Editor.editBlock(blockUuid, { pos: 0 })

// new UUID
const newUUID = await logseq.Editor.newBlockUUID()
console.log('Generated UUID:', newUUID)

// is page block
const isPage = logseq.Editor.isPageBlock(block)
```

#### Advanced block ops
```typescript
// prepend/append in page
const prependedBlock = await logseq.Editor.prependBlockInPage(pageIdentity, 'First block', { properties: { position: 'top' } })
const appendedBlock = await logseq.Editor.appendBlockInPage(pageIdentity, 'Last block', { properties: { position: 'bottom' } })

// scroll to block
logseq.Editor.scrollToBlockInPage('Page Name', blockUuid, { replaceState: true })

// open in right sidebar
logseq.Editor.openInRightSidebar(blockUuid)
```

#### Page operations
```typescript
// get pages
const currentPage = await logseq.Editor.getCurrentPage()
const page = await logseq.Editor.getPage(pageName)

// include children
const pageWithChildren = await logseq.Editor.getPage(pageName, { includeChildren: true })

// all pages
const allPages = await logseq.Editor.getAllPages()

// pages for a repo
const repoPages = await logseq.Editor.getAllPages('specific-repo-name')

// tags and properties
const allTags = await logseq.Editor.getAllTags()
const allProperties = await logseq.Editor.getAllProperties()

// create page with options
const newPage = await logseq.Editor.createPage('New Page', {
  alias: ['Alternative Name'],
  tags: ['category1', 'category2'],
  author: 'Plugin User',
  created: new Date().toISOString(),
  'custom-property': 'custom value'
}, {
  redirect: true,
  createFirstBlock: true,
  format: 'markdown',
  journal: false
})

// journal pages
const journalPage = await logseq.Editor.createJournalPage(new Date())
const specificDateJournal = await logseq.Editor.createJournalPage('2024-12-25')

// delete / rename
await logseq.Editor.deletePage('Page Name')
await logseq.Editor.renamePage('Old Name', 'New Name')

// namespace pages and tree
const namespace = 'Projects'
const pagesFromNamespace = await logseq.Editor.getPagesFromNamespace(namespace)
const pagesTree = await logseq.Editor.getPagesTreeFromNamespace(namespace)

// page blocks tree
const currentPageBlocks = await logseq.Editor.getCurrentPageBlocksTree()
const pageBlocks = await logseq.Editor.getPageBlocksTree('Specific Page')

// linked references
const linkedReferences = await logseq.Editor.getPageLinkedReferences('Target Page')
if (linkedReferences) {
  linkedReferences.forEach(([referencingPage, referencingBlocks]) => {
    console.log(`Referenced by page: ${referencingPage.name}`)
    referencingBlocks.forEach(block => {
      console.log(`  - Block: ${block.content}`)
    })
  })
}
```

#### Page properties
```typescript
// get page properties
const pageProperties = await logseq.Editor.getPageProperties('Page Name')
console.log('Page properties:', pageProperties)

// tag objects
const tagObjects = await logseq.Editor.getTagObjects('Page Name')
console.log('Tag objects:', tagObjects)
```

#### Editor state
```typescript
// check editing
const editingState = await logseq.Editor.checkEditing()
if (typeof editingState === 'string') {
  console.log('Currently editing block:', editingState)
} else if (editingState === true) {
  console.log('Editor is active but no specific block')
} else {
  console.log('Not in editing mode')
}

const editingContent = await logseq.Editor.getEditingBlockContent()
console.log('Current editing content:', editingContent)

const cursorPosition = await logseq.Editor.getEditingCursorPosition()
if (cursorPosition) {
  console.log('Cursor position:', { left: cursorPosition.left, top: cursorPosition.top, height: cursorPosition.height, pos: cursorPosition.pos, rect: cursorPosition.rect })
}

// insert to cursor, restore, exit editing
await logseq.Editor.insertAtEditingCursor('Inserted text')
await logseq.Editor.restoreEditingCursor()
await logseq.Editor.exitEditingMode()
await logseq.Editor.exitEditingMode(true)

// selection
const selectedBlocks = await logseq.Editor.getSelectedBlocks()
if (selectedBlocks) {
  console.log(`${selectedBlocks.length} blocks selected`)
}
await logseq.Editor.clearSelectedBlocks()

// save code editor content
await logseq.Editor.saveFocusedCodeEditorContent()
```

#### Advanced editor features
```typescript
// input selection end event
logseq.Editor.onInputSelectionEnd(({ caret, point, start, end, text }) => {
  console.log('Text selected:', { selectedText: text, startPos: start, endPos: end, caretInfo: caret, mousePosition: point })
  if (text.includes('TODO')) {
    showTodoActions(text)
  }
})

function showTodoActions(selectedText: string) {
  logseq.provideUI({
    key: 'todo-actions',
    path: '#app-container',
    template: `
      <div class="todo-actions-popup" style="position: fixed; top: 100px; left: 100px;">
        <button data-on-click="convertToTask">Convert to Task</button>
        <button data-on-click="addDeadline">Add Deadline</button>
        <button data-on-click="setPriority">Set Priority</button>
      </div>
    `
  })
}
```

#### Slash commands
```typescript
// simple slash command
logseq.Editor.registerSlashCommand('Say Hi', async ({ uuid }) => {
  await logseq.Editor.insertBlock(uuid, 'Hello from plugin!', { sibling: false })
  logseq.UI.showMsg('Greeting inserted!', 'success')
})

// rich slash command
logseq.Editor.registerSlashCommand('📊 Create Chart', async ({ uuid }) => {
  const chartId = `chart-${Date.now()}`
  await logseq.Editor.insertBlock(uuid, `{{renderer :chart, bar, ${chartId}}}`, { sibling: false, focus: true })
})

// multi-action slash command
logseq.Editor.registerSlashCommand('💥 Big Bang', [
  ['editor/hook', 'customCallback'],
  ['editor/clear-current-slash'],
  ['editor/input', 'Explosion! 💥']
])

// conditional slash command example
logseq.Editor.registerSlashCommand('🏷️ Smart Tag', async ({ uuid }) => {
  const block = await logseq.Editor.getBlock(uuid)
  if (!block) return
  const content = block.content || ''
  let suggestedTag = ''
  if (content.includes('meeting') || content.includes('会議')) {
    suggestedTag = '#meeting'
  } else if (content.includes('idea') || content.includes('アイデア')) {
    suggestedTag = '#idea'
  } else if (content.includes('task') || content.includes('タスク')) {
    suggestedTag = '#task'
  } else {
    suggestedTag = '#note'
  }
  await logseq.Editor.updateBlock(uuid, `${content} ${suggestedTag}`)
})

// template insertion slash command
logseq.Editor.registerSlashCommand('📝 Meeting Notes', async ({ uuid }) => {
  const template = `## Meeting Notes
Date: ${new Date().toLocaleDateString()}
Attendees: 
Agenda:
- 
Notes:
- 
Action Items:
- [ ] 
Next Meeting: `

  await logseq.Editor.updateBlock(uuid, template)
})

// external API example
logseq.Editor.registerSlashCommand('🌤️ Weather', async ({ uuid }) => {
  try {
    logseq.UI.showMsg('Fetching weather data...', 'info')
    const weatherData = await fetchWeatherData()
    const weatherBlock = `🌤️ **Weather Update**\nTemperature: ${weatherData.temperature}°C\nCondition: ${weatherData.condition}\nHumidity: ${weatherData.humidity}%\nUpdated: ${new Date().toLocaleString()}`
    await logseq.Editor.updateBlock(uuid, weatherBlock)
    logseq.UI.showMsg('Weather data inserted!', 'success')
  } catch (error) {
    logseq.UI.showMsg('Failed to fetch weather data', 'error')
    console.error('Weather fetch error:', error)
  }
})

// calculator slash command
logseq.Editor.registerSlashCommand('🧮 Calculator', async ({ uuid }) => {
  const expression = prompt('Enter calculation (e.g., 2 + 3 * 4):')
  if (!expression) return
  try {
    const result = evaluateExpression(expression)
    await logseq.Editor.updateBlock(uuid, `${expression} = **${result}**`)
  } catch (error) {
    logseq.UI.showMsg('Invalid expression', 'error')
  }
})

function evaluateExpression(expr: string): number {
  const sanitized = expr.replace(/[^0-9+\-*/.() ]/g, '')
  return Function(`"use strict"; return (${sanitized})`)()
}

async function fetchWeatherData() {
  return {
    temperature: Math.floor(Math.random() * 30) + 5,
    condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 50) + 30
  }
}
```

#### Block context menu
```typescript
// basic context menu item
logseq.Editor.registerBlockContextMenuItem('🔗 Copy Block Link', async ({ uuid }) => {
  const blockUrl = `logseq://graph/${logseq.baseInfo.id}?block-id=${uuid}`
  await navigator.clipboard.writeText(blockUrl)
  logseq.UI.showMsg('Block link copied!', 'success')
})

// format block menu
logseq.Editor.registerBlockContextMenuItem('🎨 Format Block', async ({ uuid }) => {
  const block = await logseq.Editor.getBlock(uuid)
  if (!block) return
  const content = block.content || ''
  const formatted = content
    .replace(/\b(TODO|DOING|DONE)\b/g, '**$1**')
    .replace(/#(\w+)/g, '_#$1_')
    .replace(/\[([^\]]+)\]/g, '`$1`')
  await logseq.Editor.updateBlock(uuid, formatted)
  logseq.UI.showMsg('Block formatted!', 'success')
})

// analyze text
logseq.Editor.registerBlockContextMenuItem('📊 Analyze Text', async ({ uuid }) => {
  const block = await logseq.Editor.getBlock(uuid)
  if (!block) return
  const content = block.content || ''
  const stats = {
    characters: content.length,
    words: content.split(/\s+/).filter(w => w.length > 0).length,
    sentences: content.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
    paragraphs: content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
  }
  const analysisBlock = `**Text Analysis**\nCharacters: ${stats.characters}\nWords: ${stats.words}\nSentences: ${stats.sentences}\nParagraphs: ${stats.paragraphs}`
  await logseq.Editor.insertBlock(uuid, analysisBlock, { sibling: true })
})
```

#### Highlight context menu (PDF)
```typescript
// for highlighted text in PDF
logseq.Editor.registerHighlightContextMenuItem('📝 Create Note', ({ text, position }) => {
  console.log('Highlighted text:', text)
  console.log('Position:', position)
  const noteContent = `**Note from PDF**\nHighlighted: "${text}"\nCreated: ${new Date().toLocaleString()}`
  logseq.Editor.appendBlockInPage(await logseq.Editor.getCurrentPage(), noteContent)
}, { clearSelection: true })

logseq.Editor.registerHighlightContextMenuItem('🔖 Add to References', ({ text }) => {
  const referenceText = `((${Date.now()})) ${text}`
  logseq.Editor.appendBlockInPage('References', referenceText)
  logseq.UI.showMsg('Added to references!', 'success')
})
```

#### Property operations
```typescript
// upsert property schema
await logseq.Editor.upsertProperty('custom-property', {
  type: 'default',
  cardinality: 'one',
  hide: false,
  public: true
}, { name: 'Custom Property' })

const propertyInfo = await logseq.Editor.getProperty('custom-property')
await logseq.Editor.removeProperty('unused-property')

// block properties
await logseq.Editor.upsertBlockProperty(blockUuid, 'status', 'in-progress')
await logseq.Editor.upsertBlockProperty(blockUuid, 'priority', 'high')
await logseq.Editor.upsertBlockProperty(blockUuid, 'tags', ['work', 'urgent'])
await logseq.Editor.upsertBlockProperty(blockUuid, 'deadline', '2024-12-31')

// complex property
await logseq.Editor.upsertBlockProperty(blockUuid, 'metadata', { author: 'Plugin User', created: new Date().toISOString(), version: '1.0', category: 'automation' })

// get block properties
const status = await logseq.Editor.getBlockProperty(blockUuid, 'status')
const priority = await logseq.Editor.getBlockProperty(blockUuid, 'priority')
const allBlockProperties = await logseq.Editor.getBlockProperties(blockUuid)

// remove
await logseq.Editor.removeBlockProperty(blockUuid, 'completed-date')

// page properties
const pageProperties = await logseq.Editor.getPageProperties('Project Planning')

// property-based examples (tasks, rating)
async function updateTaskStatus(blockUuid: string, newStatus: 'todo' | 'doing' | 'done') {
  await logseq.Editor.upsertBlockProperty(blockUuid, 'status', newStatus)
  await logseq.Editor.upsertBlockProperty(blockUuid, 'updated-at', new Date().toISOString())
  if (newStatus === 'done') {
    await logseq.Editor.upsertBlockProperty(blockUuid, 'completed-at', new Date().toISOString())
  }
  const block = await logseq.Editor.getBlock(blockUuid)
  if (block) {
    const content = block.content?.replace(/^(TODO|DOING|DONE)\s*/, '') || ''
    const newContent = `${newStatus.toUpperCase()} ${content}`
    await logseq.Editor.updateBlock(blockUuid, newContent)
  }
}

async function rateContent(blockUuid: string, rating: number) {
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5')
  await logseq.Editor.upsertBlockProperty(blockUuid, 'rating', rating)
  await logseq.Editor.upsertBlockProperty(blockUuid, 'rated-at', new Date().toISOString())
  const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  await logseq.Editor.upsertBlockProperty(blockUuid, 'rating-display', stars)
}

// find blocks by property (example)
async function findBlocksByProperty(propertyKey: string, propertyValue: any) {
  const query = `\n    [:find (pull ?b [*])\n     :where \n     [?b :block/properties ?props]\n     [(get ?props :${propertyKey}) ?value]\n     [(= ?value "${propertyValue}")]]\n  `
  const results = await logseq.DB.q(query)
  return results || []
}

const highPriorityBlocks = await findBlocksByProperty('priority', 'high')
const completedTasks = await findBlocksByProperty('status', 'done')
```

### 3. DB API (`logseq.DB`)

Provides queries against datascript and change watching.

#### Queries
```typescript
// DSL query
const todoBlocks = await logseq.DB.q(`
  [:find (pull ?b [*])
   :where 
   [?b :block/content ?content]
   [(clojure.string/includes? ?content "TODO")]]
`)

// recent blocks
const recentBlocks = await logseq.DB.q(`
  [:find (pull ?b [*])
   :where 
   [?b :block/created-at ?created]
   [(> ?created ${Date.now() - 24 * 60 * 60 * 1000})]]
`)

// page blocks
const pageBlocks = await logseq.DB.q(`
  [:find (pull ?b [*])
   :where
   [?p :block/name "Project Planning"]
   [?b :block/page ?p]]
`)

// property based query example
const priorityBlocks = await logseq.DB.q(`
  [:find (pull ?b [*])
   :where
   [?b :block/properties ?props]
   [(get ?props :priority) ?priority]
   [(= ?priority "high")]]
`)

// tagged blocks
const taggedBlocks = await logseq.DB.q(`
  [:find (pull ?b [*])
   :where
   [?b :block/refs ?r]
   [?r :block/name "important"]]
`)

// journal pages
const journalPages = await logseq.DB.q(`
  [:find (pull ?p [*])
   :where
   [?p :block/journal? true]]
`)

// datascript low-level query
const directQuery = await logseq.DB.datascriptQuery(`
  [:find ?e ?content ?created
   :where 
   [?e :block/content ?content]
   [?e :block/created-at ?created]
   [(> ?created ${Date.now() - 7 * 24 * 60 * 60 * 1000})]]
`)

// parameterized query
const searchTerm = "meeting"
const searchResults = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :in $ ?search-term
   :where
   [?b :block/content ?content]
   [(clojure.string/includes? ?content ?search-term)]]
`, searchTerm)
```

#### Advanced query patterns
```typescript
// recursive block hierarchy
async function getBlockHierarchy(rootBlockUuid: string) {
  const query = `
    [:find (pull ?b [* {:block/children ...}])
     :where
     [?b :block/uuid ?uuid]
     [(= ?uuid #uuid "${rootBlockUuid}")]]
  `
  return await logseq.DB.q(query)
}

// activity timeline
async function getActivityTimeline(days: number = 7) {
  const startTime = Date.now() - (days * 24 * 60 * 60 * 1000)
  const query = `
    [:find ?date (count ?blocks)
     :where
     [?b :block/created-at ?created]
     [(> ?created ${startTime})]
     [?b :block/page ?p]
     [?p :block/journal-day ?journal-day]
     [(str ?journal-day) ?date]]
  `
  return await logseq.DB.q(query)
}

// cross-reference analysis
async function findRelatedContent(keyword: string) {
  const query = `
    [:find (pull ?b [*]) (count ?refs)
     :where
     [?b :block/content ?content]
     [(clojure.string/includes? ?content "${keyword}")]
     [?b :block/refs ?r]
     [?other :block/refs ?r]
     [(!= ?b ?other)]]
  `
  return await logseq.DB.q(query)
}

// metrics analysis
async function analyzeContentMetrics() {
  const metrics = await logseq.DB.q(`
    [:find 
     (count ?total-blocks)
     (count ?todo-blocks) 
     (count ?done-blocks)
     (count ?tagged-blocks)
     :where
     [?total-blocks :block/content]
     [?todo-blocks :block/content ?todo-content]
     [?done-blocks :block/content ?done-content]
     [?tagged-blocks :block/refs]
     [(clojure.string/includes? ?todo-content "TODO")]
     [(clojure.string/includes? ?done-content "DONE")]]
  `)
  return {
    totalBlocks: metrics[0][0],
    todoBlocks: metrics[0][1],
    doneBlocks: metrics[0][2],
    taggedBlocks: metrics[0][3]
  }
}
```

#### Change watching
```typescript
// watch DB-wide changes
const unsubscribeDbChanged = logseq.DB.onChanged(({ blocks, txData, txMeta }) => {
  console.log(`DB changed: ${blocks.length} blocks affected`)
  console.log('Transaction metadata:', txMeta)
  blocks.forEach(block => {
    console.log(`Block ${block.uuid}: ${block.content}`)
    if (block.content?.includes('TODO')) handleTodoChange(block)
    if (block.properties?.priority === 'urgent') handleUrgentTask(block)
  })
  txData.forEach(([e, a, v, t, added]) => {
    console.log(`Entity: ${e}, Attribute: ${a}, Value: ${v}, Added: ${added}`)
  })
  if (txMeta?.outlinerOp) {
    switch (txMeta.outlinerOp) {
      case 'save-block': handleBlockSave(blocks[0]); break
      case 'insert-blocks': handleBlocksInsert(blocks); break
      case 'delete-blocks': handleBlocksDelete(blocks); break
      case 'move-blocks': handleBlocksMove(blocks); break
    }
  }
})

// watch a specific block
const unsubscribeBlockChanged = logseq.DB.onBlockChanged('specific-block-uuid', (block, txData, txMeta) => {
  console.log('Specific block changed:', block.content)
  const previousContent = getPreviousContent(block.uuid)
  if (previousContent !== block.content) logContentChange(block.uuid, previousContent, block.content)
  if (block.properties) {
    Object.entries(block.properties).forEach(([key, value]) => console.log(`Property ${key} changed to:`, value))
  }
})

// block change tracker example class
class BlockChangeTracker { ... }

const tracker = new BlockChangeTracker()
tracker.start()

function handleTodoChange(block: any) { ... }
function handleUrgentTask(block: any) { ... }
function handleBlockSave(block: any) { ... }
function handleBlocksInsert(blocks: any[]) { ... }
function handleBlocksDelete(blocks: any[]) { ... }
function handleBlocksMove(blocks: any[]) { ... }

function getPreviousContent(blockUuid: string): string | null { return localStorage.getItem(`prev_content_${blockUuid}`) }
function logContentChange(blockUuid: string, oldContent: string | null, newContent: string | undefined) { ... }
function updateTaskMetrics() { ... }
function addToUrgentList(block: any) { ... }
function backupImportantBlock(block: any) { ... }

logseq.beforeunload(async () => { unsubscribeDbChanged(); unsubscribeBlockChanged(); tracker.stop() })
```

### 4. UI API (`logseq.UI`)

UI operations and message display.

```typescript
// basic messages
const msgKey = await logseq.UI.showMsg('Operation completed!', 'success')
await logseq.UI.showMsg('Warning message', 'warning')
await logseq.UI.showMsg('Error occurred', 'error')
await logseq.UI.showMsg('Information', 'info')

// options
const msgKey2 = await logseq.UI.showMsg('Custom message', 'success', { key: 'custom-msg-key', timeout: 5000 })
logseq.UI.closeMsg(msgKey)

// persistent
const persistentMsg = await logseq.UI.showMsg('Persistent notification', 'info', { timeout: 0 })

// query element rect
const rect = await logseq.UI.queryElementRect('.logseq-header')

// multiple rects
const blockRects = await logseq.UI.queryElementRect('.ls-block')

// element id checks
const headerExists = await logseq.UI.queryElementById('logseq-header')
const customElementExists = await logseq.UI.queryElementById('my-plugin-element')

// check slot validity and provide UI
const isMainSlotValid = await logseq.UI.checkSlotValid('main')
if (isMainSlotValid) {
  logseq.provideUI({ key: 'main-content', slot: 'main', template: '<div>Main content</div>' })
}

// resolve theme CSS vars
const themeValues = await logseq.UI.resolveThemeCssPropsVals(['--ls-primary-background-color','--ls-primary-text-color','--ls-border-color'])
if (themeValues) {
  logseq.provideStyle(`.my-plugin-element { background-color: ${themeValues['--ls-primary-background-color']}; color: ${themeValues['--ls-primary-text-color']}; border: 1px solid ${themeValues['--ls-border-color']}; }`)
}
```

#### Advanced UI control
```typescript
// progress message helper
async function showProgressMessage(task: string, total: number) { ... }

// dynamic message class
class DynamicMessage { ... }

// UI monitoring
async function monitorUIChanges() { ... }

// responsive adjustments
async function adjustUIForScreenSize() { ... }
```

### 5. Assets API (`logseq.Assets`)

```typescript
const files = await logseq.Assets.listFilesOfCurrentGraph(['jpg','png'])
const storage = logseq.Assets.makeSandboxStorage()
const assetUrl = await logseq.Assets.makeUrl('path/to/file.png')
const opened = await logseq.Assets.builtInOpen('path/to/file.pdf')
```

### 6. Git API (`logseq.Git`)

```typescript
const result = await logseq.Git.execCommand(['status'])
console.log(result.stdout, result.stderr, result.exitCode)
const ignoreContent = await logseq.Git.loadIgnoreFile()
await logseq.Git.saveIgnoreFile(ignoreContent + '\n*.tmp')
```

### 7. Request API (`logseq.Request`)

```typescript
const response = await logseq.Request._request({ url: 'https://api.example.com/data', method: 'GET', returnType: 'json' })
const task = await logseq.Request._request({ url: 'https://api.example.com/data', abortable: true })
task.abort()
```

### 8. FileStorage API (`logseq.FileStorage`)

```typescript
await logseq.FileStorage.setItem('config.json', JSON.stringify(config))
const data = await logseq.FileStorage.getItem('config.json')
const config = JSON.parse(data)
const allKeys = await logseq.FileStorage.allKeys()
const exists = await logseq.FileStorage.hasItem('config.json')
await logseq.FileStorage.removeItem('config.json')
await logseq.FileStorage.clear()
```

### 9. Experiments API (`logseq.Experiments`)

```typescript
const React = logseq.Experiments.React
const ReactDOM = logseq.Experiments.ReactDOM
const cljData = logseq.Experiments.Utils.toClj(jsObject)
const jsData = logseq.Experiments.Utils.toJs(cljData)
logseq.Experiments.registerFencedCodeRenderer('custom-lang', { edit: true, render: ({ content }) => `<div class="custom-block">${content}</div>` })
logseq.Experiments.registerExtensionsEnhancer('codemirror', async (cm) => { /* customize CodeMirror */ })
```

## Plugin development best practices

### 1. Plugin initialization
```typescript
import '@logseq/libs'

function main() {
  console.log('Plugin loaded')
  logseq.useSettingsSchema([
    { key: 'apiKey', type: 'string', title: 'API Key', description: 'Enter your API key', default: '' },
    { key: 'enableFeature', type: 'boolean', title: 'Enable Feature', description: 'Enable the special feature', default: true }
  ])

  logseq.provideModel({
    async openDialog() { logseq.showMainUI() },
    async processBlock(blockUuid) { const block = await logseq.Editor.getBlock(blockUuid) }
  })

  logseq.provideUI({ key: 'main-ui', slot: 'main', template: `\n      <div id="plugin-main">\n        <h2>My Plugin</h2>\n        <button data-on-click="openDialog">Open Dialog</button>\n      </div>\n    ` })

  logseq.provideStyle(`#plugin-main { padding: 10px; background: var(--ls-primary-background-color); }`)
}

logseq.ready(main).catch(console.error)
```

### 2. Error handling
```typescript
async function safeBlockOperation(blockUuid) {
  try {
    const block = await logseq.Editor.getBlock(blockUuid)
    if (!block) {
      logseq.UI.showMsg('Block not found', 'error')
      return
    }
    await logseq.Editor.updateBlock(blockUuid, 'Updated content')
    logseq.UI.showMsg('Block updated successfully', 'success')
  } catch (error) {
    console.error('Error updating block:', error)
    logseq.UI.showMsg('Failed to update block', 'error')
  }
}
```

### 3. Settings management
```typescript
function getApiKey() { return logseq.settings?.apiKey || '' }
logseq.onSettingsChanged((newSettings, oldSettings) => {
  console.log('Settings changed:', newSettings)
  if (newSettings.apiKey !== oldSettings.apiKey) reinitializeService(newSettings.apiKey)
})
```

### 4. Event management
```typescript
const unsubscribeGraphChanged = logseq.App.onCurrentGraphChanged(({ graph }) => console.log('Graph changed to:', graph))
const unsubscribeBlockChanged = logseq.DB.onBlockChanged(blockUuid, (block) => console.log('Block content changed:', block.content))
logseq.beforeunload(async () => { unsubscribeGraphChanged(); unsubscribeBlockChanged(); console.log('Plugin cleanup completed') })
```

## Using Type Definitions

```typescript
import '@logseq/libs'
import { BlockEntity, PageEntity, IHookEvent } from '@logseq/libs/dist/LSPlugin'

interface PluginSettings { apiKey: string; enableFeature: boolean; maxResults: number }
interface CustomBlockData { uuid: string; title: string; tags: string[] }

async function processCustomBlocks(): Promise<CustomBlockData[]> {
  const blocks = await logseq.DB.q(`
    [:find (pull ?b [*])
     :where [?b :block/content ?content]
     [(clojure.string/includes? ?content "#custom")]]
  `) as BlockEntity[]
  return blocks.map(block => ({ uuid: block.uuid, title: block.content?.split('\n')[0] || '', tags: extractTags(block.content || '') }))
}

function extractTags(content: string): string[] {
  const tagRegex = /#(\w+)/g
  const matches = content.match(tagRegex) || []
  return matches.map(tag => tag.substring(1))
}
```

## Performance considerations

### 1. Processing large amounts of data
```typescript
async function processManyBlocks(blockUuids: string[]) {
  const batchSize = 50
  for (let i = 0; i < blockUuids.length; i += batchSize) {
    const batch = blockUuids.slice(i, i + batchSize)
    const promises = batch.map(uuid => logseq.Editor.getBlock(uuid))
    const blocks = await Promise.all(promises)
    for (const block of blocks) { if (block) { /* process */ } }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}
```

### 2. Event listener optimization
```typescript
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void { ... }

const debouncedHandler = debounce((block: BlockEntity) => { console.log('Block changed:', block.uuid) }, 300)
logseq.DB.onChanged(({ blocks }) => { blocks.forEach(debouncedHandler) })
```

## Security considerations

### 1. XSS mitigation
```typescript
function escapeHtml(text: string): string { const div = document.createElement('div'); div.textContent = text; return div.innerHTML }
logseq.provideUI({ key: 'safe-ui', slot: 'main', template: `<div><h3>${escapeHtml(userInput)}</h3></div>` })
```

### 2. API key safety
```typescript
logseq.useSettingsSchema([{ key: 'apiKey', type: 'string', title: 'API Key', description: 'Enter your API key (stored locally)', default: '' }])

async function makeSecureRequest(data: any) {
  const apiKey = logseq.settings?.apiKey
  if (!apiKey) { logseq.UI.showMsg('API key not configured', 'error'); return }
  try {
    const response = await logseq.Request._request({ url: 'https://api.example.com/data', method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, data: JSON.stringify(data), returnType: 'json' })
    return response
  } catch (error) {
    console.error('API request failed:', error)
    logseq.UI.showMsg('API request failed', 'error')
  }
}
```

## Troubleshooting

### Common issues and fixes
1. **Plugin not loading**
   - Check `package.json` main field
   - Ensure `logseq.ready()` is called

2. **API calls fail**
   - Ensure `await` used properly
   - Ensure error handling implemented

3. **UI not showing**
   - Verify `provideUI` slot is valid
   - Check template HTML validity

4. **Performance problems**
   - Don't process huge datasets at once
   - Manage event listeners properly

## Summary

`@logseq/libs@0.2.3` is a comprehensive SDK for Logseq plugin development. It provides App, Editor, DB, UI, Assets, Git, Request, FileStorage, and Experiments APIs to access Logseq features.

Use proper typings, error handling, performance optimization, and security measures to build robust, user-friendly plugins.

### References
- https://logseq.github.io/plugins/
- https://github.com/logseq/logseq-plugin-samples
- https://github.com/pengx17/logseq-plugin-template-react
- https://discord.gg/KpN4eHY
