# @logseq/libs@0.2.3 ライブラリ解説ドキュメント

## 概要

`@logseq/libs` は、Logseqプラグイン開発のためのSDKライブラリです。このライブラリを使用することで、Logseqの機能にアクセスし、カスタムプラグインを作成できます。

### 基本情報
- **バージョン**: 0.2.3
- **説明**: Logseq SDK libraries
- **メインファイル**: `dist/lsplugin.user.js`
- **型定義**: `index.d.ts`
- **ライセンス**: MIT（推定）
- **依存関係**: csstype, debug, deepmerge, dompurify, eventemitter3, fast-deep-equal, lodash-es, path, snake-case

### 技術スタック

#### 依存ライブラリの詳細
- **eventemitter3**: イベント管理システムの基盤
- **dompurify**: XSS攻撃防止のためのHTMLサニタイゼーション
- **deepmerge**: オブジェクトの深いマージ機能
- **fast-deep-equal**: 高速なオブジェクト比較
- **csstype**: TypeScriptでのCSS型定義
- **debug**: デバッグログ出力機能

### インストール

```bash
# yarn を使用
yarn add @logseq/libs

# npm を使用
npm install @logseq/libs

# pnpm を使用
pnpm add @logseq/libs
```

### 基本的な使用方法

```javascript
import "@logseq/libs"

// logseqオブジェクトがグローバルに利用可能になります
console.log(logseq)

// TypeScriptでの型安全な使用
import { ILSPluginUser } from '@logseq/libs/dist/LSPlugin'
declare global {
  const logseq: ILSPluginUser
}
```

### プラグインのライフサイクル

```typescript
// 1. プラグイン初期化
import '@logseq/libs'

// 2. 設定スキーマの定義（オプション）
logseq.useSettingsSchema([...])

// 3. モデルとUIの提供
logseq.provideModel({...})
logseq.provideUI({...})
logseq.provideStyle('...')

// 4. プラグインの準備完了
logseq.ready(() => {
  console.log('Plugin is ready!')
}).catch(console.error)

// 5. クリーンアップ（オプション）
logseq.beforeunload(async () => {
  // リソースのクリーンアップ
})
```

## アーキテクチャ

### 主要なインターフェース構造

```
ILSPluginUser (メインインターフェース)
├── App: IAppProxy          - アプリレベルのAPI
│   ├── 情報取得 (getInfo, getUserInfo, getCurrentGraph)
│   ├── コマンド管理 (registerCommand, registerCommandShortcut)
│   ├── 状態管理 (getStateFromStore, setStateFromStore)
│   ├── テンプレート (getTemplate, createTemplate, insertTemplate)
│   ├── ナビゲーション (pushState, replaceState)
│   └── イベントフック (onCurrentGraphChanged, onThemeModeChanged)
│
├── Editor: IEditorProxy    - エディタ関連のAPI
│   ├── ブロック操作 (getBlock, insertBlock, updateBlock, removeBlock)
│   ├── ページ操作 (getPage, createPage, deletePage, renamePage)
│   ├── 編集状態 (checkEditing, insertAtEditingCursor, exitEditingMode)
│   ├── 選択操作 (getSelectedBlocks, clearSelectedBlocks)
│   ├── プロパティ (upsertBlockProperty, getBlockProperty)
│   └── コマンド登録 (registerSlashCommand, registerBlockContextMenuItem)
│
├── DB: IDBProxy            - データベース/Datascript関連のAPI
│   ├── クエリ実行 (q - DSLクエリ, datascriptQuery)
│   └── 変更監視 (onChanged, onBlockChanged)
│
├── Git: IGitProxy          - Git操作のAPI
│   ├── コマンド実行 (execCommand)
│   └── 設定管理 (loadIgnoreFile, saveIgnoreFile)
│
├── UI: IUIProxy            - UI操作のAPI
│   ├── メッセージ (showMsg, closeMsg)
│   ├── DOM操作 (queryElementRect, queryElementById)
│   └── テーマ (resolveThemeCssPropsVals)
│
├── Assets: IAssetsProxy    - アセット管理のAPI
│   ├── ファイル管理 (listFilesOfCurrentGraph, makeUrl)
│   ├── ストレージ (makeSandboxStorage)
│   └── システム連携 (builtInOpen)
│
├── Request: LSPluginRequest    - HTTP リクエストAPI
│   ├── HTTP通信 (_request)
│   └── タスク管理 (LSPluginRequestTask)
│
├── FileStorage: LSPluginFileStorage - ファイルストレージAPI
│   ├── CRUD操作 (setItem, getItem, removeItem)
│   └── 管理機能 (allKeys, clear, hasItem)
│
└── Experiments: LSPluginExperiments - 実験的機能API
    ├── React/ReactDOM アクセス
    ├── Clojure/JS変換ユーティリティ
    ├── カスタムレンダラー登録
    └── 拡張エンハンサー
```

### イベントシステムの詳細

Logseqプラグインは EventEmitter ベースのイベントシステムを使用しています：

```typescript
// プラグイン内部イベント
logseq.on('ui:visible:changed', (visible: boolean) => {
  console.log('UI visibility changed:', visible)
})

logseq.on('settings:changed', (newSettings, oldSettings) => {
  console.log('Settings updated:', newSettings)
})

// App レベルのイベント
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

### プラグインモード

```typescript
// プラグインの動作モード
interface LSPluginPkgConfig {
  mode: 'shadow' | 'iframe'  // サンドボックス化のレベル
}

// shadow mode: より軽量、ホストページと同じコンテキスト
// iframe mode: より安全、独立したコンテキスト
```

### データフローアーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Logseq Core   │◄──►│  Plugin Bridge   │◄──►│  Plugin Code    │
│                 │    │                  │    │                 │
│ • Graph Data    │    │ • API Proxy      │    │ • UI Components │
│ • User Settings │    │ • Event Routing  │    │ • Business Logic│
│ • Theme System  │    │ • Security Layer │    │ • Data Processing│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 主要なAPIカテゴリ

### 1. App API (`logseq.App`)

アプリケーション全体に関する操作を提供します。

#### 基本的な情報取得
```typescript
// アプリ情報取得
const appInfo = await logseq.App.getInfo()
console.log('Logseq version:', appInfo.version)
console.log('DB support:', appInfo.supportDb)

const userInfo = await logseq.App.getUserInfo()
console.log('User:', userInfo)

const userConfigs = await logseq.App.getUserConfigs()
console.log('Preferred format:', userConfigs.preferredFormat) // 'markdown' | 'org'
console.log('Theme mode:', userConfigs.preferredThemeMode)   // 'light' | 'dark'
console.log('Current graph:', userConfigs.currentGraph)

// 現在のグラフ情報
const currentGraph = await logseq.App.getCurrentGraph()
if (currentGraph) {
  console.log('Graph name:', currentGraph.name)
  console.log('Graph path:', currentGraph.path)
  console.log('Graph URL:', currentGraph.url)
}

const isDbGraph = await logseq.App.checkCurrentIsDbGraph()
console.log('Is database graph:', isDbGraph)

// グラフ固有の設定
const graphConfigs = await logseq.App.getCurrentGraphConfigs()
console.log('Graph configs:', graphConfigs)

// お気に入りページ
const favorites = await logseq.App.getCurrentGraphFavorites()
console.log('Favorite pages:', favorites)

// 最近のページ
const recent = await logseq.App.getCurrentGraphRecent()
console.log('Recent pages:', recent)
```

#### 高度な状態管理
```typescript
// アプリの内部状態へのアクセス
const docMode = await logseq.App.getStateFromStore('document/mode?')
const currentRoute = await logseq.App.getStateFromStore(['route-match', 'data'])
const leftSidebarOpen = await logseq.App.getStateFromStore('ui/left-sidebar-open?')

