import { memoryStore } from '../src/index.js'
import { failable } from './support.js'
import { engineSuite } from './suites/engine.js'

engineSuite('memory', async () => failable(memoryStore()))
