// Pulse editorial (PULSE-HOME-BUILD.md §6)
import homeHero from './homeHero'
import pillar from './pillar'
import service from './service'
import post from './post'
import category from './category'
import author from './author'

// Page singletons and collections recovered from the deployed schema —
// see README.md for how, and why this directory exists.
import workPage from './workPage'
import consultationPage from './consultationPage'
import project from './project'
import client from './client'
import labeledCard from './labeledCard'
import testimonial from './testimonial'
import planPage from './planPage'
import missionPage from './missionPage'
import contactPage from './contactPage'
import practiceTeaserPage from './practiceTeaserPage'
import faqItem from './faqItem'
import homePage from './homePage'
import webStrategyPage from './webStrategyPage'
import siteSettings from './siteSettings'
import websitesPage from './websitesPage'
import aboutPage from './aboutPage'

export const schemaTypes = [
  homeHero,
  pillar,
  service,
  post,
  category,
  author,
  workPage,
  consultationPage,
  project,
  client,
  labeledCard,
  testimonial,
  planPage,
  missionPage,
  contactPage,
  practiceTeaserPage,
  faqItem,
  homePage,
  webStrategyPage,
  siteSettings,
  websitesPage,
  aboutPage,
]