// 状態の更新
await logseq.App.setStateFromStore('ui/left-sidebar-open?', true)
await logseq.App.setStateFromStore(['ui', 'zoom-factor'], 1.2)

// より複雑な状態パス
const editorState = await logseq.App.getStateFromStore(['editor', 'editing?'])
const blockEditingState = await logseq.App.getStateFromStore(['editor', 'block'])
```

#### コマンド登録
```typescript
// 一般的なコマンド登録
logseq.App.registerCommand('plugin-id', {
  key: 'my-command',
  label: 'My Command',
  desc: 'My custom command',
  palette: true,  // コマンドパレットに表示
  keybinding: {
    binding: 'mod+shift+c',
    mode: 'global'  // 'global' | 'non-editing' | 'editing'
  }
}, (e) => {
  console.log('Command executed!', e)
})

// コマンドパレット専用のコマンド
logseq.App.registerCommandPalette({
  key: 'palette-only-command',
  label: '🎨 Palette Only Command',
  keybinding: {
    binding: 'mod+alt+p'
  }
}, () => {
  logseq.UI.showMsg('Palette command executed!', 'success')
})

// ショートカット登録（複数のキーバインディング対応）
logseq.App.registerCommandShortcut({
  binding: ['mod+shift+t', 'ctrl+alt+t'],  // 配列で複数指定可能
  mac: 'cmd+shift+t'  // Mac専用キーバインディング
}, () => {
  console.log('Shortcut triggered!')
}, {
  key: 'custom-shortcut',
  label: 'Custom Shortcut',
  desc: 'A custom keyboard shortcut'
})

// 外部コマンドの実行
await logseq.App.invokeExternalCommand('logseq.editor/cycle-todo')
await logseq.App.invokeExternalCommand('logseq.go/journals')
await logseq.App.invokeExternalCommand('logseq.ui/toggle-theme')

// 他のプラグインのコマンド実行
await logseq.App.invokeExternalPlugin('plugin-id.commands.command-key', arg1, arg2)
await logseq.App.invokeExternalPlugin('plugin-id.models.model-method', data)

// プラグイン情報の取得
const externalPlugin = await logseq.App.getExternalPlugin('some-plugin-id')
if (externalPlugin) {
  console.log('External plugin found:', externalPlugin)
}
```

#### UI管理とナビゲーション
```typescript
// サイドバーの制御
logseq.App.setLeftSidebarVisible(true)   // または false, 'toggle'
logseq.App.setRightSidebarVisible('toggle')

// 右サイドバーのクリア
logseq.App.clearRightSidebarBlocks({ close: true })

// 全画面制御
logseq.App.setFullScreen(true)  // または false, 'toggle'

// ズーム制御
logseq.App.setZoomFactor(1.5)  // 150%にズーム

// ページナビゲーション
logseq.App.pushState('page', { name: 'My Page' }, { query: 'search term' })
logseq.App.replaceState('journals', {}, { date: '2024-01-01' })

// 外部リンクを開く
await logseq.App.openExternalLink('https://example.com')

// アプリの再起動・終了
await logseq.App.relaunch()
await logseq.App.quit()
```

#### テンプレート管理
```typescript
// テンプレートの存在確認
const templateExists = await logseq.App.existTemplate('daily-note')

// テンプレート取得
const template = await logseq.App.getTemplate('daily-note')
if (template) {
  console.log('Template content:', template.content)
}

// テンプレート作成
await logseq.App.createTemplate(blockUuid, 'my-template', {
  overwrite: true  // 既存のテンプレートを上書き
})

// テンプレート挿入
await logseq.App.insertTemplate(targetBlockUuid, 'daily-note')

// テンプレート削除
await logseq.App.removeTemplate('unused-template')

// 全テンプレート取得
const allTemplates = await logseq.App.getCurrentGraphTemplates()
console.log('Available templates:', Object.keys(allTemplates || {}))
```

#### カスタムUI要素の登録
```typescript
// ツールバーアイテムの追加
logseq.App.registerUIItem('toolbar', {
  key: 'my-toolbar-button',
  template: `
    <a class="button" data-on-click="handleToolbarClick">
      <i class="ti ti-calendar"></i>
      <span>Calendar</span>
    </a>
  `
})

// ページバーアイテムの追加
logseq.App.registerUIItem('pagebar', {
  key: 'page-info',
  template: `
    <div class="page-info">
      <span data-on-click="showPageInfo">ℹ️ Info</span>
    </div>
  `
})

// ページメニューアイテムの追加
logseq.App.registerPageMenuItem('🔗 Copy Page Link', (e) => {
  const pageName = e.page
  const pageUrl = `logseq://graph/${logseq.baseInfo.id}?page=${encodeURIComponent(pageName)}`
  navigator.clipboard.writeText(pageUrl)
  logseq.UI.showMsg(`Page link copied: ${pageName}`, 'success')
})
```

#### イベントフック
```typescript
// グラフ変更を監視
const unsubscribeGraphChanged = logseq.App.onCurrentGraphChanged(({ graph }) => {
  console.log('Graph changed:', graph)
  // グラフ固有の初期化処理
  initializeForGraph(graph)
})

// グラフインデックス完了の監視
logseq.App.onGraphAfterIndexed(({ repo }) => {
  console.log('Graph indexing completed:', repo)
  // インデックス完了後の処理
  performPostIndexTasks()
})

// テーマ変更を監視
logseq.App.onThemeModeChanged(({ mode }) => {
  console.log('Theme mode changed to:', mode) // 'light' | 'dark'
  updatePluginTheme(mode)
})

logseq.App.onThemeChanged(({ name, mode, pid, url }) => {
  console.log('Theme changed:', { name, mode, pid, url })
})

// 今日のジャーナル作成を監視
logseq.App.onTodayJournalCreated(({ title }) => {
  console.log('Today journal created:', title)
  // 日次ジャーナル作成時の自動処理
  addDailyTemplate(title)
})

// ルート変更を監視
logseq.App.onRouteChanged(({ path, template }) => {
  console.log('Route changed:', { path, template })
  // ページ変更に応じたUI更新
  updateUIForRoute(path)
})

// サイドバー表示状態の監視
logseq.App.onSidebarVisibleChanged(({ visible }) => {
  console.log('Sidebar visibility:', visible)
  adjustPluginLayout(visible)
})

// コマンド実行前後のフック
const unsubscribeBefore = logseq.App.onBeforeCommandInvoked('logseq.editor.cycle-todo', (e) => {
  console.log('About to cycle todo:', e)
})

const unsubscribeAfter = logseq.App.onAfterCommandInvoked('logseq.editor.cycle-todo', (e) => {
  console.log('Todo cycled:', e)
})

// 特定ブロックのレンダラースロット
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

// マクロレンダラースロットの詳細例
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
      // チャート描画ロジックを実行
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

// ページヘッドアクションスロット
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

// クリーンアップ関数の例
function cleanupEventListeners() {
  unsubscribeGraphChanged()
  unsubscribeBefore()
  unsubscribeAfter()
}

// プラグイン終了時のクリーンアップ
logseq.beforeunload(async () => {
  cleanupEventListeners()
})
```

### 2. Editor API (`logseq.Editor`)

エディタとブロック操作に関する機能を提供します。

#### ブロック操作
```typescript
// ブロック取得（基本）
const currentBlock = await logseq.Editor.getCurrentBlock()
const block = await logseq.Editor.getBlock(blockUuid)

