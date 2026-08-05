/** Estado compartilhado da apresentação */
export const state = {
  showDayTag: false,
  pistonConfig: null,
  executionAvailable: false,
  builtinInputsEnabled: false,
  runSources: new Map(),
  builtinTemplates: new Map(),
  slides: [],
  meta: null
};

export function canExecute() {
  return Boolean(state.pistonConfig?.enabled && state.executionAvailable);
}
