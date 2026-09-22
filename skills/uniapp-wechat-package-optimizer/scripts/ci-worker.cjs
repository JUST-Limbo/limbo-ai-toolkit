// uniapp-wechat-package-optimizer 1.0.0
// Separate process: the SDK may retain handles; the parent owns timeout and completion.
const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util');

process.once('message', async ({ stage, projectPath, output, appid, robot }) => {
  const errors = [];
  // checkCodeQuality 2.1.31 can catch an internal error and still return success:true.
  console.error = (...args) => { errors.push(util.format(...args).slice(0, 2000)); };
  try {
    const ci = require('miniprogram-ci');
    const options = { type: 'miniProgram', projectPath, appid };
    if (stage === 'preview') {
      options.privateKeyPath = process.env.WECHAT_PRIVATE_KEY_PATH;
      if (!options.privateKeyPath) throw new Error('预览缺少 WECHAT_PRIVATE_KEY_PATH');
    } else {
      // Non-secret constructor sentinel, not a real credential or mock analysis result.
      // analyseCode/checkCodeQuality do not authenticate. Never pass this to preview/upload.
      options.privateKey = 'LOCAL_ANALYSIS_ONLY_NOT_A_PRIVATE_KEY';
    }
    const project = new ci.Project(options);
    let result;
    if (stage === 'analysis') result = await ci.analyseCode(project, { silent: true });
    else if (stage === 'quality') result = await ci.checkCodeQuality(project);
    else if (stage === 'preview') result = await ci.preview({
      project, desc: 'uniapp-wechat-package-optimizer analysis', robot, threads: 2,
      setting: { useProjectConfig: true },
      qrcodeFormat: 'image', qrcodeOutputDest: path.join(path.dirname(output), 'preview-qrcode.jpg'),
      onProgressUpdate() {},
    });
    else throw new Error('不支持的分析阶段');
    if (result === undefined) throw new Error('SDK 未返回分析结果');
    fs.writeFileSync(output, JSON.stringify(result, null, 2));
    process.send({ ok: true, diagnosticCount: errors.length }, () => process.exit(0));
  } catch (error) {
    // Do not emit SDK request objects, headers, private keys or their paths.
    const code = error && error.code ? String(error.code).slice(0, 80) : 'SDK_ERROR';
    process.send({ ok: false, code, diagnosticCount: errors.length }, () => process.exit(1));
  }
});