// 子ブロック込みで取得
const blockWithChildren = await logseq.Editor.getBlock(blockUuid, {
  includeChildren: true
})

// エンティティIDでの取得
const blockByEntityId = await logseq.Editor.getBlock(12345)

// ブロック作成（詳細オプション）
const newBlock = await logseq.Editor.insertBlock(parentBlock, 'New content', {
  before: false,        // 親ブロックの前に挿入するか
  sibling: true,        // 兄弟ブロックとして挿入するか
  start: false,         // ページの最初に挿入するか
  end: true,            // ページの最後に挿入するか
  isPageBlock: false,   // ページブロックとして作成するか
  focus: true,          // 作成後にフォーカスするか
  customUUID: 'custom-uuid-here',  // カスタムUUID指定
  properties: {         // ブロックプロパティ
    tags: ['important', 'todo'],
    priority: 'high',
    deadline: '2024-12-31'
  }
})

// バッチブロック作成（階層構造対応）
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
  keepUUID: true  // プロパティのidフィールドをUUIDとして使用
})

// ブロック更新
await logseq.Editor.updateBlock(blockUuid, 'Updated content', {
  properties: {
    lastModified: new Date().toISOString(),
    modifiedBy: 'plugin'
  }
})

// ブロック削除
await logseq.Editor.removeBlock(blockUuid)

// ブロック移動
await logseq.Editor.moveBlock(sourceBlockUuid, targetBlockUuid, {
  before: true,     // 対象ブロックの前に移動
  children: false   // 子要素として移動
})

// ブロックの折りたたみ制御
await logseq.Editor.setBlockCollapsed(blockUuid, true)      // 折りたたむ
await logseq.Editor.setBlockCollapsed(blockUuid, false)     // 展開
await logseq.Editor.setBlockCollapsed(blockUuid, 'toggle')  // トグル

// より詳細な折りたたみ制御
await logseq.Editor.setBlockCollapsed(blockUuid, {
  flag: 'toggle'
})

// 兄弟ブロックの取得
const prevSibling = await logseq.Editor.getPreviousSiblingBlock(blockUuid)
const nextSibling = await logseq.Editor.getNextSiblingBlock(blockUuid)

// ブロック選択とフォーカス
await logseq.Editor.selectBlock(blockUuid)
await logseq.Editor.editBlock(blockUuid, { pos: 0 })  // カーソル位置指定

// ユニークUUID生成
const newUUID = await logseq.Editor.newBlockUUID()
console.log('Generated UUID:', newUUID)

// ブロックタイプの判定
const isPage = logseq.Editor.isPageBlock(block)
```

#### 高度なブロック操作
```typescript
// ページ内でのブロック追加
const prependedBlock = await logseq.Editor.prependBlockInPage(pageIdentity, 'First block', {
  properties: { position: 'top' }
})

const appendedBlock = await logseq.Editor.appendBlockInPage(pageIdentity, 'Last block', {
  properties: { position: 'bottom' }
})

// 特定位置へのスクロール
logseq.Editor.scrollToBlockInPage('Page Name', blockUuid, {
  replaceState: true  // ブラウザ履歴を置き換える
})

// 右サイドバーで開く
logseq.Editor.openInRightSidebar(blockUuid)
```

#### ページ操作
```typescript
// ページ取得
const currentPage = await logseq.Editor.getCurrentPage()
const page = await logseq.Editor.getPage(pageName)

// 子ページも含めて取得
const pageWithChildren = await logseq.Editor.getPage(pageName, {
  includeChildren: true
})

// 全ページ取得
const allPages = await logseq.Editor.getAllPages()

// 特定のリポジトリの全ページ取得
const repoPages = await logseq.Editor.getAllPages('specific-repo-name')

// タグページの取得
const allTags = await logseq.Editor.getAllTags()

// プロパティページの取得
const allProperties = await logseq.Editor.getAllProperties()

// ページ作成（詳細オプション）
const newPage = await logseq.Editor.createPage('New Page', {
  // ページプロパティ
  alias: ['Alternative Name', 'Another Alias'],
  tags: ['category1', 'category2'],
  author: 'Plugin User',
  created: new Date().toISOString(),
  'custom-property': 'custom value'
}, {
  redirect: true,           // 作成後にページに遷移
  createFirstBlock: true,   // 最初のブロックを自動作成
  format: 'markdown',       // 'markdown' | 'org'
  journal: false            // ジャーナルページとして作成するか
})

// ジャーナルページ作成
const journalPage = await logseq.Editor.createJournalPage(new Date())
const specificDateJournal = await logseq.Editor.createJournalPage('2024-12-25')

// ページ削除・リネーム
await logseq.Editor.deletePage('Page Name')
await logseq.Editor.renamePage('Old Name', 'New Name')

// ページの階層構造取得
const namespace = 'Projects'
const pagesFromNamespace = await logseq.Editor.getPagesFromNamespace(namespace)
const pagesTree = await logseq.Editor.getPagesTreeFromNamespace(namespace)

console.log('Flat pages:', pagesFromNamespace)
console.log('Tree structure:', pagesTree)

// ページのブロックツリー取得
const currentPageBlocks = await logseq.Editor.getCurrentPageBlocksTree()
const pageBlocks = await logseq.Editor.getPageBlocksTree('Specific Page')

// ページの被リンク取得
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

#### ページプロパティ管理
```typescript
// ページプロパティ取得
const pageProperties = await logseq.Editor.getPageProperties('Page Name')
console.log('Page properties:', pageProperties)

// 特定ページのタグオブジェクト取得
const tagObjects = await logseq.Editor.getTagObjects('Page Name')
console.log('Tag objects:', tagObjects)
```

#### エディタ状態
```typescript
// 編集中かチェック
const editingState = await logseq.Editor.checkEditing()
if (typeof editingState === 'string') {
  console.log('Currently editing block:', editingState) // Block UUID
} else if (editingState === true) {
  console.log('Editor is active but no specific block')
} else {
  console.log('Not in editing mode')
}

// 編集中のブロック内容取得
const editingContent = await logseq.Editor.getEditingBlockContent()
console.log('Current editing content:', editingContent)

// 編集カーソル位置取得
const cursorPosition = await logseq.Editor.getEditingCursorPosition()
if (cursorPosition) {
  console.log('Cursor position:', {
    left: cursorPosition.left,
    top: cursorPosition.top,
    height: cursorPosition.height,
    pos: cursorPosition.pos,    // テキスト内の位置
    rect: cursorPosition.rect   // DOMRect
  })
}

// 編集カーソル操作
await logseq.Editor.insertAtEditingCursor('Inserted text')
await logseq.Editor.restoreEditingCursor()

// 編集モード終了
await logseq.Editor.exitEditingMode()           // ブロック選択なし
await logseq.Editor.exitEditingMode(true)       // ブロックを選択状態で終了

// 選択されたブロック管理
const selectedBlocks = await logseq.Editor.getSelectedBlocks()
if (selectedBlocks) {
  console.log(`${selectedBlocks.length} blocks selected`)
  selectedBlocks.forEach((block, index) => {
    console.log(`Block ${index + 1}:`, block.content)
  })
}

await logseq.Editor.clearSelectedBlocks()

// コードエディタの内容保存
await logseq.Editor.saveFocusedCodeEditorContent()
```

