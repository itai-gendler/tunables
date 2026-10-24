import { memoryStore } from '../src/index.js'
import { failable } from './support.js'
import { engineSuite } from './suites/engine.js'
import { scopesSuite } from './suites/scopes.js'

engineSuite('memory', async () => failable(memoryStore()))
scopesSuite('memory', async () => failable(memoryStore()))
