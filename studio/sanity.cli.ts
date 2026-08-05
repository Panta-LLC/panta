import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'tdi9ql1j',
    dataset: 'pantaco',
  },
  // The hostname the original Studio was deployed to. Keep it — the site's docs
  // and SANITY-EDITS*.md all point at https://panta-co.sanity.studio/.
  studioHost: 'panta-co',
  deployment: {autoUpdates: true},
})