#### 高度なエディタ機能
```typescript
// 入力選択終了イベント（テキスト選択時）
logseq.Editor.onInputSelectionEnd(({ caret, point, start, end, text }) => {
  console.log('Text selected:', {
    selectedText: text,
    startPos: start,
    endPos: end,
    caretInfo: caret,
    mousePosition: point
  })
  
  // 選択されたテキストに基づいてアクションを実行
  if (text.includes('TODO')) {
    // TODO項目が選択された場合の処理
    showTodoActions(text)
  }
})

// テキスト選択イベントの活用例
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

#### スラッシュコマンド登録
```typescript
// シンプルなスラッシュコマンド
logseq.Editor.registerSlashCommand('Say Hi', async ({ uuid }) => {
  await logseq.Editor.insertBlock(uuid, 'Hello from plugin!', { sibling: false })
  logseq.UI.showMsg('Greeting inserted!', 'success')
})

// リッチなスラッシュコマンド
logseq.Editor.registerSlashCommand('📊 Create Chart', async ({ uuid }) => {
  const chartId = `chart-${Date.now()}`
  await logseq.Editor.insertBlock(uuid, `{{renderer :chart, bar, ${chartId}}}`, {
    sibling: false,
    focus: true
  })
})

// 複数アクションのスラッシュコマンド
logseq.Editor.registerSlashCommand('💥 Big Bang', [
  ['editor/hook', 'customCallback'],      // カスタムコールバック実行
  ['editor/clear-current-slash'],         // スラッシュ入力をクリア
  ['editor/input', 'Explosion! 💥']       // テキスト挿入
])

// 条件付きスラッシュコマンド
logseq.Editor.registerSlashCommand('🏷️ Smart Tag', async ({ uuid }) => {
  const block = await logseq.Editor.getBlock(uuid)
  if (!block) return
  
  const content = block.content || ''
  
  // 内容に基づいて適切なタグを提案
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

// テンプレート挿入スラッシュコマンド
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

// 外部API連携スラッシュコマンド
logseq.Editor.registerSlashCommand('🌤️ Weather', async ({ uuid }) => {
  try {
    logseq.UI.showMsg('Fetching weather data...', 'info')
    
    // 仮想的な天気API呼び出し
    const weatherData = await fetchWeatherData()
    const weatherBlock = `🌤️ **Weather Update**
Temperature: ${weatherData.temperature}°C
Condition: ${weatherData.condition}
Humidity: ${weatherData.humidity}%
Updated: ${new Date().toLocaleString()}`

    await logseq.Editor.updateBlock(uuid, weatherBlock)
    logseq.UI.showMsg('Weather data inserted!', 'success')
  } catch (error) {
    logseq.UI.showMsg('Failed to fetch weather data', 'error')
    console.error('Weather fetch error:', error)
  }
})

// 計算機能付きスラッシュコマンド
logseq.Editor.registerSlashCommand('🧮 Calculator', async ({ uuid }) => {
  const expression = prompt('Enter calculation (e.g., 2 + 3 * 4):')
  if (!expression) return
  
  try {
    // 安全な計算評価（実際のプロダクションでは適切なパーサーを使用）
    const result = evaluateExpression(expression)
    await logseq.Editor.updateBlock(uuid, `${expression} = **${result}**`)
  } catch (error) {
    logseq.UI.showMsg('Invalid expression', 'error')
  }
})

function evaluateExpression(expr: string): number {
  // 基本的な数式評価（セキュリティ考慮済み）
  const sanitized = expr.replace(/[^0-9+\-*/.() ]/g, '')
  return Function(`"use strict"; return (${sanitized})`)()
}

async function fetchWeatherData() {
  // 模擬天気データ
  return {
    temperature: Math.floor(Math.random() * 30) + 5,
    condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 50) + 30
  }
}
```

#### ブロックコンテキストメニュー
```typescript
// 基本的なコンテキストメニュー
logseq.Editor.registerBlockContextMenuItem('🔗 Copy Block Link', async ({ uuid }) => {
  const blockUrl = `logseq://graph/${logseq.baseInfo.id}?block-id=${uuid}`
  await navigator.clipboard.writeText(blockUrl)
  logseq.UI.showMsg('Block link copied!', 'success')
})

// 高度なコンテキストメニュー
logseq.Editor.registerBlockContextMenuItem('🎨 Format Block', async ({ uuid }) => {
  const block = await logseq.Editor.getBlock(uuid)
  if (!block) return
  
  const content = block.content || ''
  
  // 簡単なフォーマット処理
  const formatted = content
    .replace(/\b(TODO|DOING|DONE)\b/g, '**$1**')  // ステータスを太字
    .replace(/#(\w+)/g, '_#$1_')                   // タグを斜体
    .replace(/\[([^\]]+)\]/g, '`$1`')              // ブラケットをコード
  
  await logseq.Editor.updateBlock(uuid, formatted)
  logseq.UI.showMsg('Block formatted!', 'success')
})

// 条件付きコンテキストメニュー
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
  
  const analysisBlock = `**Text Analysis**
Characters: ${stats.characters}
Words: ${stats.words}
Sentences: ${stats.sentences}
Paragraphs: ${stats.paragraphs}`

  await logseq.Editor.insertBlock(uuid, analysisBlock, { sibling: true })
})
```

#### ハイライトコンテキストメニュー（PDF用）
```typescript
// PDFハイライト用のコンテキストメニュー
logseq.Editor.registerHighlightContextMenuItem('📝 Create Note', ({ text, position }) => {
  console.log('Highlighted text:', text)
  console.log('Position:', position)
  
  // ハイライトされたテキストからノートを作成
  const noteContent = `**Note from PDF**
Highlighted: "${text}"
Created: ${new Date().toLocaleString()}`

  // 現在のページにノートブロックを追加
  logseq.Editor.appendBlockInPage(
    await logseq.Editor.getCurrentPage(),
    noteContent
  )
}, {
  clearSelection: true  // ハイライト選択をクリア
})

logseq.Editor.registerHighlightContextMenuItem('🔖 Add to References', ({ text }) => {
  // 参照リストに追加
  const referenceText = `((${Date.now()})) ${text}`
  logseq.Editor.appendBlockInPage('References', referenceText)
  logseq.UI.showMsg('Added to references!', 'success')
})
```

#### プロパティ操作
```typescript
// プロパティスキーマ作成・更新
await logseq.Editor.upsertProperty('custom-property', {
  type: 'default',          // 'default' | 'number' | 'node' | 'date' | 'checkbox' | 'url'
  cardinality: 'one',       // 'one' | 'many'
  hide: false,              // プロパティを隠すかどうか
  public: true              // パブリックプロパティかどうか
}, {
  name: 'Custom Property'   // 表示名
})

// 特定のプロパティ情報取得
const propertyInfo = await logseq.Editor.getProperty('custom-property')
console.log('Property info:', propertyInfo)

// プロパティ削除
await logseq.Editor.removeProperty('unused-property')

// ブロックプロパティの管理
await logseq.Editor.upsertBlockProperty(blockUuid, 'status', 'in-progress')
await logseq.Editor.upsertBlockProperty(blockUuid, 'priority', 'high')
await logseq.Editor.upsertBlockProperty(blockUuid, 'tags', ['work', 'urgent'])
await logseq.Editor.upsertBlockProperty(blockUuid, 'deadline', '2024-12-31')

// 複合プロパティの設定
await logseq.Editor.upsertBlockProperty(blockUuid, 'metadata', {
  author: 'Plugin User',
  created: new Date().toISOString(),
  version: '1.0',
  category: 'automation'
})

// ブロックプロパティ取得
const status = await logseq.Editor.getBlockProperty(blockUuid, 'status')
const priority = await logseq.Editor.getBlockProperty(blockUuid, 'priority')
const allBlockProperties = await logseq.Editor.getBlockProperties(blockUuid)

