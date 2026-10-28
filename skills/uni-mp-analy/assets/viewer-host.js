// uni-mp-analy 2.1.0: offline replacement for the two VS Code webview hosts.
(function () {
  'use strict';
  var resources = JSON.parse(document.getElementById('viewer-resources').textContent);
  var report = JSON.parse(document.getElementById('report-data').textContent);
  var adapted = createViewerData(report);
  var state = { analyseResult: adapted.data, navigatePath: '', filterType: 'all', filterKeyword: '', sortType: 'size', sort: 'desc', currentModuleId: '', firstSelectId: '', secordSelectId: '' };
  var frames = [document.getElementById('viewer-navigator'), document.getElementById('viewer-dashboard')];
  var status = document.getElementById('viewer-status');
  var detail = document.getElementById('viewer-file');
  var ready = new Set();
  var originalData = JSON.parse(JSON.stringify(adapted.data));
  var incompleteNote = adapted.omittedRelations ? '依赖解析不完整：视图跳过 ' + adapted.omittedRelations + ' 个缺失模块引用，完整错误保留在 analysis.json。' : '';

  function send(frame, command, data) {
    frame.contentWindow.postMessage({ command: command, data: data }, '*');
  }
  function update(patch, sender) {
    Object.assign(state, patch);
    frames.forEach(function (frame) {
      if (frame !== sender && ready.has(frame)) send(frame, 'updateState', patch);
    });
  }
  function download(data, name) {
    var url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function showFile(path) {
    var file = state.analyseResult.files.find(function (item) { return item.path === path; });
    detail.textContent = path + (file ? ' · ' + file.size + ' 字节' : ' · 当前文件表中无此文件');
    detail.hidden = false;
  }
  window.addEventListener('message', function (event) {
    var frame = frames.find(function (item) { return item.contentWindow === event.source; });
    if (!frame || !event.data) return;
    var message = event.data;
    if (message.command === 'syncState') {
      ready.add(frame);
      send(frame, 'syncState', state);
    } else if (message.command === 'updateState') {
      update(message.data, frame);
    } else if (message.command === 'analyse') {
      update({ analyseResult: JSON.parse(JSON.stringify(originalData)) });
      status.textContent = incompleteNote + '已重新绘制当前离线数据；重新分析工程请运行 Skill 脚本。';
    } else if (message.command === 'exportData') {
      download(message.data, 'code-analysis.json');
    } else if (message.command === 'openFile') {
      showFile(message.data.path);
    } else if (message.command === 'contextmenu') {
      var menu = message.data.menus.find(function (item) { return item.command === 'openFile'; });
      if (!menu) menu = message.data.menus[0];
      if (menu) showFile(String(menu.args));
      status.textContent = '离线报告显示文件路径与字节数；打开源码和删除文件需在工程中操作。';
    }
    // Original report messages are telemetry; an offline host has no receiver.
  });
  document.getElementById('download-analysis').addEventListener('click', function () { download(report, 'analysis.json'); });
  if (incompleteNote) status.textContent = incompleteNote;

  // 用法：offlineViewer.selectFile(path)；仅定位已存在的文件，不读取工程磁盘。
  window.offlineViewer = {
    selectFile: function (path) {
      var file = state.analyseResult.files.find(function (item) { return item.path === path; });
      if (!file) { showFile(path); return; }
      var packageId = file.subPackage ? file.subPackage.slice(0, -1).replace(/\//g, '-') : 'MainPackage';
      update({ navigatePath: 'topLevel/' + packageId + '/', currentModuleId: file.moduleId || '', filterType: 'all', filterKeyword: '' });
      showFile(path);
      document.getElementById('viewer-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    selectPackage: function (name) {
      var path = name === '*' ? '' : 'topLevel/' + (name === '__APP__' ? 'MainPackage' : name.replace(/\//g, '-')) + '/';
      update({ navigatePath: path, currentModuleId: '', filterType: 'all', filterKeyword: '' });
    }
  };

  // srcdoc inherits the report origin, including file://; all runtime chunks are
  // preloaded so webpack never needs a server, CDN, or the bundled demo data.
  frames.forEach(function (frame, index) {
    var payload = JSON.stringify({ resources: resources, navigator: index === 0 }).replace(/</g, '\\u003c');
    frame.srcdoc = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">' +
      '<meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; script-src &apos;unsafe-inline&apos; &apos;unsafe-eval&apos;; style-src &apos;unsafe-inline&apos;; img-src data: blob:; font-src data:; connect-src &apos;none&apos;">' +
      '</head><body><div id="container"></div><script>(' + boot.toString() + ')(' + payload + ');<\/script></body></html>';
  });
  function boot(payload) {
    window.isNavigator = payload.navigator ? 1 : 0;
    window.acquireVsCodeApi = function () {
      return { postMessage: function (message) { parent.postMessage(message, '*'); } };
    };
    payload.resources.styles.forEach(function (asset) {
      var style = document.createElement('style');
      style.dataset.href = asset.name;
      style.textContent = asset.source;
      document.head.appendChild(style);
    });
    payload.resources.scripts.forEach(function (asset) {
      var script = document.createElement('script');
      script.textContent = asset.source;
      document.body.appendChild(script);
    });
  }
}());
