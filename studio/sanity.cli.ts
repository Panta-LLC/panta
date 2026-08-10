import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'tdi9ql1j',
    dataset: 'pantaco',
  },
  // The hostname the original Studio was deployed to. Keep it — the site's docs
  // and SANITY-EDITS*.md all point at https://panta-co.sanity.studio/.
  studioHost: 'panta-co',
  // appId is the deployed application's id, returned by the first `sanity
  // deploy`. Without it the CLI prompts for one on every deploy, which makes
  // the command non-scriptable.
  deployment: {autoUpdates: true, appId: 'rmeeou0sh1s53tj38saui3i6'},
})