console.log('Block status:', status)
console.log('Block priority:', priority)
console.log('All block properties:', allBlockProperties)

// ブロックプロパティ削除
await logseq.Editor.removeBlockProperty(blockUuid, 'completed-date')

// ページプロパティ取得
const pageProperties = await logseq.Editor.getPageProperties('Project Planning')
console.log('Page properties:', pageProperties)

// プロパティ活用例：タスク管理
async function updateTaskStatus(blockUuid: string, newStatus: 'todo' | 'doing' | 'done') {
  await logseq.Editor.upsertBlockProperty(blockUuid, 'status', newStatus)
  await logseq.Editor.upsertBlockProperty(blockUuid, 'updated-at', new Date().toISOString())
  
  if (newStatus === 'done') {
    await logseq.Editor.upsertBlockProperty(blockUuid, 'completed-at', new Date().toISOString())
  }
  
  // ブロック内容も更新
  const block = await logseq.Editor.getBlock(blockUuid)
  if (block) {
    const content = block.content?.replace(/^(TODO|DOING|DONE)\s*/, '') || ''
    const newContent = `${newStatus.toUpperCase()} ${content}`
    await logseq.Editor.updateBlock(blockUuid, newContent)
  }
}

// プロパティ活用例：評価システム
async function rateContent(blockUuid: string, rating: number) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }
  
  await logseq.Editor.upsertBlockProperty(blockUuid, 'rating', rating)
  await logseq.Editor.upsertBlockProperty(blockUuid, 'rated-at', new Date().toISOString())
  
  const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  await logseq.Editor.upsertBlockProperty(blockUuid, 'rating-display', stars)
}

// プロパティベースの検索・フィルタ
async function findBlocksByProperty(propertyKey: string, propertyValue: any) {
  const query = `
    [:find (pull ?b [*])
     :where 
     [?b :block/properties ?props]
     [(get ?props :${propertyKey}) ?value]
     [(= ?value "${propertyValue}")]]
  `
  
  const results = await logseq.DB.q(query)
  return results || []
}

// 使用例
const highPriorityBlocks = await findBlocksByProperty('priority', 'high')
const completedTasks = await findBlocksByProperty('status', 'done')
```

### 3. DB API (`logseq.DB`)

Datascriptデータベースへのクエリと変更監視機能を提供します。

#### クエリ実行
```typescript
// DSLクエリ（推奨）
const todoBlocks = await logseq.DB.q(`
  [:find (pull ?b [*])
   :where 
   [?b :block/content ?content]
   [(clojure.string/includes? ?content "TODO")]]
`)

// より複雑なDSLクエリ例
const recentBlocks = await logseq.DB.q(`
  [:find (pull ?b [*])
   :where 
   [?b :block/created-at ?created]
   [(> ?created ${Date.now() - 24 * 60 * 60 * 1000})]]  // 24時間以内
`)

// 特定ページのブロック取得
const pageBlocks = await logseq.DB.q(`
  [:find (pull ?b [*])
   :where
   [?p :block/name "Project Planning"]
   [?b :block/page ?p]]
`)

// プロパティベースのクエリ
const priorityBlocks = await logseq.DB.q(`
  [:find (pull ?b [*])
   :where
   [?b :block/properties ?props]
   [(get ?props :priority) ?priority]
   [(= ?priority "high")]]
`)

// タグ付きブロックの検索
const taggedBlocks = await logseq.DB.q(`
  [:find (pull ?b [*])
   :where
   [?b :block/refs ?r]
   [?r :block/name "important"]]
`)

// ジャーナルページの取得
const journalPages = await logseq.DB.q(`
  [:find (pull ?p [*])
   :where
   [?p :block/journal? true]]
`)

// Datascriptクエリ（より低レベル）
const directQuery = await logseq.DB.datascriptQuery(`
  [:find ?e ?content ?created
   :where 
   [?e :block/content ?content]
   [?e :block/created-at ?created]
   [(> ?created ${Date.now() - 7 * 24 * 60 * 60 * 1000})]]  // 1週間以内
`)

// パラメータ付きクエリ
const searchTerm = "meeting"
const searchResults = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :in $ ?search-term
   :where
   [?b :block/content ?content]
   [(clojure.string/includes? ?content ?search-term)]]
`, searchTerm)

// 複雑な関係クエリ
const blockReferences = await logseq.DB.q(`
  [:find (pull ?referring-block [*]) (pull ?referenced-block [*])
   :where
   [?referring-block :block/refs ?referenced-block]
   [?referenced-block :block/name "target-page"]]
`)

// 統計クエリ
const blockStats = await logseq.DB.q(`
  [:find (count ?b)
   :where
   [?b :block/content]
   [?b :block/page ?p]
   [?p :block/journal? true]]
`)

// ネストしたブロック構造のクエリ
const hierarchicalBlocks = await logseq.DB.q(`
  [:find (pull ?parent [*]) (pull ?child [*])
   :where
   [?child :block/parent ?parent]
   [?parent :block/content ?parent-content]
   [(clojure.string/includes? ?parent-content "Project")]]
`)

// プロパティの集計
const taskCounts = await logseq.DB.q(`
  [:find ?status (count ?b)
   :where
   [?b :block/properties ?props]
   [(get ?props :status) ?status]]
`)

console.log('Task counts by status:', taskCounts)

// 高度なフィルタリング
const filterResults = await logseq.DB.q(`
  [:find (pull ?b [*])
   :where
   [?b :block/content ?content]
   [?b :block/created-at ?created]
   [?b :block/properties ?props]
   [(get ?props :priority) ?priority]
   [(= ?priority "high")]
   [(> ?created ${Date.now() - 30 * 24 * 60 * 60 * 1000})]  // 30日以内
   [(clojure.string/includes? ?content "urgent")]]
