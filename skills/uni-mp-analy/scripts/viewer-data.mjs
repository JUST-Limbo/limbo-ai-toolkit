// uni-mp-analy 2.1.0: adapt schema v1 without changing the saved measurements.
/**
 * 用法：createViewerData(analysis)；返回独立副本供原版视图修改。
 * 缺失模块的关系只从视图中排除并计数，原报告和解析错误原样保留。
 */
export function createViewerData(analysis) {
  const source = analysis && typeof analysis === 'object' ? analysis : {};
  const result = JSON.parse(JSON.stringify({
    files: Array.isArray(source.files) ? source.files : [],
    modules: Array.isArray(source.modules) ? source.modules : [],
    compilerPlugins: Array.isArray(source.compilerPlugins) ? source.compilerPlugins : []
  }));
  const ids = new Set(result.modules.map(module => module.id));
  let omittedRelations = 0;
  result.files.forEach(file => {
    file.path = String(file.path || '').replace(/\\/g, '/');
    const packageName = file.package || file.subPackage;
    file.subPackage = !packageName || packageName === '__APP__' ? null : String(packageName).replace(/\\/g, '/').replace(/\/+$/, '') + '/';
    if (file.moduleId && !ids.has(file.moduleId)) {
      omittedRelations += 1;
      file.moduleId = null;
    }
  });
  result.modules.forEach(module => {
    module.path = String(module.path || '').replace(/\\/g, '/');
    ['deps', 'parentDeps'].forEach(key => {
      const relations = Array.isArray(module[key]) ? module[key] : [];
      module[key] = relations.filter(relation => {
        const id = key === 'deps' ? relation.moduleId : relation.originModuleId;
        if (ids.has(id)) return true;
        omittedRelations += 1;
        return false;
      });
    });
  });
  return { data: result, omittedRelations };
}