`)

// ページ関連の詳細クエリ
const pageAnalysis = await logseq.DB.q(`
  [:find ?page-name (count ?blocks) (sum ?word-count)
   :where
   [?p :block/name ?page-name]
   [?b :block/page ?p]
   [?b :block/content ?content]
   [(count (clojure.string/split ?content #"\\s+")) ?word-count]]
`)

console.log('Page analysis:', pageAnalysis)
```

#### 高度なクエリパターン
```typescript
// 再帰的なブロック構造取得
async function getBlockHierarchy(rootBlockUuid: string) {
  const query = `
    [:find (pull ?b [* {:block/children ...}])
     :where
     [?b :block/uuid ?uuid]
     [(= ?uuid #uuid "${rootBlockUuid}")]]
  `
  return await logseq.DB.q(query)
}

// 時系列データの分析
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

// クロスリファレンス分析
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

// メタデータ分析
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

#### データ変更監視
```typescript
// 全体的な変更監視
const unsubscribeDbChanged = logseq.DB.onChanged(({ blocks, txData, txMeta }) => {
  console.log(`DB changed: ${blocks.length} blocks affected`)
  console.log('Transaction metadata:', txMeta)
  
  // 変更されたブロックの分析
  blocks.forEach(block => {
    console.log(`Block ${block.uuid}: ${block.content}`)
    
    // 特定の変更に対する処理
    if (block.content?.includes('TODO')) {
      handleTodoChange(block)
    }
    
    if (block.properties?.priority === 'urgent') {
      handleUrgentTask(block)
    }
  })
  
  // トランザクションデータの分析
  txData.forEach(([e, a, v, t, added]) => {
    console.log(`Entity: ${e}, Attribute: ${a}, Value: ${v}, Added: ${added}`)
    
    // 特定の属性変更を監視
    if (a === ':block/content' && added) {
      console.log('New content added:', v)
    }
    
    if (a === ':block/properties' && added) {
      console.log('Properties updated:', v)
    }
  })
  
  // アウトライナー操作の検出
  if (txMeta?.outlinerOp) {
    console.log('Outliner operation:', txMeta.outlinerOp)
    switch (txMeta.outlinerOp) {
      case 'save-block':
        handleBlockSave(blocks[0])
        break
      case 'insert-blocks':
        handleBlocksInsert(blocks)
        break
      case 'delete-blocks':
        handleBlocksDelete(blocks)
        break
      case 'move-blocks':
        handleBlocksMove(blocks)
        break
    }
  }
})

// 特定ブロックの変更監視
const unsubscribeBlockChanged = logseq.DB.onBlockChanged(
  'specific-block-uuid', 
  (block, txData, txMeta) => {
    console.log('Specific block changed:', block.content)
    
    // ブロック内容の差分検出
    const previousContent = getPreviousContent(block.uuid)
    if (previousContent !== block.content) {
      logContentChange(block.uuid, previousContent, block.content)
    }
    
    // プロパティ変更の検出
    if (block.properties) {
      Object.entries(block.properties).forEach(([key, value]) => {
        console.log(`Property ${key} changed to:`, value)
      })
    }
  }
)

// 高度な変更監視パターン
class BlockChangeTracker {
  private changeHistory: Map<string, any[]> = new Map()
  private unsubscribe: Function | null = null
  
  start() {
    this.unsubscribe = logseq.DB.onChanged(({ blocks, txData, txMeta }) => {
      this.trackChanges(blocks, txData, txMeta)
    })
  }
  
  stop() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
  }
  
  private trackChanges(blocks: any[], txData: any[], txMeta?: any) {
    blocks.forEach(block => {
      const history = this.changeHistory.get(block.uuid) || []
      history.push({
        timestamp: Date.now(),
        content: block.content,
        properties: { ...block.properties },
        operation: txMeta?.outlinerOp,
        txData: txData.filter(([e]) => e === block.id)
      })
      
      // 履歴の長さ制限
      if (history.length > 50) {
        history.shift()
      }
      
      this.changeHistory.set(block.uuid, history)
    })
  }
  
  getBlockHistory(blockUuid: string) {
    return this.changeHistory.get(blockUuid) || []
  }
  
  getRecentChanges(minutes: number = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    const recent: any[] = []
    
    this.changeHistory.forEach((history, blockUuid) => {
      const recentChanges = history.filter(change => change.timestamp > cutoff)
      if (recentChanges.length > 0) {
        recent.push({ blockUuid, changes: recentChanges })
      }
    })
    
    return recent
  }
}

// 使用例
const tracker = new BlockChangeTracker()
tracker.start()

// 特定の変更パターンの検出
function handleTodoChange(block: any) {
  const content = block.content || ''
  
  if (content.includes('TODO') && !content.includes('DONE')) {
    // 新しいTODO項目
    logseq.UI.showMsg(`New TODO: ${content.substring(0, 50)}...`, 'info')
  } else if (content.includes('DONE')) {
    // 完了したタスク
    logseq.UI.showMsg(`Task completed!`, 'success')
    updateTaskMetrics()
  }
}

function handleUrgentTask(block: any) {
  // 緊急タスクの処理
  const notification = `🚨 Urgent task: ${block.content?.substring(0, 100)}...`
  logseq.UI.showMsg(notification, 'warning', { timeout: 10000 })
  
  // 緊急タスクリストに追加
  addToUrgentList(block)
}

function handleBlockSave(block: any) {
  // ブロック保存時の処理
  console.log('Block saved:', block.uuid)
  
  // 自動バックアップ
  if (block.properties?.important === true) {
    backupImportantBlock(block)
  }
}

function handleBlocksInsert(blocks: any[]) {
  console.log(`${blocks.length} new blocks inserted`)
  
  // 新規ブロックの分析
  blocks.forEach(block => {
    if (block.content?.length > 500) {
      logseq.UI.showMsg('Long content detected', 'info')
    }
  })
}

function handleBlocksDelete(blocks: any[]) {
  console.log(`${blocks.length} blocks deleted`)
  
  // 削除ログの記録
  blocks.forEach(block => {
    console.log(`Deleted block: ${block.content?.substring(0, 100)}...`)
  })
}

function handleBlocksMove(blocks: any[]) {
  console.log(`${blocks.length} blocks moved`)
  
  // 移動ログの記録
  blocks.forEach(block => {
    console.log(`Moved block: ${block.uuid}`)
  })
}

// ヘルパー関数の実装例
function getPreviousContent(blockUuid: string): string | null {
  // 前回の内容を取得（実装依存）
  return localStorage.getItem(`prev_content_${blockUuid}`)
}

function logContentChange(blockUuid: string, oldContent: string | null, newContent: string | undefined) {
  console.log(`Content changed for ${blockUuid}:`)
  console.log(`  Before: ${oldContent}`)
  console.log(`  After: ${newContent}`)
  
  // 前回の内容を保存
  if (newContent) {
    localStorage.setItem(`prev_content_${blockUuid}`, newContent)
  }
}

function updateTaskMetrics() {
  // タスクメトリクスの更新
  console.log('Updating task completion metrics...')
}

function addToUrgentList(block: any) {
  // 緊急リストへの追加
  console.log('Adding to urgent list:', block.uuid)
}

function backupImportantBlock(block: any) {
  // 重要ブロックのバックアップ
  console.log('Backing up important block:', block.uuid)
}

// クリーンアップ
logseq.beforeunload(async () => {
  unsubscribeDbChanged()
  unsubscribeBlockChanged()
  tracker.stop()
})
```

### 4. UI API (`logseq.UI`)

UI操作とメッセージ表示機能を提供します。

```typescript
// メッセージ表示（基本）
const msgKey = await logseq.UI.showMsg('Operation completed!', 'success')
await logseq.UI.showMsg('Warning message', 'warning')
await logseq.UI.showMsg('Error occurred', 'error')
await logseq.UI.showMsg('Information', 'info')

// 詳細オプション付きメッセージ
const msgKey2 = await logseq.UI.showMsg('Custom message', 'success', {
  key: 'custom-msg-key',  // 固有のキー
  timeout: 5000           // 5秒後に自動消去
})

// メッセージを手動で閉じる
logseq.UI.closeMsg(msgKey)

// 永続的なメッセージ（タイムアウトなし）
const persistentMsg = await logseq.UI.showMsg('Persistent notification', 'info', {
  timeout: 0  // タイムアウトなし
})

// DOM要素の位置・サイズ取得
const rect = await logseq.UI.queryElementRect('.logseq-header')
if (rect) {
  console.log('Header dimensions:', {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right
  })
}

// 複数要素の位置取得
const blockRects = await logseq.UI.queryElementRect('.ls-block')
console.log('Block rectangles:', blockRects)

// 要素の存在チェック
const headerExists = await logseq.UI.queryElementById('logseq-header')
const customElementExists = await logseq.UI.queryElementById('my-plugin-element')

console.log('Header exists:', headerExists)
console.log('Custom element exists:', customElementExists)

// スロットの有効性チェック
const isMainSlotValid = await logseq.UI.checkSlotValid('main')
const isToolbarSlotValid = await logseq.UI.checkSlotValid('toolbar')

if (isMainSlotValid) {
  // メインスロットにUIを提供
  logseq.provideUI({
    key: 'main-content',
    slot: 'main',
    template: '<div>Main content</div>'
  })
}

// テーマCSS変数の取得
const themeValues = await logseq.UI.resolveThemeCssPropsVals([
  '--ls-primary-background-color',
  '--ls-secondary-background-color',
  '--ls-primary-text-color',
  '--ls-link-text-color',
  '--ls-border-color'
])

if (themeValues) {
  console.log('Theme colors:', themeValues)
  
  // 取得した値を使ってスタイル適用
  logseq.provideStyle(`
    .my-plugin-element {
      background-color: ${themeValues['--ls-primary-background-color']};
      color: ${themeValues['--ls-primary-text-color']};
      border: 1px solid ${themeValues['--ls-border-color']};
    }
  `)
}

// 複数のCSS変数を一度に取得
const allThemeVars = await logseq.UI.resolveThemeCssPropsVals([
  '--ls-primary-background-color',
  '--ls-secondary-background-color',
  '--ls-tertiary-background-color',
  '--ls-quaternary-background-color',
  '--ls-primary-text-color',
  '--ls-secondary-text-color',
  '--ls-title-text-color',
  '--ls-link-text-color',
  '--ls-link-ref-text-color',
  '--ls-tag-text-color',
  '--ls-tag-text-opacity',
  '--ls-border-color',
  '--ls-secondary-border-color',
  '--ls-table-tr-even-background-color',
  '--ls-head-text-color',
  '--ls-codeblock-background-color',
  '--ls-active-primary-color',
  '--ls-active-secondary-color',
  '--ls-block-bullet-border-color',
  '--ls-block-bullet-color',
  '--ls-block-highlight-color',
  '--ls-selection-background-color',
  '--ls-menu-hover-color'
])

console.log('Complete theme variables:', allThemeVars)
```

#### 高度なUI制御
```typescript
// プログレスバー付きメッセージ
async function showProgressMessage(task: string, total: number) {
  let current = 0
  const msgKey = await logseq.UI.showMsg(`${task}: 0/${total}`, 'info', {
    timeout: 0
  })
  
  return {
    update: async (progress: number) => {
      current = progress
      const percentage = Math.round((current / total) * 100)
      logseq.UI.closeMsg(msgKey)
      return await logseq.UI.showMsg(
        `${task}: ${current}/${total} (${percentage}%)`, 
        'info', 
        { timeout: 0 }
      )
    },
    complete: () => {
      logseq.UI.closeMsg(msgKey)
      logseq.UI.showMsg(`${task} completed!`, 'success')
    }
  }
}

// 使用例
const progress = await showProgressMessage('Processing blocks', 100)
for (let i = 1; i <= 100; i++) {
  // 処理...
  await progress.update(i)
  await new Promise(resolve => setTimeout(resolve, 50))
}
progress.complete()

// 動的メッセージ更新
class DynamicMessage {
  private currentKey: string | null = null
  
  async show(content: string, status: string = 'info') {
    if (this.currentKey) {
      logseq.UI.closeMsg(this.currentKey)
    }
    this.currentKey = await logseq.UI.showMsg(content, status, { timeout: 0 })
    return this.currentKey
  }
  
  async update(content: string, status: string = 'info') {
    return this.show(content, status)
  }
  
  close() {
    if (this.currentKey) {
      logseq.UI.closeMsg(this.currentKey)
      this.currentKey = null
    }
  }
}

// 使用例
const dynamicMsg = new DynamicMessage()
await dynamicMsg.show('Starting process...', 'info')
await dynamicMsg.update('Processing data...', 'info')
await dynamicMsg.update('Finalizing...', 'info')
await dynamicMsg.update('Complete!', 'success')
setTimeout(() => dynamicMsg.close(), 2000)

// UI要素の監視
async function monitorUIChanges() {
  setInterval(async () => {
    const sidebarOpen = await logseq.UI.queryElementById('left-sidebar')
    const rightSidebarOpen = await logseq.UI.queryElementById('right-sidebar')
    const currentPage = await logseq.UI.queryElementRect('.page-title')
    
    console.log('UI State:', {
      leftSidebar: !!sidebarOpen,
      rightSidebar: !!rightSidebarOpen,
      pageVisible: !!currentPage
    })
  }, 1000)
}

// レスポンシブUI調整
async function adjustUIForScreenSize() {
  const screenRect = await logseq.UI.queryElementRect('body')
  if (!screenRect) return
  
  const isSmallScreen = screenRect.width < 768
  const isMobileHeight = screenRect.height < 600
  
  if (isSmallScreen || isMobileHeight) {
    logseq.provideStyle(`
      .my-plugin-mobile {
        font-size: 14px !important;
        padding: 8px !important;
        margin: 4px !important;
      }
    `)
  } else {
    logseq.provideStyle(`
      .my-plugin-desktop {
        font-size: 16px !important;
        padding: 12px !important;
        margin: 8px !important;
      }
    `)
  }
}
```

### 5. Assets API (`logseq.Assets`)

アセット管理機能を提供します。

```typescript
// ファイル一覧取得
const files = await logseq.Assets.listFilesOfCurrentGraph(['jpg', 'png'])

// サンドボックスストレージ作成
const storage = logseq.Assets.makeSandboxStorage()

// アセットURL作成
const assetUrl = await logseq.Assets.makeUrl('path/to/file.png')

// ビルトインオープン
const opened = await logseq.Assets.builtInOpen('path/to/file.pdf')
```

### 6. Git API (`logseq.Git`)

Git操作機能を提供します。

```typescript
// Gitコマンド実行
const result = await logseq.Git.execCommand(['status'])
console.log(result.stdout, result.stderr, result.exitCode)

// .gitignoreファイル操作
const ignoreContent = await logseq.Git.loadIgnoreFile()
await logseq.Git.saveIgnoreFile(ignoreContent + '\n*.tmp')
```

### 7. Request API (`logseq.Request`)

HTTP リクエスト機能を提供します。

```typescript
// 簡単なGETリクエスト
const response = await logseq.Request._request({
  url: 'https://api.example.com/data',
  method: 'GET',
  returnType: 'json'
})

// Abortable リクエスト
const task = await logseq.Request._request({
  url: 'https://api.example.com/data',
  abortable: true
})

// 必要に応じてキャンセル
task.abort()
```

### 8. FileStorage API (`logseq.FileStorage`)

ファイルベースのストレージ機能を提供します。

```typescript
// データ保存
await logseq.FileStorage.setItem('config.json', JSON.stringify(config))

// データ取得
const data = await logseq.FileStorage.getItem('config.json')
const config = JSON.parse(data)

// 全キー取得
const allKeys = await logseq.FileStorage.allKeys()

// ファイル存在チェック
const exists = await logseq.FileStorage.hasItem('config.json')

// ファイル削除
await logseq.FileStorage.removeItem('config.json')

// 全削除
await logseq.FileStorage.clear()
```

### 9. Experiments API (`logseq.Experiments`)

実験的機能を提供します（使用に注意が必要）。

```typescript
// React/ReactDOMアクセス
const React = logseq.Experiments.React
const ReactDOM = logseq.Experiments.ReactDOM

// Clojure/JS変換ユーティリティ
const cljData = logseq.Experiments.Utils.toClj(jsObject)
const jsData = logseq.Experiments.Utils.toJs(cljData)

// コードブロックレンダラー登録
logseq.Experiments.registerFencedCodeRenderer('custom-lang', {
  edit: true,
  render: ({ content }) => {
    return `<div class="custom-block">${content}</div>`
  }
})

// 拡張エンハンサー登録
logseq.Experiments.registerExtensionsEnhancer('codemirror', async (cm) => {
  // CodeMirrorをカスタマイズ
})
```

## プラグイン開発のベストプラクティス

### 1. プラグインの初期化

```typescript
import '@logseq/libs'

function main() {
  console.log('Plugin loaded')
  
  // 設定スキーマの定義
  logseq.useSettingsSchema([
    {
      key: 'apiKey',
      type: 'string',
      title: 'API Key',
      description: 'Enter your API key',
      default: ''
    },
    {
      key: 'enableFeature',
      type: 'boolean',
      title: 'Enable Feature',
      description: 'Enable the special feature',
      default: true
    }
  ])

  // モデルの提供
  logseq.provideModel({
    async openDialog() {
      logseq.showMainUI()
    },
    
    async processBlock(blockUuid) {
      const block = await logseq.Editor.getBlock(blockUuid)
      // ブロック処理ロジック
    }
  })

  // UIの提供
  logseq.provideUI({
    key: 'main-ui',
    slot: 'main',
    template: `
      <div id="plugin-main">
        <h2>My Plugin</h2>
        <button data-on-click="openDialog">Open Dialog</button>
      </div>
    `
  })

  // スタイルの提供
  logseq.provideStyle(`
    #plugin-main {
      padding: 10px;
      background: var(--ls-primary-background-color);
    }
  `)
}

// プラグインの準備完了
logseq.ready(main).catch(console.error)
```

### 2. エラーハンドリング

```typescript
async function safeBlockOperation(blockUuid) {
  try {
    const block = await logseq.Editor.getBlock(blockUuid)
    if (!block) {
      logseq.UI.showMsg('Block not found', 'error')
      return
    }
    
    // ブロック操作
    await logseq.Editor.updateBlock(blockUuid, 'Updated content')
    logseq.UI.showMsg('Block updated successfully', 'success')
    
  } catch (error) {
    console.error('Error updating block:', error)
    logseq.UI.showMsg('Failed to update block', 'error')
  }
}
```

### 3. 設定管理

```typescript
// 設定の取得と使用
function getApiKey() {
  return logseq.settings?.apiKey || ''
}

// 設定変更の監視
logseq.onSettingsChanged((newSettings, oldSettings) => {
  console.log('Settings changed:', newSettings)
  
  if (newSettings.apiKey !== oldSettings.apiKey) {
    // API キーが変更された場合の処理
    reinitializeService(newSettings.apiKey)
  }
})
```

### 4. イベント管理

```typescript
// イベントリスナーの適切な管理
const unsubscribeGraphChanged = logseq.App.onCurrentGraphChanged(({ graph }) => {
  console.log('Graph changed to:', graph)
})

const unsubscribeBlockChanged = logseq.DB.onBlockChanged(blockUuid, (block) => {
  console.log('Block content changed:', block.content)
})

// プラグイン終了時のクリーンアップ
logseq.beforeunload(async () => {
  unsubscribeGraphChanged()
  unsubscribeBlockChanged()
  console.log('Plugin cleanup completed')
})
```

## 型定義の活用

TypeScriptを使用する場合の型定義の例：

```typescript
import '@logseq/libs'
import { BlockEntity, PageEntity, IHookEvent } from '@logseq/libs/dist/LSPlugin'

interface PluginSettings {
  apiKey: string
  enableFeature: boolean
  maxResults: number
}

interface CustomBlockData {
  uuid: string
  title: string
  tags: string[]
}

async function processCustomBlocks(): Promise<CustomBlockData[]> {
  const blocks = await logseq.DB.q(`
    [:find (pull ?b [*])
     :where [?b :block/content ?content]
     [(clojure.string/includes? ?content "#custom")]]
  `) as BlockEntity[]

  return blocks.map(block => ({
    uuid: block.uuid,
    title: block.content?.split('\n')[0] || '',
    tags: extractTags(block.content || '')
  }))
}

function extractTags(content: string): string[] {
  const tagRegex = /#(\w+)/g
  const matches = content.match(tagRegex) || []
  return matches.map(tag => tag.substring(1))
}
```

## パフォーマンス考慮事項

### 1. 大量データの処理

```typescript
// 大量のブロックを効率的に処理
async function processManyBlocks(blockUuids: string[]) {
  const batchSize = 50
  
  for (let i = 0; i < blockUuids.length; i += batchSize) {
    const batch = blockUuids.slice(i, i + batchSize)
    
    const promises = batch.map(uuid => logseq.Editor.getBlock(uuid))
    const blocks = await Promise.all(promises)
    
    // バッチ処理
    for (const block of blocks) {
      if (block) {
        // ブロック処理
      }
    }
    
    // UIの応答性を保つために少し待機
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}
```

### 2. イベントリスナーの最適化

```typescript
// デバウンス機能付きのイベントリスナー
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

const debouncedHandler = debounce((block: BlockEntity) => {
  console.log('Block changed:', block.uuid)
  // 重い処理をここに書く
}, 300)

logseq.DB.onChanged(({ blocks }) => {
  blocks.forEach(debouncedHandler)
})
```

## セキュリティ考慮事項

### 1. XSS対策

```typescript
// HTMLエスケープ関数
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 安全なUI提供
logseq.provideUI({
  key: 'safe-ui',
  slot: 'main',
  template: `
    <div>
      <h3>${escapeHtml(userInput)}</h3>
    </div>
  `
})
```

### 2. API キーの安全な管理

```typescript
// 設定でAPI キーを管理
logseq.useSettingsSchema([
  {
    key: 'apiKey',
    type: 'string',
    title: 'API Key',
    description: 'Enter your API key (stored locally)',
    default: ''
  }
])

// API キーを使用した安全なリクエスト
async function makeSecureRequest(data: any) {
  const apiKey = logseq.settings?.apiKey
  
  if (!apiKey) {
    logseq.UI.showMsg('API key not configured', 'error')
    return
  }

  try {
    const response = await logseq.Request._request({
      url: 'https://api.example.com/data',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data),
      returnType: 'json'
    })
    
    return response
  } catch (error) {
    console.error('API request failed:', error)
    logseq.UI.showMsg('API request failed', 'error')
  }
}
```

## トラブルシューティング

### よくある問題と解決方法

1. **プラグインが読み込まれない**
   - `package.json`の`main`フィールドが正しく設定されているか確認
   - `logseq.ready()`が呼び出されているか確認

2. **API呼び出しが失敗する**
   - 非同期処理で`await`が適切に使用されているか確認
   - エラーハンドリングが実装されているか確認

3. **UI が表示されない**
   - `provideUI`の`slot`が有効な値か確認
   - テンプレートの HTML が有効か確認

4. **パフォーマンスの問題**
   - 大量のデータを一度に処理していないか確認
   - イベントリスナーが適切に管理されているか確認

## まとめ

`@logseq/libs@0.2.3`は、Logseqプラグイン開発のための包括的なSDKです。App、Editor、DB、UI、Assets、Git、Request、FileStorage、Experimentsの各APIカテゴリを提供し、Logseqの機能に完全にアクセスできます。

適切な型定義の使用、エラーハンドリング、パフォーマンス最適化、セキュリティ対策を実装することで、堅牢で使いやすいプラグインを開発できます。

### 参考リンク

- [公式ドキュメント](https://logseq.github.io/plugins/)
- [プラグインサンプル](https://github.com/logseq/logseq-plugin-samples)
- [コミュニティテンプレート](https://github.com/pengx17/logseq-plugin-template-react)
- [Discord コミュニティ](https://discord.gg/KpN4eHY)